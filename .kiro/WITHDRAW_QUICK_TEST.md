# Withdraw Feature - Quick Test Guide

## Prerequisites
- Logged in to eNkamba app
- Have balance in wallet (add funds first if needed)
- Functions deployed

## Quick Test Steps

### Test 1: Mobile Money Withdrawal

1. **Navigate to Wallet**
   - Go to `/dashboard/wallet`
   - Click "Retirer" button

2. **Select Method**
   - Click "Mobile Money"

3. **Select Provider**
   - Click "Vodacom M-Pesa"

4. **Enter Amount**
   - Amount: 10,000 CDF
   - See fee: 150 CDF (1.5%)
   - Total: 10,150 CDF
   - Click "Continuer"

5. **Enter Phone**
   - Phone: +243812345678
   - Click "Continuer"

6. **Confirm**
   - Review details
   - Click "Confirmer le retrait"
   - Should see success message
   - Redirected to wallet page

7. **Verify**
   - Balance should decrease by 10,150 CDF
   - Transaction should appear in history
   - Status should be "pending"

### Test 2: Agent Withdrawal

1. **Navigate to Wallet**
   - Go to `/dashboard/wallet`
   - Click "Retirer" button

2. **Select Method**
   - Click "Agent eNkamba"

3. **Enter Amount**
   - Amount: 25,000 CDF
   - Click "Continuer"

4. **Enter Agent Details**
   - Agent Code: AGENT-001
   - Location: Kinshasa, Gombe
   - Click "Continuer"

5. **Confirm**
   - Review details
   - Click "Confirmer le retrait"
   - Should see success message

6. **Verify**
   - Balance should decrease by 25,000 CDF
   - Transaction should show agent details
   - Status should be "pending"

### Test 3: QR Code Scan

1. **Navigate to Wallet**
   - Go to `/dashboard/wallet`
   - Click "Retirer" button

2. **Select Method**
   - Click "Scanner QR"

3. **Scan QR**
   - Click "Simuler le scan QR"
   - Agent details should appear
   - Click "Continuer"

4. **Enter Amount**
   - Amount: 15,000 CDF
   - Click "Continuer"

5. **Confirm**
   - Review details
   - Click "Confirmer le retrait"
   - Should see success message

6. **Verify**
   - Balance should decrease by 15,000 CDF
   - Transaction should show agent ID
   - Status should be "pending"

### Test 4: Error Scenarios

#### Test 4a: Insufficient Balance
1. Try to withdraw more than balance
2. Should show error: "Solde insuffisant"
3. Balance should not change

#### Test 4b: Invalid Amount
1. Try to withdraw 0 or negative
2. Should show error: "Le montant doit être supérieur à 0"

#### Test 4c: Provider Limits
1. Select "Orange Money" (max 3,000,000 CDF)
2. Try to withdraw 5,000,000 CDF
3. Should show error: "Montant maximum: 3,000,000 CDF"

#### Test 4d: Missing Phone
1. Select Mobile Money
2. Skip phone number
3. Try to confirm
4. Should show error: "Veuillez entrer un numéro de téléphone"

#### Test 4e: Missing Agent Details
1. Select Agent eNkamba
2. Skip agent code or location
3. Try to confirm
4. Should show error: "Veuillez entrer le code et la localisation de l'agent"

## Expected Results

### Success Indicators
✅ Balance updates immediately
✅ Transaction appears in history
✅ Notification created
✅ Status shows "pending"
✅ Toast shows success message
✅ Redirected to wallet page

### Error Indicators
❌ Error message displayed
❌ Balance not changed
❌ No transaction created
❌ Toast shows error message

## Firestore Verification

### Check Transaction Created
1. Go to Firebase Console
2. Navigate to Firestore
3. Go to `users/{userId}/transactions`
4. Should see new transaction with:
   - type: "withdrawal"
   - status: "pending"
   - withdrawalMethod: "mobile_money" or "agent"
   - amount: entered amount
   - description: method details

### Check Balance Updated
1. Go to Firebase Console
2. Navigate to Firestore
3. Go to `users/{userId}`
4. walletBalance should be decreased

### Check Notification Created
1. Go to Firebase Console
2. Navigate to Firestore
3. Go to `users/{userId}/notifications`
4. Should see new notification with:
   - type: "transaction"
   - title: "Retrait en cours"
   - message: withdrawal details

## Browser Console Checks

### Look for
- No red errors
- Successful function calls
- Real-time listener updates
- Balance state changes

### Debug Commands
```javascript
// Check current balance
console.log('Balance:', balance);

// Check transactions
console.log('Transactions:', transactions);

// Check notifications
console.log('Notifications:', notifications);
```

## Performance Checks

### Expected Times
- Withdrawal processing: < 2 seconds
- Balance update: < 500ms
- Transaction creation: < 1 second
- Notification creation: < 500ms

### Monitor
- Network tab for API calls
- Performance tab for render times
- Console for errors

## Mobile Testing

### On Mobile Device
1. Test on actual phone
2. Test on different screen sizes
3. Test touch interactions
4. Test on slow network

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Cleanup After Testing

### Reset Balance (if needed)
1. Go to Firebase Console
2. Edit user document
3. Set walletBalance to desired amount

### Delete Test Transactions
1. Go to Firebase Console
2. Delete transactions collection
3. Delete notifications collection

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Balance not updating | Refresh page, check Firestore rules |
| Transaction not appearing | Check Firestore, verify user ID |
| Error "Function not found" | Deploy functions: `firebase deploy --only functions` |
| QR scan not working | Use simulation button, implement real QR in production |
| Fee calculation wrong | Check provider fee percentage |

## Next Steps After Testing

1. ✅ Test all withdrawal methods
2. ✅ Test all error scenarios
3. ✅ Test on mobile device
4. ✅ Verify Firestore data
5. ✅ Check browser console
6. ✅ Monitor performance
7. ⏭️ Integrate payment gateway
8. ⏭️ Add real QR code scanning
9. ⏭️ Implement SMS notifications
10. ⏭️ Add OTP verification

## Support

For issues:
1. Check Firebase Console logs
2. Check browser console
3. Verify Firestore structure
4. Check authentication status
5. Review security rules

---

**Quick Deploy**: `firebase deploy --only functions`
**Quick Test**: Navigate to `/dashboard/wallet` → Click "Retirer"
**Quick Check**: Verify transaction in Firestore
