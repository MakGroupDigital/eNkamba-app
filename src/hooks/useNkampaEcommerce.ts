import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useFirestoreConversations } from './useFirestoreConversations';

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
  totalAmount?: number; // Pour compatibilité avec nouveau système
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
        
        // Mettre à jour seulement si les données ont changé
        setProducts((prevProducts) => {
          if (JSON.stringify(prevProducts) === JSON.stringify(prods)) {
            return prevProducts;
          }
          return prods;
        });
        setIsLoading(false);
      }, (err) => {
        console.error('Erreur chargement produits:', err);
        setError('Erreur lors du chargement des produits');
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
        
        // Mettre à jour seulement si les données ont changé
        setOrders((prevOrders) => {
          if (JSON.stringify(prevOrders) === JSON.stringify(ords)) {
            return prevOrders;
          }
          return ords;
        });
      }, (err) => {
        console.error('Erreur chargement commandes:', err);
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
        // Convertir le prix en CDF
        const { convertToCDF } = await import('@/lib/currency-converter');
        const priceInCDF = await convertToCDF(product.price, product.currency);
        const totalPriceInCDF = Math.round(priceInCDF * quantity);

        // Récupérer les infos utilisateur
        const buyerUserRef = doc(db, 'users', currentUser.uid);
        const buyerUserSnap = await getDoc(buyerUserRef);
        
        if (!buyerUserSnap.exists()) {
          throw new Error('Utilisateur introuvable');
        }

        const buyerData = buyerUserSnap.data();
        const buyerName = buyerData?.displayName || buyerData?.name || 'Acheteur';
        const buyerEmail = buyerData?.email || currentUser.email || '';

        // Créer la commande avec le nouveau système
        const { createOrder, notifySeller, notifyBuyer } = await import('@/lib/nkampa-orders');
        
        const order = await createOrder({
          buyerId: currentUser.uid,
          buyerName,
          buyerEmail,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          storeId: product.storeId || '',
          storeName: product.sellerName,
          storeSlug: product.storeSlug || '',
          productId: product.id,
          productName: product.name,
          productImage: product.image || product.images?.[0] || '',
          quantity,
          pricePerUnit: product.price,
          originalCurrency: product.currency,
          priceInCDF,
          totalAmount: totalPriceInCDF,
          shippingAddress,
          shippingPhone,
          status: 'pending',
          paymentMethod: 'wallet',
          paymentStatus: 'pending',
        });

        // Effectuer le paiement
        const sellerUserRef = doc(db, 'users', product.sellerId);
        const sellerUserSnap = await getDoc(sellerUserRef);

        const currentBalance = buyerUserSnap.data()?.walletBalance || 0;

        if (currentBalance < totalPriceInCDF) {
          throw new Error('Solde insuffisant');
        }

        // Mettre à jour les soldes
        await updateDoc(buyerUserRef, {
          walletBalance: currentBalance - totalPriceInCDF,
          updatedAt: serverTimestamp(),
        });

        if (sellerUserSnap.exists()) {
          const sellerBalance = sellerUserSnap.data()?.walletBalance || 0;
          await updateDoc(sellerUserRef, {
            walletBalance: sellerBalance + totalPriceInCDF,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(sellerUserRef, {
            uid: product.sellerId,
            walletBalance: totalPriceInCDF,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        // Générer un ID de transaction
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Enregistrer les transactions
        const buyerTransactionRef = doc(
          db,
          'users',
          currentUser.uid,
          'transactions',
          transactionId
        );

        await setDoc(buyerTransactionRef, {
          type: 'nkampa_purchase',
          amount: -totalPriceInCDF,
          status: 'completed',
          description: `Achat Nkampa - ${product.name}`,
          previousBalance: currentBalance,
          newBalance: currentBalance - totalPriceInCDF,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            orderId: order.id,
            orderNumber: order.orderId,
            productId: product.id,
            productName: product.name,
            quantity,
            originalPrice: product.price,
            originalCurrency: product.currency,
            priceInCDF,
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
          type: 'nkampa_sale',
          amount: totalPriceInCDF,
          status: 'completed',
          description: `Vente Nkampa - ${product.name}`,
          previousBalance: sellerBalance,
          newBalance: sellerBalance + totalPriceInCDF,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            orderId: order.id,
            orderNumber: order.orderId,
            buyerId: currentUser.uid,
            buyerName,
            productId: product.id,
            productName: product.name,
            quantity,
          },
        });

        // Mettre à jour la commande avec le statut de paiement
        const { updateOrderStatus } = await import('@/lib/nkampa-orders');
        await updateOrderStatus(order.id!, 'paid', {
          transactionId,
          paymentStatus: 'completed',
        });

        // Envoyer les notifications
        await notifySeller(order);
        await notifyBuyer(order, 'order_confirmed');

        // Créer une conversation avec le vendeur
        const conversationId = await createConversation(
          product.sellerId,
          product.sellerName,
          'uid'
        );

        // Envoyer un message de confirmation
        await sendMessage(
          conversationId,
          `✅ Commande confirmée!\n\n📦 ${product.name} x${quantity}\n💰 Total: ${totalPriceInCDF.toLocaleString()} CDF\n📋 Commande: ${order.orderId}\n\n📍 Livraison:\n${shippingAddress}\n📞 ${shippingPhone}\n\nLe vendeur va traiter votre commande.`,
          'text',
          {
            orderId: order.id,
            orderNumber: order.orderId,
            productId: product.id,
            quantity,
            totalPrice: totalPriceInCDF,
          }
        );

        return {
          success: true,
          orderId: order.id!,
          orderNumber: order.orderId,
          conversationId,
          transactionId,
          order,
        };
      } catch (err: any) {
        console.error('Erreur achat produit:', err);
        throw err;
      }
    },
    [currentUser, createConversation, sendMessage]
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
