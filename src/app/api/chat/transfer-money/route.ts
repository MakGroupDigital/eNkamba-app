import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      recipientId,
      recipientName,
      conversationId,
      senderId,
      senderName,
    } = await request.json();

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Montant invalide' },
        { status: 400 }
      );
    }

    if (!recipientId || !senderId) {
      return NextResponse.json(
        { message: 'Données utilisateur manquantes' },
        { status: 400 }
      );
    }

    // Vérifier le solde de l'expéditeur
    const senderWalletRef = doc(db, 'wallets', senderId);
    const senderWalletSnap = await getDoc(senderWalletRef);

    if (!senderWalletSnap.exists()) {
      return NextResponse.json(
        { message: 'Portefeuille expéditeur non trouvé' },
        { status: 404 }
      );
    }

    const senderBalance = senderWalletSnap.data().balance || 0;

    if (senderBalance < amount) {
      return NextResponse.json(
        { message: 'Solde insuffisant' },
        { status: 400 }
      );
    }

    // Vérifier que le destinataire existe
    const recipientWalletRef = doc(db, 'wallets', recipientId);
    const recipientWalletSnap = await getDoc(recipientWalletRef);

    if (!recipientWalletSnap.exists()) {
      return NextResponse.json(
        { message: 'Portefeuille destinataire non trouvé' },
        { status: 404 }
      );
    }

    // Créer la transaction
    const transactionsRef = collection(db, 'transactions');
    const transactionDoc = await addDoc(transactionsRef, {
      type: 'chat_transfer',
      senderId,
      senderName,
      recipientId,
      recipientName,
      amount,
      status: 'pending',
      conversationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const transactionId = transactionDoc.id;

    // Créer le message de transfert
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      messageType: 'money',
      senderId,
      senderName,
      text: `💰 Transfert de ${amount} FC`,
      metadata: {
        amount,
        recipientId,
        recipientName,
        transactionId,
        status: 'pending',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      transactionId,
      messageId: messageDoc.id,
      message: 'Transfert créé avec succès',
    });
  } catch (error) {
    console.error('Erreur transfert:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
