import React from 'react';
import { ZoneRecord, IrrigationScheme, Language } from '../../types';
import { getTotals } from '../../data/initialData';
import { getTranslation } from '../../data/translations';
import {
  Wheat,
  Tractor,
  Layers,
  Percent,
  Droplets,
  Sprout,
  TrendingUp,
  Cpu,
  Users,
  Briefcase,
  Calendar,
  Banknote,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  lang: Language;
}

export const ExecutiveKpis: React.FC<Props> = ({ zones, schemes, lang }) => {
  const totals = getTotals(zones);

  const sowingAchievementPct =
    totals.plannedAreaHa > 0 ? (totals.sownAreaHa / totals.plannedAreaHa) * 100 : 0;

  const totalSchemesCount = schemes.length;
  const functionalSchemesCount = schemes.filter(s => s.status === 'functional').length;
  const functionalSchemesPct =
    totalSchemesCount > 0 ? (functionalSchemesCount / totalSchemesCount) * 100 : 0;

  const totalPumps = schemes.reduce((sum, s) => sum + s.pumpsTotal, 0);
  const functionalPumps = schemes.reduce((sum, s) => sum + s.pumpsFunctional, 0);
  const functionalPumpsPct = totalPumps > 0 ? (functionalPumps / totalPumps) * 100 : 0;

  const totalIrrigatedServedHa = schemes.reduce((sum, s) => sum + s.serviceableAreaHa, 0);

  const totalHarvestedHa = totals.harvestedAreaHa;
  const averageYieldQHa =
    totalHarvestedHa > 0
      ? totals.productionObtainedQ / totalHarvestedHa
      : totals.expectedProductionQ / (totals.plannedAreaHa || 1);

  const totalFarmers = totals.farmersMale + totals.farmersFemale;

  const avgPriceEtb = Math.round(
    zones.reduce((sum, z) => sum + z.avgPriceEtbQ, 0) / (zones.length || 1)
  );

  // 15 Standard Executive Cards matching user specification item #1
  const kpiItems = [
    {
      title: lang === 'om' ? 'Karoora Lafa Facaasaa' : 'Total Wheat Planned',
      value: `${totals.plannedAreaHa.toLocaleString()}`,
      unit: 'ha',
      formula: lang === 'om' ? 'Ida\'ama karoora lafaa' : 'Sum of planned area',
      icon: Wheat,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
    },
    {
      title: lang === 'om' ? 'Lafa Qophaa\'e' : 'Total Land Prepared',
      value: `${totals.preparedAreaHa.toLocaleString()}`,
      unit: 'ha',
      formula: lang === 'om' ? 'Walitti-qabama qophii' : 'Cumulative land plowed',
      icon: Tractor,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60',
    },
    {
      title: lang === 'om' ? 'Lafa Faca\'e' : 'Total Wheat Sown',
      value: `${totals.sownAreaHa.toLocaleString()}`,
      unit: 'ha',
      formula: lang === 'om' ? 'Walitti-qabama facaasaa' : 'Cumulative wheat sown',
      icon: Sprout,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60',
    },
    {
      title: lang === 'om' ? 'Raawwii Facaasaa' : 'Sowing Achievement',
      value: `${sowingAchievementPct.toFixed(1)}%`,
      unit: '',
      formula: 'Sown / Planned × 100',
      icon: Percent,
      color: 'text-emerald-700 dark:text-emerald-300 font-bold',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
    },
    {
      title: lang === 'om' ? 'Lafa Jallisiin Tajaajilame' : 'Irrigated Area Served',
      value: `${totalIrrigatedServedHa.toLocaleString()}`,
      unit: 'ha',
      formula: lang === 'om' ? 'Bu\'uuraalee jallisii' : 'Command irrigation schemes',
      icon: Droplets,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60',
    },
    {
      title: lang === 'om' ? 'Oomisha Qamadii' : 'Total Grain Production',
      value: `${totals.expectedProductionQ.toLocaleString()}`,
      unit: 'q',
      formula: lang === 'om' ? 'Tilmaama walitti-qabamaa' : 'Cumulative production expected',
      icon: TrendingUp,
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
    },
    {
      title: lang === 'om' ? 'Oomishtummaa G/galeessaa' : 'Average Yield',
      value: `${averageYieldQHa.toFixed(1)}`,
      unit: 'q/ha',
      formula: 'Production / Harvested area',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60',
    },
    {
      title: lang === 'om' ? 'Paampoota Hojjatanii' : 'Functional Pumps',
      value: `${functionalPumpsPct.toFixed(1)}%`,
      unit: `(${functionalPumps}/${totalPumps})`,
      formula: 'Functional / Total Pumps',
      icon: Cpu,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900/60',
    },
    {
      title: lang === 'om' ? 'Iskimiilee Hojjatanii' : 'Functional Schemes',
      value: `${functionalSchemesPct.toFixed(1)}%`,
      unit: `(${functionalSchemesCount}/${totalSchemesCount})`,
      formula: 'Functional / Assessed Schemes',
      icon: CheckCircle,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60',
    },
    {
      title: lang === 'om' ? 'Qonnaan Bultoota Hirmaatan' : 'Farmers Participating',
      value: `${totalFarmers.toLocaleString()}`,
      unit: lang === 'om' ? 'Dhi + Dub' : 'Male + Female',
      formula: `${totals.farmersMale.toLocaleString()} M + ${totals.farmersFemale.toLocaleString()} F`,
      icon: Users,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60',
    },
    {
      title: lang === 'om' ? 'Bal\'ina Kilaastaraa' : 'Cluster Area',
      value: `${totals.clusterAreaHa.toLocaleString()}`,
      unit: 'ha',
      formula: `${totals.clustersEstablished} ${lang === 'om' ? 'kilaastaroota' : 'clusters established'}`,
      icon: ShieldCheck,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/60',
    },
    {
      title: lang === 'om' ? 'Lafa Abbootii Qabeenyaa' : 'Private Investor Area',
      value: `${totals.investorSownHa.toLocaleString()}`,
      unit: 'ha',
      formula: `${totals.investorCount} ${lang === 'om' ? 'abbootii qabeenyaa' : 'investors operating'}`,
      icon: Briefcase,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60',
    },
    {
      title: lang === 'om' ? 'Carraa Hojii Uumame' : 'Employment Created',
      value: `${(totals.temporaryJobs + totals.permanentJobs).toLocaleString()}`,
      unit: lang === 'om' ? 'hojii' : 'jobs',
      formula: `${totals.temporaryJobs.toLocaleString()} temp + ${totals.permanentJobs.toLocaleString()} perm`,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60',
    },
    {
      title: lang === 'om' ? 'Guyyaa Daawwannaa' : 'Field Days Conducted',
      value: `${totals.fieldDaysCount}`,
      unit: lang === 'om' ? 'marsaa' : 'events',
      formula: `${totals.demonstrationsCount} ${lang === 'om' ? 'agarsiisa dirree' : 'demonstrations'}`,
      icon: Calendar,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60',
    },
    {
      title: lang === 'om' ? 'Gatii Qamadii G/galeessaa' : 'Average Wheat Price',
      value: `${avgPriceEtb.toLocaleString()}`,
      unit: 'ETB/q',
      formula: lang === 'om' ? 'Gatii gabaa giddu-galeessaa' : 'Current terminal market price',
      icon: Banknote,
      color: 'text-amber-800 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {lang === 'om'
              ? 'Agarsiistota Ijoo Hooggansaa (Top Executive KPIs)'
              : '1. Executive KPI Dashboard (Top Landing Cards)'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'om'
              ? 'Ragaalee bu\'uuraa gabaasa misooma qamadii jallisii naannoo Oromiyaa'
              : 'Core aggregated campaign metrics from Sections 1 to 7 across all 14 zones'}
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {lang === 'om' ? 'Misooma Qamadii Jallisii Bara 2019/2026' : 'Oromia Wheat Campaign 2026'}
        </div>
      </div>

      {/* Grid of 15 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {kpiItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`p-3.5 rounded-xl border ${item.bg} flex flex-col justify-between transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
                  {item.title}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${item.color} opacity-80`} />
              </div>

              <div className="mt-2.5">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className={`text-xl font-extrabold ${item.color} tabular-nums tracking-tight`}>
                    {item.value}
                  </span>
                  {item.unit && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.unit}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={item.formula}>
                  {item.formula}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
