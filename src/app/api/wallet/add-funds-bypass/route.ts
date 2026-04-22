import { NextRequest, NextResponse } from 'next/server';
import {
  getWonyaPayConfig,
  processWonyaPayTransaction,
  generateRefTransa,
  normalizePhoneNumber,
  type WonyaPayRequest
} from '@/lib/wonyapay';

/**
 * POST /api/wallet/add-funds-bypass
 * API de contournement Firebase - Stockage en mémoire temporaire
 * Utilise WonyaPay mais évite complètement Firebase
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod, phoneNumber, currency = 'CDF', motif } = body;

    // Validation des paramètres
    if (!userId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, paymentMethod requis' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à 0' }, { status: 400 });
    }

    // Simulation du solde actuel (en production, récupérer depuis Supabase)
    const currentBalance = 5000; // Solde simulé

    // Traitement WonyaPay
    if (paymentMethod === 'wonyapay') {
      try {
        // Configuration WonyaPay
        const wonyaConfig = getWonyaPayConfig();
        
        if (!phoneNumber) {
          return NextResponse.json(
            { error: 'Numéro de téléphone requis pour WonyaPay' },
            { status: 400 }
          );
        }

        // Validation et normalisation du numéro
        let normalizedPhone;
        try {
          normalizedPhone = normalizePhoneNumber(phoneNumber);
        } catch (error) {
          return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
          );
        }

        // Génération de la référence de transaction avec préfixe BYPASS
        const refTransa = generateRefTransa('BYP');
        
        // Préparation de la requête WonyaPay
        const wonyaRequest: WonyaPayRequest = {
          RefPartenaire: wonyaConfig.refPartenaire,
          RefTransa: refTransa,
          Montant: amount,
          Devise: currency as 'CDF' | 'USD',
          Action: 'C2B',
          MobileMoney: normalizedPhone,
          Motif: motif || 'Dépôt portefeuille eNkamba (Bypass Firebase)'
        };

        console.log('🚀 WonyaPay Request (Bypass):', {
          RefTransa: refTransa,
          Montant: amount,
          Devise: currency,
          MobileMoney: normalizedPhone
        });

        // Exécution de la transaction WonyaPay
        const wonyaResponse = await processWonyaPayTransaction(wonyaRequest, wonyaConfig);

        console.log('✅ WonyaPay Response (Bypass):', wonyaResponse);

        // Détermination du statut
        const isCompleted = wonyaResponse.data?.status === 'completed' || 
                           wonyaResponse.data?.status === 'succes';
        
        const newBalance = isCompleted ? currentBalance + amount : currentBalance;
        const transactionId = `BYP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Simulation de sauvegarde (en production, sauver dans Supabase)
        const transactionData = {
          id: transactionId,
          userId,
          type: 'deposit',
          amount,
          currency,
          paymentMethod: 'wonyapay',
          status: isCompleted ? 'completed' : 'pending',
          previousBalance: currentBalance,
          newBalance,
          description: isCompleted 
            ? `Dépôt WonyaPay confirmé (${amount} ${currency}) - Bypass Firebase`
            : `Dépôt WonyaPay initié (${amount} ${currency}), en attente - Bypass Firebase`,
          phoneNumber: normalizedPhone,
          provider: 'WonyaPay',
          providerReference: refTransa,
          wonyaPayData: wonyaResponse.data,
          timestamp: new Date().toISOString(),
          note: 'Transaction traitée sans Firebase - Prêt pour migration Supabase'
        };

        console.log('💾 Transaction Data (Bypass):', transactionData);

        return NextResponse.json({
          success: true,
          transactionId,
          newBalance,
          amount,
          currency,
          message: wonyaResponse.message || 'Transaction WonyaPay traitée avec succès (Bypass Firebase)',
          transactionStatus: isCompleted ? 'completed' : 'pending',
          providerReference: refTransa,
          wonyaPayData: wonyaResponse.data,
          provider: 'WonyaPay (Bypass Firebase)',
          note: 'Transaction simulée - Prête pour intégration Supabase'
        });

      } catch (error) {
        console.error('❌ Erreur WonyaPay (Bypass):', error);
        return NextResponse.json(
          {
            error: (error as Error).message || 'Erreur lors du traitement WonyaPay',
            provider: 'WonyaPay (Bypass Firebase)',
            ...(isDev ? { details: (error as any)?.stack } : {}),
          },
          { status: 500 }
        );
      }
    }

    // Autres méthodes de paiement (simulation)
    const newBalance = currentBalance + amount;
    const transactionId = `BYP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionData = {
      id: transactionId,
      userId,
      type: 'deposit',
      amount,
      currency: 'CDF',
      paymentMethod,
      status: 'completed',
      previousBalance: currentBalance,
      newBalance,
      description: `Ajout de fonds via ${paymentMethod} (Bypass Firebase)`,
      timestamp: new Date().toISOString(),
      note: 'Transaction simulée - Prête pour intégration Supabase'
    };

    return NextResponse.json({
      success: true,
      transactionId,
      newBalance,
      amount,
      currency: 'CDF',
      message: 'Dépôt traité avec succès (Bypass Firebase)',
      transactionStatus: 'completed',
      provider: 'Bypass Firebase',
      note: 'Transaction simulée - Prête pour intégration Supabase'
    });

  } catch (error: any) {
    console.error('❌ Erreur Bypass Firebase:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors du dépôt',
        provider: 'Bypass Firebase',
        ...(isDev ? { details: error.stack } : {}),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/add-funds-bypass
 * Test de l'API de contournement
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de contournement Firebase opérationnelle',
    features: [
      'Traitement WonyaPay sans Firebase',
      'Génération RefTransa avec préfixe BYP',
      'Simulation de stockage en mémoire',
      'Prêt pour migration Supabase'
    ],
    usage: {
      endpoint: 'POST /api/wallet/add-funds-bypass',
      parameters: {
        userId: 'string (requis)',
        amount: 'number (requis)',
        paymentMethod: 'string (requis)',
        phoneNumber: 'string (pour WonyaPay)',
        currency: 'CDF|USD (optionnel, défaut: CDF)',
        motif: 'string (optionnel)'
      }
    },
    note: 'Cette API contourne complètement Firebase et est prête pour Supabase'
  });
}