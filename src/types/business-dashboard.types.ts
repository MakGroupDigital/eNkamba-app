// Business Dashboard Types

export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BusinessType = 'COMMERCE' | 'LOGISTICS' | 'PAYMENT';

export interface BusinessUser {
  uid: string;
  businessId: string;
  businessName: string;
  businessType: BusinessType;
  subCategory: string;
  status: BusinessStatus;
  rejectionReason?: string;
  approvedAt?: number;
  isBusiness: boolean;
}

// Commerce Dashboard
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  variants: ProductVariant[];
  images: string[];
  createdAt: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
}

export interface B2BPrice {
  minQuantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: 'PENDING' | 'PREPARED' | 'SHIPPED' | 'DELIVERED';
  totalAmount: number;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Promotion {
  id: string;
  code: string;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  validFrom: number;
  validTo: number;
  maxUses: number;
  currentUses: number;
}

// Logistics Dashboard
export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE';
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  estimatedDelivery: number;
}

export interface RelayPackage {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  status: 'RECEIVED' | 'STORED' | 'PICKED_UP';
  receivedAt: number;
  pickedUpAt?: number;
  signature?: string;
}

// Payment Dashboard
export interface APIKey {
  id: string;
  publicKey: string;
  secretKey: string;
  name: string;
  createdAt: number;
  lastUsed?: number;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  type: 'DEPOSIT' | 'WITHDRAWAL';
  createdAt: number;
  reference: string;
}

export interface AgentBalance {
  totalBalance: number;
  floatingBalance: number;
  commissions: number;
  lastUpdated: number;
}
