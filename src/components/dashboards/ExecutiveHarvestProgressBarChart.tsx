import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { ZoneRecord, Language } from '../../types';
import {
  Trophy,
  Activity,
  Wheat,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

type MetricView = 'area' | 'production';
type SortOrder = 'completion' | 'planned' | 'default';

export const ExecutiveHarvestProgressBarChart: React.FC<Props> = ({ zones, lang }) => {
  const [metricView, setMetricView] = useState<MetricView>('area');
  const [sortOrder, setSortOrder] = useState<SortOrder>('completion');

  // Compute Regional Aggregates
  const regionalSummary = useMemo(() => {
    let totalPlannedArea = 0;
    let totalHarvestedArea = 0;
    let totalReadyArea = 0;
    let totalExpectedProd = 0;
    let totalObtainedProd = 0;

    zones.forEach((z) => {
      totalPlannedArea += z.plannedAreaHa || 0;
      totalHarvestedArea += z.harvestedAreaHa || 0;
      totalReadyArea += z.readyForHarvestHa || 0;
      totalExpectedProd += z.expectedProductionQ || 0;
      totalObtainedProd += z.productionObtainedQ || 0;
    });

    const areaCompletionPct =
      totalPlannedArea > 0 ? (totalHarvestedArea / totalPlannedArea) * 100 : 0;
    const prodCompletionPct =
      totalExpectedProd > 0 ? (totalObtainedProd / totalExpectedProd) * 100 : 0;

    return {
      totalPlannedArea,
      totalHarvestedArea,
      totalReadyArea,
      totalExpectedProd,
      totalObtainedProd,
      areaCompletionPct,
      prodCompletionPct,
    };
  }, [zones]);

  // Transform zones data for Recharts BarChart
  const chartData = useMemo(() => {
    const raw = zones.map((z) => {
      const plannedArea = z.plannedAreaHa || 0;
      const harvestedArea = z.harvestedAreaHa || 0;
      const readyArea = z.readyForHarvestHa || 0;
      const areaPct = plannedArea > 0 ? (harvestedArea / plannedArea) * 100 : 0;

      const expectedProd = z.expectedProductionQ || 0;
      const obtainedProd = z.productionObtainedQ || 0;
      const prodPct = expectedProd > 0 ? (obtainedProd / expectedProd) * 100 : 0;

      return {
        id: z.id,
        zoneName: lang === 'om' ? z.name : z.nameEn,
        category: z.category,
        // Area Metrics (ha)
        plannedArea,
        harvestedArea,
        readyArea,
        areaPct: +areaPct.toFixed(1),
        // Production Metrics (quintals)
        expectedProd,
        obtainedProd,
        prodPct: +prodPct.toFixed(1),
        // Active view values
        plannedVal: metricView === 'area' ? plannedArea : expectedProd,
        actualVal: metricView === 'area' ? harvestedArea : obtainedProd,
        completionPct: +(metricView === 'area' ? areaPct : prodPct).toFixed(1),
      };
    });

    if (sortOrder === 'completion') {
      return [...raw].sort((a, b) => b.completionPct - a.completionPct);
    }
    if (sortOrder === 'planned') {
      return [...raw].sort((a, b) => b.plannedVal - a.plannedVal);
    }
    return raw;
  }, [zones, lang, metricView, sortOrder]);

  const topZone = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.completionPct - a.completionPct)[0];
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const isArea = metricView === 'area';
    const unit = isArea ? 'ha' : 'q';
    const labelTitle = isArea ? 'Hectares' : 'Quintals';

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[210px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-slate-100 text-sm">{data.zoneName}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              data.completionPct >= 70
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : data.completionPct >= 40
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {data.completionPct}% {lang === 'om' ? 'Raawwate' : 'Done'}
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>{isArea ? 'Total Planned:' : 'Expected Output:'}</span>
            <span className="font-semibold text-slate-200">
              {data.plannedVal.toLocaleString()} {unit}
            </span>
          </div>

          <div className="flex justify-between text-emerald-400">
            <span>{isArea ? 'Actual Harvest:' : 'Production Obtained:'}</span>
            <span className="font-bold">
              {data.actualVal.toLocaleString()} {unit}
            </span>
          </div>

          {isArea && data.readyArea > 0 && (
            <div className="flex justify-between text-amber-300">
              <span>Ready for Harvest:</span>
              <span className="font-semibold">
                {data.readyArea.toLocaleString()} ha
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-1">
            <span>Remaining Target:</span>
            <span className="text-slate-300">
              {Math.max(0, data.plannedVal - data.actualVal).toLocaleString()} {unit}
            </span>
          </div>
        </div>

        {/* Progress bar inside tooltip */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full"
            style={{ width: `${Math.min(100, data.completionPct)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {lang === 'om'
                    ? 'Adeemsa Sassaabbii Qamadii Jallisii (Karoora vs Raawwii)'
                    : 'Real-Time Harvest Progress: Planned vs Actual by Zone'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                  Recharts Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'om'
                  ? 'Gabaasa saffisa sassaabbii midhaanii hektaaraan fi dhibbeentaa xumurame godinoota 14 hundaaf'
                  : 'Multi-zone comparison of Total Planned target vs Actual Harvest with dynamic completion percentage'}
              </p>
            </div>
          </div>
        </div>

        {/* Metric View & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto text-xs">
          {/* Area vs Production toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setMetricView('area')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricView === 'area'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'om' ? 'Uwwisa Lafaa (ha)' : 'Area Metric (ha)'}
            </button>
            <button
              onClick={() => setMetricView('production')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricView === 'production'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'om' ? 'Oomisha (Kuntala)' : 'Output (Quintals)'}
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="completion">
                {lang === 'om' ? 'Dhibbeentaadhaan (Olka\'aa)' : 'Sort: % Completion'}
              </option>
              <option value="planned">
                {lang === 'om' ? 'Karooraan (Guddaa)' : 'Sort: Planned Target'}
              </option>
              <option value="default">
                {lang === 'om' ? 'Tartiiba Godinaa' : 'Sort: Default Order'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Regional Summary Metrics Row with Grand Progress Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {metricView === 'area' ? 'Total Regional Planned' : 'Total Expected Output'}
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            {metricView === 'area'
              ? `${(regionalSummary.totalPlannedArea / 1000000).toFixed(2)}M ha`
              : `${(regionalSummary.totalExpectedProd / 1000000).toFixed(1)}M q`}
          </div>
          <span className="text-[10px] text-slate-400">14 Administrative Zones</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            {metricView === 'area' ? 'Actual Harvest to Date' : 'Actual Production Obtained'}
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metricView === 'area'
              ? `${(regionalSummary.totalHarvestedArea / 1000000).toFixed(2)}M ha`
              : `${(regionalSummary.totalObtainedProd / 1000000).toFixed(1)}M q`}
          </div>
          <span className="text-[10px] text-slate-400">
            {metricView === 'area'
              ? `${(regionalSummary.totalReadyArea / 1000).toFixed(0)}k ha ready for harvest`
              : 'Marketed & stored grain'}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Regional Completion Rate
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {(metricView === 'area'
                ? regionalSummary.areaCompletionPct
                : regionalSummary.prodCompletionPct
              ).toFixed(1)}
              %
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Active Harvest
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  metricView === 'area'
                    ? regionalSummary.areaCompletionPct
                    : regionalSummary.prodCompletionPct
                )}%`,
              }}
            />
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Top Performing Zone
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
            {topZone?.zoneName || 'Arsi'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{topZone?.completionPct}% Completion</span>
          </div>
        </div>
      </div>

      {/* Main Recharts BarChart Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {metricView === 'area'
              ? 'Zone-by-Zone Harvested Hectares vs Planned Allocation'
              : 'Zone-by-Zone Output Volume vs Expected Target'}
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-400 dark:bg-slate-600" />
              <span>{metricView === 'area' ? 'Planned Target (ha)' : 'Expected (q)'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span>{metricView === 'area' ? 'Actual Harvested (ha)' : 'Obtained (q)'}</span>
            </div>
          </div>
        </div>

        {/* Responsive Recharts Container */}
        <div className="w-full h-[520px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 35, left: 20, bottom: 20 }}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                type="number"
                tickFormatter={(val) =>
                  metricView === 'area'
                    ? `${(val / 1000).toFixed(0)}k ha`
                    : `${(val / 1000000).toFixed(1)}M q`
                }
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-slate-500 dark:text-slate-400 font-mono"
              />
              <YAxis
                type="category"
                dataKey="zoneName"
                width={120}
                tick={{ fontSize: 12, fontWeight: 500, fill: 'currentColor' }}
                className="text-slate-700 dark:text-slate-300 font-sans"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {val === 'plannedVal'
                      ? metricView === 'area'
                        ? 'Total Planned Area (ha)'
                        : 'Expected Output (q)'
                      : metricView === 'area'
                      ? 'Actual Harvested Area (ha)'
                      : 'Production Obtained (q)'}
                  </span>
                )}
              />

              {/* Total Planned Target Bar (Soft slate/gray container) */}
              <Bar
                dataKey="plannedVal"
                name="plannedVal"
                fill="#94a3b8"
                radius={[0, 4, 4, 0]}
                barSize={14}
                className="opacity-75 dark:opacity-60"
              />

              {/* Actual Harvest Bar (Vibrant Emerald Progress Bar) */}
              <Bar
                dataKey="actualVal"
                name="actualVal"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                barSize={14}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.completionPct >= 70
                        ? '#10b981' // emerald-500
                        : entry.completionPct >= 40
                        ? '#059669' // emerald-600
                        : '#f59e0b' // amber-500
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion Percentage Progress Strip Cards per Zone */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {lang === 'om'
                ? 'Sadarkaa Xumura Sassaabbii Godinaalee (%)'
                : 'Zone Harvest Completion Progress Bars'}
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            14 Zones · Real-Time Firestore Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {chartData.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate"
                  title={item.zoneName}
                >
                  {item.zoneName}
                </span>
                <span
                  className={`text-[11px] font-bold font-mono ${
                    item.completionPct >= 70
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : item.completionPct >= 40
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.completionPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${
                    item.completionPct >= 70
                      ? 'bg-emerald-500'
                      : item.completionPct >= 40
                      ? 'bg-emerald-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, item.completionPct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                <span>
                  {metricView === 'area'
                    ? `${(item.harvestedArea / 1000).toFixed(0)}k ha`
                    : `${(item.obtainedProd / 1000000).toFixed(2)}M q`}
                </span>
                <span>
                  / {metricView === 'area'
                    ? `${(item.plannedArea / 1000).toFixed(0)}k`
                    : `${(item.expectedProd / 1000000).toFixed(1)}M`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
