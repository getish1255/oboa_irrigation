export type Language = 'en' | 'om';

export type DashboardTab =
  | 'regional_exec'       // 17. Regional Management Dashboard (Executive Power BI)
  | 'mobilization'        // 0. Mobilization Dashboard (Section 0 - Sosoochii)
  | 'executive_kpis'      // 1. Executive KPI Dashboard (Top Cards)
  | 'area_progress'       // 2. Area Coverage Progress
  | 'input_supply'        // 3. Input Supply Dashboard
  | 'irrigation_infra'    // 4. Irrigation Infrastructure
  | 'gis_map'             // 5. GIS Dashboard
  | 'mechanization'       // 6. Mechanization Dashboard
  | 'demographics'        // 7. Farm Demographics
  | 'cluster_farming'     // 8. Cluster Farming
  | 'private_investor'    // 9. Private Investor
  | 'crop_protection'     // 10. Crop Protection
  | 'crop_condition'      // 11. Crop Condition
  | 'harvest_yield'       // 12. Harvest Dashboard
  | 'marketing'           // 13. Marketing Dashboard
  | 'extension'           // 14. Extension Dashboard
  | 'employment'          // 15. Employment Dashboard
  | 'challenge_risk'      // 16. Challenge & Risk
  | 'advanced_analytics'  // Advanced Analytics & Scorecard
  | 'admin_kobo';         // Admin Plan Editor & KoboToolbox Sync

export interface ZoneRecord {
  id: number;
  name: string;
  nameEn: string;
  category: 'zone' | 'city';
  // Section 0: Mobilization (Sosoochii)
  mobEventsCount: number;
  mobPlannedZoneLeaders: number;
  mobActualZoneLeaders: number;
  mobPlannedWoredaLeaders: number;
  mobActualWoredaLeaders: number;
  mobPlannedExperts: number;
  mobActualExperts: number;
  mobPlannedKebeleLeaders: number;
  mobActualKebeleLeaders: number;
  mobPlannedHmh: number;
  mobActualHmh: number;
  mobPlannedFarmers: number;
  mobActualFarmers: number;
  // Area & Sowing
  plannedAreaHa: number;
  expectedProductionQ: number;
  preparedAreaHa: number;
  preparedByOxenHa: number;
  preparedByTractorHa: number;
  sownAreaHa: number;
  gpsVerifiedAreaHa: number;
  woredasStarted: number;
  sowingStartDate: string;
  // Irrigation Types (ha)
  modernIrrigationHa: number;
  pumpIrrigationHa: number;
  traditionalIrrigationHa: number;
  handDugWellHa: number;
  pondWaterHa: number;
  // Fertilizer (quintals)
  plannedDapQ: number;
  plannedUreaQ: number;
  distributedNpsQ: number;
  distributedUreaQ: number;
  utilizedUreaQ: number;
  ureaAppliedAreaHa: number;
  // Seed (quintals)
  basicSeedDemandQ: number;
  c1SeedQ: number;
  c2SeedQ: number;
  localSeedQ: number;
  distributedSeedQ: number;
  // Chemicals (Liters/Kg)
  herbicideLit: number;
  fungicideLit: number;
  insecticideLit: number;
  chemicalSprayedAreaHa: number;
  handWeededAreaHa: number;
  // Mechanization
  tractorsDeployed: number;
  combinesDeployed: number;
  // Harvest & Production
  readyForHarvestHa: number;
  harvestedAreaHa: number;
  harvestedByCombineHa: number;
  harvestedByHandHa: number;
  productionObtainedQ: number;
  productionByCombineQ: number;
  productionByHandQ: number;
  minYieldQHa: number;
  maxYieldQHa: number;
  avgYieldQHa: number;
  // Marketing & Price
  avgPriceEtbQ: number;
  marketedGrainQ: number;
  postHarvestLossQ: number;
  // Farmers & Demographics
  participatingFarmersMale: number;
  participatingFarmersFemale: number;
  // Clusters
  clustersEstablished: number;
  clusterAreaHa: number;
  clusterHouseholdsMale: number;
  clusterHouseholdsFemale: number;
  // Investors
  investorCount: number;
  investorPreparedHa: number;
  investorSownHa: number;
  // Employment
  temporaryJobsMale: number;
  temporaryJobsFemale: number;
  permanentJobsMale: number;
  permanentJobsFemale: number;
  // Extension & Field days
  fieldDaysCount: number;
  demonstrationsCount: number;
  extensionMaleAttendees: number;
  extensionFemaleAttendees: number;
  extensionYouthAttendees: number;
  // Crop Health & Stress (ha)
  rustAffectedHa: number;
  fusariumAffectedHa: number;
  pestAffectedHa: number;
  waterShortageHa: number;
  waterloggingHa: number;
  abandonedHa: number;
  // Prominent challenges
  topChallenge: string;
  challengeSeverity: 'Low' | 'Medium' | 'High';
  challengesReportedCount: number;
  challengesResolvedCount: number;
}

export interface IrrigationScheme {
  id: string;
  name: string;
  zoneId: number;
  zoneName: string;
  woreda: string;
  lat: number;
  lng: number;
  commandAreaHa: number;
  serviceableAreaHa: number;
  actualIrrigatedWheatHa: number;
  status: 'functional' | 'partly_functional' | 'non_functional';
  waterAvailability: 'adequate' | 'limited' | 'unavailable';
  method: 'Furrow' | 'Basin' | 'Sprinkler' | 'Drip' | 'Flood';
  waterSource: 'River' | 'Stream' | 'Spring' | 'Lake' | 'Dam' | 'Borehole' | 'Shallow Well' | 'Pond';
  pumpsTotal: number;
  pumpsFunctional: number;
  operationalProblem: 'None' | 'Pump breakdown' | 'Canal damage' | 'Siltation' | 'Water shortage' | 'Power cut';
  beneficiariesCount: number;
}

export interface KoboSubmission {
  id: string;
  submittedAt: string;
  surveyor: string;
  zone: string;
  woreda: string;
  schemeName: string;
  gpsCoords: [number, number];
  landPreparedHa: number;
  sownAreaHa: number;
  cropStage: string;
  functionalPumps: number;
  totalPumps: number;
  waterAdequacy: string;
  challengesReported: string[];
  observedYieldQHa?: number;
}

export interface KoboConfig {
  url: string;
  username: string;
  password?: string;
  token?: string;
  assetUid?: string;
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage?: string;
  submissionsCount: number;
}
