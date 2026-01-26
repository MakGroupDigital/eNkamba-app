# Quick Commands Reference

## Build & Deploy

### Build Functions
```bash
npm run build --prefix functions
```

### Deploy Functions
```bash
firebase deploy --only functions
```

### Deploy Everything
```bash
firebase deploy
```

### Deploy with Force
```bash
firebase deploy --only functions --force
```

## Verification

### List Functions
```bash
firebase functions:list
```

### Check Specific Functions
```bash
firebase functions:list | grep -E "withdraw|addFunds"
```

### View Function Logs
```bash
firebase functions:log
```

## Local Development

### Start Dev Server
```bash
npm run dev
```

### Start Emulators
```bash
firebase emulators:start
```

### Start Emulators with Import
```bash
firebase emulators:start --import=./emulator-data
```

### Export Emulator Data
```bash
firebase emulators:export ./emulator-data
```

## Testing

### Test Withdraw Flow
1. Navigate to: `http://localhost:3000/dashboard/wallet`
2. Click "Retirer"
3. Select "Mobile Money"
4. Choose provider
5. Enter amount
6. Confirm

### Test Add Funds Flow
1. Navigate to: `http://localhost:3000/dashboard/wallet`
2. Click "Ajouter"
3. Select payment method
4. Enter amount
5. Confirm

### Test Wallet Display
1. Navigate to: `http://localhost:3000/dashboard/wallet`
2. View card
3. Click to flip
4. Check balance
5. View transactions

## Firestore

### View Transactions
```
Firebase Console → Firestore → Collections
→ users → {userId} → transactions
```

### View Notifications
```
Firebase Console → Firestore → Collections
→ users → {userId} → notifications
```

### View User Balance
```
Firebase Console → Firestore → Collections
→ users → {userId}
→ walletBalance field
```

## Debugging

### Check Browser Console
```javascript
// Open DevTools (F12)
// Look for errors
// Check network requests
```

### Check Function Logs
```bash
firebase functions:log
```

### Check Firestore Rules
```
Firebase Console → Firestore → Rules
```

### Check Authentication
```
Firebase Console → Authentication
```

## Common Issues

### Functions Not Deploying
```bash
npm run build --prefix functions
firebase deploy --only functions --force
```

### Balance Not Updating
1. Check Firestore rules
2. Verify user is authenticated
3. Check browser console for errors
4. Verify user document exists

### Transactions Not Appearing
1. Check Firestore collections
2. Verify user ID matches
3. Check real-time listener
4. Verify Firestore rules

### QR Code Not Showing
1. Check account number is set
2. Verify QR code library
3. Check browser console
4. Verify user profile loaded

## Performance

### Check Performance
```javascript
// In browser console
performance.measure('transaction-time')
```

### Monitor Network
1. Open DevTools
2. Go to Network tab
3. Perform transaction
4. Check request times

### Monitor Firestore
```
Firebase Console → Firestore → Metrics
```

## Cleanup

### Clear Emulator Data
```bash
rm -rf ~/.cache/firebase/emulators
```

### Reset Firestore
```
Firebase Console → Firestore → Delete Database
```

### Clear Browser Cache
```
DevTools → Application → Clear Storage
```

## Documentation

### View Deployment Guide
```bash
cat .kiro/WALLET_TRANSACTIONS_DEPLOYMENT.md
```

### View Testing Guide
```bash
cat .kiro/WALLET_LOCAL_TESTING.md
```

### View Withdraw Guide
```bash
cat .kiro/WITHDRAW_FEATURE_GUIDE.md
```

### View Quick Reference
```bash
cat .kiro/WALLET_QUICK_REFERENCE.md
```

## Git Commands

### Check Status
```bash
git status
```

### Add Changes
```bash
git add .
```

### Commit Changes
```bash
git commit -m "Add wallet features"
```

### Push Changes
```bash
git push origin main
```

### View Logs
```bash
git log --oneline
```

## Environment

### Check Node Version
```bash
node --version
```

### Check npm Version
```bash
npm --version
```

### Check Firebase CLI Version
```bash
firebase --version
```

### Update Firebase CLI
```bash
npm install -g firebase-tools@latest
```

## URLs

### Local Development
- App: `http://localhost:3000`
- Wallet: `http://localhost:3000/dashboard/wallet`
- Add Funds: `http://localhost:3000/dashboard/add-funds`
- Withdraw: `http://localhost:3000/dashboard/withdraw`

### Emulators
- Firestore: `http://localhost:4000`
- Functions: `http://localhost:5001`
- Auth: `http://localhost:9099`

### Firebase Console
- Project: `https://console.firebase.google.com`
- Functions: `https://console.firebase.google.com/project/{projectId}/functions`
- Firestore: `https://console.firebase.google.com/project/{projectId}/firestore`

## Useful Shortcuts

### Deploy & Test
```bash
npm run build --prefix functions && firebase deploy --only functions && npm run dev
```

### Check Everything
```bash
firebase functions:list && firebase functions:log
```

### Full Cleanup
```bash
rm -rf ~/.cache/firebase/emulators && npm run build --prefix functions
```

## Monitoring

### Real-time Logs
```bash
firebase functions:log --follow
```

### Specific Function Logs
```bash
firebase functions:log --function=addFundsToWallet
```

### Error Logs Only
```bash
firebase functions:log | grep -i error
```

## Troubleshooting Commands

### Verify Deployment
```bash
firebase functions:list | grep -E "addFunds|withdraw"
```

### Check Function Status
```bash
firebase functions:describe addFundsToWallet
```

### Test Function
```bash
firebase functions:shell
# Then: addFundsToWallet({userId: 'test', amount: 1000, paymentMethod: 'mobile_money', phoneNumber: '+243812345678'})
```

### View All Errors
```bash
firebase functions:log | grep -i "error\|exception"
```

## Quick Fixes

### Fix TypeScript Errors
```bash
npm run build --prefix functions
```

### Fix Deployment Issues
```bash
firebase deploy --only functions --force
```

### Fix Firestore Issues
```
Firebase Console → Firestore → Rules → Publish
```

### Fix Authentication Issues
```
Firebase Console → Authentication → Enable Email/Password
```

## Performance Optimization

### Check Bundle Size
```bash
npm run build
```

### Analyze Performance
```
Firebase Console → Functions → Metrics
```

### Monitor Costs
```
Firebase Console → Billing
```

## Backup & Recovery

### Export Firestore
```bash
firebase firestore:export ./backup
```

### Import Firestore
```bash
firebase firestore:import ./backup
```

### Export Emulator Data
```bash
firebase emulators:export ./emulator-backup
```

## Advanced

### Run Tests
```bash
npm test
```

### Run Linter
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

### Type Check
```bash
npm run type-check
```

---

## Cheat Sheet

| Task | Command |
|------|---------|
| Build | `npm run build --prefix functions` |
| Deploy | `firebase deploy --only functions` |
| Test | `npm run dev` |
| Logs | `firebase functions:log` |
| List | `firebase functions:list` |
| Emulate | `firebase emulators:start` |
| Check | `firebase functions:list \| grep withdraw` |
| Fix | `firebase deploy --only functions --force` |

---

**Last Updated**: January 26, 2026
**Version**: 1.0.0
