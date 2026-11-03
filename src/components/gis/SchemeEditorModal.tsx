/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IrrigationScheme, Language, ZoneRecord } from '../../types';
import {
  X,
  Save,
  Trash2,
  MapPin,
  Droplets,
  Wrench,
  Users,
  Layers,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface SchemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheme: IrrigationScheme) => void;
  onDelete?: (schemeId: string) => void;
  initialScheme?: IrrigationScheme | null;
  zones?: ZoneRecord[];
  lang: Language;
  defaultCoords?: { lat: number; lng: number } | null;
}

const OROMIA_ZONES_LIST = [
  { id: 1, name: 'Kibba baha Oromiyaa', nameEn: 'South East Oromia (Arsi/Bale)' },
  { id: 2, name: 'Kibba Oromiyaa', nameEn: 'South Oromia (Borena/Guji)' },
  { id: 3, name: 'Baha Oromiyaa', nameEn: 'East Oromia (Hararghe)' },
  { id: 4, name: 'Giddugaleessa Oromiyaa', nameEn: 'Central Oromia (Shewa)' },
  { id: 5, name: 'Lixa Oromiyaa', nameEn: 'West Oromia (Wollega/Ilu)' },
  { id: 6, name: 'Arsii', nameEn: 'Arsi Zone' },
  { id: 7, name: 'Shawaa Bahaa', nameEn: 'East Shewa Zone' },
  { id: 8, name: 'Baalee', nameEn: 'Bale Zone' },
  { id: 9, name: 'Shawaa Lixaa', nameEn: 'West Shewa Zone' },
  { id: 10, name: 'Harargee Bahaa', nameEn: 'East Hararghe Zone' },
  { id: 11, name: 'Jimmaa', nameEn: 'Jimma Zone' },
  { id: 12, name: 'Arsii Lixaa', nameEn: 'West Arsi Zone' },
  { id: 13, name: 'Iluu Abbaa Booraa', nameEn: 'Ilu Aba Bor Zone' },
  { id: 14, name: 'Gujii', nameEn: 'Guji Zone' },
];

