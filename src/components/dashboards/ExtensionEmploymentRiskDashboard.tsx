import React from 'react';
import { ZoneRecord, Language } from '../../types';
import { DonutChart, ClusteredColumnChart, TrendLineChart, HeatmapGrid } from '../charts/Charts';
import { getTotals } from '../../data/initialData';
import { Briefcase, Users, AlertCircle, Calendar, ArrowRight } from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const ExtensionEmploymentRiskDashboard: React.FC<Props> = ({ zones, lang }) => {
  const totals = getTotals(zones);

  // 14. Extension Data
  const totalFieldDays = totals.fieldDaysCount;
  const totalDemos = totals.demonstrationsCount;
  const totalMaleAttendees = zones.reduce((s, z) => s + z.extensionMaleAttendees, 0);
  const totalFemaleAttendees = zones.reduce((s, z) => s + z.extensionFemaleAttendees, 0);
  const totalYouthAttendees = zones.reduce((s, z) => s + z.extensionYouthAttendees, 0);
  const totalAttendees = totalMaleAttendees + totalFemaleAttendees;

  const topExtensionZones = [...zones].sort((a, b) => b.extensionMaleAttendees - a.extensionMaleAttendees).slice(0, 7);
  const extZoneNames = topExtensionZones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const extSeries = [
    {
      name: lang === 'om' ? 'Dhiira (Male)' : 'Male Attendees',
      data: topExtensionZones.map(z => z.extensionMaleAttendees),
      color: '#3b82f6',
    },
    {
      name: lang === 'om' ? 'Dubartoota (Female)' : 'Female Attendees',
      data: topExtensionZones.map(z => z.extensionFemaleAttendees),
      color: '#ec4899',
    },
  ];

  // 15. Employment Data
  const totalTempMale = zones.reduce((s, z) => s + z.temporaryJobsMale, 0);
  const totalTempFemale = zones.reduce((s, z) => s + z.temporaryJobsFemale, 0);
  const totalPermMale = zones.reduce((s, z) => s + z.permanentJobsMale, 0);
  const totalPermFemale = zones.reduce((s, z) => s + z.permanentJobsFemale, 0);

  const seasonalJobs = totalTempMale + totalTempFemale;
  const permanentJobs = totalPermMale + totalPermFemale;
  const totalJobsCreated = seasonalJobs + permanentJobs;

  const employmentGenderPie = [
    { label: lang === 'om' ? 'Dargaggoota Dhiiraa' : 'Male Youth', value: totalTempMale + totalPermMale, color: '#0284c7' },
    { label: lang === 'om' ? 'Dargaggoota Dubaraa' : 'Female Youth', value: totalTempFemale + totalPermFemale, color: '#ec4899' },
  ];

  const weeklyJobLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];
  const weeklyJobPoints = [24000, 48000, 75000, 92000, 68000, 42000, 31000, 22000];

  // 16. Challenges & Risks
  const challengeCategories = [
    'Input shortage',
    'Late supply',
    'Water shortage',
    'Pump failure',
    'Pests & Rust',
    'Finance & Credit',
    'Marketing',
  ];

  const challengeFrequencies = [62, 48, 74, 58, 65, 38, 29];

  const challengeFreqSeries = [
    {
      name: lang === 'om' ? 'Baay\'ina Gabaafame' : 'Reports Count',
      data: challengeFrequencies,
      color: '#f43f5e',
    },
  ];

  // Heatmap for Challenge Severity across 14 zones
  const riskHeatmapRows = zones.map(z => (lang === 'om' ? z.name : z.nameEn.split(' ')[0]));
  const riskHeatmapCols = ['Water', 'Pumps', 'Pests', 'Fertilizer', 'Power', 'Credit'];

  const riskHeatmapValues: ('Low' | 'Medium' | 'High')[][] = zones.map(z => [
    z.waterShortageHa > 15000 ? 'High' : z.waterShortageHa > 5000 ? 'Medium' : 'Low',
    z.pumpIrrigationHa > 100000 ? 'High' : 'Medium',
    z.rustAffectedHa > 10000 ? 'High' : z.rustAffectedHa > 2000 ? 'Medium' : 'Low',
    z.distributedUreaQ < z.plannedUreaQ * 0.9 ? 'High' : 'Low',
    z.id === 5 || z.id === 6 ? 'High' : 'Medium',
    z.category === 'zone' ? 'Medium' : 'Low',
  ]);

  return (
    <div className="space-y-6">
      {/* 14. Extension Dashboard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {lang === 'om' ? '14. Eksteenshinii fi Daawwannaa Dirree (Extension Dashboard)' : '14. Extension Services & Field Demonstrations'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Guyyaa daawwannaa, agarsiisa teeknoolojii, fi hirmaannaa qonnaan bultootaa'
                : 'Farmer field days, technology demonstration sites, and youth/gender attendance'}
            </p>
          </div>
        </div>

        {/* 4 Extension Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Guyyaa Daawwannaa' : 'Field Days'}</span>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {totalFieldDays}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Held in model cluster farms</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Agarsiisa Dirree' : 'Demonstrations'}</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {totalDemos}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Agronomic practices showcased</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Hirmaattota Waliigalaa' : 'Total Attendance'}</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {totalAttendees.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Farmers & development agents</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Hirmaannaa Dargaggootaa' : 'Youth Attendance'}</span>
            <div className="text-2xl font-bold font-mono text-pink-600 dark:text-pink-400 mt-1 tabular-nums">
              {totalYouthAttendees.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {((totalYouthAttendees / (totalAttendees || 1)) * 100).toFixed(1)}% young agriculturalists
            </span>
          </div>
        </div>

        {/* Extension Stacked Attendance Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Hirmaattota Daawwannaa Koorniyaan (Top Zones)' : 'Attendance by Gender (Male vs Female Across Top Zones)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Hirmaannaa dhiiraa fi dubartootaa daawwannaa irratti' : 'Participation recorded at scheme demonstration plots'}
              </p>
            </div>
          </div>
          <ClusteredColumnChart
            categories={extZoneNames}
            series={extSeries}
            height={220}
            unit="attendees"
          />
        </div>
      </div>

      {/* 15. Employment Dashboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              {lang === 'om' ? '15. Carraa Hojii Uumuu (Employment Dashboard)' : '15. Youth & Women Employment Creation Dashboard'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Carraa hojii yeroo fi dhaabbataa dargaggootaa fi dubartootaaf uumame'
                : 'Temporary and permanent job opportunities created in irrigated wheat value chain'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Carraa Hojii Yeroo' : 'Seasonal / Temp Jobs'}</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {seasonalJobs.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Canal clearing, weeding & harvest</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Carraa Hojii Dhaabbataa' : 'Permanent Jobs'}</span>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {permanentJobs.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Organized youth wheat producer groups</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Waliigala Hojii' : 'Total Employment'}</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {totalJobsCreated.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Across all 14 zones & cities</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">{lang === 'om' ? 'Hirmaannaa Dubartootaa' : 'Women Share'}</span>
            <div className="text-2xl font-bold font-mono text-pink-600 dark:text-pink-400 mt-1 tabular-nums">
              {(((totalTempFemale + totalPermFemale) / (totalJobsCreated || 1)) * 100).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Target 40% gender quota</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Qoodama Hojii Koorniyaan' : 'Gender Employment Ratio'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Male vs Female Youth employed' : 'Youth workforce distribution'}
              </p>
            </div>
            <DonutChart data={employmentGenderPie} totalLabel="Jobs" unit="" size={160} />
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'om' ? 'Adeemsa Uumama Hojii Torbaniin' : 'Employment Trend (Week-by-Week Jobs Activated)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'om' ? 'Torbee torbeen carraa hojii uumame' : 'Weekly labor mobilization curve'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600">Peak: 92,000 / week</span>
            </div>
            <TrendLineChart
              labels={weeklyJobLabels}
              points={weeklyJobPoints}
              color="#10b981"
              unit="jobs"
              height={160}
            />
          </div>
        </div>
      </div>

      {/* 16. Challenge & Risk Dashboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              {lang === 'om' ? '16. Rakkoolee fi Sodaa (Challenge & Risk Dashboard)' : '16. Challenge & Risk Monitoring Dashboard'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'om'
                ? 'Hordoffii rakkoolee bu\'uuraalee, hanqina galtee fi qoodama sadarkaa balaa'
                : 'Frequency of field bottlenecks, severity heatmap by zone, and stage vulnerability flow'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Challenge Frequency */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Yeroo Meeqa Mul\'ate (Challenge Frequency)' : 'Challenge Frequency by Category'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Hanqina galtee, bishaanii, paampii, dhibee' : 'Field incident frequency reported through KoboToolbox'}
              </p>
            </div>
            <ClusteredColumnChart
              categories={challengeCategories}
              series={challengeFreqSeries}
              height={200}
              unit="cases"
            />
          </div>

          {/* Challenge Stage Analysis Flow / Sankey */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Xiinxala Sadarkaa Oomishaa vs Rakkoo' : 'Challenge Stage Analysis (Production Stage → Risk)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Sadarkaa kam irratti rakkoon kam mudata' : 'Vulnerability mapping across campaign milestones'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { stage: 'Land Prep & Plowing', challenge: 'Tractor fuel & spare parts shortage', risk: 'Medium', color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' },
                { stage: 'Sowing & Planting', challenge: 'Basic seed supply delays & warehouse logistics', risk: 'High', color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' },
                { stage: 'Vegetative Growth & Watering', challenge: 'Power cuts on pump stations & canal siltation', risk: 'High', color: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30' },
                { stage: 'Crop Heading & Grain Filling', challenge: 'Yellow rust outbreak & aphid infestation', risk: 'Medium', color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30' },
                { stage: 'Harvesting & Threshing', challenge: 'Combine harvester availability & transport trucks', risk: 'High', color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' },
              ].map(item => (
                <div key={item.stage} className={`p-3 rounded-lg border-l-4 ${item.color} flex items-center justify-between gap-3 text-xs`}>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{item.stage}</div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="text-slate-600 dark:text-slate-300 flex-1 truncate">{item.challenge}</div>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    item.risk === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-900'
                  }`}>
                    {item.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Severity Heatmap: Rows = Zones, Cols = Challenges */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'om' ? 'Sadarkaa Ulfaatina Balaa (Severity Heatmap)' : 'Challenge Severity Heatmap (14 Zones × 6 Key Risk Factors)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'om' ? 'Sadarkaa balaa: Low (Gadi-aanaa), Medium (Giddu-galeessa), High (Ol-aanaa)' : 'Severity grading calibrated from extension supervisor risk reports'}
              </p>
            </div>
          </div>
          <HeatmapGrid rows={riskHeatmapRows} cols={riskHeatmapCols} values={riskHeatmapValues} />
        </div>
      </div>
    </div>
  );
};
