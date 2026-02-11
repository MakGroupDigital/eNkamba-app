import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const {
      messageId,
      conversationId,
      recipientId,
    } = await request.json();

    // Validation
    if (!messageId || !conversationId || !recipientId) {
      return NextResponse.json(
        { message: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Mettre à jour le message
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      'metadata.status': 'rejected',
      updatedAt: serverTimestamp(),
    });

    // Mettre à jour la transaction
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('type', '==', 'chat_transfer'),
      where('conversationId', '==', conversationId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const transactionDoc = querySnapshot.docs[0];
      await updateDoc(transactionDoc.ref, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Transfert refusé',
    });
  } catch (error) {
    console.error('Erreur refus transfert:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
