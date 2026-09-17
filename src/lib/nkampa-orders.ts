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

export type NkampaRefundStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'refunded';

export interface NkampaOrderInvoice {
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  platformFee: number;
  logisticsFee: number;
  totalAmount: number;
  currency: string;
  fiscalNote: string;
}

export interface NkampaOrderCompliance {
  sellerVerified: boolean;
  sellerVerificationStatus: 'verified' | 'pending' | 'unverified';
  contractRequired?: boolean;
  requiredDocuments?: string[];
  productControlStatus: 'passed' | 'review_required';
  taxRecorded: boolean;
  customsRequired: boolean;
  customsStatus: 'not_required' | 'pending_documents' | 'ready';
  auditTrail: Array<{
    action: string;
    actorId: string;
    role: 'buyer' | 'seller' | 'system' | 'admin';
    at: string;
    note?: string;
  }>;
}

export interface NkampaDigitalDeliveryFile {
  name: string;
  size: number;
  type: string;
  url: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw';
  format?: string;
}

export interface NkampaDigitalDelivery {
  provider: 'cloudinary';
  accessMode: 'download_after_purchase';
  productType?: string;
  license?: string;
  instructions?: string;
  files: NkampaDigitalDeliveryFile[];
  status?: 'pending' | 'available';
  unlockedAt?: string;
}

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
  trackingNumber?: string;
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
  digitalDelivery?: NkampaDigitalDelivery;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'wallet';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  invoiceNumber?: string;
  invoice?: NkampaOrderInvoice;
  refundStatus?: NkampaRefundStatus;
  refundRequest?: {
    requestedBy: string;
    reason: string;
    amount: number;
    status: NkampaRefundStatus;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  };
  stockSnapshot?: {
    before: number | null;
    after: number | null;
    reserved: number;
  };
  compliance?: NkampaOrderCompliance;
  createdAt: any;
  updatedAt: any;
  paidAt?: any;
  shippedAt?: any;
  deliveredAt?: any;
  cancelledAt?: any;
  notes?: string;
}

export function buildNkampaInvoice(input: {
  orderId: string;
  totalAmount: number;
  currency?: string;
  logisticsFee?: number;
}) {
  const totalAmount = Math.max(0, Math.round(Number(input.totalAmount || 0)));
  const logisticsFee = Math.max(0, Math.round(Number(input.logisticsFee || 0)));
  const taxRate = 0.16;
  const taxAmount = Math.round((totalAmount * taxRate) / (1 + taxRate));
  const subtotal = Math.max(0, totalAmount - taxAmount);

  return {
    invoiceNumber: `FAC-${input.orderId}`,
    issuedAt: new Date().toISOString(),
    subtotal,
    taxRate,
    taxAmount,
    platformFee: 0,
    logisticsFee,
    totalAmount,
    currency: input.currency || 'CDF',
    fiscalNote: 'Montant TTC enregistré pour contrôle fiscal Kenz.',
  } satisfies NkampaOrderInvoice;
}

export function buildNkampaOrderCompliance(input: {
  buyerId: string;
  sellerVerified?: boolean;
  sellerVerificationStatus?: 'verified' | 'pending' | 'unverified';
  customsRequired?: boolean;
  contractRequired?: boolean;
  requiredDocuments?: string[];
}) {
  const sellerVerified = Boolean(input.sellerVerified);
  const customsRequired = Boolean(input.customsRequired);

  return {
    sellerVerified,
    sellerVerificationStatus: input.sellerVerificationStatus || (sellerVerified ? 'verified' : 'pending'),
    contractRequired: Boolean(input.contractRequired),
    requiredDocuments: input.requiredDocuments || [],
    productControlStatus: 'passed',
    taxRecorded: true,
    customsRequired,
    customsStatus: customsRequired ? 'pending_documents' : 'not_required',
    auditTrail: [
      {
        action: 'order_created',
        actorId: input.buyerId,
        role: 'buyer',
        at: new Date().toISOString(),
        note: 'Commande créée depuis Marché.',
      },
    ],
  } satisfies NkampaOrderCompliance;
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)])
    ) as T;
  }
  return value;
}

/**
 * Crée une nouvelle commande
 */
export async function createOrder(orderData: Omit<NkampaOrder, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>): Promise<NkampaOrder> {
  try {
    const orderId = `ENK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const trackingNumber = orderData.trackingNumber || `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const invoice = orderData.invoice || buildNkampaInvoice({
      orderId,
      totalAmount: orderData.totalAmount,
      currency: 'CDF',
    });
    
    const order: Omit<NkampaOrder, 'id'> = {
      ...orderData,
      orderId,
      trackingNumber,
      invoiceNumber: orderData.invoiceNumber || invoice.invoiceNumber,
      invoice,
      refundStatus: orderData.refundStatus || 'none',
      compliance: orderData.compliance || buildNkampaOrderCompliance({
        buyerId: orderData.buyerId,
        sellerVerified: false,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'nkampa_orders'), stripUndefined(order));

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

export async function requestOrderRefund(orderDocId: string, input: {
  requestedBy: string;
  reason: string;
  amount: number;
}) {
  try {
    const orderRef = doc(db, 'nkampa_orders', orderDocId);
    await updateDoc(orderRef, {
      refundStatus: 'requested',
      refundRequest: {
        requestedBy: input.requestedBy,
        reason: input.reason,
        amount: Math.max(0, Math.round(Number(input.amount || 0))),
        status: 'requested',
        requestedAt: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur demande remboursement:', error);
    throw new Error('Impossible de créer la demande de remboursement');
  }
}

export async function appendOrderAudit(orderDocId: string, input: {
  action: string;
  actorId: string;
  role: 'buyer' | 'seller' | 'system' | 'admin';
  note?: string;
}) {
  try {
    const order = await getOrderById(orderDocId);
    const currentTrail = order?.compliance?.auditTrail || [];
    const orderRef = doc(db, 'nkampa_orders', orderDocId);
    await updateDoc(orderRef, {
      'compliance.auditTrail': [
        ...currentTrail.slice(-30),
        {
          action: input.action,
          actorId: input.actorId,
          role: input.role,
          at: new Date().toISOString(),
          note: input.note || '',
        },
      ],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur audit commande:', error);
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
