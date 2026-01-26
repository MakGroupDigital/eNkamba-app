# Wallet System - Quick Reference

## 🚀 Deploy Now

```bash
# Build functions
npm run build --prefix functions

# Deploy everything
firebase deploy

# Or deploy separately
firebase deploy --only functions
firebase deploy --only hosting
```

## 📍 Key URLs

- Wallet Page: `/dashboard/wallet`
- Add Funds: `/dashboard/add-funds`
- Dashboard: `/dashboard`

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `functions/src/walletTransactions.ts` | Cloud Functions |
| `functions/src/index.ts` | Function exports |
| `src/hooks/useWalletTransactions.ts` | React hook |
| `src/app/dashboard/wallet/page.tsx` | Wallet UI |
| `src/app/dashboard/add-funds/page.tsx` | Add funds flow |

## 💾 Firestore Collections

```
users/{userId}/
  ├── walletBalance: number
  ├── lastTransactionTime: timestamp
  ├── transactions/
  │   └── {transactionId}/
  │       ├── type: 'deposit' | 'withdrawal'
  │       ├── amount: number
  │       ├── status: 'completed' | 'pending'
  │       └── ...
  └── notifications/
      └── {notificationId}/
          ├── type: string
          ├── title: string
          ├── message: string
          └── ...
```

## 🎨 Brand Colors

- Primary Green: `#32BB78`
- Dark Green: `#2a9d63`
- Darker Green: `#1f7a4a`
- Accent Orange: `#FFA500`
- Red (Destructive): `red`

## 🔐 Security Rules

```
match /users/{userId}/transactions/{document=**} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId;
}

match /users/{userId}/notifications/{document=**} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId;
}
```

## 🧪 Test Locally

```bash
# Start emulators
firebase emulators:start

# In another terminal
npm run dev

# Visit http://localhost:3000
```

## 📊 Cloud Functions

### addFundsToWallet
```typescript
{
  userId: string
  amount: number
  paymentMethod: 'mobile_money' | 'credit_card' | 'debit_card'
  phoneNumber?: string
  cardDetails?: { cardNumber, expiryDate, cvv, cardholderName }
}
```

### withdrawFundsFromWallet
```typescript
{
  userId: string
  amount: number
  withdrawalMethod: 'mobile_money' | 'bank_account'
  phoneNumber?: string
  bankDetails?: { accountNumber, bankName }
}
```

### getWalletBalance
```typescript
{ userId: string }
// Returns: { success: true, balance: number, currency: 'CDF' }
```

### getTransactionHistory
```typescript
{ userId: string, limit?: number }
// Returns: { success: true, transactions: [], count: number }
```

## 🎯 Common Tasks

### Check Balance
```typescript
const { balance } = useWalletTransactions();
console.log(balance); // e.g., 4636250
```

### Add Funds
```typescript
const { addFunds } = useWalletTransactions();
await addFunds(10000, 'mobile_money', { phoneNumber: '+243812345678' });
```

### Withdraw Funds
```typescript
const { withdrawFunds } = useWalletTransactions();
await withdrawFunds(5000, 'mobile_money', { phoneNumber: '+243812345678' });
```

### Get Transactions
```typescript
const { transactions } = useWalletTransactions();
transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} CDF`);
});
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Balance not updating | Check Firestore rules, verify user auth |
| Transactions not appearing | Verify collection exists, check listener |
| Functions not deploying | Check Node version (20+), run `npm run build` |
| Card not flipping | Check browser console for errors |
| QR code not showing | Verify account number is set |

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Card maintains 1.585:1 aspect ratio on all sizes.

## 🔄 Real-time Updates

Hook automatically:
- Listens to balance changes
- Listens to new transactions
- Listens to notifications
- Cleans up listeners on unmount

## 📝 Logging

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('debug', 'enkamba:*');
```

## 🚨 Error Handling

All functions throw `HttpsError` with:
- `code`: Error code (unauthenticated, permission-denied, invalid-argument, etc.)
- `message`: User-friendly error message

Hook catches errors and stores in `error` state.

## 💡 Tips

1. Always check `isLoading` before showing UI
2. Always check `error` state for error messages
3. Use `toLocaleString('fr-FR')` for number formatting
4. All amounts in CDF
5. Timestamps are Firestore timestamps
6. Use `timestamp.toDate()` to convert to JS Date

## 🎬 Demo Flow

1. Login to app
2. Go to `/dashboard/wallet`
3. Click "Ajouter" button
4. Select "Mobile Money"
5. Enter amount: 10000
6. Enter phone: +243812345678
7. Confirm
8. See balance update
9. See transaction in history
10. Click card to flip

## 📞 Support Resources

- Deployment Guide: `.kiro/WALLET_TRANSACTIONS_DEPLOYMENT.md`
- Local Testing: `.kiro/WALLET_LOCAL_TESTING.md`
- Implementation Summary: `.kiro/WALLET_IMPLEMENTATION_SUMMARY.md`
- Firebase Docs: https://firebase.google.com/docs
- Cloud Functions: https://firebase.google.com/docs/functions

## ✅ Pre-Deployment Checklist

- [ ] Functions compile without errors
- [ ] Wallet page displays correctly
- [ ] Add funds flow works end-to-end
- [ ] Balance updates in real-time
- [ ] Transactions appear in history
- [ ] Card flip animation works
- [ ] QR code displays
- [ ] Responsive on mobile
- [ ] All brand colors correct
- [ ] No console errors
- [ ] Firestore rules updated
- [ ] Environment variables set

---

**Quick Deploy**: `firebase deploy`
**Quick Test**: `firebase emulators:start` + `npm run dev`
**Quick Check**: Visit `/dashboard/wallet`
