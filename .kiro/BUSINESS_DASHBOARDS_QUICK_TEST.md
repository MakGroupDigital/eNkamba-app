# Business Dashboards - Quick Test Guide

## 5-Minute Quick Test

### Step 1: Submit Business Request (2 min)
```
1. Go to http://localhost:9002/dashboard/settings/business-account
2. Fill form:
   - Business Name: "Test Commerce"
   - Type: "COMMERCE"
   - Sub-category: "RETAIL"
   - Registration: "TEST-001"
   - Address: "123 Main St"
   - City: "Kinshasa"
   - Country: "DRC"
   - Email: "test@example.com"
   - Phone: "+243123456789"
3. Click "Soumettre la demande"
4. Should see success message
```

### Step 2: Verify Status Card (1 min)
```
1. Refresh page
2. Should see BusinessStatusCard at top with:
   - 🔵 "EN COURS" badge
   - Blue background
   - Clock icon
   - "Votre dossier est en cours d'analyse..."
   - Business name: "Test Commerce"
```

### Step 3: Approve Request (1 min)
```
1. Go to Firebase Console
2. Firestore > business_requests collection
3. Find document with your business name
4. Edit document:
   - Change status: "PENDING" → "APPROVED"
5. Save changes
```

### Step 4: Test Dashboard (1 min)
```
1. Refresh http://localhost:9002/dashboard/settings/business-account
2. Should see:
   - 🟢 "APPROUVÉ" badge
   - Green background
   - "Félicitations, vous êtes désormais un partenaire certifié Enkamba."
   - "Accéder à mon Espace Pro" button
3. Click button
4. Should go to /dashboard/business-pro
5. Should see Commerce Dashboard with:
   - Blue gradient background
   - "Dashboard Commerce" subtitle
   - Navigation tabs
   - Overview stats
```

## Test All Three Dashboards

### Commerce Dashboard
```
URL: http://localhost:9002/dashboard/business-pro
Type: COMMERCE
Sub-category: RETAIL

Expected:
- Blue gradient background
- Tabs: Vue d'ensemble, Catalogue, Commandes, Marketing
- 4 stat cards in overview
- Empty states in other tabs
```

### Logistics Dashboard (Transport)
```
URL: http://localhost:9002/dashboard/business-pro
Type: LOGISTICS
Sub-category: TRANSPORT_COMPANY

Expected:
- Orange gradient background
- Tabs: Vue d'ensemble, Flotte, Colis
- 4 stat cards (Colis, Livraisons, Taux, Véhicules)
- Fleet management tab
```

### Logistics Dashboard (Relay)
```
URL: http://localhost:9002/dashboard/business-pro
Type: LOGISTICS
Sub-category: RELAY_AGENT

Expected:
- Orange gradient background
- Tabs: Vue d'ensemble, Colis, Scanner QR
- 4 stat cards (Colis, Livraisons, Taux, Stock)
- QR Scanner tab with button
```

### Payment Dashboard (Integrator)
```
URL: http://localhost:9002/dashboard/business-pro
Type: PAYMENT
Sub-category: API_INTEGRATION

Expected:
- Purple gradient background
- Tabs: Vue d'ensemble, Clés API, Transactions
- 4 stat cards (Volume, Transactions, Taux, Appels)
- API Keys tab with key display
```

### Payment Dashboard (Agent)
```
URL: http://localhost:9002/dashboard/business-pro
Type: PAYMENT
Sub-category: APPROVED_AGENT

Expected:
- Purple gradient background
- Tabs: Vue d'ensemble, Transactions, Solde
- 4 stat cards (Volume, Transactions, Taux, Commissions)
- Balance tab with cards and reports
```

## Real-Time Update Test

```
1. Open dashboard in two browser windows
2. In Firestore, change status to "REJECTED"
3. Add rejectionReason: "Documents incomplets"
4. In both windows, should see update automatically
5. Status card should change to red with rejection reason
```

## Rejection Flow Test

```
1. Create new business request
2. In Firestore, set status to "REJECTED"
3. Add rejectionReason: "Test rejection"
4. Go to settings page
5. Should see:
   - 🔴 "REJETÉ" badge
   - Red background
   - Rejection reason displayed
   - "Modifier et renvoyer" button
6. Click button
7. Form should show for editing
```

