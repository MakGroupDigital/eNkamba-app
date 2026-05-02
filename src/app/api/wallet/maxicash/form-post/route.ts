import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import {
  assertMaxiCashConfig,
  escapeHtml,
  generateMaxiCashReference,
  getMaxiCashConfig,
  toMaxiCashCents,
} from '@/lib/maxicash';
import { convertUsdToCdf } from '@/lib/exchange-rate';

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === 'wallet-maxicash-form-post');
  if (existing) return existing;

  return initializeApp(
    {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    'wallet-maxicash-form-post'
  );
}

function getBaseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = String(formData.get('userId') || '');
    const amount = Number(formData.get('amount') || 0);
    const telephone = String(formData.get('telephone') || '');
    const email = String(formData.get('email') || '');
    const brand = String(formData.get('brand') || 'enkambapay') === 'maxicash' ? 'maxicash' : 'enkambapay';
    const isMaxiCashBrand = brand === 'maxicash';
    const displayName = isMaxiCashBrand ? 'MaxiCash' : 'eNkambaPay';

    if (!userId || !amount || amount <= 0) {
      return new NextResponse(`Paramètres ${displayName} invalides.`, { status: 400 });
    }

    const config = getMaxiCashConfig();
    assertMaxiCashConfig(config);

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.exists() ? Number(userSnap.data()?.walletBalance || 0) : 0;

    if (!userSnap.exists()) {
      await setDoc(userRef, { uid: userId, walletBalance: 0, createdAt: new Date().toISOString() });
    }

    const transactionId = `MXC-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const reference = generateMaxiCashReference(userId);
    const amountInCdf = (await convertUsdToCdf(amount)).cdfAmount;
    const baseUrl = getBaseUrl(request);
    const returnBase = `${baseUrl}/dashboard/add-funds/maxicash/return`;
    const returnParams = `userId=${encodeURIComponent(userId)}&transactionId=${encodeURIComponent(transactionId)}&brand=${encodeURIComponent(brand)}`;
    const notifyUrl = `${baseUrl}/api/wallet/maxicash/notify?userId=${encodeURIComponent(userId)}&transactionId=${encodeURIComponent(transactionId)}`;

    const transactionRef = doc(collection(userRef, 'transactions'), transactionId);
    await setDoc(transactionRef, {
      id: transactionId,
      type: 'deposit',
      amount: amountInCdf,
      originalAmount: amount,
      originalCurrency: 'MaxiDollar',
      paymentMethod: isMaxiCashBrand ? 'maxicash_gateway' : 'maxicash',
      status: 'pending',
      previousBalance: currentBalance,
      newBalance: currentBalance,
      description: `Dépôt ${displayName} initié (${amount} USD)`,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      phoneNumber: telephone || null,
      email: email || null,
      provider: 'MaxiCash',
      maxicash: {
        environment: config.environment,
        reference,
        formPostUrl: config.payEntryPostUrl,
        brand,
      },
    });

    const fields: Record<string, string> = {
      PayType: 'MaxiCash',
      Amount: String(toMaxiCashCents(amount)),
      Currency: 'MaxiDollar',
      Telephone: telephone,
      Email: email,
      MerchantID: config.merchantId,
      MerchantPassword: config.merchantPassword,
      Language: 'Fr',
      Reference: reference,
      accepturl: `${returnBase}?status=success&${returnParams}`,
      cancelurl: `${returnBase}?status=cancelled&${returnParams}`,
      declineurl: `${returnBase}?status=failed&${returnParams}`,
      notifyurl: notifyUrl,
    };

    const payEntryWebPayload = {
      PayType: fields.PayType,
      MerchantID: fields.MerchantID,
      MerchantPassword: fields.MerchantPassword,
      Amount: fields.Amount,
      Currency: fields.Currency,
      Telephone: fields.Telephone,
      Email: fields.Email,
      Language: fields.Language,
      Reference: fields.Reference,
      SuccessURL: fields.accepturl,
      FailureURL: fields.declineurl,
      CancelURL: fields.cancelurl,
      NotifyURL: fields.notifyurl,
    };

    const payEntryWebResponse = await fetch(config.payEntryWebUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payEntryWebPayload),
    });
    const payEntryWebData = await payEntryWebResponse.json().catch(() => null);
    const logId = payEntryWebData?.LogID || payEntryWebData?.ResponseData;

    if (!payEntryWebResponse.ok || String(payEntryWebData?.ResponseStatus || '').toLowerCase() !== 'success' || !logId) {
      console.error('MaxiCash PayEntryWeb failed:', {
        status: payEntryWebResponse.status,
        responseStatus: payEntryWebData?.ResponseStatus,
        responseError: payEntryWebData?.ResponseError,
        responseDesc: payEntryWebData?.ResponseDesc,
      });
      return new NextResponse(payEntryWebData?.ResponseError || `${displayName} n’a pas pu initialiser le paiement.`, { status: 502 });
    }

    const gatewayUrl = `${config.gatewayBaseUrl.replace(/\/$/, '')}/payentryweb?logid=${encodeURIComponent(logId)}`;

    if (isMaxiCashBrand) {
      return NextResponse.redirect(gatewayUrl, 303);
    }

    return new NextResponse(
      `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ouverture ${escapeHtml(displayName)}</title>
    <style>
      body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f7fbf9;color:#0B6E4F}
      .box{width:min(420px,calc(100vw - 32px));border:1px solid #d7eee4;border-radius:12px;background:#fff;padding:24px;text-align:center;box-shadow:0 12px 30px rgba(11,110,79,.08)}
      .brand{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px}
      .brand img{width:42px;height:42px;object-fit:contain}
      .brand strong{font-size:22px}
      .spinner{width:34px;height:34px;border:4px solid #d7eee4;border-top-color:#32BB78;border-radius:50%;margin:0 auto 16px;animation:spin .9s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      button{margin-top:14px;border:0;border-radius:8px;background:#32BB78;color:white;font-weight:700;padding:10px 14px}
    </style>
  </head>
  <body>
    <div class="box">
      <div class="brand">
        ${isMaxiCashBrand ? '' : '<img src="/enkamba-logo.png" alt="">'}
        <strong>${escapeHtml(displayName)}</strong>
      </div>
      <div class="spinner"></div>
      <h1>Ouverture du paiement</h1>
      <p>Votre paiement sécurisé est prêt.</p>
      <p>Référence: ${escapeHtml(reference)}</p>
      <button type="button" onclick="window.location.href='${escapeHtml(gatewayUrl)}'">Continuer</button>
    </div>
    <script>window.location.href='${escapeHtml(gatewayUrl)}';</script>
  </body>
</html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error: any) {
    console.error('Erreur Form Post MaxiCash:', error);
    return new NextResponse(error?.message || 'Erreur paiement', { status: 500 });
  }
}
