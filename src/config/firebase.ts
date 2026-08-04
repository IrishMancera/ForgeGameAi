import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics } from "firebase/analytics";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key";
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project-id";
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789";
const appId = import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef";
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "";

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      measurementId,
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    if (typeof window !== "undefined" && measurementId) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.warn("[Firebase] Failed to initialize Firebase SDK:", error);
  }
} else {
  console.log("[Firebase] Environment variables VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY not provided — running in offline/local auth mode.");
}

export { app, auth, googleProvider, analytics };