/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DashboardTab,
  Language,
  ZoneRecord,
  IrrigationScheme,
} from './types';
import {
  loadSavedZones,
  loadSavedSchemes,
  saveZonesToStorage,
  saveSchemesToStorage,
} from './data/initialData';
import { translations, getTranslation } from './data/translations';

// Dashboard Components
import { MobilizationDashboard } from './components/dashboards/MobilizationDashboard';
import { ExecutiveKpis } from './components/dashboards/ExecutiveKpis';
import { RegionalExecutiveDashboard } from './components/dashboards/RegionalExecutiveDashboard';
import { AreaCoverageDashboard } from './components/dashboards/AreaCoverageDashboard';
import { InputSupplyDashboard } from './components/dashboards/InputSupplyDashboard';
import { IrrigationInfraDashboard } from './components/dashboards/IrrigationInfraDashboard';
import { OromiaGisMap } from './components/gis/OromiaGisMap';
import { MechanizationDemographicsDashboard } from './components/dashboards/MechanizationDemographicsDashboard';
import { ClusterAndInvestorDashboard } from './components/dashboards/ClusterAndInvestorDashboard';
import { CropProtectionConditionDashboard } from './components/dashboards/CropProtectionConditionDashboard';
import { HarvestMarketingDashboard } from './components/dashboards/HarvestMarketingDashboard';
import { ExtensionEmploymentRiskDashboard } from './components/dashboards/ExtensionEmploymentRiskDashboard';
import { AdvancedAnalyticsDashboard } from './components/dashboards/AdvancedAnalyticsDashboard';
import { AdminKoboPanel } from './components/admin/AdminKoboPanel';
import { AdminAuthGate } from './components/admin/AdminAuthGate';
import { generateExecutivePdfReport } from './utils/pdfReportGenerator';
import {
  fetchCampaignDataFromServer,
  saveZonesToServer,
  saveSchemesToServer,
  checkServerStatus,
  subscribeToRealtimeCampaignData,
} from './services/campaignStorageService';
import { testConnection } from './services/firebaseService';
import { GlobalSearchBar } from './components/common/GlobalSearchBar';
import { ToastProvider, useToast } from './components/common/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { FuturisticBackground } from './components/common/FuturisticBackground';
import { getDeviceLabel } from './utils/deviceIdentity';
import oromiaLogo from './assets/logo.png';

// Icons
import {
  Wheat,
  Globe,
  Sun,
  Moon,
  Smartphone,
  Sliders,
  Printer,
  ChevronDown,
  Filter,
  FileDown,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Cloud,
  Bell,
  Cpu,
} from 'lucide-react';
import { exportCampaignDataToCsv } from './utils/csvExport';

