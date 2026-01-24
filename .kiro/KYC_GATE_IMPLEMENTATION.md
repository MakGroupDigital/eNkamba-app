# KYC Gate Implementation Guide

## Overview

After authentication, users are redirected directly to the chat module (`/dashboard/miyiki-chat`). The KYC verification is now optional and deferred - users can access certain modules without completing KYC, but will be prompted when accessing protected modules.

## Module Access Rules

### Free Modules (No KYC Required)
- **Miyiki-Chat** (`/dashboard/miyiki-chat`) - Messaging
- **eNkamba.ai** (`/dashboard/ai`) - AI Assistant

### Protected Modules (KYC Required)
All other modules require KYC completion:
- Mbongo (Wallet, Payments, Savings, Credit, etc.)
- Nkampa (E-commerce)
- Ugavi (Logistics)
- Makutano (Social Network)

## Implementation

### 1. Authentication Flow (Updated)

**File:** `src/app/login/page.tsx`

After successful phone verification:
```typescript
// Redirect directly to chat (no KYC required)
window.location.href = "/dashboard/miyiki-chat";
```

### 2. KYC Status Hook

**File:** `src/hooks/useKycStatus.ts`

Manages KYC completion state in localStorage:
```typescript
const { isKycCompleted, completeKyc, resetKyc } = useKycStatus();
```

**Methods:**
- `isKycCompleted` - Boolean indicating if KYC is done
- `completeKyc()` - Mark KYC as completed
- `resetKyc()` - Reset KYC status

### 3. KYC Gate Component

**File:** `src/components/kyc-gate.tsx`

Wraps module content to enforce KYC requirements:

```typescript
import { KycGate } from '@/components/kyc-gate';

export default function MyModule() {
  return (
    <KycGate moduleName="nkampa" moduleIcon={<ShoppingCart />}>
      {/* Your module content */}
    </KycGate>
  );
}
```

**Behavior:**
- If module is in `FREE_MODULES` list → Show content immediately
- If KYC is completed → Show content
- If KYC is not completed → Show modal prompting user to complete KYC
- Modal offers "Later" or "Start Now" options

### 4. KYC Completion

**File:** `src/app/kyc/page.tsx`

When user completes all KYC steps:
```typescript
// At the end of linkAccount step
completeKyc(); // Mark KYC as completed
localStorage.removeItem(KYC_STORAGE_KEY); // Clean up KYC progress
router.push('/dashboard'); // Redirect to dashboard
```

## Usage Example

### Protecting a Module

```typescript
'use client';

import { KycGate } from '@/components/kyc-gate';
import { ShoppingCart } from 'lucide-react';

export default function NkampaPage() {
  return (
    <KycGate moduleName="nkampa" moduleIcon={<ShoppingCart />}>
      <div>
        {/* Your e-commerce module content */}
      </div>
    </KycGate>
  );
}
```

### Checking KYC Status Programmatically

```typescript
'use client';

import { useKycStatus } from '@/hooks/useKycStatus';

export default function MyComponent() {
  const { isKycCompleted, isLoading } = useKycStatus();

  if (isLoading) return <div>Loading...</div>;

  if (!isKycCompleted) {
    return <div>Please complete KYC first</div>;
  }

  return <div>Protected content</div>;
}
```

## Data Flow

```
User Login
    ↓
Phone Verification (reCAPTCHA v2)
    ↓
Redirect to /dashboard/miyiki-chat (Chat - No KYC needed)
    ↓
User clicks on protected module (e.g., Nkampa)
    ↓
KycGate checks isKycCompleted
    ↓
If false → Show KYC modal
    ↓
User clicks "Start Now" → Redirect to /kyc
    ↓
Complete KYC steps
    ↓
completeKyc() called → localStorage updated
    ↓
Redirect to /dashboard
    ↓
User can now access protected modules

```

## localStorage Keys

- `enkamba_kyc_status` - KYC completion status
- `enkamba_kyc_progress` - KYC step progress (cleared on completion)
- `enkamba_mobile_money_progress` - Mobile Money linking progress
- `enkamba_bank_progress` - Bank account linking progress

## Important Notes

1. **Free Modules List:** Update `FREE_MODULES` in `src/components/kyc-gate.tsx` if you add new free modules
2. **Module Names:** Must match the route name (e.g., "nkampa" for `/dashboard/nkampa`)
3. **Persistence:** KYC status persists across browser sessions via localStorage
4. **No Backend:** Currently uses localStorage only - consider adding Firebase Firestore for production
5. **Testing:** Clear localStorage to reset KYC status during testing

## Future Enhancements

- [ ] Sync KYC status with Firebase Firestore
- [ ] Add KYC expiration (re-verify after X days)
- [ ] Add partial KYC (some modules require full KYC, others partial)
- [ ] Add KYC status in user profile
- [ ] Add KYC progress notifications
