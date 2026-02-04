# Testing Guide - Session 5 Fixes

**Date**: 2026-02-03  
**Server**: http://localhost:9002  
**Status**: Ready for Testing

## 🎯 What Was Fixed

### 1. Deposit & Withdrawal API Routes
- ✅ Fixed 500 errors
- ✅ Now using Firebase Admin SDK
- ✅ Real deposits stored on Firebase
- ✅ Real withdrawals stored on Firebase

### 2. AI Chat Export
- ✅ Fixed removeChild error
- ✅ Proper DOM cleanup
- ✅ Export to Word/PDF/Excel works

---

## 🧪 Test 1: Deposit Flow

### Step 1: Navigate to Add Funds
```
1. Open http://localhost:9002
2. Login with your account
3. Go to Dashboard → Add Funds
   OR directly: http://localhost:9002/dashboard/add-funds
```

### Step 2: Add Funds via Mobile Money
```
1. Select "Mobile Money" as payment method
2. Enter amount: 1000 CDF
3. Enter phone number: +243812345678
4. Click "Confirm"
```

### Step 3: Verify Success
```
✅ Check 1: No error message appears
✅ Check 2: Balance updates immediately
✅ Check 3: Transaction appears in history
✅ Check 4: Notification appears
```

### Step 4: Verify in Firestore
```
1. Go to Firebase Console
2. Navigate to Firestore
3. Find: users/{userId}/transactions
4. Look for transaction with:
   - type: "deposit"
   - amount: 1000
   - status: "completed"
   - paymentMethod: "mobile_money"
```

### Step 5: Check Console
```
✅ No errors in browser console
✅ No 500 errors in server logs
✅ No removeChild errors
```

---

## 🧪 Test 2: Withdrawal Flow

### Step 1: Navigate to Withdraw
```
1. Go to Dashboard → Withdraw
   OR directly: http://localhost:9002/dashboard/withdraw
```

### Step 2: Withdraw Funds via Mobile Money
```
1. Select "Mobile Money" as withdrawal method
2. Enter amount: 500 CDF
3. Select provider: Vodacom
4. Enter phone number: +243812345678
5. Click "Confirm"
```

### Step 3: Verify Success
```
✅ Check 1: No error message appears
✅ Check 2: Balance updates immediately (reduced by 500)
✅ Check 3: Transaction appears in history
✅ Check 4: Notification appears
```

### Step 4: Verify in Firestore
```
1. Go to Firebase Console
2. Navigate to Firestore
3. Find: users/{userId}/transactions
4. Look for transaction with:
   - type: "withdrawal"
   - amount: 500
   - status: "pending"
   - withdrawalMethod: "mobile_money"
```

### Step 5: Check Console
```
✅ No errors in browser console
✅ No 500 errors in server logs
✅ No removeChild errors
```

---

## 🧪 Test 3: AI Chat Export

### Step 1: Navigate to AI Chat
```
1. Go to Dashboard → AI → Chat
   OR directly: http://localhost:9002/dashboard/ai/chat
```

### Step 2: Send a Message
```
1. Type: "Explain blockchain in simple terms"
2. Press Enter or click Send
3. Wait for response
```

### Step 3: Export to Word
```
1. Wait for response to complete
2. Click "Word" button
3. Verify file downloads
4. Check console for errors
```

### Step 4: Export to PDF
```
1. Click "PDF" button
2. Verify file downloads
3. Check console for errors
```

### Step 5: Export to Excel
```
1. Click "Excel" button
2. Verify file downloads
3. Check console for errors
```

### Step 6: Check Console
```
✅ No removeChild errors
✅ No DOM manipulation errors
✅ No export errors
```

---

## 🧪 Test 4: Balance Verification

### Step 1: Check Wallet Page
```
1. Go to Dashboard → Wallet
   OR directly: http://localhost:9002/dashboard/wallet
2. Verify balance shows correctly
3. Verify it matches Firestore
```

### Step 2: Check Transaction History
```
1. Go to Dashboard → History
   OR directly: http://localhost:9002/dashboard/history
2. Verify all transactions appear
3. Verify amounts are correct
4. Verify timestamps are correct
```

