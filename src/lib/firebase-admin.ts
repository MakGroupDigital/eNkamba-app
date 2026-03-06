import * as admin from 'firebase-admin';

type AdminApp = admin.app.App | null;

function decodeBase64Json(value?: string): Record<string, any> | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error decoding FIREBASE_ADMIN_SDK:', error);
    return null;
  }
}

function buildServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

function getAdminApp(): AdminApp {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const decoded = decodeBase64Json(process.env.FIREBASE_ADMIN_SDK);
    const serviceAccount = decoded || buildServiceAccountFromEnv();

    if (!serviceAccount) {
      console.warn('Firebase Admin SDK not initialized: missing FIREBASE_ADMIN_SDK or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    return admin.app();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
}

const adminApp = getAdminApp();

export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
export const adminStorage = adminApp ? admin.storage(adminApp) : null;

export default admin;
