import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const activeFirebaseConfig = {
  apiKey: defaultFirebaseConfig.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: defaultFirebaseConfig.authDomain || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: defaultFirebaseConfig.projectId || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: defaultFirebaseConfig.storageBucket || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: defaultFirebaseConfig.messagingSenderId || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: defaultFirebaseConfig.appId || (import.meta as any).env?.VITE_FIREBASE_APP_ID,
};

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({ prompt: 'consent' });

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem('google_access_token');

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || localStorage.getItem('google_access_token');
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('google_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('google_access_token', credential.accessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      throw new Error(
        `Domain (${currentHost}) belum diizinkan pada proyek Firebase ("${activeFirebaseConfig.projectId}").\n\n` +
        `Silakan buka Firebase Console -> Authentication -> Settings -> Authorized domains dan pastikan "${currentHost}" sudah ditambahkan.`
      );
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error(
        'Jendela login Google ditutup sebelum proses selesai.\n\n' +
        'Tips:\n' +
        '1. Pastikan Anda tidak menutup jendela pop-up sebelum memilih akun dan menekan "Izinkan/Allow".\n' +
        '2. Jika mencoba akun Google lain, pastikan email tersebut sudah ditambahkan ke "Test users" di Google Cloud Console (jika OAuth masih status "Testing").'
      );
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up browser terblokir oleh browser Anda. Izinkan pop-up untuk domain ini dan coba lagi.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem('google_access_token');
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('google_access_token');
};
