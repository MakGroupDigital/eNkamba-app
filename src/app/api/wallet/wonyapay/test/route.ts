import { NextRequest, NextResponse } from 'next/server';
import { 
  getWonyaPayConfig, 
  processWonyaPayTransaction, 
  generateRefTransa, 
  normalizePhoneNumber,
  type WonyaPayRequest 
} from '@/lib/wonyapay';

/**
 * POST /api/wallet/wonyapay/test
 * Teste la configuration WonyaPay avec une transaction de test (SANS authentification pour les tests)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount = 500, currency = 'CDF', action = 'C2B' } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis pour le test' },
        { status: 400 }
      );
    }

    // Test de la configuration
    let config;
    try {
      config = getWonyaPayConfig();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Configuration WonyaPay invalide',
          details: (error as Error).message 
        },
        { status: 500 }
      );
    }

    // Test de normalisation du numéro
    let normalizedPhone;
    try {
      normalizedPhone = normalizePhoneNumber(phoneNumber);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Format de numéro invalide',
          details: (error as Error).message 
        },
        { status: 400 }
      );
    }

    // Génération de la référence de test avec préfixe TEST
    const baseRef = generateRefTransa();
    const testRefTransa = `TEST${baseRef.substring(4)}`; // Remplacer les 4 premiers caractères par "TEST"

    // Préparation de la requête de test
    const testRequest: WonyaPayRequest = {
      RefPartenaire: config.refPartenaire,
      RefTransa: testRefTransa,
      Montant: amount,
      Devise: currency as 'CDF' | 'USD',
      Action: action as 'C2B' | 'B2C',
      MobileMoney: normalizedPhone,
      Motif: 'Test Kenz - Transaction de validation'
    };

    console.log('Test WonyaPay - Configuration:', {
      baseUrl: config.baseUrl,
      refPartenaire: config.refPartenaire,
      tokenPresent: !!config.token
    });

    console.log('Test WonyaPay - Requête:', testRequest);

    // Exécution du test
    const response = await processWonyaPayTransaction(testRequest, config);

    return NextResponse.json({
      success: true,
      message: 'Test WonyaPay réussi',
      config: {
        baseUrl: config.baseUrl,
        refPartenaire: config.refPartenaire,
        tokenConfigured: !!config.token
      },
      testRequest: {
        ...testRequest,
        // Masquer les données sensibles
        MobileMoney: `${normalizedPhone.slice(0, 3)}****${normalizedPhone.slice(-2)}`
      },
      response
    });

  } catch (error) {
    console.error('Erreur test WonyaPay:', error);
    return NextResponse.json(
      {
        error: 'Échec du test WonyaPay',
        details: (error as Error).message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: (error as any)?.stack } : {})
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/wonyapay/test
 * Vérifie la configuration WonyaPay sans faire de transaction
 */
export async function GET() {
  try {
    const config = getWonyaPayConfig();
    
    return NextResponse.json({
      success: true,
      message: 'Configuration WonyaPay valide',
      config: {
        baseUrl: config.baseUrl,
        refPartenaire: config.refPartenaire,
        tokenConfigured: !!config.token,
        tokenLength: config.token ? config.token.length : 0
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Configuration WonyaPay invalide',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}