export const SchemeEditorModal: React.FC<SchemeEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialScheme,
  zones,
  lang,
  defaultCoords,
}) => {
  const isOromo = lang === 'om';
  const isEditing = !!initialScheme;

  const [formData, setFormData] = useState<Partial<IrrigationScheme>>({
    id: '',
    name: '',
    zoneId: 7,
    zoneName: 'Shawaa Bahaa',
    woreda: '',
    lat: 8.54,
    lng: 39.27,
    commandAreaHa: 5000,
    serviceableAreaHa: 4200,
    actualIrrigatedWheatHa: 3800,
    status: 'functional',
    waterAvailability: 'adequate',
    method: 'Furrow',
    waterSource: 'River',
    pumpsTotal: 10,
    pumpsFunctional: 8,
    operationalProblem: 'None',
    beneficiariesCount: 2500,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialScheme) {
      setFormData(initialScheme);
    } else {
      setFormData({
        id: `SCH-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        zoneId: 7,
        zoneName: 'Shawaa Bahaa',
        woreda: '',
        lat: defaultCoords?.lat ? Number(defaultCoords.lat.toFixed(4)) : 8.54,
        lng: defaultCoords?.lng ? Number(defaultCoords.lng.toFixed(4)) : 39.27,
        commandAreaHa: 4000,
        serviceableAreaHa: 3200,
        actualIrrigatedWheatHa: 2800,
        status: 'functional',
        waterAvailability: 'adequate',
        method: 'Furrow',
        waterSource: 'River',
        pumpsTotal: 12,
        pumpsFunctional: 10,
        operationalProblem: 'None',
        beneficiariesCount: 1800,
      });
    }
    setValidationError(null);
  }, [initialScheme, defaultCoords, isOpen]);

  if (!isOpen) return null;

  const availableZones = zones && zones.length > 0
    ? zones.map(z => ({ id: z.id, name: z.name, nameEn: z.nameEn }))
    : OROMIA_ZONES_LIST;

  const handleZoneChange = (zoneIdNum: number) => {
    const selected = availableZones.find(z => z.id === zoneIdNum);
    setFormData(prev => ({
      ...prev,
      zoneId: zoneIdNum,
      zoneName: selected ? (isOromo ? selected.name : selected.nameEn) : 'Oromia Zone',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name?.trim()) {
      setValidationError(isOromo ? 'Maaloo maqaa iskiimii galchaa.' : 'Scheme name is required.');
      return;
    }

    if (!formData.woreda?.trim()) {
      setValidationError(isOromo ? 'Maaloo aanaa galchaa.' : 'Woreda name is required.');
      return;
    }

    if (formData.lat === undefined || isNaN(formData.lat) || formData.lat < 3 || formData.lat > 15) {
      setValidationError(
        isOromo
          ? 'Latitude sirrii miti (3.0 hanga 14.0 gidduutti ta\'uu qaba).'
          : 'Invalid Latitude. Must be within Oromia boundaries (~3.0 to 14.0).'
      );
      return;
    }

    if (formData.lng === undefined || isNaN(formData.lng) || formData.lng < 33 || formData.lng > 44) {
      setValidationError(
        isOromo
          ? 'Longitude sirrii miti (33.0 hanga 44.0 gidduutti ta\'uu qaba).'
          : 'Invalid Longitude. Must be within Oromia boundaries (~33.0 to 44.0).'
      );
      return;
    }

    const commandArea = Number(formData.commandAreaHa) || 0;
    const actualArea = Number(formData.actualIrrigatedWheatHa) || 0;

    const validatedScheme: IrrigationScheme = {
      id: formData.id || `SCH-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      zoneId: Number(formData.zoneId) || 1,
      zoneName: formData.zoneName || 'Oromia Zone',
      woreda: formData.woreda.trim(),
      lat: Number(Number(formData.lat).toFixed(4)),
      lng: Number(Number(formData.lng).toFixed(4)),
      commandAreaHa: commandArea,
      serviceableAreaHa: Number(formData.serviceableAreaHa) || commandArea,
      actualIrrigatedWheatHa: actualArea,
      status: formData.status || 'functional',
      waterAvailability: formData.waterAvailability || 'adequate',
      method: formData.method || 'Furrow',
      waterSource: formData.waterSource || 'River',
      pumpsTotal: Number(formData.pumpsTotal) || 0,
      pumpsFunctional: Number(formData.pumpsFunctional) || 0,
      operationalProblem: formData.operationalProblem || 'None',
      beneficiariesCount: Number(formData.beneficiariesCount) || 0,
    };

    onSave(validatedScheme);
    onClose();
  };

  const handleDelete = () => {
    if (!initialScheme || !onDelete) return;
    const confirmText = isOromo
      ? `Iskiimii "${initialScheme.name}" haquu akka barbaaddu mirkaneessaa?`
      : `Are you sure you want to permanently delete irrigation scheme "${initialScheme.name}"?`;
    if (window.confirm(confirmText)) {
      onDelete(initialScheme.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {isEditing
                  ? (isOromo ? 'Iskiimii Jallisii Gulaali' : 'Edit Irrigation Scheme')
                  : (isOromo ? 'Iskiimii Jallisii Haaraa Galchi' : 'Add New Irrigation Scheme')}
              </h3>
              <p className="text-xs text-emerald-200">
                {isOromo
                  ? 'Ragaa GIS, uwwisa hektaaraa fi wabi bishaanii'
                  : 'GIS Coordinates, command acreage, pumps & water adequacy'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Identification & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isOromo ? '1. Eenyummaa & Bakka Iskiimii' : '1. Scheme Identity & Location'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheme Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Maqaa Iskiimii Jallisii' : 'Irrigation Scheme Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wonji-Shoa Sugarcane & Wheat Scheme"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Godina' : 'Zone'} *
                </label>
                <select
                  value={formData.zoneId || 7}
                  onChange={e => handleZoneChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableZones.map(z => (
                    <option key={z.id} value={z.id}>
                      {isOromo ? z.name : z.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Woreda */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Aanaa (Woreda)' : 'Woreda (District)'} *
                </label>
                <input
                  type="text"
                  value={formData.woreda || ''}
                  onChange={e => setFormData({ ...formData, woreda: e.target.value })}
                  placeholder="e.g. Adama / Lome"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Latitude (Gara Kaabaa)' : 'Latitude (°N)'} *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.lat ?? 8.54}
                  onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Longitude (Gara Bahaa)' : 'Longitude (°E)'} *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.lng ?? 39.27}
                  onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Area Coverage & Production */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>{isOromo ? '2. Uwwisa Hektaaraa & Qamadii' : '2. Area Coverage (Hectares)'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Bal\'ina Waliigalaa (Command ha)' : 'Command Area (ha)'}
                </label>
                <input
                  type="number"
                  value={formData.commandAreaHa ?? 0}
                  onChange={e => setFormData({ ...formData, commandAreaHa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Tajaajila Kan Kennu (ha)' : 'Serviceable Area (ha)'}
                </label>
                <input
                  type="number"
                  value={formData.serviceableAreaHa ?? 0}
                  onChange={e => setFormData({ ...formData, serviceableAreaHa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Qamadii Jallisii Faca\'e (ha)' : 'Actual Irrigated Wheat (ha)'}
                </label>
                <input
                  type="number"
                  value={formData.actualIrrigatedWheatHa ?? 0}
                  onChange={e => setFormData({ ...formData, actualIrrigatedWheatHa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Water, Pumps & Operation Status */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>{isOromo ? '3. Wabi Bishaanii, Paampii & Haala Hojii' : '3. Water Source, Pumps & Status'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Functionality Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Haala Hojii Iskiimii' : 'Scheme Status'}
                </label>
                <select
                  value={formData.status || 'functional'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="functional">🟢 {isOromo ? 'Hojiirra Jira (Functional)' : 'Functional'}</option>
                  <option value="partly_functional">🟡 {isOromo ? 'Gartokkeen Hojjeta (Partly)' : 'Partly Functional'}</option>
                  <option value="non_functional">🔴 {isOromo ? 'Hojii Dhaabeera (Non-Functional)' : 'Non-Functional'}</option>
                </select>
              </div>

              {/* Water Availability */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Wabi Bishaanii' : 'Water Availability'}
                </label>
                <select
                  value={formData.waterAvailability || 'adequate'}
                  onChange={e => setFormData({ ...formData, waterAvailability: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="adequate">💧 {isOromo ? 'Gahaa (Adequate)' : 'Adequate'}</option>
                  <option value="limited">⚠️ {isOromo ? 'Hanqina Qaba (Limited)' : 'Limited'}</option>
                  <option value="unavailable">🚫 {isOromo ? 'Hin Jiru (Unavailable)' : 'Unavailable'}</option>
                </select>
              </div>

              {/* Water Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Madda Bishaanii' : 'Water Source'}
                </label>
                <select
                  value={formData.waterSource || 'River'}
                  onChange={e => setFormData({ ...formData, waterSource: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="River">{isOromo ? 'Laga (River)' : 'River'}</option>
                  <option value="Stream">{isOromo ? 'Laga Xiqqa / Yaatuu (Stream)' : 'Stream'}</option>
                  <option value="Spring">{isOromo ? 'Burqaa (Spring)' : 'Spring'}</option>
                  <option value="Lake">{isOromo ? 'Haroo (Lake)' : 'Lake'}</option>
                  <option value="Dam">{isOromo ? 'Hidha (Dam/Reservoir)' : 'Dam/Reservoir'}</option>
                  <option value="Borehole">{isOromo ? 'Borehole' : 'Borehole'}</option>
                  <option value="Shallow Well">{isOromo ? 'Boolla Giddu-galeessaa (Well)' : 'Shallow Well'}</option>
                  <option value="Pond">{isOromo ? 'Haroo Horata (Pond)' : 'Pond'}</option>
                </select>
              </div>

              {/* Irrigation Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Mala Jallisii' : 'Irrigation Method'}
                </label>
                <select
                  value={formData.method || 'Furrow'}
                  onChange={e => setFormData({ ...formData, method: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Furrow">{isOromo ? 'Booqaa (Furrow)' : 'Furrow'}</option>
                  <option value="Basin">{isOromo ? 'Beziinii (Basin)' : 'Basin'}</option>
                  <option value="Sprinkler">{isOromo ? 'Bifaa (Sprinkler)' : 'Sprinkler'}</option>
                  <option value="Drip">{isOromo ? 'Cobsaa (Drip)' : 'Drip'}</option>
                  <option value="Flood">{isOromo ? 'Lolaa (Flood)' : 'Flood'}</option>
                </select>
              </div>

              {/* Pumps Total */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Paampii Bishaanii Waliigalaa' : 'Total Pumps'}
                </label>
                <input
                  type="number"
                  value={formData.pumpsTotal ?? 0}
                  onChange={e => setFormData({ ...formData, pumpsTotal: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Pumps Functional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Paampii Hojjatu' : 'Functional Pumps'}
                </label>
                <input
                  type="number"
                  value={formData.pumpsFunctional ?? 0}
                  onChange={e => setFormData({ ...formData, pumpsFunctional: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Operational Problem */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Rakkoo Hojii (Operational Problem)' : 'Operational Problem'}
                </label>
                <select
                  value={formData.operationalProblem || 'None'}
                  onChange={e => setFormData({ ...formData, operationalProblem: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="None">{isOromo ? 'Rakkoon hin jiru (None)' : 'None'}</option>
                  <option value="Pump breakdown">{isOromo ? 'Paampii caccabe (Pump breakdown)' : 'Pump breakdown'}</option>
                  <option value="Canal damage">{isOromo ? 'Bo\'oon miidhame (Canal damage)' : 'Canal damage'}</option>
                  <option value="Siltation">{isOromo ? 'Cirracha/Dhoqqee (Siltation)' : 'Siltation'}</option>
                  <option value="Water shortage">{isOromo ? 'Hanqina bishaanii (Water shortage)' : 'Water shortage'}</option>
                  <option value="Power cut">{isOromo ? 'Ibsaa/Humna dhabuu (Power cut)' : 'Power cut'}</option>
                </select>
              </div>

              {/* Beneficiary Households */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Qonnaan Bultoota Fayyadamoo' : 'Beneficiary Households'}
                </label>
                <input
                  type="number"
                  value={formData.beneficiariesCount ?? 0}
                  onChange={e => setFormData({ ...formData, beneficiariesCount: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isOromo ? 'Iskiimii Haqi' : 'Delete Scheme'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {isOromo ? 'Dhiisi' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isOromo ? 'Iskiimii Olkaawi (Save)' : 'Save Irrigation Scheme'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
