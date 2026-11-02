import React, { useState } from 'react';
import { ZoneRecord, IrrigationScheme, Language } from '../../types';
import { GaugeChart, DonutChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  Layers,
  CheckCircle,
  BarChart3,
  Search,
  Filter,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  lang: Language;
}

export const AdvancedAnalyticsDashboard: React.FC<Props> = ({ zones, schemes, lang }) => {
  const totals = getTotals(zones);
  const [filterCategory, setFilterCategory] = useState<'all' | 'zone' | 'city'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Wheat Self-Sufficiency & Strategic Reserve Calculations
  // Oromia population estimated ~42 Million; annual per-capita wheat consumption ~75 kg = 31.5M quintals
  const regionalDemandQ = 31500000;
  const strategicSeedReserveQ = 16800000;
  const domesticReserveQ = regionalDemandQ + strategicSeedReserveQ;
  const currentTotalOutputQ = totals.expectedProductionQ;
  const nationalExportSurplusQ = Math.max(0, currentTotalOutputQ - domesticReserveQ);
  const selfSufficiencyPct = Math.min(400, (currentTotalOutputQ / regionalDemandQ) * 100);

  const utilizationBreakdown = [
    { label: 'Regional Household Food Consumption', value: regionalDemandQ, color: '#0284c7' },
    { label: 'Strategic Seed & Emergency Reserve', value: strategicSeedReserveQ, color: '#6366f1' },
    { label: 'National Market & Export Surplus', value: nationalExportSurplusQ, color: '#10b981' },
  ];

  // 2. Multi-Section Composite Performance Scorecard (Sections 0 to 7)
  // Each section weighted scientifically:
  // - Sec 0 Mobilization: 10 pts
  // - Sec 1 Inputs (Seed & Fertilizer): 10 pts
  // - Sec 2 Irrigation Facilities: 10 pts
  // - Sec 3A Sowing Progress: 20 pts
  // - Sec 3B Clusters & Investors: 10 pts
  // - Sec 3C Crop Protection: 10 pts
  // - Sec 3D Yield & Production: 15 pts
  // - Sec 4 Marketing & Commercial: 5 pts
  // - Sec 5 Extension Outreach: 5 pts
  // - Sec 6 Employment Created: 5 pts
  // Total = 100 points
  const comprehensiveScores = zones.map(z => {
    // Sec 0: Mobilization Score (max 10)
    const pMob = (z.mobPlannedFarmers || 1) + (z.mobPlannedHmh || 1) + (z.mobPlannedZoneLeaders || 1);
    const aMob = (z.mobActualFarmers || 0) + (z.mobActualHmh || 0) + (z.mobActualZoneLeaders || 0);
    const s0 = Math.min(10, (aMob / pMob) * 10);

    // Sec 1: Inputs Delivery Score (max 10)
    const s1 = Math.min(10, ((z.distributedSeedQ / (z.basicSeedDemandQ + z.c1SeedQ + z.c2SeedQ || 1)) * 5) + ((z.distributedUreaQ / (z.plannedUreaQ || 1)) * 5));

    // Sec 2: Irrigation Facilities Score (max 10)
    const s2 = Math.min(10, ((z.modernIrrigationHa + z.pumpIrrigationHa) / (z.sownAreaHa || 1)) * 10);

    // Sec 3A: Sowing Progress Score (max 20)
    const s3a = Math.min(20, (z.sownAreaHa / (z.plannedAreaHa || 1)) * 20);

    // Sec 3B: Clusters & Investors Score (max 10)
    const s3b = Math.min(10, ((z.clusterAreaHa + z.investorSownHa) / (z.sownAreaHa || 1)) * 10);

    // Sec 3C: Crop Protection Score (max 10)
    const s3c = Math.min(10, (z.chemicalSprayedAreaHa / (z.sownAreaHa || 1)) * 10);

    // Sec 3D: Yield & Production Score (max 15)
    const s3d = Math.min(15, (z.avgYieldQHa / 50) * 15);

    // Sec 4: Marketing Score (max 5)
    const s4 = Math.min(5, (z.marketedGrainQ / (z.expectedProductionQ * 0.5 || 1)) * 5);

    // Sec 5: Extension Score (max 5)
    const s5 = Math.min(5, (z.fieldDaysCount / 40) * 5);

    // Sec 6: Employment Score (max 5)
    const s6 = Math.min(5, ((z.temporaryJobsMale + z.temporaryJobsFemale) / 40000) * 5);

    const totalScore = Math.min(100, Math.round(s0 + s1 + s2 + s3a + s3b + s3c + s3d + s4 + s5 + s6));

    let performanceGrade = 'Outstanding';
    let gradeBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
    if (totalScore < 70) {
      performanceGrade = 'Needs Support';
      gradeBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
    } else if (totalScore < 85) {
      performanceGrade = 'Satisfactory';
      gradeBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
    }

    return {
      id: z.id,
      name: lang === 'om' ? z.name : z.nameEn,
      category: z.category,
      totalScore,
      performanceGrade,
      gradeBadge,
      s0: Number(s0.toFixed(1)),
      s1: Number(s1.toFixed(1)),
      s2: Number(s2.toFixed(1)),
      s3a: Number(s3a.toFixed(1)),
      s3b: Number(s3b.toFixed(1)),
      s3c: Number(s3c.toFixed(1)),
      s3d: Number(s3d.toFixed(1)),
      s4: Number(s4.toFixed(1)),
      s5: Number(s5.toFixed(1)),
      s6: Number(s6.toFixed(1)),
      plannedHa: z.plannedAreaHa,
      sownHa: z.sownAreaHa,
      avgYield: z.avgYieldQHa,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const filteredScorecard = comprehensiveScores.filter(s => {
    const matchCat = filterCategory === 'all' || s.category === filterCategory;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            {lang === 'om'
              ? 'Xiinxala Sadarkaa Ol-aanaa fi Qabxii Waloo Godinootaa'
              : 'Advanced Regional Analytics & Comprehensive Scorecard'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'om'
              ? 'Sadarkaa raawwii godinoota 14 kutaalee hunda irratti (Sections 0 hanga 7) fi wabii nyaataa naannoo'
              : 'Full-spectrum performance evaluation across all sections (0 to 7) and regional food security balance'}
          </p>
        </div>
      </div>

      {/* 1. Self-Sufficiency & Strategic Reserve Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {lang === 'om' ? 'Wabii Nyaataa Qamadii (Self-Sufficiency Tracker)' : 'Regional Wheat Self-Sufficiency & Export Surplus'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Fedhii naannoo fi oomisha hafe biyyoolessaaf dhiyaatu'
                : 'Oromia domestic food demand vs surplus generated for national wheat reserve'}
            </p>
          </div>

          <div className="flex items-center justify-center py-2">
            <GaugeChart
              value={selfSufficiencyPct}
              title={lang === 'om' ? 'Sadarkaa Of-dandeessisuu' : 'Self-Sufficiency Ratio'}
              subtitle={`${(currentTotalOutputQ / 1000000).toFixed(1)}M q produced vs ${(regionalDemandQ / 1000000).toFixed(1)}M q regional consumption`}
              color="#10b981"
              size={180}
            />
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-sans leading-relaxed border border-emerald-200 dark:border-emerald-800/60">
            Oromia achieves <strong>{selfSufficiencyPct.toFixed(0)}%</strong> wheat self-sufficiency, supplying over{' '}
            <strong>{(nationalExportSurplusQ / 1000000).toFixed(1)} Million quintals</strong> of surplus commercial grain to the Ethiopian Strategic Food Reserve Agency and domestic flour mills.
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {lang === 'om' ? 'Qoodama Oomisha Qamadii Naannoo' : 'Strategic Grain Allocation Breakdown'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Nyaata naannoo, sanyii fi gabaa biyyoolessaa' : 'Domestic consumption, strategic seed banks, and commercial supply'}
            </p>
          </div>
          <DonutChart data={utilizationBreakdown} totalLabel="Production" unit="q" size={170} />
        </div>
      </div>

      {/* 2. Zone Composite Performance Scorecard (All Sections 0 to 7) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {lang === 'om'
                ? 'Sadarkaa Qabxii Waloo Godinootaa Kutaalee Hundaaf (Sections 0–7)'
                : 'Zone Composite Performance Scorecard across All Sections (Ranked #1 to #14)'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Qabxii waloo kutaalee 8 (Mobilization, Inputs, Irrigation, Sowing, Clusters, Protection, Yield, Marketing, Extension, Jobs)'
                : 'Multi-criteria evaluation covering all 8 campaign sections from mobilization to marketing'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'om' ? 'Godina barbaadi...' : 'Filter zone...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              {(['all', 'zone', 'city'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterCategory === cat
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat === 'all' ? (lang === 'om' ? 'Hunda' : 'All') : cat === 'zone' ? (lang === 'om' ? 'Godina' : 'Zones') : (lang === 'om' ? 'Magaalaa' : 'Cities')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Podium Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comprehensiveScores.slice(0, 3).map((z, idx) => (
            <div
              key={z.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                idx === 0
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                  : idx === 1
                  ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                  : 'bg-orange-50/70 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                  idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-300 text-slate-950'
                }`}>
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{z.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(z.sownHa ?? 0).toLocaleString()} ha sown · {z.avgYield ?? 0} q/ha
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {z.totalScore}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">/100 pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comprehensive Breakdown Table across all sections */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5">Rank</th>
                <th className="p-2.5">Zone / City</th>
                <th className="p-2.5">Total Score</th>
                <th className="p-2.5">Grade</th>
                <th className="p-2.5" title="Section 0: Mobilization">Sec 0 (10)</th>
                <th className="p-2.5" title="Section 1: Seed & Fertilizer">Sec 1 (10)</th>
                <th className="p-2.5" title="Section 2: Irrigation Facilities">Sec 2 (10)</th>
                <th className="p-2.5" title="Section 3A: Sowing Progress">Sec 3A (20)</th>
                <th className="p-2.5" title="Section 3B: Clusters & Investors">Sec 3B (10)</th>
                <th className="p-2.5" title="Section 3C: Crop Protection">Sec 3C (10)</th>
                <th className="p-2.5" title="Section 3D: Yield & Production">Sec 3D (15)</th>
                <th className="p-2.5" title="Section 4: Marketing">Sec 4 (5)</th>
                <th className="p-2.5" title="Section 5: Extension">Sec 5 (5)</th>
                <th className="p-2.5" title="Section 6: Employment">Sec 6 (5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredScorecard.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-400">#{index + 1}</td>
                  <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="p-2.5">
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {item.totalScore}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${item.gradeBadge}`}>
                      {item.performanceGrade}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s0}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s1}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s2}</td>
                  <td className="p-2.5 text-emerald-600 font-semibold">{item.s3a}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s3b}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s3c}</td>
                  <td className="p-2.5 text-indigo-600 font-semibold">{item.s3d}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s4}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s5}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.s6}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
