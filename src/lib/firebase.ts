import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDRhWbrpB1Ss4njot7GYO-CZdkvJtZXGyI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-1153706651-6032b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-1153706651-6032b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-1153706651-6032b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "60114170881",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:60114170881:web:7805087264e18745ef3c00",
};

// Initialize Firebase app (singleton)
export const app = initializeApp(firebaseConfig);

// Firebase Auth instance
export const auth = getAuth(app);

// Firebase Firestore instance
export const db = getFirestore(app);

// Firebase Functions instance
export const functions = getFunctions(app);

// Firebase Storage instance
export const storage = getStorage(app);
