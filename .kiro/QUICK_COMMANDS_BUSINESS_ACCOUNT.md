# Quick Commands - Business Account

## Setup Commands

### 1. Install Firebase Admin SDK (if not already installed)
```bash
npm install firebase-admin
```

### 2. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Test User Form
```
Open browser: http://localhost:3000/dashboard/settings/business-account
```

### 4. Test Admin Dashboard
```
Open browser: http://localhost:3000/admin/business-requests
```

### 5. Check Firestore
```
Open browser: https://console.firebase.google.com/
Select project: studio-1153706651-6032b
Go to Firestore Database
Check collections: business_requests, businesses, users
```

---

## Environment Variables

Add to `.env.local`:
```env
FIREBASE_PROJECT_ID=studio-1153706651-6032b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

---

## Testing Flow

### Step 1: Submit Business Request
```
1. Go to http://localhost:3000/dashboard/settings/business-account
2. Fill form:
   - Business Name: "Test Business"
   - Type: "COMMERCE"
   - Sub-category: "Retail"
   - Registration Number: "REG123"
   - Address: "123 Main St"
   - City: "Kinshasa"
   - Country: "DRC"
   - Contact Email: "test@example.com"
   - Contact Phone: "+243123456789"
3. Click "Soumettre la demande"
4. Should see success message
```

### Step 2: Check Firestore
```
1. Go to https://console.firebase.google.com/
2. Select project: studio-1153706651-6032b
3. Go to Firestore Database
4. Check business_requests collection
5. Should see document with your submission
```

### Step 3: Admin Approves Request
```
1. Go to http://localhost:3000/admin/business-requests
2. Should see pending request
3. Click "Approver" button
4. Should see success message
```

### Step 4: Verify Approval
```
1. Go to https://console.firebase.google.com/
2. Check businesses collection - should have new document
3. Check users collection - your user should have isBusiness: true
```

### Step 5: Test Rejection
```
1. Create another business request
2. In admin dashboard, click "Rejeter"
3. Enter rejection reason
4. Check Firestore - status should be "REJECTED"
```

---

## Debugging Commands

### Check if Firebase Admin is initialized
```bash
# Look for this in server logs:
# "Firebase Admin SDK initialized"
```

### Check API response
```bash
# Open browser console (F12)
# Look for fetch responses in Network tab
# Check for error messages in Console tab
```

### Check Firestore data
```bash
# Go to https://console.firebase.google.com/
# Select project: studio-1153706651-6032b
# Go to Firestore Database
# Check collections and documents
```

### Check server logs
```bash
# Look for errors in terminal where npm run dev is running
# Look for "Erreur soumission demande" or similar
```

---

## File Locations

### API Routes
```
src/app/api/business/submit-request/route.ts
src/app/api/business/approve-request/route.ts
src/app/api/business/reject-request/route.ts
```

### Hook
```
src/hooks/useBusinessAccount.ts
```

### Pages
```
src/app/dashboard/settings/business-account/page.tsx
src/app/admin/business-requests/page.tsx
```

### Types
```
src/types/business-account.types.ts
```

---

## Environment File

### Location
```
.env.local
```

### Required Variables
```env
FIREBASE_PROJECT_ID=studio-1153706651-6032b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Firestore Collections

### business_requests
```
Document ID: {userId}_{timestamp}
Fields:
- userId
- businessName
- type
- subCategory
- registrationNumber
- address
- city
- country
- contactEmail
- contactPhone
- apiCallbackUrl
- documents
- status (PENDING, VERIFIED, REJECTED)
- submittedAt
- updatedAt
- verifiedAt (if approved)
- verifiedBy (if approved)
- rejectionReason (if rejected)
```

### businesses
```
Document ID: {userId}_{timestamp}
Fields:
- businessId
- status (VERIFIED)
- isActive
- verifiedAt
- verifiedBy
- ... (all fields from business_requests)
```

### users
```
Document ID: {userId}
Updated fields:
- isBusiness: true
- businessId: {userId}_{timestamp}
- businessType: COMMERCE|LOGISTICS|PAYMENT
- businessStatus: VERIFIED
```

---

## URLs

### User Form
```
http://localhost:3000/dashboard/settings/business-account
```

### Admin Dashboard
```
http://localhost:3000/admin/business-requests
```

### Firebase Console
```
https://console.firebase.google.com/
Project: studio-1153706651-6032b
```

### Firebase Service Accounts
```
https://console.firebase.google.com/project/studio-1153706651-6032b/settings/serviceaccounts/adminsdk
```

---

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
npm run dev
```

### Error: "Invalid service account"
```
1. Go to Firebase Console
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Copy credentials to .env.local
5. Restart dev server
```

### Error: "Permission denied"
```
1. Check Firestore rules (should be permissive for dev)
2. Check admin permissions (user must be in admins collection)
3. Check browser console for actual error
```

### Data not appearing in Firestore
```
1. Check browser console for fetch errors
2. Check server logs for API errors
3. Verify credentials in .env.local
4. Verify dev server is running
```

---

## Success Indicators

✅ Form submits without errors
✅ Success message appears
✅ Data appears in Firestore `business_requests`
✅ Admin can see pending request
✅ Admin can approve request
✅ Data appears in Firestore `businesses`
✅ User profile has `isBusiness: true`
✅ Admin can reject request
✅ Rejection reason stored in Firestore

---

## Next Steps

1. Get Firebase credentials
2. Add to .env.local
3. Restart dev server
4. Test user form
5. Test admin dashboard
6. Verify Firestore data
7. Test rejection flow

---

## Documentation

- `BUSINESS_ACCOUNT_READY_TO_TEST.md` - Quick start
- `FIREBASE_ADMIN_SDK_SETUP.md` - Credential setup
- `BUSINESS_ACCOUNT_TESTING_FLOW.md` - Testing guide
- `BUSINESS_ACCOUNT_ERRORS_FIXED.md` - Technical details
- `BUSINESS_ACCOUNT_SYSTEM_DIAGRAM.md` - Architecture

---

## Summary

1. Install firebase-admin: `npm install firebase-admin`
2. Add credentials to .env.local
3. Restart dev server: `npm run dev`
4. Test at http://localhost:3000/dashboard/settings/business-account
5. Admin test at http://localhost:3000/admin/business-requests
6. Verify in Firestore Console

**Ready to test!** 🚀
