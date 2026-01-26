# Next Steps: Payment Gateway Integration

## Overview
The wallet system is complete and ready for payment gateway integration. This guide outlines the next phase.

## Current Status
✅ Add funds flow - Complete
✅ Withdraw flow - Complete
✅ Wallet display - Complete
✅ Cloud Functions - Deployed
✅ Firestore integration - Complete
✅ Real-time updates - Working
✅ Notifications - Basic (in-app only)

## Phase 1: Payment Gateway Integration (Recommended: Flutterwave)

### Why Flutterwave?
- ✅ Supports 35+ African countries
- ✅ Multiple payment methods (Mobile Money, Cards, Bank Transfer)
- ✅ Easy integration
- ✅ Good documentation
- ✅ Competitive fees
- ✅ Webhook support
- ✅ Test mode available

### Implementation Steps

#### Step 1: Get Flutterwave Account
1. Go to https://flutterwave.com
2. Sign up for business account
3. Get API keys (Public & Secret)
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_public_key
   FLUTTERWAVE_SECRET_KEY=your_secret_key
   ```

#### Step 2: Create Payment Function
Create `functions/src/flutterwavePayment.ts`:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

export const initializeFlutterwavePayment = functions.https.onCall(
  async (data: {
    userId: string;
    amount: number;
    email: string;
    phoneNumber: string;
    paymentMethod: string;
  }, context) => {
    // Validate user
    // Create Flutterwave payment
    // Return payment link
  }
);

export const verifyFlutterwavePayment = functions.https.onCall(
  async (data: {
    userId: string;
    transactionId: string;
    reference: string;
  }, context) => {
    // Verify payment with Flutterwave
    // Update transaction status
    // Update wallet balance
    // Create notification
  }
);
```

#### Step 3: Update Add Funds Page
Modify `src/app/dashboard/add-funds/page.tsx`:
```typescript
// Add Flutterwave integration
// Show payment link
// Handle payment verification
// Update balance on success
```

#### Step 4: Handle Webhooks
Create webhook endpoint for Flutterwave callbacks:
```typescript
// functions/src/flutterwaveWebhook.ts
export const flutterwaveWebhook = functions.https.onRequest(
  async (req, res) => {
    // Verify webhook signature
    // Update transaction status
    // Update wallet balance
    // Send notification
  }
);
```

#### Step 5: Test Integration
1. Use Flutterwave test cards
2. Test payment flow
3. Verify webhook callbacks
4. Test error scenarios

## Phase 2: SMS Notifications (Twilio)

### Implementation Steps

#### Step 1: Get Twilio Account
1. Go to https://www.twilio.com
2. Sign up for account
3. Get API credentials
4. Add to `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_phone_number
   ```

#### Step 2: Create SMS Function
```typescript
// functions/src/sendSMS.ts
export const sendTransactionSMS = functions.https.onCall(
  async (data: {
    userId: string;
    phoneNumber: string;
    message: string;
  }, context) => {
    // Send SMS via Twilio
    // Log SMS sent
    // Handle errors
  }
);
```

#### Step 3: Trigger SMS on Transactions
Update Cloud Functions to send SMS:
```typescript
// In addFundsToWallet and withdrawFundsFromWallet
await sendTransactionSMS({
  userId,
  phoneNumber: userPhone,
  message: `Your transaction of ${amount} CDF was successful`
});
```

## Phase 3: Push Notifications (Firebase Cloud Messaging)

### Implementation Steps

#### Step 1: Setup FCM
1. Go to Firebase Console
2. Enable Cloud Messaging
3. Get server key

#### Step 2: Create Notification Function
```typescript
// functions/src/sendPushNotification.ts
export const sendPushNotification = functions.https.onCall(
  async (data: {
    userId: string;
    title: string;
    message: string;
  }, context) => {
    // Get user FCM token
    // Send push notification
    // Log notification sent
  }
);
```

#### Step 3: Register FCM Token
In app, register device token:
```typescript
// src/hooks/useFCMToken.ts
export function useFCMToken() {
  useEffect(() => {
    const registerToken = async () => {
      const token = await getToken(messaging);
      // Save token to Firestore
      await updateDoc(userRef, { fcmToken: token });
    };
    registerToken();
  }, []);
}
```

## Phase 4: OTP Verification

### Implementation Steps

#### Step 1: Create OTP Function
```typescript
// functions/src/sendOTP.ts
export const sendWithdrawalOTP = functions.https.onCall(
  async (data: {
    userId: string;
    phoneNumber: string;
  }, context) => {
    // Generate OTP
    // Send via SMS
    // Store OTP in Firestore
  }
);

export const verifyWithdrawalOTP = functions.https.onCall(
  async (data: {
    userId: string;
    otp: string;
  }, context) => {
    // Verify OTP
    // Check expiration
    // Allow withdrawal
  }
);
```

#### Step 2: Update Withdraw Flow
Add OTP verification step before withdrawal confirmation.

## Phase 5: Rate Limiting & Fraud Detection

### Implementation Steps