## Mobile Responsive Test

```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at 375px (mobile)
4. Test at 768px (tablet)
5. Test at 1920px (desktop)

Expected:
- All elements responsive
- No horizontal scroll
- Buttons clickable
- Text readable
- Icons display correctly
```

## Checklist

### Status Card
- [ ] PENDING displays (blue)
- [ ] APPROVED displays (green)
- [ ] REJECTED displays (red)
- [ ] Rejection reason shows
- [ ] Buttons work

### Commerce Dashboard
- [ ] Blue gradient background
- [ ] All tabs accessible
- [ ] Overview stats display
- [ ] Empty states show

### Logistics Dashboard
- [ ] Orange gradient background
- [ ] Transport variant correct
- [ ] Relay variant correct
- [ ] All tabs accessible

### Payment Dashboard
- [ ] Purple gradient background
- [ ] Integrator variant correct
- [ ] Agent variant correct
- [ ] All tabs accessible

### General
- [ ] No console errors
- [ ] Icons display
- [ ] Colors correct
- [ ] Responsive works
- [ ] Real-time updates work

## Troubleshooting

### Status Card Not Showing
```
1. Check Firestore: users collection
2. Verify isBusiness: true
3. Verify businessStatus field exists
4. Refresh page
```

### Dashboard Not Loading
```
1. Check URL: /dashboard/business-pro
2. Check Firestore: businessStatus = "APPROVED"
3. Check browser console for errors
4. Refresh page
```

### Icons Not Displaying
```
1. Check browser console
2. Verify SVG syntax
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)
```

### Real-Time Updates Not Working
```
1. Check Firestore listener
2. Verify Firestore rules
3. Check browser console
4. Refresh page
```

## Test Data Templates

### Commerce
```json
{
  "businessName": "Test Commerce",
  "type": "COMMERCE",
  "subCategory": "RETAIL",
  "registrationNumber": "COM-001",
  "address": "123 Main St",
  "city": "Kinshasa",
  "country": "DRC",
  "contactEmail": "commerce@test.com",
  "contactPhone": "+243123456789",
  "status": "APPROVED"
}
```

### Logistics Transport
```json
{
  "businessName": "Test Transport",
  "type": "LOGISTICS",
  "subCategory": "TRANSPORT_COMPANY",
  "registrationNumber": "LOG-001",
  "address": "456 Transport Ave",
  "city": "Kinshasa",
  "country": "DRC",
  "contactEmail": "transport@test.com",
  "contactPhone": "+243987654321",
  "status": "APPROVED"
}
```

### Logistics Relay
```json
{
  "businessName": "Test Relay",
  "type": "LOGISTICS",
  "subCategory": "RELAY_AGENT",
  "registrationNumber": "REL-001",
  "address": "789 Relay St",
  "city": "Kinshasa",
  "country": "DRC",
  "contactEmail": "relay@test.com",
  "contactPhone": "+243555555555",
  "status": "APPROVED"
}
```

### Payment Integrator
```json
{
  "businessName": "Test API",
  "type": "PAYMENT",
  "subCategory": "API_INTEGRATION",
  "registrationNumber": "PAY-001",
  "address": "321 API Blvd",
  "city": "Kinshasa",
  "country": "DRC",
  "contactEmail": "api@test.com",
  "contactPhone": "+243111111111",
  "apiCallbackUrl": "https://example.com/webhook",
  "status": "APPROVED"
}
```

### Payment Agent
```json
{
  "businessName": "Test Agent",
  "type": "PAYMENT",
  "subCategory": "APPROVED_AGENT",
  "registrationNumber": "AGT-001",
  "address": "654 Agent Rd",
  "city": "Kinshasa",
  "country": "DRC",
  "contactEmail": "agent@test.com",
  "contactPhone": "+243222222222",
  "status": "APPROVED"
}
```

## Success Indicators

✅ Status card displays correctly
✅ All dashboards load
✅ All tabs work
✅ Icons display
✅ Colors correct
✅ Responsive works
✅ Real-time updates work
✅ No console errors

## Time Estimates

- Quick test: 5 minutes
- Full test: 30 minutes
- All variants: 45 minutes
- Responsive test: 15 minutes

---

**Ready to test!** 🚀
