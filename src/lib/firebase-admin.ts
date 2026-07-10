import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { getFirebaseAdminConfig } from '@/lib/decode-secrets';

function getAdminApp() {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const config = getFirebaseAdminConfig();

  if (config.projectId && config.clientEmail && config.privateKey) {
    return initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
      projectId: config.projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
