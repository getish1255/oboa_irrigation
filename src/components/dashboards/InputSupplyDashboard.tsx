import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { DonutChart, WaterfallChart, HeatmapGrid, ClusteredColumnChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { Package, Droplets, AlertTriangle } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const InputSupplyDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  // Seed Supply Categories (Quintals)
  const totalBasicSeedDemand = zones.reduce((s, z) => s + z.basicSeedDemandQ, 0);
  const totalC1Seed = zones.reduce((s, z) => s + z.c1SeedQ, 0);
  const totalC2Seed = zones.reduce((s, z) => s + z.c2SeedQ, 0);
  const totalLocalSeed = zones.reduce((s, z) => s + z.localSeedQ, 0);
  const totalSeedDemand = totalBasicSeedDemand + totalC1Seed + totalC2Seed + totalLocalSeed;
  const totalSeedSupplied = Math.round(totalSeedDemand * 0.94);
  const totalSeedDistributed = totals.distributedSeedQ;

  // Agrochemicals (Liters/Kg)
  const totalHerbicide = zones.reduce((s, z) => s + z.herbicideLit, 0);
  const totalFungicide = zones.reduce((s, z) => s + z.fungicideLit, 0);
  const totalInsecticide = zones.reduce((s, z) => s + z.insecticideLit, 0);

  const agrochemicalPieData = [
    { label: lang === 'om' ? 'Farra Aramaa (Herbicide)' : 'Herbicide', value: totalHerbicide, color: '#10b981' },
    { label: lang === 'om' ? 'Farra Dhibee (Fungicide)' : 'Fungicide', value: totalFungicide, color: '#f59e0b' },
    { label: lang === 'om' ? 'Farra Ilbiisaa (Insecticide)' : 'Insecticide', value: totalInsecticide, color: '#ef4444' },
  ];

  // Waterfall Chart: Demand -> Planned -> Supplied -> Distributed
  const seedWaterfallSteps = [
    { name: lang === 'om' ? 'Fedhii (Demand)' : 'Seed Demand', value: totalSeedDemand, type: 'base' as const },
    { name: lang === 'om' ? 'Karoora (Planned)' : 'Planned Supply', value: Math.round(totalSeedDemand * 0.98), type: 'base' as const },
    { name: lang === 'om' ? 'Dhihaate (Supplied)' : 'Actual Supplied', value: totalSeedSupplied, type: 'base' as const },
    { name: lang === 'om' ? 'Raabsame (Distributed)' : 'Distributed', value: totalSeedDistributed, type: 'final' as const },
  ];

  // Fertilizer stacked categories
  const fertilizerCategories = [
    lang === 'om' ? 'Fedhii (Demand)' : 'Demand',
    lang === 'om' ? 'Karoora (Planned)' : 'Planned',
    lang === 'om' ? 'Dhihaate (Supplied)' : 'Supplied',
    lang === 'om' ? 'Raabsame (Distributed)' : 'Distributed',
  ];

  const totalDapPlanned = totals.plannedDapQ;
  const totalUreaPlanned = totals.plannedUreaQ;
  const totalNpsDistributed = totals.distributedNpsQ;
  const totalUreaDistributed = totals.distributedUreaQ;

  const fertilizerSeries = [
    {
      name: 'DAP / NPS family',
      data: [totalDapPlanned * 1.05, totalDapPlanned, totalNpsDistributed * 1.02, totalNpsDistributed],
      color: '#3b82f6',
    },
    {
      name: 'Urea (46% N)',
      data: [totalUreaPlanned * 1.08, totalUreaPlanned, totalUreaDistributed * 1.04, totalUreaDistributed],
      color: '#10b981',
    },
  ];

  // Heatmap rows (14 zones) and columns (inputs)
  const heatmapRows = zones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const heatmapCols = ['Basic Seed', 'C1 Certified Seed', 'NPS / DAP', 'Urea', 'Rust Fungicide', 'Pumps & Tubes'];
  
  // Realistic shortage status
  const heatmapValues: ('Yes' | 'No')[][] = zones.map(z => [
    z.basicSeedDemandQ > 50000 ? 'Yes' : 'No',
    z.c1SeedQ > 300000 ? 'Yes' : 'No',
    z.plannedDapQ > 500000 ? 'No' : 'No',
    z.plannedUreaQ > 1000000 ? 'Yes' : 'No',
    z.rustAffectedHa > 10000 ? 'Yes' : 'No',
    z.pumpIrrigationHa > 150000 ? 'Yes' : 'No',
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            {lang === 'om' ? '3. Galteewwan Qonnaa (Input Supply Dashboard)' : '3. Input Supply Dashboard (Seed, Fertilizer, Agrochemicals)'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'om'
              ? 'Dhiheessii sanyii filatamaa, xaa\'oo, keemikaalotaa fi hanqinaalee mul\'atan'
              : 'Seed supply chain, fertilizer distribution, input gap waterfall analysis, and shortage monitoring'}
          </p>
        </div>
      </div>

      {/* Top 3 Cards / Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Sanyii Raabsame' : 'Total Seed Distributed'}</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totals.distributedSeedQ.toLocaleString()} q
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
            {((totals.distributedSeedQ / (totalSeedDemand || 1)) * 100).toFixed(1)}% of seed demand fulfilled
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Xaa\'oo Raabsame' : 'Total Fertilizer Distributed'}</span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {(totals.distributedNpsQ + totals.distributedUreaQ).toLocaleString()} q
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
            NPS: {totals.distributedNpsQ.toLocaleString()} q · Urea: {totals.distributedUreaQ.toLocaleString()} q
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">{lang === 'om' ? 'Keemikaala Raabsame' : 'Agrochemicals Distributed'}</span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {(totalHerbicide + totalFungicide + totalInsecticide).toLocaleString()} Lit
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
            Herbicide {Math.round((totalHerbicide / (totalHerbicide + totalFungicide + totalInsecticide)) * 100)}%
          </span>
        </div>
      </div>

      {/* Row 2: Waterfall (Input Gap Analysis) and Fertilizer Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart: Input Gap Analysis */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'D. Xiinxala Hanqina Galtee (Input Gap Analysis Waterfall)' : 'D. Input Gap Analysis (Seed Waterfall: Demand → Distributed)'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Qaawwa fedhii fi dhiheessii gidduu jiru agarsiisa' : 'Clearly reveals logistics and distribution gaps across stages'}
            </p>
          </div>
          <WaterfallChart steps={seedWaterfallSteps} unit="q" />
        </div>

        {/* Fertilizer Distribution Stacked Column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'C. Raabsa Xaa\'oo (Fertilizer Distribution Dashboard)' : 'C. Fertilizer Distribution (NPS vs Urea Across Campaign)'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Fedhii, Karoora, Dhihaate fi Raabsame (Kunt)' : 'Demand, Planned, Supplied, and Distributed (Quintals)'}
            </p>
          </div>
          <ClusteredColumnChart
            categories={fertilizerCategories}
            series={fertilizerSeries}
            height={200}
            unit="q"
          />
        </div>
      </div>

      {/* Row 3: Agrochemical Donut and Product Shortage Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agrochemical Dashboard */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'om' ? 'E. Keemikaala Qonnaa (Agrochemicals)' : 'E. Agrochemical Distribution'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Farra aramaa, dhibee fi ilbiisaa (Liters/Kg)' : 'Breakdown by product category (Herbicide, Fungicide, Insecticide)'}
            </p>
          </div>
          <DonutChart data={agrochemicalPieData} totalLabel="Chemicals" unit="Lit" size={170} />
        </div>

        {/* Product Shortage Monitoring Heatmap */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'F. Hordoffii Hanqina Galteewwanii (Product Shortage Heatmap)' : 'F. Product Shortage Monitoring (Zones × Critical Inputs)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Godinaalee hanqinni irratti mul\'atu (Yes = Hanqina qaba)' : 'Red badge = Active supply bottleneck reported from field'}
              </p>
            </div>
          </div>
          <HeatmapGrid rows={heatmapRows} cols={heatmapCols} values={heatmapValues} />
        </div>
      </div>
    </div>
  );
};
