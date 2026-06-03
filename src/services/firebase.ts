import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app once
let firebaseApp: any = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

// Singleton initialization function
function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId);
    firebaseStorage = getStorage(firebaseApp);
  }
  return { firebaseApp, firebaseAuth, firebaseDb, firebaseStorage };
}

// Lazy initialize on first access
export function getFirebaseApp() {
  return initializeFirebase().firebaseApp;
}

export function getFirebaseAuth() {
  const { firebaseAuth } = initializeFirebase();
  return firebaseAuth;
}

export function getFirebaseDb() {
  const { firebaseDb } = initializeFirebase();
  return firebaseDb;
}

export function getFirebaseStorage() {
  const { firebaseStorage } = initializeFirebase();
  return firebaseStorage;
}

// For backward compatibility, export as direct references
// but they will be lazy-initialized
export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export const storage = getFirebaseStorage();

export async function uploadFileToStorage(path: string, file: Blob): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error('Firebase Storage 未正确初始化');
  }
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// ============================================
// Firebase Error Handling
// ============================================

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = getFirebaseAuth();
  const currentUser = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('[Firebase Error]', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================
// Firebase Utility Functions
// ============================================

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseReady(): boolean {
  try {
    return !!(getFirebaseAuth() && getFirebaseDb());
  } catch {
    return false;
  }
}

/**
 * Gracefully handle Firebase initialization errors
 */
export function tryInitializeFirebase(): { success: boolean; error?: string } {
  try {
    initializeFirebase();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Firebase initialization error',
    };
  }
}
