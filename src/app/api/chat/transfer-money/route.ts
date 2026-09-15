import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { resolveUserByIdentifier } from '@/lib/user-resolver';

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      recipientId,
      recipientIdentifier,
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

    if (!senderId) {
      return NextResponse.json(
        { message: 'Expéditeur non identifié' },
        { status: 400 }
      );
    }

    // Résoudre le destinataire si un identifiant est fourni
    let finalRecipientId = recipientId;
    let finalRecipientName = recipientName;

    if (recipientIdentifier && !recipientId) {
      console.log('[transfer-money] Résolution du destinataire:', recipientIdentifier);
      const resolvedUser = await resolveUserByIdentifier(recipientIdentifier);
      
      if (!resolvedUser) {
        return NextResponse.json(
          { message: 'Destinataire non trouvé. Vérifiez le numéro de téléphone, email ou numéro Kenz.' },
          { status: 404 }
        );
      }

      finalRecipientId = resolvedUser.uid;
      finalRecipientName = resolvedUser.data.displayName || resolvedUser.data.email || recipientIdentifier;
      console.log('[transfer-money] Destinataire résolu:', finalRecipientId);
    }

    if (!finalRecipientId) {
      return NextResponse.json(
        { message: 'Destinataire non identifié' },
        { status: 400 }
      );
    }

    // Vérifier que l'expéditeur et le destinataire sont différents
    if (senderId === finalRecipientId) {
      return NextResponse.json(
        { message: 'Vous ne pouvez pas envoyer de l\'argent à vous-même' },
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
    const recipientWalletRef = doc(db, 'wallets', finalRecipientId);
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
      recipientId: finalRecipientId,
      recipientName: finalRecipientName,
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
        recipientId: finalRecipientId,
        recipientName: finalRecipientName,
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
      recipientId: finalRecipientId,
      recipientName: finalRecipientName,
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
