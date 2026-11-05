import { NextRequest, NextResponse } from 'next/server';
import { generateRefTransa, getWonyaPayConfig } from '@/lib/wonyapay';

/**
 * GET /api/wallet/wonyapay/debug-reftransa
 * Debug la génération de RefTransa et teste directement avec WonyaPay
 */
export async function GET() {
  try {
    // Générer plusieurs RefTransa
    const refTransas = [];
    for (let i = 0; i < 5; i++) {
      const refTransa = generateRefTransa('DBG');
      refTransas.push({
        index: i + 1,
        refTransa,
        timestamp: new Date().toISOString(),
        length: refTransa.length
      });
      
      // Attendre 100ms entre chaque génération
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug RefTransa generation',
      generated_refs: refTransas,
      analysis: {
        all_unique: new Set(refTransas.map(r => r.refTransa)).size === refTransas.length,
        all_20_chars: refTransas.every(r => r.length === 20),
        all_numeric: refTransas.every(r => /^[0-9A-Z]{20}$/.test(r.refTransa))
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur debug RefTransa',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/wonyapay/debug-reftransa
 * Teste une RefTransa spécifique avec WonyaPay sans traitement complet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber = '0997654321', amount = 200, testRefTransa } = body;
    
    const config = getWonyaPayConfig();
    
    // Utiliser une RefTransa fournie ou en générer une nouvelle
    const refTransa = testRefTransa || generateRefTransa('TST');
    
    // Préparer la requête WonyaPay minimale
    const wonyaPayload = {
      RefPartenaire: config.refPartenaire,
      RefTransa: refTransa,
      Montant: amount,
      Devise: 'CDF',
      Action: 'C2B',
      MobileMoney: phoneNumber,
      Motif: 'Test debug RefTransa Kenz'
    };
    
    console.log('🔍 Debug WonyaPay Request:', wonyaPayload);
    
    // Envoyer la requête à WonyaPay
    const response = await fetch(`${config.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
      },
      body: JSON.stringify(wonyaPayload)
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      responseData = { error: 'Réponse non-JSON', raw: await response.text() };
    }
    
    console.log('🔍 Debug WonyaPay Response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    });
    
    return NextResponse.json({
      success: true,
      message: 'Debug test WonyaPay',
      request: wonyaPayload,
      response: {
        status: response.status,
        ok: response.ok,
        data: responseData
      },
      analysis: {
        ref_transa_used: refTransa,
        ref_transa_length: refTransa.length,
        ref_transa_format: /^[0-9A-Z]{20}$/.test(refTransa),
        wonyapay_status: response.status,
        is_duplicate_error: response.status === 409,
        error_message: responseData?.message || responseData?.error || null
      },
      recommendation: response.status === 409 
        ? 'RefTransa considérée comme doublon par WonyaPay - historique très étendu'
        : response.ok 
        ? 'RefTransa acceptée par WonyaPay - système fonctionnel'
        : 'Autre erreur WonyaPay - vérifier configuration'
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur debug test WonyaPay',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
