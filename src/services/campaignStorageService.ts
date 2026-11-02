/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZoneRecord, IrrigationScheme } from '../types';
import {
  fetchCampaignBundleFromFirestore,
  saveCampaignBundleToFirestore,
  subscribeToCampaignUpdates as subscribeFirestore,
  SharedCampaignBundle,
} from './firebaseService';

export interface ServerCampaignData {
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  version: number;
  lastUpdated: string;
  customAdminPassword?: string;
}

export interface ServerStatus {
  version: number;
  lastUpdated: string;
  zonesCount: number;
  schemesCount: number;
}

/**
 * Fetch the latest shared campaign data from Firebase Firestore (primary)
 * with graceful fallback to Express backend and localStorage.
 * This ensures changes made on any PC or browser are visible to all users.
 */
export async function fetchCampaignDataFromServer(): Promise<ServerCampaignData | null> {
  // 1. Try Firebase Firestore (Universal cloud synchronization)
  try {
    const firestoreBundle = await fetchCampaignBundleFromFirestore();
    if (firestoreBundle && Array.isArray(firestoreBundle.zones) && firestoreBundle.zones.length > 0) {
      return {
        zones: firestoreBundle.zones,
        schemes: firestoreBundle.schemes || [],
        version: firestoreBundle.version || 1,
        lastUpdated: firestoreBundle.lastUpdated || new Date().toISOString(),
        customAdminPassword: firestoreBundle.customAdminPassword,
      };
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking Express backend fallback:', err);
  }

  // 2. Fallback to Express backend
  try {
    const res = await fetch('/api/campaign/data', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.zones) && data.zones.length > 0) {
        return {
          zones: data.zones,
          schemes: Array.isArray(data.schemes) ? data.schemes : [],
          version: data.version || 1,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Network error fetching campaign data from server:', err);
  }

  return null;
}

/**
 * Real-time cloud subscription across all PCs and devices via Firebase
 */
export function subscribeToRealtimeCampaignData(
  onData: (data: ServerCampaignData) => void
): () => void {
  try {
    return subscribeFirestore((bundle: SharedCampaignBundle) => {
      onData({
        zones: bundle.zones,
        schemes: bundle.schemes || [],
        version: bundle.version || 1,
        lastUpdated: bundle.lastUpdated || new Date().toISOString(),
        customAdminPassword: bundle.customAdminPassword,
      });
    });
  } catch (err) {
    console.warn('Could not attach Firestore realtime listener:', err);
    return () => {};
  }
}

/**
 * Check lightweight server version and timestamp for polling
 */
export async function checkServerStatus(): Promise<ServerStatus | null> {
  try {
    const res = await fetch('/api/campaign/status', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      return {
        version: data.version || 1,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        zonesCount: data.zonesCount || 0,
        schemesCount: data.schemesCount || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist updated zones to Firebase Firestore AND backend so ALL devices receive changes
 */
export async function saveZonesToServer(
  zones: ZoneRecord[],
  schemes?: IrrigationScheme[]
): Promise<boolean> {
  let firestoreSuccess = false;

  // 1. Sync to Firebase Firestore (Instantly notifies all connected browsers/devices)
  try {
    firestoreSuccess = await saveCampaignBundleToFirestore({
      zones,
      schemes,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Firestore save failed:', err);
  }

  // 2. Also save to Express API for container backup
  try {
    fetch('/api/campaign/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zones }),
    }).catch((e) => console.warn('Express server sync warning:', e));
  } catch {
    // Non-blocking
  }

  return firestoreSuccess;
}

/**
 * Persist updated schemes to backend & Firestore
 */
export async function saveSchemesToServer(
  schemes: IrrigationScheme[],
  zones?: ZoneRecord[]
): Promise<boolean> {
  let firestoreSuccess = false;

  try {
    if (zones) {
      firestoreSuccess = await saveCampaignBundleToFirestore({
        zones,
        schemes,
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Firestore scheme save failed:', err);
  }

  try {
    fetch('/api/campaign/schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemes }),
    }).catch((e) => console.warn('Express server schemes sync warning:', e));
  } catch {
    // Non-blocking
  }

  return firestoreSuccess;
}

/**
 * Reset server data back to Bureau baseline
 */
export async function resetServerCampaignData(): Promise<boolean> {
  try {
    fetch('/api/campaign/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch server/cloud stored admin password
 */
export async function fetchServerAdminPassword(): Promise<string | null> {
  try {
    const data = await fetchCampaignBundleFromFirestore();
    if (data?.customAdminPassword) {
      return data.customAdminPassword;
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch('/api/campaign/admin-pwd', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.customPassword || null;
  } catch {
    return null;
  }
}

/**
 * Persist new admin password to Firestore and server
 */
export async function saveServerAdminPassword(newPassword: string): Promise<boolean> {
  try {
    const data = await fetchCampaignBundleFromFirestore();
    if (data) {
      await saveCampaignBundleToFirestore({
        ...data,
        customAdminPassword: newPassword,
      });
    }
  } catch (err) {
    console.warn('Could not save password to Firestore:', err);
  }

  try {
    const res = await fetch('/api/campaign/admin-pwd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
