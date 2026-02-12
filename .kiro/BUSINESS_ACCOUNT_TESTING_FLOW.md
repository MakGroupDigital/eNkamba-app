# Business Account Testing Flow

## Prerequisites
1. Firebase Admin SDK credentials configured in `.env.local` (see FIREBASE_ADMIN_SDK_SETUP.md)
2. Dev server running: `npm run dev`
3. Logged in as a regular user

## Testing Path

### 1. User Submits Business Request
- Navigate to: http://localhost:3000/dashboard/settings/business-account
- Fill out the form:
  - Business Name: "Test Commerce"
  - Type: "COMMERCE"
  - Sub-category: "Retail"
  - Registration Number: "REG123"
  - Address: "123 Main St"
  - City: "Kinshasa"
  - Country: "DRC"
  - Contact Email: "test@example.com"
  - Contact Phone: "+243123456789"
- Click "Soumettre la demande"
- Should see success message

### 2. Verify Data in Firestore
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select project: studio-1153706651-6032b
- Go to Firestore Database
- Check `business_requests` collection
- Should see a document with:
  - `userId`: Your user ID
  - `status`: "PENDING"
  - `businessName`: "Test Commerce"
  - `submittedAt`: Current timestamp

### 3. Admin Approves Request
- Navigate to: http://localhost:3000/admin/business-requests
- Should see the pending request
- Click "Approver" button
- Should see success message

### 4. Verify Admin Changes
- Check Firestore:
  - `business_requests` document: `status` should be "VERIFIED"
  - `businesses` collection: New document created with business profile
  - `users` collection: Your user document should have:
    - `isBusiness: true`
    - `businessId`: The request ID
    - `businessStatus: "VERIFIED"`

### 5. Test Rejection Flow
- Create another business request
- In admin dashboard, click "Rejeter"
- Enter rejection reason
- Check Firestore: `business_requests` document should have:
  - `status: "REJECTED"`
  - `rejectionReason`: Your reason

## Expected Behavior

### User Form
- ✅ Form validates required fields
- ✅ Documents upload disabled (placeholder URLs)
- ✅ Submit button shows loading state
- ✅ Success message appears after submission
- ✅ Form data saved to Firestore

### Admin Dashboard
- ✅ Shows all pending requests
- ✅ Approve button updates Firestore
- ✅ Reject button with reason input
- ✅ Status updates in real-time

### Firestore Collections
- ✅ `business_requests`: Stores all submissions
- ✅ `businesses`: Stores approved businesses
- ✅ `users`: Updated with business status

## Debugging

### Check Browser Console
- Look for any fetch errors
- Check network tab for API responses

### Check Server Logs
- Look for "Erreur soumission demande" or similar errors
- Check Firebase Admin SDK initialization

### Check Firestore Rules
- Rules are permissive for development
- No security restrictions should block writes

## Next Steps After Testing
1. Deploy Cloud Functions (if needed)
2. Implement email notifications for approvals
3. Add document upload to Firebase Storage
4. Implement business dashboard features
