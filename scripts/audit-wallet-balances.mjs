// ENK-007 — READ-ONLY audit of wallet balances. This script never writes to Firestore.
// Usage: node scripts/audit-wallet-balances.mjs [--out audite/wallet-audit.csv]
// For each user it compares users.walletBalance with the sum of completed movements in users/{uid}/transactions
// and lists deposits that came from paths that never collected real money (simulated methods, bypass, PayPal return page).
import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const outFile = outArg > -1 ? process.argv[outArg + 1] : path.join(rootDir, 'audite', 'wallet-audit.csv');

const decodeSecret = (value) => {
  if (!value) return '';
  try { return Buffer.from(value, 'base64').toString('utf8'); } catch { return ''; }
};

async function getServiceAccount() {
  try {
    const encoded = (await readFile(path.join(rootDir, 'firebase-admin-sdk.encoded.txt'), 'utf8')).trim();
    const parsed = JSON.parse(decodeSecret(encoded));
    if (parsed?.project_id) return { projectId: parsed.project_id, clientEmail: parsed.client_email, privateKey: parsed.private_key };
  } catch {}
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || decodeSecret(process.env.FIREBASE_CLIENT_EMAIL_ENCODED);
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || decodeSecret(process.env.FIREBASE_PRIVATE_KEY_ENCODED)).replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Configuration Firebase Admin manquante.');
  return { projectId, clientEmail, privateKey };
}

const CREDIT_TYPES = new Set(['deposit', 'receive', 'received', 'transfer_in', 'refund', 'credit', 'payment_received', 'sale', 'transfer_received', 'nkampa_sale']);
const DEBIT_TYPES = new Set(['withdrawal', 'withdraw', 'send', 'sent', 'transfer_out', 'payment', 'purchase', 'debit', 'fee', 'transfer_sent', 'nkampa_purchase', 'esim_purchase', 'tontine_contribution', 'payment_sent']);
// Deposits recorded by code paths that credited without a provider confirmation (closed in this remediation).
const SIMULATED_METHODS = new Set(['card', 'credit_card', 'debit_card', 'crypto', 'mobile_money', 'paypal']);

function isSuspiciousDeposit(tx) {
  if (tx.type !== 'deposit' || tx.status !== 'completed') return false;
  if (String(tx.id || '').startsWith('BYP-')) return true;
  if (SIMULATED_METHODS.has(tx.paymentMethod) && !tx.providerReference && !tx.wonyaPay && !tx.maxicash) return true;
  return false;
}

async function main() {
  admin.initializeApp({ credential: admin.credential.cert(await getServiceAccount()) });
  const db = admin.firestore();
  const users = await db.collection('users').select('walletBalance').get();
  const rows = [['uid', 'walletBalance', 'ledgerSum', 'gap', 'suspiciousDeposits', 'suspiciousAmount', 'unknownTypes']];
  let flagged = 0;

  for (const user of users.docs) {
    const balance = Number(user.get('walletBalance') || 0);
    const txs = await user.ref.collection('transactions').get();
    let ledgerSum = 0; let suspicious = 0; let suspiciousAmount = 0; const unknown = new Set();
    for (const doc of txs.docs) {
      const tx = { id: doc.id, ...doc.data() };
      if (tx.status !== 'completed') continue;
      const amount = Math.abs(Number(tx.amount || 0));
      if (CREDIT_TYPES.has(tx.type)) ledgerSum += amount;
      else if (DEBIT_TYPES.has(tx.type)) ledgerSum -= amount;
      else unknown.add(tx.type);
      if (isSuspiciousDeposit(tx)) { suspicious += 1; suspiciousAmount += amount; }
    }
    const gap = Math.round((balance - ledgerSum) * 100) / 100;
    if (gap !== 0 || suspicious > 0) {
      flagged += 1;
      rows.push([user.id, balance, ledgerSum, gap, suspicious, suspiciousAmount, [...unknown].join('|')]);
    }
  }

  await writeFile(outFile, rows.map((row) => row.join(',')).join('\n'));
  console.log(`${users.size} portefeuilles analysés, ${flagged} à examiner. Rapport : ${outFile}`);
  console.log('Aucune donnée modifiée. La correction des soldes doit passer par une migration validée par la Finance.');
}

main().catch((error) => { console.error(error.message); process.exit(1); });
