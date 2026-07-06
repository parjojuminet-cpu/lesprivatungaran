import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ErpDatabaseJson, saveErpJsonDatabase, loadErpJsonDatabase, sanitizeErpDatabase } from './jsonStorage';

const COLLECTION_NAME = 'erp_store';
const DOC_ID = 'main_database';

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const TIMEOUT_MS = 3500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs)
    )
  ]);
}

/**
 * Save full ERP Database to Cloud Firestore
 */
export async function saveToFirestore(data: ErpDatabaseJson): Promise<boolean> {
  const path = `${COLLECTION_NAME}/${DOC_ID}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    await withTimeout(
      setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      })
    );
    // Also update local cache
    saveErpJsonDatabase(data);
    return true;
  } catch (error: any) {
    console.warn('Gagal menyimpan data ke Cloud Firestore (menggunakan data lokal):', error);
    // Fallback save to localStorage
    saveErpJsonDatabase(data);
    if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    return false;
  }
}

/**
 * Load ERP Database from Cloud Firestore once
 */
export async function loadFromFirestore(): Promise<ErpDatabaseJson> {
  const path = `${COLLECTION_NAME}/${DOC_ID}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const docSnap = await withTimeout(getDoc(docRef));

    if (docSnap.exists()) {
      const remoteData = docSnap.data() as ErpDatabaseJson;
      const sanitized = sanitizeErpDatabase(remoteData);
      saveErpJsonDatabase(sanitized);
      saveToFirestore(sanitized).catch(() => {});
      return sanitized;
    } else {
      // If Firestore is empty, initialize it with current local data
      const localData = loadErpJsonDatabase();
      saveToFirestore(localData).catch(() => {});
      return localData;
    }
  } catch (error: any) {
    console.warn('Gagal memuat dari Cloud Firestore, menggunakan data lokal:', error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        // Log handled error and fallback to local storage
      }
    }
    return loadErpJsonDatabase();
  }
}

/**
 * Subscribe to real-time changes from Cloud Firestore
 */
export function subscribeToFirestore(onDataUpdate: (data: ErpDatabaseJson) => void): () => void {
  const path = `${COLLECTION_NAME}/${DOC_ID}`;
  const docRef = doc(db, COLLECTION_NAME, DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as ErpDatabaseJson;
        const sanitized = sanitizeErpDatabase(remoteData);
        saveErpJsonDatabase(sanitized);
        onDataUpdate(sanitized);
      }
    },
    (error: any) => {
      console.warn('Error listening to Cloud Firestore updates:', error);
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );

  return unsubscribe;
}

