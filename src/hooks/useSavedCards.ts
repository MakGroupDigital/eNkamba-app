'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface SavedCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: 'visa' | 'mastercard';
  lastFour: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface AddCardData {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardType: 'visa' | 'mastercard';
}

export function useSavedCards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch saved cards
  useEffect(() => {
    if (!user?.uid) return;

    const fetchCards = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'users', user.uid, 'savedCards'),
          where('deleted', '==', false)
        );
        const snapshot = await getDocs(q);
        const cardsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as SavedCard[];
        setCards(cardsList);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [user?.uid]);

  // Add new card
  const addCard = async (cardData: AddCardData): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Utilisateur non authentifié',
      });
      return false;
    }

    try {
      setIsLoading(true);
      const digitsOnly = cardData.cardNumber.replace(/\D/g, '');

      // Validate card number (basic Luhn algorithm)
      if (!validateCardNumber(digitsOnly)) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Numéro de carte invalide',
        });
        return false;
      }

      // Validate expiry
      const expiryMonth = Number.parseInt(cardData.expiryMonth, 10);
      const expiryYear = Number.parseInt(cardData.expiryYear, 10);
      if (!Number.isFinite(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Mois d\'expiration invalide',
        });
        return false;
      }
      if (!Number.isFinite(expiryYear) || expiryYear < 2000) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Année d\'expiration invalide',
        });
        return false;
      }
      const now = new Date();
      const expiryDate = new Date(expiryYear, expiryMonth - 1, 1);
      const endOfExpiryMonth = new Date(expiryYear, expiryMonth, 0, 23, 59, 59, 999);
      if (!Number.isFinite(expiryDate.getTime())) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Date d\'expiration invalide',
        });
        return false;
      }
      if (endOfExpiryMonth < now) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Carte expirée',
        });
        return false;
      }

      // Validate CVV
      if (!/^\d{3,4}$/.test(cardData.cvv)) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'CVV invalide',
        });
        return false;
      }

      const lastFour = digitsOnly.slice(-4);
      const isDefault = cards.length === 0;

      const docRef = await addDoc(collection(db, 'users', user.uid, 'savedCards'), {
        cardNumber: digitsOnly, // In production, encrypt this
        cardHolder: cardData.cardHolder,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        cardType: cardData.cardType,
        lastFour,
        isDefault,
        deleted: false,
        createdAt: new Date(),
      });

      setCards((prevCards) => [
        ...prevCards,
        {
          id: docRef.id,
          cardNumber: digitsOnly,
          cardHolder: cardData.cardHolder,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cardType: cardData.cardType,
          lastFour,
          isDefault,
          createdAt: new Date(),
        },
      ]);

      toast({
        title: 'Succès',
        description: 'Carte ajoutée avec succès',
        className: 'bg-green-600 text-white border-none',
      });

      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout de la carte',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete card
  const deleteCard = async (cardId: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'users', user.uid, 'savedCards', cardId));

      setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));

      toast({
        title: 'Succès',
        description: 'Carte supprimée',
        className: 'bg-green-600 text-white border-none',
      });

      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cards,
    isLoading,
    addCard,
    deleteCard,
  };
}

// Validate card number using Luhn algorithm
function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
