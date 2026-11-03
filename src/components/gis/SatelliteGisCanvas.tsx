/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { IrrigationScheme, Language } from '../../types';
import { ThematicLayer } from './FloatingMapLegend';
import {
  Plus,
  Minus,
  RotateCcw,
  MapPin,
  AlertTriangle,
  Edit3,
  Trash2,
  X,
  Droplets,
  Layers,
  Crosshair,
  ExternalLink,
} from 'lucide-react';

interface Props {
  schemes: IrrigationScheme[];
  filteredSchemes: IrrigationScheme[];
  selectedScheme: IrrigationScheme | null;
  onSelectScheme: (scheme: IrrigationScheme | null) => void;
  activeLayer: ThematicLayer;
  mapType: 'hybrid' | 'satellite' | 'terrain' | 'roadmap';
  isPickingLocation: boolean;
  onMapClick: (coords: { lat: number; lng: number }) => void;
  onOpenEditModal: (scheme: IrrigationScheme) => void;
  onDeleteScheme: (schemeId: string) => void;
  onUpdateSchemes?: (schemes: IrrigationScheme[]) => void;
  lang: Language;
  getMarkerPinConfig: (scheme: IrrigationScheme) => {
    background: string;
    borderColor: string;
    glyphColor: string;
  };
}

// Slippy Map Math (Web Mercator EPSG:3857)
function latLngToWorld(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = n * ((lng + 180) / 360);
  const latRad = (lat * Math.PI) / 180;
  const y = (n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2;
  return { x: x * 256, y: y * 256 };
}

function worldToLatLng(worldX: number, worldY: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = ((worldX / 256) / n) * 360 - 180;
  const nY = Math.PI - (2 * Math.PI * (worldY / 256)) / n;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nY) - Math.exp(-nY)));
  return { lat, lng };
}

