import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBG5lMfzgUvYlxhCQGh5XL0O6Eue1MkJoo",
  authDomain: "hijaz-cc8eb.firebaseapp.com",
  projectId: "hijaz-cc8eb",
  storageBucket: "hijaz-cc8eb.firebasestorage.app",
  messagingSenderId: "559352070189",
  appId: "1:559352070189:web:6c90d2e6f656aac1ac78a4",
  measurementId: "G-PLCH4GDVQF"
};

// Initialize Firebase
const app  = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);

// Google provider — shows account-chooser popup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sign in with Google popup */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Update the display name on the Firebase user */
export async function setDisplayName(user: User, name: string): Promise<void> {
  await updateProfile(user, { displayName: name });
}

/** Sign out */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, type User };

