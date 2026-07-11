import { promises as fs } from 'fs';
import path from 'path';
import aiResponseMemorySeed from '@/data/ai-response-memory.seed.json';
import { getAdminFirestore } from '@/lib/firebase-admin';

export type AiResponseMemoryEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category?: string;
  score?: number;
  source?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const LOCAL_RESPONSE_MEMORY = aiResponseMemorySeed as AiResponseMemoryEntry[];
const RESPONSE_MEMORY_CACHE_MS = 5 * 60 * 1000;
const RESPONSE_MEMORY_FAILURE_BACKOFF_MS = 2 * 60 * 1000;
const GENERATED_MEMORY_PATH = path.join(process.cwd(), 'src/data/ai-response-memory.generated.json');

let responseMemoryCache: AiResponseMemoryEntry[] | null = null;
let responseMemoryCacheAt = 0;
let responseMemoryRetryAfter = 0;
let generatedMemoryCache: AiResponseMemoryEntry[] | null = null;

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
    'suis',
    'vous',
    'nous',
  ]);

  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function scoreMemoryEntry(entry: AiResponseMemoryEntry, query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const normalizedQuery = normalizeText(query);
  const question = normalizeText(entry.question);
  const answer = normalizeText(entry.answer);
  const keywords = (entry.keywords || []).map(normalizeText);

  let score = Math.min(Number(entry.score || 0), 100) / 100;
  if (question === normalizedQuery) score += 30;
  if (question.includes(normalizedQuery) || normalizedQuery.includes(question)) score += 14;

  for (const token of tokens) {
    if (question.includes(token)) score += 5;
    if (keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) score += 5;
    if (answer.includes(token)) score += 1;
  }

  return score;
}

function isSensitiveExchange(question: string, answer: string) {
  const normalized = normalizeText(`${question} ${answer}`);
  const sensitivePatterns = [
    /\b(pin|otp|mot de passe|password|secret|token|api key|cle api|private key|carte bancaire|cvv|cvc)\b/,
    /\b(sk-[a-z0-9_-]{12,}|sk-proj-[a-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{12,})\b/i,
    /\b\d{12,19}\b/,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(normalized));
}

function buildKeywords(question: string, answer: string) {
  return Array.from(new Set([...tokenize(question), ...tokenize(answer).slice(0, 12)])).slice(0, 18);
}

async function loadFirestoreResponseMemory() {
  const now = Date.now();
  if (responseMemoryCache && now - responseMemoryCacheAt < RESPONSE_MEMORY_CACHE_MS) {
    return responseMemoryCache;
  }

  if (now < responseMemoryRetryAfter) {
    return [];
  }

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('aiResponseMemory')
    .where('status', '==', 'active')
    .orderBy('updatedAt', 'desc')
    .limit(300)
    .get();

  const entries = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      question: String(data.question || ''),
      answer: String(data.answer || ''),
      keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
      category: String(data.category || 'general'),
      score: Number(data.score || 0),
      source: String(data.source || 'memory'),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } satisfies AiResponseMemoryEntry;
  }).filter((entry) => entry.question && entry.answer);

  responseMemoryCache = entries;
  responseMemoryCacheAt = now;
  responseMemoryRetryAfter = 0;

  return entries;
}

async function loadGeneratedResponseMemory() {
  if (generatedMemoryCache) {
    return generatedMemoryCache;
  }

  try {
    const raw = await fs.readFile(GENERATED_MEMORY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    generatedMemoryCache = Array.isArray(parsed)
      ? parsed
          .map((item) => ({
            id: String(item.id || ''),
            question: String(item.question || ''),
            answer: String(item.answer || ''),
            keywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [],
            category: String(item.category || 'general'),
            score: Number(item.score || 0),
            source: String(item.source || 'generated'),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))
          .filter((entry) => entry.id && entry.question && entry.answer)
      : [];
    return generatedMemoryCache;
  } catch {
    generatedMemoryCache = [];
    return generatedMemoryCache;
  }
}

async function rememberExchangeInGeneratedDataset(entry: AiResponseMemoryEntry) {
  try {
    const generatedEntries = await loadGeneratedResponseMemory();
    const nextEntries = [
      entry,
      ...generatedEntries.filter((item) => item.id !== entry.id),
    ].slice(0, 500);

    await fs.writeFile(GENERATED_MEMORY_PATH, `${JSON.stringify(nextEntries, null, 2)}\n`, 'utf8');
    generatedMemoryCache = nextEntries;
  } catch (error) {
    console.warn('Impossible de mémoriser la réponse IA dans le dataset local:', error);
  }
}

export async function getRelevantAiResponseMemories(message: string, limit = 4) {
  const allEntries: AiResponseMemoryEntry[] = [...LOCAL_RESPONSE_MEMORY];

  const generatedEntries = await loadGeneratedResponseMemory();
  allEntries.push(...generatedEntries);

  try {
    const firestoreEntries = await loadFirestoreResponseMemory();
    allEntries.push(...firestoreEntries);
  } catch (error) {
    responseMemoryRetryAfter = Date.now() + RESPONSE_MEMORY_FAILURE_BACKOFF_MS;
    console.warn('Mémoire IA Firestore indisponible, fallback local:', error);
  }

  return allEntries
    .map((entry) => ({ entry, score: scoreMemoryEntry(entry, message) }))
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({ ...item.entry, score: item.score }));
}

export function buildAiResponseMemoryContext(entries: AiResponseMemoryEntry[]) {
  if (entries.length === 0) return '';

  return [
    '=== MÉMOIRE APPRENANTE eNKAMBA AI ===',
    'Ces exemples proviennent de réponses déjà validées. Utilise-les seulement si la question actuelle est proche.',
    ...entries.map((entry, index) => {
      return [
        `${index + 1}. Question proche: ${entry.question}`,
        `Réponse mémorisée: ${entry.answer}`,
        `Mots-clés: ${(entry.keywords || []).join(', ')}`,
      ].join('\n');
    }),
    '=== FIN MÉMOIRE APPRENANTE ===',
  ].join('\n\n');
}

export function buildMemoryFallbackAnswer(entries: AiResponseMemoryEntry[]) {
  const best = entries[0];
  if (!best || Number(best.score || 0) < 8) {
    return '';
  }

  return best.answer;
}

export async function rememberAiExchange(params: {
  question: string;
  answer: string;
  source: 'openai' | 'gemini' | 'groq';
}) {
  const question = params.question.trim();
  const answer = params.answer.trim();

  if (question.length < 4 || answer.length < 12) return;
  if (question.length > 1000 || answer.length > 8000) return;
  if (isSensitiveExchange(question, answer)) return;

  const now = new Date();
  const id = Buffer.from(normalizeText(question).slice(0, 160)).toString('base64url').slice(0, 160);
  const memoryEntry: AiResponseMemoryEntry = {
    id,
    question,
    answer,
    keywords: buildKeywords(question, answer),
    category: 'general',
    source: params.source,
    score: 20,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    const db = getAdminFirestore();

    await db.collection('aiResponseMemory').doc(id).set(
      {
        question: memoryEntry.question,
        answer: memoryEntry.answer,
        keywords: memoryEntry.keywords,
        category: memoryEntry.category,
        source: params.source,
        status: 'active',
        score: memoryEntry.score,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );

    responseMemoryCache = null;
  } catch (error) {
    console.warn('Impossible de mémoriser la réponse IA:', error);
    await rememberExchangeInGeneratedDataset(memoryEntry);
  }
}
