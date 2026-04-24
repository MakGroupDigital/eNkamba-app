import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

export interface NkampaOrder {
  id?: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  pricePerUnit: number;
  originalCurrency: string;
  priceInCDF: number;
  totalAmount: number;
  shippingAddress: string;
  shippingPhone: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'wallet';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: any;
  updatedAt: any;
  paidAt?: any;
  shippedAt?: any;
  deliveredAt?: any;
  cancelledAt?: any;
  notes?: string;
}

/**
 * Crée une nouvelle commande
 */
export async function createOrder(orderData: Omit<NkampaOrder, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>): Promise<NkampaOrder> {
  try {
    const orderId = `ENK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const order: Omit<NkampaOrder, 'id'> = {
      ...orderData,
      orderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'nkampa_orders'), order);

    return {
      ...order,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NkampaOrder;
  } catch (error) {
    console.error('Erreur création commande:', error);
    throw new Error('Impossible de créer la commande');
  }
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(
  orderId: string,
  status: NkampaOrder['status'],
  additionalData?: Partial<NkampaOrder>
): Promise<void> {
  try {
    const orderRef = doc(db, 'nkampa_orders', orderId);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    // Ajouter les timestamps selon le statut
    if (status === 'paid') {
      updateData.paidAt = serverTimestamp();
      updateData.paymentStatus = 'completed';
    } else if (status === 'shipped') {
      updateData.shippedAt = serverTimestamp();
    } else if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = serverTimestamp();
    }

    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    throw new Error('Impossible de mettre à jour la commande');
  }
}

/**
 * Récupère les commandes d'un acheteur
 */
export async function getBuyerOrders(buyerId: string): Promise<NkampaOrder[]> {
  try {
    const q = query(
      collection(db, 'nkampa_orders'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as NkampaOrder[];
  } catch (error) {
    console.error('Erreur récupération commandes acheteur:', error);
    return [];
  }
}

/**
 * Récupère les commandes d'un vendeur
 */
export async function getSellerOrders(sellerId: string): Promise<NkampaOrder[]> {
  try {
    const q = query(
      collection(db, 'nkampa_orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as NkampaOrder[];
  } catch (error) {
    console.error('Erreur récupération commandes vendeur:', error);
    return [];
  }
}

/**
 * Récupère une commande par son ID
 */
export async function getOrderById(orderId: string): Promise<NkampaOrder | null> {
  try {
    const orderRef = doc(db, 'nkampa_orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return null;
    }

    return {
      id: orderSnap.id,
      ...orderSnap.data(),
    } as NkampaOrder;
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    return null;
  }
}

/**
 * Envoie une notification au vendeur
 */
export async function notifySeller(order: NkampaOrder): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: order.sellerId,
      type: 'new_order',
      title: 'Nouvelle commande ! 🎉',
      message: `${order.buyerName} a commandé ${order.quantity}x ${order.productName}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderId,
        productName: order.productName,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
      },
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur envoi notification vendeur:', error);
  }
}

/**
 * Envoie une notification à l'acheteur
 */
export async function notifyBuyer(order: NkampaOrder, type: 'order_confirmed' | 'order_shipped' | 'order_delivered'): Promise<void> {
  try {
    const messages = {
      order_confirmed: {
        title: 'Commande confirmée ✅',
        message: `Votre commande ${order.orderId} a été confirmée`,
      },
      order_shipped: {
        title: 'Commande expédiée 📦',
        message: `Votre commande ${order.orderId} a été expédiée`,
      },
      order_delivered: {
        title: 'Commande livrée 🎉',
        message: `Votre commande ${order.orderId} a été livrée`,
      },
    };

    const notification = messages[type];

    await addDoc(collection(db, 'notifications'), {
      userId: order.buyerId,
      type,
      title: notification.title,
      message: notification.message,
      data: {
        orderId: order.id,
        orderNumber: order.orderId,
      },
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur envoi notification acheteur:', error);
  }
}
