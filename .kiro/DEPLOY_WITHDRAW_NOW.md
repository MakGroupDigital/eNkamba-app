# Deploy Withdraw Feature - Step by Step

## Prerequisites
- Firebase CLI installed
- Logged in to Firebase: `firebase login`
- Functions built: `npm run build --prefix functions`

## Deployment Steps

### Step 1: Build Functions
```bash
npm run build --prefix functions
```

Expected output:
```
> build
> tsc

Exit Code: 0
```

### Step 2: Deploy Functions
```bash
firebase deploy --only functions
```

Expected output:
```
✔ functions[withdrawFundsFromWallet(us-central1)] Successful update operation.
✔ functions[addFundsToWallet(us-central1)] Successful update operation.
✔ functions[getWalletBalance(us-central1)] Successful update operation.
✔ functions[getTransactionHistory(us-central1)] Successful update operation.
✔ Deploy complete!
```

### Step 3: Verify Deployment
```bash
firebase functions:list | grep -E "withdraw|addFunds"
```

Expected output:
```
│ addFundsToWallet          │ v1 │ callable │ us-central1 │ 256 │ nodejs20 │
│ withdrawFundsFromWallet   │ v1 │ callable │ us-central1 │ 256 │ nodejs20 │
```

### Step 4: Deploy Web App (Optional)
```bash
npm run build
firebase deploy --only hosting
```

## Verification Checklist

After deployment, verify:

### ✅ Functions Deployed
```bash
firebase functions:list
```
Should show:
- addFundsToWallet
- withdrawFundsFromWallet
- getWalletBalance
- getTransactionHistory

### ✅ Firestore Rules Updated
Go to Firebase Console → Firestore → Rules

Should include:
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

### ✅ Test Withdraw Flow
1. Go to `/dashboard/wallet`
2. Click "Retirer"
3. Select "Mobile Money"
4. Choose provider
5. Enter amount
6. Enter phone
7. Confirm
8. Verify success message
9. Check balance updated
10. Verify transaction in Firestore

## Rollback (if needed)

If something goes wrong:

### Rollback Functions
```bash
firebase deploy --only functions --force
```

### Rollback Hosting
```bash
firebase deploy --only hosting --force
```

## Troubleshooting

### Issue: "Function not found"
**Solution:**
```bash
firebase deploy --only functions --force
```

### Issue: "Insufficient permissions"
**Solution:**
```bash
firebase login
firebase deploy --only functions
```

### Issue: "Build failed"
**Solution:**
```bash
npm run build --prefix functions
# Check for TypeScript errors
```

### Issue: "Firestore rules error"
**Solution:**
Go to Firebase Console → Firestore → Rules
Add the transaction and notification rules

## Post-Deployment Testing

### Test 1: Mobile Money Withdrawal
```
1. Navigate to /dashboard/wallet
2. Click "Retirer"
3. Select "Mobile Money"
4. Choose "Vodacom M-Pesa"
5. Amount: 10,000 CDF
6. Phone: +243812345678
7. Confirm
Expected: Balance decreases, transaction created
```

### Test 2: Agent Withdrawal
```
1. Navigate to /dashboard/wallet
2. Click "Retirer"
3. Select "Agent eNkamba"
4. Amount: 25,000 CDF
5. Agent Code: AGENT-001
6. Location: Kinshasa, Gombe
7. Confirm
Expected: Balance decreases, agent details saved
```

### Test 3: QR Code Scan
```
1. Navigate to /dashboard/wallet
2. Click "Retirer"
3. Select "Scanner QR"
4. Click "Simuler le scan QR"
5. Amount: 15,000 CDF
6. Confirm
Expected: Balance decreases, agent ID saved
```

## Monitoring

### Check Function Logs
```bash
firebase functions:log
```

### Check Firestore
Go to Firebase Console → Firestore → Collections
- Check `users/{userId}/transactions`
- Check `users/{userId}/notifications`

### Check Errors
Go to Firebase Console → Functions → Logs
Look for any error messages

## Performance Monitoring

### Expected Times
- Withdrawal processing: < 2 seconds
- Balance update: < 500ms
- Transaction creation: < 1 second

### Monitor in Firebase Console
- Functions → Metrics
- Firestore → Metrics
- Hosting → Analytics

## Security Verification

### Check Security Rules
```bash
firebase rules:test
```

### Verify User Isolation
- Users can only access their own data
- Users can only withdraw from own account
- Transactions are user-specific

## Completion Checklist

- [ ] Functions built successfully
- [ ] Functions deployed successfully
- [ ] Functions verified in Firebase Console
- [ ] Firestore rules updated
- [ ] Web app deployed (optional)
- [ ] Mobile Money withdrawal tested
- [ ] Agent withdrawal tested
- [ ] QR Code scan tested
- [ ] Balance updates verified
- [ ] Transactions appear in Firestore
- [ ] Notifications created
- [ ] Error scenarios tested
- [ ] Performance acceptable
- [ ] Security verified

## Next Steps

After successful deployment:

1. **Monitor in Production**
   - Watch Firebase Console logs
   - Monitor function performance
   - Track transaction success rate

2. **Gather User Feedback**
   - Test with real users
   - Collect feedback
   - Identify improvements

3. **Integrate Payment Gateway**
   - Choose provider (Flutterwave recommended)
   - Implement payment processing
   - Handle callbacks

4. **Add Notifications**
   - Firebase Cloud Messaging
   - SMS notifications
   - Email notifications

5. **Enhance Security**
   - OTP verification
   - Rate limiting
   - Fraud detection

## Support

For deployment issues:
1. Check Firebase Console logs
2. Verify functions are deployed
3. Check Firestore rules
4. Verify authentication
5. Check browser console

## Quick Commands

```bash
# Build
npm run build --prefix functions

# Deploy
firebase deploy --only functions

# Verify
firebase functions:list

# Logs
firebase functions:log

# Test
npm run dev
# Then navigate to /dashboard/wallet
```

---

**Ready to Deploy**: ✅ Yes
**Estimated Time**: 5-10 minutes
**Risk Level**: Low (non-breaking changes)
**Rollback Time**: < 5 minutes
