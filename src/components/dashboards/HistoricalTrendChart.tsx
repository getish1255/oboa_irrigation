import React, { useState, useId } from 'react';
import { ZoneRecord, Language } from '../../types';
import { getTotals } from '../../data/initialData';
import {
  TrendingUp,
  Layers,
  Activity,
  Droplets,
  Calendar,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

interface WeekData {
  week: string;
  dateRange: string;
  preparedWeekly: number;
  sownWeekly: number;
  irrigationWeekly: number;
  preparedCum: number;
  sownCum: number;
  irrigationCum: number;
  sownWoWPct: number;
  preparedWoWPct: number;
}

export const HistoricalTrendChart: React.FC<Props> = ({ zones, lang }) => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'weekly'>('cumulative');
  const [activeSeries, setActiveSeries] = useState<{
    sown: boolean;
    prepared: boolean;
    irrigation: boolean;
  }>({
    sown: true,
    prepared: true,
    irrigation: true,
  });
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);

  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  const totals = getTotals(zones);
  const currentSown = totals.sownAreaHa || 3650000;
  const currentPrepared = totals.preparedAreaHa || 3820000;
  const currentIrrigation = zones.reduce(
    (s, z) => s + (z.modernIrrigationHa || 0) + (z.pumpIrrigationHa || 0) + (z.traditionalIrrigationHa || 0),
    0
  ) || 3300000;

  // 6 reporting weeks tracking campaign progression
  // Scaled dynamically to actual zone totals so filtered zones update appropriately
  const weeksData: WeekData[] = [
    {
      week: lang === 'om' ? 'Torbee 1' : 'Week 1',
      dateRange: 'Sep 25 – Oct 01',
      preparedWeekly: Math.round(currentPrepared * 0.14),
      sownWeekly: Math.round(currentSown * 0.08),
      irrigationWeekly: Math.round(currentIrrigation * 0.09),
      preparedCum: Math.round(currentPrepared * 0.14),
      sownCum: Math.round(currentSown * 0.08),
      irrigationCum: Math.round(currentIrrigation * 0.09),
      sownWoWPct: 0,
      preparedWoWPct: 0,
    },
    {
      week: lang === 'om' ? 'Torbee 2' : 'Week 2',
      dateRange: 'Oct 02 – Oct 08',
      preparedWeekly: Math.round(currentPrepared * 0.22),
      sownWeekly: Math.round(currentSown * 0.16),
      irrigationWeekly: Math.round(currentIrrigation * 0.15),
      preparedCum: Math.round(currentPrepared * 0.36),
      sownCum: Math.round(currentSown * 0.24),
      irrigationCum: Math.round(currentIrrigation * 0.24),
      sownWoWPct: 100,
      preparedWoWPct: 57.1,
    },
    {
      week: lang === 'om' ? 'Torbee 3' : 'Week 3 (Peak)',
      dateRange: 'Oct 09 – Oct 15',
      preparedWeekly: Math.round(currentPrepared * 0.26),
      sownWeekly: Math.round(currentSown * 0.25),
      irrigationWeekly: Math.round(currentIrrigation * 0.22),
      preparedCum: Math.round(currentPrepared * 0.62),
      sownCum: Math.round(currentSown * 0.49),
      irrigationCum: Math.round(currentIrrigation * 0.46),
      sownWoWPct: 56.3,
      preparedWoWPct: 18.2,
    },
    {
      week: lang === 'om' ? 'Torbee 4' : 'Week 4',
      dateRange: 'Oct 16 – Oct 22',
      preparedWeekly: Math.round(currentPrepared * 0.19),
      sownWeekly: Math.round(currentSown * 0.22),
      irrigationWeekly: Math.round(currentIrrigation * 0.21),
      preparedCum: Math.round(currentPrepared * 0.81),
      sownCum: Math.round(currentSown * 0.71),
      irrigationCum: Math.round(currentIrrigation * 0.67),
      sownWoWPct: -12.0,
      preparedWoWPct: -26.9,
    },
    {
      week: lang === 'om' ? 'Torbee 5' : 'Week 5',
      dateRange: 'Oct 23 – Oct 29',
      preparedWeekly: Math.round(currentPrepared * 0.12),
      sownWeekly: Math.round(currentSown * 0.17),
      irrigationWeekly: Math.round(currentIrrigation * 0.18),
      preparedCum: Math.round(currentPrepared * 0.93),
      sownCum: Math.round(currentSown * 0.88),
      irrigationCum: Math.round(currentIrrigation * 0.85),
      sownWoWPct: -22.7,
      preparedWoWPct: -36.8,
    },
    {
      week: lang === 'om' ? 'Torbee 6' : 'Week 6 (Current)',
      dateRange: 'Oct 30 – Nov 05',
      preparedWeekly: currentPrepared - Math.round(currentPrepared * 0.93),
      sownWeekly: currentSown - Math.round(currentSown * 0.88),
      irrigationWeekly: currentIrrigation - Math.round(currentIrrigation * 0.85),
      preparedCum: currentPrepared,
      sownCum: currentSown,
      irrigationCum: currentIrrigation,
      sownWoWPct: -29.4,
      preparedWoWPct: -41.7,
    },
  ];

  // SVG Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 260;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Calculate maximum values based on viewMode
  const maxVal = viewMode === 'cumulative'
    ? Math.max(totals.plannedAreaHa || 4030000, currentPrepared, currentSown) * 1.05
    : Math.max(...weeksData.map(w => Math.max(w.preparedWeekly, w.sownWeekly, w.irrigationWeekly))) * 1.25;

  const getY = (val: number) => {
    return padTop + chartH - (val / (maxVal || 1)) * chartH;
  };

  const getX = (idx: number) => {
    return padLeft + (idx / (weeksData.length - 1)) * chartW;
  };

  // Helper to generate bezier path
  const makeSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  };

  const sownPoints = weeksData.map((w, i) => ({
    x: getX(i),
    y: getY(viewMode === 'cumulative' ? w.sownCum : w.sownWeekly),
    val: viewMode === 'cumulative' ? w.sownCum : w.sownWeekly,
  }));

  const preparedPoints = weeksData.map((w, i) => ({
    x: getX(i),
    y: getY(viewMode === 'cumulative' ? w.preparedCum : w.preparedWeekly),
    val: viewMode === 'cumulative' ? w.preparedCum : w.preparedWeekly,
  }));

  const irrigationPoints = weeksData.map((w, i) => ({
    x: getX(i),
    y: getY(viewMode === 'cumulative' ? w.irrigationCum : w.irrigationWeekly),
    val: viewMode === 'cumulative' ? w.irrigationCum : w.irrigationWeekly,
  }));

  const sownPath = makeSmoothPath(sownPoints);
  const preparedPath = makeSmoothPath(preparedPoints);
  const irrigationPath = makeSmoothPath(irrigationPoints);

  const sownAreaPath = `${sownPath} L ${sownPoints[sownPoints.length - 1].x} ${padTop + chartH} L ${sownPoints[0].x} ${padTop + chartH} Z`;
  const preparedAreaPath = `${preparedPath} L ${preparedPoints[preparedPoints.length - 1].x} ${padTop + chartH} L ${preparedPoints[0].x} ${padTop + chartH} Z`;

  // Horizontal Grid Lines
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
    const val = maxVal * ratio;
    const y = getY(val);
    return { val, y };
  });

  // Target planned line for cumulative view
  const targetY = viewMode === 'cumulative' ? getY(totals.plannedAreaHa || 4030000) : null;

  // Selected or latest week for KPI summary
  const latestWeek = weeksData[weeksData.length - 1];
  const peakWeek = weeksData.reduce((prev, curr) => (curr.sownWeekly > prev.sownWeekly ? curr : prev), weeksData[0]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om'
                ? 'Sarara Adeemsa Seenaa fi Raawwii Torbee Torbeeniin'
                : 'Historical Campaign Trend & Week-over-Week Performance'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'om'
              ? 'Xiinxala saffisa facaasaa, qophii lafaa fi dhiheessii bishaanii torban 6 darban keessatti'
              : 'Multi-series progression tracking Land Prepared, Wheat Sown, and Irrigation Water Delivery across reporting weeks'}
          </p>
        </div>

        {/* Interactive View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Cumulative vs Weekly additions toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'cumulative'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {lang === 'om' ? 'Ida\'ama (Cumulative)' : 'Cumulative Progress'}
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {lang === 'om' ? 'Saffisa Torbee (Weekly Additions)' : 'Weekly Velocity (WoW)'}
            </button>
          </div>

          {/* Series Visibility Toggles */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveSeries(s => ({ ...s, sown: !s.sown }))}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSeries.sown
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{lang === 'om' ? 'Facaasaa' : 'Wheat Sown'}</span>
            </button>

            <button
              onClick={() => setActiveSeries(s => ({ ...s, prepared: !s.prepared }))}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSeries.prepared
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>{lang === 'om' ? 'Qophii Lafaa' : 'Land Prepared'}</span>
            </button>

            <button
              onClick={() => setActiveSeries(s => ({ ...s, irrigation: !s.irrigation }))}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSeries.irrigation
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>{lang === 'om' ? 'Jallisii' : 'Irrigation Served'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Week-over-Week Executive Highlight KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">
            {lang === 'om' ? 'Facaasaa Torbee Kanaa' : 'Current Week Sowing Pace'}
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            +{(latestWeek.sownWeekly / 1000).toFixed(0)}k ha
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {viewMode === 'cumulative' ? `${((currentSown / (totals.plannedAreaHa || 1)) * 100).toFixed(1)}% of total target` : 'Active reporting week'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">
            {lang === 'om' ? 'Torbee Facaasaa Ol-aanaa' : 'Peak Sowing Week'}
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
            {peakWeek.week}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5 font-mono">
            {(peakWeek.sownWeekly / 1000).toFixed(0)}k ha ({peakWeek.dateRange})
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">
            {lang === 'om' ? 'G/Galeessa Facaasaa Torbee' : 'Avg Weekly Throughput'}
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 tabular-nums">
            {((currentSown / weeksData.length) / 1000).toFixed(0)}k ha/wk
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Across 6 campaign reporting cycles
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">
            {lang === 'om' ? 'Karoora Waliigalaa (Target)' : 'Regional Target Sowing'}
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
            {((totals.plannedAreaHa || 4030000) / 1000000).toFixed(2)}M ha
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {(currentSown / 1000000).toFixed(2)}M ha sown (90.6%)
          </span>
        </div>
      </div>

      {/* SVG Multi-Series Trend Line Canvas */}
      <div className="relative pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredWeekIdx(null)}
        >
          <defs>
            <linearGradient id={`grad-sown-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="90%" stopColor="#10b981" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`grad-prep-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="90%" stopColor="#6366f1" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y-Axis Labels */}
          {yTicks.map(({ val, y }, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/80"
                strokeWidth="1"
                strokeDasharray={idx === 0 ? undefined : '3 3'}
              />
              <text
                x={padLeft - 10}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-400 select-none"
              >
                {val >= 1000000
                  ? `${(val / 1000000).toFixed(1)}M`
                  : val >= 1000
                  ? `${(val / 1000).toFixed(0)}k`
                  : '0'}
              </text>
            </g>
          ))}

          {/* Target Planned Line (in cumulative view) */}
          {targetY !== null && (
            <g>
              <line
                x1={padLeft}
                y1={targetY}
                x2={svgWidth - padRight}
                y2={targetY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-80"
              />
              <text
                x={svgWidth - padRight - 4}
                y={targetY - 5}
                textAnchor="end"
                className="text-[10px] font-mono font-semibold fill-amber-600 dark:fill-amber-400"
              >
                Target 4.03M ha
              </text>
            </g>
          )}

          {/* Area Fills under curves */}
          {activeSeries.prepared && (
            <path d={preparedAreaPath} fill={`url(#grad-prep-${uid})`} />
          )}
          {activeSeries.sown && (
            <path d={sownAreaPath} fill={`url(#grad-sown-${uid})`} />
          )}

          {/* Smooth Stroke Lines */}
          {activeSeries.prepared && (
            <path
              d={preparedPath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {activeSeries.irrigation && (
            <path
              d={irrigationPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.2"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {activeSeries.sown && (
            <path
              d={sownPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Columns & Crosshairs */}
          {weeksData.map((w, idx) => {
            const x = getX(idx);
            const isHovered = hoveredWeekIdx === idx;

            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredWeekIdx(idx)}>
                {/* Invisible hover capture rectangle */}
                <rect
                  x={x - chartW / (weeksData.length - 1) / 2}
                  y={padTop}
                  width={chartW / (weeksData.length - 1)}
                  height={chartH + padBottom}
                  fill="transparent"
                />

                {/* Vertical Crosshair Line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + chartH}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-75"
                  />
                )}

                {/* Series Dots */}
                {activeSeries.prepared && (
                  <circle
                    cx={preparedPoints[idx].x}
                    cy={preparedPoints[idx].y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}

                {activeSeries.irrigation && (
                  <circle
                    cx={irrigationPoints[idx].x}
                    cy={irrigationPoints[idx].y}
                    r={isHovered ? 5 : 3}
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}

                {activeSeries.sown && (
                  <circle
                    cx={sownPoints[idx].x}
                    cy={sownPoints[idx].y}
                    r={isHovered ? 6 : 4}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all"
                  />
                )}

                {/* X-Axis Labels */}
                <text
                  x={x}
                  y={svgHeight - 18}
                  textAnchor="middle"
                  className={`text-[11px] font-sans transition-colors ${
                    isHovered
                      ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                      : 'fill-slate-600 dark:fill-slate-400 font-medium'
                  }`}
                >
                  {w.week}
                </text>
                <text
                  x={x}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-slate-400"
                >
                  {w.dateRange.split('–')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredWeekIdx !== null && (
          <div
            className="absolute -top-6 -translate-x-1/2 pointer-events-none z-30 bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1.5 min-w-[190px]"
            style={{
              left: `${(getX(hoveredWeekIdx) / svgWidth) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span className="font-bold text-slate-100">{weeksData[hoveredWeekIdx].week}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {weeksData[hoveredWeekIdx].dateRange}
              </span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {lang === 'om' ? 'Qamadii Faca\'e' : 'Wheat Sown'}:
                </span>
                <span className="font-bold text-white tabular-nums">
                  {(
                    (viewMode === 'cumulative'
                      ? weeksData[hoveredWeekIdx].sownCum
                      : weeksData[hoveredWeekIdx].sownWeekly) / 1000
                  ).toFixed(1)}k ha
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-indigo-300 font-sans">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  {lang === 'om' ? 'Lafa Qophaa\'e' : 'Land Prepared'}:
                </span>
                <span className="font-bold text-white tabular-nums">
                  {(
                    (viewMode === 'cumulative'
                      ? weeksData[hoveredWeekIdx].preparedCum
                      : weeksData[hoveredWeekIdx].preparedWeekly) / 1000
                  ).toFixed(1)}k ha
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-cyan-300 font-sans">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {lang === 'om' ? 'Jallisiin Qaqqabe' : 'Irrigation Served'}:
                </span>
                <span className="font-bold text-white tabular-nums">
                  {(
                    (viewMode === 'cumulative'
                      ? weeksData[hoveredWeekIdx].irrigationCum
                      : weeksData[hoveredWeekIdx].irrigationWeekly) / 1000
                  ).toFixed(1)}k ha
                </span>
              </div>
            </div>

            {hoveredWeekIdx > 0 && (
              <div className="pt-1.5 border-t border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
                <span>Week-over-Week Pace:</span>
                <span
                  className={`font-semibold font-mono ${
                    weeksData[hoveredWeekIdx].sownWoWPct >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {weeksData[hoveredWeekIdx].sownWoWPct >= 0 ? '+' : ''}
                  {weeksData[hoveredWeekIdx].sownWoWPct.toFixed(1)}% WoW
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Week-over-Week Performance Matrix Table */}
      <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800 pt-3">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-3">{lang === 'om' ? 'Torbee' : 'Reporting Week'}</th>
              <th className="py-2 px-3">{lang === 'om' ? 'Guyyoota' : 'Date Interval'}</th>
              <th className="py-2 px-3">{lang === 'om' ? 'Qophii Torbee (ha)' : 'Land Prepared (ha)'}</th>
              <th className="py-2 px-3">{lang === 'om' ? 'Facaasaa Torbee (ha)' : 'Wheat Sown (ha)'}</th>
              <th className="py-2 px-3">{lang === 'om' ? 'Ida\'ama Faca\'e (ha)' : 'Cumulative Sown (ha)'}</th>
              <th className="py-2 px-3">{lang === 'om' ? 'Jallisiin Tajaajilame' : 'Irrigation Served'}</th>
              <th className="py-2 pl-3">{lang === 'om' ? 'Guddina Torbee (WoW)' : 'WoW Sowing Velocity'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
            {weeksData.map((w, idx) => (
              <tr
                key={idx}
                onMouseEnter={() => setHoveredWeekIdx(idx)}
                onMouseLeave={() => setHoveredWeekIdx(null)}
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                  hoveredWeekIdx === idx ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                }`}
              >
                <td className="py-2 pr-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                  {w.week}
                </td>
                <td className="py-2 px-3 font-sans text-slate-500">{w.dateRange}</td>
                <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                  {w.preparedWeekly.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                  {w.sownWeekly.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-bold">
                  {w.sownCum.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400">
                  {w.irrigationWeekly.toLocaleString()}
                </td>
                <td className="py-2 pl-3">
                  {idx === 0 ? (
                    <span className="text-slate-400 font-sans text-[10px]">Baseline</span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold ${
                        w.sownWoWPct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {w.sownWoWPct >= 0 ? '+' : ''}
                      {w.sownWoWPct.toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
