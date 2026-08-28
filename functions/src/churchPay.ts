import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

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

/**
 * Encaisse une contribution eChurch depuis le wallet Kenz.
 * Le mouvement de wallet et les écritures de l'Église sont créés dans une seule transaction Firestore.
 */
export const processChurchPayment = functions.https.onCall(
  async (data: {
    churchId: string;
    amount: number;
    category: ChurchPaymentCategory;
    parishId?: string | null;
    campaignId?: string | null;
    qrId?: string | null;
    isAnonymous?: boolean;
    message?: string | null;
    source?: 'app' | 'qr' | 'link';
  }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise pour contribuer.');
    }
    const callerId = context.auth.uid;

    const churchId = asOptionalString(data.churchId);
    const amount = Number(data.amount);
    const category = data.category;
    if (!churchId || !Number.isFinite(amount) || amount <= 0 || !categoryLabels[category]) {
      throw new functions.https.HttpsError('invalid-argument', 'Les informations de contribution sont invalides.');
    }

    const db = admin.firestore();
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
        throw new functions.https.HttpsError('not-found', 'Compte Église introuvable.');
      }
      if (!payerSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Wallet contributeur introuvable.');
      }

      const church = churchSnapshot.data()!;
      if (church.status !== 'validated') {
        throw new functions.https.HttpsError('failed-precondition', 'Cette Église ne peut pas encore recevoir de contribution.');
      }

      const payer = payerSnapshot.data()!;
      const payerBalance = Number(payer.walletBalance || 0);
      if (payerBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Solde Kenz Pay insuffisant.');
      }

      const parishId = asOptionalString(data.parishId);
      const campaignId = asOptionalString(data.campaignId);
      const parishRef = parishId ? churchRef.collection('parishes').doc(parishId) : null;
      const campaignRef = campaignId ? churchRef.collection('campaigns').doc(campaignId) : null;
      const [parishSnapshot, campaignSnapshot] = await Promise.all([
        parishRef ? transaction.get(parishRef) : Promise.resolve(null),
        campaignRef ? transaction.get(campaignRef) : Promise.resolve(null),
      ]);

      if (parishRef && !parishSnapshot?.exists) {
        throw new functions.https.HttpsError('not-found', 'Paroisse introuvable.');
      }
      if (campaignRef && !campaignSnapshot?.exists) {
        throw new functions.https.HttpsError('not-found', 'Campagne introuvable.');
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const isAnonymous = Boolean(data.isAnonymous);
      const contributorName = isAnonymous
        ? null
        : String(payer.fullName || payer.displayName || payer.name || context.auth?.token.name || 'Fidèle Kenz');
      const parishName = parishSnapshot?.data()?.name || null;
      const campaignName = campaignSnapshot?.data()?.name || null;
      const categoryLabel = categoryLabels[category];
      const safeMessage = asOptionalString(data.message);
      const source = data.source === 'qr' || data.source === 'link' ? data.source : 'app';

      transaction.update(payerRef, {
        walletBalance: payerBalance - amount,
        lastTransactionTime: now,
      });
      transaction.update(churchRef, {
        receivedTotal: admin.firestore.FieldValue.increment(amount),
        availableBalance: admin.firestore.FieldValue.increment(amount),
        transactionCount: admin.firestore.FieldValue.increment(1),
        lastPaymentAt: now,
        updatedAt: now,
      });
      if (parishRef) {
        transaction.update(parishRef, {
          receivedTotal: admin.firestore.FieldValue.increment(amount),
          transactionCount: admin.firestore.FieldValue.increment(1),
          updatedAt: now,
        });
      }
      if (campaignRef) {
        transaction.update(campaignRef, {
          collectedAmount: admin.firestore.FieldValue.increment(amount),
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
        category,
        categoryLabel,
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

    return {
      success: true,
      transactionId: transactionRef.id,
      receiptId: receiptRef.id,
      reference,
      receiptNumber,
    };
  },
);
