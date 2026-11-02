/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IrrigationScheme, Language, ZoneRecord } from '../types';
import { getTotals } from '../data/initialData';

export interface GeneratePdfOptions {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  lang: Language;
  selectedZoneId?: number | 'all';
}

export function generateExecutivePdfReport({
  zones,
  schemes,
  lang,
  selectedZoneId = 'all',
}: GeneratePdfOptions): void {
  const isOromo = lang === 'om';
  const totals = getTotals(zones);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(isOromo ? 'om-ET' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString(isOromo ? 'om-ET' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isFiltered = selectedZoneId !== 'all';
  const targetZone = isFiltered ? zones.find(z => z.id === selectedZoneId) : undefined;
  const scopeTitle = targetZone
    ? (isOromo ? `Godina: ${targetZone.name}` : `Zone: ${targetZone.nameEn}`)
    : (isOromo ? 'Gabaasa Sadarkaa Naannoo (Godinoota 14)' : 'Regional Level Report (All 14 Zones & Cities)');

  // Derived aggregations directly from zones array
  const totalIrrigationHa = zones.reduce(
    (acc, z) => acc + (z.modernIrrigationHa || 0) + (z.pumpIrrigationHa || 0) + (z.traditionalIrrigationHa || 0) + (z.handDugWellHa || 0) + (z.pondWaterHa || 0),
    0
  );

  const weightedAvgYield = totals.plannedAreaHa > 0
    ? (zones.reduce((acc, z) => acc + (z.avgYieldQHa || 0) * (z.plannedAreaHa || 0), 0) / totals.plannedAreaHa).toFixed(1)
    : '45.0';

  const averagePriceEtb = Math.round(
    zones.reduce((acc, z) => acc + (z.avgPriceEtbQ || 0), 0) / Math.max(1, zones.length)
  );

  const preparedByTractor = zones.reduce((acc, z) => acc + (z.preparedByTractorHa || 0), 0);
  const preparedByOxen = zones.reduce((acc, z) => acc + (z.preparedByOxenHa || 0), 0);
  const utilizedUrea = zones.reduce((acc, z) => acc + (z.utilizedUreaQ || 0), 0);
  const ureaAppliedArea = zones.reduce((acc, z) => acc + (z.ureaAppliedAreaHa || 0), 0);
  const totalAgroChem = zones.reduce(
    (acc, z) => acc + (z.herbicideLit || 0) + (z.fungicideLit || 0) + (z.insecticideLit || 0),
    0
  );
  const harvestedByCombine = zones.reduce((acc, z) => acc + (z.harvestedByCombineHa || 0), 0);
  const mobExpertsCount = zones.reduce((acc, z) => acc + (z.mobActualExperts || 0), 0);
  const clusterHouseholds = zones.reduce(
    (acc, z) => acc + (z.clusterHouseholdsMale || 0) + (z.clusterHouseholdsFemale || 0),
    0
  );
  const investorPrepared = zones.reduce((acc, z) => acc + (z.investorPreparedHa || 0), 0);
  const femaleFarmers = zones.reduce((acc, z) => acc + (z.participatingFarmersFemale || 0), 0);
  const femaleSeasonalJobs = zones.reduce((acc, z) => acc + (z.temporaryJobsFemale || 0), 0);
  const youthFieldAttendees = zones.reduce((acc, z) => acc + (z.extensionYouthAttendees || 0), 0);

  const functionalPumpsRatio = schemes.length > 0
    ? Math.round(
        (schemes.reduce((acc, s) => acc + (s.pumpsFunctional || 0), 0) /
          Math.max(1, schemes.reduce((acc, s) => acc + (s.pumpsTotal || 0), 0))) * 100
      )
    : 85;

  const functionalSchemesRatio = schemes.length > 0
    ? Math.round(
        (schemes.filter(s => s.status === 'functional').length / Math.max(1, schemes.length)) * 100
      )
    : 82;

  const totalSowingAchv = totals.plannedAreaHa > 0
    ? ((totals.sownAreaHa / totals.plannedAreaHa) * 100).toFixed(1)
    : '0';

  const totalFarmers = totals.farmersMale + totals.farmersFemale;
  const totalJobs = totals.temporaryJobs + totals.permanentJobs;

  // Initialize jsPDF document (Portrait, A4, millimeters)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Palette
  const emeraldDark: [number, number, number] = [6, 78, 59]; // #064e3b
  const emeraldPrimary: [number, number, number] = [4, 120, 87]; // #047857
  const goldAccent: [number, number, number] = [180, 83, 9]; // #b45309
  const textDark: [number, number, number] = [30, 41, 59]; // #1e293b
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const bgLight: [number, number, number] = [248, 250, 252]; // #f8fafc

  let cursorY = margin;

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE DASHBOARD
  // ==========================================

  // Top header banner background
  doc.setFillColor(...emeraldDark);
  doc.rect(margin, cursorY, contentWidth, 28, 'F');

  // Decorative gold line below banner
  doc.setFillColor(...goldAccent);
  doc.rect(margin, cursorY + 28, contentWidth, 1.5, 'F');

  // Organization Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BIIROO QONNAA OROMIYAA / OROMIA BUREAU OF AGRICULTURE', margin + 6, cursorY + 8);

  // Campaign Title
  doc.setFontSize(16);
  doc.text('Oromia BOA Irrigated Wheat Report', margin + 6, cursorY + 16);

  // Subtitle / Scope
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(
    `${isOromo ? 'Duula Misooma Qamadii Jallisii Bonaa' : 'Dry Season Irrigated Wheat Production Campaign'} | ${scopeTitle}`,
    margin + 6,
    cursorY + 23
  );

  cursorY += 34;

  // Metadata & Collaboration Bar
  doc.setFillColor(...bgLight);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 15, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${isOromo ? 'Guyyaa' : 'Date'}: ${dateFormatted} (${timeFormatted})`, margin + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(
    `${isOromo ? 'Qaama Gabaasaa' : 'Authority'}: Directorate of Irrigation & Agricultural Mechanization`,
    margin + 4,
    cursorY + 10.5
  );

  // IQQO Footnote highlight badge on right
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldPrimary);
  doc.text('In collaboration with IQQO (Addisu H. and Getachew H.)', pageWidth - margin - 4, cursorY + 8, {
    align: 'right',
  });

  cursorY += 20;

  // SECTION: EXECUTIVE KPI HIGHLIGHTS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...emeraldDark);
  doc.text(isOromo ? '1. Agarsiistota Ijoo Hooggansaa (Top Executive KPIs)' : '1. Executive KPI Summary Scorecard', margin, cursorY);

  cursorY += 4;

  const kpiData = [
    [
      isOromo ? 'Karoora Lafa Facaasaa (ha)' : 'Total Irrigated Wheat Planned (ha)',
      totals.plannedAreaHa.toLocaleString() + ' ha',
      isOromo ? 'Lafa Qophaa\'e (ha)' : 'Total Land Prepared (ha)',
      totals.preparedAreaHa.toLocaleString() + ' ha',
    ],
    [
      isOromo ? 'Lafa Faca\'e (ha)' : 'Total Wheat Sown (ha)',
      totals.sownAreaHa.toLocaleString() + ' ha',
      isOromo ? 'Raawwii Facaasaa (%)' : 'Sowing Achievement (%)',
      `${totalSowingAchv}%`,
    ],
    [
      isOromo ? 'Lafa Jallisiin Tajaajilame (ha)' : 'Irrigated Area Served (ha)',
      totalIrrigationHa.toLocaleString() + ' ha',
      isOromo ? 'Oomisha Eegamu (kunt)' : 'Expected Grain Production (q)',
      totals.expectedProductionQ.toLocaleString() + ' q',
    ],
    [
      isOromo ? 'Oomishtummaa G/galeessaa (q/ha)' : 'Average Yield (q/ha)',
      `${weightedAvgYield} q/ha`,
      isOromo ? 'Iskiimota Hojjatan (%)' : 'Functional Schemes (%)',
      `${functionalSchemesRatio}%`,
    ],
    [
      isOromo ? 'Paampoota Hojjatan (%)' : 'Functional Pumps (%)',
      `${functionalPumpsRatio}%`,
      isOromo ? 'Qonnaan Bultoota Hirmaatan' : 'Farmers Participating (M+F)',
      totalFarmers.toLocaleString(),
    ],
    [
      isOromo ? 'Bal\'ina Kilaastaraa (ha)' : 'Cluster Area (ha)',
      totals.clusterAreaHa.toLocaleString() + ' ha',
      isOromo ? 'Lafa Abbootii Qabeenyaa (ha)' : 'Private Investor Area (ha)',
      totals.investorSownHa.toLocaleString() + ' ha',
    ],
    [
      isOromo ? 'Carraa Hojii Uumame' : 'Employment Created (Total)',
      totalJobs.toLocaleString() + ` (${isOromo ? 'dargaggoo/dubartii' : 'youth/women'})`,
      isOromo ? 'Gatii Qamadii G/galeessaa' : 'Average Wheat Price (ETB/q)',
      `${averagePriceEtb.toLocaleString()} ETB/q`,
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isOromo ? 'Agarsiistuu (Indicator)' : 'Primary Metric',
      isOromo ? 'Gatii / Raawwii' : 'Current Value',
      isOromo ? 'Agarsiistuu (Indicator)' : 'Secondary Metric',
      isOromo ? 'Gatii / Raawwii' : 'Current Value',
    ]],
    body: kpiData,
    theme: 'grid',
    headStyles: {
      fillColor: emeraldPrimary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.2,
    },
    styles: {
      fontSize: 7.8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', fontStyle: 'bold', textColor: emeraldDark, cellWidth: 41 },
      2: { fontStyle: 'bold', cellWidth: 50 },
      3: { halign: 'right', fontStyle: 'bold', textColor: emeraldDark, cellWidth: 41 },
    },
    margin: { left: margin, right: margin },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // SECTION: SECTION 0 & INPUT SUPPLY SNAPSHOT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...emeraldDark);
  doc.text(
    isOromo ? '2. Sosoochii (Kutaa 0) fi Dhiyeessii Galteewwanii (Kutaa 3)' : '2. Mobilization (Section 0) & Input Supply Summary',
    margin,
    cursorY
  );

  cursorY += 4;

  const totalSeedDist = totals.distributedSeedQ;
  const totalFertilizerDist = totals.distributedNpsQ + totals.distributedUreaQ;

  const sectionSummaryData = [
    [
      isOromo ? 'Sosoochii Qonnaan Bulaa (Karoora vs Raawwii)' : 'Farmer Mobilization (Planned vs Actual)',
      `${(totals.mobPlannedFarmers ?? 0).toLocaleString()} vs ${(totals.mobActualFarmers ?? 0).toLocaleString()} (${(((totals.mobActualFarmers ?? 0) / Math.max(1, totals.mobPlannedFarmers ?? 1)) * 100).toFixed(1)}%)`,
      isOromo ? 'Ogeeyyii fi DAs Leenjifaman' : 'Experts & DAs Trained (Sec 0)',
      `${mobExpertsCount.toLocaleString()} ${isOromo ? 'ogeeyyii' : 'experts'}`,
    ],
    [
      isOromo ? 'Qophii Lafaa Tiraktaraan (ha)' : 'Tractor Land Preparation (ha)',
      `${preparedByTractor.toLocaleString()} ha (${((preparedByTractor / Math.max(1, totals.preparedAreaHa)) * 100).toFixed(0)}%)`,
      isOromo ? 'Qophii Lafaa Qotiyyoon (ha)' : 'Oxen Land Preparation (ha)',
      `${preparedByOxen.toLocaleString()} ha (${((preparedByOxen / Math.max(1, totals.preparedAreaHa)) * 100).toFixed(0)}%)`,
    ],
    [
      isOromo ? 'Sanyii Filatamaa Raabsame (kunt)' : 'Certified Seed Distributed (q)',
      `${totalSeedDist.toLocaleString()} q (C1, C2, Basic)`,
      isOromo ? 'Xaa\'oo Raabsame (NPSB + Urea)' : 'Fertilizer Distributed (NPSB + Urea)',
      `${totalFertilizerDist.toLocaleString()} q`,
    ],
    [
      isOromo ? 'Urea Top-dressing Hojiirra Oole' : 'Urea Utilized / Applied Area',
      `${utilizedUrea.toLocaleString()} q (${ureaAppliedArea.toLocaleString()} ha)`,
      isOromo ? 'Keemikaala Raabsame (Liitira)' : 'Agrochemicals Applied (Liters)',
      `${totalAgroChem.toLocaleString()} L (Herb, Fung, Insect)`,
    ],
    [
      isOromo ? 'Lafa Sassaabbiif Gahe (ha)' : 'Area Ready for Harvest (ha)',
      `${totals.readyForHarvestHa.toLocaleString()} ha`,
      isOromo ? 'Lafa Sassaabbame (ha)' : 'Harvested Area to Date (ha)',
      `${totals.harvestedAreaHa.toLocaleString()} ha (${harvestedByCombine.toLocaleString()} ha combine)`,
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isOromo ? 'Kutaalee Hojii' : 'Campaign Domain',
      isOromo ? 'Raawwii / Lakkoofsa' : 'Output / Performance',
      isOromo ? 'Kutaalee Hojii' : 'Campaign Domain',
      isOromo ? 'Raawwii / Lakkoofsa' : 'Output / Performance',
    ]],
    body: sectionSummaryData,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85], // Slate
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: textDark,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 41 },
      2: { fontStyle: 'bold', cellWidth: 50 },
      3: { cellWidth: 41 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer for page 1
  addDocumentPageFooter(doc, 1, 3, isOromo);

  // ==========================================
  // PAGE 2: DETAILED 14-ZONE PERFORMANCE AUDIT
  // ==========================================
  doc.addPage();
  cursorY = margin;

  // Page 2 Header Banner
  doc.setFillColor(...emeraldDark);
  doc.rect(margin, cursorY, contentWidth, 14, 'F');
  doc.setFillColor(...goldAccent);
  doc.rect(margin, cursorY + 14, contentWidth, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    isOromo
      ? '3. Gabatee Raawwii Godinoota 14 (Zonal Comparative Audit Table)'
      : '3. 14-Zone & City Administration Campaign Audit Table',
    margin + 4,
    cursorY + 9
  );

  cursorY += 20;

  // Table of all zones with comprehensive metrics
  const zonalTableRows = zones.map((z, idx) => {
    const achv = z.plannedAreaHa > 0 ? ((z.sownAreaHa / z.plannedAreaHa) * 100).toFixed(1) : '0';
    const totalJobs = (z.temporaryJobsMale || 0) + (z.temporaryJobsFemale || 0) + (z.permanentJobsMale || 0) + (z.permanentJobsFemale || 0);
    const irrigationTotal = (z.modernIrrigationHa || 0) + (z.pumpIrrigationHa || 0) + (z.traditionalIrrigationHa || 0);
    const name = isOromo ? z.name : z.nameEn;

    return [
      `${idx + 1}. ${name}`,
      z.plannedAreaHa.toLocaleString(),
      z.preparedAreaHa.toLocaleString(),
      z.sownAreaHa.toLocaleString(),
      `${achv}%`,
      irrigationTotal.toLocaleString(),
      `${z.avgYieldQHa.toFixed(1)}`,
      z.expectedProductionQ.toLocaleString(),
      totalJobs.toLocaleString(),
      z.topChallenge || 'Normal',
    ];
  });

  // Add regional summary totals row
  zonalTableRows.push([
    isOromo ? 'WALIIGALA NAANNOO (TOTAL)' : 'REGIONAL TOTAL / AVERAGE',
    totals.plannedAreaHa.toLocaleString(),
    totals.preparedAreaHa.toLocaleString(),
    totals.sownAreaHa.toLocaleString(),
    `${totalSowingAchv}%`,
    totalIrrigationHa.toLocaleString(),
    `${weightedAvgYield}`,
    totals.expectedProductionQ.toLocaleString(),
    totalJobs.toLocaleString(),
    isOromo ? 'Hordoffii Itti-fufe' : 'Active Oversight',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isOromo ? 'Godina / Bulchiinsa' : 'Zone / City Admin',
      isOromo ? 'Karoora (ha)' : 'Planned (ha)',
      isOromo ? 'Qophaa\'e (ha)' : 'Prep. (ha)',
      isOromo ? 'Faca\'e (ha)' : 'Sown (ha)',
      isOromo ? 'Raawwii %' : 'Achv %',
      isOromo ? 'Jallisii (ha)' : 'Irrig. (ha)',
      isOromo ? 'Oomish (q/ha)' : 'Yield (q/ha)',
      isOromo ? 'Oomisha (q)' : 'Prod. (q)',
      isOromo ? 'Hojii Uumame' : 'Jobs',
      isOromo ? 'Rakkoo Ijoo' : 'Key Challenge',
    ]],
    body: zonalTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: emeraldPrimary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      cellPadding: 2,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { halign: 'right', cellWidth: 16 },
      2: { halign: 'right', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 16 },
      4: { halign: 'center', fontStyle: 'bold', textColor: emeraldDark, cellWidth: 14 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
      8: { halign: 'right', cellWidth: 14 },
      9: { cellWidth: 24, fontSize: 6 },
    },
    didParseCell: (data) => {
      // Highlight the total summary row
      if (data.row.index === zonalTableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // Slate 100
        if (data.column.index === 4) {
          data.cell.styles.textColor = emeraldDark;
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Add notes block below table
  doc.setFillColor(...bgLight);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(
    isOromo ? 'Hubachiisa Hubannoo Hooggansaa:' : 'Executive Strategic Note:',
    margin + 3,
    cursorY + 4.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  const noteText = isOromo
    ? 'Raawwiin facaasaa lafaa fi dhiyeessiin galteewwanii (sanyii fi xaa\'oo) guyyaa guyyaan sirna KoboToolbox fi gabaasa damee qonnaatiin hordofamaa jira. Qorannoon saayinsii IQQO waliin qindaa\'eera.'
    : 'All zonal sowing progress, seed-fertilizer input supplies, and irrigation scheme pump functionality are monitored daily via synchronized KoboToolbox mobile submissions and verified field checklists in collaboration with IQQO researchers.';
  doc.text(doc.splitTextToSize(noteText, contentWidth - 6), margin + 3, cursorY + 9);

  // Footer for page 2
  addDocumentPageFooter(doc, 2, 3, isOromo);

  // ==========================================
  // PAGE 3: SPECIAL PROGRAM BREAKDOWN & SIGN-OFF
  // ==========================================
  doc.addPage();
  cursorY = margin;

  // Page 3 Header Banner
  doc.setFillColor(...emeraldDark);
  doc.rect(margin, cursorY, contentWidth, 14, 'F');
  doc.setFillColor(...goldAccent);
  doc.rect(margin, cursorY + 14, contentWidth, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    isOromo
      ? '4. Sagantaalee Addaa, Hirmaannaa fi Mallattoo Mirkaneessaa'
      : '4. Special Programs, Inclusivity & Official Endorsement',
    margin + 4,
    cursorY + 9
  );

  cursorY += 20;

  // Special Programs Table
  const specialProgramsData = [
    [
      isOromo ? 'Qonna Kilaastaraa (Clusters)' : 'Cluster Farming Initiative',
      `${totals.clustersEstablished.toLocaleString()} ${isOromo ? 'kilaastaroota' : 'clusters'}`,
      `${totals.clusterAreaHa.toLocaleString()} ha (${((totals.clusterAreaHa / Math.max(1, totals.sownAreaHa)) * 100).toFixed(1)}% of sown area)`,
      `${clusterHouseholds.toLocaleString()} ${isOromo ? 'abbaa warraa' : 'households'}`,
    ],
    [
      isOromo ? 'Abbootii Qabeenyaa Dhuunfaa' : 'Commercial Private Investors',
      `${totals.investorCount.toLocaleString()} ${isOromo ? 'abbootii qabeenyaa' : 'investors'}`,
      `${totals.investorSownHa.toLocaleString()} ha ${isOromo ? 'faca\'e' : 'sown'}`,
      `${investorPrepared.toLocaleString()} ha ${isOromo ? 'qophaa\'e' : 'prepared'}`,
    ],
    [
      isOromo ? 'Hirmaannaa Dubartootaa fi Dargaggoo' : 'Gender & Youth Inclusion',
      `${femaleFarmers.toLocaleString()} ${isOromo ? 'dubartoota qotee bulaa' : 'female farmers'}`,
      `${femaleSeasonalJobs.toLocaleString()} ${isOromo ? 'carraa hojii dubartootaa' : 'female seasonal jobs'}`,
      `${youthFieldAttendees.toLocaleString()} ${isOromo ? 'dargaggoota daawwatan' : 'youth in field days'}`,
    ],
    [
      isOromo ? 'Mekaanayizeeshinii (Tiraktara & Kombayinii)' : 'Mechanization Deployment',
      `${totals.tractorsDeployed.toLocaleString()} ${isOromo ? 'tiraktaroota' : 'tractors deployed'}`,
      `${totals.combinesDeployed.toLocaleString()} ${isOromo ? 'kombayinoota' : 'combine harvesters'}`,
      `${harvestedByCombine.toLocaleString()} ha ${isOromo ? 'kombayiniin sassaabbame' : 'combine harvested'}`,
    ],
    [
      isOromo ? 'Iskimiilee Jallisii fi Qorannoo Lafa' : 'Irrigation Schemes & GPS Verification',
      `${schemes.length} ${isOromo ? 'iskiimota galmaa\'an' : 'monitored schemes'}`,
      `${totals.gpsVerifiedAreaHa.toLocaleString()} ha GPS verified`,
      `${functionalPumpsRatio}% ${isOromo ? 'paampoota nagaa' : 'functional pump rate'}`,
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isOromo ? 'Sagantaa / Kallattii' : 'Strategic Initiative',
      isOromo ? 'Baay\'ina / Hirmaattota' : 'Scale / Participants',
      isOromo ? 'Uwwisa Lafaa (ha)' : 'Coverage (ha)',
      isOromo ? 'Gabaasa Dabalataa' : 'Impact / Progress',
    ]],
    body: specialProgramsData,
    theme: 'striped',
    headStyles: {
      fillColor: emeraldPrimary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: textDark,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 46 },
      1: { cellWidth: 42 },
      2: { cellWidth: 46 },
      3: { cellWidth: 48 },
    },
    margin: { left: margin, right: margin },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Technical Backstopping & Collaboration Box
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(52, 211, 153); // Emerald 400
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...emeraldDark);
  doc.text(
    isOromo ? 'QORANNOO SAAYINSII FI DEEGGARSA TEEKINIKAA (IQQO):' : 'SCIENTIFIC RESEARCH & TECHNICAL BACKSTOPPING (IQQO):',
    margin + 4,
    cursorY + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  const iqqoParagraph = isOromo
    ? 'Hojiin misooma qamadii jallisii kun deeggarsa saayinsawaa Dhaabbata Qorannoo Qonna Oromiyaa (IQQO) waliin taasisamuun qindaa\'e. Qorattoonni IQQO (Addisu H. fi Getachew H.) adeemsa filannoo sanyii, to\'annoo dhibee waajiraa (wheat rust), toftaa jallisii qusataa fi qulqullina sassaabbii irratti hordoffii wal-irraa hin cinne gochaa jiru.'
    : 'This dry season irrigated wheat monitoring system is implemented under rigorous scientific backstopping by the Oromia Agricultural Research Institute (IQQO). Technical lead researchers Addisu H. and Getachew H. provide continual advisory on variety adaptability, stripe/stem rust epidemiology, precision irrigation water scheduling, and post-harvest quality verification.';
  doc.text(doc.splitTextToSize(iqqoParagraph, contentWidth - 8), margin + 4, cursorY + 11);

  cursorY += 32;

  // OFFICIAL ENDORSEMENT & SIGN-OFF BLOCK
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...emeraldDark);
  doc.text(isOromo ? 'Mallattoo fi Mirkaneessa Hooggansaa:' : 'Official Sign-off & Verification:', margin, cursorY);

  cursorY += 8;

  // 2-column signature block
  const colWidth = (contentWidth - 8) / 2;

  // Sign-off 1: Directorate
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, cursorY, colWidth, 42, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(
    isOromo ? 'Qindeessaa / Daarektoreetii Jallisii:' : 'Prepared By: Directorate of Irrigation',
    margin + 4,
    cursorY + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Oromia Bureau of Agriculture', margin + 4, cursorY + 11);
  doc.text(`${isOromo ? 'Maqaa' : 'Name'}: ___________________________`, margin + 4, cursorY + 22);
  doc.text(`${isOromo ? 'Mallattoo' : 'Signature'}: ______________________`, margin + 4, cursorY + 29);
  doc.text(`${isOromo ? 'Guyyaa' : 'Date'}: ___________________________`, margin + 4, cursorY + 36);

  // Sign-off 2: IQQO Collaboration
  const col2X = margin + colWidth + 8;
  doc.rect(col2X, cursorY, colWidth, 42, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Technical Endorsement: IQQO Research Team', col2X + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('In collaboration with IQQO (Addisu H. & Getachew H.)', col2X + 4, cursorY + 11);
  doc.text(`${isOromo ? 'Maqaa' : 'Name'}: Addisu H. / Getachew H.`, col2X + 4, cursorY + 22);
  doc.text(`${isOromo ? 'Mallattoo' : 'Signature'}: ______________________`, col2X + 4, cursorY + 29);
  doc.text(`${isOromo ? 'Guyyaa' : 'Date'}: ___________________________`, col2X + 4, cursorY + 36);

  // Footer for page 3
  addDocumentPageFooter(doc, 3, 3, isOromo);

  // Generate downloadable file name
  const timestampStr = now.toISOString().slice(0, 10);
  const fileName = `Oromia_BOA_Irrigated_Wheat_Report_${timestampStr}.pdf`;

  // Trigger browser download
  doc.save(fileName);
}

/**
 * Helper to add standardized running headers & footers across all document pages
 */
function addDocumentPageFooter(
  doc: jsPDF,
  currentPage: number,
  totalPages: number,
  isOromo: boolean
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Top running header line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 8, pageWidth - margin, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Oromia BOA Irrigated Wheat Report · Biiroo Qonnaa Oromiyaa', margin, 6);
  doc.text('Official Campaign Audit', pageWidth - margin, 6, { align: 'right' });

  // Bottom footer line
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

  // Bottom text
  doc.text(
    'In collaboration with IQQO (Addisu H. and Getachew H.)',
    margin,
    pageHeight - 6
  );

  doc.text(
    `${isOromo ? 'Fuula' : 'Page'} ${currentPage} / ${totalPages}`,
    pageWidth - margin,
    pageHeight - 6,
    { align: 'right' }
  );
}
