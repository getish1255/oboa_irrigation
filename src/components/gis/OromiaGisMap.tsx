/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Source: Google Maps Platform Code Assist & High-Resolution Satellite GIS
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { IrrigationScheme, Language, ZoneRecord } from '../../types';
import { SchemeEditorModal } from './SchemeEditorModal';
import { FloatingMapLegend, ThematicLayer } from './FloatingMapLegend';
import { SatelliteGisCanvas } from './SatelliteGisCanvas';
import {
  MapPin,
  Layers,
  Info,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Droplets,
  Wrench,
  Search,
  Plus,
  Edit3,
  Trash2,
  Globe2,
  Compass,
  Satellite,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Key,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  schemes: IrrigationScheme[];
  allSchemes?: IrrigationScheme[];
  zones?: ZoneRecord[];
  onUpdateSchemes?: (schemes: IrrigationScheme[]) => void;
  selectedSchemeFromSearch?: IrrigationScheme | null;
  lang: Language;
}

export type BackgroundMapType = 'hybrid' | 'satellite' | 'roadmap' | 'terrain';

/**
 * Validates whether a key matches the standard Google Maps JavaScript API key format.
 * Must start with 'AIza' and be at least 35 characters long.
 * Explicitly rejects GCP Project IDs (e.g. 'gen-lang-client-0472984965').
 */
export function isValidGoogleMapsKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.startsWith('gen-lang-client')) return false;
  if (trimmed.length < 32) return false;
  return trimmed.startsWith('AIza');
}

