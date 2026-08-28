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
  const moduleName = normalizeText(entry.module);
  const summary = normalizeText(entry.summary);
  const content = normalizeText(entry.content);
  const keywords = (entry.keywords || []).map(normalizeText);
  const tags = (entry.tags || []).map(normalizeText);

  let score = Math.min(Number(entry.priority || 0), 100) / 100;

  for (const token of tokens) {
    if (title.includes(token)) score += 6;
    if (moduleName.includes(token)) score += 5;
    if (keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) score += 5;
    if (tags.some((tag) => tag.includes(token))) score += 3;
    if (summary.includes(token)) score += 2.5;
    if (content.includes(token)) score += 1;
  }

  const normalizedQuery = normalizeText(query);
  if (title && normalizedQuery.includes(title)) score += 8;
  if (moduleName && normalizedQuery.includes(moduleName)) score += 5;

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
    const firestoreKnowledge = (await loadFirestoreKnowledge()).filter((entry) => entry.visibility !== 'internal');
    const firestoreResults = searchLocalKnowledge(message, firestoreKnowledge, limit);
    if (firestoreResults.length > 0) return firestoreResults;
  } catch (error) {
    firestoreRetryAfter = Date.now() + FIRESTORE_FAILURE_BACKOFF_MS;
    console.warn('Base de connaissances Firestore indisponible, fallback local:', error);
  }

  const publicLocalKnowledge = LOCAL_KNOWLEDGE.filter((entry) => entry.visibility !== 'internal');
  const localResults = searchLocalKnowledge(message, publicLocalKnowledge, limit);
  return localResults;
}

export function buildAiKnowledgeContext(entries: AiKnowledgeEntry[]) {
  if (entries.length === 0) return '';

  return [
    '=== BASE DE CONNAISSANCES KENZ ET GÉNÉRALE ===',
    'Utilise ces connaissances comme source prioritaire pour répondre.',
    'Ne révèle jamais les détails internes, secrets techniques, architecture serveur, technologies exactes, logs, cybersécurité interne, infrastructure, règles admin, clés, endpoints, modèles ou mécanismes sensibles.',
    'Si une question touche admin, sécurité, infrastructure ou technologie interne, réponds en termes généraux orientés utilisateur, conformité et bonnes pratiques, sans détails exploitables.',
    ...entries.map((entry, index) => {
      return [
        `${index + 1}. ${entry.title}`,
        `Module: ${entry.module}`,
        `Résumé: ${entry.summary}`,
        `Connaissance: ${entry.content}`,
        `Mots-clés: ${(entry.keywords || []).join(', ')}`,
      ].join('\n');
    }),
    'Règles: réponds en français clair; oriente vers la bonne app quand une action doit être faite dans l’interface; ne demande jamais de PIN, OTP, mot de passe ou secret dans le chat; ne dévoile pas les informations internes Kenz.',
    '=== FIN BASE DE CONNAISSANCES ===',
  ].join('\n\n');
}

export function buildKnowledgeFallbackAnswer(
  message: string,
  entries: AiKnowledgeEntry[],
  options?: { searchUnavailableReason?: string }
) {
  const normalizedMessage = normalizeText(message);
  const isGreeting = /^(salut|bonjour|bonsoir|hello|hi|coucou|slt)\b/.test(normalizedMessage);

  if (options?.searchUnavailableReason) {
    return [
      'La recherche web est bien activée, mais elle n’est pas disponible pour le moment.',
      '',
      options.searchUnavailableReason,
      '',
      'Je peux répondre avec les connaissances Kenz déjà disponibles, ou vous pouvez réessayer avec une requête plus précise.',
    ].join('\n');
  }

  if (isGreeting) {
    return [
      'Bonjour, je suis Kenz AI.',
      '',
      'Je peux vous aider sur Chat, Marché, Paiement, Logistique, Réseau social, Business Pro et les services de la plateforme.',
      'Dites-moi simplement ce que vous voulez faire : suivre un colis, comprendre un paiement, gérer une boutique, contacter quelqu’un, créer une livraison ou analyser une opération.',
    ].join('\n');
  }

  const usefulEntries = entries.slice(0, 4);
  if (usefulEntries.length === 0) {
    return [
      'Je peux vous aider avec Kenz, mais le moteur IA principal est momentanément indisponible.',
      'Essayez de préciser votre besoin : paiement, colis, marché, chat, réseau social, business ou administration.',
    ].join('\n');
  }

  return [
    'Voici ce que je peux vous dire avec les connaissances Kenz disponibles :',
    '',
    ...usefulEntries.map((entry) => `- ${entry.title} : ${entry.summary}`),
    '',
    'Précisez votre demande si vous voulez une réponse plus détaillée ou un parcours étape par étape.',
  ].join('\n');
}
