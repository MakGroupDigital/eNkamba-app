# Business Account API Routes - Fixed

## Summary of Changes

All three API routes have been updated to use Firebase Admin SDK for proper Firestore integration.

## Files Modified

### 1. `src/app/api/business/submit-request/route.ts`
**Changes:**
- Added Firebase Admin SDK initialization
- Now writes business requests to `business_requests` collection
- Accepts `userId` from request body
- Generates unique `requestId` as `${userId}_${timestamp}`
- Returns saved document with ID

**Flow:**
```
User Form → API Route → Firestore (business_requests collection)
```

### 2. `src/app/api/business/approve-request/route.ts`
**Changes:**
- Added Firebase Admin SDK initialization with proper credential handling
- Verifies admin permissions
- Creates business profile in `businesses` collection
- Updates `business_requests` status to "VERIFIED"
- Updates user profile with `isBusiness: true`

**Flow:**
```
Admin Dashboard → API Route → Firestore (3 updates):
  1. business_requests: status = VERIFIED
  2. businesses: new document created
  3. users: isBusiness = true
```

### 3. `src/app/api/business/reject-request/route.ts`
**Changes:**
- Added Firebase Admin SDK initialization
- Verifies admin permissions
- Updates `business_requests` status to "REJECTED"
- Stores rejection reason

**Flow:**
```
Admin Dashboard → API Route → Firestore (business_requests):
  status = REJECTED
  rejectionReason = provided reason
```

### 4. `src/hooks/useBusinessAccount.ts`
**Changes:**
- Now passes `userId: user.uid` to the API request
- Maintains all other functionality

**Before:**
```typescript
body: JSON.stringify({
  businessName: formData.businessName,
  // ... other fields
})
```

**After:**
```typescript
body: JSON.stringify({
  userId: user.uid,  // ← ADDED
  businessName: formData.businessName,
  // ... other fields
})
```

## Environment Variables Required

Add to `.env.local`:
```env
FIREBASE_PROJECT_ID=studio-1153706651-6032b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1153706651-6032b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

See `FIREBASE_ADMIN_SDK_SETUP.md` for detailed instructions.

## How It Works

### Firebase Admin SDK Initialization
```typescript
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}
```

This:
1. Checks if Firebase Admin is already initialized
2. Creates credentials from environment variables
3. Initializes Firebase Admin SDK
4. Allows Firestore writes from API routes

### Data Flow

**Submit Request:**
```
User fills form
  ↓
Hook calls API with userId
  ↓
API validates data
  ↓
API writes to Firestore (business_requests)
  ↓
Returns success with document ID
```

**Approve Request:**
```
Admin clicks approve
  ↓
API verifies admin permissions
  ↓
API creates business profile
  ↓
API updates 3 Firestore documents
  ↓
User now has isBusiness: true
```

## Testing

See `BUSINESS_ACCOUNT_TESTING_FLOW.md` for complete testing guide.

Quick test:
1. Configure Firebase credentials in `.env.local`
2. Start dev server: `npm run dev`
3. Go to http://localhost:3000/dashboard/settings/business-account
4. Submit form
5. Check Firestore Console for saved data

## Firestore Collections

### business_requests
```
{
  userId: string
  businessName: string
  type: "COMMERCE" | "LOGISTICS" | "PAYMENT"
  subCategory: string
  registrationNumber: string
  address: string
  city: string
  country: string
  contactEmail: string
  contactPhone: string
  apiCallbackUrl: string | null
  documents: Record<string, string>
  status: "PENDING" | "VERIFIED" | "REJECTED"
  submittedAt: number
  updatedAt: number
  verifiedAt?: number
  verifiedBy?: string
  rejectionReason?: string
}
```

### businesses
```
{
  userId: string
  businessId: string
  businessName: string
  type: string
  status: "VERIFIED"
  isActive: boolean
  verifiedAt: number
  verifiedBy: string
  ... (all other fields from business_requests)
}
```

### users (updated fields)
```
{
  isBusiness: boolean
  businessId: string
  businessType: string
  businessStatus: "VERIFIED"
}
```

## Notes

- Documents upload is disabled (returns placeholder URLs)
- Firebase Storage 412 errors are bypassed
- Firestore rules remain permissive for development
- All validation happens on API routes
- Admin verification required for approval/rejection
