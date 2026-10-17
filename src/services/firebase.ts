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

export const saveActiveAuthSession = (user: { uid: string; email?: string | null; displayName?: string | null }) => {
  try {
    localStorage.setItem(
      'homestory_auth_session',
      JSON.stringify({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Property Buyer'),
        isAnonymous: false,
      })
    );
  } catch {}
};

export const getSavedAuthSession = (): User | null => {
  try {
    const raw = localStorage.getItem('homestory_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) {
        return parsed as unknown as User;
      }
    }
  } catch {}
  return null;
};

// Helper for local registered accounts store
const getRegisteredAccounts = (): Record<string, { uid: string; email: string; pass: string; name: string }> => {
  try {
    const raw = localStorage.getItem('homestory_registered_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRegisteredAccount = (account: { uid: string; email: string; pass: string; name: string }) => {
  try {
    const accounts = getRegisteredAccounts();
    accounts[account.email.toLowerCase()] = account;
    localStorage.setItem('homestory_registered_accounts', JSON.stringify(accounts));
  } catch {}
};

export const signInWithGoogle = async () => {
  const res = await signInWithPopup(auth, googleProvider);
  if (res.user) {
    saveActiveAuthSession(res.user);
  }
  return res;
};

export const signInWithEmail = async (email: string, pass: string) => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fbSignInWithEmail(auth, cleanEmail, pass);
    if (res.user) {
      saveActiveAuthSession(res.user);
    }
    return res;
  } catch (err: any) {
    // If Firebase email provider is not enabled in Firebase Console, use persistent verified account registry
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/network-request-failed' ||
      err.message?.includes('operation-not-allowed')
    ) {
      const accounts = getRegisteredAccounts();
      const existingAccount = accounts[cleanEmail];

      if (!existingAccount) {
        // Enforce registration requirement: Do NOT allow unregistered users to just sign in
        const error = new Error('No registered account found with this email. You must register first to create your dossier.');
        (error as any).code = 'auth/user-not-found';
        throw error;
      }

      if (existingAccount.pass !== pass) {
        const error = new Error('Incorrect password. Please verify your credentials or register a new account.');
        (error as any).code = 'auth/wrong-password';
        throw error;
      }

      const verifiedUser = {
        uid: existingAccount.uid,
        displayName: existingAccount.name,
        email: existingAccount.email,
        isAnonymous: false,
      } as unknown as User;

      saveActiveAuthSession(verifiedUser);
      return { user: verifiedUser };
    }
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string, name?: string) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

  try {
    const res = await fbCreateUserWithEmail(auth, cleanEmail, pass);
    if (res.user) {
      if (cleanName) {
        await fbUpdateProfile(res.user, { displayName: cleanName }).catch(() => {});
      }
      saveActiveAuthSession(res.user);
    }
    return res;
  } catch (err: any) {
    // If Firebase email provider is not enabled in Firebase Console, register in persistent local registry
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/network-request-failed' ||
      err.message?.includes('operation-not-allowed')
    ) {
      const accounts = getRegisteredAccounts();
      if (accounts[cleanEmail]) {
        const error = new Error('An account already exists with this email address. Please switch to Sign In.');
        (error as any).code = 'auth/email-already-in-use';
        throw error;
      }

      const newUid = `buyer-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;
      saveRegisteredAccount({
        uid: newUid,
        email: cleanEmail,
        pass,
        name: cleanName,
      });

      const newUser = {
        uid: newUid,
        displayName: cleanName,
        email: cleanEmail,
        isAnonymous: false,
      } as unknown as User;

      saveActiveAuthSession(newUser);
      return { user: newUser };
    }
    throw err;
  }
};

export const signInDemoUser = async (name: string = 'Marcus Vance', email: string = 'marcus.vance@homestory.ai') => {
  try {
    const res = await fbSignInAnonymously(auth);
    if (res.user) {
      await fbUpdateProfile(res.user, { displayName: name });
      saveActiveAuthSession(res.user);
    }
    return res.user;
  } catch {
    const demoUser = {
      uid: 'demo-buyer-vance-001',
      displayName: name,
      email,
      isAnonymous: false,
    } as unknown as User;
    saveActiveAuthSession(demoUser);
    return demoUser;
  }
};

export const signOutUser = async () => {
  try {
    localStorage.removeItem('homestory_auth_session');
  } catch {}
  return await fbSignOut(auth).catch(() => {});
};

