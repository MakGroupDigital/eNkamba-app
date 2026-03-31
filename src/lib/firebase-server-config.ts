import { FirebaseOptions } from 'firebase/app';

function readFirebaseEnv(name: string) {
  return process.env[name]?.trim() || '';
}

export function getFirebaseServerConfig(): FirebaseOptions {
  const config: FirebaseOptions = {
    projectId: readFirebaseEnv('FIREBASE_PROJECT_ID') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    apiKey: readFirebaseEnv('FIREBASE_API_KEY') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: readFirebaseEnv('FIREBASE_AUTH_DOMAIN') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    databaseURL: readFirebaseEnv('FIREBASE_DATABASE_URL') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL'),
    storageBucket: readFirebaseEnv('FIREBASE_STORAGE_BUCKET') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readFirebaseEnv('FIREBASE_MESSAGING_SENDER_ID') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readFirebaseEnv('FIREBASE_APP_ID') || readFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  };

  const missing = Object.entries({
    FIREBASE_PROJECT_ID: config.projectId,
    FIREBASE_API_KEY: config.apiKey,
    FIREBASE_AUTH_DOMAIN: config.authDomain,
    FIREBASE_APP_ID: config.appId,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Variables Firebase manquantes côté serveur: ${missing.join(', ')}`);
  }

  return config;
}
