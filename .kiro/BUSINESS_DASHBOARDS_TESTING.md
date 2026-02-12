# Business Dashboards - Testing Guide

## Testing Workflow

### Phase 1: Status Card Testing

#### 1.1 Submit Business Request
1. Go to http://localhost:9002/dashboard/settings/business-account
2. Fill out the form:
   - Business Name: "Test Commerce"
   - Type: "COMMERCE"
   - Sub-category: "Retail"
   - Other fields: fill with test data
3. Click "Soumettre la demande"
4. Should see success message

#### 1.2 Verify Status Card
1. Refresh the page
2. Should see **BusinessStatusCard** at top with:
   - 🔵 Status badge "EN COURS"
   - Blue card background
   - Clock icon
   - Message: "Votre dossier est en cours d'analyse par nos administrateurs."
   - Business name displayed
   - Fields are non-editable

#### 1.3 Test Rejection Flow
1. Go to Firestore Console
2. Find the business_requests document
3. Manually update status to "REJECTED"
4. Add rejectionReason: "Documents incomplets"
5. Refresh the page
6. Should see:
   - 🔴 Status badge "REJETÉ"
   - Red card background
   - X icon
   - Rejection reason displayed
   - "Modifier et renvoyer" button

#### 1.4 Test Approval Flow
1. Go to Firestore Console
2. Update status to "APPROVED"
3. Refresh the page
4. Should see:
   - 🟢 Status badge "APPROUVÉ"
   - Green card background
   - Check icon
   - Success message
   - "Accéder à mon Espace Pro" button

### Phase 2: Dashboard Access

#### 2.1 Commerce Dashboard
1. Click "Accéder à mon Espace Pro" button
2. Should redirect to `/dashboard/business-pro`
3. Should see:
   - Header with business name
   - "Dashboard Commerce" subtitle
   - Green "Compte Actif" badge
   - Navigation tabs: Vue d'ensemble, Catalogue, Commandes, Marketing

#### 2.2 Commerce Overview Tab
1. Should display 4 stat cards:
   - Chiffre d'affaires (blue)
   - Commandes en attente (yellow)
   - Produits (green)
   - Ruptures de stock (red)
2. Each card should have:
   - Icon
   - Label
   - Value (0 for now)
   - Proper colors

#### 2.3 Commerce Products Tab
1. Click "Catalogue" tab
2. Should see:
   - "+ Ajouter un produit" button
   - Empty state with icon
   - Message: "Aucun produit pour le moment"

#### 2.4 Commerce Orders Tab
1. Click "Commandes" tab
2. Should see:
   - Empty state with shopping cart icon
   - Message: "Aucune commande pour le moment"

#### 2.5 Commerce Marketing Tab
1. Click "Marketing" tab
2. Should see:
   - "+ Créer une promo" button
   - Empty state with trending icon
   - Message: "Aucune promotion pour le moment"

### Phase 3: Logistics Dashboard

#### 3.1 Test Transport Company
1. Create business request with:
   - Type: "LOGISTICS"
   - Sub-category: "TRANSPORT_COMPANY"
2. Approve in Firestore
3. Go to `/dashboard/business-pro`
4. Should see:
   - "Dashboard Logistique - Entreprise de Transport"
   - Tabs: Vue d'ensemble, Flotte, Colis, (no Scanner QR)

#### 3.2 Test Relay Agent
1. Create business request with:
   - Type: "LOGISTICS"
   - Sub-category: "RELAY_AGENT"
2. Approve in Firestore
3. Go to `/dashboard/business-pro`
4. Should see:
   - "Dashboard Logistique - Agent Relais"
   - Tabs: Vue d'ensemble, Colis, Scanner QR (no Flotte)

#### 3.3 Logistics Overview
1. Should display 4 stat cards:
   - Colis en transit (orange)
   - Livraisons du jour (blue)
   - Taux de succès (green)
   - Colis en stock (yellow) for relay, Véhicules actifs (purple) for transport

#### 3.4 Fleet Tab (Transport Only)
1. Click "Flotte" tab
2. Should see:
   - "+ Ajouter un véhicule" button
   - Empty state with truck icon

#### 3.5 Shipments Tab
1. Click "Colis" tab
2. Should see:
   - Empty state with map pin icon
   - Correct title based on type

#### 3.6 QR Scanner Tab (Relay Only)
1. Click "Scanner QR" tab
2. Should see:
   - QR code icon in gray box
   - "Ouvrir le Scanner" button
   - Message: "Scannez les codes QR des colis"

### Phase 4: Payment Dashboard

#### 4.1 Test API Integrator
1. Create business request with:
   - Type: "PAYMENT"
   - Sub-category: "API_INTEGRATION"
2. Approve in Firestore
3. Go to `/dashboard/business-pro`
4. Should see:
   - "Dashboard Paiement - Intégrateur API"
   - Tabs: Vue d'ensemble, Clés API, Transactions (no Solde)

#### 4.2 Test Accredited Agent
1. Create business request with:
   - Type: "PAYMENT"
   - Sub-category: "APPROVED_AGENT"
2. Approve in Firestore
3. Go to `/dashboard/business-pro`
4. Should see:
   - "Dashboard Paiement - Agent Agréé"
   - Tabs: Vue d'ensemble, Transactions, Solde (no Clés API)

