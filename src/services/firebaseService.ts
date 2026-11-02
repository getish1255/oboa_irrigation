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
 * Real-time subscription to campaign updates across all devices & browsers
 */
export function subscribeToCampaignUpdates(
  onUpdate: (bundle: SharedCampaignBundle) => void
): () => void {
  const docRef = doc(db, 'campaign_bundles', 'live');
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SharedCampaignBundle;
        if (Array.isArray(data.zones) && data.zones.length > 0) {
          onUpdate(data);
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
  bundle: Partial<SharedCampaignBundle> & { zones: ZoneRecord[] }
): Promise<boolean> {
  try {
    const docRef = doc(db, 'campaign_bundles', 'live');
    const existingSnap = await getDoc(docRef);
    let currentVersion = 1;
    let existingSchemes: IrrigationScheme[] = INITIAL_SCHEMES;
    let existingPwd = '';

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as SharedCampaignBundle;
      currentVersion = (existingData.version || 1) + 1;
      if (Array.isArray(existingData.schemes)) existingSchemes = existingData.schemes;
      if (existingData.customAdminPassword) existingPwd = existingData.customAdminPassword;
    }

    const payload: SharedCampaignBundle = {
      version: bundle.version || currentVersion,
      lastUpdated: new Date().toISOString(),
      zones: bundle.zones,
      schemes: bundle.schemes || existingSchemes,
      customAdminPassword: bundle.customAdminPassword || existingPwd,
      updatedBy: bundle.updatedBy || 'Oromia BOA Admin Portal',
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving campaign bundle to Firestore:', error);
    return false;
  }
}