export const SatelliteGisCanvas: React.FC<Props> = ({
  filteredSchemes,
  selectedScheme,
  onSelectScheme,
  activeLayer,
  mapType,
  isPickingLocation,
  onMapClick,
  onOpenEditModal,
  onDeleteScheme,
  onUpdateSchemes,
  lang,
  getMarkerPinConfig,
}) => {
  const isOromo = lang === 'om';
  const containerRef = useRef<HTMLDivElement>(null);

  // Center on Oromia, Ethiopia (lat: 8.54, lng: 39.27, zoom: 7)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 8.54, lng: 39.27 });
  const [zoom, setZoom] = useState<number>(7.4);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 1000, height: 620 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredScheme, setHoveredScheme] = useState<IrrigationScheme | null>(null);

  // Synchronize container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 620,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // When selected scheme changes, center smoothly on it
  useEffect(() => {
    if (selectedScheme) {
      setCenter({ lat: selectedScheme.lat, lng: selectedScheme.lng });
      if (zoom < 8.5) setZoom(9);
    }
  }, [selectedScheme]);

  // World center coordinates
  const centerWorld = useMemo(() => {
    return latLngToWorld(center.lat, center.lng, zoom);
  }, [center.lat, center.lng, zoom]);

  // Project lat/lng to container pixel coordinates
  const project = useCallback((lat: number, lng: number) => {
    const world = latLngToWorld(lat, lng, zoom);
    const px = dimensions.width / 2 + (world.x - centerWorld.x);
    const py = dimensions.height / 2 + (world.y - centerWorld.y);
    return { px, py };
  }, [centerWorld, dimensions, zoom]);

  // Inverse projection: container pixels to lat/lng
  const unproject = useCallback((px: number, py: number) => {
    const worldX = centerWorld.x + (px - dimensions.width / 2);
    const worldY = centerWorld.y + (py - dimensions.height / 2);
    return worldToLatLng(worldX, worldY, zoom);
  }, [centerWorld, dimensions, zoom]);

  // Tile source URL generator
  const getTileUrl = useCallback((x: number, y: number, z: number) => {
    if (mapType === 'satellite' || mapType === 'hybrid') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    if (mapType === 'terrain') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
    }
    // Default / roadmap
    const sub = ['a', 'b', 'c'][Math.abs(x + y) % 3];
    return `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }, [mapType]);

  // Calculate visible tiles
  const visibleTiles = useMemo(() => {
    const intZoom = Math.floor(zoom);
    const scale = Math.pow(2, zoom - intZoom);
    const tileSize = 256 * scale;

    const minX = centerWorld.x - dimensions.width / 2;
    const maxX = centerWorld.x + dimensions.width / 2;
    const minY = centerWorld.y - dimensions.height / 2;
    const maxY = centerWorld.y + dimensions.height / 2;

    const startCol = Math.floor(minX / tileSize);
    const endCol = Math.floor(maxX / tileSize);
    const startRow = Math.floor(minY / tileSize);
    const endRow = Math.floor(maxY / tileSize);

    const maxTile = Math.pow(2, intZoom);
    const tiles: Array<{ key: string; x: number; y: number; z: number; left: number; top: number; size: number }> = [];

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        if (r < 0 || r >= maxTile) continue;
        const normalizedC = ((c % maxTile) + maxTile) % maxTile;
        const left = dimensions.width / 2 + (c * tileSize - centerWorld.x);
        const top = dimensions.height / 2 + (r * tileSize - centerWorld.y);

        tiles.push({
          key: `${intZoom}-${normalizedC}-${r}`,
          x: normalizedC,
          y: r,
          z: intZoom,
          left,
          top,
          size: tileSize,
        });
      }
    }
    return tiles;
  }, [centerWorld, dimensions, zoom]);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setHoveredCoords(unproject(px, py));
    }

    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Shift center by delta
    const currentWorld = latLngToWorld(center.lat, center.lng, zoom);
    const newWorldX = currentWorld.x - dx;
    const newWorldY = currentWorld.y - dy;
    const newLatLng = worldToLatLng(newWorldX, newWorldY, zoom);

    // Clamp within Ethiopia bounds
    const clampedLat = Math.max(3.0, Math.min(15.0, newLatLng.lat));
    const clampedLng = Math.max(33.0, Math.min(48.0, newLatLng.lng));

    setCenter({ lat: clampedLat, lng: clampedLng });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.35 : -0.35;
    setZoom(prev => Math.min(14, Math.max(5.5, prev + zoomFactor)));
  };

  // Click on map canvas
  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const coords = unproject(px, py);

    if (isPickingLocation) {
      onMapClick(coords);
    }
  };

  const resetView = () => {
    setCenter({ lat: 8.54, lng: 39.27 });
    setZoom(7.4);
    onSelectScheme(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      className={`relative w-full h-full select-none overflow-hidden bg-slate-950 ${
        isPickingLocation ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Tile Layer (Esri Satellite / OSM / Topo) */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleTiles.map(tile => (
          <img
            key={tile.key}
            src={getTileUrl(tile.x, tile.y, tile.z)}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: `${tile.size + 1}px`,
              height: `${tile.size + 1}px`,
              imageRendering: 'auto',
            }}
            className="transition-opacity duration-200"
            onError={e => {
              // Hide broken tile silently
              (e.target as HTMLElement).style.opacity = '0';
            }}
          />
        ))}
      </div>

      {/* Grid Overlay / Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/35" />

      {/* Picking Location Notice Bar */}
      {isPickingLocation && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4" />
          <span>{isOromo ? 'Kaartaa irratti bakka iskiimii cuqaasi' : 'Click anywhere on map to set scheme GPS location'}</span>
        </div>
      )}

      {/* Map Control Buttons: Zoom In, Zoom Out, Reset, Mode Badge */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            setZoom(prev => Math.min(14, prev + 0.5));
          }}
          className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            setZoom(prev => Math.max(5.5, prev - 0.5));
          }}
          className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            resetView();
          }}
          className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          title={isOromo ? 'Kaartaa Giddu-galeessatti Deebisi' : 'Reset View to Oromia Center'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Scheme Markers */}
      <div className="absolute inset-0 pointer-events-none">
        {filteredSchemes.map(scheme => {
          const { px, py } = project(scheme.lat, scheme.lng);
          // Don't render markers far outside screen
          if (px < -60 || px > dimensions.width + 60 || py < -60 || py > dimensions.height + 60) {
            return null;
          }

          const pinConfig = getMarkerPinConfig(scheme);
          const isSelected = selectedScheme?.id === scheme.id;
          const isHovered = hoveredScheme?.id === scheme.id;

          return (
            <div
              key={scheme.id}
              onClick={e => {
                e.stopPropagation();
                onSelectScheme(scheme);
              }}
              onMouseEnter={() => setHoveredScheme(scheme)}
              onMouseLeave={() => setHoveredScheme(null)}
              style={{
                position: 'absolute',
                left: `${px}px`,
                top: `${py}px`,
                transform: `translate(-50%, -100%) scale(${isSelected ? 1.25 : isHovered ? 1.15 : 1})`,
                transition: 'transform 0.15s ease-out',
                zIndex: isSelected ? 30 : isHovered ? 25 : 10,
              }}
              className="pointer-events-auto cursor-pointer group"
            >
              {/* Selected Scheme Pulsing Halo */}
              {isSelected && (
                <div
                  className="absolute -inset-3 rounded-full animate-ping opacity-60 pointer-events-none"
                  style={{ backgroundColor: pinConfig.background }}
                />
              )}

              {/* Pin Graphics */}
              <div
                className="relative flex flex-col items-center drop-shadow-md"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform"
                  style={{
                    backgroundColor: pinConfig.background,
                    borderColor: isSelected ? '#ffffff' : pinConfig.borderColor,
                    color: pinConfig.glyphColor,
                  }}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                </div>

                {/* Pin Tip Triangle */}
                <div
                  className="w-0 h-0 border-x-4 border-x-transparent border-t-[6px] -mt-0.5"
                  style={{ borderTopColor: pinConfig.background }}
                />

                {/* Ground Shadow Pin Point */}
                <div className="w-2 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5" />

                {/* Minimal Label on Hover */}
                {(isHovered || isSelected) && (
                  <div className="absolute bottom-full mb-1 px-2 py-0.5 bg-slate-900/90 text-white rounded text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none border border-slate-700">
                    {scheme.name} ({scheme.actualIrrigatedWheatHa} ha)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* InfoWindow Popup for Selected Scheme */}
      {selectedScheme && (() => {
        const { px, py } = project(selectedScheme.lat, selectedScheme.lng);
        // Anchor slightly above marker
        const popupX = Math.max(160, Math.min(dimensions.width - 160, px));
        const popupY = Math.max(120, py - 35);

        return (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: `${popupX}px`,
              top: `${popupY}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 40,
            }}
            className="w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {selectedScheme.name}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {selectedScheme.woreda} · {selectedScheme.zoneName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectScheme(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Pill */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedScheme.status === 'functional'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : selectedScheme.status === 'partly_functional'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {selectedScheme.status === 'functional'
                  ? '🟢 Functional'
                  : selectedScheme.status === 'partly_functional'
                  ? '🟡 Partly Functional'
                  : '🔴 Non-Functional'}
              </span>

              <span className="text-[10px] font-mono text-slate-500">
                {selectedScheme.lat.toFixed(3)}°N, {selectedScheme.lng.toFixed(3)}°E
              </span>
            </div>

            {/* 4-Cell Metric Grid */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Command Area</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedScheme.commandAreaHa.toLocaleString()} ha
                </strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Irrigated Wheat</span>
                <strong className="font-mono text-sky-600 dark:text-sky-400">
                  {selectedScheme.actualIrrigatedWheatHa.toLocaleString()} ha
                </strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Water Source</span>
                <strong className="text-slate-800 dark:text-slate-200 truncate block">
                  {selectedScheme.waterSource} ({selectedScheme.method})
                </strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Pumps (Func/Tot)</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedScheme.pumpsFunctional} / {selectedScheme.pumpsTotal}
                </strong>
              </div>
            </div>

            {/* Operational Issues Alert */}
            {selectedScheme.operationalProblem !== 'None' && (
              <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>
                  <strong>Issue:</strong> {selectedScheme.operationalProblem}
                </span>
              </div>
            )}

            {/* Beneficiaries Strip */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Beneficiaries: <strong className="text-slate-800 dark:text-slate-200">{selectedScheme.beneficiariesCount?.toLocaleString()} HH</strong>
            </div>

            {/* Actions: Edit & Delete */}
            {onUpdateSchemes && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onOpenEditModal(selectedScheme)}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isOromo ? 'Gulaali' : 'Edit Scheme'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteScheme(selectedScheme.id)}
                  className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 cursor-pointer transition-colors"
                  title="Delete this scheme"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Coordinate & Imagery Status Footer */}
      <div className="absolute bottom-2 left-3 z-20 pointer-events-none flex items-center gap-2 text-[10px] font-mono text-white/90 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 shadow">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {mapType === 'satellite' || mapType === 'hybrid'
            ? 'Esri World Satellite Imagery'
            : mapType === 'terrain'
            ? 'Esri World Topo Map'
            : 'OpenStreetMap Tiles'}
        </span>
        <span className="text-slate-400">|</span>
        <span>
          {hoveredCoords
            ? `${hoveredCoords.lat.toFixed(4)}°N, ${hoveredCoords.lng.toFixed(4)}°E`
            : `${center.lat.toFixed(2)}°N, ${center.lng.toFixed(2)}°E`}
        </span>
        <span className="text-slate-400">|</span>
        <span>Zoom {zoom.toFixed(1)}x</span>
      </div>
    </div>
  );
};
