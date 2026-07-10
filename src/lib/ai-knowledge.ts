import aiKnowledgeSeed from '@/data/ai-knowledge-seed.json';
import { getAdminFirestore } from '@/lib/firebase-admin';

export type AiKnowledgeEntry = {
  id: string;
  module: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  tags?: string[];
  visibility?: 'public' | 'internal';
  priority?: number;
  updatedAt?: unknown;
};

const LOCAL_KNOWLEDGE = aiKnowledgeSeed as AiKnowledgeEntry[];
let firestoreKnowledgeCache: AiKnowledgeEntry[] | null = null;
let firestoreKnowledgeCacheAt = 0;
let firestoreRetryAfter = 0;
const FIRESTORE_CACHE_MS = 5 * 60 * 1000;
const FIRESTORE_FAILURE_BACKOFF_MS = 2 * 60 * 1000;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  const stopWords = new Set([
    'avec',
    'dans',
    'pour',
    'quoi',
    'comment',
    'est',
    'une',
    'des',
    'les',
    'que',
    'qui',
    'sur',
    'mon',
    'mes',
    'notre',
    'votre',
    'peux',
    'peut',
    'faire',
    'avoir',
    'cela',
    'cette',
  ]);

  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function scoreKnowledgeEntry(entry: AiKnowledgeEntry, query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const title = normalizeText(entry.title);
  const module = normalizeText(entry.module);
  const summary = normalizeText(entry.summary);
  const content = normalizeText(entry.content);
  const keywords = (entry.keywords || []).map(normalizeText);
  const tags = (entry.tags || []).map(normalizeText);

  let score = Math.min(Number(entry.priority || 0), 100) / 100;

  for (const token of tokens) {
    if (title.includes(token)) score += 6;
    if (module.includes(token)) score += 5;
    if (keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) score += 5;
    if (tags.some((tag) => tag.includes(token))) score += 3;
    if (summary.includes(token)) score += 2.5;
    if (content.includes(token)) score += 1;
  }

  const normalizedQuery = normalizeText(query);
  if (title && normalizedQuery.includes(title)) score += 8;
  if (module && normalizedQuery.includes(module)) score += 5;

  return score;
}

function searchLocalKnowledge(message: string, entries: AiKnowledgeEntry[], limit: number) {
  return entries
    .map((entry) => ({ entry, score: scoreKnowledgeEntry(entry, message) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

async function loadFirestoreKnowledge() {
  const now = Date.now();
  if (firestoreKnowledgeCache && now - firestoreKnowledgeCacheAt < FIRESTORE_CACHE_MS) {
    return firestoreKnowledgeCache;
  }

  if (now < firestoreRetryAfter) {
    return [];
  }

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('aiKnowledgeBase')
    .where('status', '==', 'active')
    .limit(250)
    .get();

  const entries = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      module: String(data.module || 'Général'),
      title: String(data.title || doc.id),
      summary: String(data.summary || ''),
      content: String(data.content || ''),
      keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      visibility: data.visibility === 'internal' ? 'internal' : 'public',
      priority: Number(data.priority || 0),
      updatedAt: data.updatedAt,
    } satisfies AiKnowledgeEntry;
  });

  firestoreKnowledgeCache = entries;
  firestoreKnowledgeCacheAt = now;
  firestoreRetryAfter = 0;

  return entries;
}

export async function getRelevantAiKnowledge(message: string, limit = 8) {
  try {
    const firestoreKnowledge = await loadFirestoreKnowledge();
    const firestoreResults = searchLocalKnowledge(message, firestoreKnowledge, limit);
    if (firestoreResults.length > 0) return firestoreResults;
  } catch (error) {
    firestoreRetryAfter = Date.now() + FIRESTORE_FAILURE_BACKOFF_MS;
    console.warn('Base de connaissances Firestore indisponible, fallback local:', error);
  }

  const localResults = searchLocalKnowledge(message, LOCAL_KNOWLEDGE, limit);
  return localResults.length > 0 ? localResults : LOCAL_KNOWLEDGE.slice(0, limit);
}

export function buildAiKnowledgeContext(entries: AiKnowledgeEntry[]) {
  if (entries.length === 0) return '';

  return [
    '=== BASE DE CONNAISSANCES eNKAMBA ET GÉNÉRALE ===',
    'Utilise ces connaissances comme source prioritaire pour répondre. Ne révèle pas les détails internes non nécessaires au client.',
    ...entries.map((entry, index) => {
      return [
        `${index + 1}. ${entry.title}`,
        `Module: ${entry.module}`,
        `Résumé: ${entry.summary}`,
        `Connaissance: ${entry.content}`,
        `Mots-clés: ${(entry.keywords || []).join(', ')}`,
      ].join('\n');
    }),
    'Règles: réponds en français clair; oriente vers la bonne app quand une action doit être faite dans l’interface; ne demande jamais de PIN, OTP, mot de passe ou secret dans le chat.',
    '=== FIN BASE DE CONNAISSANCES ===',
  ].join('\n\n');
}
