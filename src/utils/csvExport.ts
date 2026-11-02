/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import { IrrigationScheme, Language, ZoneRecord } from '../types';

export interface CsvExportOptions {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  lang: Language;
  selectedZoneFilter?: number | 'all';
}

/**
 * Escapes and safely formats a string or number for CSV output
 */
function cleanVal(val: unknown): string | number {
  if (val === undefined || val === null) return '';
  return val as string | number;
}

/**
 * Generates and triggers download of a comprehensive CSV record file
 * containing both Zone Campaign Performance and Irrigation Schemes Registry.
 */
export function exportCampaignDataToCsv({
  zones,
  schemes,
  lang,
  selectedZoneFilter = 'all',
}: CsvExportOptions): void {
  const isOromo = lang === 'om';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Prepare Metadata Header Rows
  const metaRows: (string | number)[][] = [
    ['# BIIROO QONNAA OROMIYAA / OROMIA BUREAU OF AGRICULTURE'],
    ['# IRRIGATED WHEAT CAMPAIGN DATA EXPORT - OFFLINE RECORD KEEPING'],
    [`# Export Date: ${dateStr} ${timeStr}`],
    [`# Scope: ${selectedZoneFilter === 'all' ? 'All 14 Zones & Cities' : `Zone ID: ${selectedZoneFilter}`}`],
    [`# In collaboration with IQQO (Addisu H. and Getachew H.)`],
    [],
  ];

  // 2. Prepare Zone Campaign Data Rows
  const zoneHeaderRow = [
    'Zone ID',
    'Zone Name (Oromoo)',
    'Zone Name (English)',
    'Planned Area (ha)',
    'Prepared Area (ha)',
    'Prepared by Tractor (ha)',
    'Prepared by Oxen (ha)',
    'Wheat Sown Area (ha)',
    'Sowing Progress (%)',
    'Modern Irrigation (ha)',
    'Pump Irrigation (ha)',
    'Traditional Irrigation (ha)',
    'Hand Dug Well (ha)',
    'Pond Water (ha)',
    'Total Irrigated Area (ha)',
    'Expected Production (q)',
    'Target Avg Yield (q/ha)',
    'Planned Urea (q)',
    'Distributed Urea (q)',
    'Distributed NPS (q)',
    'Distributed Seed (q)',
    'Agrochem Sprayed Area (ha)',
    'Hand Weeded Area (ha)',
    'Tractors Deployed',
    'Combines Deployed',
    'Participating Farmers Male',
    'Participating Farmers Female',
    'Total Participating Farmers',
    'Clusters Established',
    'Cluster Area (ha)',
    'Commercial Investors',
    'Investor Sown Area (ha)',
    'Temporary Jobs Created',
    'Permanent Jobs Created',
    'Total Jobs Created',
    'Field Days Count',
    'Average Price (ETB/q)',
    'Top Reported Challenge',
    'Challenge Severity',
  ];

  const zoneDataRows = zones.map(z => {
    const totalIrrigated =
      (z.modernIrrigationHa || 0) +
      (z.pumpIrrigationHa || 0) +
      (z.traditionalIrrigationHa || 0) +
      (z.handDugWellHa || 0) +
      (z.pondWaterHa || 0);

    const sowingPercent = z.plannedAreaHa > 0
      ? ((z.sownAreaHa / z.plannedAreaHa) * 100).toFixed(1)
      : '0.0';

    const totalFarmers = (z.participatingFarmersMale || 0) + (z.participatingFarmersFemale || 0);
    const totalJobs = (z.temporaryJobsMale || 0) + (z.temporaryJobsFemale || 0) + (z.permanentJobsMale || 0) + (z.permanentJobsFemale || 0);

    return [
      z.id,
      z.name,
      z.nameEn,
      z.plannedAreaHa,
      z.preparedAreaHa,
      z.preparedByTractorHa,
      z.preparedByOxenHa,
      z.sownAreaHa,
      `${sowingPercent}%`,
      z.modernIrrigationHa,
      z.pumpIrrigationHa,
      z.traditionalIrrigationHa,
      z.handDugWellHa,
      z.pondWaterHa,
      totalIrrigated,
      z.expectedProductionQ,
      z.avgYieldQHa,
      z.plannedUreaQ,
      z.distributedUreaQ,
      z.distributedNpsQ,
      z.distributedSeedQ,
      z.chemicalSprayedAreaHa,
      z.handWeededAreaHa,
      z.tractorsDeployed,
      z.combinesDeployed,
      z.participatingFarmersMale,
      z.participatingFarmersFemale,
      totalFarmers,
      z.clustersEstablished,
      z.clusterAreaHa,
      z.investorCount,
      z.investorSownHa,
      (z.temporaryJobsMale || 0) + (z.temporaryJobsFemale || 0),
      (z.permanentJobsMale || 0) + (z.permanentJobsFemale || 0),
      totalJobs,
      z.fieldDaysCount,
      z.avgPriceEtbQ,
      cleanVal(z.topChallenge),
      cleanVal(z.challengeSeverity),
    ];
  });

  // Calculate totals across zones
  const totalPlanned = zones.reduce((sum, z) => sum + (z.plannedAreaHa || 0), 0);
  const totalPrepared = zones.reduce((sum, z) => sum + (z.preparedAreaHa || 0), 0);
  const totalSown = zones.reduce((sum, z) => sum + (z.sownAreaHa || 0), 0);
  const totalIrrigatedSum = zones.reduce(
    (sum, z) =>
      sum +
      (z.modernIrrigationHa || 0) +
      (z.pumpIrrigationHa || 0) +
      (z.traditionalIrrigationHa || 0) +
      (z.handDugWellHa || 0) +
      (z.pondWaterHa || 0),
    0
  );
  const totalProduction = zones.reduce((sum, z) => sum + (z.expectedProductionQ || 0), 0);
  const totalFarmersSum = zones.reduce(
    (sum, z) => sum + (z.participatingFarmersMale || 0) + (z.participatingFarmersFemale || 0),
    0
  );
  const totalClustersSum = zones.reduce((sum, z) => sum + (z.clustersEstablished || 0), 0);
  const totalClusterAreaSum = zones.reduce((sum, z) => sum + (z.clusterAreaHa || 0), 0);
  const totalInvestorsSum = zones.reduce((sum, z) => sum + (z.investorCount || 0), 0);
  const totalInvestorAreaSum = zones.reduce((sum, z) => sum + (z.investorSownHa || 0), 0);
  const overallSowingPct = totalPlanned > 0 ? ((totalSown / totalPlanned) * 100).toFixed(1) : '0.0';

  const zoneSummaryRow = [
    'TOTAL',
    'WALIIGALA NAANNOO',
    'REGIONAL TOTAL',
    totalPlanned,
    totalPrepared,
    zones.reduce((sum, z) => sum + (z.preparedByTractorHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.preparedByOxenHa || 0), 0),
    totalSown,
    `${overallSowingPct}%`,
    zones.reduce((sum, z) => sum + (z.modernIrrigationHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.pumpIrrigationHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.traditionalIrrigationHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.handDugWellHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.pondWaterHa || 0), 0),
    totalIrrigatedSum,
    totalProduction,
    totalPlanned > 0 ? (totalProduction / totalPlanned).toFixed(1) : 45.0,
    zones.reduce((sum, z) => sum + (z.plannedUreaQ || 0), 0),
    zones.reduce((sum, z) => sum + (z.distributedUreaQ || 0), 0),
    zones.reduce((sum, z) => sum + (z.distributedNpsQ || 0), 0),
    zones.reduce((sum, z) => sum + (z.distributedSeedQ || 0), 0),
    zones.reduce((sum, z) => sum + (z.chemicalSprayedAreaHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.handWeededAreaHa || 0), 0),
    zones.reduce((sum, z) => sum + (z.tractorsDeployed || 0), 0),
    zones.reduce((sum, z) => sum + (z.combinesDeployed || 0), 0),
    zones.reduce((sum, z) => sum + (z.participatingFarmersMale || 0), 0),
    zones.reduce((sum, z) => sum + (z.participatingFarmersFemale || 0), 0),
    totalFarmersSum,
    totalClustersSum,
    totalClusterAreaSum,
    totalInvestorsSum,
    totalInvestorAreaSum,
    zones.reduce((sum, z) => sum + (z.temporaryJobsMale || 0) + (z.temporaryJobsFemale || 0), 0),
    zones.reduce((sum, z) => sum + (z.permanentJobsMale || 0) + (z.permanentJobsFemale || 0), 0),
    zones.reduce(
      (sum, z) =>
        sum +
        (z.temporaryJobsMale || 0) +
        (z.temporaryJobsFemale || 0) +
        (z.permanentJobsMale || 0) +
        (z.permanentJobsFemale || 0),
      0
    ),
    zones.reduce((sum, z) => sum + (z.fieldDaysCount || 0), 0),
    Math.round(zones.reduce((sum, z) => sum + (z.avgPriceEtbQ || 0), 0) / Math.max(1, zones.length)),
    '-',
    '-',
  ];

  // 3. Prepare Scheme Registry Data Rows
  const schemeSectionHeader = [
    [],
    ['# SECTION 2: IRRIGATION SCHEMES & INFRASTRUCTURE REGISTRY'],
    [],
  ];

  const schemeHeaderRow = [
    'Scheme ID',
    'Scheme Name',
    'Zone Name',
    'Woreda',
    'Latitude',
    'Longitude',
    'Command Area (ha)',
    'Serviceable Area (ha)',
    'Actual Irrigated Wheat (ha)',
    'Scheme Functionality Status',
    'Water Availability',
    'Irrigation Method',
    'Water Source',
    'Total Pumps Installed',
    'Functional Pumps',
    'Pump Functionality (%)',
    'Operational Problem',
    'Beneficiary Farmers Count',
  ];

  const schemeDataRows = schemes.map(s => {
    const pumpPct = s.pumpsTotal > 0
      ? ((s.pumpsFunctional / s.pumpsTotal) * 100).toFixed(0) + '%'
      : 'N/A';

    return [
      s.id,
      s.name,
      s.zoneName,
      s.woreda,
      s.lat,
      s.lng,
      s.commandAreaHa,
      s.serviceableAreaHa,
      s.actualIrrigatedWheatHa,
      s.status.toUpperCase(),
      s.waterAvailability,
      s.method,
      s.waterSource,
      s.pumpsTotal,
      s.pumpsFunctional,
      pumpPct,
      cleanVal(s.operationalProblem),
      s.beneficiariesCount,
    ];
  });

  const totalSchemeCommand = schemes.reduce((sum, s) => sum + (s.commandAreaHa || 0), 0);
  const totalSchemeServiceable = schemes.reduce((sum, s) => sum + (s.serviceableAreaHa || 0), 0);
  const totalSchemeIrrigated = schemes.reduce((sum, s) => sum + (s.actualIrrigatedWheatHa || 0), 0);
  const totalSchemePumps = schemes.reduce((sum, s) => sum + (s.pumpsTotal || 0), 0);
  const totalSchemeFuncPumps = schemes.reduce((sum, s) => sum + (s.pumpsFunctional || 0), 0);
  const totalBeneficiaries = schemes.reduce((sum, s) => sum + (s.beneficiariesCount || 0), 0);

  const schemeSummaryRow = [
    'TOTAL',
    `Total Schemes: ${schemes.length}`,
    'All Zones',
    '-',
    '-',
    '-',
    totalSchemeCommand,
    totalSchemeServiceable,
    totalSchemeIrrigated,
    '-',
    '-',
    '-',
    '-',
    totalSchemePumps,
    totalSchemeFuncPumps,
    totalSchemePumps > 0 ? ((totalSchemeFuncPumps / totalSchemePumps) * 100).toFixed(0) + '%' : 'N/A',
    '-',
    totalBeneficiaries,
  ];

  // Combine into single CSV table with clear headers
  const allRows = [
    ...metaRows,
    ['# SECTION 1: ZONE CAMPAIGN PERFORMANCE INDICATORS'],
    zoneHeaderRow,
    ...zoneDataRows,
    zoneSummaryRow,
    ...schemeSectionHeader,
    schemeHeaderRow,
    ...schemeDataRows,
    schemeSummaryRow,
  ];

  // Generate CSV string using PapaParse
  const csvContent = Papa.unparse(allRows);

  // Add UTF-8 BOM so Microsoft Excel correctly renders all special characters & languages
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileName = `oromia_wheat_campaign_records_${dateStr}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
