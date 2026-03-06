import { NextRequest, NextResponse } from 'next/server';

// Cette API route retourne simplement un ID de transaction
// Le vrai traitement se fait côté client avec Firebase
export async function POST(request: NextRequest) {
  try {
    const { orderId, buyerId, sellerId, amount, currency, trackingNumber } = await request.json();

    if (!orderId || !buyerId || !sellerId || !amount) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Générer un ID de transaction unique
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Transaction initiée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur traitement paiement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du traitement du paiement' },
      { status: 500 }
    );
  }
}
