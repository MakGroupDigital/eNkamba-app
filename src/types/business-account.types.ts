export type BusinessType = 'COMMERCE' | 'LOGISTICS' | 'PAYMENT';
export type BusinessStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type EntityNature = 'CORPORATE' | 'INDIVIDUAL_BUSINESS' | 'PERSONAL' | 'LEGAL_ENTITY';
export type LogisticsOperationMode = 'FIXED' | 'MOBILE' | 'HYBRID';
export type PaymentRole = 'INTEGRATOR' | 'AGENT' | 'FINTECH_PARTNER';

export type CommerceSubCategory = 
  | 'WHOLESALE'
  | 'RETAIL'
  | 'EQUIPMENT_PRODUCER'
  | 'PRODUCT_PRODUCER'
  | 'FOOD_SUPPLY'
  | 'BIO_PRODUCTS'
  | 'DIGITAL_SERVICES'
  | 'SERVICES';

export type LogisticsSubCategory = 
  | 'TRANSPORT_COMPANY'
  | 'LOCAL_AGENCY'
  | 'NATIONAL_AGENCY'
  | 'INTERNATIONAL_AGENCY'
  | 'RELAY'
  | 'RELAY_AGENT'
  | 'WAREHOUSE_HUB'
  | 'LAST_MILE'
  | 'COURIER_FOOT'
  | 'COURIER_BIKE'
  | 'COURIER_MOTORBIKE'
  | 'COURIER_CAR'
  | 'COURIER_TRUCK'
  | 'COURIER_TRAIN'
  | 'COURIER_BOAT'
  | 'COURIER_AIR';

export type PaymentSubCategory = 
  | 'API_INTEGRATION'
  | 'ACCREDITED_ENTERPRISE'
  | 'TRANSFER_AGENCY'
  | 'APPROVED_AGENT'
  | 'FINTECH'
  | 'B2B_PAYMENTS';

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
  entityNature: EntityNature;
  moduleServices: string[];
  serviceNote?: string;
  commerceFocus?: string;
  logisticsOperationMode?: LogisticsOperationMode;
  paymentRole?: PaymentRole;
  primaryMarket?: string;
  expectedVolume?: string;
  commerceCompliance?: CommerceCompliance | null;
  nationalAgencyCompliance?: NationalAgencyCompliance;

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

export interface NationalAgencyCompliance {
  coveredCities?: string;
  transportModes?: string[];
  depotsAndBranches?: string;
  departureSchedule?: string;
  pricingGridSummary?: string;
  lossDelayDamagePolicy?: string;
  insuranceProvider?: string;
  verificationStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'CERTIFIED' | 'UNDER_WATCH' | 'SUSPENDED';
  reliabilityScore: number;
  requiredDocuments: string[];
  verificationMethods: string[];
  contractAccepted: boolean;
  trackingCommitmentAccepted: boolean;
  suspensionRulesAccepted: boolean;
}

export interface CommerceCompliance {
  verifiedSellerRequested: boolean;
  supplierProfile?: 'seller' | 'supplier' | 'wholesaler' | 'producer' | 'retailer';
  requiredDocuments: string[];
  contractAccepted: boolean;
  fiscalRulesAccepted: boolean;
  customsRulesAccepted: boolean;
  operationControls: string[];
}

export interface BusinessProfile extends BusinessRequestData {
  businessId: string;
  isActive: boolean;
}

export interface BusinessFormState {
  businessName: string;
  entityNature: EntityNature | '';
  type: BusinessType | '';
  subCategory: string;
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  moduleServices: string[];
  serviceNote: string;
  commerceFocus?: string;
  logisticsOperationMode?: LogisticsOperationMode | '';
  paymentRole?: PaymentRole | '';
  primaryMarket?: string;
  expectedVolume?: string;
  apiCallbackUrl?: string;
  commerceCompliance: CommerceCompliance;
  nationalAgencyCompliance: NationalAgencyCompliance;
  documents: {
    idCard: File | null;
    taxDocument: File | null;
    businessLicense: File | null;
    bankStatement: File | null;
  };
}