#### 4.3 Payment Overview
1. Should display 4 stat cards:
   - Volume du jour (purple)
   - Transactions (blue)
   - Taux de succès (green)
   - Appels API (pink) for integrator, Commissions (yellow) for agent

#### 4.4 API Keys Tab (Integrator Only)
1. Click "Clés API" tab
2. Should see:
   - "+ Générer une clé" button
   - Public Key field with copy button
   - Secret Key field with copy button
   - Security warning

#### 4.5 Transactions Tab
1. Click "Transactions" tab
2. Should see:
   - Empty state with bar chart icon
   - Message: "Aucune transaction pour le moment"

#### 4.6 Balance Tab (Agent Only)
1. Click "Solde" tab
2. Should see:
   - Two gradient cards: Solde Total, Commissions Gagnées
   - Transactions Récentes section (empty)
   - Relevé du Jour section with:
     - Dépôts
     - Retraits
     - Net du jour (highlighted)

### Phase 5: Design & UX Testing

#### 5.1 Colors
- [ ] Commerce: Blue gradient background
- [ ] Logistics: Orange gradient background
- [ ] Payment: Purple gradient background
- [ ] Status cards: Correct colors (blue/green/red)

#### 5.2 Icons
- [ ] All icons display correctly
- [ ] Icons have proper sizing
- [ ] Icons have proper opacity

#### 5.3 Responsive Design
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)
- [ ] All elements responsive

#### 5.4 Navigation
- [ ] Tab switching works smoothly
- [ ] Active tab highlighted correctly
- [ ] No console errors

#### 5.5 Real-Time Updates
1. Open dashboard in two browser windows
2. In Firestore, change status to "REJECTED"
3. In first window, should see update automatically
4. In second window, should see update automatically

### Phase 6: Edge Cases

#### 6.1 No Business Account
1. Log in as user without business account
2. Go to `/dashboard/business-pro`
3. Should see: "Vous n'avez pas de compte entreprise."

#### 6.2 Loading State
1. Go to `/dashboard/business-pro`
2. Should briefly see loading spinner
3. Should disappear when data loads

#### 6.3 Error Handling
1. Simulate Firestore error
2. Should see error message
3. Should not crash

## Checklist

### Status Card
- [ ] PENDING state displays correctly
- [ ] APPROVED state displays correctly
- [ ] REJECTED state displays correctly
- [ ] Rejection reason displays
- [ ] Buttons work correctly
- [ ] Colors are correct
- [ ] Icons display

### Commerce Dashboard
- [ ] Header displays correctly
- [ ] All tabs accessible
- [ ] Overview stats display
- [ ] Products tab empty state
- [ ] Orders tab empty state
- [ ] Marketing tab empty state
- [ ] Colors are blue gradient

### Logistics Dashboard
- [ ] Transport variant shows correct tabs
- [ ] Relay variant shows correct tabs
- [ ] Overview stats display
- [ ] Fleet tab (transport only)
- [ ] Shipments tab displays
- [ ] QR Scanner tab (relay only)
- [ ] Colors are orange gradient

### Payment Dashboard
- [ ] Integrator variant shows correct tabs
- [ ] Agent variant shows correct tabs
- [ ] Overview stats display
- [ ] API Keys tab (integrator only)
- [ ] Transactions tab displays
- [ ] Balance tab (agent only)
- [ ] Colors are purple gradient

### General
- [ ] No console errors
- [ ] Responsive on all devices
- [ ] Real-time updates work
- [ ] Navigation works smoothly
- [ ] All icons display
- [ ] All colors correct
- [ ] Professional appearance

## Test Data

### Commerce
```
Business Name: Test Commerce
Type: COMMERCE
Sub-category: RETAIL
Registration: COM-001
Address: 123 Main St
City: Kinshasa
Country: DRC
Email: commerce@test.com
Phone: +243123456789
```

### Logistics Transport
```
Business Name: Test Transport
Type: LOGISTICS
Sub-category: TRANSPORT_COMPANY
Registration: LOG-001
Address: 456 Transport Ave
City: Kinshasa
Country: DRC
Email: transport@test.com
Phone: +243987654321
```

### Logistics Relay
```
Business Name: Test Relay
Type: LOGISTICS
Sub-category: RELAY_AGENT
Registration: REL-001
Address: 789 Relay St
City: Kinshasa
Country: DRC
Email: relay@test.com
Phone: +243555555555
```

### Payment Integrator
```
Business Name: Test API
Type: PAYMENT
Sub-category: API_INTEGRATION
Registration: PAY-001
Address: 321 API Blvd
City: Kinshasa
Country: DRC
Email: api@test.com
Phone: +243111111111
Callback URL: https://example.com/webhook
```

### Payment Agent
```
Business Name: Test Agent
Type: PAYMENT
Sub-category: APPROVED_AGENT
Registration: AGT-001
Address: 654 Agent Rd
City: Kinshasa
Country: DRC
Email: agent@test.com
Phone: +243222222222
```

## Success Criteria

✅ All status cards display correctly
✅ All dashboards load without errors
✅ All tabs are functional
✅ All icons display correctly
✅ Colors match design system
✅ Responsive on all devices
✅ Real-time updates work
✅ Professional appearance
✅ No console errors
✅ Smooth navigation

Ready to test!
