import React, { useId, useState } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  changeLabel?: string;
  changePct?: number;
  height?: number;
  width?: number;
  unit?: string;
  labels?: string[];
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#10b981',
  gradientFrom,
  gradientTo,
  changeLabel,
  changePct,
  height = 36,
  width = 110,
  unit = '',
  labels,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const rawId = useId();
  const gradId = `spark-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (!data || data.length < 2) {
    return null;
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const paddingY = 4;
  const paddingX = 4;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Compute point coordinates
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * usableWidth;
    const y = paddingY + usableHeight - ((val - minVal) / range) * usableHeight;
    return { x, y, val };
  });

  // Build smooth bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  // Area path closing at the bottom
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaD = `${pathD} L ${lastPt.x} ${height} L ${firstPt.x} ${height} Z`;

  const finalGradFrom = gradientFrom || color;
  const finalGradTo = gradientTo || color;

  const defaultDates = ['Oct 22', 'Oct 24', 'Oct 26', 'Oct 28', 'Oct 30', 'Nov 01', 'Nov 03', 'Nov 05', 'Nov 07', 'Today'];
  const dates = labels || defaultDates.slice(-data.length);

  return (
    <div className={`relative flex flex-col justify-end ${className}`}>
      {/* Sparkline SVG */}
      <div className="relative group/spark">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          style={{ maxHeight: height }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={finalGradFrom} stopOpacity={0.35} />
              <stop offset="85%" stopColor={finalGradTo} stopOpacity={0.02} />
              <stop offset="100%" stopColor={finalGradTo} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill={`url(#${gradId})`} />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive hover points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 4 : 2}
              className={`transition-all duration-150 cursor-pointer ${
                hoveredIdx === i
                  ? 'stroke-white dark:stroke-slate-900 stroke-2'
                  : i === points.length - 1
                  ? 'opacity-100'
                  : 'opacity-0 group-hover/spark:opacity-40'
              }`}
              fill={color}
              onMouseEnter={() => setHoveredIdx(i)}
            />
          ))}

          {/* Pulsing endpoint dot for current day */}
          {hoveredIdx === null && (
            <circle
              cx={lastPt.x}
              cy={lastPt.y}
              r={2.5}
              fill={color}
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 pointer-events-none z-30 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
            }}
          >
            <span className="text-slate-400 mr-1">{dates[hoveredIdx] || `Day ${hoveredIdx + 1}`}:</span>
            <span className="font-bold text-white">
              {typeof points[hoveredIdx].val === 'number'
                ? points[hoveredIdx].val >= 1000
                  ? points[hoveredIdx].val.toLocaleString()
                  : points[hoveredIdx].val.toFixed(1)
                : points[hoveredIdx].val}
              {unit ? ` ${unit}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Daily Rate / Trend Delta Badge */}
      {(changeLabel || changePct !== undefined) && (
        <div className="flex items-center justify-between text-[10px] mt-1 pt-0.5 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Daily trend</span>
          <span
            className={`font-mono font-semibold tabular-nums ${
              (changePct ?? 1) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {changeLabel || `${(changePct ?? 0) >= 0 ? '+' : ''}${(changePct ?? 0).toFixed(1)}%`}
          </span>
        </div>
      )}
    </div>
  );
};
