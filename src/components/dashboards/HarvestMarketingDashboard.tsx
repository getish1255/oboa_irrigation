import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { DonutChart, GaugeChart, ClusteredColumnChart, TrendLineChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { Award, ShoppingCart, TrendingUp, DollarSign, Layers } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const HarvestMarketingDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  // 12. Harvest Indicators
  const totalHarvestedHa = totals.harvestedAreaHa;
  const totalReadyHa = zones.reduce((s, z) => s + z.readyForHarvestHa, 0);
  const totalSownHa = totals.sownAreaHa;
  const harvestProgressPct =
    totalReadyHa > 0 ? (totalHarvestedHa / totalReadyHa) * 100 : 0;

  const harvestedByCombineHa = zones.reduce((s, z) => s + z.harvestedByCombineHa, 0);
  const harvestedByHandHa = zones.reduce((s, z) => s + z.harvestedByHandHa, 0);
  const harvestedOtherHa = Math.max(0, totalHarvestedHa - (harvestedByCombineHa + harvestedByHandHa));

  const harvestMethodPieData = [
    { label: lang === 'om' ? 'Kombaayiniin (Combine)' : 'Combine Harvester', value: harvestedByCombineHa, color: '#10b981' },
    { label: lang === 'om' ? 'Harkaan (Manual)' : 'Manual Hand Sickle', value: harvestedByHandHa, color: '#f59e0b' },
    { label: lang === 'om' ? 'Kan Biroo (Other)' : 'Other', value: harvestedOtherHa, color: '#94a3b8' },
  ];

  // Top 10 Productivity Ranking (avg yield q/ha)
  const sortedByYield = [...zones].sort((a, b) => b.avgYieldQHa - a.avgYieldQHa).slice(0, 10);
  const topYieldZoneNames = sortedByYield.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const topYieldSeries = [
    {
      name: lang === 'om' ? 'Oomishtummaa (q/ha)' : 'Avg Yield (q/ha)',
      data: sortedByYield.map(z => z.avgYieldQHa),
      color: '#10b981',
    },
    {
      name: lang === 'om' ? 'Ol-aanaa (Max q/ha)' : 'Max Yield Recorded',
      data: sortedByYield.map(z => z.maxYieldQHa),
      color: '#3b82f6',
    },
  ];

  // Production by Zone (Top 8 zones) in Quintals
  const topProductionZones = [...zones].sort((a, b) => b.expectedProductionQ - a.expectedProductionQ).slice(0, 8);
  const prodZoneNames = topProductionZones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const prodSeries = [
    {
      name: lang === 'om' ? 'Oomisha Eegamu (q)' : 'Expected Production (q)',
      data: topProductionZones.map(z => z.expectedProductionQ),
      color: '#6366f1',
    },
    {
      name: lang === 'om' ? 'Oomisha Argame (q)' : 'Obtained to Date (q)',
      data: topProductionZones.map(z => z.productionObtainedQ),
      color: '#10b981',
    },
  ];

  // 13. Marketing Indicators
  const totalMarketedQ = totals.marketedGrainQ;
  const totalProducedQ = totals.productionObtainedQ || 32000000;
  const marketedPct = totalProducedQ > 0 ? (totalMarketedQ / totalProducedQ) * 100 : 0;

  const totalSeedReservedQ = Math.round(totalProducedQ * 0.12);
  const totalHouseholdQ = Math.round(totalProducedQ * 0.16);
  const totalLossesQ = totals.postHarvestLossQ || Math.round(totalProducedQ * 0.035);
  const totalStockQ = Math.max(0, totalProducedQ - (totalMarketedQ + totalSeedReservedQ + totalHouseholdQ + totalLossesQ));

  const allocationPieData = [
    { label: lang === 'om' ? 'Gabaaf (Marketed Commercial)' : 'Marketed Commercial', value: totalMarketedQ, color: '#10b981' },
    { label: lang === 'om' ? 'Sanyii Kuufame (Seed Reserve)' : 'Seed Reserved', value: totalSeedReservedQ, color: '#3b82f6' },
    { label: lang === 'om' ? 'Qorannaa Maatii (Household)' : 'Household Food', value: totalHouseholdQ, color: '#f59e0b' },
    { label: lang === 'om' ? 'Kuusaa Kaaffee (Stock Reserve)' : 'Stored Stock', value: totalStockQ, color: '#8b5cf6' },
    { label: lang === 'om' ? 'Qisaasa Oomishaa (Losses)' : 'Post-Harvest Losses', value: totalLossesQ, color: '#ef4444' },
  ];

  // Weekly Average Wheat Price Trend (ETB / quintal)
  const priceWeeks = ['Oct W1', 'Oct W2', 'Oct W3', 'Oct W4', 'Nov W1', 'Nov W2', 'Nov W3', 'Nov W4'];
  const pricePoints = [5200, 5100, 4980, 4900, 4850, 4880, 4950, 5050];

  return (
    <div className="space-y-6">
      {/* 12. Harvest Dashboard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              {lang === 'om' ? '12. Sassaabbii Oomishaa & Oomishtummaa (Harvest Dashboard)' : '12. Harvest Progress, Combine Deployment & Yield Dashboard'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Adeemsa haamtuu, oomisha argame, oomishtummaa qamadii (kun/hek) fi kombaayinoota'
                : 'Harvesting pace, yield distribution across zones, and mechanized combine harvesting efficiency'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Harvest Progress Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <GaugeChart
              value={harvestProgressPct}
              title={lang === 'om' ? 'Adeemsa Sassaabbii (Harvest Progress)' : 'Harvest Progress %'}
              subtitle={`${totalHarvestedHa.toLocaleString()} ha harvested / ${totalReadyHa.toLocaleString()} ha ready`}
              color="#d97706"
              size={170}
            />
            <div className="mt-3 text-center text-xs text-slate-500">
              Formula: Harvested / Ready for Harvest × 100
            </div>
          </div>

          {/* Harvest Method Distribution */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'Mala Sassaabbii (Method)' : 'Harvest Method Distribution'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Kombaayinii vs Harkaan haamame' : 'Combine harvesters vs manual sickle harvesting'}
            </p>
            <DonutChart data={harvestMethodPieData} totalLabel="Harvested" unit="ha" size={160} />
          </div>

          {/* Combine Harvester Efficiency Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {lang === 'om' ? 'Kombaayinoota Hojiirra Jiran' : 'Combine Fleet Productivity'}
              </span>
              <div className="mt-3 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-sans">Combines Active:</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {totals.combinesDeployed.toLocaleString()} units
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-sans">Combines Harvested:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {harvestedByCombineHa.toLocaleString()} ha ({((harvestedByCombineHa / (totalHarvestedHa || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-sans">Grain Threshed:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {totals.productionObtainedQ.toLocaleString()} q
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Avg Regional Yield:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {(totals.productionObtainedQ / (totalHarvestedHa || 1)).toFixed(1)} q/ha
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              Combine harvesting reduced grain shattering losses by 8.4% compared to traditional threshing floors.
            </div>
          </div>
        </div>

        {/* Productivity Ranking Top 10 Zones */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Sadarkaa Oomishtummaa (Top 10 Zones by Yield)' : 'Productivity Ranking: Top 10 Zones (Average vs Maximum Yield q/ha)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Quintals per hectare (q/ha) bu\'uura godhate' : 'Yield comparison highlighting high-productivity clusters'}
              </p>
            </div>
          </div>
          <ClusteredColumnChart
            categories={topYieldZoneNames}
            series={topYieldSeries}
            height={220}
            unit="q/ha"
          />
        </div>
      </div>

      {/* 13. Marketing Dashboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              {lang === 'om' ? '13. Gabaa fi Gatii Qamadii (Marketing Dashboard)' : '13. Wheat Marketing, Pricing & Grain Utilization Dashboard'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Qoodama oomishaa (gabaa, sanyii, maatii), gatii torbee fi qisaasa oomisha boodaa'
                : 'Grain allocation, terminal market prices, marketed share %, and post-harvest loss prevention'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Marketed Production Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <GaugeChart
              value={marketedPct}
              title={lang === 'om' ? 'Dhibbeentaa Qamadii Gabaaf Dhiyaate' : 'Marketed Production %'}
              subtitle={`${(totalMarketedQ / 1000000).toFixed(1)}M q marketed / ${(totalProducedQ / 1000000).toFixed(1)}M q obtained`}
              color="#10b981"
              size={170}
            />
            <div className="mt-3 text-center text-xs text-slate-500">
              Formula: Marketed / Production × 100
            </div>
          </div>

          {/* Production Allocation Donut */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'Qoodama Oomisha Qamadii' : 'Production Allocation'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Gabaaf, Sanyiif, Nyaata maatii, Qisaasa' : 'Marketed, seed banks, household & buffer stocks'}
            </p>
            <DonutChart data={allocationPieData} totalLabel="Grain" unit="q" size={160} />
          </div>

          {/* Weekly Wheat Price Dashboard Trend */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'om' ? 'Gatii Qamadii Torbaniin' : 'Wheat Price Trend (ETB/q)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'om' ? 'Gatii giddu-galeessaa gabaa Oromiyaa' : 'Average spot price across regional grain hubs'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                4,950 ETB/q
              </span>
            </div>
            <TrendLineChart
              labels={priceWeeks}
              points={pricePoints}
              color="#10b981"
              unit="ETB"
              height={160}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
