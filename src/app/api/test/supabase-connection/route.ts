import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@/lib/supabase-client';

/**
 * GET /api/test/supabase-connection
 * Teste la connexion à Supabase et affiche les informations de configuration
 */
export async function GET() {
  try {
    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const config = {
      url_configured: !!supabaseUrl,
      key_configured: !!supabaseAnonKey,
      url_preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Non configuré',
      key_preview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Non configuré'
    };

    // Tester la connexion
    const { connected, error } = await checkSupabaseConnection();

    return NextResponse.json({
      success: true,
      message: 'Test de connexion Supabase',
      configuration: config,
      connection: {
        status: connected ? 'Connecté' : 'Échec',
        connected,
        error: error || null
      },
      next_steps: connected ? [
        'Supabase est prêt à utiliser',
        'Testez l\'API: POST /api/wallet/add-funds-supabase',
        'Créez les tables si ce n\'est pas déjà fait (voir SUPABASE_WALLET_SETUP.md)'
      ] : [
        'Vérifiez NEXT_PUBLIC_SUPABASE_URL dans .env.local',
        'Vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local',
        'Créez un projet sur supabase.com',
        'Suivez les instructions dans SUPABASE_WALLET_SETUP.md'
      ]
    });

  } catch (error) {
    console.error('Erreur test Supabase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du test Supabase',
        details: (error as Error).message,
        help: 'Vérifiez la configuration dans .env.local et consultez SUPABASE_WALLET_SETUP.md'
      },
      { status: 500 }
    );
  }
}