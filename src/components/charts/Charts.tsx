import React from 'react';

// 1. Semi-Circular / Circular Gauge Chart
interface GaugeProps {
  value: number; // percentage 0-100
  title: string;
  subtitle?: string;
  target?: number;
  color?: string;
  size?: number;
}

export const GaugeChart: React.FC<GaugeProps> = ({
  value,
  title,
  subtitle,
  target = 100,
  color = '#10b981',
  size = 140,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-3 text-center">
      <div className="relative" style={{ width: size, height: size / 2 + 18 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Big percentage display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {value.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-1">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

// 2. Clustered Column Chart (e.g. Planned vs Prepared vs Sown)
interface ClusteredColumnProps {
  categories: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
  height?: number;
  unit?: string;
}

export const ClusteredColumnChart: React.FC<ClusteredColumnProps> = ({
  categories,
  series,
  height = 240,
  unit = 'ha',
}) => {
  const maxVal = Math.max(...series.flatMap(s => s.data), 1);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        {series.map(s => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      {/* Chart Canvas */}
      <div className="flex items-end gap-2 pt-6 pb-2 overflow-x-auto" style={{ height }}>
        {categories.map((cat, catIdx) => (
          <div key={cat} className="flex-1 min-w-[70px] flex flex-col items-center gap-1.5 group h-full justify-end">
            <div className="w-full flex items-end justify-center gap-1 h-[82%]">
              {series.map(s => {
                const val = s.data[catIdx] || 0;
                const pct = (val / maxVal) * 100;
                return (
                  <div
                    key={s.name}
                    className="w-1/3 rounded-t transition-all duration-300 relative group/bar hover:opacity-90"
                    style={{
                      height: `${Math.max(4, pct)}%`,
                      backgroundColor: s.color,
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded pointer-events-none z-20 whitespace-nowrap font-mono">
                      {s.name}: {val.toLocaleString()} {unit}
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[70px] text-center" title={cat}>
              {cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Donut / Pie Chart
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  totalLabel?: string;
  size?: number;
  unit?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalLabel = 'Total',
  size = 180,
  unit = '',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedAngle = 0;

  const slices = data.map(item => {
    const fraction = total > 0 ? item.value / total : 0;
    const startAngle = accumulatedAngle;
    accumulatedAngle += fraction * 360;
    const endAngle = accumulatedAngle;
    return { ...item, startAngle, endAngle, fraction };
  });

  // Calculate SVG arc paths
  const getCoordinatesForAngle = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180.0;
    return [Math.cos(rad) * radius + size / 2, Math.sin(rad) * radius + size / 2];
  };

  const outerR = size / 2 - 8;
  const innerR = size / 2 - 28;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {slices.map((slice, i) => {
            if (slice.fraction === 0) return null;
            if (slice.fraction >= 0.999) {
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={(outerR + innerR) / 2}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={outerR - innerR}
                />
              );
            }
            const [startX, startY] = getCoordinatesForAngle(slice.startAngle, outerR);
            const [endX, endY] = getCoordinatesForAngle(slice.endAngle, outerR);
            const [innerStartX, innerStartY] = getCoordinatesForAngle(slice.endAngle, innerR);
            const [innerEndX, innerEndY] = getCoordinatesForAngle(slice.startAngle, innerR);
            const largeArc = slice.fraction > 0.5 ? 1 : 0;

            const pathData = [
              `M ${startX} ${startY}`,
              `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endX} ${endY}`,
              `L ${innerStartX} ${innerStartY}`,
              `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}`,
              'Z',
            ].join(' ');

            return (
              <path
                key={i}
                d={pathData}
                fill={slice.color}
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{`${slice.label}: ${slice.value.toLocaleString()} (${(slice.fraction * 100).toFixed(1)}%)`}</title>
              </path>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-medium">{totalLabel}</span>
          <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
            {total >= 1000000 ? `${(total / 1000000).toFixed(1)}M` : total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="space-y-1.5 flex-1 min-w-[140px] text-xs">
        {data.map(item => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1 font-mono tabular-nums text-slate-500 shrink-0">
                <span>{item.value.toLocaleString()} {unit}</span>
                <span className="text-[10px] text-slate-400">({pct.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. Input Supply Waterfall Chart (Demand -> Planned -> Supplied -> Distributed)
interface WaterfallStep {
  name: string;
  value: number;
  type: 'base' | 'sub' | 'final';
}

export const WaterfallChart: React.FC<{ steps: WaterfallStep[]; unit?: string }> = ({
  steps,
  unit = 'q',
}) => {
  const maxVal = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 h-52 pt-8 pb-3 border-b border-slate-200 dark:border-slate-800">
        {steps.map((st, i) => {
          const heightPct = (st.value / maxVal) * 100;
          const isGap = i > 0 && steps[i - 1].value > st.value;
          const gapVal = i > 0 ? steps[i - 1].value - st.value : 0;

          return (
            <div key={st.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                {(st.value / 1000).toFixed(1)}k {unit}
              </span>

              <div className="w-full max-w-[64px] flex flex-col justify-end h-[75%] relative">
                {/* Gap highlight if deficit exists */}
                {isGap && (
                  <div
                    className="w-full bg-rose-500/20 border-b border-rose-500/50 mb-0.5 rounded-t text-[9px] text-rose-500 flex items-center justify-center font-mono"
                    style={{ height: `${(gapVal / maxVal) * 100}%` }}
                    title={`Gap: -${(gapVal / 1000).toFixed(1)}k ${unit}`}
                  >
                    -{(gapVal / 1000).toFixed(0)}k
                  </div>
                )}

                <div
                  className="w-full rounded transition-all duration-300"
                  style={{
                    height: `${Math.max(6, heightPct)}%`,
                    backgroundColor:
                      i === 0
                        ? '#3b82f6'
                        : i === steps.length - 1
                        ? '#10b981'
                        : '#6366f1',
                  }}
                />
              </div>

              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">
                {st.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. Line Trend Chart (e.g. Weekly Sowing, Price, Employment)
interface TrendLineProps {
  labels: string[];
  points: number[];
  color?: string;
  unit?: string;
  height?: number;
}

export const TrendLineChart: React.FC<TrendLineProps> = ({
  labels,
  points,
  color = '#10b981',
  unit = '',
  height = 180,
}) => {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const w = 500;
  const h = height;
  const padX = 30;
  const padY = 24;

  const coords = points.map((p, idx) => {
    const x = padX + (idx / (points.length - 1)) * (w - padX * 2);
    const y = h - padY - ((p - min) / range) * (h - padY * 2);
    return [x, y];
  });

  const pathD = coords.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1][0]} ${h - padY} L ${coords[0][0]} ${h - padY} Z`;

  return (
    <div className="w-full space-y-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible">
        {/* Baseline & Grid */}
        <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
        <line x1={padX} y1={padY} x2={w - padX} y2={padY} stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" />

        {/* Gradient Area Fill */}
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {coords.map(([x, y], idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle cx={x} cy={y} r="4" fill="#ffffff" stroke={color} strokeWidth="2" className="group-hover:r-6 transition-all" />
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono fill-slate-700 dark:fill-slate-200"
            >
              {points[idx].toLocaleString()} {unit}
            </text>
            <text x={x} y={h - 6} textAnchor="middle" className="text-[10px] fill-slate-400 font-sans">
              {labels[idx]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// 6. Heatmap Grid (e.g. Zones x Challenges or Products Shortage)
interface HeatmapProps {
  rows: string[];
  cols: string[];
  values: ('Low' | 'Medium' | 'High' | 'Yes' | 'No')[][];
}

export const HeatmapGrid: React.FC<HeatmapProps> = ({ rows, cols, values }) => {
  const getColor = (val: string) => {
    if (val === 'High' || val === 'Yes') return 'bg-rose-500/80 text-white';
    if (val === 'Medium') return 'bg-amber-400/80 text-slate-900';
    if (val === 'Low' || val === 'No') return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-slate-500 border-b border-slate-200 dark:border-slate-800">
              Zone / City
            </th>
            {cols.map(c => (
              <th
                key={c}
                className="p-2 text-center font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((rowName, rIdx) => (
            <tr key={rowName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <td className="p-2 font-medium text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 whitespace-nowrap">
                {rowName}
              </td>
              {cols.map((_, cIdx) => {
                const cellVal = values[rIdx]?.[cIdx] || 'Low';
                return (
                  <td key={cIdx} className="p-1.5 text-center border-b border-slate-100 dark:border-slate-800/60">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold font-mono ${getColor(
                        cellVal
                      )}`}
                    >
                      {cellVal}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
