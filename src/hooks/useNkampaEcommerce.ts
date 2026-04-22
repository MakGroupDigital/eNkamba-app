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
  images?: string[];
  moq?: string;
  location: string;
  rating?: number;
  reviews?: number;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  category: 'B2B' | 'B2C';
  storeId?: string;
  storeSlug?: string;
  storeCategory?: string;
  storeSubcategory?: string;
  listingType?: 'product' | 'service';
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

        // Générer un numéro de suivi unique
        const year = new Date().getFullYear();
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const trackingNumber = `ENK-${year}-${timestamp.toString().slice(-6)}${random}`;

        // Générer un ID de transaction
        const transactionId = `TXN_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

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
          trackingNumber,
          transactionId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Effectuer le paiement directement avec Firestore
        const buyerUserRef = doc(db, 'users', currentUser.uid);
        const sellerUserRef = doc(db, 'users', product.sellerId);

        // Récupérer les documents utilisateurs
        const buyerUserSnap = await getDoc(buyerUserRef);
        const sellerUserSnap = await getDoc(sellerUserRef);

        if (!buyerUserSnap.exists()) {
          throw new Error('Utilisateur introuvable');
        }

        const currentBalance = buyerUserSnap.data()?.walletBalance || 0;

        if (currentBalance < totalPrice) {
          throw new Error('Solde insuffisant');
        }

        // Mettre à jour les soldes
        await updateDoc(buyerUserRef, {
          walletBalance: currentBalance - totalPrice,
          updatedAt: serverTimestamp(),
        });

        if (sellerUserSnap.exists()) {
          const sellerBalance = sellerUserSnap.data()?.walletBalance || 0;
          await updateDoc(sellerUserRef, {
            walletBalance: sellerBalance + totalPrice,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(sellerUserRef, {
            uid: product.sellerId,
            walletBalance: totalPrice,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        // Enregistrer les transactions
        const buyerTransactionRef = doc(
          db,
          'users',
          currentUser.uid,
          'transactions',
          transactionId
        );

        await setDoc(buyerTransactionRef, {
          type: 'payment',
          amount: -totalPrice,
          status: 'completed',
          description: `Achat e-commerce - ${product.name}`,
          previousBalance: currentBalance,
          newBalance: currentBalance - totalPrice,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            trackingNumber,
            orderId: orderRef.id,
            productId: product.id,
            productName: product.name,
            quantity,
          },
        });

        const sellerTransactionRef = doc(
          db,
          'users',
          product.sellerId,
          'transactions',
          transactionId
        );

        const sellerBalance = sellerUserSnap.exists() ? (sellerUserSnap.data()?.walletBalance || 0) : 0;

        await setDoc(sellerTransactionRef, {
          type: 'payment',
          amount: totalPrice,
          status: 'completed',
          description: `Vente e-commerce - ${product.name}`,
          previousBalance: sellerBalance,
          newBalance: sellerBalance + totalPrice,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            orderId: orderRef.id,
            buyerId: currentUser.uid,
            productId: product.id,
            productName: product.name,
            quantity,
          },
        });

        // Mettre à jour la commande avec le statut de paiement
        await updateDoc(doc(db, 'nkampa_orders', orderRef.id), {
          status: 'paid',
          updatedAt: serverTimestamp(),
        });

        // Créer une conversation avec le vendeur pour la commande
        const conversationId = await createConversation(
          product.sellerId,
          product.sellerName,
          'uid'
        );

        // Envoyer un message de confirmation avec le numéro de suivi
        await sendMessage(
          conversationId,
          `✅ Commande confirmée!\n\n📦 ${product.name} x${quantity}\n💰 Total: ${totalPrice} ${product.currency}\n📋 Commande: ${orderRef.id.substring(0, 8).toUpperCase()}\n🔍 Suivi: ${trackingNumber}\n\nVous pouvez suivre votre colis avec ce numéro.`,
          'text',
          {
            orderId: orderRef.id,
            productId: product.id,
            quantity,
            totalPrice,
            trackingNumber,
          }
        );

        return {
          success: true,
          orderId: orderRef.id,
          conversationId,
          transactionId,
          trackingNumber,
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
