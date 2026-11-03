/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { IrrigationScheme, Language, ZoneRecord } from '../../types';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Wheat,
  Globe2,
  Sparkles,
  Filter,
  BarChart3,
  Compass,
} from 'lucide-react';

export type ThematicLayer = 'status' | 'water' | 'coverage' | 'problems';

interface FloatingMapLegendProps {
  activeLayer: ThematicLayer;
  onSelectLayer: (layer: ThematicLayer) => void;
  schemes: IrrigationScheme[];
  filteredCount: number;
  zones?: ZoneRecord[];
  lang: Language;
  selectedStatusFilter: 'all' | 'functional' | 'partly_functional' | 'non_functional';
  onSelectStatusFilter: (status: 'all' | 'functional' | 'partly_functional' | 'non_functional') => void;
  selectedWaterFilter: 'all' | 'adequate' | 'limited' | 'unavailable';
  onSelectWaterFilter: (water: 'all' | 'adequate' | 'limited' | 'unavailable') => void;
}

export const FloatingMapLegend: React.FC<FloatingMapLegendProps> = ({
  activeLayer,
  onSelectLayer,
  schemes,
  filteredCount,
  zones = [],
  lang,
  selectedStatusFilter,
  onSelectStatusFilter,
  selectedWaterFilter,
  onSelectWaterFilter,
}) => {
  const isOromo = lang === 'om';
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'markers' | 'regions' | 'guide'>('markers');

  // Compute live scheme breakdown counts
  const markerCounts = useMemo(() => {
    const total = schemes.length || 1;
    const statusCounts = {
      functional: schemes.filter(s => s.status === 'functional').length,
      partly_functional: schemes.filter(s => s.status === 'partly_functional').length,
      non_functional: schemes.filter(s => s.status === 'non_functional').length,
    };

    const waterCounts = {
      adequate: schemes.filter(s => s.waterAvailability === 'adequate').length,
      limited: schemes.filter(s => s.waterAvailability === 'limited').length,
      unavailable: schemes.filter(s => s.waterAvailability === 'unavailable').length,
    };

    const coverageCounts = {
      large: schemes.filter(s => (s.actualIrrigatedWheatHa || 0) >= 5000).length,
      medium: schemes.filter(s => (s.actualIrrigatedWheatHa || 0) >= 2500 && (s.actualIrrigatedWheatHa || 0) < 5000).length,
      small: schemes.filter(s => (s.actualIrrigatedWheatHa || 0) < 2500).length,
    };

    const problemCounts = {
      none: schemes.filter(s => s.operationalProblem === 'None').length,
      pump: schemes.filter(s => s.operationalProblem === 'Pump breakdown').length,
      canal: schemes.filter(s => s.operationalProblem === 'Canal damage' || s.operationalProblem === 'Siltation').length,
      other: schemes.filter(s => s.operationalProblem !== 'None' && s.operationalProblem !== 'Pump breakdown' && s.operationalProblem !== 'Canal damage' && s.operationalProblem !== 'Siltation').length,
    };

    return { total, statusCounts, waterCounts, coverageCounts, problemCounts };
  }, [schemes]);

  // Compute Regional Agro-Ecological Tier Breakdown
  const regionTiers = useMemo(() => {
    // 1. High-Potential Highland Wheat Hubs (Surplus Belts)
    const tier1Keywords = ['arsi', 'baale', 'bale', 'shawaa bahaa', 'east shewa', 'shawaa dhihaa', 'west shewa', 'shawaa kaabaa', 'north shewa'];
    // 2. Mid-Altitude River Basin Expansion Hubs (Moist Valleys)
    const tier2Keywords = ['kibba lixaa', 'south west shewa', 'jimma', 'iluu', 'buno', 'bedelle', 'baddallee', 'gujii', 'guji'];
    // 3. Lowland Pastoral & Agro-Pastoral River Valleys
    const tier3Keywords = ['boorana', 'borana', 'harargee', 'hararghe', 'wallagga', 'welega', 'wollege', 'qellem', 'kelem', 'horo', 'guduru'];

    const getTier = (zoneName: string) => {
      const lower = zoneName.toLowerCase();
      if (tier1Keywords.some(kw => lower.includes(kw))) return 1;
      if (tier2Keywords.some(kw => lower.includes(kw))) return 2;
      return 3;
    };

    const t1Zones = zones.filter(z => getTier(z.name || z.nameEn) === 1);
    const t2Zones = zones.filter(z => getTier(z.name || z.nameEn) === 2);
    const t3Zones = zones.filter(z => getTier(z.name || z.nameEn) === 3);

    const sumT1Planned = t1Zones.reduce((acc, z) => acc + (z.plannedAreaHa || 0), 0);
    const sumT1Sown = t1Zones.reduce((acc, z) => acc + (z.sownAreaHa || 0), 0);

    const sumT2Planned = t2Zones.reduce((acc, z) => acc + (z.plannedAreaHa || 0), 0);
    const sumT2Sown = t2Zones.reduce((acc, z) => acc + (z.sownAreaHa || 0), 0);

    const sumT3Planned = t3Zones.reduce((acc, z) => acc + (z.plannedAreaHa || 0), 0);
    const sumT3Sown = t3Zones.reduce((acc, z) => acc + (z.sownAreaHa || 0), 0);

    // Count schemes located in each tier
    const t1Schemes = schemes.filter(s => getTier(s.zoneName) === 1).length;
    const t2Schemes = schemes.filter(s => getTier(s.zoneName) === 2).length;
    const t3Schemes = schemes.filter(s => getTier(s.zoneName) === 3).length;

    return {
      t1: {
        id: 'tier1',
        titleEn: 'Highland Wheat Surplus Hubs',
        titleOm: 'Kilaastera Dabalataa Tulluuwwanii',
        badgeEn: 'Major Hubs (>100k ha)',
        badgeOm: 'Hub Gurguddaa (>100k ha)',
        color: '#10b981', // Emerald
        bgClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        ringColor: 'ring-emerald-500',
        dotColor: 'bg-emerald-500',
        zonesCount: t1Zones.length,
        schemesCount: t1Schemes,
        plannedHa: sumT1Planned,
        sownHa: sumT1Sown,
        zonesList: isOromo ? 'Arsii, Baale, Shawaa Bahaa, Shawaa Dhihaa, Shawaa Kaabaa' : 'Arsi, Bale, East Shewa, West Shewa, North Shewa',
        descriptionEn: 'High-altitude vertisols, gravity diversions (Awash & Wabe Shebelle tributaries), extensive commercial clusters.',
        descriptionOm: 'Biyyee gurraacha tulluuwwanii, jallisii yaa’aa fi kilaastera qamadii bal’aa.',
      },
      t2: {
        id: 'tier2',
        titleEn: 'River Basin Expansion Hubs',
        titleOm: 'Kilaastera Sulula Lagaa & Jallisii Paampii',
        badgeEn: 'Mid-Altitude (40k - 100k ha)',
        badgeOm: 'Giddu-galeessa (40k - 100k ha)',
        color: '#0284c7', // Sky Blue
        bgClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
        ringColor: 'ring-sky-500',
        dotColor: 'bg-sky-500',
        zonesCount: t2Zones.length,
        schemesCount: t2Schemes,
        plannedHa: sumT2Planned,
        sownHa: sumT2Sown,
        zonesList: isOromo ? 'Shawaa K/Lixaa, Jimmaa, Iluu Abbaa Booraa, Bunnoo Baddallee, Gujii' : 'SW Shewa, Jimma, Ilu Aba Bor, Buno Bedele, Guji',
        descriptionEn: 'River diversion weir systems and motorized pump cascades along high-flow perennial streams.',
        descriptionOm: 'Ijaarsa bo\'oo lagaa fi paampii motoraa sululoota bishaan hin cinne keessatti.',
      },
      t3: {
        id: 'tier3',
        titleEn: 'Lowland Pastoral & Agro-Pastoral Belts',
        titleOm: 'Sululoota Gammoojjii & Tikfatee',
        badgeEn: 'Lowland Corridor (<40k ha)',
        badgeOm: 'Gammoojjii (<40k ha)',
        color: '#f59e0b', // Amber
        bgClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
        ringColor: 'ring-amber-500',
        dotColor: 'bg-amber-500',
        zonesCount: t3Zones.length,
        schemesCount: t3Schemes,
        plannedHa: sumT3Planned,
        sownHa: sumT3Sown,
        zonesList: isOromo ? 'Boorana, Harargee Bahaa/Dhihaa, Wallagga Bahaa/Dhihaa, Q/Wallagga, Horo Guduru' : 'Borana, E/W Hararghe, E/W Wollega, Kelem, Horo Guduru',
        descriptionEn: 'Solar-powered lift schemes, Genale/Dawa & Awash lowland corridors for drought resilience.',
        descriptionOm: 'Paampii aduu fi sulula laga Dawaa/Gannaalee hongee dandamachiisuuf misoomu.',
      },
    };
  }, [zones, schemes, isOromo]);

  // Mini Pin SVG icon component for legend preview
  const PinIcon = ({ bg, border = '#ffffff' }: { bg: string; border?: string }) => (
    <svg className="w-4 h-4 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"
        fill={bg}
        stroke={border}
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10" r="3" fill="#ffffff" />
    </svg>
  );

  return (
    <div
      className={`absolute bottom-4 left-4 z-20 pointer-events-auto transition-all duration-300 ease-out ${
        isExpanded ? 'w-[320px] sm:w-[360px]' : 'w-auto'
      }`}
    >
      {/* Collapsed Pill Button */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-xl text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
          title={isOromo ? 'Ibsituu Kaartaa Banuuf Cuqaasi' : 'Click to expand GIS Map Legend'}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-left text-xs">
            <div className="font-bold flex items-center gap-1.5 leading-none">
              <span>{isOromo ? 'Ibsituu Kaartaa' : 'Map Legend'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {filteredCount} {isOromo ? 'iskiimota' : 'schemes'} · {activeLayer.toUpperCase()}
            </div>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors ml-1" />
        </button>
      ) : (
        /* Expanded Floating Legend Card */
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[540px]">
          {/* Card Header with Drag/Collapse Controls */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
                  <span>{isOromo ? 'Ibsituu Kaartaa GIS' : 'GIS Map Legend & Clusters'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {filteredCount}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  {isOromo ? 'Mallattoolee & Kilaastera Naannoo' : 'Markers & Regional Wheat Belts'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={isOromo ? 'Gufachiisi' : 'Collapse Legend'}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold bg-slate-100/50 dark:bg-slate-800/40">
            <button
              onClick={() => setActiveTab('markers')}
              className={`flex-1 py-1.5 px-2 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'markers'
                  ? 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-b-2 border-emerald-500 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>{isOromo ? 'Mallattoolee' : 'Markers'}</span>
            </button>
            <button
              onClick={() => setActiveTab('regions')}
              className={`flex-1 py-1.5 px-2 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'regions'
                  ? 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-b-2 border-emerald-500 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wheat className="w-3 h-3" />
              <span>{isOromo ? 'Kilaastera (Belts)' : 'Wheat Belts'}</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-1.5 px-2 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'guide'
                  ? 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-b-2 border-emerald-500 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Info className="w-3 h-3" />
              <span>{isOromo ? 'Qajeelfama' : 'Guide'}</span>
            </button>
          </div>

          {/* Tab 1: Active Marker Thematic Layer Breakdown */}
          {activeTab === 'markers' && (
            <div className="p-3 space-y-3 overflow-y-auto max-h-[360px]">
              {/* Quick Layer Switcher */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {isOromo ? 'Baqqaana Agarsiisaa (Switch Layer)' : 'Active Thematic Layer'}
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { id: 'status', label: isOromo ? '🟢 Haala Hojii' : '🟢 Scheme Status' },
                    { id: 'water', label: isOromo ? '💧 Wabi Bishaanii' : '💧 Water Volume' },
                    { id: 'coverage', label: isOromo ? '🌾 Uwwisa (ha)' : '🌾 Wheat Acreage' },
                    { id: 'problems', label: isOromo ? '⚠️ Rakkoolee' : '⚠️ Maintenance' },
                  ].map(l => (
                    <button
                      key={l.id}
                      onClick={() => onSelectLayer(l.id as ThematicLayer)}
                      className={`py-1 px-2 rounded-lg font-semibold text-left transition-colors cursor-pointer truncate ${
                        activeLayer === l.id
                          ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Layer Breakdown */}
              {activeLayer === 'status' && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-500">
                    {isOromo ? 'Haala Hojii Iskiimotaa (Filter onClick):' : 'Status Categories (Click to filter):'}
                  </div>

                  {/* Functional */}
                  <div
                    onClick={() => onSelectStatusFilter(selectedStatusFilter === 'functional' ? 'all' : 'functional')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedStatusFilter === 'functional'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#10b981" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <span>{isOromo ? 'Hojiirra Kan Jiru' : 'Fully Functional'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Guutummaatti kan misoomsu' : 'Ready & actively irrigating'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {markerCounts.statusCounts.functional}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {((markerCounts.statusCounts.functional / markerCounts.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Partly Functional */}
                  <div
                    onClick={() => onSelectStatusFilter(selectedStatusFilter === 'partly_functional' ? 'all' : 'partly_functional')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedStatusFilter === 'partly_functional'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#f59e0b" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Gartokkeen Kan Hojjetu' : 'Partly Functional'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Suphaa ykn bo\'oo barbaada' : 'Requires pump/canal repair'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {markerCounts.statusCounts.partly_functional}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {((markerCounts.statusCounts.partly_functional / markerCounts.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Non-Functional */}
                  <div
                    onClick={() => onSelectStatusFilter(selectedStatusFilter === 'non_functional' ? 'all' : 'non_functional')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedStatusFilter === 'non_functional'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#ef4444" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Hojii Dhaabeera' : 'Non-Functional'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Caccaba paampii / Bo\'oo' : 'Complete breakdown / dry'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                        {markerCounts.statusCounts.non_functional}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {((markerCounts.statusCounts.non_functional / markerCounts.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Water Layer Breakdown */}
              {activeLayer === 'water' && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-500">
                    {isOromo ? 'Wabiin Bishaanii (Filter onClick):' : 'Water Availability (Click to filter):'}
                  </div>

                  <div
                    onClick={() => onSelectWaterFilter(selectedWaterFilter === 'adequate' ? 'all' : 'adequate')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedWaterFilter === 'adequate'
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#0284c7" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Wabi Bishaanii Gahaa' : 'Adequate Water Supply'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Yeroo mara kan dhiyaatu' : 'Perennial flow / full reservoir'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                      {markerCounts.waterCounts.adequate}
                    </span>
                  </div>

                  <div
                    onClick={() => onSelectWaterFilter(selectedWaterFilter === 'limited' ? 'all' : 'limited')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedWaterFilter === 'limited'
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 ring-1 ring-orange-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#f97316" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Hanqina Bishaanii Qaba' : 'Limited / Seasonal Water Stress'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Bishaan gahaa hin taane' : 'Low river volume / rationing'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                      {markerCounts.waterCounts.limited}
                    </span>
                  </div>

                  <div
                    onClick={() => onSelectWaterFilter(selectedWaterFilter === 'unavailable' ? 'all' : 'unavailable')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedWaterFilter === 'unavailable'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 ring-1 ring-red-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#dc2626" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Bishaan Hin Jiru' : 'Unavailable / Dry Source'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Lagi ykn madda gogeera' : 'Dried up stream or dried well'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                      {markerCounts.waterCounts.unavailable}
                    </span>
                  </div>
                </div>
              )}

              {/* Coverage Scale Layer */}
              {activeLayer === 'coverage' && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-500">
                    {isOromo ? 'Sadarkaa Bal\'ina Qamadii (Acreage Scale):' : 'Irrigated Wheat Scale (Hectares):'}
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#7c3aed" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Iskiimii Bal\'aa (>5,000 ha)' : 'Large Scale (>5,000 ha)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Iskiimota gurguddoo mootummaa' : 'Major commercial/cluster scheme'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {markerCounts.coverageCounts.large}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#8b5cf6" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Giddu-galeessa (2.5k - 5k ha)' : 'Medium Scale (2,500 - 5,000 ha)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Iskiimii giddu-galeessa aanaa' : 'Woreda-level gravity & pump schemes'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-500">
                      {markerCounts.coverageCounts.medium}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#a78bfa" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Iskiimii Xiqqa (<2,500 ha)' : 'Small / Community (<2,500 ha)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Jallisii aadaa & paampii dhuunfaa' : 'Community diversion & shallow well'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {markerCounts.coverageCounts.small}
                    </span>
                  </div>
                </div>
              )}

              {/* Maintenance / Problems Layer */}
              {activeLayer === 'problems' && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-500">
                    {isOromo ? 'Haala Rakkoolee Iskiimotaa:' : 'Operational Challenges Breakdown:'}
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#10b981" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Rakkoon Hin Jiru' : 'No Operational Issues'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Nagaadhaan hojjeta' : 'Optimal operating condition'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {markerCounts.problemCounts.none}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#f43f5e" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Paampii Caccabe' : 'Pump Breakdown'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Geeybii / Motora faayame' : 'Motor generator / fuel / impeller'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600">
                      {markerCounts.problemCounts.pump}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PinIcon bg="#a855f7" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isOromo ? 'Bo\'oon Caccabe / Cirracha' : 'Canal Damage / Siltation'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOromo ? 'Cirrachi guute / Bo\'oon cabe' : 'Sediment build-up / structural breach'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-600">
                      {markerCounts.problemCounts.canal}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Color-Coded Regions / Agro-Ecological Wheat Belts */}
          {activeTab === 'regions' && (
            <div className="p-3 space-y-2.5 overflow-y-auto max-h-[360px]">
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                {isOromo
                  ? 'Godinaaleen Oromiyaa sadarkaa kilaastera qamadii fi uumama lafaatiin gosa sadiitti qoodamu:'
                  : 'Oromia wheat zones are stratified into 3 agro-ecological and irrigation production clusters:'}
              </div>

              {/* Tier 1 Card */}
              <div className={`p-2.5 rounded-xl border ${regionTiers.t1.bgClass} space-y-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${regionTiers.t1.dotColor}`}></span>
                    <span>{isOromo ? regionTiers.t1.titleOm : regionTiers.t1.titleEn}</span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-emerald-200/50 dark:bg-emerald-900/50">
                    {isOromo ? regionTiers.t1.badgeOm : regionTiers.t1.badgeEn}
                  </span>
                </div>
                <p className="text-[10px] opacity-90 leading-tight">
                  {isOromo ? regionTiers.t1.descriptionOm : regionTiers.t1.descriptionEn}
                </p>
                <div className="text-[9px] font-medium pt-1 border-t border-emerald-500/20 flex items-center justify-between">
                  <span><strong>{regionTiers.t1.zonesCount}</strong> {isOromo ? 'Godinaalee' : 'Zones'}: {regionTiers.t1.zonesList}</span>
                  <span className="font-mono font-bold">{regionTiers.t1.schemesCount} {isOromo ? 'iskiimota' : 'schemes'}</span>
                </div>
                {regionTiers.t1.plannedHa > 0 && (
                  <div className="text-[9px] font-mono opacity-80 flex items-center justify-between">
                    <span>Plan: {regionTiers.t1.plannedHa.toLocaleString()} ha</span>
                    <span>Sown: {regionTiers.t1.sownHa.toLocaleString()} ha</span>
                  </div>
                )}
              </div>

              {/* Tier 2 Card */}
              <div className={`p-2.5 rounded-xl border ${regionTiers.t2.bgClass} space-y-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${regionTiers.t2.dotColor}`}></span>
                    <span>{isOromo ? regionTiers.t2.titleOm : regionTiers.t2.titleEn}</span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-sky-200/50 dark:bg-sky-900/50">
                    {isOromo ? regionTiers.t2.badgeOm : regionTiers.t2.badgeEn}
                  </span>
                </div>
                <p className="text-[10px] opacity-90 leading-tight">
                  {isOromo ? regionTiers.t2.descriptionOm : regionTiers.t2.descriptionEn}
                </p>
                <div className="text-[9px] font-medium pt-1 border-t border-sky-500/20 flex items-center justify-between">
                  <span><strong>{regionTiers.t2.zonesCount}</strong> {isOromo ? 'Godinaalee' : 'Zones'}: {regionTiers.t2.zonesList}</span>
                  <span className="font-mono font-bold">{regionTiers.t2.schemesCount} {isOromo ? 'iskiimota' : 'schemes'}</span>
                </div>
                {regionTiers.t2.plannedHa > 0 && (
                  <div className="text-[9px] font-mono opacity-80 flex items-center justify-between">
                    <span>Plan: {regionTiers.t2.plannedHa.toLocaleString()} ha</span>
                    <span>Sown: {regionTiers.t2.sownHa.toLocaleString()} ha</span>
                  </div>
                )}
              </div>

              {/* Tier 3 Card */}
              <div className={`p-2.5 rounded-xl border ${regionTiers.t3.bgClass} space-y-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${regionTiers.t3.dotColor}`}></span>
                    <span>{isOromo ? regionTiers.t3.titleOm : regionTiers.t3.titleEn}</span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-200/50 dark:bg-amber-900/50">
                    {isOromo ? regionTiers.t3.badgeOm : regionTiers.t3.badgeEn}
                  </span>
                </div>
                <p className="text-[10px] opacity-90 leading-tight">
                  {isOromo ? regionTiers.t3.descriptionOm : regionTiers.t3.descriptionEn}
                </p>
                <div className="text-[9px] font-medium pt-1 border-t border-amber-500/20 flex items-center justify-between">
                  <span><strong>{regionTiers.t3.zonesCount}</strong> {isOromo ? 'Godinaalee' : 'Zones'}: {regionTiers.t3.zonesList}</span>
                  <span className="font-mono font-bold">{regionTiers.t3.schemesCount} {isOromo ? 'iskiimota' : 'schemes'}</span>
                </div>
                {regionTiers.t3.plannedHa > 0 && (
                  <div className="text-[9px] font-mono opacity-80 flex items-center justify-between">
                    <span>Plan: {regionTiers.t3.plannedHa.toLocaleString()} ha</span>
                    <span>Sown: {regionTiers.t3.sownHa.toLocaleString()} ha</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Map Symbology & Guide */}
          {activeTab === 'guide' && (
            <div className="p-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[360px]">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isOromo ? 'Akkaataa Kaartaa Itti Fayyadaman' : 'How to Read the GIS Map'}</span>
                </div>

                <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                  <li>
                    <strong>{isOromo ? 'Pin Filatame (Selected):' : 'Selected Marker:'}</strong>{' '}
                    {isOromo
                      ? 'Mallattoon filatame bal\'ina guddaa (1.3x) fi sarara adii qabaata.'
                      : 'Active scheme expands by 1.3x with a bright white outline ring and detailed popup.'}
                  </li>
                  <li>
                    <strong>{isOromo ? 'Ilaallata Google Earth:' : 'Google Earth Hybrid Mode:'}</strong>{' '}
                    {isOromo
                      ? 'Fakkii saatalaayitii fi sarara daandiilee aanaa walitti fida.'
                      : 'Shows high-resolution terrain photography overlaid with major woreda roadways and river paths.'}
                  </li>
                  <li>
                    <strong>{isOromo ? 'Gulaaluu & Dabaluu:' : 'Admin GIS Management:'}</strong>{' '}
                    {isOromo
                      ? 'Iskiimii haaraa dabaluuf ykn bakka isaa jijjiiruuf furtuu "Add Scheme" fayyadamaa.'
                      : 'Click "+ Add Irrigation Scheme" or click on the map directly to place coordinates and record new infrastructure.'}
                  </li>
                </ul>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isOromo
                    ? 'Biiroo Qonnaa Oromiyaa - Daataa GIS Iskiimota Jallisii fi Kilaastera Qamadii'
                    : 'Oromia Bureau of Agriculture - Real-time Field GIS Infrastructure & Cluster Registry'}
                </span>
              </div>
            </div>
          )}

          {/* Footer with Quick Action Reset */}
          {(selectedStatusFilter !== 'all' || selectedWaterFilter !== 'all') && (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-[11px]">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                {isOromo ? 'Calaltuun hojiirra jira' : 'Filter active'}
              </span>
              <button
                onClick={() => {
                  onSelectStatusFilter('all');
                  onSelectWaterFilter('all');
                }}
                className="font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer hover:text-emerald-900"
              >
                {isOromo ? 'Haqi (Reset)' : 'Reset Filters'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
