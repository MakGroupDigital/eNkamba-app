# Business Account System - Visual Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Form                          Admin Dashboard            │
│  ┌──────────────────────┐          ┌──────────────────────┐   │
│  │ Business Account     │          │ Business Requests    │   │
│  │ /dashboard/settings/ │          │ /admin/business-     │   │
│  │ business-account     │          │ requests             │   │
│  │                      │          │                      │   │
│  │ • Business Name      │          │ • Pending Requests   │   │
│  │ • Type (dropdown)    │          │ • Approve Button     │   │
│  │ • Sub-category       │          │ • Reject Button      │   │
│  │ • Registration #     │          │ • Status Updates     │   │
│  │ • Address            │          │                      │   │
│  │ • City               │          │                      │   │
│  │ • Country            │          │                      │   │
│  │ • Contact Email      │          │                      │   │
│  │ • Contact Phone      │          │                      │   │
│  │ • Documents (disabled)          │                      │   │
│  │ • Submit Button      │          │                      │   │
│  └──────────────────────┘          └──────────────────────┘   │
│           │                                  │                 │
└───────────┼──────────────────────────────────┼─────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REACT HOOKS LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  useBusinessAccount Hook                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Manages form state                                     │  │
│  │ • Validates form data                                    │  │
│  │ • Handles document uploads (placeholder URLs)            │  │
│  │ • Calls API routes                                       │  │
│  │ • Manages loading/error states                           │  │
│  │ • Passes userId to API                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/business/submit-request                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Receive form data + userId                            │  │
│  │ 2. Validate all required fields                          │  │
│  │ 3. Validate business type                                │  │
│  │ 4. Initialize Firebase Admin SDK                         │  │
│  │ 5. Write to Firestore business_requests collection       │  │
│  │ 6. Return success with document ID                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│  POST /api/business/approve-request                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Verify admin permissions                              │  │
│  │ 2. Get business request from Firestore                   │  │
│  │ 3. Create business profile                               │  │
│  │ 4. Write to businesses collection                        │  │
│  │ 5. Update business_requests status to VERIFIED           │  │
│  │ 6. Update user profile (isBusiness: true)                │  │
│  │ 7. Return success                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│  POST /api/business/reject-request                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Verify admin permissions                              │  │
│  │ 2. Get business request from Firestore                   │  │
│  │ 3. Update status to REJECTED                             │  │
│  │ 4. Store rejection reason                                │  │
│  │ 5. Return success                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FIREBASE ADMIN SDK                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Credentials from .env.local:                                   │
│  • FIREBASE_PROJECT_ID                                          │
│  • FIREBASE_CLIENT_EMAIL                                        │
│  • FIREBASE_PRIVATE_KEY                                         │
│                                                                 │
│  Initializes once per request, reuses if already initialized    │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIRESTORE DATABASE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  business_requests Collection                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Document ID: {userId}_{timestamp}                        │  │
│  │ ├── userId: string                                       │  │
│  │ ├── businessName: string                                 │  │
│  │ ├── type: "COMMERCE" | "LOGISTICS" | "PAYMENT"           │  │
│  │ ├── subCategory: string                                  │  │
│  │ ├── registrationNumber: string                           │  │
│  │ ├── address: string                                      │  │
│  │ ├── city: string                                         │  │
│  │ ├── country: string                                      │  │
│  │ ├── contactEmail: string                                 │  │
│  │ ├── contactPhone: string                                 │  │
│  │ ├── apiCallbackUrl: string | null                        │  │
│  │ ├── documents: Record<string, string>                    │  │
│  │ ├── status: "PENDING" | "VERIFIED" | "REJECTED"          │  │
│  │ ├── submittedAt: number                                  │  │
│  │ ├── updatedAt: number                                    │  │
│  │ ├── verifiedAt?: number                                  │  │
│  │ ├── verifiedBy?: string                                  │  │
│  │ └── rejectionReason?: string                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  businesses Collection (created on approval)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Document ID: {userId}_{timestamp}                        │  │
│  │ ├── businessId: string                                   │  │
│  │ ├── status: "VERIFIED"                                   │  │
│  │ ├── isActive: boolean                                    │  │
│  │ ├── verifiedAt: number                                   │  │
│  │ ├── verifiedBy: string                                   │  │
│  │ └── ... (all fields from business_requests)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  users Collection (updated on approval)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Document ID: {userId}                                    │  │
│  │ ├── isBusiness: true                                     │  │
│  │ ├── businessId: string                                   │  │
│  │ ├── businessType: string                                 │  │
│  │ ├── businessStatus: "VERIFIED"                           │  │
│  │ └── ... (other user fields)                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Submit Request Flow
```
┌─────────────┐
│ User Form   │
└──────┬──────┘
       │ Fill form + Submit
       ▼
┌──────────────────────┐
│ useBusinessAccount   │
│ Hook                 │
└──────┬───────────────┘
       │ Validate + Pass userId
       ▼
┌──────────────────────────────────┐
│ POST /api/business/submit-request │
└──────┬───────────────────────────┘
       │ Validate + Initialize Firebase
       ▼
┌──────────────────────────────────┐
│ Firestore Write                  │
│ business_requests collection     │
└──────┬───────────────────────────┘
       │ Success
       ▼
┌──────────────────────┐
│ Return Success       │
│ Show Message         │
└──────────────────────┘
```

