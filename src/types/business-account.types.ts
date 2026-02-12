export type BusinessType = 'COMMERCE' | 'LOGISTICS' | 'PAYMENT';
export type BusinessStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type CommerceSubCategory = 
  | 'WHOLESALE'
  | 'RETAIL'
  | 'EQUIPMENT_PRODUCER'
  | 'PRODUCT_PRODUCER';

export type LogisticsSubCategory = 
  | 'TRANSPORT_COMPANY'
  | 'RELAY_AGENT';

export type PaymentSubCategory = 
  | 'API_INTEGRATION'
  | 'ACCREDITED_ENTERPRISE'
  | 'APPROVED_AGENT';

export interface BusinessRequestData {
  userId: string;
  businessName: string;
  type: BusinessType;
  subCategory: CommerceSubCategory | LogisticsSubCategory | PaymentSubCategory;
  status: BusinessStatus;
  
  // Common fields
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  
  // Payment-specific
  apiCallbackUrl?: string;
  
  // Document references
  documents: {
    idCard?: string;
    taxDocument?: string;
    businessLicense?: string;
    bankStatement?: string;
  };
  
  // Metadata
  submittedAt: number;
  updatedAt: number;
  rejectionReason?: string;
  verifiedAt?: number;
  verifiedBy?: string;
}

export interface BusinessProfile extends BusinessRequestData {
  businessId: string;
  isActive: boolean;
}

export interface BusinessFormState {
  businessName: string;
  type: BusinessType | '';
  subCategory: string;
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  apiCallbackUrl?: string;
  documents: {
    idCard: File | null;
    taxDocument: File | null;
    businessLicense: File | null;
    bankStatement: File | null;
  };
}
