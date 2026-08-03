// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCq7IUDmtJmA9kjR-aNgEuztww2VyA-aR8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gameforge-75200.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gameforge-75200",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gameforge-75200.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "908152352541",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:908152352541:web:a411f10fad5cb4aa733bf4",
  measurementId: "G-VG5TNWHC7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();