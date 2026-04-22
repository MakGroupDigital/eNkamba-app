import { NextRequest, NextResponse } from 'next/server';
import { generateRefTransa, getWonyaPayConfig } from '@/lib/wonyapay';

/**
 * GET /api/wallet/wonyapay/production-test
 * Teste la génération de RefTransa unique pour la production
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'test-user-123';
    const count = parseInt(url.searchParams.get('count') || '5');
    
    // Vérifier la configuration WonyaPay
    const config = getWonyaPayConfig();
    
    // Générer plusieurs RefTransa pour le même utilisateur
    const refTransas = [];
    for (let i = 0; i < count; i++) {
      const refTransa = generateRefTransa('ENK', userId);
      refTransas.push({
        index: i + 1,
        refTransa,
        userId,
        timestamp: new Date().toISOString(),
        length: refTransa.length
      });
      
      // Petit délai pour simuler des transactions séquentielles
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Vérifier l'unicité
    const uniqueRefs = new Set(refTransas.map(r => r.refTransa));
    const allUnique = uniqueRefs.size === refTransas.length;
    
    return NextResponse.json({
      success: true,
      message: 'Test de génération RefTransa pour production',
      config: {
        wonyapay_configured: !!config.token && !!config.refPartenaire,
        base_url: config.baseUrl,
        ref_partenaire: config.refPartenaire
      },
      test_results: {
        user_id: userId,
        generated_count: refTransas.length,
        unique_count: uniqueRefs.size,
        all_unique: allUnique,
        uniqueness_rate: `${((uniqueRefs.size / refTransas.length) * 100).toFixed(2)}%`
      },
      ref_transas: refTransas,
      validation: {
        all_20_chars: refTransas.every(r => r.length === 20),
        all_alphanumeric: refTransas.every(r => /^[A-Z0-9]{20}$/.test(r.refTransa)),
        prefix_correct: refTransas.every(r => r.refTransa.startsWith('ENK'))
      },
      production_ready: allUnique && refTransas.every(r => r.length === 20),
      note: 'Chaque RefTransa est unique par utilisateur et timestamp. En production, chaque transaction aura une RefTransa différente.'
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur test production RefTransa',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/wonyapay/production-test
 * Teste une vraie transaction WonyaPay avec RefTransa unique
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phoneNumber, amount = 500, currency = 'CDF' } = body;
    
    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { error: 'userId et phoneNumber requis' },
        { status: 400 }
      );
    }
    
    // Générer une RefTransa unique pour cet utilisateur
    const refTransa = generateRefTransa('ENK', userId);
    
    // Configuration WonyaPay
    const config = getWonyaPayConfig();
    
    // Préparer la requête (sans l'envoyer pour éviter les frais)
    const wonyaRequest = {
      RefPartenaire: config.refPartenaire,
      RefTransa: refTransa,
      Montant: amount,
      Devise: currency,
      Action: 'C2B',
      MobileMoney: phoneNumber,
      Motif: 'Test production eNkamba'
    };
    
    return NextResponse.json({
      success: true,
      message: 'RefTransa unique générée pour transaction production',
      user_id: userId,
      ref_transa: refTransa,
      wonyapay_request: wonyaRequest,
      ready_for_production: true,
      note: 'Cette RefTransa est unique et prête pour une vraie transaction WonyaPay',
      warning: 'Transaction non envoyée - utilisez /api/wallet/add-funds-lite/ pour traiter'
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur test transaction production',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}