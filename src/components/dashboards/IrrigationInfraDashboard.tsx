import React from 'react';
import { IrrigationScheme, ZoneRecord, Language } from '../../types';
import { DonutChart, GaugeChart, TrendLineChart } from '../charts/Charts';
import { Droplets, Activity, Wrench, ShieldAlert } from 'lucide-react';

interface Props {
  schemes: IrrigationScheme[];
  zones: ZoneRecord[];
  lang: Language;
}

export const IrrigationInfraDashboard: React.FC<Props> = ({ schemes, zones, lang }) => {
  // 1. Pump Status
  const totalPumps = schemes.reduce((sum, s) => sum + s.pumpsTotal, 0);
  const functionalPumps = schemes.reduce((sum, s) => sum + s.pumpsFunctional, 0);
  const nonFunctionalPumps = totalPumps - functionalPumps;

  const pumpStatusData = [
    { label: lang === 'om' ? 'Kan Hojjatu (Functional)' : 'Functional', value: functionalPumps, color: '#10b981' },
    { label: lang === 'om' ? 'Kan Hin Hojjanne (Non-Functional)' : 'Non-functional', value: nonFunctionalPumps, color: '#ef4444' },
  ];

  // 2. Scheme Status
  const functionalSchemes = schemes.filter(s => s.status === 'functional').length;
  const partlyFunctionalSchemes = schemes.filter(s => s.status === 'partly_functional').length;
  const nonFunctionalSchemes = schemes.filter(s => s.status === 'non_functional').length;

  const schemeStatusData = [
    { label: lang === 'om' ? 'Kan Hojjatu (Functional)' : 'Functional', value: functionalSchemes, color: '#10b981' },
    { label: lang === 'om' ? 'Gartokkeen (Partly Functional)' : 'Partly Functional', value: partlyFunctionalSchemes, color: '#f59e0b' },
    { label: lang === 'om' ? 'Kan Hin Hojjanne (Non-functional)' : 'Non-functional', value: nonFunctionalSchemes, color: '#ef4444' },
  ];

  // 3. Irrigation Area Utilization (Serviceable / Command * 100)
  const totalCommandArea = schemes.reduce((sum, s) => sum + s.commandAreaHa, 0);
  const totalServiceableArea = schemes.reduce((sum, s) => sum + s.serviceableAreaHa, 0);
  const utilizationPct = totalCommandArea > 0 ? (totalServiceableArea / totalCommandArea) * 100 : 0;

  // 4. Irrigation Method Distribution (Pie)
  const methodCounts: Record<string, number> = {
    Furrow: 0,
    Basin: 0,
    Sprinkler: 0,
    Drip: 0,
    Flood: 0,
  };
  schemes.forEach(s => {
    methodCounts[s.method] = (methodCounts[s.method] || 0) + s.actualIrrigatedWheatHa;
  });

  const methodColors: Record<string, string> = {
    Furrow: '#0284c7', // blue
    Basin: '#0d9488', // teal
    Sprinkler: '#6366f1', // indigo
    Drip: '#10b981', // emerald
    Flood: '#f59e0b', // amber
  };

  const methodPieData = Object.entries(methodCounts).map(([k, v]) => ({
    label: k,
    value: v,
    color: methodColors[k] || '#64748b',
  }));

  // 5. Water Source Distribution (Pie)
  const waterSourceCounts: Record<string, number> = {
    River: 0,
    Stream: 0,
    Spring: 0,
    Lake: 0,
    Dam: 0,
    Borehole: 0,
    'Shallow Well': 0,
    Pond: 0,
  };
  schemes.forEach(s => {
    waterSourceCounts[s.waterSource] = (waterSourceCounts[s.waterSource] || 0) + s.actualIrrigatedWheatHa;
  });

  const sourceColors: Record<string, string> = {
    River: '#0284c7',
    Stream: '#0ea5e9',
    Spring: '#38bdf8',
    Lake: '#06b6d4',
    Dam: '#6366f1',
    Borehole: '#8b5cf6',
    'Shallow Well': '#a855f7',
    Pond: '#10b981',
  };

  const waterSourcePieData = Object.entries(waterSourceCounts).map(([k, v]) => ({
    label: k,
    value: v,
    color: sourceColors[k] || '#64748b',
  }));

  // 6. Pump Installation Progress Line (Weekly: Received, Installed, Repaired)
  const weeklyPumpsLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];
  const weeklyInstalledPumps = [45, 95, 140, 210, 280, 340, 390, 412];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-600" />
            {lang === 'om' ? '4. Bu\'uuraalee Jallisii (Irrigation Infrastructure)' : '4. Irrigation Infrastructure Dashboard (Pumps & Schemes)'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'om'
              ? 'Haala paampootaa, iskiimota jallisii, wabiin bishaanii fi mala jallisii'
              : 'Pump status, weekly installation progress, scheme functionality, command area utilization, and water source breakdown'}
          </p>
        </div>
      </div>

      {/* Row 1: Pump Status & Scheme Status & Utilization Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pump Status Donut */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            {lang === 'om' ? 'A. Haala Paampootaa' : 'A. Pump Status Dashboard'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'om' ? 'Paampoota jallisii hojjatan vs hin hojjenne' : 'Functional vs Non-functional irrigation pumps'}
          </p>
          <DonutChart data={pumpStatusData} totalLabel="Pumps" unit="" size={160} />
        </div>

        {/* Scheme Status Donut */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-600" />
            {lang === 'om' ? 'C. Sadarkaa Iskiimiilee' : 'C. Irrigation Scheme Status'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'om' ? 'Iskiimota 16 qorannoon irratti gaggeeffame' : 'Based on field engineering inspection status codes'}
          </p>
          <DonutChart data={schemeStatusData} totalLabel="Schemes" unit="" size={160} />
        </div>

        {/* Irrigation Area Utilization Gauge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <GaugeChart
            value={utilizationPct}
            title={lang === 'om' ? 'D. Ittifayyadama Lafa Iskiimii' : 'D. Irrigation Area Utilization'}
            subtitle={`${totalServiceableArea.toLocaleString()} ha serviceable / ${totalCommandArea.toLocaleString()} ha command`}
            color="#0284c7"
            size={170}
          />
          <div className="mt-3 text-center text-xs text-slate-500">
            Formula: Serviceable Area / Command Area × 100
          </div>
        </div>
      </div>

      {/* Row 2: Pump Installation Trend & Method & Water Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pump Installation Progress Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'B. Dhaabbii Paampootaa' : 'B. Pump Installation Progress'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Paampoota torbee torbeen dhaabbatan' : 'Weekly cumulative pumps installed & commissioned'}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded">
              412 Installed
            </span>
          </div>
          <TrendLineChart
            labels={weeklyPumpsLabels}
            points={weeklyInstalledPumps}
            color="#0284c7"
            unit="pumps"
            height={160}
          />
        </div>

        {/* Irrigation Method Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'E. Mala Jallisii (Method)' : 'E. Irrigation Method Distribution'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Furrow, Basin, Sprinkler, Drip, Flood' : 'Share of irrigated wheat area by application technique'}
            </p>
          </div>
          <DonutChart data={methodPieData} totalLabel="Hectares" unit="ha" size={160} />
        </div>

        {/* Water Source Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'F. Madda Bishaanii (Water Sources)' : 'F. Water Source Distribution'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'River, Lake, Dam, Borehole, Springs' : 'Surface vs Groundwater water source breakdown'}
            </p>
          </div>
          <DonutChart data={waterSourcePieData} totalLabel="Hectares" unit="ha" size={160} />
        </div>
      </div>
    </div>
  );
};
