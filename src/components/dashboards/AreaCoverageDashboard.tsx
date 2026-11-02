import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { ClusteredColumnChart, GaugeChart, TrendLineChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { MapPin, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const AreaCoverageDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);
  const achievementPct =
    totals.plannedAreaHa > 0 ? (totals.sownAreaHa / totals.plannedAreaHa) * 100 : 0;

  // Categories for Clustered Column (top zones + cities summary)
  const zoneCategories = zones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));

  const clusteredSeries = [
    {
      name: lang === 'om' ? 'Karoora (Planned)' : 'Planned Area',
      data: zones.map(z => z.plannedAreaHa),
      color: '#94a3b8', // slate/gray
    },
    {
      name: lang === 'om' ? 'Qophii Lafaa (Prepared)' : 'Land Prepared',
      data: zones.map(z => z.preparedAreaHa),
      color: '#3b82f6', // blue
    },
    {
      name: lang === 'om' ? 'Facaasaa (Sown)' : 'Area Sown',
      data: zones.map(z => z.sownAreaHa),
      color: '#10b981', // emerald green
    },
  ];

  // Weekly Sowing Trend (Campaign week 1 to 8)
  const weeklyLabels = [
    lang === 'om' ? 'Torbee 1' : 'Wk 1 (Sep)',
    lang === 'om' ? 'Torbee 2' : 'Wk 2 (Oct)',
    lang === 'om' ? 'Torbee 3' : 'Wk 3 (Oct)',
    lang === 'om' ? 'Torbee 4' : 'Wk 4 (Oct)',
    lang === 'om' ? 'Torbee 5' : 'Wk 5 (Oct)',
    lang === 'om' ? 'Torbee 6' : 'Wk 6 (Nov)',
    lang === 'om' ? 'Torbee 7' : 'Wk 7 (Nov)',
    lang === 'om' ? 'Torbee 8' : 'Wk 8 (Nov)',
  ];

  const weeklySownHa = [185000, 390000, 680000, 890000, 720000, 410000, 150000, 60000];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            {lang === 'om' ? '2. Adeemsa Uwwisa Lafaa fi Facaasaa' : '2. Area Coverage Progress Dashboard'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'om'
              ? 'Wal-bira qabiinsa karoora, qophii lafaa fi facaasaa godinootaa fi magaalotaa'
              : 'Planned vs Prepared vs Sown Area, Regional Sowing Achievement Gauge, and Weekly Campaign Trend'}
          </p>
        </div>
      </div>

      {/* Top Split: Gauge and Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sowing Achievement Gauge */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <GaugeChart
            value={achievementPct}
            title={lang === 'om' ? 'Raawwii Facaasaa Naannoo' : 'Regional Sowing Achievement'}
            subtitle={`${totals.sownAreaHa.toLocaleString()} ha sown / ${totals.plannedAreaHa.toLocaleString()} ha planned`}
            color="#10b981"
            size={180}
          />
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
            <span>{lang === 'om' ? 'Hafu:' : 'Remaining:'}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {(totals.plannedAreaHa - totals.sownAreaHa).toLocaleString()} ha
            </span>
          </div>
        </div>

        {/* Weekly Sowing Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Adeemsa Facaasaa Torbaniin' : 'Weekly Sowing Trend (Area Sown This Week)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Hanga lafa facaasaa torbee torbeen raawwatame (ha)' : 'Campaign momentum over 8 reporting weeks (hectares/week)'}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded">
              Peak: 890,000 ha/wk
            </span>
          </div>

          <TrendLineChart
            labels={weeklyLabels}
            points={weeklySownHa}
            color="#10b981"
            unit="ha"
            height={160}
          />
        </div>
      </div>

      {/* Main Clustered Column Chart: Planned vs Prepared vs Sown */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om'
                ? 'A. Karoora vs Qophii vs Facaasaa Lafaa (Godinaaleen)'
                : 'A. Planned vs Prepared vs Sown Area (By Zone / City)'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Hectares (hek) godinoota 14 irratti calaqqisu' : 'Clustered column comparison across all administrative zones'}
            </p>
          </div>
        </div>

        <ClusteredColumnChart
          categories={zoneCategories}
          series={clusteredSeries}
          height={280}
          unit="ha"
        />
      </div>

      {/* Progress Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'om' ? 'Gabatee Adeemsa Facaasaa fi GPS Mirkanaa\'e' : 'Zone-by-Zone Area Coverage & GPS Verification Matrix'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Godina / City</th>
                <th className="p-3">Planned (ha)</th>
                <th className="p-3">Prepared (ha)</th>
                <th className="p-3">Sown (ha)</th>
                <th className="p-3">Achievement %</th>
                <th className="p-3">GPS Verified (ha)</th>
                <th className="p-3">% GPS Verified</th>
                <th className="p-3">Woredas Sowing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {zones.map(z => {
                const ach = (z.sownAreaHa / (z.plannedAreaHa || 1)) * 100;
                const gpsPct = (z.gpsVerifiedAreaHa / (z.sownAreaHa || 1)) * 100;
                return (
                  <tr key={z.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-sans font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {lang === 'om' ? z.name : z.nameEn}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{(z.plannedAreaHa ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-blue-600 dark:text-blue-400">{(z.preparedAreaHa ?? 0).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {(z.sownAreaHa ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${ach >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {ach.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{(z.gpsVerifiedAreaHa ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-sky-600 dark:text-sky-400">{gpsPct.toFixed(1)}%</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{z.woredasStarted ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
