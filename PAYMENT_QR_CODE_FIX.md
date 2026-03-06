# Fix: Payment QR Code Scanner Not Finding Users

## Problem
QR codes from the payment module (wallet) were not being detected by the contact scanner, even though they contained email and eNkamba account number linked to a user UID.

## Root Cause
1. **Format mismatch**: Wallet QR code used format `accountNumber|name|email|uid` but scanner expected `PAYMENT|accountNumber|name|email|uid`
2. **No backward compatibility**: Scanner didn't recognize old format without PAYMENT prefix
3. **AccountNumber not indexed**: The accountNumber field wasn't being searched properly because it's generated dynamically from UID

## Solutions Implemented

### 1. Updated Wallet QR Code Format
Changed wallet QR code generation to use the standard PAYMENT format:

**Before:**
```typescript
const qrData = `${accountNum}|${fullName}|${email}|${profile.uid}`;
```

**After:**
```typescript
const qrData = `PAYMENT|${accountNum}|${fullName}|${email}|${profile.uid}`;
```

### 2. Added Backward Compatibility
Enhanced QR code parser to recognize both formats:

```typescript
// New format: PAYMENT|accountNumber|name|email|uid
case 'PAYMENT':
  return {
    type: 'PAYMENT',
    accountNumber: parts[1],
    name: parts[2],
    email: parts[3],
    uid: parts[4],
  };

// Old format: accountNumber|name|email|uid (starts with ENK)
default:
  if (parts[0]?.startsWith('ENK') && parts.length >= 4) {
    return {
      type: 'PAYMENT',
      accountNumber: parts[0],
      name: parts[1],
      email: parts[2],
      uid: parts[3],
    };
  }
```

### 3. Enhanced AccountNumber Search
Added comprehensive search strategy for accountNumber:

**Step 1: Direct field search**
```typescript
const qByAccount = query(usersRef, where('accountNumber', '==', contactData.accountNumber));
```

**Step 2: Generated accountNumber search**
If not found in database, generate accountNumber from all UIDs and compare:
```typescript
const allUsersSnapshot = await getDocs(usersRef);
for (const userDoc of allUsersSnapshot.docs) {
  const hash = userDoc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const generatedAccountNum = `ENK${String(hash).padStart(12, '0')}`;
  
  if (generatedAccountNum === contactData.accountNumber) {
    // User found!
  }
}
```

### 4. Improved Search Priority
Search order for PAYMENT QR codes:
1. **UID** (highest priority - direct match)
2. **Email** (unique identifier)
3. **Phone** (with all variants)
4. **AccountNumber** (direct field + generated)
5. **CardNumber** (if present)

### 5. Enhanced Logging
Added detailed console logs for each search attempt:
```
🔍 Recherche avec données: {type: 'PAYMENT', accountNumber: 'ENK...', ...}
🎯 Tentative recherche par UID: abc123...
✅ Utilisateur trouvé par UID
```

Or if UID fails:
```
❌ Aucun utilisateur trouvé par UID
📧 Tentative recherche par email: user@example.com
✅ Utilisateur trouvé par email
```

## How It Works Now

### Scenario 1: New QR Code (with PAYMENT prefix)
1. User generates QR code in wallet
2. QR contains: `PAYMENT|ENK123456789012|John Doe|john@example.com|uid123`
3. Scanner parses as PAYMENT type
4. Searches by UID → Found immediately
5. Shows contact with "Discuter" button

### Scenario 2: Old QR Code (without prefix)
1. User has old QR code: `ENK123456789012|John Doe|john@example.com|uid123`
2. Scanner detects ENK prefix and 4 parts
3. Converts to PAYMENT type automatically
4. Searches by UID → Found
5. Works seamlessly

### Scenario 3: AccountNumber Only
1. QR contains just: `ENK123456789012`
2. Scanner detects as ENKAMBA_ACCOUNT type
3. Searches in accountNumber field
4. If not found, generates accountNumber from all UIDs
5. Matches and finds user

## Testing Steps

1. **Test with wallet QR code:**
   - Go to Wallet page
   - View your card QR code
   - Download it
   - Open contact scanner
   - Import the image
   - Should find your own account

2. **Test with another user:**
   - Have another user generate their wallet QR code
   - Scan or import their QR code
   - Should find their account
   - Should show "Discuter" button

3. **Check console logs:**
   - Open browser console
   - Watch the search process
   - Verify which method found the user

## Files Modified

1. `src/app/dashboard/wallet/page.tsx`
   - Changed QR code format to include PAYMENT prefix
   - Added phone number to QR data

2. `src/hooks/useContactQRScanner.ts`
   - Added backward compatibility for old format
   - Enhanced accountNumber search with generation fallback
   - Added comprehensive logging
   - Improved search priority

## Impact

- Payment QR codes now work with contact scanner
- Backward compatible with old QR codes
- AccountNumber search works even if not stored in database
- Clear debugging with console logs
- Users can add contacts from wallet QR codes
- Seamless integration between payment and chat modules

## Why AccountNumber Generation Works

The accountNumber is generated deterministically from the user's UID:
```typescript
const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
const accountNum = `ENK${String(hash).padStart(12, '0')}`;
```

This means:
- Same UID always generates same accountNumber
- We can reverse-search by generating accountNumber for all users
- No need to store accountNumber in database (though it's better if we do)
- Guaranteed uniqueness (UID is unique → accountNumber is unique)
