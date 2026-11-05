import 'server-only';
import * as crypto from 'crypto';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

// Même logique que la Cloud Function processChurchPayment (functions/src/churchPay.ts),
// exécutée par l'API Next.js : le débit du wallet et les écritures de l'Église restent dans une seule transaction.

type ChurchPaymentCategory =
  | 'tithe'
  | 'offering'
  | 'donation'
  | 'thanksgiving'
  | 'special_contribution'
  | 'building'
  | 'social_aid'
  | 'evangelism'
  | 'project'
  | 'marriage'
  | 'baptism'
  | 'conference'
  | 'retreat'
  | 'choir'
  | 'youth'
  | 'sunday_school'
  | 'media'
  | 'other';

const categoryLabels: Record<ChurchPaymentCategory, string> = {
  tithe: 'Dîme',
  offering: 'Offrande',
  donation: 'Don',
  thanksgiving: 'Action de grâces',
  special_contribution: 'Contribution spéciale',
  building: 'Construction',
  social_aid: 'Aide sociale',
  evangelism: 'Évangélisation',
  project: 'Projet social',
  marriage: 'Mariage',
  baptism: 'Baptême',
  conference: 'Conférence',
  retreat: 'Retraite spirituelle',
  choir: 'Chorale',
  youth: 'Jeunesse',
  sunday_school: 'École du dimanche',
  media: 'Médias',
  other: 'Autre contribution',
};

const asOptionalString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;

const STATUS_BY_CODE = {
  'invalid-argument': 400,
  'failed-precondition': 409,
  'not-found': 404,
  unauthenticated: 401,
} as const;

export class ChurchPaymentError extends Error {
  status: number;
  constructor(code: keyof typeof STATUS_BY_CODE, message: string) {
    super(message);
    this.status = STATUS_BY_CODE[code];
  }
}

export type ChurchPaymentInput = {
  churchId: string;
  amount: number;
  category: ChurchPaymentCategory;
  feeId?: string | null;
  parishId?: string | null;
  campaignId?: string | null;
  qrId?: string | null;
  isAnonymous?: boolean;
  message?: string | null;
  source?: 'app' | 'qr' | 'link';
};

