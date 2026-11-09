import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ZoneRecord, IrrigationScheme, Language } from '../../types';
import { getTotals } from '../../data/initialData';
import {
  TrendingUp,
  Activity,
  Layers,
  Wheat,
  Droplets,
  Users,
  Tractor,
  Percent,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  lang: Language;
}

type ViewMode = 'normalized' | 'absolute';

interface TopKpiDef {
  key: string;
  nameEn: string;
  nameOm: string;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  targetValue: number;
}

export const ExecutiveKpisTrendLineChart: React.FC<Props> = ({
  zones,
  schemes,
  lang,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('normalized');
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    sown: true,
    prepared: true,
    production: true,
    irrigation: true,
    farmers: true,
  });

  const totals = useMemo(() => getTotals(zones), [zones]);

  const totalIrrigatedHa = useMemo(
    () => schemes.reduce((sum, s) => sum + s.serviceableAreaHa, 0) || 3420000,
    [schemes]
  );

  const totalFarmers = useMemo(
    () => totals.farmersMale + totals.farmersFemale || 3080000,
    [totals]
  );

  // Define Top 5 KPIs
  const top5Kpis: TopKpiDef[] = useMemo(
    () => [
      {
        key: 'sown',
        nameEn: 'Wheat Sown',
        nameOm: 'Lafa Faca\'e',
        unit: 'ha',
        color: '#10b981', // emerald-500
        icon: Wheat,
        targetValue: totals.sownAreaHa || 3650000,
      },
      {
        key: 'prepared',
        nameEn: 'Land Prepared',
        nameOm: 'Lafa Qophaa\'e',
        unit: 'ha',
        color: '#3b82f6', // blue-500
        icon: Tractor,
        targetValue: totals.preparedAreaHa || 3820000,
      },
      {
        key: 'production',
        nameEn: 'Harvest Output',
        nameOm: 'Oomisha Sassaabbii',
        unit: 'q',
        color: '#f59e0b', // amber-500
        icon: TrendingUp,
        targetValue: totals.expectedProductionQ || 168300000,
      },
      {
        key: 'irrigation',
        nameEn: 'Irrigation Served',
        nameOm: 'Uwwisa Jallisii',
        unit: 'ha',
        color: '#06b6d4', // cyan-500
        icon: Droplets,
        targetValue: totalIrrigatedHa,
      },
      {
        key: 'farmers',
        nameEn: 'Farmers Mobilized',
        nameOm: 'Qonnaan Bultoota',
        unit: 'ppl',
        color: '#8b5cf6', // purple-500
        icon: Users,
        targetValue: totalFarmers,
      },
    ],
    [totals, totalIrrigatedHa, totalFarmers]
  );

  // Month-over-Month historical campaign progression ratios
  // 6 months covering campaign cycle: October to March
  const monthsData = useMemo(() => {
    const months = [
      {
        monthEn: 'Oct 2025',
        monthOm: 'Onk 2025',
        monthShort: 'Oct',
        sownR: 0.18,
        prepR: 0.38,
        prodR: 0.04,
        irrigR: 0.28,
        farmR: 0.42,
        milestone: 'Initial Plowing & Water Sluice Openings',
      },
      {
        monthEn: 'Nov 2025',
        monthOm: 'Sad 2025',
        monthShort: 'Nov',
        sownR: 0.46,
        prepR: 0.68,
        prodR: 0.12,
        irrigR: 0.52,
        farmR: 0.68,
        milestone: 'Peak Sowing & Cluster Formation',
      },
      {
        monthEn: 'Dec 2025',
        monthOm: 'Mud 2025',
        monthShort: 'Dec',
        sownR: 0.76,
        prepR: 0.88,
        prodR: 0.28,
        irrigR: 0.74,
        farmR: 0.84,
        milestone: 'Vegetative Growth & Urea Top-Dressing',
      },
      {
        monthEn: 'Jan 2026',
        monthOm: 'Ama 2026',
        monthShort: 'Jan',
        sownR: 0.92,
        prepR: 0.96,
        prodR: 0.54,
        irrigR: 0.89,
        farmR: 0.93,
        milestone: 'Booting, Grain Filling & Early Harvesting',
      },
      {
        monthEn: 'Feb 2026',
        monthOm: 'Gur 2026',
        monthShort: 'Feb',
        sownR: 0.98,
        prepR: 0.99,
        prodR: 0.84,
        irrigR: 0.97,
        farmR: 0.98,
        milestone: 'Peak Combine Threshing & High Yields',
      },
      {
        monthEn: 'Mar 2026 (Live)',
        monthOm: 'Bit 2026 (Live)',
        monthShort: 'Mar (Live)',
        sownR: 1.0,
        prepR: 1.0,
        prodR: 1.0,
        irrigR: 1.0,
        farmR: 1.0,
        milestone: 'Campaign Full Consolidation & Market Grain Sales',
      },
    ];

    const curSown = totals.sownAreaHa || 3650000;
    const curPrep = totals.preparedAreaHa || 3820000;
    const curProd = totals.expectedProductionQ || 168300000;
    const curIrrig = totalIrrigatedHa;
    const curFarm = totalFarmers;

    return months.map((m, idx) => {
      // Absolute values
      const sownVal = Math.round(curSown * m.sownR);
      const prepVal = Math.round(curPrep * m.prepR);
      const prodVal = Math.round(curProd * m.prodR);
      const irrigVal = Math.round(curIrrig * m.irrigR);
      const farmVal = Math.round(curFarm * m.farmR);

      // Normalized percentage values (0 - 100%)
      const sownPct = +(m.sownR * 100).toFixed(1);
      const prepPct = +(m.prepR * 100).toFixed(1);
      const prodPct = +(m.prodR * 100).toFixed(1);
      const irrigPct = +(m.irrigR * 100).toFixed(1);
      const farmPct = +(m.farmR * 100).toFixed(1);

      // Previous month values for MoM growth deltas
      const prevM = idx > 0 ? months[idx - 1] : null;
      const sownMoM = prevM ? +(((m.sownR - prevM.sownR) / prevM.sownR) * 100).toFixed(1) : 0;
      const prodMoM = prevM ? +(((m.prodR - prevM.prodR) / prevM.prodR) * 100).toFixed(1) : 0;

      return {
        month: lang === 'om' ? m.monthOm : m.monthEn,
        monthShort: m.monthShort,
        milestone: m.milestone,
        // Normalized % dataKeys
        sown_pct: sownPct,
        prepared_pct: prepPct,
        production_pct: prodPct,
        irrigation_pct: irrigPct,
        farmers_pct: farmPct,
        // Absolute values
        sown: sownVal,
        prepared: prepVal,
        production: prodVal,
        irrigation: irrigVal,
        farmers: farmVal,
        // MoM deltas
        sownMoM,
        prodMoM,
      };
    });
  }, [totals, totalIrrigatedHa, totalFarmers, lang]);

  // Compute MoM Growth Highlights for summary cards
  const momGrowthCards = useMemo(() => {
    if (monthsData.length < 2) return [];
    const latest = monthsData[monthsData.length - 1];
    const prev = monthsData[monthsData.length - 2];

    return [
      {
        title: lang === 'om' ? 'Lafa Faca\'e' : 'Wheat Sown',
        currentVal: `${(latest.sown / 1000000).toFixed(2)}M ha`,
        pctAchieved: `${latest.sown_pct}%`,
        momGrowth: `+${(((latest.sown - prev.sown) / prev.sown) * 100).toFixed(1)}%`,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
        barColor: 'bg-emerald-500',
        pctNum: latest.sown_pct,
      },
      {
        title: lang === 'om' ? 'Lafa Qophaa\'e' : 'Land Prepared',
        currentVal: `${(latest.prepared / 1000000).toFixed(2)}M ha`,
        pctAchieved: `${latest.prepared_pct}%`,
        momGrowth: `+${(((latest.prepared - prev.prepared) / prev.prepared) * 100).toFixed(1)}%`,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
        barColor: 'bg-blue-500',
        pctNum: latest.prepared_pct,
      },
      {
        title: lang === 'om' ? 'Oomisha Sassaabbii' : 'Harvest Output',
        currentVal: `${(latest.production / 1000000).toFixed(1)}M q`,
        pctAchieved: `${latest.production_pct}%`,
        momGrowth: `+${(((latest.production - prev.production) / prev.production) * 100).toFixed(1)}%`,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
        barColor: 'bg-amber-500',
        pctNum: latest.production_pct,
      },
      {
        title: lang === 'om' ? 'Uwwisa Jallisii' : 'Irrigation Served',
        currentVal: `${(latest.irrigation / 1000000).toFixed(2)}M ha`,
        pctAchieved: `${latest.irrigation_pct}%`,
        momGrowth: `+${(((latest.irrigation - prev.irrigation) / prev.irrigation) * 100).toFixed(1)}%`,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60',
        barColor: 'bg-cyan-500',
        pctNum: latest.irrigation_pct,
      },
      {
        title: lang === 'om' ? 'Qonnaan Bultoota' : 'Farmers Engaged',
        currentVal: `${(latest.farmers / 1000000).toFixed(2)}M ppl`,
        pctAchieved: `${latest.farmers_pct}%`,
        momGrowth: `+${(((latest.farmers - prev.farmers) / prev.farmers) * 100).toFixed(1)}%`,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
        barColor: 'bg-purple-500',
        pctNum: latest.farmers_pct,
      },
    ];
  }, [monthsData, lang]);

  // Toggle KPI series
  const toggleSeries = (key: string) => {
    setActiveSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const currentPoint = monthsData.find((m) => m.month === label);

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[240px] space-y-2">
        <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            {label}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Month-over-Month</span>
        </div>

        {currentPoint?.milestone && (
          <p className="text-[10px] text-emerald-300/90 italic font-sans leading-tight">
            {currentPoint.milestone}
          </p>
        )}

        <div className="space-y-1.5 font-mono pt-1">
          {payload.map((entry: any, idx: number) => {
            const kpiKey = entry.dataKey.replace('_pct', '');
            const kpiDef = top5Kpis.find((k) => k.key === kpiKey);
            if (!kpiDef) return null;

            const absValue = currentPoint ? (currentPoint as any)[kpiKey] : 0;
            const pctValue = entry.value;

            return (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 font-sans">
                    {lang === 'om' ? kpiDef.nameOm : kpiDef.nameEn}:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">
                    {viewMode === 'normalized'
                      ? `${pctValue}%`
                      : `${(absValue || 0).toLocaleString()} ${kpiDef.unit}`}
                  </span>
                  {viewMode === 'normalized' && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({(absValue / 1000000).toFixed(2)}M)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {lang === 'om'
                    ? 'Adeemsa Guddina Ji\'aa Ji\'aan (Top 5 KPIs MoM Trend)'
                    : 'Month-over-Month Performance Growth: Top 5 KPIs'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                  Recharts Trendline
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'om'
                  ? 'Sarara guddina raawwii qamadii jallisii ji\'oota 6 keessatti (Onkololeessa - Bitootessa 2026)'
                  : 'Multi-series trajectory tracking seasonal campaign progression from October 2025 launch through March 2026 live harvest'}
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle & Legend indicators */}
        <div className="flex items-center gap-2 self-start lg:self-auto text-xs">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('normalized')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'normalized'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'om' ? 'Dhibbeentaa (% Target)' : 'Normalized (% Target)'}
            </button>
            <button
              onClick={() => setViewMode('absolute')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'absolute'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'om' ? 'Lakkoofsa Qulqulluu' : 'Absolute Metric Values'}
            </button>
          </div>
        </div>
      </div>

      {/* Top 5 KPIs MoM Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {momGrowthCards.map((card, i) => (
          <div
            key={i}
            className={`p-3.5 rounded-xl border ${card.bg} flex flex-col justify-between transition-all hover:shadow-xs`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {card.title}
                </span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {card.momGrowth}
                </span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                {card.currentVal}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>Progress:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {card.pctAchieved}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${card.barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, card.pctNum)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Series Toggle Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
          {lang === 'om' ? 'Agarsiistota:' : 'Filter Series:'}
        </span>
        {top5Kpis.map((kpi) => {
          const isActive = activeSeries[kpi.key];
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.key}
              onClick={() => toggleSeries(kpi.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 opacity-60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: kpi.color }}
              />
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? kpi.nameOm : kpi.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Main Recharts LineChart */}
      <div className="w-full h-[380px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthsData}
            margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-slate-600 dark:text-slate-400 font-sans"
            />
            <YAxis
              tickFormatter={(val) =>
                viewMode === 'normalized'
                  ? `${val}%`
                  : val >= 1000000
                  ? `${(val / 1000000).toFixed(1)}M`
                  : `${(val / 1000).toFixed(0)}k`
              }
              domain={viewMode === 'normalized' ? [0, 105] : ['auto', 'auto']}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-slate-600 dark:text-slate-400 font-mono"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(val) => {
                const kpiKey = val.replace('_pct', '');
                const kpi = top5Kpis.find((k) => k.key === kpiKey);
                return (
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {kpi ? (lang === 'om' ? kpi.nameOm : kpi.nameEn) : val}
                  </span>
                );
              }}
            />

            {/* Target 100% Reference Line in Normalized View */}
            {viewMode === 'normalized' && (
              <ReferenceLine
                y={100}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: '100% Campaign Target',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            {/* 1. Wheat Sown Line */}
            {activeSeries.sown && (
              <Line
                type="monotone"
                dataKey={viewMode === 'normalized' ? 'sown_pct' : 'sown'}
                name="sown"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 1 }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* 2. Land Prepared Line */}
            {activeSeries.prepared && (
              <Line
                type="monotone"
                dataKey={viewMode === 'normalized' ? 'prepared_pct' : 'prepared'}
                name="prepared"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1 }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* 3. Production Output Line */}
            {activeSeries.production && (
              <Line
                type="monotone"
                dataKey={viewMode === 'normalized' ? 'production_pct' : 'production'}
                name="production"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1 }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* 4. Irrigation Served Line */}
            {activeSeries.irrigation && (
              <Line
                type="monotone"
                dataKey={viewMode === 'normalized' ? 'irrigation_pct' : 'irrigation'}
                name="irrigation"
                stroke="#06b6d4"
                strokeWidth={2.5}
                strokeDasharray="4 2"
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 1 }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* 5. Farmers Engaged Line */}
            {activeSeries.farmers && (
              <Line
                type="monotone"
                dataKey={viewMode === 'normalized' ? 'farmers_pct' : 'farmers'}
                name="farmers"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 1 }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal Trajectory Milestones Strip */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {lang === 'om'
                ? 'Sadarkaalee Qulqullinaa Duula Qamadii Jallisii'
                : 'Key Seasonal Milestone Progression (Oct 2025 - Mar 2026)'}
            </span>
          </span>
          <span className="text-[11px] font-mono">14 Zones & Cities Monitored</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {monthsData.map((m, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-left ${
                idx === monthsData.length - 1
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                <span className={idx === monthsData.length - 1 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}>
                  {m.monthShort}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {m.sown_pct}% Sown
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                {m.milestone}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
