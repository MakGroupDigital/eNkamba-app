import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface SavingsGoal {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequencyAmount: number;
  status: string;
  lastContributionDate?: admin.firestore.Timestamp;
}

interface WalletData {
  balance: number;
  userId: string;
}

/**
 * Process automatic savings contributions
 * Runs daily to deduct savings from wallet
 */
export const processAutomaticSavings = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('Africa/Kinshasa')
  .onRun(async (context) => {
    try {
      console.log('Starting automatic savings processing...');

      // Get all active savings goals
      const goalsSnapshot = await db
        .collection('savingsGoals')
        .where('status', '==', 'active')
        .get();

      let processedCount = 0;
      let failedCount = 0;

      for (const goalDoc of goalsSnapshot.docs) {
        const goal = goalDoc.data() as SavingsGoal;

        try {
          // Check if contribution is due based on frequency
          const lastContribution = goal.lastContributionDate?.toDate() || new Date(0);
          const now = new Date();
          const daysSinceLastContribution = Math.floor(
            (now.getTime() - lastContribution.getTime()) / (1000 * 60 * 60 * 24)
          );

          let shouldContribute = false;

          if (goal.frequency === 'daily') {
            shouldContribute = daysSinceLastContribution >= 1;
          } else if (goal.frequency === 'weekly') {
            shouldContribute = daysSinceLastContribution >= 7;
          } else if (goal.frequency === 'monthly') {
            shouldContribute = daysSinceLastContribution >= 30;
          }

          if (!shouldContribute) {
            continue;
          }

          // Get user's wallet
          const walletDoc = await db.collection('walletTransactions').doc(goal.userId).get();
          const wallet = walletDoc.data() as WalletData | undefined;

          if (!wallet) {
            console.warn(`Wallet not found for user ${goal.userId}`);
            failedCount++;
            continue;
          }

          // Check if wallet has sufficient balance
          if (wallet.balance < goal.frequencyAmount) {
            // Send notification about insufficient balance
            await db.collection('notifications').add({
              userId: goal.userId,
              type: 'insufficient_balance',
              title: 'Solde insuffisant',
              message: `Solde insuffisant pour l'épargne automatique de "${goal.name}". Montant requis: ${goal.frequencyAmount} ${goal.currency}`,
              read: false,
              createdAt: admin.firestore.Timestamp.now(),
            });

            failedCount++;
            continue;
          }

          // Calculate new amounts
          const newGoalAmount = goal.currentAmount + goal.frequencyAmount;
          const isCompleted = newGoalAmount >= goal.targetAmount;
          const newWalletBalance = wallet.balance - goal.frequencyAmount;

          // Update goal
          await db.collection('savingsGoals').doc(goalDoc.id).update({
            currentAmount: newGoalAmount,
            lastContributionDate: admin.firestore.Timestamp.now(),
            status: isCompleted ? 'completed' : 'active',
            completedAt: isCompleted ? admin.firestore.Timestamp.now() : null,
            updatedAt: admin.firestore.Timestamp.now(),
          });

          // Update wallet
          await db.collection('walletTransactions').doc(goal.userId).update({
            balance: newWalletBalance,
          });

          // Record transaction
          await db.collection('savingsTransactions').add({
            goalId: goalDoc.id,
            userId: goal.userId,
            amount: goal.frequencyAmount,
            type: 'auto_contribution',
            description: `Contribution automatique vers ${goal.name}`,
            timestamp: admin.firestore.Timestamp.now(),
          });

          // Send success notification
          await db.collection('notifications').add({
            userId: goal.userId,
            type: 'savings_contribution',
            title: 'Épargne automatique',
            message: `${goal.frequencyAmount} ${goal.currency} ont été automatiquement épargnés pour "${goal.name}".`,
            read: false,
            createdAt: admin.firestore.Timestamp.now(),
          });

          if (isCompleted) {
            // Send completion notification
            await db.collection('notifications').add({
              userId: goal.userId,
              type: 'savings_completed',
              title: 'Objectif atteint!',
              message: `Félicitations! Vous avez atteint votre objectif d'épargne "${goal.name}". Vous pouvez maintenant retirer vos fonds.`,
              read: false,
              createdAt: admin.firestore.Timestamp.now(),
            });
          }

          processedCount++;
        } catch (error) {
          console.error(`Error processing goal ${goalDoc.id}:`, error);
          failedCount++;
        }
      }

      console.log(
        `Automatic savings processing completed. Processed: ${processedCount}, Failed: ${failedCount}`
      );

      return { processed: processedCount, failed: failedCount };
    } catch (error) {
      console.error('Error in processAutomaticSavings:', error);
      throw error;
    }
  });

/**
 * Validate savings goal creation
 */
export const validateSavingsGoal = functions.firestore
  .document('savingsGoals/{goalId}')
  .onCreate(async (snap, context) => {
    try {
      const goal = snap.data() as SavingsGoal;

      // Validate required fields
      if (!goal.userId || !goal.name || !goal.targetAmount || !goal.frequencyAmount) {
        throw new Error('Missing required fields');
      }

      // Validate amounts
      if (goal.targetAmount <= 0 || goal.frequencyAmount <= 0) {
        throw new Error('Amounts must be positive');
      }

      // Validate frequency
      if (!['daily', 'weekly', 'monthly'].includes(goal.frequency)) {
        throw new Error('Invalid frequency');
      }

      // Validate currency
      if (!['CDF', 'USD', 'EUR'].includes(goal.currency)) {
        throw new Error('Invalid currency');
      }

      console.log(`Savings goal created: ${context.params.goalId}`);

      return null;
    } catch (error) {
      console.error('Error validating savings goal:', error);
      throw error;
    }
  });

/**
 * Handle savings goal completion
 */
export const handleSavingsCompletion = functions.firestore
  .document('savingsGoals/{goalId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data() as SavingsGoal;
      const after = change.after.data() as SavingsGoal;

      // Check if goal just completed
      if (before.status !== 'completed' && after.status === 'completed') {
        // Send notification
        await db.collection('notifications').add({
          userId: after.userId,
          type: 'savings_completed',
          title: 'Objectif atteint!',
          message: `Félicitations! Vous avez atteint votre objectif d'épargne "${after.name}". Vous pouvez maintenant retirer vos fonds.`,
          read: false,
          createdAt: admin.firestore.Timestamp.now(),
        });

        console.log(`Savings goal completed: ${context.params.goalId}`);
      }

      return null;
    } catch (error) {
      console.error('Error handling savings completion:', error);
      throw error;
    }
  });

/**
 * Clean up savings transactions (archive old ones)
 */
export const archiveOldSavingsTransactions = functions.pubsub
  .schedule('0 0 1 * *')
  .timeZone('Africa/Kinshasa')
  .onRun(async (context) => {
    try {
      console.log('Starting savings transactions archival...');

      // Get transactions older than 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const oldTransactions = await db
        .collection('savingsTransactions')
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(oneYearAgo))
        .get();

      let archivedCount = 0;

      for (const doc of oldTransactions.docs) {
        await db.collection('savingsTransactionsArchive').doc(doc.id).set(doc.data());
        await doc.ref.delete();
        archivedCount++;
      }

      console.log(`Archived ${archivedCount} old savings transactions`);

      return { archived: archivedCount };
    } catch (error) {
      console.error('Error archiving savings transactions:', error);
      throw error;
    }
  });
