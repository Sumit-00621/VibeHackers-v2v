import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config is loaded exclusively from environment variables (Replit Secrets).
// Fallbacks let the app render without crashing before credentials are added —
// Firebase will gracefully fail to authenticate until real values are provided.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "not-configured",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "not-configured",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "not-configured",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "not-configured",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "not-configured",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "not-configured",
};

// Guard against duplicate-app errors during Vite HMR
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export { firebaseApp };
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
