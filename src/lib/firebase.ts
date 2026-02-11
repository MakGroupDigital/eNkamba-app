import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRhWbrpB1Ss4njot7GYO-CZdkvJtZXGyI",
  authDomain: "studio-1153706651-6032b.firebaseapp.com",
  projectId: "studio-1153706651-6032b",
  storageBucket: "studio-1153706651-6032b.firebasestorage.app",
  messagingSenderId: "60114170881",
  appId: "1:60114170881:web:7805087264e18745ef3c00",
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