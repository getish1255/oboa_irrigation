/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface ZoneBoundary {
  id: string;
  nameEn: string;
  nameOm: string;
  code: string;
  center: LatLngPoint;
  color: string;
  fillColor: string;
  basin: string;
  majorSchemes: string[];
  coordinates: LatLngPoint[];
}

/**
 * High-fidelity boundary polygons for Oromia Administrative Zones and Major Irrigation Basins
 * Coordinates defined in WGS84 standard GPS decimal degrees [lat, lng].
 */
export const OROMIA_ZONE_BOUNDARIES: ZoneBoundary[] = [
  {
    id: 'arsi',
    nameEn: 'Arsi Zone',
    nameOm: 'Godina Arsii',
    code: 'AR',
    center: { lat: 7.85, lng: 39.15 },
    color: '#10b981', // Emerald
    fillColor: 'rgba(16, 185, 129, 0.15)',
    basin: 'Awash & Wabe Shebelle Basins',
    majorSchemes: ['Gonde Irrigation', 'Katar Sluice', 'Sire Pump Scheme', 'Hetosa Canal'],
    coordinates: [
      { lat: 7.35, lng: 38.80 },
      { lat: 7.55, lng: 38.68 },
      { lat: 7.85, lng: 38.75 },
      { lat: 8.25, lng: 38.92 },
      { lat: 8.42, lng: 39.25 },
      { lat: 8.40, lng: 39.55 },
      { lat: 8.12, lng: 39.80 },
      { lat: 7.80, lng: 39.95 },
      { lat: 7.42, lng: 39.75 },
      { lat: 7.28, lng: 39.25 },
      { lat: 7.35, lng: 38.80 },
    ],
  },
  {
    id: 'west_arsi',
    nameEn: 'West Arsi Zone',
    nameOm: 'Godina Arsii Lixaa',
    code: 'WA',
    center: { lat: 7.15, lng: 38.65 },
    color: '#06b6d4', // Cyan
    fillColor: 'rgba(6, 182, 212, 0.15)',
    basin: 'Rift Valley Lakes Basin',
    majorSchemes: ['Dodola Diversion', 'Kofele Spring', 'Gedeb Asasa Gravity', 'Shashemene Pump'],
    coordinates: [
      { lat: 6.75, lng: 38.25 },
      { lat: 7.10, lng: 38.30 },
      { lat: 7.35, lng: 38.45 },
      { lat: 7.55, lng: 38.70 },
      { lat: 7.35, lng: 38.80 },
      { lat: 7.28, lng: 39.20 },
      { lat: 6.95, lng: 39.15 },
      { lat: 6.70, lng: 38.80 },
      { lat: 6.60, lng: 38.45 },
      { lat: 6.75, lng: 38.25 },
    ],
  },
  {
    id: 'bale',
    nameEn: 'Bale Zone',
    nameOm: 'Godina Baale',
    code: 'BA',
    center: { lat: 6.95, lng: 40.15 },
    color: '#f59e0b', // Amber
    fillColor: 'rgba(245, 158, 11, 0.15)',
    basin: 'Wabe Shebelle & Genale Dawa Basins',
    majorSchemes: ['Sinana River Scheme', 'Agarfa Modern Diversion', 'Ginir Solar Pump', 'Goba Valley'],
    coordinates: [
      { lat: 6.35, lng: 39.40 },
      { lat: 6.75, lng: 39.30 },
      { lat: 7.15, lng: 39.38 },
      { lat: 7.42, lng: 39.75 },
      { lat: 7.40, lng: 40.50 },
      { lat: 7.15, lng: 40.95 },
      { lat: 6.65, lng: 41.05 },
      { lat: 6.18, lng: 40.65 },
      { lat: 5.95, lng: 39.95 },
      { lat: 6.35, lng: 39.40 },
    ],
  },
  {
    id: 'east_bale',
    nameEn: 'East Bale Zone',
    nameOm: 'Godina Baale Bahaa',
    code: 'EB',
    center: { lat: 6.60, lng: 41.50 },
    color: '#ec4899', // Pink
    fillColor: 'rgba(236, 72, 153, 0.15)',
    basin: 'Wabe Shebelle Lowland Basin',
    majorSchemes: ['Goro Deep Well Scheme', 'Raytu River Canal', 'Dawe Serer Irrigation'],
    coordinates: [
      { lat: 6.18, lng: 40.65 },
      { lat: 6.65, lng: 41.05 },
      { lat: 7.15, lng: 40.95 },
      { lat: 7.30, lng: 41.60 },
      { lat: 6.95, lng: 42.30 },
      { lat: 6.30, lng: 42.25 },
      { lat: 5.85, lng: 41.50 },
      { lat: 6.18, lng: 40.65 },
    ],
  },
  {
    id: 'east_shewa',
    nameEn: 'East Shewa Zone',
    nameOm: 'Godina Shawaa Bahaa',
    code: 'ES',
    center: { lat: 8.55, lng: 39.10 },
    color: '#3b82f6', // Blue
    fillColor: 'rgba(59, 130, 246, 0.15)',
    basin: 'Upper & Middle Awash Basin',
    majorSchemes: ['Mojo River Basin', 'Wonji Canal Command', 'Batu/Ziway Pump Hub', 'Boset River'],
    coordinates: [
      { lat: 7.85, lng: 38.60 },
      { lat: 8.20, lng: 38.70 },
      { lat: 8.60, lng: 38.80 },
      { lat: 8.95, lng: 39.20 },
      { lat: 8.85, lng: 39.85 },
      { lat: 8.40, lng: 39.55 },
      { lat: 8.25, lng: 38.92 },
      { lat: 7.85, lng: 38.60 },
    ],
  },
  {
    id: 'west_shewa',
    nameEn: 'West Shewa Zone',
    nameOm: 'Godina Shawaa Lixaa',
    code: 'WS',
    center: { lat: 8.95, lng: 37.85 },
    color: '#8b5cf6', // Violet
    fillColor: 'rgba(139, 92, 246, 0.15)',
    basin: 'Gibe & Upper Blue Nile Basins',
    majorSchemes: ['Ambo Gudar Scheme', 'Dendi Lake Diversion', 'Jeldu Highland Canal', 'Bako Valley'],
    coordinates: [
      { lat: 8.45, lng: 37.15 },
      { lat: 8.85, lng: 37.10 },
      { lat: 9.32, lng: 37.45 },
      { lat: 9.40, lng: 38.15 },
      { lat: 8.95, lng: 38.30 },
      { lat: 8.60, lng: 37.85 },
      { lat: 8.45, lng: 37.15 },
    ],
  },
  {
    id: 'north_shewa',
    nameEn: 'North Shewa Zone',
    nameOm: 'Godina Shawaa Kaabaa',
    code: 'NS',
    center: { lat: 9.75, lng: 38.70 },
    color: '#14b8a6', // Teal
    fillColor: 'rgba(20, 184, 166, 0.15)',
    basin: 'Abay (Blue Nile) Basin',
    majorSchemes: ['Fiche Springs', 'Wara Jarso Gorges', 'Degem Diversion', 'Dera Wheat Command'],
    coordinates: [
      { lat: 9.25, lng: 38.25 },
      { lat: 9.65, lng: 38.10 },
      { lat: 10.15, lng: 38.45 },
      { lat: 10.32, lng: 39.05 },
      { lat: 9.85, lng: 39.28 },
      { lat: 9.35, lng: 38.80 },
      { lat: 9.25, lng: 38.25 },
    ],
  },
  {
    id: 'southwest_shewa',
    nameEn: 'Southwest Shewa Zone',
    nameOm: 'Godina Shawaa Kibba Lixaa',
    code: 'SW',
    center: { lat: 8.55, lng: 38.05 },
    color: '#6366f1', // Indigo
    fillColor: 'rgba(99, 102, 241, 0.15)',
    basin: 'Awash & Omo-Gibe Basins',
    majorSchemes: ['Woliso Walga Diversion', 'Amaya Valley', 'Wonchi Crater Springs', 'Becho Plains'],
    coordinates: [
      { lat: 8.15, lng: 37.60 },
      { lat: 8.55, lng: 37.55 },
      { lat: 8.85, lng: 37.95 },
      { lat: 8.75, lng: 38.45 },
      { lat: 8.25, lng: 38.40 },
      { lat: 8.10, lng: 37.95 },
      { lat: 8.15, lng: 37.60 },
    ],
  },
  {
    id: 'jimma',
    nameEn: 'Jimma Zone',
    nameOm: 'Godina Jimmaa',
    code: 'JM',
    center: { lat: 7.70, lng: 36.85 },
    color: '#059669', // Dark Emerald
    fillColor: 'rgba(5, 150, 105, 0.15)',
    basin: 'Gibe-Omo & Gojeb Basins',
    majorSchemes: ['Gilgel Gibe Scheme', 'Agaro Coffee-Wheat Canal', 'Seka Chekorsa Gravity', 'Limmu Kosa'],
    coordinates: [
      { lat: 7.15, lng: 36.15 },
      { lat: 7.75, lng: 36.05 },
      { lat: 8.15, lng: 36.55 },
      { lat: 8.10, lng: 37.25 },
      { lat: 7.55, lng: 37.45 },
      { lat: 7.05, lng: 36.95 },
      { lat: 7.15, lng: 36.15 },
    ],
  },
  {
    id: 'ilu_buno',
    nameEn: 'Ilu Aba Bora & Buno Bedele',
    nameOm: 'Iluu Abbaa Booraa & Bunnoo Beddellee',
    code: 'IB',
    center: { lat: 8.35, lng: 35.85 },
    color: '#0284c7', // Sky
    fillColor: 'rgba(2, 132, 199, 0.15)',
    basin: 'Baro-Akobo & Didessa Basins',
    majorSchemes: ['Sor River Scheme', 'Didessa River Valley', 'Bedele Sluice', 'Mettu Springs'],
    coordinates: [
      { lat: 7.75, lng: 35.05 },
      { lat: 8.25, lng: 34.95 },
      { lat: 8.72, lng: 35.65 },
      { lat: 8.78, lng: 36.40 },
      { lat: 8.12, lng: 36.35 },
      { lat: 7.78, lng: 35.65 },
      { lat: 7.75, lng: 35.05 },
    ],
  },
  {
    id: 'east_hararghe',
    nameEn: 'East Hararghe Zone',
    nameOm: 'Godina Harargee Bahaa',
    code: 'EH',
    center: { lat: 9.25, lng: 41.85 },
    color: '#d97706', // Amber-600
    fillColor: 'rgba(217, 119, 6, 0.15)',
    basin: 'Wabe Shebelle Eastern Catchment',
    majorSchemes: ['Haramaya Lake Basin', 'Babile Canal Scheme', 'Kombolcha Terraced Irrigated', 'Fedis Sluice'],
    coordinates: [
      { lat: 8.55, lng: 41.45 },
      { lat: 9.05, lng: 41.35 },
      { lat: 9.55, lng: 41.75 },
      { lat: 9.62, lng: 42.42 },
      { lat: 9.05, lng: 42.48 },
      { lat: 8.45, lng: 41.95 },
      { lat: 8.55, lng: 41.45 },
    ],
  },
  {
    id: 'west_hararghe',
    nameEn: 'West Hararghe Zone',
    nameOm: 'Godina Harargee Lixaa',
    code: 'WH',
    center: { lat: 8.90, lng: 40.85 },
    color: '#ea580c', // Orange
    fillColor: 'rgba(234, 88, 12, 0.15)',
    basin: 'Awash Eastern Tributaries',
    majorSchemes: ['Chiro Valley Scheme', 'Gemechis Highlands', 'Mieso Plains Diversion', 'Habro Canal'],
    coordinates: [
      { lat: 8.15, lng: 40.25 },
      { lat: 8.68, lng: 40.15 },
      { lat: 9.18, lng: 40.45 },
      { lat: 9.28, lng: 41.15 },
      { lat: 8.68, lng: 41.38 },
      { lat: 8.10, lng: 40.75 },
      { lat: 8.15, lng: 40.25 },
    ],
  },
  {
    id: 'wollega_horo',
    nameEn: 'East Wollega & Horo Guduru',
    nameOm: 'Wallagga Bahaa & Horo Guduruu',
    code: 'EW',
    center: { lat: 9.55, lng: 36.95 },
    color: '#16a34a', // Green-600
    fillColor: 'rgba(22, 163, 74, 0.15)',
    basin: 'Didessa & Finchaa Basins',
    majorSchemes: ['Finchaa Sugar/Wheat Outskirts', 'Nekemte River Works', 'Shambu Highland Scheme', 'Sibu Sire Canal'],
    coordinates: [
      { lat: 8.80, lng: 36.25 },
      { lat: 9.35, lng: 36.15 },
      { lat: 9.88, lng: 36.75 },
      { lat: 10.12, lng: 37.38 },
      { lat: 9.55, lng: 37.45 },
      { lat: 8.85, lng: 36.95 },
      { lat: 8.80, lng: 36.25 },
    ],
  },
  {
    id: 'west_kelem_wollega',
    nameEn: 'West & Kelem Wollega',
    nameOm: 'Wallagga Lixaa & Qeellam Wallaggaa',
    code: 'WW',
    center: { lat: 9.05, lng: 35.15 },
    color: '#0d9488', // Teal-600
    fillColor: 'rgba(13, 148, 136, 0.15)',
    basin: 'Baro & Dabus River Basins',
    majorSchemes: ['Dambi Dollo Spring Scheme', 'Gimbi River Works', 'Sayo Rice-Wheat Sluice', 'Boji Canal'],
    coordinates: [
      { lat: 8.35, lng: 34.25 },
      { lat: 8.95, lng: 34.15 },
      { lat: 9.42, lng: 34.75 },
      { lat: 9.48, lng: 35.75 },
      { lat: 8.75, lng: 35.75 },
      { lat: 8.25, lng: 34.95 },
      { lat: 8.35, lng: 34.25 },
    ],
  },
  {
    id: 'borena_guji',
    nameEn: 'Borena & Guji Pastoral Zones',
    nameOm: 'Godina Boorana & Gujii',
    code: 'BG',
    center: { lat: 4.95, lng: 38.65 },
    color: '#ca8a04', // Yellow-600
    fillColor: 'rgba(202, 138, 4, 0.15)',
    basin: 'Genale Dawa & Sagan Basins',
    majorSchemes: ['Dawa River Spate Irrigation', 'Negele Borana Deep Pump', 'Yabelo Agro-Pastoral Command'],
    coordinates: [
      { lat: 3.55, lng: 37.75 },
      { lat: 4.35, lng: 37.45 },
      { lat: 5.55, lng: 38.15 },
      { lat: 6.08, lng: 38.95 },
      { lat: 5.55, lng: 39.95 },
      { lat: 4.45, lng: 39.75 },
      { lat: 3.55, lng: 38.95 },
      { lat: 3.55, lng: 37.75 },
    ],
  },
];

/**
 * Exterior regional boundary representing the overall Oromia National Regional State border.
 */
export const OROMIA_REGIONAL_OUTLINE: LatLngPoint[] = [
  { lat: 3.55, lng: 37.75 },
  { lat: 4.35, lng: 37.45 },
  { lat: 5.55, lng: 38.15 },
  { lat: 6.75, lng: 38.25 },
  { lat: 7.15, lng: 36.15 },
  { lat: 7.75, lng: 35.05 },
  { lat: 8.35, lng: 34.25 },
  { lat: 9.45, lng: 34.80 },
  { lat: 9.88, lng: 36.75 },
  { lat: 10.32, lng: 39.05 },
  { lat: 9.62, lng: 42.42 },
  { lat: 8.45, lng: 41.95 },
  { lat: 6.95, lng: 42.30 },
  { lat: 5.85, lng: 41.50 },
  { lat: 4.45, lng: 39.75 },
  { lat: 3.55, lng: 38.95 },
  { lat: 3.55, lng: 37.75 },
];
