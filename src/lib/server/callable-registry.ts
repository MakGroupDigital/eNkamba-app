import 'server-only';
// Le code des Cloud Functions (functions/src) est exécuté tel quel par l'API Next.js :
// « firebase-functions » y est remplacé par src/lib/server/firebase-functions-shim.ts (voir next.config.ts).
import * as moneyRequest from '../../../functions/src/moneyRequest';
import * as unifiedPayment from '../../../functions/src/unifiedPayment';
import * as paymentCollection from '../../../functions/src/paymentCollection';
import * as walletTransactions from '../../../functions/src/walletTransactions';
import * as referralSystem from '../../../functions/src/referralSystem';
import type { CallableContext } from './firebase-functions-shim';

type Runnable = { run: (data: unknown, context: CallableContext) => Promise<unknown> | unknown };

export const SERVER_CALLABLES: Record<string, Runnable> = {
  searchUserByIdentifier: moneyRequest.searchUserByIdentifier as unknown as Runnable,
  createMoneyRequest: moneyRequest.createMoneyRequest as unknown as Runnable,
  acceptMoneyRequest: moneyRequest.acceptMoneyRequest as unknown as Runnable,
  rejectMoneyRequest: moneyRequest.rejectMoneyRequest as unknown as Runnable,
  processUnifiedPayment: unifiedPayment.processUnifiedPayment as unknown as Runnable,
  createPaymentLink: paymentCollection.createPaymentLink as unknown as Runnable,
  processPaymentLink: paymentCollection.processPaymentLink as unknown as Runnable,
  getPaymentLinkDetails: paymentCollection.getPaymentLinkDetails as unknown as Runnable,
  createContactPaymentCode: paymentCollection.createContactPaymentCode as unknown as Runnable,
  getCollectionStats: paymentCollection.getCollectionStats as unknown as Runnable,
  cancelTransaction: walletTransactions.cancelTransaction as unknown as Runnable,
  generateReferralLink: referralSystem.generateReferralLink as unknown as Runnable,
};
