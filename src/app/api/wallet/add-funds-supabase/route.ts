import { NextRequest, NextResponse } from 'next/server';
import {
  getWonyaPayConfig,
  processWonyaPayTransaction,
  generateRefTransa,
  normalizePhoneNumber,
  isCompletedWonyaStatus,
  type WonyaPayRequest
} from '@/lib/wonyapay';
import {
  getOrCreateSupabaseUser,
  createSupabaseTransaction,
  updateUserBalance,
  checkSupabaseConnection,
  type SupabaseTransaction
} from '@/lib/supabase-client';

/**
 * POST /api/wallet/add-funds-supabase
 * Alternative à Firebase utilisant Supabase pour les opérations de portefeuille
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  
  try {
    // Vérifier la connexion Supabase
    const { connected, error: connectionError } = await checkSupabaseConnection();
    if (!connected) {
      return NextResponse.json(
        { 
          error: 'Supabase non disponible', 
          details: connectionError,
          fallback: 'Utilisez /api/wallet/add-funds-lite/ comme alternative'
        },
        { status: 503 }
      );
    }

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

    // Récupérer ou créer l'utilisateur dans Supabase
    const user = await getOrCreateSupabaseUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les données utilisateur' },
        { status: 500 }
      );
    }

    const currentBalance = user.wallet_balance || 0;

    // Traitement selon la méthode de paiement
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

        // Génération de la référence de transaction
        const refTransa = generateRefTransa('SUP'); // Préfixe Supabase
        
        // Préparation de la requête WonyaPay
        const wonyaRequest: WonyaPayRequest = {
          RefPartenaire: wonyaConfig.refPartenaire,
          RefTransa: refTransa,
          Montant: amount,
          Devise: currency as 'CDF' | 'USD',
          Action: 'C2B', // Collection (client vers business)
          MobileMoney: normalizedPhone,
          Motif: motif || 'Dépôt portefeuille eNkamba (Supabase)'
        };

        // Créer d'abord une transaction pending
        const transactionId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const pendingTransaction: Omit<SupabaseTransaction, 'id' | 'created_at' | 'updated_at'> = {
          user_id: userId,
          type: 'deposit',
          amount: 0, // Sera mis à jour après WonyaPay
          currency,
          payment_method: 'wonyapay',
          status: 'pending',
          previous_balance: currentBalance,
          new_balance: currentBalance,
          description: 'Dépôt WonyaPay initié (Supabase), en attente de confirmation',
          phone_number: normalizedPhone,
          provider: 'WonyaPay',
          provider_reference: refTransa
        };

        const createdTransaction = await createSupabaseTransaction({
          ...pendingTransaction,
          id: transactionId
        });

        if (!createdTransaction) {
          return NextResponse.json(
            { error: 'Erreur lors de la création de la transaction' },
            { status: 500 }
          );
        }

        // Exécution de la transaction WonyaPay
        const wonyaResponse = await processWonyaPayTransaction(wonyaRequest, wonyaConfig);

        // Détermination du statut de la transaction
        const isCompleted = wonyaResponse.data?.status === 'completed' || 
                           wonyaResponse.data?.status === 'succes' ||
                           isCompletedWonyaStatus(wonyaResponse.data?.status);
        
        const newBalance = isCompleted ? currentBalance + amount : currentBalance;

        // Mise à jour de la transaction avec les détails WonyaPay
        const transactionUpdates: Partial<SupabaseTransaction> = {
          amount,
          status: isCompleted ? 'completed' : 'pending',
          new_balance: newBalance,
          description: isCompleted 
            ? `Dépôt WonyaPay confirmé (${amount} ${currency}) - Supabase`
            : `Dépôt WonyaPay initié (${amount} ${currency}), en attente - Supabase`,
          provider_transaction_id: wonyaResponse.data?.transactionId,
          provider_status: wonyaResponse.data?.status,
          raw_response: wonyaResponse
        };

        // Mise à jour atomique si la transaction est complétée
        if (isCompleted) {
          const balanceUpdated = await updateUserBalance(userId, newBalance);
          if (!balanceUpdated) {
            return NextResponse.json(
              { error: 'Erreur lors de la mise à jour du solde' },
              { status: 500 }
            );
          }
        }

        // Mettre à jour la transaction
        await updateSupabaseTransaction(createdTransaction.id, transactionUpdates);

        return NextResponse.json({
          success: true,
          transactionId: createdTransaction.id,
          newBalance,
          amount,
          currency,
          message: wonyaResponse.message || 'Transaction WonyaPay initiée avec succès (Supabase)',
          transactionStatus: isCompleted ? 'completed' : 'pending',
          providerReference: refTransa,
          wonyaPayData: wonyaResponse.data,
          provider: 'Supabase'
        });

      } catch (error) {
        console.error('Erreur WonyaPay (Supabase):', error);
        return NextResponse.json(
          {
            error: (error as Error).message || 'Erreur lors du traitement WonyaPay',
            provider: 'Supabase',
            ...(isDev ? { details: (error as any)?.stack } : {}),
          },
          { status: 500 }
        );
      }
    }

    // Autres méthodes de paiement (simulation)
    const newBalance = currentBalance + amount;
    const transactionId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionData: Omit<SupabaseTransaction, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      type: 'deposit',
      amount,
      currency: 'CDF',
      payment_method: paymentMethod,
      status: 'completed',
      previous_balance: currentBalance,
      new_balance: newBalance,
      description: `Ajout de fonds via ${paymentMethod} (Supabase)`,
      ...(phoneNumber && { phone_number: phoneNumber }),
    };

    // Créer la transaction
    const createdTransaction = await createSupabaseTransaction({
      ...transactionData,
      id: transactionId
    });

    if (!createdTransaction) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la transaction' },
        { status: 500 }
      );
    }

    // Mettre à jour le solde
    const balanceUpdated = await updateUserBalance(userId, newBalance);
    if (!balanceUpdated) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du solde' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: createdTransaction.id,
      newBalance,
      amount,
      currency: 'CDF',
      message: 'Dépôt enregistré avec succès (Supabase)',
      transactionStatus: 'completed',
      provider: 'Supabase'
    });

  } catch (error: any) {
    console.error('Erreur lors du dépôt (Supabase):', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors du dépôt',
        provider: 'Supabase',
        ...(isDev ? { details: error.stack } : {}),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/add-funds-supabase
 * Test de la connexion Supabase
 */
export async function GET() {
  try {
    const { connected, error } = await checkSupabaseConnection();
    
    return NextResponse.json({
      success: connected,
      message: connected ? 'Supabase connecté et prêt' : 'Supabase non disponible',
      provider: 'Supabase',
      ...(error && { error })
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du test Supabase',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}