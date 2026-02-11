import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const {
      messageId,
      conversationId,
      amount,
      senderId,
      recipientId,
    } = await request.json();

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Montant invalide' },
        { status: 400 }
      );
    }

    if (!senderId || !recipientId) {
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

    // Vérifier le portefeuille du destinataire
    const recipientWalletRef = doc(db, 'wallets', recipientId);
    const recipientWalletSnap = await getDoc(recipientWalletRef);

    if (!recipientWalletSnap.exists()) {
      return NextResponse.json(
        { message: 'Portefeuille destinataire non trouvé' },
        { status: 404 }
      );
    }

    // Effectuer le transfert
    // 1. Débiter l'expéditeur
    await updateDoc(senderWalletRef, {
      balance: increment(-amount),
      updatedAt: serverTimestamp(),
    });

    // 2. Créditer le destinataire
    await updateDoc(recipientWalletRef, {
      balance: increment(amount),
      updatedAt: serverTimestamp(),
    });

    // 3. Trouver et mettre à jour la transaction
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('type', '==', 'chat_transfer'),
      where('conversationId', '==', conversationId),
      where('senderId', '==', senderId),
      where('recipientId', '==', recipientId),
      where('amount', '==', amount),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const transactionDoc = querySnapshot.docs[0];
      await updateDoc(transactionDoc.ref, {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Mettre à jour le message
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      'metadata.status': 'completed',
      updatedAt: serverTimestamp(),
    });

    // 5. Créer une transaction d'historique
    const historyRef = collection(db, 'transactions');
    await historyRef.add({
      type: 'transfer',
      senderId,
      recipientId,
      amount,
      status: 'completed',
      source: 'chat',
      conversationId,
      messageId,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Transfert accepté et complété',
    });
  } catch (error) {
    console.error('Erreur acceptation transfert:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
