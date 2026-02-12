# Business Account Notifications - Testing Guide

## Setup
1. Make sure you have two browser windows/tabs open:
   - Tab 1: Admin panel (logged in as admin)
   - Tab 2: User dashboard (logged in as regular user)

## Test Flow

### Step 1: Submit Business Request (User)
1. Go to `/dashboard/settings/business-account`
2. Click "Créer un compte entreprise"
3. Fill in the form:
   - Business Name: "Test Commerce"
   - Type: "Commerce (B2B/B2C)"
   - Sub-category: "Vente en gros"
   - Registration Number: "REG123456"
   - Address: "123 Main St"
   - City: "Kinshasa"
   - Country: "DRC"
   - Contact Email: your email
   - Contact Phone: +243123456789
4. Click "Soumettre"
5. You should see status card showing "EN COURS DE TRAITEMENT"

### Step 2: Approve Request (Admin)
1. Go to `/admin/business-requests`
2. You should see the pending request
3. Click the eye icon to view details
4. Click "Approuver" button
5. You should see success toast: "Demande approuvée et notification créée"

### Step 3: Check Notification (User)
1. In Tab 2 (user dashboard), look at the top right
2. Click the bell icon (notifications)
3. You should see:
   - Title: "Compte entreprise approuvé"
   - Message: "Félicitations! Votre compte entreprise "Test Commerce" a été approuvé."
   - Green icon
   - Button: "Accéder à mon Espace Pro"

### Step 4: Check Status Update (User)
1. Go to `/dashboard/settings/business-account`
2. Status card should now show:
   - Green badge: "🟢 APPROUVÉ"
   - Title: "Compte approuvé"
   - Message: "Félicitations, vous êtes désormais un partenaire certifié Enkamba."
   - Button: "Accéder à mon Espace Pro"

### Step 5: Access Dashboard (User)
1. Click "Accéder à mon Espace Pro" button
2. Should be redirected to `/dashboard/business-pro`
3. Should see the appropriate dashboard based on business type:
   - Commerce → Commerce Dashboard (Overview, Products, Orders, Marketing)
   - Logistics → Logistics Dashboard (Fleet/Relay variant)
   - Payment → Payment Dashboard (Integrator/Agent variant)

## Test Rejection Flow

### Step 1: Submit Another Request
1. Create another business request with different name
2. Status should show "EN COURS DE TRAITEMENT"

### Step 2: Reject Request (Admin)
1. Go to `/admin/business-requests`
2. Click eye icon on the new request
3. Enter rejection reason: "Documents incomplets"
4. Click "Rejeter"
5. Success toast should appear

### Step 3: Check Rejection Notification (User)
1. Click bell icon in user dashboard
2. Should see:
   - Title: "Demande de compte entreprise rejetée"
   - Message: "Votre demande pour "..." a été rejetée. Motif: Documents incomplets"
   - Red icon
   - Button: "Modifier et renvoyer"

### Step 4: Check Rejection Status (User)
1. Go to `/dashboard/settings/business-account`
2. Status card should show:
   - Red badge: "🔴 REJETÉ"
   - Title: "Demande rejetée"
   - Rejection reason displayed
   - Button: "Modifier et renvoyer"

## Expected Behavior

### Real-time Updates
- Status changes should appear immediately (within 1-2 seconds)
- No page refresh needed
- Notifications appear in real-time

### Notification Panel
- Unread count badge shows number of unread notifications
- Clicking notification marks it as read
- Action buttons navigate to appropriate pages
- Notifications persist until marked as read

### Status Card
- Shows appropriate icon and color for each status
- PENDING: Blue with clock icon
- APPROVED: Green with checkmark
- REJECTED: Red with X icon
- Buttons are context-aware (only show relevant actions)

## Troubleshooting

### Notification Not Appearing
1. Check browser console for errors
2. Verify user is logged in
3. Check Firestore: `users/{userId}/notifications` collection
4. Verify notification document was created

### Status Not Updating
1. Check Firestore: `users/{userId}` document
2. Verify `businessStatus` field was updated
3. Check if listener is active (should see logs in console)
4. Try refreshing page

### Button Not Working
1. Check if href is correct
2. Verify user has permission to access dashboard
3. Check if business type is recognized (COMMERCE, LOGISTICS, PAYMENT)

## Files to Monitor
- `src/app/admin/business-requests/page.tsx` - Admin approval/rejection
- `src/hooks/useNotifications.ts` - Notification fetching
- `src/components/notifications-panel.tsx` - Notification display
- `src/hooks/useBusinessStatus.ts` - Status updates
- `src/components/business/business-status-card.tsx` - Status display
