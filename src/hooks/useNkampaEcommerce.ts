import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, serverTimestamp, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useFirestoreConversations } from './useFirestoreConversations';
import { getMarketplaceComplianceRequirements } from '@/lib/compliance-rules';

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
  stock?: number;
  quantityAvailable?: number;
  availableStock?: number;
  sold?: number;
  sellerVerified?: boolean;
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
  deliveryOption?: 'delivery' | 'pickup';
  pickupRoute?: {
    enabled: boolean;
    storeLocationLabel: string;
    buyerLocationLabel: string;
    buyerLatitude: number;
    buyerLongitude: number;
    destinationQuery: string;
    suggestedTransportMode?: 'foot' | 'car' | 'train';
  };
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
      shippingPhone: string,
      purchaseOptions?: {
        deliveryOption?: 'delivery' | 'pickup';
        pickupRoute?: {
          enabled: boolean;
          storeLocationLabel: string;
          buyerLocationLabel: string;
          buyerLatitude: number;
          buyerLongitude: number;
          destinationQuery: string;
          suggestedTransportMode?: 'foot' | 'car' | 'train';
        };
      }
    ) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');
      let createdOrderId: string | null = null;

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

        const storeSnap = product.storeId ? await getDoc(doc(db, 'nkampa_stores', product.storeId)) : null;
        const storeData = storeSnap?.exists() ? storeSnap.data() : null;
        const sellerVerified =
          Boolean(product.sellerVerified) ||
          ['active', 'approved'].includes(String(storeData?.status || '').toLowerCase());
        const storeRoles = Array.isArray(storeData?.businessRoles) ? storeData.businessRoles : [];
        const complianceRequirements = getMarketplaceComplianceRequirements({
          category: product.category,
          roles: storeRoles,
          sellerVerified,
        });

        // Créer la commande avec le nouveau système
        const { createOrder, notifySeller, notifyBuyer, buildNkampaOrderCompliance } = await import('@/lib/nkampa-orders');
        
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
          deliveryOption: purchaseOptions?.deliveryOption || 'delivery',
          pickupRoute: purchaseOptions?.pickupRoute,
          status: 'pending',
          paymentMethod: 'wallet',
          paymentStatus: 'pending',
          compliance: buildNkampaOrderCompliance({
            buyerId: currentUser.uid,
            sellerVerified: complianceRequirements.sellerVerified,
            sellerVerificationStatus: complianceRequirements.sellerVerificationStatus,
            customsRequired: complianceRequirements.customsRequired,
            contractRequired: complianceRequirements.contractRequired,
            requiredDocuments: complianceRequirements.requiredDocuments,
          }),
        });
        createdOrderId = order.id || null;

        // Effectuer le paiement, la réservation stock et la trace financière ensemble.
        const sellerUserRef = doc(db, 'users', product.sellerId);
        const productRef = doc(db, 'nkampa_products', product.id);
        const orderRef = doc(db, 'nkampa_orders', order.id!);
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const buyerTransactionRef = doc(
          db,
          'users',
          currentUser.uid,
          'transactions',
          transactionId
        );

        const sellerTransactionRef = doc(
          db,
          'users',
          product.sellerId,
          'transactions',
          transactionId
        );

        const settlement = await runTransaction(db, async (tx) => {
          const [freshProductSnap, freshBuyerSnap, freshSellerSnap] = await Promise.all([
            tx.get(productRef),
            tx.get(buyerUserRef),
            tx.get(sellerUserRef),
          ]);

          const freshProduct = freshProductSnap.exists() ? freshProductSnap.data() as any : product;
          const stockValue = freshProduct.stock ?? freshProduct.quantityAvailable ?? freshProduct.availableStock;
          const stockBefore = Number.isFinite(Number(stockValue)) ? Number(stockValue) : null;
          const stockAfter = stockBefore === null ? null : stockBefore - quantity;

          if (product.listingType !== 'service' && stockBefore !== null && stockBefore < quantity) {
            throw new Error(`Stock insuffisant. Disponible: ${stockBefore}`);
          }

          const buyerBalance = Number(freshBuyerSnap.data()?.walletBalance || 0);
          if (buyerBalance < totalPriceInCDF) {
            throw new Error('Solde insuffisant');
          }

          const sellerBalance = freshSellerSnap.exists() ? Number(freshSellerSnap.data()?.walletBalance || 0) : 0;

          tx.update(buyerUserRef, {
            walletBalance: buyerBalance - totalPriceInCDF,
            updatedAt: serverTimestamp(),
          });

          if (freshSellerSnap.exists()) {
            tx.update(sellerUserRef, {
              walletBalance: sellerBalance + totalPriceInCDF,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.set(sellerUserRef, {
              uid: product.sellerId,
              walletBalance: totalPriceInCDF,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          if (freshProductSnap.exists()) {
            const productUpdate: any = {
              sold: increment(quantity),
              updatedAt: serverTimestamp(),
              lastStockMovement: {
                type: 'sale',
                orderId: order.id,
                quantity,
                at: new Date().toISOString(),
              },
            };
            if (stockBefore !== null) {
              productUpdate.stock = stockAfter;
              productUpdate.quantityAvailable = stockAfter;
              productUpdate.availableStock = stockAfter;
            }
            tx.update(productRef, productUpdate);
          }

          tx.set(buyerTransactionRef, {
            type: 'nkampa_purchase',
            amount: -totalPriceInCDF,
            status: 'completed',
            description: `Achat Nkampa - ${product.name}`,
            previousBalance: buyerBalance,
            newBalance: buyerBalance - totalPriceInCDF,
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
              invoiceNumber: order.invoiceNumber,
            },
          });

          tx.set(sellerTransactionRef, {
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
              invoiceNumber: order.invoiceNumber,
            },
          });

          const stockSnapshot = {
            before: stockBefore,
            after: stockAfter,
            reserved: quantity,
          };

          tx.update(orderRef, {
            status: 'paid',
            transactionId,
            paymentStatus: 'completed',
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            stockSnapshot,
            settlementStatus: 'released',
            refundStatus: 'none',
          });

          return { stockSnapshot };
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
          `✅ Commande confirmée!\n\n📦 ${product.name} x${quantity}\n💰 Total: ${totalPriceInCDF.toLocaleString()} CDF\n📋 Commande: ${order.orderId}\n\n${purchaseOptions?.deliveryOption === 'pickup' ? `🏪 Retrait en boutique\n📍 Boutique: ${purchaseOptions?.pickupRoute?.storeLocationLabel || shippingAddress}` : `📍 Livraison:\n${shippingAddress}\n📞 ${shippingPhone}`}\n\nLe vendeur va traiter votre commande.`,
          'text',
          {
            orderId: order.id,
            orderNumber: order.orderId,
            productId: product.id,
            quantity,
            totalPrice: totalPriceInCDF,
            invoiceNumber: order.invoiceNumber,
          }
        );

        return {
          success: true,
          orderId: order.id!,
          orderNumber: order.orderId,
          conversationId,
          transactionId,
          order: {
            ...order,
            status: 'paid',
            paymentStatus: 'completed',
            transactionId,
            paidAt: new Date(),
            stockSnapshot: settlement.stockSnapshot,
          },
        };
      } catch (err: any) {
        if (createdOrderId) {
          try {
            await updateDoc(doc(db, 'nkampa_orders', createdOrderId), {
              status: 'cancelled',
              paymentStatus: 'failed',
              cancelledAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              notes: err?.message || 'Commande annulée avant confirmation.',
            });
          } catch {
            // La commande restera en attente si Firestore refuse la mise à jour.
          }
        }
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
