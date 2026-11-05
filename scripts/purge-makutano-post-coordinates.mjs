// ENK-064 — removes precise coordinates from legacy Makutano posts, keeping only the city.
// Dry-run by default; --apply writes. Original values are saved first to audite/makutano-location-backup.json.
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import admin from 'firebase-admin';

const decode = (v) => Buffer.from(v || '', 'base64').toString('utf8');
admin.initializeApp({ credential: admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || decode(process.env.FIREBASE_CLIENT_EMAIL_ENCODED),
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || decode(process.env.FIREBASE_PRIVATE_KEY_ENCODED)).replace(/\\n/g, '\n'),
}) });

const apply = process.argv.includes('--apply');
const snap = await admin.firestore().collection('makutano_posts').get();
const targets = snap.docs.filter((doc) => {
  const l = doc.get('location');
  return l && typeof l === 'object' && ('latitude' in l || 'longitude' in l || 'accuracy' in l || ('label' in l && !l.visibility));
});
console.log(`${targets.length} publication(s) avec coordonnées précises.`);
if (!apply) { console.log('Simulation : relancer avec --apply pour corriger.'); process.exit(0); }

await writeFile('audite/makutano-location-backup.json', JSON.stringify(targets.map((d) => ({ id: d.id, location: d.get('location') })), null, 2));
const batch = admin.firestore().batch();
for (const doc of targets) {
  const { ville = '', pays = '' } = doc.get('location');
  batch.update(doc.ref, { location: (ville || pays) ? { visibility: 'city', label: [ville, pays].filter(Boolean).join(', '), ville, pays } : admin.firestore.FieldValue.delete() });
}
await batch.commit();
console.log('Coordonnées supprimées. Sauvegarde : audite/makutano-location-backup.json');
