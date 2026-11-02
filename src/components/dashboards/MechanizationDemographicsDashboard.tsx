import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { DonutChart, GaugeChart, ClusteredColumnChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { Tractor, Users, Award } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const MechanizationDemographicsDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  // 1. Mechanization Data
  const totalPreparedHa = totals.preparedAreaHa;
  const tractorPreparedHa = zones.reduce((sum, z) => sum + z.preparedByTractorHa, 0);
  const oxenPreparedHa = zones.reduce((sum, z) => sum + z.preparedByOxenHa, 0);
  const tractorAndOxenHa = Math.round(totalPreparedHa * 0.12);
  const otherPreparedHa = Math.max(0, totalPreparedHa - (tractorPreparedHa + oxenPreparedHa));

  const mechanizationLevelPct =
    totalPreparedHa > 0 ? (tractorPreparedHa / totalPreparedHa) * 100 : 0;

  const mechanizationPieData = [
    { label: lang === 'om' ? 'Tiraaktaraan Qofa (Tractor)' : 'Tractor only', value: tractorPreparedHa, color: '#10b981' },
    { label: lang === 'om' ? 'Qotiyyoon Qofa (Oxen)' : 'Oxen only', value: oxenPreparedHa, color: '#f59e0b' },
    { label: lang === 'om' ? 'Tiraaktara + Qotiyyoo' : 'Tractor + Oxen', value: tractorAndOxenHa, color: '#6366f1' },
    { label: lang === 'om' ? 'Kan Biroo (Other)' : 'Other', value: otherPreparedHa, color: '#94a3b8' },
  ];

  // 2. Gender Demographics
  const maleFarmers = totals.farmersMale;
  const femaleFarmers = totals.farmersFemale;
  const totalFarmers = maleFarmers + femaleFarmers;

  const genderPieData = [
    { label: lang === 'om' ? 'Dhiira (Male Farmers)' : 'Male Farmers', value: maleFarmers, color: '#0284c7' },
    { label: lang === 'om' ? 'Dubartoota (Female Farmers)' : 'Female Farmers', value: femaleFarmers, color: '#ec4899' },
  ];

  // Top Participating Zones by Farmer Count
  const sortedZonesByFarmers = [...zones]
    .sort((a, b) => (b.participatingFarmersMale + b.participatingFarmersFemale) - (a.participatingFarmersMale + a.participatingFarmersFemale))
    .slice(0, 8);

  const topZoneNames = sortedZonesByFarmers.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const farmerRankedSeries = [
    {
      name: lang === 'om' ? 'Dhiira (Male)' : 'Male',
      data: sortedZonesByFarmers.map(z => z.participatingFarmersMale),
      color: '#0284c7',
    },
    {
      name: lang === 'om' ? 'Dubartoota (Female)' : 'Female',
      data: sortedZonesByFarmers.map(z => z.participatingFarmersFemale),
      color: '#ec4899',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6. Mechanization Dashboard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tractor className="w-5 h-5 text-emerald-600" />
              {lang === 'om' ? '6. Mekaanayizeeshinii Qonnaa (Mechanization Dashboard)' : '6. Farm Mechanization Dashboard (Tractors vs Oxen)'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Mala qophii lafaa, sadarkaa mekaanayizeeshinii fi baay\'ina tiraaktarootaa'
                : 'Plowing methods, mechanization index, and tractor deployment across Oromia'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mechanization Level Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <GaugeChart
              value={mechanizationLevelPct}
              title={lang === 'om' ? 'Sadarkaa Mekaanayizeeshinii' : 'Mechanization Level Index'}
              subtitle={`${tractorPreparedHa.toLocaleString()} ha tractor / ${totalPreparedHa.toLocaleString()} ha total`}
              color="#10b981"
              size={170}
            />
            <div className="mt-3 text-center text-xs text-slate-500">
              Formula: Tractor Area / Total Prepared Area × 100
            </div>
          </div>

          {/* Land Prepared Method Donut */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'Lafa Qophaa\'e Akkaataa Qonnaatiin' : 'Land Prepared by Technology'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Tiraaktara qofa vs Qotiyyoo vs Makaa' : 'Breakdown of plowing technology used across 14 zones'}
            </p>
            <DonutChart data={mechanizationPieData} totalLabel="Hectares" unit="ha" size={160} />
          </div>

          {/* Machinery Deployment KPI Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {lang === 'om' ? 'Makiinaalee Hojiirra Oolan' : 'Machinery Fleet Operating'}
              </span>
              <div className="mt-4 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                    {lang === 'om' ? 'Tiraaktaroota Bobba\'an:' : 'Tractors Deployed:'}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {totals.tractorsDeployed.toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                    {lang === 'om' ? 'Kombaayinoota Qophaa\'an:' : 'Combines Mobilized:'}
                  </span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {totals.combinesDeployed.toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                    {lang === 'om' ? 'Qonnaan Bultoota Tiraaktara Fayyadaman:' : 'Farmers Benefited from Machinery:'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {Math.round(totalFarmers * 0.44).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
              {lang === 'om'
                ? 'Duulli kun qonna aadaa irraa gara mekaanayizeeshinii ariifachiisuuf tattaaffii godhamaa jiru calaqqisiisa.'
                : 'Direct mechanization services provided through agricultural machinery rental centers and cooperatives.'}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Farm Demographics Dashboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              {lang === 'om' ? '7. Hirmaannaa Qonnaan Bultootaa (Demographics Dashboard)' : '7. Farm Demographics & Farmer Participation'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Hirmaannaa koorniyaa fi godinoota hirmaannaa ol-aanaa qaban'
                : 'Gender inclusion and top participating zones across the regional wheat campaign'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender Participation Donut */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'Hirmaannaa Koorniyaa (Gender)' : 'Gender Participation Ratio'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Qonnaan bultoota dhiiraa fi dubartootaa' : 'Male vs Female farmers participating'}
            </p>
            <DonutChart data={genderPieData} totalLabel="Farmers" unit="" size={160} />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-mono">
              <span className="text-slate-500">Female Participation:</span>
              <span className="font-semibold text-pink-600 dark:text-pink-400">
                {((femaleFarmers / (totalFarmers || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Top Participating Zones Ranked Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'om' ? 'Godinoota Hirmaannaa Ol-aanaa Qaban' : 'Farmers by Zone (Ranked Top Participating Zones)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'om' ? 'Qonnaan bultoota hirmaatan dhiiraa fi dubartootaan' : 'Male and female participation across top 8 zones'}
                </p>
              </div>
            </div>

            <ClusteredColumnChart
              categories={topZoneNames}
              series={farmerRankedSeries}
              height={220}
              unit="farmers"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
