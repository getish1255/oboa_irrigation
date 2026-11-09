/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { OROMIA_ZONE_BOUNDARIES, OROMIA_REGIONAL_OUTLINE, ZoneBoundary } from '../../data/oromiaBoundaries';
import { Language } from '../../types';

declare const google: any;

interface Props {
  isVisible: boolean;
  opacity?: number;
  showLabels?: boolean;
  onSelectZoneBoundary?: (zone: ZoneBoundary | null) => void;
  lang: Language;
}

export const GoogleMapsZoneOverlay: React.FC<Props> = ({
  isVisible,
  opacity = 0.15,
  showLabels = true,
  onSelectZoneBoundary,
  lang,
}) => {
  const map = useMap();
  const polygonsRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const regionalPolygonRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up existing polygons & markers
    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (regionalPolygonRef.current) {
      regionalPolygonRef.current.setMap(null);
      regionalPolygonRef.current = null;
    }

    if (!isVisible) return;

    // 1. Regional Outer Boundary Line (Dashed White/Emerald)
    const regionalPoly = new google.maps.Polygon({
      paths: OROMIA_REGIONAL_OUTLINE,
      strokeColor: '#10b981',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: '#10b981',
      fillOpacity: 0.04,
      map,
      zIndex: 1,
      clickable: false,
    });
    regionalPolygonRef.current = regionalPoly;

    // 2. Individual Administrative Zone Boundaries (Transparent Overlays)
    OROMIA_ZONE_BOUNDARIES.forEach((zone) => {
      const polygon = new google.maps.Polygon({
        paths: zone.coordinates,
        strokeColor: zone.color,
        strokeOpacity: 0.85,
        strokeWeight: 1.8,
        fillColor: zone.color,
        fillOpacity: opacity,
        map,
        zIndex: 2,
        clickable: true,
      });

      // Mouseover highlight
      polygon.addListener('mouseover', () => {
        polygon.setOptions({
          fillOpacity: Math.min(0.35, opacity + 0.15),
          strokeWeight: 3,
        });
        if (onSelectZoneBoundary) onSelectZoneBoundary(zone);
      });

      polygon.addListener('mouseout', () => {
        polygon.setOptions({
          fillOpacity: opacity,
          strokeWeight: 1.8,
        });
        if (onSelectZoneBoundary) onSelectZoneBoundary(null);
      });

      polygon.addListener('click', () => {
        if (onSelectZoneBoundary) onSelectZoneBoundary(zone);
      });

      polygonsRef.current.push(polygon);

      // 3. Zone Center Label Marker
      if (showLabels && typeof google !== 'undefined' && google?.maps) {
        const labelText = lang === 'om' ? zone.nameOm : zone.nameEn;
        const marker = new google.maps.Marker({
          position: zone.center,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0, // invisible anchor, only text label shows
          },
          label: {
            text: `${zone.code} · ${labelText}`,
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            className: 'gmaps-zone-boundary-label',
          },
          zIndex: 3,
          clickable: false,
        });
        markersRef.current.push(marker);
      }
    });

    return () => {
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (regionalPolygonRef.current) {
        regionalPolygonRef.current.setMap(null);
        regionalPolygonRef.current = null;
      }
    };
  }, [map, isVisible, opacity, showLabels, lang, onSelectZoneBoundary]);

  return null;
};
