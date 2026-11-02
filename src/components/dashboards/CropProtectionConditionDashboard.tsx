import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { DonutChart, GaugeChart, ClusteredColumnChart } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { ShieldAlert, AlertTriangle, Sprout, Bug } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const CropProtectionConditionDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  // 1. Crop Protection Activities
  const totalSprayedHa = zones.reduce((s, z) => s + z.chemicalSprayedAreaHa, 0);
  const totalHandWeededHa = zones.reduce((s, z) => s + z.handWeededAreaHa, 0);
  const totalRustTreatedHa = zones.reduce((s, z) => s + z.rustAffectedHa * 0.95, 0);
  const totalPestTreatedHa = zones.reduce((s, z) => s + z.pestAffectedHa * 0.92, 0);

  const totalProtectedAreaHa = Math.min(totals.sownAreaHa, totalSprayedHa + totalHandWeededHa);
  const protectedAreaPct =
    totals.sownAreaHa > 0 ? (totalProtectedAreaHa / totals.sownAreaHa) * 100 : 0;

  // Disease Occurrence Pie
  const diseasePieData = [
    { label: 'Yellow Rust (Waagii Keelloo)', value: 48500, color: '#eab308' },
    { label: 'Stem Rust (Waagii Garaachaa)', value: 18200, color: '#dc2626' },
    { label: 'Leaf Rust (Waagii Baalaa)', value: 12400, color: '#f97316' },
    { label: 'Septoria Tritici', value: 7800, color: '#8b5cf6' },
    { label: 'Fusarium Head Blight', value: 9200, color: '#a855f7' },
    { label: 'Powdery Mildew', value: 4100, color: '#64748b' },
  ];

  // Pest Occurrence Pie
  const pestPieData = [
    { label: 'Aphids (Hamuuyyee)', value: 38500, color: '#10b981' },
    { label: 'Fall Armyworm (Aaraamii)', value: 24200, color: '#f59e0b' },
    { label: 'Wheat Stem Borer', value: 14500, color: '#ef4444' },
    { label: 'Termites (Girmaa)', value: 6800, color: '#8b5cf6' },
    { label: 'Quelea Birds (Simbiroota)', value: 12400, color: '#0284c7' },
    { label: 'Other Insect Pests', value: 5100, color: '#64748b' },
  ];

  // Stressed Area Stacked Analysis by Zone (Top 6 zones)
  const topStressZones = zones.slice(0, 6);
  const stressZoneNames = topStressZones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const stressSeries = [
    {
      name: lang === 'om' ? 'Hanqina Bishaanii' : 'Water Shortage',
      data: topStressZones.map(z => z.waterShortageHa),
      color: '#f97316',
    },
    {
      name: lang === 'om' ? 'Dhiibbaa Ilbiisaa' : 'Pest Affected',
      data: topStressZones.map(z => z.pestAffectedHa),
      color: '#ef4444',
    },
    {
      name: lang === 'om' ? 'Dhiphina Bishaanii (Waterlogging)' : 'Waterlogging',
      data: topStressZones.map(z => z.waterloggingHa),
      color: '#0284c7',
    },
    {
      name: lang === 'om' ? 'Lafa Gatame (Abandoned)' : 'Abandoned Area',
      data: topStressZones.map(z => z.abandonedHa),
      color: '#64748b',
    },
  ];

  // Current Crop Growth Stage Breakdown across regional standing crop
  const cropStageData = [
    { label: 'Emergence (Biqila)', value: 120000, color: '#a7f3d0' },
    { label: 'Tillering (Dhalloota)', value: 340000, color: '#6ee7b7' },
    { label: 'Stem Elongation (Guddina)', value: 680000, color: '#34d399' },
    { label: 'Heading (Daraaraa)', value: 890000, color: '#10b981' },
    { label: 'Grain Filling (Qamadii)', value: 920000, color: '#059669' },
    { label: 'Maturity (Bilchaate)', value: 380000, color: '#f59e0b' },
    { label: 'Harvested (Sassaabame)', value: totals.harvestedAreaHa, color: '#d97706' },
  ];

  return (
    <div className="space-y-6">
      {/* 10. Crop Protection Dashboard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              {lang === 'om' ? '10. Eegumsa Midhaanii (Crop Protection Dashboard)' : '10. Crop Protection Dashboard (Weed, Rust & Pest Control)'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Bal\'ina lafa aramame, dhibee fi ilbiisaan biifame fi uwwisa eegumsaa'
                : 'Pest & disease outbreak tracking, fungicide spray coverage, and biological protection index'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Protected Area % Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <GaugeChart
              value={protectedAreaPct}
              title={lang === 'om' ? 'Uwwisa Eegumsa Midhaanii' : 'Protected Area %'}
              subtitle={`${totalProtectedAreaHa.toLocaleString()} ha protected / ${totals.sownAreaHa.toLocaleString()} ha sown`}
              color="#10b981"
              size={170}
            />
            <div className="mt-3 text-center text-xs text-slate-500">
              Formula: Protected Area / Sown Area × 100
            </div>
          </div>

          {/* Disease Occurrence Pie */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {lang === 'om' ? 'Dhibeewwan Qamadii' : 'Disease Occurrence'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Yellow, Stem, Leaf Rust & Fusarium' : 'Breakdown of confirmed fungal rust & blight alerts'}
            </p>
            <DonutChart data={diseasePieData} totalLabel="Hectares" unit="ha" size={150} />
          </div>

          {/* Pest Occurrence Pie */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Bug className="w-4 h-4 text-emerald-500" />
              {lang === 'om' ? 'Ilbiisota Qamadii' : 'Pest Occurrence'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'om' ? 'Aphids, Armyworm, Stem borer' : 'Field pest pressure reports from extension scout mobile app'}
            </p>
            <DonutChart data={pestPieData} totalLabel="Hectares" unit="ha" size={150} />
          </div>

          {/* Protection Activities Summary Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {lang === 'om' ? 'Tarkaanfilee Fudhataman' : 'Intervention Activities'}
            </span>
            <div className="space-y-3 my-2 font-mono text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Chemical Sprayed:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {totalSprayedHa.toLocaleString()} ha
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Hand Weeded:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {totalHandWeededHa.toLocaleString()} ha
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Rust Sprayed:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {Math.round(totalRustTreatedHa).toLocaleString()} ha
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Pest Suppressed:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(totalPestTreatedHa).toLocaleString()} ha
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              98% of identified hot spots treated within 48h protocol window.
            </p>
          </div>
        </div>
      </div>

      {/* 11. Crop Condition Dashboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              {lang === 'om' ? '11. Haala Midhaanii & Sadarkaa Guddinaa (Crop Condition Dashboard)' : '11. Crop Condition & Phenological Stages Dashboard'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Xiinxala lafa dhiphina qabuu fi sadarkaa guddina qamadii (Phenology)'
                : 'Stressed area analysis (water, moisture, pests) and regional crop growth stage progression'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stressed Area Stacked Column */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Xiinxala Lafa Dhiphina Qabu (Stressed Area Analysis)' : 'Stressed Area Analysis (By Leading Zones)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Water shortage, waterlogging, pest affected, abandoned (ha)' : 'Hectares of wheat crop under environmental stress'}
              </p>
            </div>
            <ClusteredColumnChart
              categories={stressZoneNames}
              series={stressSeries}
              height={220}
              unit="ha"
            />
          </div>

          {/* Crop Growth Stage Distribution */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Sadarkaa Guddina Midhaanii (Growth Stages)' : 'Current Crop Growth Stage Distribution'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Emergence hanga Harvested qoodama jiru' : 'Active standing crop hectares categorized by Zadoks growth stages'}
              </p>
            </div>
            <DonutChart data={cropStageData} totalLabel="Standing Crop" unit="ha" size={170} />
          </div>
        </div>
      </div>
    </div>
  );
};
