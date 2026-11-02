import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { DonutChart, GaugeChart, ClusteredColumnChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { ShieldCheck, Briefcase, Users, Layers } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const ClusterAndInvestorDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  // 1. Cluster Farming
  const totalClusters = totals.clustersEstablished;
  const totalClusterAreaHa = totals.clusterAreaHa;
  const totalSownAreaHa = totals.sownAreaHa;
  const nonClusterAreaHa = Math.max(0, totalSownAreaHa - totalClusterAreaHa);
  const clusterContributionPct =
    totalSownAreaHa > 0 ? (totalClusterAreaHa / totalSownAreaHa) * 100 : 0;

  const clusterHouseholdsMale = zones.reduce((s, z) => s + z.clusterHouseholdsMale, 0);
  const clusterHouseholdsFemale = zones.reduce((s, z) => s + z.clusterHouseholdsFemale, 0);

  const clusterContributionPieData = [
    { label: lang === 'om' ? 'Qonna Kilaastaraa (Cluster Area)' : 'Cluster Area', value: totalClusterAreaHa, color: '#10b981' },
    { label: lang === 'om' ? 'Kilaastaraan Alatti (Non-Cluster)' : 'Non-Cluster Area', value: nonClusterAreaHa, color: '#94a3b8' },
  ];

  // Clusters by Zone Bar Chart
  const topClusterZones = [...zones]
    .sort((a, b) => b.clustersEstablished - a.clustersEstablished)
    .slice(0, 8);
  const clusterZoneNames = topClusterZones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const clusterZoneSeries = [
    {
      name: lang === 'om' ? 'Baay\'ina Kilaastaraa' : 'Clusters Established',
      data: topClusterZones.map(z => z.clustersEstablished),
      color: '#10b981',
    },
    {
      name: lang === 'om' ? 'Bal\'ina (x100 ha)' : 'Area (x100 ha)',
      data: topClusterZones.map(z => Math.round(z.clusterAreaHa / 100)),
      color: '#6366f1',
    },
  ];

  // 2. Private Investor Dashboard
  const totalInvestors = totals.investorCount;
  const investorPreparedHa = zones.reduce((s, z) => s + z.investorPreparedHa, 0);
  const investorSownHa = totals.investorSownHa;
  const investorContributionPct =
    totalSownAreaHa > 0 ? (investorSownHa / totalSownAreaHa) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 8. Cluster Farming Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {lang === 'om' ? '8. Qonna Kilaastaraa (Cluster Farming Dashboard)' : '8. Cluster Farming Dashboard (Section 3B)'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Hundeeffama kilaastarootaa, bal\'ina lafaa fi hirmaannaa maatii'
                : 'Commercial clusters established, contiguous land coverage, and participating households'}
            </p>
          </div>
        </div>

        {/* 4 Cluster KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Kilaastara Hundeeffame' : 'Clusters Established'}</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {totalClusters.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Organized commercial farming units</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Bal\'ina Lafa Kilaastaraa' : 'Cluster Area'}</span>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {totalClusterAreaHa.toLocaleString()} ha
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{clusterContributionPct.toFixed(1)}% of total wheat sown</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Qonnaan Bulaa Kilaastaraa' : 'Farmers in Clusters'}</span>
            <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {(clusterHouseholdsMale + clusterHouseholdsFemale).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Household beneficiaries</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Dubartoota Kilaastara Keessaa' : 'Female Farmers in Clusters'}</span>
            <div className="text-2xl font-bold font-mono text-pink-600 dark:text-pink-400 mt-1 tabular-nums">
              {clusterHouseholdsFemale.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {((clusterHouseholdsFemale / (clusterHouseholdsMale + clusterHouseholdsFemale || 1)) * 100).toFixed(1)}% gender inclusion
            </span>
          </div>
        </div>

        {/* Charts: Clusters by Zone + Cluster Contribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Kilaastara Godinaaleen (Clusters by Zone)' : 'Clusters by Zone (Top 8 Producing Zones)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Baay\'ina kilaastaraa fi bal\'ina lafa qabame' : 'Number of active clusters and area covered'}
              </p>
            </div>
            <ClusteredColumnChart
              categories={clusterZoneNames}
              series={clusterZoneSeries}
              height={220}
              unit=""
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Gumaacha Kilaastaraa (%)' : 'Cluster Contribution to Total Area'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Cluster Area / Total Sown Area' : 'Contiguous cluster share vs individual small plots'}
              </p>
            </div>
            <DonutChart data={clusterContributionPieData} totalLabel="Total Sown" unit="ha" size={160} />
          </div>
        </div>
      </div>

      {/* 9. Private Investor Dashboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-rose-600" />
              {lang === 'om' ? '9. Abbootii Qabeenyaa Dhuunfaa (Private Investor Dashboard)' : '9. Private Investor Dashboard (Commercial Wheat Farms)'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Ragaa abbootii qabeenyaa misooma qamadii bonaa keessatti hirmaatan'
                : 'Investor count, land prepared, sown area, and commercial contribution ratio'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Investor Contribution Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <GaugeChart
              value={investorContributionPct}
              title={lang === 'om' ? 'Gumaacha Abbootii Qabeenyaa' : 'Investor Contribution %'}
              subtitle={`${investorSownHa.toLocaleString()} ha investor / ${totalSownAreaHa.toLocaleString()} ha sown`}
              color="#f43f5e"
              size={170}
            />
            <div className="mt-3 text-center text-xs text-slate-500">
              Formula: Investor Area / Total Sown Area × 100
            </div>
          </div>

          {/* Investor Metrics 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">
              {lang === 'om' ? 'Baay\'ina Abbootii Qabeenyaa' : 'Total Investors Operating'}
            </span>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {totalInvestors.toLocaleString()}
              </span>
              <p className="text-xs text-slate-500 mt-1">Commercial farm developers registered</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              Avg per investor: {Math.round(investorSownHa / (totalInvestors || 1))} ha
            </div>
          </div>

          {/* Investor Metrics 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">
              {lang === 'om' ? 'Lafa Qophaa\'e (Investor)' : 'Investor Land Prepared'}
            </span>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {investorPreparedHa.toLocaleString()} ha
              </span>
              <p className="text-xs text-slate-500 mt-1">100% mechanized preparation</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              Sowing rate: {((investorSownHa / (investorPreparedHa || 1)) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Investor Metrics 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">
              {lang === 'om' ? 'Lafa Faca\'e (Investor)' : 'Investor Land Sown'}
            </span>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {investorSownHa.toLocaleString()} ha
              </span>
              <p className="text-xs text-slate-500 mt-1">Modern pump & center-pivot coverage</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              Expected output: {(investorSownHa * 46).toLocaleString()} q
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
