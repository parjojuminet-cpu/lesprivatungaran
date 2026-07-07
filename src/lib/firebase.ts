import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const activeFirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

let app: FirebaseApp;

if (getApps().length > 0) {
  app = getApp();
} else {
  try {
    app = initializeApp(activeFirebaseConfig);
  } catch (err: any) {
    if (err?.code === 'app/duplicate-app' || (err?.message && err.message.includes('already exists'))) {
      app = getApp();
    } else {
      throw err;
    }
  }
}

const databaseId = (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

let firestoreDb: Firestore;
try {
  firestoreDb = databaseId
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, databaseId)
    : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch (e) {
  firestoreDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);

export default app;
