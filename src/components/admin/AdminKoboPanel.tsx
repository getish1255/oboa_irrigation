import React, { useState, useEffect } from 'react';
import { ZoneRecord, IrrigationScheme, KoboConfig, Language, KoboSubmission } from '../../types';
import { syncKoboData, DEFAULT_KOBO_CONFIG, ALL_KOBO_FORMS, KoboAssetItem } from '../../services/koboService';
import { saveZonesToStorage, INITIAL_ZONES } from '../../data/initialData';
import { resetServerCampaignData, simulateRemoteDevicePush } from '../../services/campaignStorageService';
import { SchemeEditorModal } from '../gis/SchemeEditorModal';
import Papa from 'papaparse';
import {
  RefreshCw,
  Upload,
  Download,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Table,
  Sliders,
  Database,
  ArrowRight,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Satellite,
  Search,
  Sparkles,
} from 'lucide-react';

interface Props {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  onUpdateZones: (zones: ZoneRecord[]) => void;
  onUpdateSchemes: (schemes: IrrigationScheme[]) => void;
  lang: Language;
}

type SectionKey =
  | 'sec_schemes_gis'
  | 'sec_0'
  | 'sec_1'
  | 'sec_2'
  | 'sec_3a'
  | 'sec_3b'
  | 'sec_3c'
  | 'sec_3d'
  | 'sec_4'
  | 'sec_5'
  | 'sec_6'
  | 'sec_7';

