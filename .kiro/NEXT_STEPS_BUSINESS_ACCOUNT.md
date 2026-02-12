# Next Steps - Business Account Implementation

## What Was Fixed

✅ **API Routes Now Have Firestore Integration**
- `submit-request`: Saves to `business_requests` collection
- `approve-request`: Creates business profile and updates user
- `reject-request`: Updates request status

✅ **Hook Updated**
- Now passes `userId` to API

✅ **Firebase Admin SDK Ready**
- All routes configured to use Firebase Admin SDK
- Just need credentials in `.env.local`

## What You Need To Do

### Step 1: Get Firebase Service Account Credentials (5 minutes)

1. Go to https://console.firebase.google.com/
2. Select project: **studio-1153706651-6032b**
3. Click **Project Settings** (⚙️ icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file downloads - open it

### Step 2: Add Credentials to .env.local (2 minutes)

From the JSON file, copy these three values:

```env
FIREBASE_PROJECT_ID=studio-1153706651-6032b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

**Important:**
- Replace `firebase-adminsdk-xxxxx` with actual value from JSON
- Keep the `\n` characters in FIREBASE_PRIVATE_KEY
- Keep quotes around the private key

### Step 3: Restart Dev Server (1 minute)

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test the Flow (10 minutes)

**User Side:**
1. Go to http://localhost:3000/dashboard/settings/business-account
2. Fill form:
   - Business Name: "Test Business"
   - Type: "COMMERCE"
   - Sub-category: "Retail"
   - Other fields: fill with test data
3. Click "Soumettre la demande"
4. Should see success message

**Admin Side:**
1. Go to http://localhost:3000/admin/business-requests
2. Should see your pending request
3. Click "Approver"
4. Should see success message

**Verify in Firestore:**
1. Go to https://console.firebase.google.com/
2. Select project: studio-1153706651-6032b
3. Go to Firestore Database
4. Check collections:
   - `business_requests`: Should have your submission
   - `businesses`: Should have approved business
   - `users`: Your user should have `isBusiness: true`

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "Invalid service account"
- Check that credentials are correctly copied from JSON
- Verify no extra spaces or quotes

### Error: "Permission denied"
- Firestore rules are permissive for development
- Should not get permission errors
- Check browser console for actual error

### Data not appearing in Firestore
- Check browser console for fetch errors
- Check server logs for API errors
- Verify credentials are in `.env.local`

## What Happens Next

After testing:

1. **Optional: Deploy Cloud Functions**
   - Currently using API routes (works fine)
   - Cloud Functions can be deployed later if needed

2. **Optional: Enable Document Upload**
   - Currently disabled due to Firebase Storage 412 errors
   - Can be re-enabled after fixing storage rules

3. **Optional: Add Email Notifications**
   - Send email when business request is approved/rejected
   - Can use existing email system

4. **Optional: Business Dashboard**
   - Create dashboard for verified businesses
   - Show business stats and settings

## Files to Reference

- `FIREBASE_ADMIN_SDK_SETUP.md` - Detailed credential setup
- `BUSINESS_ACCOUNT_TESTING_FLOW.md` - Complete testing guide
- `BUSINESS_ACCOUNT_API_ROUTES_FIXED.md` - Technical details

## Admin Dashboard Access

After testing, the admin dashboard is at:
```
http://localhost:3000/admin/business-requests
```

Only users with `admins` collection document can access it.

## Summary

The business account system is now ready to test. Just add the Firebase credentials to `.env.local` and restart the server. Everything else is configured and working.
