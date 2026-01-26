import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useWalletTransactions } from './useWalletTransactions';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type SavingsFrequency = 'daily' | 'weekly' | 'monthly';
export type SavingsStatus = 'active' | 'completed' | 'paused';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'CDF' | 'USD' | 'EUR';
  frequency: SavingsFrequency;
  frequencyAmount: number;
  icon: string;
  status: SavingsStatus;
  targetDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastContributionDate?: Timestamp;
  completedAt?: Timestamp;
}

export interface SavingsTransaction {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'auto_contribution';
  description: string;
  timestamp: Timestamp;
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const { balance: walletBalance } = useWalletTransactions();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to savings goals
  useEffect(() => {
    if (!user?.uid) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'savingsGoals'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const goalsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SavingsGoal[];
        setGoals(goalsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching savings goals:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to savings transactions
  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'savingsTransactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SavingsTransaction[];
        setTransactions(txData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
      },
      (err) => {
        console.error('Error fetching savings transactions:', err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Create new savings goal
  const createGoal = async (
    name: string,
    targetAmount: number,
    currency: 'CDF' | 'USD' | 'EUR',
    frequency: SavingsFrequency,
    frequencyAmount: number,
    icon: string,
    description?: string,
    targetDate?: Date
  ): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const docRef = await addDoc(collection(db, 'savingsGoals'), {
        userId: user.uid,
        name,
        description,
        targetAmount,
        currentAmount: 0,
        currency,
        frequency,
        frequencyAmount,
        icon,
        status: 'active' as SavingsStatus,
        targetDate: targetDate ? Timestamp.fromDate(targetDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastContributionDate: null,
        completedAt: null,
      });

      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create goal';
      setError(message);
      throw err;
    }
  };

  // Add funds to goal
  const addFunds = async (
    goalId: string,
    amount: number,
    description?: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      // Check wallet balance
      if (walletBalance < amount) {
        throw new Error('Solde insuffisant dans le portefeuille');
      }

      const newAmount = goal.currentAmount + amount;
      const isCompleted = newAmount >= goal.targetAmount;

      // Update goal
      await updateDoc(doc(db, 'savingsGoals', goalId), {
        currentAmount: newAmount,
        updatedAt: Timestamp.now(),
        lastContributionDate: Timestamp.now(),
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? Timestamp.now() : null,
      });

      // Record transaction
      await addDoc(collection(db, 'savingsTransactions'), {
        goalId,
        userId: user.uid,
        amount,
        type: 'deposit',
        description: description || `Dépôt vers ${goal.name}`,
        timestamp: Timestamp.now(),
      });

      // Deduct from wallet - use set with merge to create if not exists
      const walletRef = doc(db, 'walletTransactions', user.uid);
      const walletDoc = await getDocs(query(collection(db, 'walletTransactions'), where('userId', '==', user.uid)));
      
      if (walletDoc.empty) {
        // Create wallet document if it doesn't exist
        await updateDoc(walletRef, {
          balance: Math.max(0, walletBalance - amount),
          userId: user.uid,
          updatedAt: Timestamp.now(),
        }).catch(async () => {
          // If update fails, try set with merge
          await setDoc(walletRef, {
            balance: Math.max(0, walletBalance - amount),
            userId: user.uid,
            updatedAt: Timestamp.now(),
          }, { merge: true });
        });
      } else {
        await updateDoc(walletRef, {
          balance: Math.max(0, walletBalance - amount),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add funds';
      setError(message);
      throw err;
    }
  };

  // Withdraw funds from goal (only if completed)
  const withdrawFunds = async (
    goalId: string,
    amount: number,
    description?: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      if (goal.status !== 'completed') {
        throw new Error('Vous ne pouvez retirer que lorsque l\'objectif est atteint');
      }

      if (amount > goal.currentAmount) {
        throw new Error('Montant insuffisant dans l\'objectif');
      }

      const newAmount = goal.currentAmount - amount;

      // Update goal
      await updateDoc(doc(db, 'savingsGoals', goalId), {
        currentAmount: newAmount,
        updatedAt: Timestamp.now(),
      });

      // Record transaction
      await addDoc(collection(db, 'savingsTransactions'), {
        goalId,
        userId: user.uid,
        amount,
        type: 'withdrawal',
        description: description || `Retrait de ${goal.name}`,
        timestamp: Timestamp.now(),
      });

      // Add to wallet - use set with merge to create if not exists
      const walletRef = doc(db, 'walletTransactions', user.uid);
      const walletDoc = await getDocs(query(collection(db, 'walletTransactions'), where('userId', '==', user.uid)));
      
      if (walletDoc.empty) {
        // Create wallet document if it doesn't exist
        await updateDoc(walletRef, {
          balance: walletBalance + amount,
          userId: user.uid,
          updatedAt: Timestamp.now(),
        }).catch(async () => {
          // If update fails, try set with merge
          await setDoc(walletRef, {
            balance: walletBalance + amount,
            userId: user.uid,
            updatedAt: Timestamp.now(),
          }, { merge: true });
        });
      } else {
        await updateDoc(walletRef, {
          balance: walletBalance + amount,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to withdraw funds';
      setError(message);
      throw err;
    }
  };

  // Update goal
  const updateGoal = async (
    goalId: string,
    updates: Partial<SavingsGoal>
  ): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      await updateDoc(doc(db, 'savingsGoals', goalId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update goal';
      setError(message);
      throw err;
    }
  };

  // Delete goal
  const deleteGoal = async (goalId: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      // Delete goal
      await deleteDoc(doc(db, 'savingsGoals', goalId));

      // Delete associated transactions
      const txQuery = query(
        collection(db, 'savingsTransactions'),
        where('goalId', '==', goalId)
      );
      const txSnapshot = await getDocs(txQuery);
      for (const txDoc of txSnapshot.docs) {
        await deleteDoc(txDoc.ref);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete goal';
      setError(message);
      throw err;
    }
  };

  // Pause/Resume goal
  const toggleGoalStatus = async (
    goalId: string,
    newStatus: SavingsStatus
  ): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      await updateDoc(doc(db, 'savingsGoals', goalId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update goal status';
      setError(message);
      throw err;
    }
  };

  // Calculate total savings
  const totalSavings = goals.reduce((acc, goal) => {
    const amount = goal.currentAmount;
    if (goal.currency === 'CDF') return acc + amount;
    if (goal.currency === 'USD') return acc + amount * 2500;
    if (goal.currency === 'EUR') return acc + amount * 3000;
    return acc;
  }, 0);

  // Get goal progress
  const getGoalProgress = (goalId: string): number => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return 0;
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  // Get goal transactions
  const getGoalTransactions = (goalId: string): SavingsTransaction[] => {
    return transactions.filter((tx) => tx.goalId === goalId);
  };

  return {
    goals,
    transactions,
    loading,
    error,
    totalSavings,
    walletBalance,
    createGoal,
    addFunds,
    withdrawFunds,
    updateGoal,
    deleteGoal,
    toggleGoalStatus,
    getGoalProgress,
    getGoalTransactions,
  };
}
