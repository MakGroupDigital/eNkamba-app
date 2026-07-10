import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function decodeSecret(value) {
  if (!value) return '';
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

async function readEncodedServiceAccountFile() {
  try {
    const encodedPath = path.join(rootDir, 'firebase-admin-sdk.encoded.txt');
    const encoded = (await readFile(encodedPath, 'utf8')).trim();
    if (!encoded) return null;

    const decoded = decodeSecret(encoded);
    if (!decoded) return null;

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function getServiceAccount() {
  const fileServiceAccount = await readEncodedServiceAccountFile();
  if (fileServiceAccount?.project_id && fileServiceAccount?.client_email && fileServiceAccount?.private_key) {
    return {
      projectId: fileServiceAccount.project_id,
      clientEmail: fileServiceAccount.client_email,
      privateKey: fileServiceAccount.private_key,
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || decodeSecret(process.env.FIREBASE_CLIENT_EMAIL_ENCODED);
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || decodeSecret(process.env.FIREBASE_PRIVATE_KEY_ENCODED)).replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Configuration Firebase Admin manquante: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }

  return { projectId, clientEmail, privateKey };
}

async function main() {
  const knowledgePath = path.join(rootDir, 'src/data/ai-knowledge-seed.json');
  const raw = await readFile(knowledgePath, 'utf8');
  const entries = JSON.parse(raw);

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('Aucune connaissance à importer.');
  }

  if (!admin.apps.length) {
    if (process.env.SEED_AI_KNOWLEDGE_AUTH === 'service-account') {
      admin.initializeApp({
        credential: admin.credential.cert(await getServiceAccount()),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-1153706651-6032b',
      });
    }
  }

  const db = admin.firestore();
  db.settings({ preferRest: true });
  const batchSize = 400;
  let imported = 0;

  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = db.batch();
    const chunk = entries.slice(index, index + batchSize);

    for (const entry of chunk) {
      const ref = db.collection('aiKnowledgeBase').doc(entry.id);
      batch.set(
        ref,
        {
          ...entry,
          status: 'active',
          source: 'seed-ai-knowledge',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    imported += chunk.length;
  }

  console.log(`Base de connaissances eNkamba AI importée: ${imported} fiches.`);
}

main().catch((error) => {
  console.error('Import base de connaissances échoué:', error.message);
  process.exit(1);
});