export const OromiaGisMap: React.FC<Props> = ({
  schemes,
  allSchemes,
  zones,
  onUpdateSchemes,
  selectedSchemeFromSearch,
  lang,
}) => {
  const isOromo = lang === 'om';
  const effectiveSchemes = allSchemes || schemes;

  // Layer & Background Controls
  const [activeLayer, setActiveLayer] = useState<ThematicLayer>('status');
  const [mapType, setMapType] = useState<BackgroundMapType>('hybrid');
  const [selectedScheme, setSelectedScheme] = useState<IrrigationScheme | null>(null);

  // Synchronize selection if scheme came from header global search
  useEffect(() => {
    if (selectedSchemeFromSearch) {
      setSelectedScheme(selectedSchemeFromSearch);
    }
  }, [selectedSchemeFromSearch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'functional' | 'partly_functional' | 'non_functional'>('all');
  const [waterFilter, setWaterFilter] = useState<'all' | 'adequate' | 'limited' | 'unavailable'>('all');
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);

  // Scheme Modal state (Add / Edit / Delete)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<IrrigationScheme | null>(null);
  const [clickedMapCoords, setClickedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  // API Key management & resilience against InvalidKeyMapError
  const [rawApiKey, setRawApiKey] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('user_gmaps_api_key');
      if (stored && isValidGoogleMapsKey(stored)) return stored;
    } catch {}
    const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (isValidGoogleMapsKey(envKey)) return envKey;
    return '';
  });

  const [mapsAuthError, setMapsAuthError] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInputVal, setKeyInputVal] = useState('');
  const [keyInputError, setKeyInputError] = useState('');

  // Determine if valid key is available
  const hasValidMapsKey = useMemo(() => {
    return isValidGoogleMapsKey(rawApiKey) && !mapsAuthError;
  }, [rawApiKey, mapsAuthError]);

  // Trap Google Maps auth failure callbacks to prevent unhandled fatal script errors
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Google Maps invokes window.gm_authFailure when an invalid key or quota error occurs
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[OromiaGisMap] Google Maps gm_authFailure fired: Switching to high-resolution Satellite GIS canvas.');
      setMapsAuthError(true);
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch {}
      }
    };

    // Global error listener to prevent uncaught Google Maps script errors from crashing the app
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || '';
      const src = event.filename || '';
      if (
        msg.includes('Google Maps') ||
        msg.includes('InvalidKeyMapError') ||
        src.includes('maps.googleapis.com')
      ) {
        console.warn('[OromiaGisMap] Handled Google Maps script error safely:', msg);
        setMapsAuthError(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Filtered schemes based on user queries
  const filteredSchemes = useMemo(() => {
    return effectiveSchemes.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.woreda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.zoneName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchWater = waterFilter === 'all' || s.waterAvailability === waterFilter;
      return matchSearch && matchStatus && matchWater;
    });
  }, [effectiveSchemes, searchTerm, statusFilter, waterFilter]);

  // Marker Pin Coloring Logic
  const getMarkerPinConfig = useCallback((scheme: IrrigationScheme) => {
    if (activeLayer === 'status') {
      if (scheme.status === 'functional') {
        return { background: '#10b981', borderColor: '#065f46', glyphColor: '#ffffff' }; // Green
      }
      if (scheme.status === 'partly_functional') {
        return { background: '#f59e0b', borderColor: '#b45309', glyphColor: '#ffffff' }; // Amber
      }
      return { background: '#ef4444', borderColor: '#991b1b', glyphColor: '#ffffff' }; // Red
    }

    if (activeLayer === 'water') {
      if (scheme.waterAvailability === 'adequate') {
        return { background: '#0284c7', borderColor: '#0369a1', glyphColor: '#ffffff' }; // Sky blue
      }
      if (scheme.waterAvailability === 'limited') {
        return { background: '#f97316', borderColor: '#c2410c', glyphColor: '#ffffff' }; // Orange
      }
      return { background: '#dc2626', borderColor: '#991b1b', glyphColor: '#ffffff' }; // Red
    }

    if (activeLayer === 'coverage') {
      const isLarge = scheme.actualIrrigatedWheatHa >= 5000;
      const isMed = scheme.actualIrrigatedWheatHa >= 2500;
      return {
        background: isLarge ? '#7c3aed' : isMed ? '#8b5cf6' : '#a78bfa',
        borderColor: '#4c1d95',
        glyphColor: '#ffffff',
      };
    }

    if (activeLayer === 'problems') {
      if (scheme.operationalProblem === 'None') {
        return { background: '#10b981', borderColor: '#065f46', glyphColor: '#ffffff' };
      }
      if (scheme.operationalProblem === 'Pump breakdown') {
        return { background: '#f43f5e', borderColor: '#9f1239', glyphColor: '#ffffff' };
      }
      if (scheme.operationalProblem === 'Canal damage' || scheme.operationalProblem === 'Siltation') {
        return { background: '#a855f7', borderColor: '#6b21a8', glyphColor: '#ffffff' };
      }
      return { background: '#eab308', borderColor: '#854d0e', glyphColor: '#ffffff' };
    }

    return { background: '#10b981', borderColor: '#065f46', glyphColor: '#ffffff' };
  }, [activeLayer]);

  // Map Click Handler (for location picking)
  const handleMapClick = useCallback((e: any) => {
    let lat: number | undefined;
    let lng: number | undefined;

    if (e.detail?.latLng) {
      lat = e.detail.latLng.lat;
      lng = e.detail.latLng.lng;
    } else if (typeof e.lat === 'number' && typeof e.lng === 'number') {
      lat = e.lat;
      lng = e.lng;
    }

    if (lat !== undefined && lng !== undefined) {
      setClickedMapCoords({ lat, lng });

      if (isPickingLocation) {
        setEditingScheme(prev => (prev ? { ...prev, lat: lat!, lng: lng! } : null));
        setIsPickingLocation(false);
        setIsModalOpen(true);
      }
    }
  }, [isPickingLocation]);

  // CRUD Handlers
  const handleOpenAddModal = () => {
    setEditingScheme(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (scheme: IrrigationScheme) => {
    setEditingScheme(scheme);
    setIsModalOpen(true);
  };

  const handleSaveScheme = (scheme: IrrigationScheme) => {
    if (!onUpdateSchemes) return;
    const exists = effectiveSchemes.some(s => s.id === scheme.id);
    let updated: IrrigationScheme[];
    if (exists) {
      updated = effectiveSchemes.map(s => (s.id === scheme.id ? scheme : s));
    } else {
      updated = [scheme, ...effectiveSchemes];
    }
    onUpdateSchemes(updated);
    setSelectedScheme(scheme);
  };

  const handleDeleteScheme = (schemeId: string) => {
    if (!onUpdateSchemes) return;
    const updated = effectiveSchemes.filter(s => s.id !== schemeId);
    onUpdateSchemes(updated);
    if (selectedScheme?.id === schemeId) {
      setSelectedScheme(null);
    }
  };

  // Custom Key Save / Clear
  const handleSaveCustomKey = () => {
    const trimmed = keyInputVal.trim();
    if (!trimmed) {
      setKeyInputError('Please enter an API Key');
      return;
    }
    if (trimmed.startsWith('gen-lang-client')) {
      setKeyInputError(
        'The value starting with "gen-lang-client-" is a Google Cloud Project ID, not a Google Maps API Key. Maps keys start with "AIzaSy...".'
      );
      return;
    }
    if (!trimmed.startsWith('AIza') || trimmed.length < 32) {
      setKeyInputError('Google Maps API Keys must start with "AIza" and be at least 35 characters long.');
      return;
    }

    try {
      localStorage.setItem('user_gmaps_api_key', trimmed);
    } catch {}
    setRawApiKey(trimmed);
    setMapsAuthError(false);
    setIsKeyModalOpen(false);
    setKeyInputError('');
  };

  const handleResetToSatelliteCanvas = () => {
    try {
      localStorage.removeItem('user_gmaps_api_key');
    } catch {}
    setRawApiKey('');
    setMapsAuthError(false);
    setIsKeyModalOpen(false);
    setKeyInputError('');
  };

  // Overall Statistics
  const totalCommandHa = useMemo(() => effectiveSchemes.reduce((acc, s) => acc + (s.commandAreaHa || 0), 0), [effectiveSchemes]);
  const totalIrrigatedHa = useMemo(() => effectiveSchemes.reduce((acc, s) => acc + (s.actualIrrigatedWheatHa || 0), 0), [effectiveSchemes]);
  const functionalCount = useMemo(() => effectiveSchemes.filter(s => s.status === 'functional').length, [effectiveSchemes]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Satellite className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isOromo ? 'Kaartaa GIS Iskiimota Jallisii Oromiyaa (Google Earth & Satellite)' : 'Oromia Irrigation Schemes GIS Map (Google Earth & Satellite)'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isOromo
              ? 'Wabiin bishaanii, paampiiwwan, haala hojii fi lafa qamadii jallisii kaartaa Google Earth/Satellite irratti'
              : 'Interactive Google Earth satellite & GIS map view of Oromia wheat irrigation schemes, water adequacy & functional assets'}
          </p>
        </div>

        {/* Action Buttons: Add Scheme, Table View, Key Settings */}
        <div className="flex flex-wrap items-center gap-2">
          {onUpdateSchemes && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isOromo ? 'Iskiimii Haaraa Galchi' : 'Add Irrigation Scheme'}</span>
            </button>
          )}

          <button
            onClick={() => setIsTableViewOpen(!isTableViewOpen)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isTableViewOpen
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{isTableViewOpen ? (isOromo ? 'Kaartaatti Deebi\'i' : 'Hide Scheme Table') : (isOromo ? 'Gabatee Iskiimotaa' : 'Manage Schemes Table')}</span>
          </button>

          <button
            onClick={() => {
              setKeyInputVal(rawApiKey || '');
              setKeyInputError('');
              setIsKeyModalOpen(true);
            }}
            className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              hasValidMapsKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title="Configure Google Earth / Google Maps API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasValidMapsKey ? 'Google Earth Active' : 'GIS Satellite Active'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            {isOromo ? 'Iskiimota Waliigalaa' : 'Total Schemes'}
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
            {effectiveSchemes.length}
          </span>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">
            {isOromo ? 'Hojiirra Kan Jiran (Functional)' : 'Fully Functional'}
          </span>
          <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {functionalCount} <span className="text-xs font-normal">({((functionalCount / (effectiveSchemes.length || 1)) * 100).toFixed(0)}%)</span>
          </span>
        </div>
        <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800/40">
          <span className="text-[11px] text-sky-700 dark:text-sky-400 block font-medium">
            {isOromo ? 'Qamadii Jallisii (Wheat Ha)' : 'Irrigated Wheat Area'}
          </span>
          <span className="text-lg font-bold font-mono text-sky-700 dark:text-sky-400">
            {totalIrrigatedHa.toLocaleString()} ha
          </span>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">
            {isOromo ? 'Bal\'ina Command (Ha)' : 'Command Capacity'}
          </span>
          <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400">
            {totalCommandHa.toLocaleString()} ha
          </span>
        </div>
      </div>

      {/* Control Strip: Background Imagery + Thematic Layers + Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* Left: Background Layer Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            {isOromo ? 'Baqqaana Kaartaa:' : 'Map Style:'}
          </span>
          {[
            { id: 'hybrid', label: '🛰️ Google Earth / Hybrid' },
            { id: 'satellite', label: '🌍 Satellite Pure' },
            { id: 'terrain', label: '🏔️ Terrain' },
            { id: 'roadmap', label: '🗺️ Roadmap' },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setMapType(type.id as BackgroundMapType)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                mapType === type.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Center: Thematic Data Layer */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            {isOromo ? 'Agarsiisa:' : 'Layer:'}
          </span>
          {[
            { id: 'status', label: isOromo ? 'Haala (🟢🟡🔴)' : 'Status (🟢🟡🔴)' },
            { id: 'water', label: isOromo ? 'Wabi Bishaanii' : 'Water Supply' },
            { id: 'coverage', label: isOromo ? 'Uwwisa (ha)' : 'Acreage (ha)' },
            { id: 'problems', label: isOromo ? 'Rakkoolee' : 'Issues' },
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as ThematicLayer)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeLayer === layer.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isOromo ? 'Iskiimii, Aanaa...' : 'Search scheme, woreda...'}
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">{isOromo ? 'Haala Hunda' : 'All Status'}</option>
            <option value="functional">🟢 {isOromo ? 'Hojiirra' : 'Functional'}</option>
            <option value="partly_functional">🟡 {isOromo ? 'Gartokkeen' : 'Partly'}</option>
            <option value="non_functional">🔴 {isOromo ? 'Dhaabbate' : 'Non-Func'}</option>
          </select>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950">
        {hasValidMapsKey ? (
          <APIProvider
            apiKey={rawApiKey}
            onError={() => {
              console.warn('[OromiaGisMap] APIProvider onError fired. Falling back to Satellite GIS canvas.');
              setMapsAuthError(true);
            }}
          >
            <Map
              defaultCenter={{ lat: 8.54, lng: 39.27 }}
              defaultZoom={7.4}
              mapTypeId={mapType}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              onClick={handleMapClick}
              className="w-full h-full"
            >
              {filteredSchemes.map(scheme => {
                const pinConfig = getMarkerPinConfig(scheme);
                const isSelected = selectedScheme?.id === scheme.id;

                return (
                  <AdvancedMarker
                    key={scheme.id}
                    position={{ lat: scheme.lat, lng: scheme.lng }}
                    onClick={() => setSelectedScheme(scheme)}
                    title={`${scheme.name} (${scheme.woreda})`}
                  >
                    <Pin
                      background={pinConfig.background}
                      borderColor={isSelected ? '#ffffff' : pinConfig.borderColor}
                      glyphColor={pinConfig.glyphColor}
                      scale={isSelected ? 1.3 : 1.05}
                    />
                  </AdvancedMarker>
                );
              })}

              {/* InfoWindow for Selected Scheme */}
              {selectedScheme && (
                <InfoWindow
                  position={{ lat: selectedScheme.lat, lng: selectedScheme.lng }}
                  onCloseClick={() => setSelectedScheme(null)}
                >
                  <div className="p-2 min-w-[260px] max-w-[320px] text-slate-900 font-sans space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b pb-1.5">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {selectedScheme.name}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {selectedScheme.woreda} · {selectedScheme.zoneName}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          selectedScheme.status === 'functional'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedScheme.status === 'partly_functional'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedScheme.status === 'functional'
                          ? '🟢 Functional'
                          : selectedScheme.status === 'partly_functional'
                          ? '🟡 Partly Functional'
                          : '🔴 Non-Functional'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Command Area</span>
                        <strong className="font-mono text-emerald-700">{selectedScheme.commandAreaHa.toLocaleString()} ha</strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Irrigated Wheat</span>
                        <strong className="font-mono text-sky-700">{selectedScheme.actualIrrigatedWheatHa.toLocaleString()} ha</strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Water Source</span>
                        <strong className="text-slate-800">{selectedScheme.waterSource} ({selectedScheme.method})</strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Pumps (Func/Tot)</span>
                        <strong className="font-mono text-slate-800">{selectedScheme.pumpsFunctional} / {selectedScheme.pumpsTotal}</strong>
                      </div>
                    </div>

                    {selectedScheme.operationalProblem !== 'None' && (
                      <div className="p-1.5 rounded bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>Issue:</strong> {selectedScheme.operationalProblem}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t">
                      <span>Beneficiaries: <strong>{selectedScheme.beneficiariesCount?.toLocaleString()} HH</strong></span>
                      <span className="font-mono text-[10px]">{selectedScheme.lat.toFixed(3)}°N, {selectedScheme.lng.toFixed(3)}°E</span>
                    </div>

                    {onUpdateSchemes && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleOpenEditModal(selectedScheme)}
                          className="flex-1 py-1 px-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Scheme</span>
                        </button>
                        <button
                          onClick={() => handleDeleteScheme(selectedScheme.id)}
                          className="py-1 px-2 text-xs font-semibold rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                          title="Delete this scheme"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          <SatelliteGisCanvas
            schemes={effectiveSchemes}
            filteredSchemes={filteredSchemes}
            selectedScheme={selectedScheme}
            onSelectScheme={setSelectedScheme}
            activeLayer={activeLayer}
            mapType={mapType}
            isPickingLocation={isPickingLocation}
            onMapClick={handleMapClick}
            onOpenEditModal={handleOpenEditModal}
            onDeleteScheme={handleDeleteScheme}
            onUpdateSchemes={onUpdateSchemes}
            lang={lang}
            getMarkerPinConfig={getMarkerPinConfig}
          />
        )}

        {/* Floating Interactive Legend Control */}
        <FloatingMapLegend
          activeLayer={activeLayer}
          onSelectLayer={setActiveLayer}
          schemes={effectiveSchemes}
          filteredCount={filteredSchemes.length}
          zones={zones}
          lang={lang}
          selectedStatusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
          selectedWaterFilter={waterFilter}
          onSelectWaterFilter={setWaterFilter}
        />
      </div>

      {/* Expandable Interactive Schemes Table */}
      {isTableViewOpen && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <span>{isOromo ? 'Gabatee Guutuu Iskiimota Jallisii Oromiyaa' : 'Complete Oromia Irrigation Schemes Inventory'}</span>
            </h3>
            <span className="text-xs text-slate-500">
              {filteredSchemes.length} {isOromo ? 'iskiimota mul\'atan' : 'schemes found'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[420px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">{isOromo ? 'Iskiimii' : 'Scheme Name'}</th>
                  <th className="p-2.5">{isOromo ? 'Godina' : 'Zone'}</th>
                  <th className="p-2.5">{isOromo ? 'Aanaa' : 'Woreda'}</th>
                  <th className="p-2.5">{isOromo ? 'GPS (Lat, Lng)' : 'Coordinates'}</th>
                  <th className="p-2.5 text-right">{isOromo ? 'Command (ha)' : 'Command (ha)'}</th>
                  <th className="p-2.5 text-right">{isOromo ? 'Qamadii (ha)' : 'Wheat (ha)'}</th>
                  <th className="p-2.5">{isOromo ? 'Haala' : 'Status'}</th>
                  <th className="p-2.5">{isOromo ? 'Wabi Bishaanii' : 'Water Supply'}</th>
                  <th className="p-2.5">{isOromo ? 'Madda' : 'Source'}</th>
                  <th className="p-2.5 text-center">{isOromo ? 'Paampii' : 'Pumps'}</th>
                  <th className="p-2.5">{isOromo ? 'Rakkoo' : 'Issue'}</th>
                  {onUpdateSchemes && <th className="p-2.5 text-right">{isOromo ? 'Tarkaanfii' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredSchemes.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      selectedScheme?.id === s.id ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                      <button
                        onClick={() => setSelectedScheme(s)}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 text-left cursor-pointer"
                      >
                        {s.name}
                      </button>
                    </td>
                    <td className="p-2.5">{s.zoneName}</td>
                    <td className="p-2.5">{s.woreda}</td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-500">
                      {s.lat.toFixed(2)}, {s.lng.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-mono">{s.commandAreaHa.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {s.actualIrrigatedWheatHa.toLocaleString()}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'functional'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : s.status === 'partly_functional'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {s.status === 'functional'
                          ? 'Functional'
                          : s.status === 'partly_functional'
                          ? 'Partly'
                          : 'Non-Functional'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="capitalize text-[11px] font-medium">{s.waterAvailability}</span>
                    </td>
                    <td className="p-2.5 text-[11px]">{s.waterSource} ({s.method})</td>
                    <td className="p-2.5 text-center font-mono text-[11px]">
                      {s.pumpsFunctional} / {s.pumpsTotal}
                    </td>
                    <td className="p-2.5 text-[11px]">
                      {s.operationalProblem === 'None' ? (
                        <span className="text-slate-400">None</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{s.operationalProblem}</span>
                      )}
                    </td>
                    {onUpdateSchemes && (
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            title="Edit scheme"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteScheme(s.id)}
                            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 cursor-pointer"
                            title="Delete scheme"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheme Editor Modal (Add/Edit) */}
      <SchemeEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveScheme}
        onDelete={handleDeleteScheme}
        initialScheme={editingScheme}
        zones={zones}
        lang={lang}
        defaultCoords={clickedMapCoords}
      />

      {/* Optional Google Earth API Key Setup Modal */}
      {isKeyModalOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setIsKeyModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Google Earth & Maps API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                The map currently operates in <strong>High-Resolution Satellite GIS Canvas</strong> mode using Esri World Imagery (satellite photos of Ethiopia & Oromia) with full scheme markers, layer analysis, and editing.
              </p>
              <p>
                To enable Google Earth tiles dynamically, provide a valid Google Maps API Key starting with <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-emerald-600">AIzaSy...</code>.
              </p>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Important:</strong> Google Cloud Project IDs (e.g. <code>gen-lang-client-...</code>) are not Maps API keys and will be rejected by Google Maps with <code>InvalidKeyMapError</code>.
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Google Maps API Key (AIzaSy...)
              </label>
              <input
                type="text"
                value={keyInputVal}
                onChange={e => {
                  setKeyInputVal(e.target.value);
                  setKeyInputError('');
                }}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {keyInputError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {keyInputError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetToSatelliteCanvas}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Use Satellite Canvas
              </button>
              <button
                type="button"
                onClick={handleSaveCustomKey}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer transition-colors"
              >
                Apply Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
