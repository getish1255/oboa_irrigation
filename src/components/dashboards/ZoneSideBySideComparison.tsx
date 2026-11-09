/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { ZoneRecord, Language } from '../../types';
import {
  ArrowLeftRight,
  TrendingUp,
  Wheat,
  Tractor,
  Droplets,
  Package,
  ShieldCheck,
  Users,
  Award,
  AlertTriangle,
  Layers,
  ChevronDown,
  CheckCircle2,
  Percent,
  Sparkles,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  lang: Language;
}

export const ZoneSideBySideComparison: React.FC<Props> = ({ zones, lang }) => {
  const isOromo = lang === 'om';

  // Zone selection state (default to first two prominent wheat zones: Arsi (id: 1) and Bale (id: 3))
  const [zoneAId, setZoneAId] = useState<number>(() => zones[0]?.id || 1);
  const [zoneBId, setZoneBId] = useState<number>(() => zones[2]?.id || (zones[1]?.id ?? 2));
  const [activeTab, setActiveTab] = useState<'kpis' | 'progress' | 'inputs' | 'chart'>('progress');

  const zoneA = useMemo(() => zones.find((z) => z.id === zoneAId) || zones[0], [zones, zoneAId]);
  const zoneB = useMemo(() => zones.find((z) => z.id === zoneBId) || zones[1] || zones[0], [zones, zoneBId]);

  // Swap zones handler
  const handleSwap = () => {
    const temp = zoneAId;
    setZoneAId(zoneBId);
    setZoneBId(temp);
  };

  // Calculations for Zone A
  const statsA = useMemo(() => {
    if (!zoneA) return null;
    const sownPct = zoneA.plannedAreaHa > 0 ? (zoneA.sownAreaHa / zoneA.plannedAreaHa) * 100 : 0;
    const prepPct = zoneA.plannedAreaHa > 0 ? (zoneA.preparedAreaHa / zoneA.plannedAreaHa) * 100 : 0;
    const harvestPct =
      zoneA.readyForHarvestHa > 0
        ? (zoneA.harvestedAreaHa / zoneA.readyForHarvestHa) * 100
        : zoneA.plannedAreaHa > 0
        ? (zoneA.harvestedAreaHa / zoneA.plannedAreaHa) * 100
        : 0;
    const fertilizerPct =
      zoneA.plannedUreaQ > 0 ? (zoneA.distributedUreaQ / zoneA.plannedUreaQ) * 100 : 0;
    const seedPct =
      zoneA.basicSeedDemandQ > 0 ? (zoneA.distributedSeedQ / zoneA.basicSeedDemandQ) * 100 : 0;
    const totalJobs = (zoneA.temporaryJobsMale || 0) + (zoneA.temporaryJobsFemale || 0);
    const totalFarmers = (zoneA.participatingFarmersMale || 0) + (zoneA.participatingFarmersFemale || 0);

    return {
      sownPct,
      prepPct,
      harvestPct,
      fertilizerPct,
      seedPct,
      totalJobs,
      totalFarmers,
    };
  }, [zoneA]);

  // Calculations for Zone B
  const statsB = useMemo(() => {
    if (!zoneB) return null;
    const sownPct = zoneB.plannedAreaHa > 0 ? (zoneB.sownAreaHa / zoneB.plannedAreaHa) * 100 : 0;
    const prepPct = zoneB.plannedAreaHa > 0 ? (zoneB.preparedAreaHa / zoneB.plannedAreaHa) * 100 : 0;
    const harvestPct =
      zoneB.readyForHarvestHa > 0
        ? (zoneB.harvestedAreaHa / zoneB.readyForHarvestHa) * 100
        : zoneB.plannedAreaHa > 0
        ? (zoneB.harvestedAreaHa / zoneB.plannedAreaHa) * 100
        : 0;
    const fertilizerPct =
      zoneB.plannedUreaQ > 0 ? (zoneB.distributedUreaQ / zoneB.plannedUreaQ) * 100 : 0;
    const seedPct =
      zoneB.basicSeedDemandQ > 0 ? (zoneB.distributedSeedQ / zoneB.basicSeedDemandQ) * 100 : 0;
    const totalJobs = (zoneB.temporaryJobsMale || 0) + (zoneB.temporaryJobsFemale || 0);
    const totalFarmers = (zoneB.participatingFarmersMale || 0) + (zoneB.participatingFarmersFemale || 0);

    return {
      sownPct,
      prepPct,
      harvestPct,
      fertilizerPct,
      seedPct,
      totalJobs,
      totalFarmers,
    };
  }, [zoneB]);

  // Comparison Recharts Data
  const comparisonChartData = useMemo(() => {
    if (!zoneA || !zoneB) return [];
    return [
      {
        metric: isOromo ? 'Lafa Karoorfame (10k ha)' : 'Planned Area (10k ha)',
        valA: +(zoneA.plannedAreaHa / 10000).toFixed(1),
        valB: +(zoneB.plannedAreaHa / 10000).toFixed(1),
      },
      {
        metric: isOromo ? 'Lafa Faca\'e (10k ha)' : 'Sown Area (10k ha)',
        valA: +(zoneA.sownAreaHa / 10000).toFixed(1),
        valB: +(zoneB.sownAreaHa / 10000).toFixed(1),
      },
      {
        metric: isOromo ? 'Lafa Qophaa\'e (10k ha)' : 'Prepared Area (10k ha)',
        valA: +(zoneA.preparedAreaHa / 10000).toFixed(1),
        valB: +(zoneB.preparedAreaHa / 10000).toFixed(1),
      },
      {
        metric: isOromo ? 'Oomisha Sassaabame (100k q)' : 'Harvest Output (100k q)',
        valA: +(zoneA.productionObtainedQ / 100000).toFixed(1),
        valB: +(zoneB.productionObtainedQ / 100000).toFixed(1),
      },
      {
        metric: isOromo ? 'Oomishtummaa (q/ha)' : 'Avg Yield (q/ha)',
        valA: +(zoneA.avgYieldQHa || 40).toFixed(1),
        valB: +(zoneB.avgYieldQHa || 40).toFixed(1),
      },
      {
        metric: isOromo ? 'Kilaastara (x10)' : 'Clusters (x10)',
        valA: +((zoneA.clustersEstablished || 0) / 10).toFixed(1),
        valB: +((zoneB.clustersEstablished || 0) / 10).toFixed(1),
      },
    ];
  }, [zoneA, zoneB, isOromo]);

  if (!zoneA || !zoneB || !statsA || !statsB) return null;

  const zoneAName = isOromo ? zoneA.name : zoneA.nameEn;
  const zoneBName = isOromo ? zoneB.name : zoneB.nameEn;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-6">
      {/* Header & Comparison Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {isOromo
                    ? 'Wal-Bira Qabaa Godinaalee Lamaanii (Side-by-Side Zone Comparison)'
                    : 'Zone-to-Zone Comparative Intelligence: Side-by-Side'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
                  Executive Delta
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isOromo
                  ? 'Godinaalee lama filachuun adeemsa facaasaa, oomishaa, galteewwanii fi qabeenya wal-bira qabi'
                  : 'Select any two zones to benchmark progress bars, core agricultural KPIs, mechanization, and resource inputs'}
              </p>
            </div>
          </div>
        </div>

        {/* Dual Zone Dropdowns + Swap Button */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto text-xs">
          {/* Zone A Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
              Zone A:
            </span>
            <select
              value={zoneAId}
              onChange={(e) => setZoneAId(Number(e.target.value))}
              className="bg-transparent font-bold text-emerald-900 dark:text-emerald-100 focus:outline-none cursor-pointer text-xs"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="text-slate-900">
                  {isOromo ? z.name : z.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Swap Zone A and Zone B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>

          {/* Zone B Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300/80 dark:border-blue-700/60 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="font-bold text-blue-800 dark:text-blue-300 text-[11px]">
              Zone B:
            </span>
            <select
              value={zoneBId}
              onChange={(e) => setZoneBId(Number(e.target.value))}
              className="bg-transparent font-bold text-blue-900 dark:text-blue-100 focus:outline-none cursor-pointer text-xs"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="text-slate-900">
                  {isOromo ? z.name : z.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Progress Bars | Core KPIs | Resource Inputs | Bar Chart */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'progress', label: isOromo ? 'Adeemsa Facaasaa (Progress Bars)' : 'Progress Bars & Completion' },
            { id: 'kpis', label: isOromo ? 'Agarsiistota Ijoo (Key KPIs)' : 'Executive Core KPIs' },
            { id: 'inputs', label: isOromo ? 'Galteewwan & Qabeenya (Inputs)' : 'Resource Inputs & Assets' },
            { id: 'chart', label: isOromo ? 'Chaartii Recharts (Chart)' : 'Comparative Recharts BarChart' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Delta Indicator */}
        <div className="hidden md:flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {zoneAName}
          </span>
          <span className="text-slate-400">vs</span>
          <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {zoneBName}
          </span>
        </div>
      </div>

      {/* 1. PROGRESS BARS VIEW */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zone A Progress Card */}
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {zoneAName}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {statsA.sownPct.toFixed(1)}% Sown
                </span>
              </div>

              {/* Progress Bar 1: Area Sown vs Planned */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Wheat Area Sown vs Planned</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{statsA.sownPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, statsA.sownPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneA.sownAreaHa || 0).toLocaleString()} ha sown</span>
                  <span>target: {(zoneA.plannedAreaHa || 0).toLocaleString()} ha</span>
                </div>
              </div>

              {/* Progress Bar 2: Land Preparation */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Land Tilled / Prepared</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{statsA.prepPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, statsA.prepPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneA.preparedAreaHa || 0).toLocaleString()} ha prepared</span>
                  <span>tractor: {(zoneA.preparedByTractorHa || 0).toLocaleString()} ha</span>
                </div>
              </div>

              {/* Progress Bar 3: Harvest Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Harvest Rate (Mature Crop)</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{statsA.harvestPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, statsA.harvestPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneA.harvestedAreaHa || 0).toLocaleString()} ha harvested</span>
                  <span>combines: {zoneA.combinesDeployed || 0}</span>
                </div>
              </div>

              {/* Progress Bar 4: Fertilizer Distribution */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Urea Fertilizer Delivered</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{statsA.fertilizerPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, statsA.fertilizerPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneA.distributedUreaQ || 0).toLocaleString()} q delivered</span>
                  <span>target: {(zoneA.plannedUreaQ || 0).toLocaleString()} q</span>
                </div>
              </div>
            </div>

            {/* Zone B Progress Card */}
            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {zoneBName}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  {statsB.sownPct.toFixed(1)}% Sown
                </span>
              </div>

              {/* Progress Bar 1: Area Sown vs Planned */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Wheat Area Sown vs Planned</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{statsB.sownPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, statsB.sownPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneB.sownAreaHa || 0).toLocaleString()} ha sown</span>
                  <span>target: {(zoneB.plannedAreaHa || 0).toLocaleString()} ha</span>
                </div>
              </div>

              {/* Progress Bar 2: Land Preparation */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Land Tilled / Prepared</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{statsB.prepPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, statsB.prepPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneB.preparedAreaHa || 0).toLocaleString()} ha prepared</span>
                  <span>tractor: {(zoneB.preparedByTractorHa || 0).toLocaleString()} ha</span>
                </div>
              </div>

              {/* Progress Bar 3: Harvest Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Harvest Rate (Mature Crop)</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{statsB.harvestPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, statsB.harvestPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneB.harvestedAreaHa || 0).toLocaleString()} ha harvested</span>
                  <span>combines: {zoneB.combinesDeployed || 0}</span>
                </div>
              </div>

              {/* Progress Bar 4: Fertilizer Distribution */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Urea Fertilizer Delivered</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{statsB.fertilizerPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, statsB.fertilizerPct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{(zoneB.distributedUreaQ || 0).toLocaleString()} q delivered</span>
                  <span>target: {(zoneB.plannedUreaQ || 0).toLocaleString()} q</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CORE EXECUTIVE KPIS VIEW */}
      {activeTab === 'kpis' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Core Performance Indicator</th>
                <th className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{zoneAName} (A)</th>
                <th className="p-3 text-blue-700 dark:text-blue-400 font-bold">{zoneBName} (B)</th>
                <th className="p-3 text-right">Variance / Delta (A vs B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {[
                {
                  label: 'Planned Area (ha)',
                  valA: zoneA.plannedAreaHa || 0,
                  valB: zoneB.plannedAreaHa || 0,
                  unit: 'ha',
                },
                {
                  label: 'Area Sown (ha)',
                  valA: zoneA.sownAreaHa || 0,
                  valB: zoneB.sownAreaHa || 0,
                  unit: 'ha',
                },
                {
                  label: 'Sowing Rate (%)',
                  valA: +statsA.sownPct.toFixed(1),
                  valB: +statsB.sownPct.toFixed(1),
                  unit: '%',
                },
                {
                  label: 'Expected Production (quintals)',
                  valA: zoneA.expectedProductionQ || 0,
                  valB: zoneB.expectedProductionQ || 0,
                  unit: 'q',
                },
                {
                  label: 'Actual Harvest Obtained (quintals)',
                  valA: zoneA.productionObtainedQ || 0,
                  valB: zoneB.productionObtainedQ || 0,
                  unit: 'q',
                },
                {
                  label: 'Average Measured Yield (q/ha)',
                  valA: +(zoneA.avgYieldQHa || 40).toFixed(1),
                  valB: +(zoneB.avgYieldQHa || 40).toFixed(1),
                  unit: 'q/ha',
                },
                {
                  label: 'Clusters Established',
                  valA: zoneA.clustersEstablished || 0,
                  valB: zoneB.clustersEstablished || 0,
                  unit: 'clusters',
                },
                {
                  label: 'Cluster Area Coverage',
                  valA: zoneA.clusterAreaHa || 0,
                  valB: zoneB.clusterAreaHa || 0,
                  unit: 'ha',
                },
                {
                  label: 'Participating Farmers',
                  valA: statsA.totalFarmers,
                  valB: statsB.totalFarmers,
                  unit: 'people',
                },
                {
                  label: 'Market Price (ETB / quintal)',
                  valA: zoneA.avgPriceEtbQ || 4800,
                  valB: zoneB.avgPriceEtbQ || 4800,
                  unit: 'ETB',
                },
              ].map((row, idx) => {
                const delta = row.valA - row.valB;
                const isPositive = delta > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-slate-800 dark:text-slate-200">{row.label}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{row.valA.toLocaleString()} {row.unit}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{row.valB.toLocaleString()} {row.unit}</td>
                    <td className={`p-3 text-right font-bold ${delta === 0 ? 'text-slate-400' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {delta === 0 ? 'Equal' : `${isPositive ? '+' : ''}${delta.toLocaleString()} ${row.unit}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. RESOURCE INPUTS VIEW */}
      {activeTab === 'inputs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Inputs Card Zone A */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                {zoneAName} Resources & Mechanization
              </span>
              <span className="font-mono text-[10px] text-slate-400">Zone A Inputs</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Distributed Urea</span>
                <strong className="text-slate-900 dark:text-slate-100">{(zoneA.distributedUreaQ || 0).toLocaleString()} q</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Distributed NPS</span>
                <strong className="text-slate-900 dark:text-slate-100">{(zoneA.distributedNpsQ || 0).toLocaleString()} q</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Certified Seeds</span>
                <strong className="text-slate-900 dark:text-slate-100">{(zoneA.distributedSeedQ || 0).toLocaleString()} q</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Combines Active</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{zoneA.combinesDeployed || 0} combines</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Tractors Deployed</span>
                <strong className="text-blue-600 dark:text-blue-400">{zoneA.tractorsDeployed || 0} tractors</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Modern Irrigation</span>
                <strong className="text-sky-600 dark:text-sky-400">{(zoneA.modernIrrigationHa || 0).toLocaleString()} ha</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px]">
              <span className="text-rose-700 dark:text-rose-400 font-semibold block mb-0.5">Top Operational Challenge:</span>
              <span className="text-slate-700 dark:text-slate-300">{zoneA.topChallenge || 'Water pump fuel shortage & spare parts'}</span>
            </div>
          </div>

          {/* Inputs Card Zone B */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                {zoneBName} Resources & Mechanization
              </span>
              <span className="font-mono text-[10px] text-slate-400">Zone B Inputs</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Distributed Urea</span>
                <strong className="text-slate-900 dark:text-slate-100">{(zoneB.distributedUreaQ || 0).toLocaleString()} q</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Distributed NPS</span>
                <strong className="text-slate-900 dark:text-slate-100">{(zoneB.distributedNpsQ || 0).toLocaleString()} q</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Certified Seeds</span>
                <strong className="text-slate-900 dark:text-slate-100">{(zoneB.distributedSeedQ || 0).toLocaleString()} q</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Combines Active</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{zoneB.combinesDeployed || 0} combines</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Tractors Deployed</span>
                <strong className="text-blue-600 dark:text-blue-400">{zoneB.tractorsDeployed || 0} tractors</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-sans">Modern Irrigation</span>
                <strong className="text-sky-600 dark:text-sky-400">{(zoneB.modernIrrigationHa || 0).toLocaleString()} ha</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px]">
              <span className="text-rose-700 dark:text-rose-400 font-semibold block mb-0.5">Top Operational Challenge:</span>
              <span className="text-slate-700 dark:text-slate-300">{zoneB.topChallenge || 'Canal sedimentation & maintenance delays'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPARATIVE RECHARTS BARCHART */}
      {activeTab === 'chart' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Direct Metric Benchmark Across Agricultural Milestones</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                {zoneAName}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                <span className="w-3 h-3 rounded-xs bg-blue-500" />
                {zoneBName}
              </span>
            </div>
          </div>

          <div className="w-full h-[360px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-600 dark:text-slate-400 font-sans" />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-600 dark:text-slate-400 font-mono" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="p-3 bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px] space-y-1.5">
                        <span className="font-bold block text-slate-200 border-b border-slate-800 pb-1">{label}</span>
                        <div className="flex justify-between text-emerald-400 font-mono">
                          <span>{zoneAName}:</span>
                          <span className="font-bold">{payload[0]?.value}</span>
                        </div>
                        <div className="flex justify-between text-blue-400 font-mono">
                          <span>{zoneBName}:</span>
                          <span className="font-bold">{payload[1]?.value}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="valA" name={zoneAName} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="valB" name={zoneBName} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