function AppContent() {
  const { notifyRemoteFirebaseSync, setIsHistoryOpen, history } = useToast();
  const [lang, setLang] = useState<Language>('en'); // default interface language English as requested
  const [activeTab, setActiveTab] = useState<DashboardTab>('regional_exec');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<number | 'all'>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Core state
  const [zones, setZones] = useState<ZoneRecord[]>(() => loadSavedZones());
  const [schemes, setSchemes] = useState<IrrigationScheme[]>(() => loadSavedSchemes());

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Multi-device server synchronization state
  const [serverVersion, setServerVersion] = useState<number>(0);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncedText, setLastSyncedText] = useState<string>('Live');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // 1. Initial shared fetch & real-time Firebase cloud listener (Zero-latency cross-PC sync)
  useEffect(() => {
    let isMounted = true;
    setIsCloudSyncing(true);

    // Test Firestore connection on boot as mandated by skill
    testConnection().then((connected) => {
      if (isMounted) setIsFirebaseConnected(connected);
    });

    // Initial fetch from cloud/server
    fetchCampaignDataFromServer().then((data) => {
      if (isMounted && data && Array.isArray(data.zones) && data.zones.length > 0) {
        setZones(data.zones);
        saveZonesToStorage(data.zones);
        if (Array.isArray(data.schemes) && data.schemes.length > 0) {
          setSchemes(data.schemes);
          saveSchemesToStorage(data.schemes);
        }
        setServerVersion(data.version);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      if (isMounted) setIsCloudSyncing(false);
    });

    // 2. Real-time Firebase Firestore listener:
    // Any change made on PC A immediately pushes to PC B, mobile phones, or shared preview links!
    const unsubscribe = subscribeToRealtimeCampaignData((data, meta) => {
      if (isMounted && data && Array.isArray(data.zones) && data.zones.length > 0) {
        setZones(data.zones);
        saveZonesToStorage(data.zones);
        if (Array.isArray(data.schemes) && data.schemes.length > 0) {
          setSchemes(data.schemes);
          saveSchemesToStorage(data.schemes);
        }
        setServerVersion(data.version);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsCloudSyncing(false);

        // Alert user via toast notification if this update was pushed by another device
        if (meta && meta.isRemoteWrite) {
          notifyRemoteFirebaseSync({
            version: meta.version,
            updatedDeviceLabel: meta.updatedDeviceLabel || meta.updatedBy,
            updateType: meta.updateType,
            updateSummary: meta.updateSummary,
            countSummary: `${meta.zonesCount} Zones · ${meta.schemesCount} Schemes`,
            lang,
            onNavigate: () => {
              if (meta.updateType === 'schemes') {
                setActiveTab('gis_map');
              } else {
                setActiveTab('regional_exec');
              }
            },
          });
        }
      }
    });

    // 3. Fallback window focus pull to guarantee sync when switching tabs/windows
    const handleFocus = () => {
      fetchCampaignDataFromServer().then((data) => {
        if (isMounted && data && Array.isArray(data.zones) && data.zones.length > 0) {
          setZones(data.zones);
          saveZonesToStorage(data.zones);
          if (Array.isArray(data.schemes) && data.schemes.length > 0) {
            setSchemes(data.schemes);
            saveSchemesToStorage(data.schemes);
          }
          setServerVersion(data.version);
        }
      });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handle plan updates from Admin panel - saves to Firebase Firestore so ALL other PCs get changes
  const handleUpdateZones = (newZones: ZoneRecord[]) => {
    setZones(newZones);
    saveZonesToStorage(newZones);
    setIsCloudSyncing(true);
    saveZonesToServer(newZones, schemes)
      .then(async (ok) => {
        setServerVersion((prev) => prev + 1);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      })
      .finally(() => setIsCloudSyncing(false));
  };

  const handleUpdateSchemes = (newSchemes: IrrigationScheme[]) => {
    setSchemes(newSchemes);
    saveSchemesToStorage(newSchemes);
    setIsCloudSyncing(true);
    saveSchemesToServer(newSchemes, zones)
      .then(async (ok) => {
        setServerVersion((prev) => prev + 1);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      })
      .finally(() => setIsCloudSyncing(false));
  };

  // Manual Trigger to refresh shared data immediately
  const handleManualSync = async () => {
    setIsCloudSyncing(true);
    const data = await fetchCampaignDataFromServer();
    if (data && Array.isArray(data.zones) && data.zones.length > 0) {
      setZones(data.zones);
      saveZonesToStorage(data.zones);
      if (Array.isArray(data.schemes) && data.schemes.length > 0) {
        setSchemes(data.schemes);
        saveSchemesToStorage(data.schemes);
      }
      setServerVersion(data.version);
      setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    setIsCloudSyncing(false);
  };

  // Filtered dataset if user picks a specific zone
  const displayedZones = selectedZoneFilter === 'all'
    ? zones
    : zones.filter(z => z.id === selectedZoneFilter);

  const displayedSchemes = selectedZoneFilter === 'all'
    ? schemes
    : schemes.filter(s => s.zoneId === selectedZoneFilter);

  const [searchedScheme, setSearchedScheme] = useState<IrrigationScheme | null>(null);

  // Global search navigation handlers
  const handleGlobalSelectZone = (zoneId: number) => {
    setSelectedZoneFilter(zoneId);
    setActiveTab('regional_exec');
  };

  const handleGlobalSelectScheme = (scheme: IrrigationScheme) => {
    setSearchedScheme(scheme);
    setSelectedZoneFilter('all');
    setActiveTab('gis_map');
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Printable summary handler
  const handlePrintReport = () => {
    window.print();
  };

  // High-fidelity executive PDF generator
  const handleDownloadPdf = () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        generateExecutivePdfReport({
          zones: displayedZones,
          schemes: displayedSchemes,
          lang,
          selectedZoneId: selectedZoneFilter,
        });
      } catch (err) {
        console.error('Failed to generate PDF report:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 60);
  };

  // CSV Data Export for offline record keeping
  const handleExportCsv = () => {
    try {
      exportCampaignDataToCsv({
        zones: displayedZones,
        schemes: displayedSchemes,
        lang,
        selectedZoneFilter,
      });
    } catch (err) {
      console.error('Failed to export CSV campaign records:', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/85 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Smart Interactive Futuristic Systems Background */}
      <FuturisticBackground isDarkMode={isDarkMode} />

      {/* 
        TOP BAR CONTRACT:
        Zone 1: Single text element wordmark with official Bureau logo
        Zone 2: 4-5 clean single-line text links
        Zone 3: 1 primary action
      */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark with Official Oromia Bureau Logo */}
          <button
            onClick={() => setActiveTab('regional_exec')}
            className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 group cursor-pointer"
          >
            <img
              src={oromiaLogo}
              alt="Biiroo Qonnaa Oromiyaa - Oromia Bureau of Agriculture"
              className="h-11 w-auto max-w-[110px] object-contain shrink-0 drop-shadow-sm rounded"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="hidden sm:block">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                Oromia BOA Irrigated Wheat Report
              </span>
              <span className="text-[10px] text-slate-500 font-medium block leading-none mt-0.5">
                Biiroo Qonnaa Oromiyaa · 2019/2026
              </span>
            </div>
          </button>

          {/* Global Search Bar (Quickly find zones or irrigation schemes by name) */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2">
            <GlobalSearchBar
              zones={zones}
              schemes={schemes}
              lang={lang}
              onSelectZone={handleGlobalSelectZone}
              onSelectScheme={handleGlobalSelectScheme}
            />
          </div>

          {/* Zone 2: 4-5 concise single-line text nav links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('regional_exec')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'regional_exec' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
              }`}
            >
              {lang === 'om' ? 'Cuunfaa Hooggansaa' : 'Executive'}
            </button>
            <button
              onClick={() => setActiveTab('executive_kpis')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'executive_kpis' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
              }`}
            >
              {lang === 'om' ? 'Agarsiistota (KPIs)' : 'Top KPIs'}
            </button>
            <button
              onClick={() => setActiveTab('area_progress')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'area_progress' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
              }`}
            >
              {lang === 'om' ? 'Uwwisa Lafaa' : 'Area Coverage'}
            </button>
            <button
              onClick={() => setActiveTab('gis_map')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'gis_map' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
              }`}
            >
              {lang === 'om' ? 'Kaartaa GIS' : 'GIS Map'}
            </button>
            <button
              onClick={() => setActiveTab('advanced_analytics')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'advanced_analytics' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
              }`}
            >
              {lang === 'om' ? 'Xiinxala Oomishaa' : 'Analytics'}
            </button>
          </nav>

          {/* Zone 3: Actions - Download PDF Report & Admin */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title={lang === 'om' ? 'Gabaasa PDF Guutuu Buufadhu' : 'Download Executive PDF Report'}
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isGeneratingPdf
                  ? (lang === 'om' ? 'PDF Qophaa\'aa...' : 'Generating...')
                  : (lang === 'om' ? 'PDF Gabaasaa' : 'Download PDF Report')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('admin_kobo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm border ${
                activeTab === 'admin_kobo'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? 'Bulchiinsa & Kobo' : 'Admin & Kobo'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* SECONDARY WORKSPACE TOOLBAR (Smart Multi-Row Architecture) */}
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 px-4 sm:px-6 relative z-20 shadow-xs">
        <div className="max-w-7xl mx-auto space-y-2.5">
          {/* Row 1: Workspace Utilities & Campaign Live Status Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            {/* Left: Active Module Breadcrumb / Category Status */}
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200/60 dark:border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {lang === 'om' ? 'Duula 2019/2026' : 'Campaign 2019/2026'}
                </span>
                <span className="text-emerald-400">·</span>
                <span className="font-mono">13 Modules Active</span>
              </span>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline">
                {lang === 'om'
                  ? 'Gabaasa Misooma Qamadii Jallisii Biiroo Qonnaa Oromiyaa'
                  : 'Oromia Irrigated Wheat Bureau Management & Telemetry'}
              </span>
            </div>

            {/* Right: Quick Utility Tools */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              {/* Zone Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedZoneFilter}
                  onChange={e => setSelectedZoneFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">{lang === 'om' ? 'Godinoota Hunda (14)' : 'All 14 Zones & Cities'}</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>
                      {lang === 'om' ? z.name : z.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Multi-Device Cloud Sync */}
              <button
                onClick={handleManualSync}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title={lang === 'om' ? 'Ragaa Firestore waliin wal-simsiisi (PC hundaaf)' : 'Real-time multi-device cloud sync via Firebase Firestore'}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-500'}`} />
                <span className="hidden sm:inline">
                  {isCloudSyncing
                    ? (lang === 'om' ? 'Wal-simsiisaa...' : 'Syncing...')
                    : (lang === 'om' ? `Live: ${lastSyncedText}` : `Live: ${lastSyncedText}`)}
                </span>
              </button>

              {/* Remote Push Alerts */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="relative flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                title="Sync Alerts"
              >
                <Bell className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden xl:inline">{lang === 'om' ? 'Beeksisa' : 'Alerts'}</span>
                {history.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-emerald-600 rounded-full animate-pulse">
                    {history.length}
                  </span>
                )}
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === 'om' ? 'en' : 'om')}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Switch Language (Afaan Oromoo / English)"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'om' ? 'Afaan Oromoo' : 'English'}</span>
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Futuristic FX Background trigger */}
              <button
                onClick={() => {
                  const btn = document.querySelector('#futuristic-hud-control button') as HTMLButtonElement | null;
                  btn?.click();
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                title="Interactive Futuristic Systems Background"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden xl:inline text-[11px]">FX</span>
              </button>

              {/* PDF Report Download */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer disabled:opacity-60"
                title="Download Executive PDF Report"
              >
                {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>PDF</span>
              </button>

              {/* CSV Data Export */}
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 transition-colors cursor-pointer"
                title="Export CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              {/* Print Report */}
              <button
                onClick={handlePrintReport}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Menu Row 1 - Executive & Strategic Core (Modules 17, 0, 1, 5, Σ) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 w-36">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{lang === 'om' ? '1. Hooggansa & GIS' : '1. Executive Core'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'regional_exec', num: '17', label: lang === 'om' ? 'Cuunfaa Hooggansaa (17)' : 'Executive Overview (17)' },
                { id: 'mobilization', num: '0', label: lang === 'om' ? '0. Sosoochii (0)' : '0. Mobilization (0)' },
                { id: 'executive_kpis', num: '1', label: lang === 'om' ? 'KPIs Ijoo (1)' : 'Top 15 KPIs (1)' },
                { id: 'gis_map', num: '5', label: lang === 'om' ? 'Kaartaa GIS (5)' : 'GIS Schemes (5)' },
                { id: 'advanced_analytics', num: 'Σ', label: lang === 'om' ? 'Tilmaama & Qabxii' : 'Analytics & Scorecard' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer text-xs flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs font-semibold ring-1 ring-slate-900/10 dark:ring-emerald-400/30'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <span className={`text-[10px] font-mono px-1 rounded ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    {tab.num}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Menu Row 2 - Field Operations & Value Chain (Modules 2, 3, 4, 6-7, 8-9, 10-11, 12-13, 14-16) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 w-36">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>{lang === 'om' ? '2. Hojii & Oomisha' : '2. Field & Harvest'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'area_progress', num: '2', label: lang === 'om' ? 'Adeemsa Facaasaa (2)' : 'Area Progress (2)' },
                { id: 'input_supply', num: '3', label: lang === 'om' ? 'Galteewwan (3)' : 'Input Supply (3)' },
                { id: 'irrigation_infra', num: '4', label: lang === 'om' ? 'Bu\'uuraalee Jallisii (4)' : 'Irrigation Infra (4)' },
                { id: 'mechanization', num: '6-7', label: lang === 'om' ? 'Mekaanayizeeshinii (6-7)' : 'Mechanization & Farmers (6-7)' },
                { id: 'cluster_farming', num: '8-9', label: lang === 'om' ? 'Kilaastara & Abbootii (8-9)' : 'Clusters & Investors (8-9)' },
                { id: 'crop_protection', num: '10-11', label: lang === 'om' ? 'Eegumsa & Haala (10-11)' : 'Crop Protection (10-11)' },
                { id: 'harvest_yield', num: '12-13', label: lang === 'om' ? 'Sassaabbii & Gabaa (12-13)' : 'Harvest & Price (12-13)' },
                { id: 'employment', num: '14-16', label: lang === 'om' ? 'Hojii & Rakkoolee (14-16)' : 'Jobs, Days & Risk (14-16)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer text-xs flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs font-semibold ring-1 ring-slate-900/10 dark:ring-emerald-400/30'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <span className={`text-[10px] font-mono px-1 rounded ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    {tab.num}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN VIEWPORT CANVAS */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'regional_exec' && (
          <RegionalExecutiveDashboard
            zones={displayedZones}
            schemes={displayedSchemes}
            lang={lang}
            onNavigateTab={t => setActiveTab(t)}
          />
        )}

        {activeTab === 'mobilization' && (
          <MobilizationDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'executive_kpis' && (
          <ExecutiveKpis zones={displayedZones} schemes={displayedSchemes} lang={lang} />
        )}

        {activeTab === 'area_progress' && (
          <AreaCoverageDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'input_supply' && (
          <InputSupplyDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'irrigation_infra' && (
          <IrrigationInfraDashboard
            schemes={displayedSchemes}
            zones={displayedZones}
            lang={lang}
          />
        )}

        {activeTab === 'gis_map' && (
          <OromiaGisMap
            schemes={displayedSchemes}
            allSchemes={schemes}
            zones={zones}
            onUpdateSchemes={handleUpdateSchemes}
            selectedSchemeFromSearch={searchedScheme}
            lang={lang}
          />
        )}

        {activeTab === 'mechanization' && (
          <MechanizationDemographicsDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'cluster_farming' && (
          <ClusterAndInvestorDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'crop_protection' && (
          <CropProtectionConditionDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'harvest_yield' && (
          <HarvestMarketingDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'employment' && (
          <ExtensionEmploymentRiskDashboard zones={displayedZones} lang={lang} />
        )}

        {activeTab === 'advanced_analytics' && (
          <AdvancedAnalyticsDashboard
            zones={displayedZones}
            schemes={displayedSchemes}
            lang={lang}
          />
        )}

        {activeTab === 'admin_kobo' && (
          <AdminAuthGate lang={lang}>
            <AdminKoboPanel
              zones={zones}
              schemes={schemes}
              onUpdateZones={handleUpdateZones}
              onUpdateSchemes={handleUpdateSchemes}
              lang={lang}
            />
          </AdminAuthGate>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src={oromiaLogo}
              alt="Oromia Bureau of Agriculture"
              className="h-8 w-auto object-contain shrink-0 drop-shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Biiroo Qonnaa Oromiyaa (Oromia Bureau of Agriculture)
              </span>
              <span className="text-[11px] text-slate-500 block">
                Oromia BOA Irrigated Wheat Report · Misooma Qamadii Jallisii Bara 2019/2026
              </span>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-1">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>Total Planned: 4,030,000 ha</span>
              <span>·</span>
              <span>Expected Output: 168.3M q</span>
              <span>·</span>
              <button
                onClick={() => setActiveTab('admin_kobo')}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                8/8 Kobo Forms Synced
              </button>
            </div>
            {/* User Requested Footnote */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-0.5">
              In collaboration with IQQO (Addisu H. and Getachew H.)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
      <ToastContainer />
    </ToastProvider>
  );
}
