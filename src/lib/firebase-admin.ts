import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK only on server side
if (!admin.apps.length) {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      const serviceAccount = process.env.FIREBASE_ADMIN_SDK 
        ? JSON.parse(Buffer.from(process.env.FIREBASE_ADMIN_SDK, 'base64').toString('utf-8'))
        : undefined;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
      } else {
        console.warn('Firebase Admin SDK not initialized: FIREBASE_ADMIN_SDK environment variable not found');
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export default admin;
