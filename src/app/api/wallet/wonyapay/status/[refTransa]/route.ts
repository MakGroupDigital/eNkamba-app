import { NextRequest, NextResponse } from 'next/server';
import { getWonyaPayConfig, getTransactionStatus } from '@/lib/wonyapay';

/**
 * GET /api/wallet/wonyapay/status/[refTransa]
 * Vérifie le statut d'une transaction WonyaPay
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { refTransa: string } }
) {
  try {
    const { refTransa } = params;

    if (!refTransa) {
      return NextResponse.json(
        { error: 'RefTransa manquant' },
        { status: 400 }
      );
    }

    // Configuration WonyaPay
    const config = getWonyaPayConfig();

    // Vérification du statut
    const statusResponse = await getTransactionStatus(refTransa, config);

    return NextResponse.json({
      success: true,
      refTransa,
      status: statusResponse,
    });

  } catch (error) {
    console.error('Erreur vérification statut WonyaPay:', error);
    return NextResponse.json(
      {
        error: (error as Error).message || 'Erreur lors de la vérification du statut',
      },
      { status: 500 }
    );
  }
}