import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useWalletBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    setIsLoading(true);

    const loadBalance = async () => {
      try {
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setBalance(userDoc.data()?.walletBalance || 0);
        } else {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            walletBalance: 0,
            createdAt: serverTimestamp(),
          });
          setBalance(0);
        }
      } catch (error) {
        console.error('Erreur chargement solde wallet:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadBalance();

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBalance(snapshot.data()?.walletBalance || 0);
        } else {
          setBalance(0);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Erreur listener solde wallet:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { balance, isLoading };
}
