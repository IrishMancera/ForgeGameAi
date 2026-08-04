import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  rawProjectId &&
  rawApiKey.trim() !== "" &&
  rawProjectId.trim() !== "" &&
  !rawApiKey.includes("your-") &&
  !rawProjectId.includes("your-")
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analytics: any = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: rawApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${rawProjectId}.firebaseapp.com`,
      projectId: rawProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${rawProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // Conditionally load analytics safely without throwing on missing installations config
    if (typeof window !== "undefined" && firebaseConfig.measurementId && firebaseConfig.appId) {
      import("firebase/analytics")
        .then(({ getAnalytics }) => {
          analytics = getAnalytics(app!);
        })
        .catch(() => {
          // Analytics non-critical
        });
    }
  } catch (error) {
    console.warn("[Firebase] Initialization skipped due to configuration error:", error);
    app = null;
    auth = null;
    googleProvider = null;
  }
} else {
  console.log("[Firebase] Firebase environment variables not configured — auth operating in local fallback mode.");
}

export { app, auth, googleProvider, analytics };