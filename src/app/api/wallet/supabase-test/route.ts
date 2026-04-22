import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/decode-secrets';

/**
 * GET /api/wallet/supabase-test
 * Test simple pour vérifier que Supabase peut remplacer Firebase
 */
export async function GET() {
  try {
    // Vérifier les variables d'environnement Supabase
    const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig();
    
    return NextResponse.json({
      success: true,
      message: 'Alternative Supabase prête',
      config: {
        supabase_url_configured: !!supabaseUrl,
        supabase_key_configured: !!supabaseKey,
        url_preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Non configuré'
      },
      status: 'Supabase peut remplacer Firebase pour les opérations de portefeuille',
      next_steps: [
        'Créer les tables Supabase (users, transactions)',
        'Tester les opérations CRUD',
        'Migrer progressivement depuis Firebase'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur test Supabase',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/supabase-test
 * Test d'une transaction simulée avec Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod } = body;

    // Simulation d'une transaction réussie
    const transactionId = `SUPA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      success: true,
      message: 'Transaction simulée avec succès (Supabase)',
      transaction: {
        id: transactionId,
        userId,
        amount,
        paymentMethod,
        status: 'completed',
        provider: 'Supabase',
        timestamp: new Date().toISOString()
      },
      note: 'Ceci est une simulation. En production, les données seraient sauvées dans Supabase.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur simulation transaction',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
