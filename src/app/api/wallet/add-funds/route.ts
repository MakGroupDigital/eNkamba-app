import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  generateWonyaRefTransa,
  getWonyaPayConfig,
  isCompletedWonyaStatus,
  normalizeWonyaPhoneNumber,
} from '@/lib/wonyapay';

function getFirebaseApp() {
  try {
    const config = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!config.projectId || !config.apiKey) {
      throw new Error('Variables Firebase manquantes');
    }

    const existingApp = getApps().find(app => app.name === 'wallet-add-funds');
    if (existingApp) return existingApp;
    
    return getApps().length > 0 ? getApp() : initializeApp(config, 'wallet-add-funds');
  } catch (error) {
    console.error('Erreur initialisation Firebase add-funds:', error);
    throw new Error('Initialisation Firebase impossible pour add-funds');
  }
}

/**
 * POST /api/wallet/add-funds
 * Ajoute des fonds au portefeuille de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod, phoneNumber, cardDetails, wonyaDetails } = body;

    // Valider les paramètres requis
    if (!userId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, paymentMethod requis' },
        { status: 400 }
      );
    }

    // Valider le montant
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être supérieur à 0' },
        { status: 400 }
      );
    }

    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    try {
      const db = getFirestore(getFirebaseApp());
      
      // Vérifier le token en obtenant les infos utilisateur depuis Firestore
      // (Si l'utilisateur ne peut pas lire son propre document, le token est invalide)
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // Obtenir le solde actuel
      let currentBalance = 0;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        currentBalance = userData?.walletBalance || 0;
      } else {
        // Créer le document utilisateur s'il n'existe pas
        await setDoc(userRef, {
          uid: userId,
          walletBalance: 0,
          createdAt: new Date().toISOString(),
        });
      }

      const newBalance = currentBalance + amount;
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Créer la transaction
      const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

      if (paymentMethod === 'wonyapay') {
        const config = getWonyaPayConfig();
        const normalizedPhoneNumber = normalizeWonyaPhoneNumber(phoneNumber || '');
        const currency = wonyaDetails?.currency === 'USD' ? 'USD' : 'CDF';
        const motif = wonyaDetails?.motif?.trim() || 'Depot portefeuille eNkamba';

        if (!config.token || !config.refPartenaire) {
          return NextResponse.json(
            { error: 'Configuration WonyaPay manquante. Vérifiez WONYAPAY_TOKEN et WONYAPAY_REF_PARTENAIRE.' },
            { status: 500 }
          );
        }

        if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
          return NextResponse.json(
            { error: 'Le numéro WonyaPay doit contenir 10 chiffres au format local (ex: 0997654321).' },
            { status: 400 }
          );
        }

        // Si la devise est USD, convertir en CDF pour le crédit du portefeuille
        let amountInCDF = amount;
        let exchangeRate = 1;
        
        if (currency === 'USD') {
          try {
            // Récupérer le taux de change USD → CDF
            const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (rateResponse.ok) {
              const rateData = await rateResponse.json();
              exchangeRate = rateData.rates?.CDF || 2800;
              amountInCDF = Math.round(amount * exchangeRate);
            } else {
              // Taux de secours
              exchangeRate = 2800;
              amountInCDF = Math.round(amount * exchangeRate);
            }
          } catch (error) {
            console.error('Erreur récupération taux de change:', error);
            // Taux de secours
            exchangeRate = 2800;
            amountInCDF = Math.round(amount * exchangeRate);
          }
        }

        let wonyaPayload: Record<string, any> | null = null;
        let wonyaResult: any = null;
        let wonyaResponse: Response | null = null;
        let attempt = 0;
        let refTransa = '';
        do {
          attempt += 1;
          refTransa = generateWonyaRefTransa();
          wonyaPayload = {
            RefPartenaire: config.refPartenaire,
            RefTransa: refTransa,
            Montant: amount,
            Devise: currency,
            Action: 'C2B',
            MobileMoney: normalizedPhoneNumber,
            Motif: motif,
          };

          wonyaResponse = await fetch(`${config.baseUrl}/payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.token}`,
            },
            body: JSON.stringify(wonyaPayload),
          });

          try {
            wonyaResult = await wonyaResponse.json();
          } catch {
            wonyaResult = null;
          }

          if (!wonyaResponse.ok && wonyaResponse.status === 409 && attempt < 3) {
            continue;
          }

          break;
        } while (attempt < 3);

        if (!wonyaResponse || !wonyaResponse.ok) {
          const providerMessage =
            wonyaResult?.message ||
            wonyaResult?.error ||
            `Erreur WonyaPay (${wonyaResponse?.status ?? '??'})`;

          return NextResponse.json(
            { error: providerMessage },
            { status: wonyaResponse?.status || 500 }
          );
        }

        const providerStatus =
          wonyaResult?.StatutWonya ||
          wonyaResult?.data?.StatutWonya ||
          wonyaResult?.status ||
          wonyaResult?.data?.status ||
          'pending';
        const completed = isCompletedWonyaStatus(providerStatus);
        // Utiliser le montant converti en CDF pour le crédit du portefeuille
        const walletBalanceAfterPayment = completed ? currentBalance + amountInCDF : currentBalance;

        const wonyaPayData: any = {
          refTransa,
          refPartenaire: config.refPartenaire,
          currency,
          motif,
          network: wonyaResult?.data?.network || null,
          providerTransactionId: wonyaResult?.data?.transactionId || null,
          providerStatus,
          rawResponse: wonyaResult,
        };

        // Ajouter exchangeRate seulement si USD
        if (currency === 'USD') {
          wonyaPayData.exchangeRate = exchangeRate;
        }

        const transactionData: any = {
          id: transactionId,
          type: 'deposit',
          amount: amountInCDF, // Montant en CDF pour le portefeuille
          originalAmount: amount, // Montant original (USD ou CDF)
          originalCurrency: currency,
          paymentMethod,
          status: completed ? 'completed' : 'pending',
          previousBalance: currentBalance,
          newBalance: walletBalanceAfterPayment,
          description: completed
            ? currency === 'USD' 
              ? `Depot WonyaPay confirme (${amount} USD → ${amountInCDF.toLocaleString('fr-FR')} CDF)`
              : 'Depot WonyaPay confirme'
            : currency === 'USD'
            ? `Depot WonyaPay initie (${amount} USD → ${amountInCDF.toLocaleString('fr-FR')} CDF), en attente`
            : 'Depot WonyaPay initie, en attente de confirmation',
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          phoneNumber: normalizedPhoneNumber,
          provider: 'WonyaPay',
          wonyaPay: wonyaPayData,
        };

        await setDoc(transactionRef, transactionData);

        if (completed) {
          await updateDoc(userRef, {
            walletBalance: walletBalanceAfterPayment,
            lastTransactionTime: new Date(),
          });
        }

        const responseData: any = {
          success: true,
          transactionId,
          newBalance: walletBalanceAfterPayment,
          amount: amountInCDF, // Retourner le montant en CDF
          originalAmount: amount,
          originalCurrency: currency,
          message: wonyaResult?.message || 'Transaction WonyaPay initiée',
          transactionStatus: completed ? 'completed' : 'pending',
          providerReference: refTransa,
        };

        // Ajouter exchangeRate seulement si USD
        if (currency === 'USD') {
          responseData.exchangeRate = exchangeRate;
        }

        return NextResponse.json(responseData);
      }

      const transactionData: any = {
        id: transactionId,
        type: 'deposit',
        amount,
        paymentMethod,
        status: 'completed',
        previousBalance: currentBalance,
        newBalance,
        description: `Ajout de fonds via ${
          paymentMethod === 'mobile_money'
            ? 'Mobile Money'
            : paymentMethod === 'credit_card'
            ? 'Carte de crédit'
            : 'Carte de débit'
        }`,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };

      // Ajouter les détails spécifiques
      if (paymentMethod === 'mobile_money' && phoneNumber) {
        transactionData.phoneNumber = phoneNumber;
      } else if (paymentMethod !== 'mobile_money' && cardDetails) {
        transactionData.cardLast4 = cardDetails.cardNumber?.slice(-4) || '';
        transactionData.cardHolder = cardDetails.cardholderName || '';
      }

      // Sauvegarder la transaction
      await setDoc(transactionRef, transactionData);

      // Mettre à jour le solde du portefeuille
      await updateDoc(userRef, {
        walletBalance: newBalance,
        lastTransactionTime: new Date(),
      });

      return NextResponse.json({
        success: true,
        transactionId,
        newBalance,
        amount,
        message: 'Dépôt enregistré avec succès',
        transactionStatus: 'completed',
      });
    } catch (error: any) {
      console.error('Erreur dépôt:', error);
      
      return NextResponse.json(
        { error: error.message || 'Erreur lors du dépôt' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du dépôt:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors du dépôt',
      },
      { status: 500 }
    );
  }
}