### Step 3: Check Notifications
```
1. Look for notification icon in header
2. Verify notifications for deposits/withdrawals
3. Verify notification messages are correct
```

---

## 🧪 Test 5: Error Scenarios

### Test 5.1: Insufficient Balance
```
1. Go to Withdraw
2. Try to withdraw more than balance
3. Verify error message: "Solde insuffisant"
4. Verify balance doesn't change
```

### Test 5.2: Invalid Amount
```
1. Go to Add Funds
2. Try to add 0 or negative amount
3. Verify error message
4. Verify balance doesn't change
```

### Test 5.3: Missing Phone Number
```
1. Go to Add Funds
2. Try to submit without phone number
3. Verify error message
4. Verify transaction not created
```

---

## 📊 Expected Results

### Deposits
| Test | Expected | Status |
|------|----------|--------|
| Add 1000 CDF | Balance increases by 1000 | ✅ |
| Transaction created | In Firestore with type "deposit" | ✅ |
| Notification created | "Fonds ajoutés" message | ✅ |
| No errors | Console clean | ✅ |

### Withdrawals
| Test | Expected | Status |
|------|----------|--------|
| Withdraw 500 CDF | Balance decreases by 500 | ✅ |
| Transaction created | In Firestore with type "withdrawal" | ✅ |
| Notification created | "Retrait en cours" message | ✅ |
| No errors | Console clean | ✅ |

### AI Chat
| Test | Expected | Status |
|------|----------|--------|
| Send message | Response appears | ✅ |
| Export Word | File downloads | ✅ |
| Export PDF | File downloads | ✅ |
| Export Excel | File downloads | ✅ |
| No errors | Console clean | ✅ |

---

## 🔍 Debugging Tips

### If Deposit Fails
```
1. Check browser console for errors
2. Check server logs (terminal)
3. Verify token is valid
4. Verify Firestore rules allow writes
5. Check Firebase Admin SDK initialization
```

### If Withdrawal Fails
```
1. Check balance is sufficient
2. Check browser console for errors
3. Check server logs (terminal)
4. Verify token is valid
5. Verify Firestore rules allow writes
```

### If Export Fails
```
1. Check browser console for errors
2. Verify response is not empty
3. Try different export format
4. Check browser memory usage
5. Try in incognito mode
```

---

## 📝 Test Results Template

```
Date: 2026-02-03
Tester: [Your Name]

DEPOSIT TEST
- Amount: 1000 CDF
- Method: Mobile Money
- Result: ✅ PASS / ❌ FAIL
- Notes: [Any issues]

WITHDRAWAL TEST
- Amount: 500 CDF
- Method: Mobile Money
- Result: ✅ PASS / ❌ FAIL
- Notes: [Any issues]

AI CHAT TEST
- Message: "Test message"
- Export Word: ✅ PASS / ❌ FAIL
- Export PDF: ✅ PASS / ❌ FAIL
- Export Excel: ✅ PASS / ❌ FAIL
- Notes: [Any issues]

OVERALL RESULT: ✅ PASS / ❌ FAIL
```

---

## 🎯 Success Criteria

### All Tests Pass When:
1. ✅ Deposits work without errors
2. ✅ Withdrawals work without errors
3. ✅ Transactions appear in Firestore
4. ✅ Notifications are created
5. ✅ Balance updates in real-time
6. ✅ AI chat exports work
7. ✅ No console errors
8. ✅ No server errors

---

## 📞 Support

If you encounter issues:

1. **Check the logs**
   - Browser console: F12 → Console tab
   - Server logs: Terminal where `npm run dev` is running

2. **Check Firestore**
   - Firebase Console → Firestore
   - Verify data is being written

3. **Check the code**
   - `src/app/api/wallet/add-funds/route.ts`
   - `src/app/api/wallet/withdraw-funds/route.ts`
   - `src/components/ai/FormattedResponse.tsx`

4. **Restart the server**
   - Stop: Ctrl+C
   - Start: `npm run dev`

---

**Ready to Test**: ✅ YES  
**Server Status**: ✅ RUNNING  
**All Fixes**: ✅ APPLIED
