import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { ClusteredColumnChart, GaugeChart, DonutChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { Users, Megaphone, CheckCircle2, TrendingUp, Award, Layers } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const MobilizationDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  const mobPlannedZoneLeaders = zones.reduce((s, z) => s + (z.mobPlannedZoneLeaders || 0), 0);
  const mobActualZoneLeaders = zones.reduce((s, z) => s + (z.mobActualZoneLeaders || 0), 0);

  const mobPlannedWoredaLeaders = zones.reduce((s, z) => s + (z.mobPlannedWoredaLeaders || 0), 0);
  const mobActualWoredaLeaders = zones.reduce((s, z) => s + (z.mobActualWoredaLeaders || 0), 0);

  const mobPlannedExperts = zones.reduce((s, z) => s + (z.mobPlannedExperts || 0), 0);
  const mobActualExperts = zones.reduce((s, z) => s + (z.mobActualExperts || 0), 0);

  const mobPlannedKebeleLeaders = zones.reduce((s, z) => s + (z.mobPlannedKebeleLeaders || 0), 0);
  const mobActualKebeleLeaders = zones.reduce((s, z) => s + (z.mobActualKebeleLeaders || 0), 0);

  const mobPlannedHmh = zones.reduce((s, z) => s + (z.mobPlannedHmh || 0), 0);
  const mobActualHmh = zones.reduce((s, z) => s + (z.mobActualHmh || 0), 0);

  const mobPlannedFarmers = zones.reduce((s, z) => s + (z.mobPlannedFarmers || 0), 0);
  const mobActualFarmers = zones.reduce((s, z) => s + (z.mobActualFarmers || 0), 0);

  const totalPlannedAll =
    mobPlannedZoneLeaders +
    mobPlannedWoredaLeaders +
    mobPlannedExperts +
    mobPlannedKebeleLeaders +
    mobPlannedHmh +
    mobPlannedFarmers;

  const totalActualAll =
    mobActualZoneLeaders +
    mobActualWoredaLeaders +
    mobActualExperts +
    mobActualKebeleLeaders +
    mobActualHmh +
    mobActualFarmers;

  const overallAchievementPct =
    totalPlannedAll > 0 ? (totalActualAll / totalPlannedAll) * 100 : 0;

  const totalEvents = zones.reduce((s, z) => s + (z.mobEventsCount || 0), 0);

  // Mobilization by Level Pie Data
  const stakeholderBreakdown = [
    { label: lang === 'om' ? 'Q/H/Bultoota (Farmers)' : 'Farmers & Pastoralists', value: mobActualFarmers, color: '#10b981' },
    { label: lang === 'om' ? 'HMH (Misooma Hawaasaa)' : 'HMH / Dev. Groups', value: mobActualHmh, color: '#0284c7' },
    { label: lang === 'om' ? 'Caasaa Gandaa (Kebele)' : 'Kebele Leadership', value: mobActualKebeleLeaders, color: '#8b5cf6' },
    { label: lang === 'om' ? 'Ogeessota (Experts)' : 'Agronomists & DAs', value: mobActualExperts, color: '#f59e0b' },
    { label: lang === 'om' ? 'Hoggantoota Aanaa & Godinaa' : 'Woreda & Zone Leaders', value: mobActualWoredaLeaders + mobActualZoneLeaders, color: '#ec4899' },
  ];

  // Mobilization Clustered Column: Planned vs Actual by Zone
  const zoneNames = zones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const mobZoneSeries = [
    {
      name: lang === 'om' ? 'Karoora (Planned)' : 'Planned Mobilized',
      data: zones.map(
        z =>
          (z.mobPlannedZoneLeaders || 0) +
          (z.mobPlannedWoredaLeaders || 0) +
          (z.mobPlannedExperts || 0) +
          (z.mobPlannedKebeleLeaders || 0) +
          (z.mobPlannedHmh || 0) +
          (z.mobPlannedFarmers || 0)
      ),
      color: '#94a3b8',
    },
    {
      name: lang === 'om' ? 'Raawwii (Actual)' : 'Actual Mobilized',
      data: zones.map(
        z =>
          (z.mobActualZoneLeaders || 0) +
          (z.mobActualWoredaLeaders || 0) +
          (z.mobActualExperts || 0) +
          (z.mobActualKebeleLeaders || 0) +
          (z.mobActualHmh || 0) +
          (z.mobActualFarmers || 0)
      ),
      color: '#10b981',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-600" />
            {lang === 'om'
              ? 'Section 0: Sosoochii Sadarkaa Adda Addaa (Mobilization Dashboard)'
              : 'Section 0: Multi-Level Campaign Mobilization Dashboard'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'om'
              ? 'Ragaa sosoochii sadarkaa Godinaa, Aanaa fi Gandaatti Hoggantoota, Ogeessota, HMH fi Qonnaan Bulaan gaggeeffame'
              : 'Mobilization outreach tracking across Zonal, Woreda, and Kebele levels from soosochii.csv & Kobo Form 0'}
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
          Kobo Form: aVxPXQ7oEXk7NRgEwCgxdk
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Koreewwan / Maroota' : 'Mobilization Events'}</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {totalEvents.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Town halls, field rallies & forums</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Karoora Waliigalaa' : 'Total Planned Stakeholders'}</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {totalPlannedAll.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across all 3 administrative tiers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Raawwii Sosoochii' : 'Actual Mobilized'}</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalActualAll.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono font-medium">
            {overallAchievementPct.toFixed(1)}% of campaign target
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Qonnaan Bulaa Sosso\'e' : 'Farmers Mobilized'}</span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {mobActualFarmers.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {((mobActualFarmers / (mobPlannedFarmers || 1)) * 100).toFixed(1)}% farmer mobilization rate
          </span>
        </div>
      </div>

      {/* Row 2: Gauge & Stakeholder Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Mobilization Achievement Gauge */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <GaugeChart
            value={overallAchievementPct}
            title={lang === 'om' ? 'Raawwii Sosoochii Naannoo' : 'Campaign Mobilization Rate'}
            subtitle={`${totalActualAll.toLocaleString()} mobilized / ${totalPlannedAll.toLocaleString()} planned`}
            color="#10b981"
            size={180}
          />
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
            <span>{lang === 'om' ? 'Garaagarummaa:' : 'Variance:'}</span>
            <span className="font-semibold text-emerald-600">
              {(totalActualAll - totalPlannedAll).toLocaleString()} ({overallAchievementPct >= 100 ? '+Surplus' : '-Gap'})
            </span>
          </div>
        </div>

        {/* Stakeholder Category Donut */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            {lang === 'om' ? 'Qoodama Hirmaattota Sosoochii' : 'Mobilized Stakeholders by Tier'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'om' ? 'Farmers, HMH, Kebele, Ogeessota, Hoggantoota' : 'Breakdown by governance and community level'}
          </p>
          <DonutChart data={stakeholderBreakdown} totalLabel="Actors" unit="" size={160} />
        </div>

        {/* 3 Administrative Levels Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {lang === 'om' ? 'Sadarkaalee Sosoochii Sadeen' : 'Three Mobilization Tiers'}
            </span>
            <div className="space-y-3.5 mt-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">1. Sadarkaa Godinaa (Zone Level)</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {((mobActualZoneLeaders + mobActualWoredaLeaders) / (mobPlannedZoneLeaders + mobPlannedWoredaLeaders || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Plan: {(mobPlannedZoneLeaders + mobPlannedWoredaLeaders).toLocaleString()} · Actual: {(mobActualZoneLeaders + mobActualWoredaLeaders).toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">2. Sadarkaa Aanaa (Woreda Level)</span>
                  <span className="font-mono text-indigo-600 font-bold">
                    {(mobActualExperts / (mobPlannedExperts || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Plan: {mobPlannedExperts.toLocaleString()} Experts · Actual: {mobActualExperts.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">3. Sadarkaa Gandaattii (Kebele & HMH)</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {((mobActualFarmers + mobActualHmh) / (mobPlannedFarmers + mobPlannedHmh || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Plan: {(mobPlannedFarmers + mobPlannedHmh).toLocaleString()} · Actual: {(mobActualFarmers + mobActualHmh).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Mobilization focused on timely seed distribution, land preparation, and irrigation cycle enforcement.
          </p>
        </div>
      </div>

      {/* Row 3: Mobilization by Zone Clustered Column Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'om' ? 'Sosoochii Godinaaleen (Planned vs Actual by Zone)' : 'Mobilization by Zone & City (Planned vs Actual Participants)'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'om' ? 'Ida\'ama hirmaattota sadarkaa hunda jiran godinoota 14 irratti' : 'Total mobilized community and leadership actors across 14 zones'}
          </p>
        </div>
        <ClusteredColumnChart
          categories={zoneNames}
          series={mobZoneSeries}
          height={260}
          unit="actors"
        />
      </div>

      {/* Row 4: Detailed Mobilization Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'om' ? 'Gabatee Sosoochii Sadarkaa Adda Addaa (Section 0 Matrix)' : 'Section 0: Detailed Multi-Level Mobilization Progress Table'}
          </h3>
          <span className="text-xs font-mono text-slate-500">14 Zones & Cities</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5">Zone / City</th>
                <th className="p-2.5">Events</th>
                <th className="p-2.5">Zone Leaders (P / A)</th>
                <th className="p-2.5">Woreda Leaders (P / A)</th>
                <th className="p-2.5">Experts (P / A)</th>
                <th className="p-2.5">Kebele Leaders (P / A)</th>
                <th className="p-2.5">HMH Teams (P / A)</th>
                <th className="p-2.5">Farmers (P / A)</th>
                <th className="p-2.5">Achievement %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {zones.map(z => {
                const pTotal =
                  (z.mobPlannedZoneLeaders || 0) +
                  (z.mobPlannedWoredaLeaders || 0) +
                  (z.mobPlannedExperts || 0) +
                  (z.mobPlannedKebeleLeaders || 0) +
                  (z.mobPlannedHmh || 0) +
                  (z.mobPlannedFarmers || 0);

                const aTotal =
                  (z.mobActualZoneLeaders || 0) +
                  (z.mobActualWoredaLeaders || 0) +
                  (z.mobActualExperts || 0) +
                  (z.mobActualKebeleLeaders || 0) +
                  (z.mobActualHmh || 0) +
                  (z.mobActualFarmers || 0);

                const achPct = pTotal > 0 ? (aTotal / pTotal) * 100 : 0;

                return (
                  <tr key={z.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {lang === 'om' ? z.name : z.nameEn}
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{(z.mobEventsCount ?? 0).toLocaleString()}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {(z.mobPlannedZoneLeaders ?? 0).toLocaleString()} / <strong className="text-slate-900 dark:text-slate-100">{(z.mobActualZoneLeaders ?? 0).toLocaleString()}</strong>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {(z.mobPlannedWoredaLeaders ?? 0).toLocaleString()} / <strong className="text-slate-900 dark:text-slate-100">{(z.mobActualWoredaLeaders ?? 0).toLocaleString()}</strong>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {(z.mobPlannedExperts ?? 0).toLocaleString()} / <strong className="text-slate-900 dark:text-slate-100">{(z.mobActualExperts ?? 0).toLocaleString()}</strong>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {(z.mobPlannedKebeleLeaders ?? 0).toLocaleString()} / <strong className="text-slate-900 dark:text-slate-100">{(z.mobActualKebeleLeaders ?? 0).toLocaleString()}</strong>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {(z.mobPlannedHmh ?? 0).toLocaleString()} / <strong className="text-slate-900 dark:text-slate-100">{(z.mobActualHmh ?? 0).toLocaleString()}</strong>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {(z.mobPlannedFarmers ?? 0).toLocaleString()} / <strong className="text-emerald-600 dark:text-emerald-400">{(z.mobActualFarmers ?? 0).toLocaleString()}</strong>
                    </td>
                    <td className="p-2.5">
                      <span className={`font-bold ${achPct >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {achPct.toFixed(1)}%
                      </span>
                    </td>
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
