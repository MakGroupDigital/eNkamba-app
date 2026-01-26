# Wallet Transactions - Local Testing Guide

## Prerequisites
- Node.js 20+
- Firebase CLI installed
- Firebase project configured
- Emulator Suite (optional but recommended)

## Local Development Setup

### 1. Start Firebase Emulators (Recommended)
```bash
firebase emulators:start
```

This starts:
- Firestore Emulator (port 8080)
- Functions Emulator (port 5001)
- Auth Emulator (port 9099)

### 2. Start Next.js Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Test the Wallet Flow

#### Step 1: Login
1. Go to `http://localhost:3000/login`
2. Use email authentication to create/login account
3. Complete KYC if required

#### Step 2: Navigate to Wallet
1. Go to Dashboard
2. Click on "Mon Portefeuille" or navigate to `/dashboard/wallet`

#### Step 3: Test Add Funds
1. Click "Ajouter" button
2. Select "Mobile Money"
3. Enter amount: `10000` CDF
4. Enter phone: `+243812345678`
5. Confirm transaction

**Expected Result:**
- Transaction appears in history
- Balance updates in real-time
- Notification appears
- Toast shows success message

#### Step 4: Test Card Flip
1. Click on the card to flip it
2. See CVV, expiry date, and security info
3. Click again to flip back

#### Step 5: Test Balance Visibility
1. Click eye icon on card
2. Balance should hide/show

### Testing with Emulator

#### View Firestore Data
1. Open Firebase Emulator UI: `http://localhost:4000`
2. Go to Firestore tab
3. Navigate to `users/{userId}/transactions`
4. Verify transaction was created

#### View Function Logs
1. In Emulator UI, go to Functions tab
2. See logs from function executions
3. Check for errors

#### Test Function Directly
```bash
firebase functions:shell
```

Then:
```javascript
// Get balance
getWalletBalance({userId: 'test-user-id'})

// Add funds
addFundsToWallet({
  userId: 'test-user-id',
  amount: 50000,
  paymentMethod: 'mobile_money',
  phoneNumber: '+243812345678'
})

// Get transaction history
getTransactionHistory({userId: 'test-user-id', limit: 10})
```

## Testing Scenarios

### Scenario 1: Successful Deposit
1. Add funds with valid amount
2. Verify balance increases
3. Verify transaction appears in history
4. Verify notification created

### Scenario 2: Insufficient Balance for Withdrawal
1. Try to withdraw more than balance
2. Should show error: "Solde insuffisant"
3. Balance should not change

### Scenario 3: Invalid Amount
1. Try to add 0 or negative amount
2. Should show error: "Le montant doit être supérieur à 0"

### Scenario 4: Missing Phone Number
1. Select Mobile Money
2. Try to proceed without phone
3. Should show error: "Veuillez entrer un numéro de téléphone"

### Scenario 5: Missing Card Details
1. Select Credit Card
2. Try to proceed without card details
3. Should show error: "Veuillez remplir tous les détails de la carte"

## Debugging

### Check Real-time Listeners
Open browser DevTools Console and look for:
```
Listening to transactions...
Listening to notifications...
```

### Check Balance Updates
1. Add funds
2. Open DevTools Network tab
3. Look for Firestore calls
4. Verify balance field updates

### Check Errors
1. Open DevTools Console
2. Look for red error messages
3. Check Firebase function logs

### Common Issues

**Issue: Balance not updating**
- Solution: Check Firestore rules allow read/write
- Solution: Verify user is authenticated
- Solution: Check browser console for errors

**Issue: Transactions not appearing**
- Solution: Verify transactions collection exists
- Solution: Check real-time listener is active
- Solution: Verify user ID matches

**Issue: Functions not working**
- Solution: Check emulator is running
- Solution: Check function logs in emulator UI
- Solution: Verify function code has no syntax errors

## Performance Testing

### Load Test Multiple Transactions
```javascript
// In browser console
for (let i = 0; i < 10; i++) {
  addFundsToWallet({
    userId: 'test-user-id',
    amount: 1000 * (i + 1),
    paymentMethod: 'mobile_money',
    phoneNumber: '+243812345678'
  })
}
```

Monitor:
- Firestore write operations
- Function execution time
- UI responsiveness

## Cleanup

### Clear Emulator Data
```bash
firebase emulators:start --import=./emulator-data
```

Or delete emulator data:
```bash
rm -rf ~/.cache/firebase/emulators
```

### Reset Firestore
1. Go to Emulator UI
2. Click "Clear all data"

## Production Deployment Checklist

Before deploying to production:

- [ ] Test all payment methods
- [ ] Test all withdrawal methods
- [ ] Test error scenarios
- [ ] Test with real Firebase project
- [ ] Verify Firestore rules are correct
- [ ] Test on mobile device
- [ ] Test on different browsers
- [ ] Verify notifications work
- [ ] Check performance metrics
- [ ] Review security rules
- [ ] Set up monitoring/logging
- [ ] Create backup strategy

## Useful Commands

```bash
# Build functions
npm run build --prefix functions

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# View function logs
firebase functions:log

# Start emulators
firebase emulators:start

# Start emulators with import
firebase emulators:start --import=./emulator-data

# Export emulator data
firebase emulators:export ./emulator-data

# Run tests
npm test

# Build for production
npm run build
```

## Next Steps

1. Integrate payment gateway (Flutterwave)
2. Add SMS notifications
3. Add push notifications
4. Implement OTP verification
5. Add fraud detection
6. Set up monitoring
7. Create admin dashboard
