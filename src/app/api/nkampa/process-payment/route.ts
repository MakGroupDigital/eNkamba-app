import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Service non disponible - Firebase Admin SDK non configuré' },
        { status: 500 }
      );
    }

    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const buyerId = decodedToken.uid;

    // Récupérer les données de la requête
    const { orderId, sellerId, amount, currency, trackingNumber } = await request.json();

    if (!orderId || !sellerId || !amount) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que l'acheteur a suffisamment de fonds
    const buyerWalletRef = adminDb.collection('wallets').doc(buyerId);
    const buyerWallet = await buyerWalletRef.get();

    if (!buyerWallet.exists) {
      return NextResponse.json(
        { error: 'Portefeuille introuvable' },
        { status: 404 }
      );
    }

    const buyerBalance = buyerWallet.data()?.balance || 0;

    if (buyerBalance < amount) {
      return NextResponse.json(
        { error: 'Solde insuffisant' },
        { status: 400 }
      );
    }

    // Créer une transaction
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = FieldValue.serverTimestamp();

    // Transaction dans une batch pour garantir l'atomicité
    const batch = adminDb.batch();

    // Débiter l'acheteur
    batch.update(buyerWalletRef, {
      balance: FieldValue.increment(-amount),
      updatedAt: timestamp,
    });

    // Créditer le vendeur
    const sellerWalletRef = adminDb.collection('wallets').doc(sellerId);
    const sellerWallet = await sellerWalletRef.get();

    if (!sellerWallet.exists) {
      // Créer le portefeuille du vendeur s'il n'existe pas
      batch.set(sellerWalletRef, {
        userId: sellerId,
        balance: amount,
        currency: currency || 'CDF',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } else {
      batch.update(sellerWalletRef, {
        balance: FieldValue.increment(amount),
        updatedAt: timestamp,
      });
    }

    // Enregistrer la transaction pour l'acheteur
    const buyerTransactionRef = adminDb
      .collection('wallets')
      .doc(buyerId)
      .collection('transactions')
      .doc(transactionId);

    batch.set(buyerTransactionRef, {
      type: 'ecommerce_purchase',
      amount: -amount,
      currency: currency || 'CDF',
      status: 'completed',
      orderId,
      sellerId,
      description: `Achat e-commerce - Commande ${orderId}`,
      metadata: {
        trackingNumber: trackingNumber || null,
        orderId,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Enregistrer la transaction pour le vendeur
    const sellerTransactionRef = adminDb
      .collection('wallets')
      .doc(sellerId)
      .collection('transactions')
      .doc(transactionId);

    batch.set(sellerTransactionRef, {
      type: 'ecommerce_sale',
      amount: amount,
      currency: currency || 'CDF',
      status: 'completed',
      orderId,
      buyerId,
      description: `Vente e-commerce - Commande ${orderId}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Exécuter la transaction
    await batch.commit();

    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Paiement effectué avec succès',
    });
  } catch (error: any) {
    console.error('Erreur traitement paiement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du traitement du paiement' },
      { status: 500 }
    );
  }
}
