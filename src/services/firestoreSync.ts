import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, CaseFile } from '../types';

export const firestoreSync = {
  // Save or update User Profile
  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: profile.email || '',
        displayName: profile.displayName || profile.name || 'Property Buyer',
        residencyStatus: profile.residencyStatus,
        buyerRole: profile.buyerRole,
        countryPreference: profile.countryPreference,
        monthlyGrossIncome: profile.monthlyGrossIncome || 0,
        existingMonthlyDebts: profile.existingMonthlyDebts || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Delete User Profile & Subcollections (Account Reset)
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId));
      const savedSnap = await getDocs(collection(db, 'users', userId, 'saved'));
      for (const d of savedSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      const casesSnap = await getDocs(collection(db, 'users', userId, 'caseFiles'));
      for (const d of casesSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    } catch (e) {
      console.warn('Error purging user profile in Firestore:', e);
    }
  },

  // Load User Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: userId,
          name: data.displayName || data.name || 'Property Buyer',
          displayName: data.displayName || data.name || 'Property Buyer',
          email: data.email || '',
          residencyStatus: data.residencyStatus || 'Citizen',
          buyerRole: data.buyerRole || 'First-time Homebuyer',
          countryPreference: data.countryPreference || 'Malaysia',
          monthlyGrossIncome: typeof data.monthlyGrossIncome === 'number' ? data.monthlyGrossIncome : 0,
          existingMonthlyDebts: typeof data.existingMonthlyDebts === 'number' ? data.existingMonthlyDebts : 0,
          defaultCurrency: data.countryPreference === 'Singapore' ? 'SGD' : 'MYR',
        };
      }
      return null;
    } catch (error) {
      console.warn('Firestore getUserProfile notice (using local fallback if available):', error);
      return null;
    }
  },

  // Save bookmarked property ID
  async saveProperty(userId: string, propertyId: string): Promise<void> {
    const path = `users/${userId}/saved/${propertyId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'saved', propertyId), {
        propertyId,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Remove bookmarked property ID
  async removeSavedProperty(userId: string, propertyId: string): Promise<void> {
    const path = `users/${userId}/saved/${propertyId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'saved', propertyId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Get all saved property IDs
  async getSavedPropertyIds(userId: string): Promise<string[]> {
    const path = `users/${userId}/saved`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'saved'));
      return snap.docs.map((d) => d.id);
    } catch (error) {
      console.warn('Firestore getSavedPropertyIds warning:', error);
      return [];
    }
  },

  // Save or update Case File
  async saveCaseFile(userId: string, caseFile: CaseFile): Promise<void> {
    const path = `users/${userId}/caseFiles/${caseFile.caseId}`;
    try {
      let statusStr = 'in_progress';
      if (caseFile.status === 'Decision Ready') statusStr = 'done';
      else if (caseFile.status === 'Archived') statusStr = 'not_started';

      await setDoc(doc(db, 'users', userId, 'caseFiles', caseFile.caseId), {
        caseId: caseFile.caseId,
        propertyId: caseFile.propertyId,
        country: caseFile.modules?.countryCompliance?.country || 'Malaysia',
        status: statusStr,
        modules: caseFile.modules,
        verdict: caseFile.decisionProfile,
        decisionProfile: caseFile.decisionProfile,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Load all Case Files for user
  async getCaseFiles(userId: string): Promise<any[]> {
    const path = `users/${userId}/caseFiles`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'caseFiles'));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          decisionProfile: data.decisionProfile || data.verdict || null,
        };
      });
    } catch (error) {
      console.warn('Firestore getCaseFiles warning:', error);
      return [];
    }
  },

  // Delete / Dismiss a Case File
  async removeCaseFile(userId: string, caseId: string): Promise<void> {
    const path = `users/${userId}/caseFiles/${caseId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'caseFiles', caseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Save Live Camera Inspection Session to Firebase
  async saveLiveInspection(userId: string, inspection: {
    id: string;
    propertyTitle: string;
    timestamp: string;
    messagesCount: number;
    severity?: string;
    summary?: string;
  }): Promise<boolean> {
    const path = `users/${userId}/inspections/${inspection.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'inspections', inspection.id), {
        ...inspection,
        syncedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  },
};
