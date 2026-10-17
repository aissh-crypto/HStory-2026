import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateUserWithEmail,
  signInAnonymously as fbSignInAnonymously,
  updateProfile as fbUpdateProfile,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check:', error.message);
    }
  }
}

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    return await fbSignInWithEmail(auth, email, pass);
  } catch (err: any) {
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/network-request-failed' ||
      err.message?.includes('operation-not-allowed')
    ) {
      console.warn('Firebase email auth not enabled; generating local buyer session:', err);
      const fallbackUser = {
        uid: `buyer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        displayName: email.split('@')[0],
        email: email,
        isAnonymous: false,
      } as unknown as User;
      return { user: fallbackUser };
    }
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string, name?: string) => {
  try {
    const res = await fbCreateUserWithEmail(auth, email, pass);
    if (name && res.user) {
      await fbUpdateProfile(res.user, { displayName: name });
    }
    return res;
  } catch (err: any) {
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/network-request-failed' ||
      err.message?.includes('operation-not-allowed')
    ) {
      console.warn('Firebase email auth not enabled; generating persistent local buyer session:', err);
      const fallbackUser = {
        uid: `buyer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        displayName: name || email.split('@')[0],
        email: email,
        isAnonymous: false,
      } as unknown as User;
      return { user: fallbackUser };
    }
    throw err;
  }
};

export const signInDemoUser = async (name: string = 'Marcus Vance', email: string = 'marcus.vance@homestory.ai') => {
  try {
    const res = await fbSignInAnonymously(auth);
    if (res.user) {
      await fbUpdateProfile(res.user, { displayName: name });
    }
    return res.user;
  } catch {
    // If anonymous sign in is disabled in Firebase console, return a mock user object
    return {
      uid: 'demo-buyer-vance-001',
      displayName: name,
      email,
      isAnonymous: false,
    } as unknown as User;
  }
};

export const signOutUser = async () => {
  return await fbSignOut(auth);
};