### Approve Request Flow
```
┌──────────────────────┐
│ Admin Dashboard      │
│ Click Approve        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ POST /api/business/approve-request│
└──────┬───────────────────────────┘
       │ Verify Admin Permissions
       ▼
┌──────────────────────────────────┐
│ Get Request from Firestore       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Create Business Profile          │
└──────┬───────────────────────────┘
       │
       ├─► Write to businesses collection
       │
       ├─► Update business_requests status
       │
       └─► Update user profile (isBusiness: true)
       │
       ▼
┌──────────────────────┐
│ Return Success       │
│ Show Message         │
└──────────────────────┘
```

### Reject Request Flow
```
┌──────────────────────┐
│ Admin Dashboard      │
│ Click Reject         │
└──────┬───────────────┘
       │ Enter Reason
       ▼
┌──────────────────────────────────┐
│ POST /api/business/reject-request │
└──────┬───────────────────────────┘
       │ Verify Admin Permissions
       ▼
┌──────────────────────────────────┐
│ Update business_requests         │
│ status: REJECTED                 │
│ rejectionReason: provided reason │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Return Success       │
│ Show Message         │
└──────────────────────┘
```

## State Management

### Form State (useBusinessAccount)
```
businessRequest: BusinessRequestData | null
isLoading: boolean
error: string | null
isSubmitting: boolean
```

### Firestore State
```
business_requests: {
  [requestId]: {
    status: "PENDING" | "VERIFIED" | "REJECTED"
    ... other fields
  }
}

businesses: {
  [requestId]: {
    status: "VERIFIED"
    ... all business data
  }
}

users: {
  [userId]: {
    isBusiness: boolean
    businessId: string
    businessStatus: string
  }
}
```

## Error Handling

```
┌─────────────────────────────────────┐
│ API Request                         │
└──────┬──────────────────────────────┘
       │
       ├─► Validation Error (400)
       │   └─► Return error message
       │
       ├─► Authentication Error (401)
       │   └─► Return "User not authenticated"
       │
       ├─► Permission Error (403)
       │   └─► Return "No permissions"
       │
       ├─► Not Found Error (404)
       │   └─► Return "Request not found"
       │
       └─► Server Error (500)
           └─► Log error + Return error message
```

## Environment Variables

```
.env.local
├── FIREBASE_PROJECT_ID
├── FIREBASE_CLIENT_EMAIL
└── FIREBASE_PRIVATE_KEY
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── business/
│   │       ├── submit-request/
│   │       │   └── route.ts ✅ FIXED
│   │       ├── approve-request/
│   │       │   └── route.ts ✅ FIXED
│   │       └── reject-request/
│   │           └── route.ts ✅ FIXED
│   ├── admin/
│   │   └── business-requests/
│   │       └── page.tsx
│   └── dashboard/
│       └── settings/
│           └── business-account/
│               └── page.tsx
├── hooks/
│   └── useBusinessAccount.ts ✅ FIXED
└── types/
    └── business-account.types.ts
```

## Summary

The system is a complete business account management solution with:
- ✅ User form for submitting requests
- ✅ Admin dashboard for approving/rejecting
- ✅ Firestore persistence
- ✅ Firebase Admin SDK integration
- ✅ Proper error handling
- ✅ Real-time status updates

All components are connected and ready to test!