export async function processChurchPayment(db: Firestore, callerId: string, callerName: string | null, data: ChurchPaymentInput) {
    const churchId = asOptionalString(data.churchId);
    const amount = Number(data.amount);
    const category = data.category;
    if (!churchId || !Number.isFinite(amount) || amount <= 0 || !categoryLabels[category]) {
      throw new ChurchPaymentError('invalid-argument', 'Les informations de contribution sont invalides.');
    }

        const payerRef = db.collection('users').doc(callerId);
    const churchRef = db.collection('church_accounts').doc(churchId);
    const transactionRef = churchRef.collection('transactions').doc();
    const receiptRef = churchRef.collection('receipts').doc();
    const auditRef = churchRef.collection('audit_logs').doc();
    const payerWalletTransactionRef = payerRef.collection('transactions').doc();
    const payerNotificationRef = payerRef.collection('notifications').doc();
    const reference = `ENK-CH-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const receiptNumber = `RCP-CH-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    await db.runTransaction(async (transaction) => {
      const [churchSnapshot, payerSnapshot] = await Promise.all([
        transaction.get(churchRef),
        transaction.get(payerRef),
      ]);

      if (!churchSnapshot.exists) {
        throw new ChurchPaymentError('not-found', 'Compte Église introuvable.');
      }
      if (!payerSnapshot.exists) {
        throw new ChurchPaymentError('not-found', 'Wallet contributeur introuvable.');
      }

      const church = churchSnapshot.data()!;
      if (church.status !== 'validated') {
        throw new ChurchPaymentError('failed-precondition', 'Cette Église ne peut pas encore recevoir de contribution.');
      }

      const payer = payerSnapshot.data()!;
      const payerBalance = Number(payer.walletBalance || 0);
      if (payerBalance < amount) {
        throw new ChurchPaymentError('failed-precondition', 'Solde Kenz Pay insuffisant.');
      }

      // Frais créé par l'Église : il fixe le motif, la paroisse et, s'il est fixe, le montant.
      const feeId = asOptionalString(data.feeId);
      const feeRef = feeId ? churchRef.collection('fees').doc(feeId) : null;
      const feeSnapshot = feeRef ? await transaction.get(feeRef) : null;
      const fee = feeSnapshot?.exists ? feeSnapshot.data()! : null;
      if (feeRef && (!fee || fee.status !== 'active')) {
        throw new ChurchPaymentError('failed-precondition', 'Ce frais n’est plus disponible.');
      }
      if (fee?.amount && Number(fee.amount) !== amount) {
        throw new ChurchPaymentError('invalid-argument', 'Le montant ne correspond pas au frais choisi.');
      }

      const parishId = asOptionalString(fee?.parishId) || asOptionalString(data.parishId);
      const campaignId = asOptionalString(data.campaignId);
      const parishRef = parishId ? churchRef.collection('parishes').doc(parishId) : null;
      const campaignRef = campaignId ? churchRef.collection('campaigns').doc(campaignId) : null;
      const [parishSnapshot, campaignSnapshot] = await Promise.all([
        parishRef ? transaction.get(parishRef) : Promise.resolve(null),
        campaignRef ? transaction.get(campaignRef) : Promise.resolve(null),
      ]);

      if (parishRef && !parishSnapshot?.exists) {
        throw new ChurchPaymentError('not-found', 'Paroisse introuvable.');
      }
      if (campaignRef && !campaignSnapshot?.exists) {
        throw new ChurchPaymentError('not-found', 'Campagne introuvable.');
      }

      const now = FieldValue.serverTimestamp();
      const isAnonymous = Boolean(data.isAnonymous);
      const contributorName = isAnonymous
        ? null
        : String(payer.fullName || payer.displayName || payer.name || callerName || 'Fidèle Kenz');
      const parishName = parishSnapshot?.data()?.name || null;
      const campaignName = campaignSnapshot?.data()?.name || null;
      const categoryLabel = asOptionalString(fee?.name) || categoryLabels[category];
      const safeMessage = asOptionalString(data.message);
      const source = data.source === 'qr' || data.source === 'link' ? data.source : 'app';

      transaction.update(payerRef, {
        walletBalance: payerBalance - amount,
        lastTransactionTime: now,
      });
      transaction.update(churchRef, {
        receivedTotal: FieldValue.increment(amount),
        availableBalance: FieldValue.increment(amount),
        transactionCount: FieldValue.increment(1),
        lastPaymentAt: now,
        updatedAt: now,
      });
      if (parishRef) {
        transaction.update(parishRef, {
          receivedTotal: FieldValue.increment(amount),
          transactionCount: FieldValue.increment(1),
          updatedAt: now,
        });
      }
      if (campaignRef) {
        transaction.update(campaignRef, {
          collectedAmount: FieldValue.increment(amount),
          updatedAt: now,
        });
      }

      const record = {
        id: transactionRef.id,
        reference,
        receiptNumber,
        churchId,
        churchName: String(church.name || 'Église Kenz'),
        parishId,
        parishName,
        campaignId,
        campaignName,
        category: (fee?.category && categoryLabels[fee.category as ChurchPaymentCategory]) ? fee.category : category,
        categoryLabel,
        feeId: fee ? feeId : null,
        amount,
        currency: 'CDF',
        fees: 0,
        netAmount: amount,
        paymentChannel: 'enkamba_wallet',
        status: 'completed',
        contributorId: callerId,
        contributorName,
        isAnonymous,
        message: safeMessage,
        source,
        qrId: asOptionalString(data.qrId),
        paymentTransactionId: payerWalletTransactionRef.id,
        paidAt: now,
        createdAt: now,
      };
      transaction.set(transactionRef, record);
      transaction.set(receiptRef, {
        ...record,
        id: receiptRef.id,
        transactionId: transactionRef.id,
        verificationCode: reference,
        createdAt: now,
      });
      transaction.set(payerWalletTransactionRef, {
        id: payerWalletTransactionRef.id,
        type: 'payment_sent',
        context: 'services',
        service: 'echurch',
        amount,
        amountInCDF: amount,
        status: 'completed',
        description: `${categoryLabel} - ${String(church.name || 'Église')}`,
        previousBalance: payerBalance,
        newBalance: payerBalance - amount,
        timestamp: now,
        createdAt: new Date().toISOString(),
        churchId,
        churchTransactionId: transactionRef.id,
        reference,
      });
      transaction.set(payerNotificationRef, {
        id: payerNotificationRef.id,
        type: 'church_payment',
        title: 'Contribution reçue',
        message: `Votre ${categoryLabel.toLowerCase()} de ${amount.toLocaleString('fr-FR')} CDF a été enregistré pour ${String(church.name || 'l’Église')}.`,
        amount,
        transactionId: transactionRef.id,
        context: 'echurch',
        read: false,
        timestamp: now,
        createdAt: new Date().toISOString(),
      });
      transaction.set(auditRef, {
        action: 'church_payment_received',
        actorId: callerId,
        entityType: 'transaction',
        entityId: transactionRef.id,
        reference,
        createdAt: now,
      });
    });


    return { success: true, transactionId: transactionRef.id, receiptId: receiptRef.id, reference, receiptNumber };
}