#### Step 1: Rate Limiting
```typescript
// functions/src/rateLimiting.ts
export const checkWithdrawalLimit = functions.https.onCall(
  async (data: {
    userId: string;
  }, context) => {
    // Check daily withdrawal limit
    // Check hourly withdrawal limit
    // Check transaction frequency
  }
);
```

#### Step 2: Fraud Detection
```typescript
// functions/src/fraudDetection.ts
export const checkFraudRisk = functions.https.onCall(
  async (data: {
    userId: string;
    amount: number;
    location: string;
  }, context) => {
    // Check unusual amount
    // Check unusual location
    // Check unusual time
    // Check velocity
  }
);
```

## Phase 6: Agent Management System

### Implementation Steps

#### Step 1: Agent Registration
Create agent registration page:
```typescript
// src/app/dashboard/agent-registration/page.tsx
// Form for agent registration
// KYC verification
// Agent approval workflow
```

#### Step 2: Agent Dashboard
Create agent dashboard:
```typescript
// src/app/dashboard/agent/page.tsx
// Agent transactions
// Agent earnings
// Agent statistics
// QR code generation
```

#### Step 3: Agent QR Codes
Generate unique QR codes for agents:
```typescript
// functions/src/generateAgentQR.ts
export const generateAgentQRCode = functions.https.onCall(
  async (data: {
    agentId: string;
  }, context) => {
    // Generate unique QR code
    // Store QR code data
    // Return QR code image
  }
);
```

## Phase 7: Admin Dashboard

### Implementation Steps

#### Step 1: Admin Pages
Create admin dashboard:
```typescript
// src/app/admin/dashboard/page.tsx
// Transaction monitoring
// User management
// Agent management
// Reporting
```

#### Step 2: Transaction Monitoring
```typescript
// src/app/admin/transactions/page.tsx
// View all transactions
// Filter and search
// Export reports
// Dispute resolution
```

#### Step 3: User Management
```typescript
// src/app/admin/users/page.tsx
// View all users
// User verification
// Account suspension
// KYC management
```

## Implementation Timeline

### Week 1: Payment Gateway
- [ ] Flutterwave integration
- [ ] Payment flow testing
- [ ] Webhook setup
- [ ] Error handling

### Week 2: Notifications
- [ ] SMS integration (Twilio)
- [ ] Push notifications (FCM)
- [ ] Notification preferences
- [ ] Testing

### Week 3: Security
- [ ] OTP verification
- [ ] Rate limiting
- [ ] Fraud detection
- [ ] Testing

### Week 4: Agent System
- [ ] Agent registration
- [ ] Agent dashboard
- [ ] QR code generation
- [ ] Testing

### Week 5: Admin
- [ ] Admin dashboard
- [ ] Transaction monitoring
- [ ] User management
- [ ] Reporting

## Priority Order

1. **High Priority** (Week 1-2)
   - Payment gateway integration
   - SMS notifications
   - Push notifications

2. **Medium Priority** (Week 3)
   - OTP verification
   - Rate limiting
   - Fraud detection

3. **Low Priority** (Week 4-5)
   - Agent management
   - Admin dashboard
   - Advanced reporting

## Testing Strategy

### Unit Tests
- Test each function independently
- Test error scenarios
- Test edge cases

### Integration Tests
- Test payment flow end-to-end
- Test notification delivery
- Test webhook callbacks

### User Acceptance Tests
- Test with real users
- Gather feedback
- Identify improvements

## Deployment Strategy

### Staging
1. Deploy to staging environment
2. Run full test suite
3. Get stakeholder approval
4. Monitor for issues

### Production
1. Deploy to production
2. Monitor closely
3. Have rollback plan
4. Communicate with users

## Monitoring & Analytics

### Metrics to Track
- Transaction success rate
- Payment processing time
- Notification delivery rate
- Error rate
- User satisfaction

### Tools
- Firebase Console
- Flutterwave Dashboard
- Twilio Console
- Google Analytics

## Support & Documentation

### For Developers
- API documentation
- Integration guides
- Code examples
- Troubleshooting guides

### For Users
- Help center articles
- Video tutorials
- FAQ
- Support contact

## Budget Considerations

### Costs
- Flutterwave: 1.4% - 2.5% per transaction
- Twilio: $0.0075 per SMS
- Firebase: Pay-as-you-go
- Hosting: Varies

### Optimization
- Batch SMS sends
- Cache frequently accessed data
- Optimize database queries
- Monitor costs

## Risk Mitigation

### Risks
- Payment gateway downtime
- SMS delivery failures
- Security vulnerabilities
- User adoption

### Mitigation
- Have backup payment method
- Implement retry logic
- Regular security audits
- User education

## Success Criteria

✅ Payment gateway integrated
✅ SMS notifications working
✅ Push notifications working
✅ OTP verification working
✅ Rate limiting working
✅ Fraud detection working
✅ Agent system working
✅ Admin dashboard working
✅ All tests passing
✅ Users satisfied

---

**Current Phase**: Wallet System Complete
**Next Phase**: Payment Gateway Integration
**Estimated Duration**: 5 weeks
**Team Size**: 2-3 developers
**Priority**: High
