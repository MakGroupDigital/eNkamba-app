import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useFirestoreConversations } from './useFirestoreConversations';
import { useWalletTransactions } from './useWalletTransactions';

export interface EcommerceProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  moq?: string;
  location: string;
  rating?: number;
  reviews?: number;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  category: 'B2B' | 'B2C';
  description?: string;
  createdAt: any;
}

export interface EcommerceOrder {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: string;
  shippingPhone: string;
  trackingNumber?: string;
  createdAt: any;
  updatedAt: any;
}

export function useNkampaEcommerce() {
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;
  const { createConversation, sendMessage } = useFirestoreConversations();
  const { balance } = useWalletTransactions();

  // Charger les produits
  useEffect(() => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'nkampa_products'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const prods: EcommerceProduct[] = [];
        snapshot.forEach((doc) => {
          prods.push({
            id: doc.id,
            ...doc.data(),
          } as EcommerceProduct);
        });
        setProducts(prods);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError('Erreur lors du chargement des produits');
      setIsLoading(false);
    }
  }, []);

  // Charger les commandes de l'utilisateur
  useEffect(() => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'nkampa_orders'),
        where('buyerId', '==', currentUser.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ords: EcommerceOrder[] = [];
        snapshot.forEach((doc) => {
          ords.push({
            id: doc.id,
            ...doc.data(),
          } as EcommerceOrder);
        });
        setOrders(ords);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    }
  }, [currentUser]);

  // Contacter le vendeur
  const contactSeller = useCallback(
    async (product: EcommerceProduct) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        // Créer une conversation avec le vendeur
        const conversationId = await createConversation(
          product.sellerId,
          product.sellerName,
          'uid'
        );

        // Envoyer un message initial
        await sendMessage(
          conversationId,
          `Bonjour, je suis intéressé par votre produit: ${product.name} (${product.price} ${product.currency})`,
          'text',
          { productId: product.id, productName: product.name }
        );

        return conversationId;
      } catch (err) {
        console.error('Erreur contact vendeur:', err);
        throw err;
      }
    },
    [currentUser, createConversation, sendMessage]
  );

  // Acheter un produit
  const buyProduct = useCallback(
    async (
      product: EcommerceProduct,
      quantity: number,
      shippingAddress: string,
      shippingPhone: string
    ) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        const totalPrice = product.price * quantity;

        // Vérifier le solde
        if (balance < totalPrice) {
          throw new Error('Solde insuffisant. Veuillez ajouter des fonds.');
        }

        // Créer la commande
        const orderRef = await addDoc(collection(db, 'nkampa_orders'), {
          productId: product.id,
          productName: product.name,
          buyerId: currentUser.uid,
          sellerId: product.sellerId,
          quantity,
          totalPrice,
          currency: product.currency,
          status: 'pending',
          paymentMethod: 'wallet',
          shippingAddress,
          shippingPhone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Effectuer le paiement via API
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/nkampa/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderRef.id,
            buyerId: currentUser.uid,
            sellerId: product.sellerId,
            amount: totalPrice,
            currency: product.currency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du paiement');
        }

        const paymentData = await response.json();

        // Mettre à jour la commande avec le statut de paiement
        await updateDoc(doc(db, 'nkampa_orders', orderRef.id), {
          status: 'paid',
          transactionId: paymentData.transactionId,
          updatedAt: serverTimestamp(),
        });

        // Créer une conversation avec le vendeur pour la commande
        const conversationId = await createConversation(
          product.sellerId,
          product.sellerName,
          'uid'
        );

        // Envoyer un message de confirmation
        await sendMessage(
          conversationId,
          `Commande confirmée: ${product.name} x${quantity} - Total: ${totalPrice} ${product.currency}. Numéro de commande: ${orderRef.id}`,
          'text',
          {
            orderId: orderRef.id,
            productId: product.id,
            quantity,
            totalPrice,
          }
        );

        return {
          success: true,
          orderId: orderRef.id,
          conversationId,
          transactionId: paymentData.transactionId,
        };
      } catch (err: any) {
        console.error('Erreur achat produit:', err);
        throw err;
      }
    },
    [currentUser, balance, createConversation, sendMessage]
  );

  // Ajouter un produit (pour les vendeurs)
  const addProduct = useCallback(
    async (productData: Omit<EcommerceProduct, 'id' | 'createdAt' | 'sellerId'>) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        const docRef = await addDoc(collection(db, 'nkampa_products'), {
          ...productData,
          sellerId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        return docRef.id;
      } catch (err) {
        console.error('Erreur ajout produit:', err);
        throw err;
      }
    },
    [currentUser]
  );

  return {
    products,
    orders,
    isLoading,
    error,
    contactSeller,
    buyProduct,
    addProduct,
  };
}
