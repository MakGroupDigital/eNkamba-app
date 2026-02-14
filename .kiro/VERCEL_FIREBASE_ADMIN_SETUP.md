# Vercel Firebase Admin SDK Setup Guide

## Problem Fixed
The Vercel build was failing with:
```
Error: Failed to parse private key: Error: Invalid PEM formatted message.
```

This occurred because Firebase Admin SDK environment variables weren't properly configured in Vercel.

## Solution Applied

The Nkampa payment API route (`src/app/api/nkampa/process-payment/route.ts`) has been updated to:
1. Defer Firebase Admin initialization until runtime (not build time)
2. Gracefully handle missing credentials
3. Return a 503 error if Firebase Admin SDK isn't configured instead of crashing

## How to Configure Firebase Admin SDK in Vercel

### Step 1: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `studio-1153706651-6032b`
3. Click **Settings** (gear icon) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download - keep it safe!

### Step 2: Extract Credentials from JSON

The downloaded JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "studio-1153706651-6032b",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 3: Add to Vercel Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these three variables:

#### 1. FIREBASE_PROJECT_ID
```
Value: studio-1153706651-6032b
```

#### 2. FIREBASE_CLIENT_EMAIL
```
Value: firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com
```
(Copy from the JSON file)

#### 3. FIREBASE_PRIVATE_KEY
```
Value: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n
```

**IMPORTANT**: The private key must include the literal `\n` characters (not actual newlines). When you paste it:
- Copy the entire private_key value from the JSON (including BEGIN and END lines)
- Paste it as-is into Vercel
- Vercel will handle the escaping automatically

### Step 4: Redeploy

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click the three dots on the latest deployment
3. Select **Redeploy**
4. Or push a new commit to trigger automatic deployment

## Verification

After deployment, the build should complete successfully. The payment API will:
- Initialize Firebase Admin SDK at runtime
- Process payments correctly
- Debit buyer's wallet
- Credit seller's wallet
- Create transactions and notifications

## Testing the Payment API

Once deployed, test with:

```bash
curl -X POST https://your-vercel-url.vercel.app/api/nkampa/process-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "orderId": "order-123",
    "buyerId": "user-buyer-id",
    "sellerId": "user-seller-id",
    "amount": 8500,
    "currency": "CDF"
  }'
```

Expected response:
```json
{
  "success": true,
  "transactionId": "TXN-1707900000000-abc123def",
  "orderId": "order-123",
  "amount": 8500,
  "currency": "CDF"
}
```

## Environment Variables Summary

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `studio-1153706651-6032b` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCtAGRkCxcE-H3n-dYj0VRRRlJkjRx6KA8` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `studio-1153706651-6032b.firebaseapp.com` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://studio-1153706651-6032b.firebaseio.com` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `studio-1153706651-6032b.appspot.com` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `889346916234` | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:889346916234:web:7b3f5c2a8e9d1f4a2b5c6d` | Firebase Console |
| `FIREBASE_PROJECT_ID` | `studio-1153706651-6032b` | Service Account JSON |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@...` | Service Account JSON |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | Service Account JSON |

## Troubleshooting

### Build still fails with "Invalid PEM formatted message"
- Verify the private key is copied exactly as-is from the JSON
- Check that `\n` characters are present (not actual newlines)
- Regenerate the service account key and try again

### API returns 503 "Firebase Admin SDK not configured"
- Check that all three Firebase Admin variables are set in Vercel
- Verify the values are correct (no typos)
- Redeploy after adding variables

### API returns 401 "Token invalide"
- Ensure the Authorization header has a valid Firebase ID token
- Token must be from the same Firebase project

### API returns 400 "Solde insuffisant"
- Buyer's wallet balance is less than the purchase amount
- Buyer needs to add funds first

## Security Notes

- Never commit the service account JSON file to Git
- Never share the private key publicly
- Rotate service account keys periodically
- Use Vercel's environment variable encryption
- The private key is only used server-side (never sent to client)

## Files Modified

- `src/app/api/nkampa/process-payment/route.ts` - Updated to handle missing credentials gracefully

## Next Steps

1. Get Firebase service account credentials
2. Add environment variables to Vercel
3. Redeploy the application
4. Test the payment API
5. Monitor logs for any errors

