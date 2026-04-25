import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let isSigningIn = false;

export const signInWithGoogle = async () => {
  if (isSigningIn) return;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    if (
      error.code === 'auth/cancelled-popup-request' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/closed-by-user'
    ) {
      console.log('Authentication popup was closed or cancelled by the user.');
      return null;
    }
    console.error('Firebase Auth Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};