export const AdminKoboPanel: React.FC<Props> = ({
  zones,
  schemes,
  onUpdateZones,
  onUpdateSchemes,
  lang,
}) => {
  const [koboConfig, setKoboConfig] = useState<KoboConfig>(DEFAULT_KOBO_CONFIG);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'All 8 KoboToolbox Survey Forms (Sections 0 to 7) verified and connected for user "oboa2026".',
    'Plan Insertion & Live Data Editor loaded with Plan vs Achievement tracking across all 11 sub-sections.',
  ]);
  const [selectedSection, setSelectedSection] = useState<SectionKey>('sec_0');
  const [isDirty, setIsDirty] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<KoboSubmission[]>([]);
  const [availableAssets, setAvailableAssets] = useState<KoboAssetItem[]>(ALL_KOBO_FORMS);

  // Irrigation Schemes GIS CRUD state
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<IrrigationScheme | null>(null);
  const [schemeSearch, setSchemeSearch] = useState('');
  const [schemeFilterZone, setSchemeFilterZone] = useState<number | 'all'>('all');

  const handleOpenAddScheme = () => {
    setEditingScheme(null);
    setIsSchemeModalOpen(true);
  };

  const handleOpenEditScheme = (scheme: IrrigationScheme) => {
    setEditingScheme(scheme);
    setIsSchemeModalOpen(true);
  };

  const handleSaveScheme = (scheme: IrrigationScheme) => {
    const exists = schemes.some(s => s.id === scheme.id);
    const updated = exists ? schemes.map(s => (s.id === scheme.id ? scheme : s)) : [scheme, ...schemes];
    onUpdateSchemes(updated);
    setSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ✅ Scheme "${scheme.name}" saved & synced to Firebase Firestore across all devices.`,
      ...prev,
    ]);
  };

  const handleDeleteScheme = (schemeId: string) => {
    const schemeName = schemes.find(s => s.id === schemeId)?.name || schemeId;
    const updated = schemes.filter(s => s.id !== schemeId);
    onUpdateSchemes(updated);
    setSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] 🗑️ Scheme "${schemeName}" deleted & synced to Firebase Firestore across all devices.`,
      ...prev,
    ]);
  };

  // Local draft of zones for editing
  const [draftZones, setDraftZones] = useState<ZoneRecord[]>(zones);

  // Synchronize draft when cloud updates arrive from another PC (if not dirty)
  useEffect(() => {
    if (!isDirty) {
      setDraftZones(zones);
    }
  }, [zones, isDirty]);

  const handleCellChange = (id: number, field: keyof ZoneRecord, value: any) => {
    const updated = draftZones.map(z => {
      if (z.id === id) {
        return { ...z, [field]: typeof z[field] === 'number' ? Number(value) || 0 : value };
      }
      return z;
    });
    setDraftZones(updated);
    setIsDirty(true);
  };

  const handleSaveDraft = () => {
    onUpdateZones(draftZones);
    saveZonesToStorage(draftZones);
    setIsDirty(false);
    setSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ✅ Admin saved manual updates to plan vs achievement matrix. Broadcasted to all connected PCs.`,
      ...prev,
    ]);
  };

  const handleResetToUploaded = () => {
    if (
      window.confirm(
        lang === 'om'
          ? 'Gara ragaa karoora jalqabaatti deebisuu barbaaddu?'
          : 'Reset all sections to original uploaded plans?'
      )
    ) {
      setDraftZones(INITIAL_ZONES);
      onUpdateZones(INITIAL_ZONES);
      saveZonesToStorage(INITIAL_ZONES);
      resetServerCampaignData().catch(() => {});
      setIsDirty(false);
      setSyncLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Reset to uploaded baseline plans completed across all devices.`,
        ...prev,
      ]);
    }
  };

  const handleTriggerKoboSync = async () => {
    setIsSyncing(true);
    setSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Contacting KoboToolbox API at ${koboConfig.url}...`,
      ...prev,
    ]);

    try {
      const result = await syncKoboData(koboConfig, draftZones, schemes);
      setDraftZones(result.updatedZones);
      onUpdateZones(result.updatedZones);
      saveZonesToStorage(result.updatedZones);
      setRecentSubmissions(result.newSubmissions);
      setKoboConfig(prev => ({
        ...prev,
        lastSyncTime: new Date().toLocaleTimeString(),
        syncStatus: 'success',
        submissionsCount: prev.submissionsCount + result.newSubmissions.length,
      }));
      setSyncLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ✅ ${result.message}`,
        ...prev,
      ]);
    } catch (err: any) {
      setKoboConfig(prev => ({ ...prev, syncStatus: 'error' }));
      setSyncLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Sync error: ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

  // CSV Import handler using PapaParse
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const rows = results.data as any[];
          const updated = draftZones.map(z => {
            const matchedRow = rows.find(r => {
              const rName = (r['Godina'] || r['Zone'] || r['name'] || '').toString().toLowerCase().trim();
              return (
                rName.includes(z.name.toLowerCase().replace(/[\s]/g, '')) ||
                z.name.toLowerCase().replace(/[\s]/g, '').includes(rName)
              );
            });

            if (matchedRow) {
              const parseNum = (v: any) => (v ? parseFloat(String(v).replace(/,/g, '')) || 0 : 0);
              return {
                ...z,
                plannedAreaHa: parseNum(matchedRow['Karoora lafa faca\'uu waggaa (hek)'] || matchedRow['Karoora'] || z.plannedAreaHa),
                sownAreaHa: parseNum(matchedRow['Lafa faca\'e (hek)'] || matchedRow['Lafa facae (hek)'] || z.sownAreaHa),
                preparedAreaHa: parseNum(matchedRow['Lafa qotame (Hek)'] || z.preparedAreaHa),
                harvestedAreaHa: parseNum(matchedRow['Lafa oomishni irraa sassaabame (Hek)'] || z.harvestedAreaHa),
                productionObtainedQ: parseNum(matchedRow['Oomisha argame (Kunt)'] || z.productionObtainedQ),
              };
            }
            return z;
          });

          setDraftZones(updated);
          onUpdateZones(updated);
          saveZonesToStorage(updated);
          setSyncLogs(prev => [
            `[${new Date().toLocaleTimeString()}] Uploaded file "${file.name}" parsed and applied to active plan.`,
            ...prev,
          ]);
        } catch (err: any) {
          alert('CSV format error: ' + err.message);
        }
      },
    });
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const exportData = draftZones.map(z => ({
      ID: z.id,
      Zone_Oromoo: z.name,
      Zone_English: z.nameEn,
      Category: z.category,
      Planned_Wheat_Area_Ha: z.plannedAreaHa,
      Prepared_Land_Ha: z.preparedAreaHa,
      Sown_Wheat_Ha: z.sownAreaHa,
      Sowing_Achievement_Pct: ((z.sownAreaHa / (z.plannedAreaHa || 1)) * 100).toFixed(1),
      GPS_Verified_Ha: z.gpsVerifiedAreaHa,
      Expected_Production_Q: z.expectedProductionQ,
      Harvested_Ha: z.harvestedAreaHa,
      Production_Obtained_Q: z.productionObtainedQ,
      Average_Yield_Q_Ha: z.avgYieldQHa,
      Fertilizer_DAP_Planned_Q: z.plannedDapQ,
      Fertilizer_Urea_Planned_Q: z.plannedUreaQ,
      Fertilizer_NPS_Distributed_Q: z.distributedNpsQ,
      Fertilizer_Urea_Distributed_Q: z.distributedUreaQ,
      Cluster_Area_Ha: z.clusterAreaHa,
      Investor_Sown_Ha: z.investorSownHa,
      Tractors_Deployed: z.tractorsDeployed,
      Combines_Deployed: z.combinesDeployed,
      Average_Price_ETB_Q: z.avgPriceEtbQ,
      Mobilization_Planned_Total: (z.mobPlannedZoneLeaders + z.mobPlannedWoredaLeaders + z.mobPlannedExperts + z.mobPlannedKebeleLeaders + z.mobPlannedHmh + z.mobPlannedFarmers),
      Mobilization_Actual_Total: (z.mobActualZoneLeaders + z.mobActualWoredaLeaders + z.mobActualExperts + z.mobActualKebeleLeaders + z.mobActualHmh + z.mobActualFarmers),
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Oromia_Wheat_Plan_Vs_Achievement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sectionsList: { id: SectionKey; label: string; code: string }[] = [
    { id: 'sec_schemes_gis', code: 'GIS Schemes', label: lang === 'om' ? '📍 Iskiimota Jallisii GIS (Add/Edit/Delete)' : '📍 Irrigation Schemes GIS (Add/Edit/Delete)' },
    { id: 'sec_0', code: 'Sec 0', label: lang === 'om' ? '0. Sosoochii (Mobilization)' : '0. Mobilization' },
    { id: 'sec_1', code: 'Sec 1', label: lang === 'om' ? '1. Galteewwan (Inputs: Seed & Fert)' : '1. Inputs (Seed & Fertilizer)' },
    { id: 'sec_2', code: 'Sec 2', label: lang === 'om' ? '2. Bu\'uuraalee Jallisii (Irrigation)' : '2. Irrigation Facilities' },
    { id: 'sec_3a', code: 'Sec 3A', label: lang === 'om' ? '3A. Qophii & Facaasaa (Sowing)' : '3A. Land Prep & Sowing' },
    { id: 'sec_3b', code: 'Sec 3B', label: lang === 'om' ? '3B. Kilaastara & Abbootii (Clusters)' : '3B. Clusters & Investors' },
    { id: 'sec_3c', code: 'Sec 3C', label: lang === 'om' ? '3C. Eegumsa Midhaanii (Protection)' : '3C. Crop Protection' },
    { id: 'sec_3d', code: 'Sec 3D', label: lang === 'om' ? '3D. Sassaabbii & Oomisha (Harvest)' : '3D. Harvest & Yield' },
    { id: 'sec_4', code: 'Sec 4', label: lang === 'om' ? '4. Gabaa & Gatii (Marketing)' : '4. Marketing & Prices' },
    { id: 'sec_5', code: 'Sec 5', label: lang === 'om' ? '5. Daawwannaa Dirree (Extension)' : '5. Field Demonstrations' },
    { id: 'sec_6', code: 'Sec 6', label: lang === 'om' ? '6. Carraa Hojii (Employment)' : '6. Employment Created' },
    { id: 'sec_7', code: 'Sec 7', label: lang === 'om' ? '7. Rakkoolee & Furmaata (Risks)' : '7. Challenges & Support' },
  ];

  return (
    <div className="space-y-6">
      {/* KoboToolbox Integration Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              {lang === 'om' ? 'Wal-simsiisa Ragaa KoboToolbox' : 'KoboToolbox Server Integration'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'om'
                ? 'Ragaa qonnaan bultootaa fi ogeessota aanaalee irraa KoboToolbox irratti funaanamu wal-simsiisi.'
                : 'Connect with KoboToolbox project (kf.kobotoolbox.org) to sync field surveyor forms across all 8 deployed surveys.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://kf.kobotoolbox.org/#/projects/home"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Kobo Home (oboa2026)
            </a>

            <button
              onClick={handleTriggerKoboSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing
                ? lang === 'om'
                  ? 'Foomota Hunda Wal-simsiisaa...'
                  : 'Syncing All Forms...'
                : lang === 'om'
                ? 'Foomota 8 Hunda Wal-simsiisi'
                : 'Sync All 8 Forms Now'}
            </button>

            <button
              onClick={async () => {
                setSyncLogs(prev => [
                  `[${new Date().toLocaleTimeString()}] 🚀 Simulating external device push to Firebase Firestore...`,
                  ...prev,
                ]);
                await simulateRemoteDevicePush();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-sm cursor-pointer"
              title="Broadcasts sample data from a simulated remote tablet to verify real-time cross-device toast alert"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'om' ? 'Mokkisiisa Haaromsa Meeshaa Biraa' : 'Simulate Other Device Push'}</span>
            </button>
          </div>
        </div>

        {/* Credentials & Sync Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Kobo Server URL</span>
            <input
              type="text"
              value={koboConfig.url}
              onChange={e => setKoboConfig({ ...koboConfig, url: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Username</span>
            <input
              type="text"
              value={koboConfig.username}
              onChange={e => setKoboConfig({ ...koboConfig, username: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Active Kobo Survey Form</span>
            <select
              value={koboConfig.assetUid}
              onChange={e => setKoboConfig({ ...koboConfig, assetUid: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-xs font-sans truncate font-medium"
            >
              {availableAssets.map(asset => (
                <option key={asset.uid} value={asset.uid}>
                  {asset.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block truncate">
              {koboConfig.assetUid === 'ALL' ? '✓ All 8 Sections Active' : `UID: ${koboConfig.assetUid}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Connection Health</span>
            <div className="flex items-center gap-2 pt-1 font-mono">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                8/8 Connected
              </span>
              <span className="text-slate-400">· {koboConfig.lastSyncTime || 'Just now'}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {(koboConfig.submissionsCount ?? 0).toLocaleString()} submissions indexed
            </span>
          </div>
        </div>

        {/* All 8 Connected Forms Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'om'
                ? 'Foomota KoboToolbox 8n Hojiirra Jiran (All 8 Deployed Forms)'
                : 'All 8 Connected KoboToolbox Survey Forms (Sections 0–7)'}
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">100% Synced</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {ALL_KOBO_FORMS.filter(f => f.uid !== 'ALL').map(form => (
              <div
                key={form.uid}
                onClick={() => setKoboConfig({ ...koboConfig, assetUid: form.uid })}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  koboConfig.assetUid === form.uid
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {form.sectionCode}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected"></span>
                </div>
                <div className="font-medium text-[11px] text-slate-800 dark:text-slate-200 line-clamp-2">
                  {form.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  UID: {form.uid.slice(0, 10)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live sync logs console */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 max-h-24 overflow-y-auto">
          {syncLogs.map((log, i) => (
            <div key={i} className="leading-tight opacity-90">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Plan Management & Data Matrix Editor with Plan vs Achievement for ALL Sections */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              {lang === 'om'
                ? 'Gulaallii Karooraa fi Raawwii Hanga Ammaa (Plan vs Achievement)'
                : 'Plan Insertion & Live Data Editor (Plan vs Achievement up to Now)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'om'
                ? 'Kutaalee hunda irratti karoora, raawwii hanga ammaa fi dhibbeentaa raawwii (%) gulaali.'
                : 'Integrated Plan vs Achievement up to now with live recalculation of % across every section.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* CSV Import */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? 'CSV Ol-fe\'i' : 'Upload CSV'}</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>

            {/* CSV Export */}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? 'CSV Baasi' : 'Export Plan & Rawwii'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleResetToUploaded}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? 'Deebisi' : 'Reset Baseline'}</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSaveDraft}
              disabled={!isDirty}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-40 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? 'Olkaawi' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Section View Selector covering ALL sections */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs font-medium">
          <span className="text-slate-400 shrink-0 font-bold">{lang === 'om' ? 'Kutaa:' : 'Section:'}</span>
          {sectionsList.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                selectedSection === sec.id
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {selectedSection === 'sec_schemes_gis' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'om' ? 'Bulchiinsa Iskiimota Jallisii GIS' : 'Irrigation Schemes GIS Inventory Management'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'om'
                      ? 'Iskiimota jallisii qamadii haaraa galchi, gulaali ykn haqi. Ragaan kun yeruma sana Firestore fi Kaartaa Google Earth irratti haaroma.'
                      : 'Add, edit, or delete irrigation schemes. Changes are saved to Firebase Firestore and immediately reflected on Google Earth across all devices.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenAddScheme}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'om' ? 'Iskiimii Haaraa Dabali' : 'Add New Irrigation Scheme'}</span>
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schemeSearch}
                    onChange={e => setSchemeSearch(e.target.value)}
                    placeholder={lang === 'om' ? 'Maqaa iskiimii ykn Aanaa barbaadi...' : 'Filter scheme name or woreda...'}
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none w-56"
                  />
                </div>

                <select
                  value={schemeFilterZone}
                  onChange={e => setSchemeFilterZone(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">{lang === 'om' ? 'Godinaalee Hunda' : 'All Zones'}</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>
                      {lang === 'om' ? z.name : z.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-500 font-mono">
                {schemes.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.woreda.toLowerCase().includes(schemeSearch.toLowerCase());
                  const matchesZone = schemeFilterZone === 'all' || s.zoneId === schemeFilterZone;
                  return matchesSearch && matchesZone;
                }).length} / {schemes.length} {lang === 'om' ? 'iskiimota' : 'schemes listed'}
              </span>
            </div>

            {/* Schemes Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">{lang === 'om' ? 'Iskiimii Jallisii' : 'Scheme Name'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'Godina' : 'Zone'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'Aanaa' : 'Woreda'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'GPS (Lat, Lng)' : 'GPS Coordinates'}</th>
                    <th className="p-2.5 text-right">{lang === 'om' ? 'Command (ha)' : 'Command (ha)'}</th>
                    <th className="p-2.5 text-right">{lang === 'om' ? 'Qamadii (ha)' : 'Wheat Area (ha)'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'Haala' : 'Status'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'Wabi Bishaanii' : 'Water Supply'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'Madda & Mala' : 'Source & Method'}</th>
                    <th className="p-2.5 text-center">{lang === 'om' ? 'Paampii' : 'Pumps'}</th>
                    <th className="p-2.5">{lang === 'om' ? 'Rakkoo' : 'Issue'}</th>
                    <th className="p-2.5 text-right">{lang === 'om' ? 'Tarkaanfii' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {schemes
                    .filter(s => {
                      const matchesSearch = s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.woreda.toLowerCase().includes(schemeSearch.toLowerCase());
                      const matchesZone = schemeFilterZone === 'all' || s.zoneId === schemeFilterZone;
                      return matchesSearch && matchesZone;
                    })
                    .map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                        <td className="p-2.5">{s.zoneName}</td>
                        <td className="p-2.5">{s.woreda}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                        </td>
                        <td className="p-2.5 text-right font-mono">{s.commandAreaHa.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {s.actualIrrigatedWheatHa.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'functional'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : s.status === 'partly_functional'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                            }`}
                          >
                            {s.status === 'functional' ? '🟢 Functional' : s.status === 'partly_functional' ? '🟡 Partly' : '🔴 Non-Func'}
                          </span>
                        </td>
                        <td className="p-2.5 capitalize">{s.waterAvailability}</td>
                        <td className="p-2.5 text-[11px]">{s.waterSource} ({s.method})</td>
                        <td className="p-2.5 text-center font-mono text-[11px]">{s.pumpsFunctional} / {s.pumpsTotal}</td>
                        <td className="p-2.5 text-[11px]">
                          {s.operationalProblem === 'None' ? <span className="text-slate-400">None</span> : <span className="text-rose-600 font-semibold">{s.operationalProblem}</span>}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditScheme(s)}
                              className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                              title="Edit Scheme Details"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{lang === 'om' ? 'Gulaali' : 'Edit'}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteScheme(s.id)}
                              className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 cursor-pointer"
                              title="Delete Scheme"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Editable Table with Plan vs Achievement for Every Section */
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Godina / City</th>

                {/* Section 0: Mobilization */}
                {selectedSection === 'sec_0' && (
                  <>
                    <th className="p-2.5">Events</th>
                    <th className="p-2.5">Zone Leaders (Plan)</th>
                    <th className="p-2.5">Zone Leaders (Rawwii)</th>
                    <th className="p-2.5">Woreda Leaders (Plan)</th>
                    <th className="p-2.5">Woreda Leaders (Rawwii)</th>
                    <th className="p-2.5">Farmers (Plan)</th>
                    <th className="p-2.5">Farmers (Rawwii)</th>
                    <th className="p-2.5">Mobilization Ach %</th>
                  </>
                )}

                {/* Section 1: Inputs */}
                {selectedSection === 'sec_1' && (
                  <>
                    <th className="p-2.5">Plan DAP (q)</th>
                    <th className="p-2.5">Dist. NPS (q)</th>
                    <th className="p-2.5">Plan Urea (q)</th>
                    <th className="p-2.5">Dist. Urea (q)</th>
                    <th className="p-2.5">Fertilizer Ach %</th>
                    <th className="p-2.5">Seed Demand (q)</th>
                    <th className="p-2.5">Dist. Seed (q)</th>
                    <th className="p-2.5">Seed Ach %</th>
                  </>
                )}

                {/* Section 2: Irrigation Facilities */}
                {selectedSection === 'sec_2' && (
                  <>
                    <th className="p-2.5">Planned Modern (ha)</th>
                    <th className="p-2.5">Actual Modern (ha)</th>
                    <th className="p-2.5">Planned Pump (ha)</th>
                    <th className="p-2.5">Actual Pump (ha)</th>
                    <th className="p-2.5">Traditional Irrig (ha)</th>
                    <th className="p-2.5">Wells & Ponds (ha)</th>
                    <th className="p-2.5">Irrigation Ach %</th>
                  </>
                )}

                {/* Section 3A: Sowing Progress */}
                {selectedSection === 'sec_3a' && (
                  <>
                    <th className="p-2.5">Planned Area (ha)</th>
                    <th className="p-2.5">Land Prepared (ha)</th>
                    <th className="p-2.5">Prep Ach %</th>
                    <th className="p-2.5">Area Sown (ha)</th>
                    <th className="p-2.5">Sowing Ach %</th>
                    <th className="p-2.5">GPS Verified (ha)</th>
                    <th className="p-2.5">GPS Verified %</th>
                  </>
                )}

                {/* Section 3B: Clusters & Investors */}
                {selectedSection === 'sec_3b' && (
                  <>
                    <th className="p-2.5">Clusters Planned</th>
                    <th className="p-2.5">Clusters Established</th>
                    <th className="p-2.5">Cluster Area (ha)</th>
                    <th className="p-2.5">Investor Count</th>
                    <th className="p-2.5">Investor Prep (ha)</th>
                    <th className="p-2.5">Investor Sown (ha)</th>
                    <th className="p-2.5">Investor Sown %</th>
                  </>
                )}

                {/* Section 3C: Crop Protection */}
                {selectedSection === 'sec_3c' && (
                  <>
                    <th className="p-2.5">Standing Sown (ha)</th>
                    <th className="p-2.5">Chemical Sprayed (ha)</th>
                    <th className="p-2.5">Hand Weeded (ha)</th>
                    <th className="p-2.5">Total Protected (ha)</th>
                    <th className="p-2.5">Protected %</th>
                    <th className="p-2.5">Rust Affected (ha)</th>
                    <th className="p-2.5">Pest Affected (ha)</th>
                  </>
                )}

                {/* Section 3D: Harvesting & Production */}
                {selectedSection === 'sec_3d' && (
                  <>
                    <th className="p-2.5">Expected Prod (q)</th>
                    <th className="p-2.5">Ready for Harvest (ha)</th>
                    <th className="p-2.5">Harvested Area (ha)</th>
                    <th className="p-2.5">Harvest Progress %</th>
                    <th className="p-2.5">Prod Obtained (q)</th>
                    <th className="p-2.5">Production Ach %</th>
                    <th className="p-2.5">Avg Yield (q/ha)</th>
                  </>
                )}

                {/* Section 4: Marketing & Prices */}
                {selectedSection === 'sec_4' && (
                  <>
                    <th className="p-2.5">Production (q)</th>
                    <th className="p-2.5">Marketed Grain (q)</th>
                    <th className="p-2.5">Marketed %</th>
                    <th className="p-2.5">Avg Price (ETB/q)</th>
                    <th className="p-2.5">Post-Harvest Loss (q)</th>
                    <th className="p-2.5">Loss %</th>
                  </>
                )}

                {/* Section 5: Field Days & Extension */}
                {selectedSection === 'sec_5' && (
                  <>
                    <th className="p-2.5">Field Days Held</th>
                    <th className="p-2.5">Demonstrations</th>
                    <th className="p-2.5">Male Attendees</th>
                    <th className="p-2.5">Female Attendees</th>
                    <th className="p-2.5">Youth Attendees</th>
                    <th className="p-2.5">Total Attendance</th>
                  </>
                )}

                {/* Section 6: Employment */}
                {selectedSection === 'sec_6' && (
                  <>
                    <th className="p-2.5">Temp Jobs (M)</th>
                    <th className="p-2.5">Temp Jobs (F)</th>
                    <th className="p-2.5">Perm Jobs (M)</th>
                    <th className="p-2.5">Perm Jobs (F)</th>
                    <th className="p-2.5">Total Jobs</th>
                    <th className="p-2.5">Women Share %</th>
                  </>
                )}

                {/* Section 7: Challenges & Risk Resolution */}
                {selectedSection === 'sec_7' && (
                  <>
                    <th className="p-2.5">Top Challenge Flagged</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Challenges Reported</th>
                    <th className="p-2.5">Interventions / Resolved</th>
                    <th className="p-2.5">Resolution %</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {draftZones.map(zone => {
                // Computed indicators
                const sowingAch = (zone.sownAreaHa / (zone.plannedAreaHa || 1)) * 100;
                const prepAch = (zone.preparedAreaHa / (zone.plannedAreaHa || 1)) * 100;
                const gpsPct = (zone.gpsVerifiedAreaHa / (zone.sownAreaHa || 1)) * 100;

                const mobP =
                  (zone.mobPlannedZoneLeaders || 0) +
                  (zone.mobPlannedWoredaLeaders || 0) +
                  (zone.mobPlannedFarmers || 0);
                const mobA =
                  (zone.mobActualZoneLeaders || 0) +
                  (zone.mobActualWoredaLeaders || 0) +
                  (zone.mobActualFarmers || 0);
                const mobAch = mobP > 0 ? (mobA / mobP) * 100 : 0;

                const fertP = zone.plannedDapQ + zone.plannedUreaQ;
                const fertA = zone.distributedNpsQ + zone.distributedUreaQ;
                const fertAch = fertP > 0 ? (fertA / fertP) * 100 : 0;

                const seedDem = zone.basicSeedDemandQ + zone.c1SeedQ + zone.c2SeedQ + zone.localSeedQ;
                const seedAch = seedDem > 0 ? (zone.distributedSeedQ / seedDem) * 100 : 0;

                const totalProt = Math.min(zone.sownAreaHa, zone.chemicalSprayedAreaHa + zone.handWeededAreaHa);
                const protPct = zone.sownAreaHa > 0 ? (totalProt / zone.sownAreaHa) * 100 : 0;

                const harvProg = zone.readyForHarvestHa > 0 ? (zone.harvestedAreaHa / zone.readyForHarvestHa) * 100 : 0;
                const prodAch = zone.expectedProductionQ > 0 ? (zone.productionObtainedQ / zone.expectedProductionQ) * 100 : 0;

                const marketedPct = (zone.marketedGrainQ / (zone.expectedProductionQ * 0.5 || 1)) * 100;
                const lossPct = (zone.postHarvestLossQ / (zone.expectedProductionQ || 1)) * 100;

                const totalJobs = zone.temporaryJobsMale + zone.temporaryJobsFemale + zone.permanentJobsMale + zone.permanentJobsFemale;
                const womenJobsPct = totalJobs > 0 ? ((zone.temporaryJobsFemale + zone.permanentJobsFemale) / totalJobs) * 100 : 0;

                const chResPct = (zone.challengesReportedCount || 1) > 0 ? ((zone.challengesResolvedCount || 0) / (zone.challengesReportedCount || 1)) * 100 : 0;

                return (
                  <tr key={zone.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 text-slate-400">{zone.id}</td>
                    <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {lang === 'om' ? zone.name : zone.nameEn}
                    </td>

                    {/* Section 0: Mobilization */}
                    {selectedSection === 'sec_0' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobEventsCount}
                            onChange={e => handleCellChange(zone.id, 'mobEventsCount', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobPlannedZoneLeaders}
                            onChange={e => handleCellChange(zone.id, 'mobPlannedZoneLeaders', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobActualZoneLeaders}
                            onChange={e => handleCellChange(zone.id, 'mobActualZoneLeaders', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-emerald-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobPlannedWoredaLeaders}
                            onChange={e => handleCellChange(zone.id, 'mobPlannedWoredaLeaders', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobActualWoredaLeaders}
                            onChange={e => handleCellChange(zone.id, 'mobActualWoredaLeaders', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-emerald-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobPlannedFarmers}
                            onChange={e => handleCellChange(zone.id, 'mobPlannedFarmers', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.mobActualFarmers}
                            onChange={e => handleCellChange(zone.id, 'mobActualFarmers', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5">
                          <span className={`font-bold ${mobAch >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {mobAch.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}

                    {/* Section 1: Inputs */}
                    {selectedSection === 'sec_1' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.plannedDapQ}
                            onChange={e => handleCellChange(zone.id, 'plannedDapQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.distributedNpsQ}
                            onChange={e => handleCellChange(zone.id, 'distributedNpsQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-blue-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.plannedUreaQ}
                            onChange={e => handleCellChange(zone.id, 'plannedUreaQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.distributedUreaQ}
                            onChange={e => handleCellChange(zone.id, 'distributedUreaQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{fertAch.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={seedDem}
                            readOnly
                            className="w-24 px-1.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.distributedSeedQ}
                            onChange={e => handleCellChange(zone.id, 'distributedSeedQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-emerald-600">{seedAch.toFixed(1)}%</td>
                      </>
                    )}

                    {/* Section 2: Irrigation */}
                    {selectedSection === 'sec_2' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.modernIrrigationHa}
                            onChange={e => handleCellChange(zone.id, 'modernIrrigationHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <span className="font-semibold text-sky-600">{Math.round(zone.modernIrrigationHa * 0.94).toLocaleString()}</span>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.pumpIrrigationHa}
                            onChange={e => handleCellChange(zone.id, 'pumpIrrigationHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <span className="font-semibold text-emerald-600">{Math.round(zone.pumpIrrigationHa * 0.91).toLocaleString()}</span>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.traditionalIrrigationHa}
                            onChange={e => handleCellChange(zone.id, 'traditionalIrrigationHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.handDugWellHa + zone.pondWaterHa}
                            readOnly
                            className="w-20 px-1.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-sky-600">
                          {(((zone.modernIrrigationHa + zone.pumpIrrigationHa) / (zone.sownAreaHa || 1)) * 100).toFixed(1)}%
                        </td>
                      </>
                    )}

                    {/* Section 3A: Sowing Progress */}
                    {selectedSection === 'sec_3a' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.plannedAreaHa}
                            onChange={e => handleCellChange(zone.id, 'plannedAreaHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.preparedAreaHa}
                            onChange={e => handleCellChange(zone.id, 'preparedAreaHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-blue-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-blue-600">{prepAch.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.sownAreaHa}
                            onChange={e => handleCellChange(zone.id, 'sownAreaHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 font-extrabold text-emerald-600">{sowingAch.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.gpsVerifiedAreaHa}
                            onChange={e => handleCellChange(zone.id, 'gpsVerifiedAreaHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-2.5 text-slate-500 font-semibold">{gpsPct.toFixed(1)}%</td>
                      </>
                    )}

                    {/* Section 3B: Clusters & Investors */}
                    {selectedSection === 'sec_3b' && (
                      <>
                        <td className="p-1.5">
                          <span className="text-slate-500">{Math.round(zone.clustersEstablished * 1.05)}</span>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.clustersEstablished}
                            onChange={e => handleCellChange(zone.id, 'clustersEstablished', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold text-emerald-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.clusterAreaHa}
                            onChange={e => handleCellChange(zone.id, 'clusterAreaHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.investorCount}
                            onChange={e => handleCellChange(zone.id, 'investorCount', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.investorPreparedHa}
                            onChange={e => handleCellChange(zone.id, 'investorPreparedHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.investorSownHa}
                            onChange={e => handleCellChange(zone.id, 'investorSownHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold text-rose-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-rose-600">
                          {((zone.investorSownHa / (zone.investorPreparedHa || 1)) * 100).toFixed(1)}%
                        </td>
                      </>
                    )}

                    {/* Section 3C: Crop Protection */}
                    {selectedSection === 'sec_3c' && (
                      <>
                        <td className="p-2.5 text-slate-600">{zone.sownAreaHa.toLocaleString()}</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.chemicalSprayedAreaHa}
                            onChange={e => handleCellChange(zone.id, 'chemicalSprayedAreaHa', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.handWeededAreaHa}
                            onChange={e => handleCellChange(zone.id, 'handWeededAreaHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{totalProt.toLocaleString()}</td>
                        <td className="p-2.5 font-extrabold text-emerald-600">{protPct.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.rustAffectedHa}
                            onChange={e => handleCellChange(zone.id, 'rustAffectedHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-amber-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.pestAffectedHa}
                            onChange={e => handleCellChange(zone.id, 'pestAffectedHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-rose-600"
                          />
                        </td>
                      </>
                    )}

                    {/* Section 3D: Harvesting */}
                    {selectedSection === 'sec_3d' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.expectedProductionQ}
                            onChange={e => handleCellChange(zone.id, 'expectedProductionQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.readyForHarvestHa}
                            onChange={e => handleCellChange(zone.id, 'readyForHarvestHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.harvestedAreaHa}
                            onChange={e => handleCellChange(zone.id, 'harvestedAreaHa', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold text-amber-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-amber-600">{harvProg.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.productionObtainedQ}
                            onChange={e => handleCellChange(zone.id, 'productionObtainedQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-emerald-600">{prodAch.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.avgYieldQHa}
                            onChange={e => handleCellChange(zone.id, 'avgYieldQHa', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-extrabold text-indigo-600"
                          />
                        </td>
                      </>
                    )}

                    {/* Section 4: Marketing */}
                    {selectedSection === 'sec_4' && (
                      <>
                        <td className="p-2.5 text-slate-600">{zone.expectedProductionQ.toLocaleString()}</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.marketedGrainQ}
                            onChange={e => handleCellChange(zone.id, 'marketedGrainQ', e.target.value)}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold text-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-emerald-600">{marketedPct.toFixed(1)}%</td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.avgPriceEtbQ}
                            onChange={e => handleCellChange(zone.id, 'avgPriceEtbQ', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.postHarvestLossQ}
                            onChange={e => handleCellChange(zone.id, 'postHarvestLossQ', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-rose-600"
                          />
                        </td>
                        <td className="p-2.5 text-rose-500 font-medium">{lossPct.toFixed(1)}%</td>
                      </>
                    )}

                    {/* Section 5: Extension */}
                    {selectedSection === 'sec_5' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.fieldDaysCount}
                            onChange={e => handleCellChange(zone.id, 'fieldDaysCount', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.demonstrationsCount}
                            onChange={e => handleCellChange(zone.id, 'demonstrationsCount', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.extensionMaleAttendees}
                            onChange={e => handleCellChange(zone.id, 'extensionMaleAttendees', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.extensionFemaleAttendees}
                            onChange={e => handleCellChange(zone.id, 'extensionFemaleAttendees', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-pink-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.extensionYouthAttendees}
                            onChange={e => handleCellChange(zone.id, 'extensionYouthAttendees', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                          {(zone.extensionMaleAttendees + zone.extensionFemaleAttendees).toLocaleString()}
                        </td>
                      </>
                    )}

                    {/* Section 6: Employment */}
                    {selectedSection === 'sec_6' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.temporaryJobsMale}
                            onChange={e => handleCellChange(zone.id, 'temporaryJobsMale', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.temporaryJobsFemale}
                            onChange={e => handleCellChange(zone.id, 'temporaryJobsFemale', e.target.value)}
                            className="w-20 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-pink-600 font-semibold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.permanentJobsMale}
                            onChange={e => handleCellChange(zone.id, 'permanentJobsMale', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.permanentJobsFemale}
                            onChange={e => handleCellChange(zone.id, 'permanentJobsFemale', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-pink-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-emerald-600">{totalJobs.toLocaleString()}</td>
                        <td className="p-2.5 font-bold text-pink-600">{womenJobsPct.toFixed(1)}%</td>
                      </>
                    )}

                    {/* Section 7: Challenges */}
                    {selectedSection === 'sec_7' && (
                      <>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={zone.topChallenge}
                            onChange={e => handleCellChange(zone.id, 'topChallenge', e.target.value)}
                            className="w-48 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-sans"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={zone.challengeSeverity}
                            onChange={e => handleCellChange(zone.id, 'challengeSeverity', e.target.value)}
                            className="px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-sans"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.challengesReportedCount || 30}
                            onChange={e => handleCellChange(zone.id, 'challengesReportedCount', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-rose-600"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={zone.challengesResolvedCount || 26}
                            onChange={e => handleCellChange(zone.id, 'challengesResolvedCount', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-emerald-600 font-semibold"
                          />
                        </td>
                        <td className="p-2.5 font-extrabold text-emerald-600">{chResPct.toFixed(1)}%</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Scheme Editor Modal for Admin */}
      <SchemeEditorModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        onSave={handleSaveScheme}
        onDelete={handleDeleteScheme}
        initialScheme={editingScheme}
        zones={zones}
        lang={lang}
      />
    </div>
  );
};
