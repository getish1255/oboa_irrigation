/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ZoneRecord, IrrigationScheme } from '../types';
import { INITIAL_ZONES, INITIAL_SCHEMES } from '../data/initialData';
import {
  getDeviceId,
  getDeviceLabel,
  recordLocalWrite,
  isRecentLocalWrite,
} from '../utils/deviceIdentity';

// Initialize Firebase App & Firestore with specified databaseId
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validation test connection to Firestore as per skill specification
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is unreachable.');
    }
    // Expected to fail if doc doesn't exist or denied by catch-all, but verifies network reachability
    return false;
  }
}

// Skill-mandated error handling structure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface SharedCampaignBundle {
  version: number;
  lastUpdated: string;
  zones: ZoneRecord[];
  schemes: IrrigationScheme[];
  customAdminPassword?: string;
  updatedBy?: string;
  updatedByDeviceId?: string;
  updatedDeviceLabel?: string;
  updateType?: 'zones' | 'schemes' | 'bundle' | 'general';
  updateSummary?: string;
}

const CAMPAIGN_DOC_PATH = 'campaign_bundles/live';

/**
 * Fetch campaign data directly from Firestore
 */
export async function fetchCampaignBundleFromFirestore(): Promise<SharedCampaignBundle | null> {
  try {
    const docRef = doc(db, 'campaign_bundles', 'live');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SharedCampaignBundle;
      if (Array.isArray(data.zones) && data.zones.length > 0) {
        return data;
      }
    } else {
      // First boot: Seed initial data so all future links and browsers have immediate access
      console.log('Seeding initial campaign bundle to Firestore...');
      const initialBundle: SharedCampaignBundle = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        zones: INITIAL_ZONES,
        schemes: INITIAL_SCHEMES,
        updatedBy: 'System Baseline',
        updatedByDeviceId: 'system-baseline',
        updatedDeviceLabel: 'Oromia BOA Cloud Baseline',
      };
      await setDoc(docRef, initialBundle);
      return initialBundle;
    }
  } catch (error) {
    console.warn('Failed to fetch campaign bundle from Firestore:', error);
  }
  return null;
}

/**
 * Real-time subscription to campaign updates across all devices & browsers.
 * Distinguishes updates pushed by other devices from local changes.
 */
export function subscribeToCampaignUpdates(
  onUpdate: (bundle: SharedCampaignBundle, isRemoteWrite: boolean) => void
): () => void {
  const docRef = doc(db, 'campaign_bundles', 'live');
  let isInitialSnapshot = true;
  let lastKnownVersion = 0;

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SharedCampaignBundle;
        if (Array.isArray(data.zones) && data.zones.length > 0) {
          const currentDeviceId = getDeviceId();
          const hasPendingWrites = snapshot.metadata.hasPendingWrites;

          // Compute whether this change was pushed by another device
          let isRemote = false;

          if (!isInitialSnapshot) {
            const isDifferentDevice =
              Boolean(data.updatedByDeviceId) && data.updatedByDeviceId !== currentDeviceId;
            const isVersionIncremented = (data.version || 0) > lastKnownVersion;

            if (isDifferentDevice) {
              isRemote = true;
            } else if (!data.updatedByDeviceId && !isRecentLocalWrite() && isVersionIncremented) {
              isRemote = true;
            } else if (!hasPendingWrites && !isRecentLocalWrite() && isVersionIncremented) {
              isRemote = true;
            }
          }

          lastKnownVersion = data.version || lastKnownVersion;
          isInitialSnapshot = false;

          onUpdate(data, isRemote);
        }
      }
    },
    (error) => {
      console.warn('Firestore snapshot error on campaign_bundles/live:', error);
    }
  );
  return unsubscribe;
}

/**
 * Save updated campaign bundle to Firestore to broadcast to all devices immediately
 */
export async function saveCampaignBundleToFirestore(
  bundle: Partial<SharedCampaignBundle>
): Promise<boolean> {
  try {
    recordLocalWrite();
    const docRef = doc(db, 'campaign_bundles', 'live');
    const existingSnap = await getDoc(docRef);
    let currentVersion = 1;
    let existingZones: ZoneRecord[] = INITIAL_ZONES;
    let existingSchemes: IrrigationScheme[] = INITIAL_SCHEMES;
    let existingPwd = '';

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as SharedCampaignBundle;
      currentVersion = (existingData.version || 1) + 1;
      if (Array.isArray(existingData.zones) && existingData.zones.length > 0) existingZones = existingData.zones;
      if (Array.isArray(existingData.schemes)) existingSchemes = existingData.schemes;
      if (existingData.customAdminPassword) existingPwd = existingData.customAdminPassword;
    }

    const payload: SharedCampaignBundle = {
      version: bundle.version || currentVersion,
      lastUpdated: new Date().toISOString(),
      zones: bundle.zones || existingZones,
      schemes: bundle.schemes || existingSchemes,
      customAdminPassword: bundle.customAdminPassword || existingPwd,
      updatedBy: bundle.updatedBy || 'Oromia BOA Admin Portal',
      updatedByDeviceId: bundle.updatedByDeviceId || getDeviceId(),
      updatedDeviceLabel: bundle.updatedDeviceLabel || getDeviceLabel(),
      updateType: bundle.updateType || 'general',
      updateSummary: bundle.updateSummary,
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving campaign bundle to Firestore:', error);
    return false;
  }
}

/**
 * Simulates a data push originating from another remote device.
 * Used for testing the toast notification system directly in the browser or on live demos.
 */
export async function simulateRemoteDevicePush(note?: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'campaign_bundles', 'live');
    const existingSnap = await getDoc(docRef);
    let currentVersion = 1;
    let existingZones: ZoneRecord[] = INITIAL_ZONES;
    let existingSchemes: IrrigationScheme[] = INITIAL_SCHEMES;

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as SharedCampaignBundle;
      currentVersion = (existingData.version || 1) + 1;
      if (Array.isArray(existingData.zones)) existingZones = existingData.zones;
      if (Array.isArray(existingData.schemes)) existingSchemes = existingData.schemes;
    }

    const remoteDeviceId = `dev-remote-sim-${Math.random().toString(36).slice(2, 6)}`;
    const remoteLabels = [
      'Field Tablet (Adama/East Shewa)',
      'Regional Hub PC (Bale Zone)',
      'Arsi Agri-Extension Laptop',
      'Jimma GIS Field Terminal',
      'Mobile Field Officer #07',
    ];
    const remoteLabel = remoteLabels[Math.floor(Math.random() * remoteLabels.length)];

    const payload: SharedCampaignBundle = {
      version: currentVersion,
      lastUpdated: new Date().toISOString(),
      zones: existingZones,
      schemes: existingSchemes,
      updatedBy: remoteLabel,
      updatedByDeviceId: remoteDeviceId,
      updatedDeviceLabel: remoteLabel,
      updateType: 'schemes',
      updateSummary: note || `Updated irrigation scheme status and GPS records from ${remoteLabel}`,
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to simulate remote device push:', error);
    return false;
  }
}
