/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Wheat,
  TrendingUp,
  Droplets,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Language } from '../../types';

export interface TourStep {
  targetId: string;
  badgeEn: string;
  badgeOm: string;
  titleEn: string;
  titleOm: string;
  descEn: string;
  descOm: string;
  significanceEn: string;
  significanceOm: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-hero-banner',
    badgeEn: 'Campaign Mandate',
    badgeOm: 'Ajaja Duulaa',
    titleEn: '4.03M Hectares Regional Irrigation Scale',
    titleOm: 'Karoora Hektaara Miiliyoona 4.03 Oromiyaa',
    descEn:
      'The Oromia Irrigated Wheat Initiative is one of Africa’s largest coordinated agricultural campaigns, targeting 4.03 million hectares with an expected yield of 168.3 million quintals.',
    descOm:
      'Duulli qamadii jallisii Oromiyaa duulawwan qonnaa gurguddoo Afrikaa keessaa isa tokko yoo ta\'u, hektaara miiliyoona 4.03 irratti oomisha kuntala miiliyoona 168.3 eeggata.',
    significanceEn:
      'This campaign secures national bread wheat self-sufficiency and generates over 500,000 rural agro-processing and harvesting jobs.',
    significanceOm:
      'Wabii midhaan nyaataa biyyaalessaa mirkaneessuu cinaatti carraa hojii qonnaan bultootaa fi dargaggoota kuma dhibba shanii ol uuma.',
    icon: Wheat,
  },
  {
    targetId: 'tour-kpi-tiles',
    badgeEn: 'Real-Time Telemetry',
    badgeOm: 'Hordoffii Guyyaa Guyyaa',
    titleEn: '14 Core KPIs & 10-Day Daily Velocity',
    titleOm: 'Agarsiistota Ol-aanoo 14 & Saffisa Guyyaa Guyyaa',
    descEn:
      'Interactive sparklines track daily velocity across farmer mobilization (3.08M farmers), tractor tillage, certified seeds, urea, and functional irrigation schemes.',
    descOm:
      'Sararri adeemsaa (sparkline) kun sosoochii qonnaan bultootaa (3.08M), qophii lafaa tiraaktaraan, raabsa sanyii fi xaa\'oo hordofa.',
    significanceEn:
      'Real-time sparklines detect field bottlenecks early so tractors and inputs can be dispatched before planting windows close.',
    significanceOm:
      'Hanqina galteewwanii battalatti adda baasuun qabeenyi saffisaan gara godinoota hanqina qabaniitti akka geeffamu taasisa.',
    icon: TrendingUp,
  },
  {
    targetId: 'tour-harvest-progress',
    badgeEn: 'Key Operational Milestone',
    badgeOm: 'Agarsiistuu Ijoo Murteessituu',
    titleEn: 'Total Planned vs. Actual Harvest (Progress by Zone)',
    titleOm: 'Adeemsa Sassaabbii: Karoora vs Raawwii Godinaaleen',
    descEn:
      'Visualizes the transition from standing mature crop to collected grain across all 14 zones with completion percentages and planned vs actual progress bars.',
    descOm:
      'Lafa qamadiin faca\'ee bilchaate irraa oomisha kuntalaan sassaabame dhibbeentaa xumuraa waliin godinoota 14 hunda keessatti agarsiisa.',
    significanceEn:
      'CRITICAL METRIC: Prevents post-maturity shatter loss by identifying zones with mature standing wheat where combine harvesters must be mobilized immediately.',
    significanceOm:
      'MURTEESSAA: Qamadiin akka hin mancaane kombayinoota duguuganii sassaaban godinoota qamadiin bilchaatetti saffisaan bobbaasuuf gargaara.',
    icon: Wheat,
  },
  {
    targetId: 'tour-side-by-side',
    badgeEn: 'Zone Benchmark',
    badgeOm: 'Wal-Bira Qabaa Godinaalee',
    titleEn: 'Side-by-Side Zone Intelligence & Variance Delta',
    titleOm: 'Wal-Bira Qabaa Godinaalee Lamaanii & Garaagarummaa',
    descEn:
      'Select any two zones to benchmark progress bars, core agricultural KPIs, mechanization, and resource inputs side by side with instant variance indicators.',
    descOm:
      'Godinaalee lama filachuun adeemsa facaasaa, oomishaa, tiraaktaroota, kombayinoota fi xaa\'oo wal-bira qabaatii garaagarummaa jiru ilaalaa.',
    significanceEn:
      'Enables regional bureau directors to compare lead zones (e.g. Arsi, Bale) against emerging zones to replicate best practices.',
    significanceOm:
      'Hoggansi Biiroo Qonnaa muuxannoowwan gaarii godinoota ciman irraa gara kaaniitti babal\'isuuf gargaara.',
    icon: Layers,
  },
  {
    targetId: 'tour-gis-schemes',
    badgeEn: 'Spatial Command',
    badgeOm: 'Kaartaa Jallisii GIS',
    titleEn: 'Interactive GIS Schemes & Basin Monitoring',
    titleOm: 'Iskiimota Jallisii GIS fi Daangaa Godinaalee',
    descEn:
      'Geospatial monitoring of large-scale irrigation schemes across Awash, Genale-Dawa, and Rift Valley river basins, complete with transparent zone boundary overlays.',
    descOm:
      'Kaartaa lafa jallisii ammayyaa laggeen Awaash, Gannaalee fi Qiinxama Raaftii irratti daangaa godinootaa ifa ta\'een hordofaa.',
    significanceEn:
      'Validates water pump functionality and weir flow rates to ensure continuous irrigation before grain-filling stage.',
    significanceOm:
      'Pompootaa fi misooma jallisii yeroo qamadiin bishaan barbaadutti guutuu ta\'uu isaanii mirkaneessa.',
    icon: Droplets,
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const ExecutiveGuidedTour: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const isOromo = lang === 'om';
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target bounding box
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !step) return;
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  // Scroll target element smoothly into view and recalculate
  useEffect(() => {
    if (!isOpen || !step) return;

    const element = document.getElementById(step.targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Recalculate position after smooth scroll settles
      const timer = setTimeout(updateTargetPosition, 400);
      return () => clearTimeout(timer);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex, step, updateTargetPosition]);

  // Listen for window resize or scroll
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isOpen, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const Icon = step.icon;

  // Tooltip positioning calculation (stays safely within viewport)
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
  };

  if (targetRect) {
    const isMobile = windowWidth < 768;
    const tooltipWidth = Math.min(480, windowWidth - 32);

    if (isMobile) {
      // Bottom anchored for mobile
      tooltipStyle = {
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${tooltipWidth}px`,
        maxWidth: '94vw',
        zIndex: 10001,
      };
    } else {
      // Place tooltip either directly above or below the target
      const placeBelow = targetRect.bottom + 320 < windowHeight;
      const topPos = placeBelow
        ? Math.min(windowHeight - 340, targetRect.bottom + 16)
        : Math.max(20, targetRect.top - 320);

      const leftPos = Math.max(
        16,
        Math.min(
          windowWidth - tooltipWidth - 24,
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        )
      );

      tooltipStyle = {
        position: 'fixed',
        top: `${topPos}px`,
        left: `${leftPos}px`,
        width: `${tooltipWidth}px`,
        zIndex: 10001,
      };
    }
  } else {
    // Center fallback if target element not found
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '460px',
      maxWidth: '92vw',
      zIndex: 10001,
    };
  }

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-auto">
      {/* Dark backdrop overlay with smooth blur */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Target Element Spotlight Cutout / Ring */}
      {targetRect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out ring-4 ring-emerald-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
          style={{
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            zIndex: 10000,
          }}
        >
          {/* Pulsing indicator tag */}
          <div className="absolute -top-3.5 left-6 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Target Focused</span>
          </div>
        </div>
      )}

      {/* Interactive Tooltip Card */}
      <div
        style={tooltipStyle}
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border-2 border-emerald-500/80 shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header & Close Button */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {isOromo ? step.badgeOm : step.badgeEn}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentStepIndex + 1} / {TOUR_STEPS.length}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                {isOromo ? step.titleOm : step.titleEn}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {isOromo ? step.descOm : step.descEn}
        </p>

        {/* Campaign Significance Spotlight Callout */}
        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase font-mono text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isOromo
                ? 'Hiika Duula Misooma Qamadii Keessatti'
                : 'Significance in Oromia Campaign Context'}
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            {isOromo ? step.significanceOm : step.significanceEn}
          </p>
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-500'
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isOromo ? 'Dhiisi' : 'Skip'}
            </button>

            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{isOromo ? 'Duuba' : 'Back'}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {currentStepIndex === TOUR_STEPS.length - 1
                  ? isOromo
                    ? 'Hubadhe / Xumuri'
                    : 'Finish Tour'
                  : isOromo
                  ? 'Itti Aani'
                  : 'Next Step'}
              </span>
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
