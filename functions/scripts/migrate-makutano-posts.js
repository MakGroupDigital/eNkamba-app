#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require('firebase-admin');

const DEFAULT_SOURCES = ['posts', 'social_posts', 'community_posts', 'makutanoPosts'];
const TARGET_COLLECTION = 'makutano_posts';
const ALLOWED_CATEGORIES = new Set(['Accueil', 'Savoir', 'Entrepreneur', 'Projets', 'Local']);

const args = process.argv.slice(2);
const shouldCommit = args.includes('--commit');
const sourceArg = args.find((arg) => arg.startsWith('--sources='));
const targetArg = args.find((arg) => arg.startsWith('--target='));

const sources = sourceArg
  ? sourceArg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_SOURCES;
const targetCollection = targetArg ? targetArg.split('=')[1].trim() : TARGET_COLLECTION;

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function normalizeCategory(rawCategory) {
  if (!rawCategory || typeof rawCategory !== 'string') return 'Accueil';
  const lowered = rawCategory.toLowerCase();
  if (lowered.includes('savoir')) return 'Savoir';
  if (lowered.includes('entre')) return 'Entrepreneur';
  if (lowered.includes('projet')) return 'Projets';
  if (lowered.includes('local')) return 'Local';
  if (lowered.includes('accueil') || lowered.includes('home')) return 'Accueil';

  if (ALLOWED_CATEGORIES.has(rawCategory)) return rawCategory;
  return 'Accueil';
}

function inferMediaType(rawType, mediaUrl, mimeType) {
  const type = (rawType || '').toString().toLowerCase();
  const url = (mediaUrl || '').toString().toLowerCase();
  const mime = (mimeType || '').toString().toLowerCase();

  if (type.includes('audio') || mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(url)) {
    return 'audio';
  }
  if (type.includes('video') || mime.startsWith('video/') || /\.(mp4|webm|mov|m3u8)$/i.test(url)) {
    return 'video';
  }
  return 'image';
}

function pickMediaUrl(data) {
  return (
    data.mediaUrl ||
    data.image ||
    data.imageUrl ||
    data.photoUrl ||
    data.videoUrl ||
    data.audioUrl ||
    data.fileUrl ||
    data.url ||
    ''
  );
}

function buildTargetPayload(data, sourceName, sourceDocId) {
  const mediaUrl = pickMediaUrl(data);
  const mediaType = inferMediaType(data.mediaType || data.type, mediaUrl, data.mimeType);
  const category = normalizeCategory(data.category || data.section || data.tab);
  const authorName = data.author?.name || data.authorName || data.userName || 'Utilisateur Kenz';
  const authorLocation = data.author?.location || data.authorLocation || data.location || 'RDC';
  const authorAvatar = data.author?.avatar || data.authorAvatar || data.avatar || '';

  return {
    text: data.text || data.caption || data.description || '',
    mediaUrl,
    mediaType,
    category,
    likes: Number(data.likes || data.likeCount || 0),
    comments: Number(data.comments || data.commentCount || 0),
    author: {
      name: authorName,
      location: authorLocation,
      avatar: authorAvatar,
    },
    authorId: data.authorId || data.userId || null,
    createdAt: data.createdAt || data.timestamp || admin.firestore.FieldValue.serverTimestamp(),
    legacySource: sourceName,
    legacyId: sourceDocId,
    migratedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function run() {
  console.log('--- Migration Makutano Posts ---');
  console.log(`Mode: ${shouldCommit ? 'COMMIT (write enabled)' : 'DRY-RUN (no write)'}`);
  console.log(`Target: ${targetCollection}`);
  console.log(`Sources: ${sources.join(', ')}`);

  const existingSnapshot = await db.collection(targetCollection).get();
  const existingKeys = new Set();
  existingSnapshot.forEach((doc) => {
    const d = doc.data();
    if (d.legacySource && d.legacyId) {
      existingKeys.add(`${d.legacySource}:${d.legacyId}`);
    }
  });

  let totalRead = 0;
  let totalPrepared = 0;
  let totalSkipped = 0;
  let totalWritten = 0;
  let batch = db.batch();
  let batchOps = 0;

  const commitBatch = async () => {
    if (!shouldCommit || batchOps === 0) return;
    await batch.commit();
    totalWritten += batchOps;
    batch = db.batch();
    batchOps = 0;
  };

  for (const source of sources) {
    const sourceSnapshot = await db.collection(source).get();
    console.log(`\n[${source}] docs: ${sourceSnapshot.size}`);

    for (const sourceDoc of sourceSnapshot.docs) {
      totalRead += 1;
      const sourceData = sourceDoc.data();
      const dedupeKey = `${source}:${sourceDoc.id}`;

      if (source !== targetCollection && existingKeys.has(dedupeKey)) {
        totalSkipped += 1;
        continue;
      }

      const payload = buildTargetPayload(sourceData, source, sourceDoc.id);

      if (!payload.mediaUrl) {
        totalSkipped += 1;
        continue;
      }

      totalPrepared += 1;
      const targetRef =
        source === targetCollection
          ? db.collection(targetCollection).doc(sourceDoc.id)
          : db.collection(targetCollection).doc();

      if (shouldCommit) {
        batch.set(targetRef, payload, { merge: true });
        batchOps += 1;
        if (batchOps >= 400) {
          await commitBatch();
        }
      } else {
        console.log(`[DRY] ${source}/${sourceDoc.id} -> ${targetRef.id} (${payload.mediaType}, ${payload.category})`);
      }
    }
  }

  await commitBatch();

  console.log('\n--- Summary ---');
  console.log(`Read: ${totalRead}`);
  console.log(`Prepared: ${totalPrepared}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Written: ${totalWritten}`);
  console.log('Done.');
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
