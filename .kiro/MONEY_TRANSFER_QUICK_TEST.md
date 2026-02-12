# Money Transfer in Chat - Quick Test Guide

## How to Test

### 1. Send Money
1. Open a chat conversation with another user
2. Click the "💰" (money) button in the action bar
3. Enter an amount (e.g., 100)
4. A transfer card appears in the chat with "Transfert en attente" status

### 2. Receive Money
1. The recipient sees the transfer card with:
   - Amount displayed prominently
   - Sender and receiver names
   - "Accepter" and "Refuser" buttons
   - Transaction ID

### 3. Accept Transfer
1. Click "Accepter" button
2. Card updates to show "Transfert complété" ✅
3. Sender's wallet is debited
4. Receiver's wallet is credited
5. Transaction history is created

### 4. Reject Transfer
1. Click "Refuser" button
2. Card updates to show "Transfert refusé" ❌
3. No wallet changes occur
4. Transaction marked as rejected

## What Happens Behind the Scenes

### On Send:
```
1. Validate amount > 0
2. Check sender has sufficient balance
3. Create transaction with status: 'pending'
4. Create message with messageType: 'money'
5. Return transactionId
```

### On Accept:
```
1. Debit sender wallet: balance -= amount
2. Credit receiver wallet: balance += amount
3. Update transaction status: 'completed'
4. Update message status: 'completed'
5. Create transaction history entry
```

### On Reject:
```
1. Update message status: 'rejected'
2. Update transaction status: 'rejected'
3. No wallet changes
```

## Error Messages

- "Solde insuffisant" - Sender doesn't have enough balance
- "Portefeuille expéditeur non trouvé" - Sender wallet doesn't exist
- "Portefeuille destinataire non trouvé" - Receiver wallet doesn't exist
- "Montant invalide" - Amount is 0 or negative
- "Les transferts d'argent ne sont possibles qu'en conversation individuelle" - Can't send money in groups

## Files Involved

- `src/app/dashboard/miyiki-chat/[id]/conversation-client.tsx` - Message rendering
- `src/components/chat/MoneyTransferMessage.tsx` - Transfer card UI
- `src/hooks/useChatMoneyTransfer.ts` - Transfer logic
- `src/app/api/chat/transfer-money/route.ts` - Initiate transfer
- `src/app/api/chat/accept-transfer/route.ts` - Accept and complete
- `src/app/api/chat/reject-transfer/route.ts` - Reject transfer

## Database Structure

### Transactions Collection
```
{
  type: 'chat_transfer',
  senderId: 'user1',
  senderName: 'John',
  recipientId: 'user2',
  recipientName: 'Jane',
  amount: 100,
  status: 'pending' | 'completed' | 'rejected',
  conversationId: 'conv123',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Message Metadata
```
{
  messageType: 'money',
  metadata: {
    amount: 100,
    recipientId: 'user2',
    recipientName: 'Jane',
    transactionId: 'trans123',
    status: 'pending' | 'completed' | 'rejected'
  }
}
```

## Status Flow

```
PENDING (initial)
  ↓
  ├─→ COMPLETED (on accept)
  └─→ REJECTED (on reject)
```

## Notes

- Transfers only work in 1-on-1 conversations (not groups)
- Wallet must exist for both sender and receiver
- Balance is updated immediately on acceptance
- All transfers are tracked in transaction history
- Sender can see their own transfer card but cannot accept/reject it
- Receiver can only accept/reject if status is 'pending'
