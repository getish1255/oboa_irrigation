/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ZoneRecord, IrrigationScheme, Language } from '../../types';
import {
  Search,
  X,
  MapPin,
  Wheat,
  Droplets,
  ChevronRight,
  Sparkles,
  Command,
} from 'lucide-react';

interface GlobalSearchBarProps {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  lang: Language;
  onSelectZone: (zoneId: number) => void;
  onSelectScheme: (scheme: IrrigationScheme) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  zones,
  schemes,
  lang,
  onSelectZone,
  onSelectScheme,
}) => {
  const isOromo = lang === 'om';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: press '/' or 'Cmd/Ctrl + K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') ||
          (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matched zones and schemes
  const matchedZones = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return zones.filter(z =>
      z.name.toLowerCase().includes(q) ||
      z.nameEn.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [zones, query]);

  const matchedSchemes = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return schemes.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.woreda.toLowerCase().includes(q) ||
      s.zoneName.toLowerCase().includes(q) ||
      s.waterSource.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [schemes, query]);

  const totalResults = matchedZones.length + matchedSchemes.length;

  // Flattened items for keyboard arrow navigation
  const allItems = useMemo(() => {
    const items: Array<{ type: 'zone'; item: ZoneRecord } | { type: 'scheme'; item: IrrigationScheme }> = [];
    matchedZones.forEach(z => items.push({ type: 'zone', item: z }));
    matchedSchemes.forEach(s => items.push({ type: 'scheme', item: s }));
    return items;
  }, [matchedZones, matchedSchemes]);

  // Handle keyboard navigation inside dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'zone') {
          handleSelectZone(current.item.id);
        } else {
          handleSelectScheme(current.item);
        }
      }
    }
  };

  const handleSelectZone = (zoneId: number) => {
    onSelectZone(zoneId);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectScheme = (scheme: IrrigationScheme) => {
    onSelectScheme(scheme);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm lg:max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={
            isOromo
              ? 'Godina ykn Iskiimii jallisii barbaadi... (/)'
              : 'Search zones or schemes... (/ or ⌘K)'
          }
          className="w-full pl-9 pr-14 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-xs"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-2.5 hidden sm:flex items-center gap-0.5 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-300/40 dark:border-slate-600/40">
            <span>/</span>
          </div>
        )}
      </div>

      {/* Floating Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[460px] overflow-y-auto">
          {totalResults === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {isOromo ? `Firiin "${query}" hin argamne` : `No results matching "${query}"`}
              </p>
              <p className="text-[11px]">
                {isOromo
                  ? 'Maaloo maqaa godinaa (fkn. Arsii, Baalee) ykn iskiimii (fkn. Wonji, Arata) yaalaa.'
                  : 'Try searching by zone (e.g. Arsi, Bale) or scheme name (e.g. Wonji, Arata, Dawa).'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-3">
              {/* Zones Section */}
              {matchedZones.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                      {isOromo ? 'Godinaalee & Magaalota' : 'Zones & Regional Areas'}
                    </span>
                    <span>{matchedZones.length}</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {matchedZones.map((zone) => {
                      const itemIdx = allItems.findIndex(i => i.type === 'zone' && i.item.id === zone.id);
                      const isHighlighted = itemIdx === selectedIndex;
                      const sowPct = ((zone.sownAreaHa / (zone.plannedAreaHa || 1)) * 100).toFixed(0);

                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => handleSelectZone(zone.id)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isHighlighted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                              {zone.id}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                                {isOromo ? zone.name : zone.nameEn}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                {isOromo ? zone.nameEn : zone.name} · {zone.category === 'city' ? 'City Admin' : 'Zone'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
                              {zone.sownAreaHa.toLocaleString()} ha
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {sowPct}% {isOromo ? 'raawwii' : 'achieved'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Irrigation Schemes Section */}
              {matchedSchemes.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      {isOromo ? 'Iskiimota Jallisii (Kaartaa GIS)' : 'Irrigation Schemes (GIS Map)'}
                    </span>
                    <span>{matchedSchemes.length}</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {matchedSchemes.map((scheme) => {
                      const itemIdx = allItems.findIndex(i => i.type === 'scheme' && i.item.id === scheme.id);
                      const isHighlighted = itemIdx === selectedIndex;

                      return (
                        <button
                          key={scheme.id}
                          type="button"
                          onClick={() => handleSelectScheme(scheme)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isHighlighted
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                                {scheme.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                {scheme.woreda} · {scheme.zoneName} · {scheme.waterSource}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <span className="font-mono font-bold text-sky-700 dark:text-sky-400 block">
                                {scheme.actualIrrigatedWheatHa.toLocaleString()} ha
                              </span>
                              <span
                                className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  scheme.status === 'functional'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : scheme.status === 'partly_functional'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {scheme.status === 'functional' ? 'Functional' : scheme.status === 'partly_functional' ? 'Partly' : 'Non-Func'}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Navigation Hint */}
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span>Use ↑ ↓ to navigate, ↵ to select</span>
                <span>ESC to close</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
