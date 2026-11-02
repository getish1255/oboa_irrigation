import React, { useState, useMemo } from 'react';
import { IrrigationScheme, Language } from '../../types';
import { MapPin, Layers, Info, Filter, CheckCircle2, AlertTriangle, XCircle, Droplets, Wrench, Search } from 'lucide-react';

interface Props {
  schemes: IrrigationScheme[];
  lang: Language;
}

type MapLayer = 'status' | 'water' | 'coverage' | 'problems';

export const OromiaGisMap: React.FC<Props> = ({ schemes, lang }) => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('status');
  const [selectedScheme, setSelectedScheme] = useState<IrrigationScheme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'functional' | 'partly_functional' | 'non_functional'>('all');

  // Bounding box for Oromia mapping to SVG viewport
  // Lat: 3.4°N to 10.4°N (~7.0° span)
  // Lng: 34.2°E to 42.8°E (~8.6° span)
  const minLat = 3.6;
  const maxLat = 10.5;
  const minLng = 34.0;
  const maxLng = 42.6;

  const width = 860;
  const height = 540;

  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng - minLng) / (maxLng - minLng)) * (width - 120) + 60;
    // Invert Y because latitude goes up north while SVG Y goes down
    const y = ((maxLat - lat) / (maxLat - minLat)) * (height - 100) + 50;
    return [x, y];
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.woreda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.zoneName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schemes, searchTerm, statusFilter]);

  const getMarkerColor = (scheme: IrrigationScheme) => {
    if (activeLayer === 'status') {
      if (scheme.status === 'functional') return '#16a34a'; // green
      if (scheme.status === 'partly_functional') return '#eab308'; // yellow
      return '#ef4444'; // red
    }
    if (activeLayer === 'water') {
      if (scheme.waterAvailability === 'adequate') return '#0284c7'; // blue
      if (scheme.waterAvailability === 'limited') return '#f97316'; // orange
      return '#dc2626'; // red
    }
    if (activeLayer === 'coverage') {
      return '#d97706'; // amber graduated
    }
    if (activeLayer === 'problems') {
      if (scheme.operationalProblem === 'None') return '#10b981';
      if (scheme.operationalProblem === 'Pump breakdown') return '#f43f5e';
      if (scheme.operationalProblem === 'Canal damage' || scheme.operationalProblem === 'Siltation') return '#8b5cf6';
      if (scheme.operationalProblem === 'Water shortage') return '#f59e0b';
      return '#64748b';
    }
    return '#16a34a';
  };

  const getMarkerRadius = (scheme: IrrigationScheme) => {
    if (activeLayer === 'coverage') {
      // Scale between 7px and 22px
      return Math.max(7, Math.min(22, (scheme.actualIrrigatedWheatHa / 18000) * 20 + 6));
    }
    return 8;
  };

  // Schematic polygon paths representing major Oromia geographical zones
  const oromiaBoundaryPath = `
    M 140 180 
    Q 220 130 330 160 
    T 460 170 
    T 580 180 
    T 760 140 
    L 780 230 
    Q 730 290 680 340 
    T 540 430 
    T 430 490 
    T 340 430 
    T 250 370 
    T 120 290 
    Z
  `;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            {lang === 'om' ? 'Kaartaa GIS Iskiimota Jallisii Oromiyaa' : 'Oromia Irrigation Schemes GIS Map'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'om'
              ? 'Bakka fi haala iskiimota jallisii qamadii, wabiin bishaanii fi hanqinaalee mul\'atan'
              : 'Geographic distribution, scheme functionality, water adequacy and operational issues'}
          </p>
        </div>

        {/* Layer Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveLayer('status')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeLayer === 'status'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'om' ? 'Haala Hojii (🟢🟡🔴)' : 'Scheme Status (🟢🟡🔴)'}
          </button>
          <button
            onClick={() => setActiveLayer('water')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeLayer === 'water'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'om' ? 'Wabi Bishaanii' : 'Water Availability'}
          </button>
          <button
            onClick={() => setActiveLayer('coverage')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeLayer === 'coverage'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'om' ? 'Bal\'ina Qamadii' : 'Wheat Coverage (ha)'}
          </button>
          <button
            onClick={() => setActiveLayer('problems')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeLayer === 'problems'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'om' ? 'Rakkoolee Iskiimotaa' : 'Operational Problems'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'om' ? 'Iskiimii, aanaa, ykn godina barbaadi...' : 'Search scheme, woreda, or zone...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Haala:' : 'Status:'}</span>
          {(['all', 'functional', 'partly_functional', 'non_functional'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'all'
                ? lang === 'om' ? 'Hunda' : 'All'
                : st === 'functional'
                ? lang === 'om' ? 'Kan Hojjatu' : 'Functional'
                : st === 'partly_functional'
                ? lang === 'om' ? 'Gartokkeen' : 'Partly'
                : lang === 'om' ? 'Kan Hin Hojjanne' : 'Non-functional'}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas and Scheme Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* SVG Map Container */}
        <div className="lg:col-span-3 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-lg p-2.5 text-xs space-y-1.5 shadow-md">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              {activeLayer === 'status' && (lang === 'om' ? 'Sadarkaa Hojii Iskiimiilee' : 'Scheme Status Layer')}
              {activeLayer === 'water' && (lang === 'om' ? 'Sadarkaa Wabi Bishaanii' : 'Water Availability Layer')}
              {activeLayer === 'coverage' && (lang === 'om' ? 'Bal\'ina Qamadii Faca\'ee' : 'Irrigated Wheat Area (ha)')}
              {activeLayer === 'problems' && (lang === 'om' ? 'Rakkoolee Bu\'uuraalee' : 'Operational Issue Layer')}
            </div>

            {/* Dynamic Legend */}
            {activeLayer === 'status' && (
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{lang === 'om' ? 'Kan Hojjatu (Functional)' : 'Functional'} (11)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  <span>{lang === 'om' ? 'Gartokkeen (Partly Functional)' : 'Partly Functional'} (3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span>{lang === 'om' ? 'Kan Hin Hojjanne (Non-Functional)' : 'Non-Functional'} (2)</span>
                </div>
              </div>
            )}

            {activeLayer === 'water' && (
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                  <span>{lang === 'om' ? 'Gahaa (Adequate)' : 'Adequate Water'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                  <span>{lang === 'om' ? 'Muraasa (Limited)' : 'Limited Supply'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                  <span>{lang === 'om' ? 'Kan Hin Jirre (Unavailable)' : 'Unavailable / Dry'}</span>
                </div>
              </div>
            )}

            {activeLayer === 'coverage' && (
              <div className="text-slate-400 text-[11px] leading-tight">
                {lang === 'om' ? 'Geengoo guddaa = Lafa jallisii bal\'aa (ha)' : 'Larger circle = Higher wheat area (ha)'}
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>&lt; 5k ha</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500"></span>
                  <span>10k ha</span>
                  <span className="w-5 h-5 rounded-full bg-amber-500"></span>
                  <span>&gt; 15k ha</span>
                </div>
              </div>
            )}

            {activeLayer === 'problems' && (
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>None / Nominal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Pump breakdown</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Canal siltation/damage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Water shortage</span>
                </div>
              </div>
            )}
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            style={{ minHeight: '440px' }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />

            {/* Basin River Guides */}
            {/* Awash River Course */}
            <path
              d="M 440 240 Q 470 210 520 200 T 590 190 T 630 180"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity="0.4"
            />
            {/* Wabe Shebelle Course */}
            <path
              d="M 480 320 Q 560 360 620 370 T 700 380"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity="0.4"
            />
            {/* Omo-Gibe Course */}
            <path
              d="M 330 260 Q 340 330 350 410"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity="0.4"
            />
            {/* Blue Nile / Abbay / Dedessa Course */}
            <path
              d="M 280 230 Q 320 180 390 170"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity="0.4"
            />

            {/* Oromia Schematic Region Boundary */}
            <path
              d={oromiaBoundaryPath}
              fill="rgba(16, 185, 129, 0.06)"
              stroke="rgba(16, 185, 129, 0.35)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />

            {/* Major Regional Labels */}
            <text x="500" y="240" fill="#64748b" fontSize="11" fontWeight="600" opacity="0.6">
              G/gala Oromiyaa (Central)
            </text>
            <text x="520" y="325" fill="#64748b" fontSize="11" fontWeight="600" opacity="0.6">
              Kibba-baha (Arsi / Bale)
            </text>
            <text x="250" y="270" fill="#64748b" fontSize="11" fontWeight="600" opacity="0.6">
              Kibba-Lixa (Jimma / Ilu)
            </text>
            <text x="270" y="190" fill="#64748b" fontSize="11" fontWeight="600" opacity="0.6">
              Lixa Oromiyaa (Wollega)
            </text>
            <text x="650" y="210" fill="#64748b" fontSize="11" fontWeight="600" opacity="0.6">
              Baha Oromiyaa (Hararghe)
            </text>
            <text x="440" y="440" fill="#64748b" fontSize="11" fontWeight="600" opacity="0.6">
              Kibba Oromiyaa (Borena / Guji)
            </text>

            {/* Scheme GPS Markers */}
            {filteredSchemes.map(scheme => {
              const [cx, cy] = project(scheme.lat, scheme.lng);
              const isSelected = selectedScheme?.id === scheme.id;
              const radius = getMarkerRadius(scheme);
              const color = getMarkerColor(scheme);

              return (
                <g
                  key={scheme.id}
                  onClick={() => setSelectedScheme(scheme)}
                  className="cursor-pointer group"
                >
                  {/* Pulse effect if selected or high priority */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Marker base halo */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 2}
                    fill="rgba(15, 23, 42, 0.8)"
                    stroke={color}
                    strokeWidth="1.5"
                  />

                  {/* Marker circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                    opacity="0.9"
                    className="transition-transform group-hover:scale-125"
                  />

                  {/* Scheme short label */}
                  <text
                    x={cx}
                    y={cy - radius - 5}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="9.5"
                    fontWeight="600"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {scheme.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map bottom strip */}
          <div className="absolute bottom-2 right-3 text-[11px] text-slate-400 font-mono">
            Oromia Spatial Coordinates · {filteredSchemes.length} Schemes Plotted · WGS84
          </div>
        </div>

        {/* Selected Scheme Detail Inspector */}
        <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              {lang === 'om' ? 'Bal\'ina Iskiimii' : 'Scheme Inspector'}
            </h3>
            {selectedScheme && (
              <button
                onClick={() => setSelectedScheme(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {selectedScheme ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                  {selectedScheme.name}
                </span>
                <span className="text-slate-500">
                  {selectedScheme.zoneName} · {selectedScheme.woreda}
                </span>
              </div>

              {/* Status and Water badges */}
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                    selectedScheme.status === 'functional'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : selectedScheme.status === 'partly_functional'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {selectedScheme.status === 'functional' && <CheckCircle2 className="w-3 h-3" />}
                  {selectedScheme.status === 'partly_functional' && <AlertTriangle className="w-3 h-3" />}
                  {selectedScheme.status === 'non_functional' && <XCircle className="w-3 h-3" />}
                  {selectedScheme.status}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                  <Droplets className="w-3 h-3" />
                  {selectedScheme.waterAvailability}
                </span>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">
                    {lang === 'om' ? 'Lafa Qamadii' : 'Wheat Area'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                    {selectedScheme.actualIrrigatedWheatHa.toLocaleString()} ha
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">
                    {lang === 'om' ? 'Bal\'ina Waliigalaa' : 'Command Area'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                    {selectedScheme.commandAreaHa.toLocaleString()} ha
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">
                    {lang === 'om' ? 'Madda Bishaanii' : 'Water Source'}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedScheme.waterSource}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">
                    {lang === 'om' ? 'Mala Jallisii' : 'Irrig. Method'}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedScheme.method}
                  </span>
                </div>
              </div>

              {/* Pump counts & operational problem */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'om' ? 'Paampoota:' : 'Pumps:'}</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {selectedScheme.pumpsFunctional} / {selectedScheme.pumpsTotal} functional (
                    {Math.round((selectedScheme.pumpsFunctional / selectedScheme.pumpsTotal) * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'om' ? 'Hirmaattota:' : 'Beneficiaries:'}</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {selectedScheme.beneficiariesCount.toLocaleString()} farmers
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'om' ? 'Rakkoo:' : 'Problem:'}</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    {selectedScheme.operationalProblem}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>GPS:</span>
                  <span>{selectedScheme.lat.toFixed(4)}°N, {selectedScheme.lng.toFixed(4)}°E</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
              <p className="text-xs">
                {lang === 'om'
                  ? 'Kaartaa irraa iskiimii tokko filadhu bal\'ina isaa baruuf.'
                  : 'Click on any scheme point on the map to inspect engineering and agricultural details.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
