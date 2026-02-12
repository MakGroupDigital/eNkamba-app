# Firebase Admin SDK Setup for Business Account API Routes

## Overview
The business account API routes now use Firebase Admin SDK to write directly to Firestore. You need to configure the service account credentials in your `.env.local` file.

## Step 1: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **studio-1153706651-6032b**
3. Click **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download - keep it safe!

## Step 2: Extract Credentials from JSON

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

## Step 3: Update .env.local

Add these three variables to your `.env.local` file:

```env
FIREBASE_PROJECT_ID=studio-1153706651-6032b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

**Important**: 
- Replace `firebase-adminsdk-xxxxx` with the actual value from your JSON
- The `FIREBASE_PRIVATE_KEY` must include the `\n` characters (they're literal newlines in the env var)
- Keep the quotes around the private key

## Step 4: Verify Setup

The API routes will now:
1. **submit-request**: Save business requests to `business_requests` collection
2. **approve-request**: Move request to `businesses` collection and update user profile
3. **reject-request**: Update request status to REJECTED

## Testing

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000/dashboard/settings/business-account
3. Fill out the form and submit
4. Check Firestore Console to verify data was saved

## Troubleshooting

If you get errors:
- **"Cannot find module 'firebase-admin'"**: Run `npm install firebase-admin`
- **"Invalid service account"**: Check that credentials are correctly formatted in .env.local
- **"Permission denied"**: Firestore rules are permissive for development, should work fine

## Files Modified

- `src/app/api/business/submit-request/route.ts` - Now writes to Firestore
- `src/app/api/business/approve-request/route.ts` - Uses Firebase Admin SDK
- `src/app/api/business/reject-request/route.ts` - Uses Firebase Admin SDK
- `src/hooks/useBusinessAccount.ts` - Now passes userId to API
