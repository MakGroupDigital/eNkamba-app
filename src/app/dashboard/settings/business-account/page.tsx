'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Upload, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBusinessAccount } from '@/hooks/useBusinessAccount';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { BusinessStatusCard } from '@/components/business/business-status-card';
import { getBusinessDashboardPath } from '@/lib/business-routing';
import {
  BusinessFormState,
  BusinessType,
  EntityNature,
  LogisticsOperationMode,
  PaymentRole,
} from '@/types/business-account.types';

const STEPS = [
  { id: 'identity', title: 'Identité & statut' },
  { id: 'modules', title: 'Modules & services' },
  { id: 'contacts', title: 'Coordonnées & présence' },
  { id: 'security', title: 'KYC & documents' },
];

const ENTITY_TYPES: { value: EntityNature; label: string; description: string }[] = [
  {
    value: 'CORPORATE',
    label: 'Entreprise structurée',
    description: 'SA, SARL, SAS ou holding multi-modules.',
  },
  {
    value: 'INDIVIDUAL_BUSINESS',
    label: 'Entreprise individuelle',
    description: 'Macrocommerçant ou microsociété opérant seul.',
  },
  {
    value: 'LEGAL_ENTITY',
    label: 'Personne morale (ONG / coop.)',
    description: 'Structure associative, coopérative ou institutionnelle.',
  },
  {
    value: 'PERSONAL',
    label: 'Personne physique',
    description: 'Professionnel libéral, agent relais ou standalone business.',
  },
];

const BUSINESS_MODULES: { value: BusinessType; label: string; description: string }[] = [
  {
    value: 'COMMERCE',
    label: 'Commerce & e-commerce (Nkampa)',
    description: 'Catalogue, commandes, marketing et conversations vendeur/client.',
  },
  {
    value: 'LOGISTICS',
    label: 'Logistique & livraison',
    description: 'Flotte, suivi des colis, agents relais et services terrain.',
  },
  {
    value: 'PAYMENT',
    label: 'Paiement & fintech (Mbongo)',
    description: 'API, reporting, balance et supervision des agents financiers.',
  },
];

const SUBCATEGORY_MAP: Record<BusinessType, { value: string; label: string }[]> = {
  COMMERCE: [
    { value: 'WHOLESALE', label: 'Vente en gros (B2B)' },
    { value: 'RETAIL', label: 'Détail & distribution (B2C)' },
    { value: 'EQUIPMENT_PRODUCER', label: 'Producteur d’équipements' },
    { value: 'PRODUCT_PRODUCER', label: 'Fabricant de biens' },
    { value: 'FOOD_SUPPLY', label: 'Produits alimentaires' },
    { value: 'BIO_PRODUCTS', label: 'Produits bio & fermiers' },
    { value: 'DIGITAL_SERVICES', label: 'Services numériques & digitaux' },
    { value: 'SERVICES', label: 'Services spécialisés (santé, formation, etc.)' },
  ],
  LOGISTICS: [
    { value: 'RELAY', label: 'Point relais client / dépôt de proximité' },
    { value: 'RELAY_AGENT', label: 'Agent relais terrain / kiosque mobile' },
    { value: 'LOCAL_AGENCY', label: 'Agence locale de livraison' },
    { value: 'TRANSPORT_COMPANY', label: 'Entreprise de transport & flotte' },
    { value: 'NATIONAL_AGENCY', label: 'Agence de transport national' },
    { value: 'INTERNATIONAL_AGENCY', label: 'Agence logistique internationale' },
    { value: 'WAREHOUSE_HUB', label: 'Entrepôt / hub / dépôt' },
    { value: 'LAST_MILE', label: 'Last-mile manager & agents de proximité' },
    { value: 'COURIER_FOOT', label: 'Livreur piéton' },
    { value: 'COURIER_BIKE', label: 'Livreur vélo' },
    { value: 'COURIER_MOTORBIKE', label: 'Livreur moto' },
    { value: 'COURIER_CAR', label: 'Livreur voiture' },
    { value: 'COURIER_TRUCK', label: 'Livreur camion' },
    { value: 'COURIER_TRAIN', label: 'Transporteur train' },
    { value: 'COURIER_BOAT', label: 'Transporteur bateau' },
    { value: 'COURIER_AIR', label: 'Transporteur avion' },
  ],
  PAYMENT: [
    { value: 'API_INTEGRATION', label: 'Intégration API / plateforme' },
    { value: 'ACCREDITED_ENTERPRISE', label: 'Entreprise accréditée (collecte & cash-in)' },
    { value: 'TRANSFER_AGENCY', label: 'Agence de transfert d’argent POS' },
    { value: 'APPROVED_AGENT', label: 'Agent agréé / super-agent' },
    { value: 'FINTECH', label: 'Fintech & institution financière' },
    { value: 'B2B_PAYMENTS', label: 'Paiements B2B, facturation, paie' },
  ],
};

const SUBCATEGORY_TIPS: Record<string, string> = {
  FOOD_SUPPLY:
    'Interface commerce + logistique pour produits alimentaires (lots, dates péremption, tracing).',
  BIO_PRODUCTS: 'Accès à des modules bio et traçabilité, dashboards Nkampa Bio et listes de certification.',
  RELAY_AGENT: 'Flux inspiré de l’agent relais (KYC, mode d’exploitation, géolocalisation).',
  TRANSFER_AGENCY: 'Dashboard paiement agence: envoi, paiement bénéficiaire, caisse POS, reçus, commissions et audit.',
  LOCAL_AGENCY: 'Dashboard agence locale: missions, flotte, tarifs rapides et suivi urbain.',
  NATIONAL_AGENCY: 'Dashboard inter-ville avec dépôts, transferts, hubs et réseau national.',
  INTERNATIONAL_AGENCY: 'Dashboard cross-border avec douane, partenaires et tracking multi-pays.',
  WAREHOUSE_HUB: 'Dashboard dépôt: stock, réception colis, scans, remises et inventaires.',
  LAST_MILE: 'Dashboard supervision last-mile avec agents proches, affectation et SLA.',
  COURIER_FOOT: 'Profil livreur piéton avec missions légères, ETA court et zone GPS réduite.',
  COURIER_BIKE: 'Profil coursier vélo pour courses express et petits colis urbains.',
  COURIER_MOTORBIKE: 'Profil livreur moto pour express urbain et peri-urbain.',
  COURIER_CAR: 'Profil livreur voiture pour tournées urbaines, colis moyens et pickups.',
  COURIER_TRUCK: 'Profil camion pour volumes lourds, hubs et grandes liaisons.',
  COURIER_TRAIN: 'Profil ferroviaire pour flux inter-ville et lots consolidés.',
  COURIER_BOAT: 'Profil fluvial pour trafic volumineux et longues distances.',
  COURIER_AIR: 'Profil aérien pour urgent, premium et international.',
  API_INTEGRATION: 'Accès prioritaire aux clés API, webhooks et sandbox Mbongo.',
};

const MODULE_OVERVIEW: Record<BusinessType, { title: string; description: string; features: string[] }> = {
  COMMERCE: {
    title: 'Commerce (Nkampa)',
    description: 'Catalogue, commandes, marketing et conversations dynamiques pour vos clients.',
    features: [
      'Catalogue multi-catégories, produits physiques & services numériques.',
      'Gestion des commandes, paiements et notifications avec les vendeurs.',
      'Promotions, programmes de fidélité et marketing intégré.',
      'Vue B2B/B2C avec alertes de stock et conversations instantanées.',
    ],
  },
  LOGISTICS: {
    title: 'Logistique & relais',
    description: 'Flotte, suivi colis, agents relais et scanner QR (Dashboard Logistique).',
    features: [
      'Profils séparés pour relais, livreurs, agences locales, nationales et internationales.',
      'Tracking des colis, départ/destination, scans QR et statut temps réel.',
      'Affectation des missions, flotte, hubs, dépôts et zones GPS.',
      'Paiement, commissions, alertes opérationnelles et validation admin avant activation.',
    ],
  },
  PAYMENT: {
    title: 'Paiement & fintech',
    description: 'API, rapports, wallets et supervision des agents (Dashboard Paiement).',
    features: [
      'Vue d’ensemble des volumes, transactions et taux de succès.',
      'Clés API / webhooks, environnement live & sandbox.',
      'Historique des transactions, commissions et soldes.',
      'Agents agréés, plafonds, et reporting des commissions.',
    ],
  },
};

const SERVICE_CATALOG: Record<BusinessType, { id: string; label: string; description: string }[]> = {
  COMMERCE: [
    {
      id: 'catalogue',
      label: 'Catalogue & inventaire',
      description: 'Publiez vos familles de produits (alimentaire, tech, services) sur Nkampa.',
    },
    {
      id: 'orders',
      label: 'Commandes & fulfillment',
      description: 'Coordonnez commandes, logistique et points relais pour chaque commande.',
    },
    {
      id: 'marketing',
      label: 'Marketing & promotions',
      description: 'Coupons, campagnes, notifications et offres ciblées sur Nkampa.',
    },
    {
      id: 'omnichannel',
      label: 'Commerce omnicanal',
      description: 'Couple Commerce + Logistique pour livraison & retrait en point relais.',
    },
  ],
  LOGISTICS: [
    {
      id: 'fleet',
      label: 'Flotte, livreurs & moyens de transport',
      description: 'Ajoutez véhicules, chauffeurs, agents terrain et moyens multimodaux.',
    },
    {
      id: 'tracking',
      label: 'Tracking colis & QR',
      description: 'Reliez chaque colis à un scanner QR et suivez-le en temps réel.',
    },
    {
      id: 'relay',
      label: 'Agents relais, agences & points de service',
      description: 'Points de dépôt, cabine, hub, agence ou kiosque avec KYC et horaires.',
    },
    {
      id: 'warehouse',
      label: 'Hub, stockage & international',
      description: 'Gestion de stock, dépôts, routes nationales et passages internationaux.',
    },
  ],
  PAYMENT: [
    {
      id: 'pos-transfer-agency',
      label: 'Transfert POS agence',
      description: 'Création d’agence, caisse POS, code bénéficiaire, paiement et audit.',
    },
    {
      id: 'api',
      label: 'API & webhooks',
      description: 'Intégration via clés publiques/privées et gestion des webhooks.',
    },
    {
      id: 'transactions',
      label: 'Transactions & reporting',
      description: 'Suivi des dépôts, retraits, volumes et taux de réussite.',
    },
    {
      id: 'agents',
      label: 'Agents & wallets',
      description: 'Agents relais, cabinistes et supervision des commissions.',
    },
    {
      id: 'limits',
      label: 'Soldes & plafonds',
      description: 'Solde business, plafonds journaliers et profils de risque.',
    },
  ],
};

const LOGISTICS_MODES: { value: LogisticsOperationMode; label: string }[] = [
  { value: 'FIXED', label: 'Fixe (boutique, kiosque)' },
  { value: 'MOBILE', label: 'Mobile (camion, chariot, agent itinérant)' },
  { value: 'HYBRID', label: 'Mixte (fixe + mobile)' },
];

const PAYMENT_ROLES: { value: PaymentRole; label: string }[] = [
  { value: 'INTEGRATOR', label: 'Intégrateur API' },
  { value: 'AGENT', label: 'Agent agréé / relais' },
  { value: 'FINTECH_PARTNER', label: 'Plateforme fintech ou institution' },
];

const TRANSFER_AGENCY_CREATION_STEPS = [
  'Informations générales',
  'Documents légaux',
  'Adresse du siège',
  'Paramètres financiers',
  'Vérification et activation',
];

const TRANSFER_AGENCY_REQUIRED_DOCUMENTS = [
  'RCCM ou document d’existence légale',
  'ID Nat / numéro fiscal',
  'Pièce d’identité du responsable légal',
  'Autorisation d’agence de transfert ou activité financière',
  'Adresse vérifiable du siège',
  'Justificatif compte bancaire ou wallet de règlement',
  'Contrat eNKAMBA Pay signé',
];

const TRANSFER_AGENCY_PAYOUT_MODES = [
  'Cash-in',
  'Cash-out',
  'Paiement bénéficiaire par code',
  'Transfert inter-agence',
  'Reçu imprimé',
  'Audit POS',
];

const TRANSFER_AGENCY_CURRENCIES = ['USD', 'CDF', 'EUR', 'RMB'];

function generateTransferAgencyCode(city: string) {
  const cityCode = (city || 'KIN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `AG-${cityCode}-001`;
}

const NATIONAL_AGENCY_REQUIRED_DOCUMENTS = [
  'RCCM ou document d’existence légale',
  'ID Nat / numéro fiscal',
  'Autorisation d’exploitation ou licence de transport',
  'Adresse physique de l’agence principale',
  'Adresses des dépôts ou agences secondaires',
  'Pièce d’identité du responsable légal',
  'Photos du bureau, dépôt, véhicules ou espace colis',
  'Liste des villes/provinces desservies',
  'Liste des moyens de transport disponibles',
  'Assurance transport ou responsabilité civile',
  'Grille tarifaire',
  'Horaires de départ et d’arrivée',
  'Politique perte, retard ou colis endommagé',
];

const NATIONAL_AGENCY_VERIFICATION_METHODS = [
  'Appel vidéo',
  'Visite terrain',
  'Photos géolocalisées',
  'Contrôle par agent eNKAMBA local',
  'Test colis pilote',
];

const NATIONAL_AGENCY_BADGES = [
  'Agence vérifiée',
  'Adresse confirmée',
  'Transport assuré',
  'Tracking actif',
  'Certifiée eNKAMBA',
  'Agence Premium',
  'Sous observation',
];

const NATIONAL_AGENCY_TRACKING_STEPS = [
  'Colis enregistré',
  'Colis déposé à l’agence de départ',
  'Colis chargé dans le véhicule',
  'Colis en transit',
  'Colis arrivé dans la ville de destination',
  'Colis reçu par l’agence d’arrivée',
  'Colis disponible pour retrait',
  'Colis remis au livreur local',
  'Colis livré au destinataire',
];

const COMMERCE_REQUIRED_DOCUMENTS = [
  'Pièce d’identité du responsable',
  'RCCM ou document d’existence légale',
  'Document fiscal / NIF',
  'Contrat vendeur ou fournisseur eNkamba',
  'Traçabilité produit ou fiche fournisseur',
  'Déclaration douanière si import/export',
];

const COMMERCE_OPERATION_CONTROLS = [
  'Facture automatique',
  'Stock contrôlé',
  'Paiement traçable',
  'Remboursement contrôlé',
  'Audit commande',
  'Contrôle douane si nécessaire',
];

const COMMERCE_CUSTOMS_SUBCATEGORIES = new Set([
  'WHOLESALE',
  'EQUIPMENT_PRODUCER',
  'PRODUCT_PRODUCER',
  'FOOD_SUPPLY',
  'BIO_PRODUCTS',
]);

const LOGISTICS_ROLE_PRESETS: Record<string, { title: string; badge: string; dashboard: string; capabilities: string[] }> = {
  RELAY: {
    title: 'Point relais Ugavi',
    badge: 'Relais',
    dashboard: 'Réception, enregistrement, QR, remise colis et paiements.',
    capabilities: ['Réception colis', 'Enregistrement colis', 'Impression ticket QR', 'Recherche livreur dans le rayon'],
  },
  RELAY_AGENT: {
    title: 'Agent relais terrain',
    badge: 'Agent',
    dashboard: 'Point mobile avec retrait, encaissement, remise et scans.',
    capabilities: ['Scans terrain', 'Encaissement', 'Remise colis', 'Affectation proximité'],
  },
  LOCAL_AGENCY: {
    title: 'Agence locale',
    badge: 'Agence',
    dashboard: 'Missions locales, flotte urbaine, dispatch et SLA.',
    capabilities: ['Gestion livreurs', 'Affectation missions', 'Prix instantané', 'Suivi des tournées'],
  },
  TRANSPORT_COMPANY: {
    title: 'Entreprise transport',
    badge: 'Flotte',
    dashboard: 'Flotte multi-véhicules, lignes régulières et hubs.',
    capabilities: ['Flotte', 'Chauffeurs', 'Planification routes', 'Reporting activité'],
  },
  NATIONAL_AGENCY: {
    title: 'Agence nationale',
    badge: 'National',
    dashboard: 'Inter-ville, dépôts, contrats, tracking obligatoire et fiabilité contrôlée.',
    capabilities: ['Documents légaux', 'Contrat eNKAMBA', 'Tracking national obligatoire', 'Score fiabilité', 'Suspension automatique'],
  },
  INTERNATIONAL_AGENCY: {
    title: 'Agence internationale',
    badge: 'International',
    dashboard: 'Cross-border, partenaires, douane et tracking multi-pays.',
    capabilities: ['Flux internationaux', 'Douane', 'Partenaires', 'Suivi multi-pays'],
  },
  WAREHOUSE_HUB: {
    title: 'Hub / entrepôt',
    badge: 'Hub',
    dashboard: 'Stockage, scanning, tri et dispatch.',
    capabilities: ['Inventaire', 'Réception', 'Dispatch', 'Contrôle de stock'],
  },
  LAST_MILE: {
    title: 'Coordination last-mile',
    badge: 'Last-mile',
    dashboard: 'Pilotage des agents proches, ETA et missions finales.',
    capabilities: ['Dispatch rapide', 'ETA', 'Zones GPS', 'Suivi de performance'],
  },
  COURIER_FOOT: {
    title: 'Livreur piéton',
    badge: 'Piéton',
    dashboard: 'Missions légères, proximité et express urbain.',
    capabilities: ['Missions proches', 'Express léger', 'Zone piétonne', 'Historique de courses'],
  },
  COURIER_BIKE: {
    title: 'Livreur vélo',
    badge: 'Vélo',
    dashboard: 'Trajets rapides, coût faible et petits colis.',
    capabilities: ['Courses express', 'Petits colis', 'Zone urbaine', 'Disponibilité live'],
  },
  COURIER_MOTORBIKE: {
    title: 'Livreur moto',
    badge: 'Moto',
    dashboard: 'Express principal pour la ville et peri-urbain.',
    capabilities: ['Courses urgentes', 'Colis moyens', 'Acceptation mission', 'Disponibilité live'],
  },
  COURIER_CAR: {
    title: 'Livreur voiture',
    badge: 'Voiture',
    dashboard: 'Parcours urbains, suburbains et pickups multiples.',
    capabilities: ['Tournées multiples', 'Pickups', 'Colis moyens', 'Navigation GPS'],
  },
  COURIER_TRUCK: {
    title: 'Livreur camion',
    badge: 'Camion',
    dashboard: 'Volumes lourds, hubs et longues liaisons.',
    capabilities: ['Charges lourdes', 'Liaisons longues', 'Capacité kg', 'Affectation dépôt'],
  },
  COURIER_TRAIN: {
    title: 'Transporteur train',
    badge: 'Train',
    dashboard: 'Flux inter-ville lourds et lots consolidés.',
    capabilities: ['Lots consolidés', 'Inter-ville', 'Hubs ferroviaires', 'Suivi de rame'],
  },
  COURIER_BOAT: {
    title: 'Transporteur bateau',
    badge: 'Bateau',
    dashboard: 'Trafic fluvial et volumineux.',
    capabilities: ['Trajets fluviaux', 'Volume élevé', 'Ports / quais', 'Suivi embarquement'],
  },
  COURIER_AIR: {
    title: 'Transporteur avion',
    badge: 'Avion',
    dashboard: 'Urgent premium et international.',
    capabilities: ['Express premium', 'Longue distance', 'Aéroport', 'Suivi cargo'],
  },
};

const KYC_CHECKS = [
  'Selfie live + vidéo courte et vérification faciale.',
  'OCR des pièces d’identité, détection de faux documents et expiration.',
  'OTP SMS + validation du numéro et de la SIM.',
  'GPS en temps réel et cohérence adresse déclarée.',
  'Score de risque automatique (faible / moyen / élevé / critique).',
];

const ANTI_FRAUD_RULES = [
  'Blocage des documents ou selfies déjà utilisés.',
  'Détection d’appareils partagés, rootés ou suspects.',
  'Blacklist interne, relance vidéo ou visite terrain pour les dossiers critiques.',
];

const SECURITY_MEASURES = [
  'Chiffrement des données au repos et en transit avec watermark.',
  'Logs immuables, journaux d’audit et séparation des rôles (admin / conformité).',
  'Double validation pour dossiers à risque élevé.',
  'Blocage automatique sur activités inhabituelles (volume, localisation, appareil).',
];

const IDENTIFICATION_FLOW = [
  'Création du dossier : téléphone, nom, zone et OTP.',
  'Formulaire dynamique : personne physique/morale, agent fixe/mobile.',
  'Upload sécurisé : pièces, selfie, photos du site, contrat.',
  'Vérification automatique : identité, selfie, GPS, appareils et doublons.',
  'Scoring de risque : automatique puis revue humaine.',
  'Contrôles complémentaires : appel vocal, vidéo selfie, visite terrain.',
  'Activation graduelle : plafonds, surveillance et journal d’activité.',
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
          <CheckCircle2 size={16} />
          Vérifié
        </div>
      );
    case 'PENDING':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
          <Clock size={16} />
          En attente
        </div>
      );
    case 'REJECTED':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
          <AlertCircle size={16} />
          Rejeté
        </div>
      );
    default:
      return null;
  }
}

function UgaviBusinessIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ugaviBizGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#009058" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <path d="M10 13L24 6L38 13V23C38 31.5 32.2 39.1 24 42C15.8 39.1 10 31.5 10 23V13Z" fill="url(#ugaviBizGrad)" />
      <path d="M17 24L22 29L31 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 16H34" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export default function BusinessAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { businessRequest, isLoading, isSubmitting, submitBusinessRequest } = useBusinessAccount();
  const { businessUser, isLoading: isBusinessStatusLoading } = useBusinessStatus();

  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BusinessFormState>({
    businessName: '',
    entityNature: '',
    type: '',
    subCategory: '',
    registrationNumber: '',
    address: '',
    city: '',
    country: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    moduleServices: [],
    serviceNote: '',
    commerceFocus: '',
    logisticsOperationMode: '',
    paymentRole: '',
    primaryMarket: '',
    expectedVolume: '',
    apiCallbackUrl: '',
    commerceCompliance: {
      verifiedSellerRequested: true,
      supplierProfile: 'seller',
      requiredDocuments: COMMERCE_REQUIRED_DOCUMENTS,
      contractAccepted: false,
      fiscalRulesAccepted: false,
      customsRulesAccepted: false,
      operationControls: COMMERCE_OPERATION_CONTROLS,
    },
    nationalAgencyCompliance: {
      coveredCities: '',
      transportModes: [],
      depotsAndBranches: '',
      departureSchedule: '',
      pricingGridSummary: '',
      lossDelayDamagePolicy: '',
      insuranceProvider: '',
      verificationStatus: 'PENDING',
      reliabilityScore: 0,
      requiredDocuments: NATIONAL_AGENCY_REQUIRED_DOCUMENTS,
      verificationMethods: [],
      contractAccepted: false,
      trackingCommitmentAccepted: false,
      suspensionRulesAccepted: false,
    },
    transferAgencyCompliance: {
      agencyCode: 'AG-KIN-001',
      legalDocuments: TRANSFER_AGENCY_REQUIRED_DOCUMENTS,
      headOfficeConfirmed: false,
      settlementWallet: '',
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'CDF'],
      openingCashFloat: '',
      dailyTransactionLimit: '',
      commissionRate: '3',
      payoutModes: ['Cash-in', 'Cash-out', 'Paiement bénéficiaire par code'],
      verificationStatus: 'PENDING',
      contractAccepted: false,
      auditAccepted: false,
      activationAccepted: false,
    },
    documents: {
      idCard: null,
      taxDocument: null,
      businessLicense: null,
      bankStatement: null,
    },
  });

  useEffect(() => {
    if (businessRequest) {
      setShowForm(false);
    }
  }, [businessRequest]);

  useEffect(() => {
    if (isLoading || isBusinessStatusLoading) return;
    if (businessUser?.status === 'APPROVED') {
      router.replace(getBusinessDashboardPath(businessUser.businessType));
    }
  }, [businessUser?.businessType, businessUser?.status, isBusinessStatusLoading, isLoading, router]);

  const selectedEntityType = ENTITY_TYPES.find(type => type.value === formData.entityNature);
  const moduleOverview = formData.type ? MODULE_OVERVIEW[formData.type] : null;
  const serviceOptions = formData.type ? SERVICE_CATALOG[formData.type] : [];
  const logisticsRolePreset = formData.type === 'LOGISTICS' ? LOGISTICS_ROLE_PRESETS[formData.subCategory] : null;

  const handleInputChange = (field: keyof BusinessFormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        subCategory: '',
        logisticsOperationMode: '',
        paymentRole: '',
        moduleServices: [],
      }));
    }

    if (field === 'subCategory' && value === 'TRANSFER_AGENCY') {
      setFormData(prev => ({
        ...prev,
        paymentRole: 'AGENT',
        moduleServices: prev.moduleServices.includes('pos-transfer-agency')
          ? prev.moduleServices
          : ['pos-transfer-agency', ...prev.moduleServices],
        transferAgencyCompliance: {
          ...prev.transferAgencyCompliance,
          agencyCode: generateTransferAgencyCode(prev.city),
        },
      }));
    }

    if (field === 'city') {
      setFormData(prev => ({
        ...prev,
        transferAgencyCompliance: {
          ...prev.transferAgencyCompliance,
          agencyCode: generateTransferAgencyCode(value),
        },
      }));
    }
  };

  const handleFileChange = (docType: keyof BusinessFormState['documents'], file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: file,
      },
    }));
  };

  const handleNationalAgencyComplianceChange = (
    field: keyof BusinessFormState['nationalAgencyCompliance'],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      nationalAgencyCompliance: {
        ...prev.nationalAgencyCompliance,
        [field]: value,
      },
    }));
  };

  const handleCommerceComplianceChange = (
    field: keyof BusinessFormState['commerceCompliance'],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      commerceCompliance: {
        ...prev.commerceCompliance,
        [field]: value,
      },
    }));
  };

  const handleTransferAgencyComplianceChange = (
    field: keyof BusinessFormState['transferAgencyCompliance'],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      transferAgencyCompliance: {
        ...prev.transferAgencyCompliance,
        [field]: value,
      },
    }));
  };

  const toggleTransferAgencyArrayValue = (
    field: 'supportedCurrencies' | 'payoutModes',
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev.transferAgencyCompliance[field] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        transferAgencyCompliance: {
          ...prev.transferAgencyCompliance,
          [field]: next,
        },
      };
    });
  };

  const toggleNationalAgencyArrayValue = (
    field: 'transportModes' | 'verificationMethods',
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev.nationalAgencyCompliance[field] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        nationalAgencyCompliance: {
          ...prev.nationalAgencyCompliance,
          [field]: next,
        },
      };
    });
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => {
      const services = prev.moduleServices.includes(serviceId)
        ? prev.moduleServices.filter(id => id !== serviceId)
        : [...prev.moduleServices, serviceId];
      return { ...prev, moduleServices: services };
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.businessName.trim()) {
          toast({ variant: 'destructive', title: 'Nom requis', description: 'Donnez un nom pour votre activité.' });
          return false;
        }
        if (!formData.entityNature) {
          toast({ variant: 'destructive', title: 'Profil manquant', description: 'Choisissez la nature juridique ou opérationnelle.' });
          return false;
        }
        return true;
      case 1:
        if (!formData.type) {
          toast({ variant: 'destructive', title: 'Module requis', description: 'Sélectionnez un module principal.' });
          return false;
        }
        if (!formData.subCategory) {
          toast({ variant: 'destructive', title: 'Sous-catégorie', description: 'Choisissez la sous-catégorie la plus proche.' });
          return false;
        }
        if (formData.moduleServices.length === 0) {
          toast({ variant: 'destructive', title: 'Services attendus', description: 'Sélectionnez au moins un service que vous souhaitez activer.' });
          return false;
        }
        if (!formData.serviceNote.trim()) {
          toast({ variant: 'destructive', title: 'Description', description: 'Expliquez les services que vous offrez et ce que les utilisateurs attendent.' });
          return false;
        }
        if (formData.type === 'LOGISTICS' && !formData.logisticsOperationMode) {
          toast({ variant: 'destructive', title: 'Mode d’exploitation', description: 'Indiquez si vous travaillez en fixe, mobile ou mixte.' });
          return false;
        }
        if (formData.type === 'COMMERCE') {
          const commerce = formData.commerceCompliance;
          const needsCustoms = COMMERCE_CUSTOMS_SUBCATEGORIES.has(formData.subCategory);
          if (!commerce.contractAccepted || !commerce.fiscalRulesAccepted || (needsCustoms && !commerce.customsRulesAccepted)) {
            toast({
              variant: 'destructive',
              title: 'Conformité Marché',
              description: needsCustoms
                ? 'Acceptez le contrat, la facturation fiscale et le contrôle douane/traçabilité.'
                : 'Acceptez le contrat vendeur et les règles fiscales.',
            });
            return false;
          }
        }
        if (formData.type === 'LOGISTICS' && formData.subCategory === 'NATIONAL_AGENCY') {
          const national = formData.nationalAgencyCompliance;
          if (!national.coveredCities?.trim() || !national.depotsAndBranches?.trim() || (national.transportModes ?? []).length === 0) {
            toast({
              variant: 'destructive',
              title: 'Fiabilité agence nationale',
              description: 'Indiquez les villes couvertes, dépôts/agences et moyens de transport.',
            });
            return false;
          }
          if (!national.contractAccepted || !national.trackingCommitmentAccepted || !national.suspensionRulesAccepted) {
            toast({
              variant: 'destructive',
              title: 'Engagements obligatoires',
              description: 'Acceptez le contrat, le tracking obligatoire et les règles de suspension.',
            });
            return false;
          }
        }
        if (formData.type === 'PAYMENT' && !formData.paymentRole) {
          toast({ variant: 'destructive', title: 'Rôle', description: 'Précisez si vous êtes intégrateur, agent agréé ou plateforme fintech.' });
          return false;
        }
        if (formData.type === 'PAYMENT' && formData.subCategory === 'TRANSFER_AGENCY') {
          const agency = formData.transferAgencyCompliance;
          if (!agency.defaultCurrency || agency.supportedCurrencies.length === 0 || !agency.openingCashFloat.trim() || !agency.dailyTransactionLimit.trim() || !agency.settlementWallet.trim()) {
            toast({
              variant: 'destructive',
              title: 'Paramètres agence requis',
              description: 'Renseignez devise, caisse initiale, plafond journalier et wallet de règlement.',
            });
            return false;
          }
          if (!agency.contractAccepted || !agency.auditAccepted || !agency.activationAccepted) {
            toast({
              variant: 'destructive',
              title: 'Activation agence',
              description: 'Acceptez le contrat, l’audit POS et la vérification avant activation.',
            });
            return false;
          }
        }
        return true;
      case 2:
        if (!formData.registrationNumber.trim()) {
          toast({ variant: 'destructive', title: 'Numéro d’enregistrement', description: 'Capturez le RCCM, NIF, or autre référence officielle.' });
          return false;
        }
        if (!formData.address.trim()) {
          toast({ variant: 'destructive', title: 'Adresse', description: 'Donnez l’adresse complète du siège ou du point d’exploitation.' });
          return false;
        }
        if (!formData.city.trim()) {
          toast({ variant: 'destructive', title: 'Ville', description: 'Indiquez la ville principale d’opération.' });
          return false;
        }
        if (!formData.country.trim()) {
          toast({ variant: 'destructive', title: 'Pays', description: 'Sélectionnez le pays d’activité principal.' });
          return false;
        }
        if (!formData.contactEmail.trim()) {
          toast({ variant: 'destructive', title: 'Email', description: 'Un email professionnel permet de recevoir les notifications.' });
          return false;
        }
        if (!formData.contactPhone.trim()) {
          toast({ variant: 'destructive', title: 'Téléphone', description: 'Le numéro principal servira pour l’OTP et le support.' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const validateForm = (): boolean => {
    for (let step = 0; step < STEPS.length; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      await submitBusinessRequest(formData);
      toast({ title: 'Succès', description: 'Votre demande a été soumise avec succès.' });
      setShowForm(false);
      setCurrentStep(0);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error?.message || 'Impossible d’envoyer la demande.' });
    }
  };

  if (isLoading || isBusinessStatusLoading || businessUser?.status === 'APPROVED') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'identity':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profil & identité</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="businessName">Nom d’activité *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Nom commercial ou raison sociale"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="entityNature">Type de profil *</Label>
                <Select
                  value={formData.entityNature}
                  onValueChange={(value) => handleInputChange('entityNature', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="entityNature">
                    <SelectValue placeholder="Choisissez un profil" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEntityType && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedEntityType.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'modules':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Modules & services</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Module principal *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Choisissez un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_MODULES.map((module) => (
                      <SelectItem key={module.value} value={module.value}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subCategory">Sous-catégorie *</Label>
                <Select
                  value={formData.subCategory}
                  onValueChange={(value) => handleInputChange('subCategory', value)}
                  disabled={isSubmitting || !formData.type}
                >
                  <SelectTrigger id="subCategory">
                    <SelectValue placeholder="Choisissez une sous-catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type &&
                      SUBCATEGORY_MAP[formData.type].map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.subCategory && SUBCATEGORY_TIPS[formData.subCategory] && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {SUBCATEGORY_TIPS[formData.subCategory]}
                  </p>
                )}
              </div>
            </div>
            {formData.type === 'COMMERCE' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="commerceFocus">Focus produit/service</Label>
                  <Input
                    id="commerceFocus"
                    value={formData.commerceFocus}
                    onChange={(e) => handleInputChange('commerceFocus', e.target.value)}
                    placeholder="Ex : produits alimentaires bio, équipements logistiques..."
                    disabled={isSubmitting}
                  />
                </div>

                <div className="rounded-2xl border border-primary/20 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">Conformité Marché</p>
                      <h4 className="text-lg font-bold text-slate-900">Vendeur, fournisseur et opérations contrôlées</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Les commandes Marché conservent facture, stock, paiement traçable, remboursement et contrôle fiscal/douane si nécessaire.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                      <Checkbox
                        checked={formData.commerceCompliance.verifiedSellerRequested}
                        onCheckedChange={(checked) => handleCommerceComplianceChange('verifiedSellerRequested', Boolean(checked))}
                        disabled={isSubmitting}
                      />
                      Demander badge vérifié
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-900">Documents attendus</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {COMMERCE_REQUIRED_DOCUMENTS.map((document) => (
                          <li key={document}>{document}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-900">Contrôle des opérations</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMERCE_OPERATION_CONTROLS.map((control) => (
                          <span key={control} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            {control}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                      <Checkbox
                        checked={formData.commerceCompliance.contractAccepted}
                        onCheckedChange={(checked) => handleCommerceComplianceChange('contractAccepted', Boolean(checked))}
                        disabled={isSubmitting}
                      />
                      <span>Contrat vendeur/fournisseur requis avant validation</span>
                    </label>
                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                      <Checkbox
                        checked={formData.commerceCompliance.fiscalRulesAccepted}
                        onCheckedChange={(checked) => handleCommerceComplianceChange('fiscalRulesAccepted', Boolean(checked))}
                        disabled={isSubmitting}
                      />
                      <span>Facturation et fiscalité enregistrées pour chaque vente</span>
                    </label>
                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                      <Checkbox
                        checked={formData.commerceCompliance.customsRulesAccepted}
                        onCheckedChange={(checked) => handleCommerceComplianceChange('customsRulesAccepted', Boolean(checked))}
                        disabled={isSubmitting}
                      />
                      <span>Traçabilité et douane pour gros, import/export ou fournisseur</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            {formData.type === 'LOGISTICS' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logisticsOperationMode">Mode d’exploitation *</Label>
                  <Select
                    value={formData.logisticsOperationMode}
                    onValueChange={(value) => handleInputChange('logisticsOperationMode', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="logisticsOperationMode">
                      <SelectValue placeholder="Choisissez le mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGISTICS_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {logisticsRolePreset && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{logisticsRolePreset.badge}</p>
                        <p className="text-lg font-bold text-slate-900">{logisticsRolePreset.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{logisticsRolePreset.dashboard}</p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                        Dashboard dédié après approbation
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {logisticsRolePreset.capabilities.map((capability) => (
                        <div key={capability} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-primary/20">
                          {capability}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {formData.subCategory === 'NATIONAL_AGENCY' && (
                  <div className="space-y-4 rounded-2xl border border-primary/20 bg-white p-4 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-primary">Vérification Agence Nationale</p>
                      <h4 className="text-lg font-bold text-slate-900">Fiabilité, contrat et tracking obligatoire</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Une agence nationale ne sera pas visible tant que les documents, l’adresse, l’assurance et le contrat ne sont pas validés par eNKAMBA.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="nationalCoveredCities">Villes / provinces desservies *</Label>
                        <Textarea
                          id="nationalCoveredCities"
                          value={formData.nationalAgencyCompliance.coveredCities || ''}
                          onChange={(event) => handleNationalAgencyComplianceChange('coveredCities', event.target.value)}
                          placeholder="Ex : Kinshasa, Lubumbashi, Kolwezi, Goma, Bukavu..."
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationalDepots">Dépôts et agences secondaires *</Label>
                        <Textarea
                          id="nationalDepots"
                          value={formData.nationalAgencyCompliance.depotsAndBranches || ''}
                          onChange={(event) => handleNationalAgencyComplianceChange('depotsAndBranches', event.target.value)}
                          placeholder="Adresses des dépôts, agences de départ et d’arrivée."
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationalSchedule">Horaires départ / arrivée</Label>
                        <Textarea
                          id="nationalSchedule"
                          value={formData.nationalAgencyCompliance.departureSchedule || ''}
                          onChange={(event) => handleNationalAgencyComplianceChange('departureSchedule', event.target.value)}
                          placeholder="Ex : départ Kinshasa lundi/jeudi 08h, arrivée Lubumbashi 48h."
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationalPricing">Grille tarifaire</Label>
                        <Textarea
                          id="nationalPricing"
                          value={formData.nationalAgencyCompliance.pricingGridSummary || ''}
                          onChange={(event) => handleNationalAgencyComplianceChange('pricingGridSummary', event.target.value)}
                          placeholder="Résumé des tarifs par kg, volume, ville ou moyen de transport."
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationalInsurance">Assurance / responsabilité civile</Label>
                        <Input
                          id="nationalInsurance"
                          value={formData.nationalAgencyCompliance.insuranceProvider || ''}
                          onChange={(event) => handleNationalAgencyComplianceChange('insuranceProvider', event.target.value)}
                          placeholder="Nom assureur, police ou couverture transport"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationalPolicy">Politique litige</Label>
                        <Textarea
                          id="nationalPolicy"
                          value={formData.nationalAgencyCompliance.lossDelayDamagePolicy || ''}
                          onChange={(event) => handleNationalAgencyComplianceChange('lossDelayDamagePolicy', event.target.value)}
                          placeholder="Perte, retard, colis endommagé, remboursement."
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Moyens de transport disponibles *</Label>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        {['Véhicule', 'Bus', 'Camion', 'Train', 'Bateau', 'Avion national'].map((mode) => (
                          <label key={mode} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                            <Checkbox
                              checked={(formData.nationalAgencyCompliance.transportModes ?? []).includes(mode)}
                              onCheckedChange={() => toggleNationalAgencyArrayValue('transportModes', mode)}
                              disabled={isSubmitting}
                            />
                            {mode}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Documents obligatoires</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                          {NATIONAL_AGENCY_REQUIRED_DOCUMENTS.map((document) => (
                            <li key={document}>{document}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Vérification avant activation</p>
                        <div className="space-y-2">
                          {NATIONAL_AGENCY_VERIFICATION_METHODS.map((method) => (
                            <label key={method} className="flex items-center gap-2 text-sm text-slate-700">
                              <Checkbox
                                checked={formData.nationalAgencyCompliance.verificationMethods.includes(method)}
                                onCheckedChange={() => toggleNationalAgencyArrayValue('verificationMethods', method)}
                                disabled={isSubmitting}
                              />
                              {method}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="mb-2 text-sm font-semibold text-primary">Tracking national obligatoire</p>
                      <div className="grid gap-2 md:grid-cols-3">
                        {NATIONAL_AGENCY_TRACKING_STEPS.map((step) => (
                          <div key={step} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                        <Checkbox
                          checked={formData.nationalAgencyCompliance.contractAccepted}
                          onCheckedChange={(checked) => handleNationalAgencyComplianceChange('contractAccepted', Boolean(checked))}
                          disabled={isSubmitting}
                        />
                        <span>Contrat eNKAMBA requis avant activation</span>
                      </label>
                      <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                        <Checkbox
                          checked={formData.nationalAgencyCompliance.trackingCommitmentAccepted}
                          onCheckedChange={(checked) => handleNationalAgencyComplianceChange('trackingCommitmentAccepted', Boolean(checked))}
                          disabled={isSubmitting}
                        />
                        <span>Aucun colis ne sort sans tracking, QR ou code-barres</span>
                      </label>
                      <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                        <Checkbox
                          checked={formData.nationalAgencyCompliance.suspensionRulesAccepted}
                          onCheckedChange={(checked) => handleNationalAgencyComplianceChange('suspensionRulesAccepted', Boolean(checked))}
                          disabled={isSubmitting}
                        />
                        <span>Suspension possible en cas de retards, pertes, plaintes ou documents expirés</span>
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">Score fiabilité initial</p>
                        <p className="mt-1 text-3xl font-black text-primary">0/100</p>
                        <p className="text-sm text-slate-600">Calculé après vérification documents, adresse, assurance, tracking et premières expéditions.</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Badges possibles après validation</p>
                        <div className="flex flex-wrap gap-2">
                          {NATIONAL_AGENCY_BADGES.map((badge) => (
                            <span key={badge} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {formData.type === 'PAYMENT' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="paymentRole">Rôle de paiement *</Label>
                    <Select
                      value={formData.paymentRole}
                      onValueChange={(value) => handleInputChange('paymentRole', value)}
                      disabled={isSubmitting || formData.subCategory === 'TRANSFER_AGENCY'}
                    >
                      <SelectTrigger id="paymentRole">
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="apiCallbackUrl">URL de callback API</Label>
                    <Input
                      id="apiCallbackUrl"
                      value={formData.apiCallbackUrl || ''}
                      onChange={(e) => handleInputChange('apiCallbackUrl', e.target.value)}
                      placeholder="https://mon-domaine.com/callback"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {formData.subCategory === 'TRANSFER_AGENCY' && (
                  <div className="space-y-4 rounded-2xl border border-primary/20 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">Création Agence</p>
                        <h4 className="text-lg font-bold text-slate-900">Compte agence de transfert d’argent</h4>
                        <p className="mt-1 text-sm text-slate-600">
                          Parcours en cinq étapes avec activation après vérification eNKAMBA Pay.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary px-4 py-2 text-center text-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Code agence</p>
                        <p className="text-lg font-black">{formData.transferAgencyCompliance.agencyCode}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-5">
                      {TRANSFER_AGENCY_CREATION_STEPS.map((step, index) => (
                        <div key={step} className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-white">
                            {index + 1}
                          </span>
                          <p className="mt-2 text-xs font-black text-slate-900">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Documents légaux demandés</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                          {TRANSFER_AGENCY_REQUIRED_DOCUMENTS.map((document) => (
                            <li key={document}>{document}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Activation</p>
                        <div className="space-y-2 text-sm text-slate-700">
                          <label className="flex items-start gap-2">
                            <Checkbox
                              checked={formData.transferAgencyCompliance.headOfficeConfirmed}
                              onCheckedChange={(checked) => handleTransferAgencyComplianceChange('headOfficeConfirmed', Boolean(checked))}
                              disabled={isSubmitting}
                            />
                            Adresse du siège vérifiable et accessible au public
                          </label>
                          <label className="flex items-start gap-2">
                            <Checkbox
                              checked={formData.transferAgencyCompliance.contractAccepted}
                              onCheckedChange={(checked) => handleTransferAgencyComplianceChange('contractAccepted', Boolean(checked))}
                              disabled={isSubmitting}
                            />
                            Contrat agence eNKAMBA Pay obligatoire
                          </label>
                          <label className="flex items-start gap-2">
                            <Checkbox
                              checked={formData.transferAgencyCompliance.auditAccepted}
                              onCheckedChange={(checked) => handleTransferAgencyComplianceChange('auditAccepted', Boolean(checked))}
                              disabled={isSubmitting}
                            />
                            Audit des opérations POS accepté
                          </label>
                          <label className="flex items-start gap-2">
                            <Checkbox
                              checked={formData.transferAgencyCompliance.activationAccepted}
                              onCheckedChange={(checked) => handleTransferAgencyComplianceChange('activationAccepted', Boolean(checked))}
                              disabled={isSubmitting}
                            />
                            Activation uniquement après vérification
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="agencySettlementWallet">Wallet / compte de règlement *</Label>
                        <Input
                          id="agencySettlementWallet"
                          value={formData.transferAgencyCompliance.settlementWallet}
                          onChange={(event) => handleTransferAgencyComplianceChange('settlementWallet', event.target.value)}
                          placeholder="Ex : wallet eNKAMBA Pay, compte bancaire ou caisse principale"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="agencyDefaultCurrency">Devise principale *</Label>
                        <Select
                          value={formData.transferAgencyCompliance.defaultCurrency}
                          onValueChange={(value) => handleTransferAgencyComplianceChange('defaultCurrency', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="agencyDefaultCurrency">
                            <SelectValue placeholder="Choisissez une devise" />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSFER_AGENCY_CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="agencyCashFloat">Caisse initiale *</Label>
                        <Input
                          id="agencyCashFloat"
                          value={formData.transferAgencyCompliance.openingCashFloat}
                          onChange={(event) => handleTransferAgencyComplianceChange('openingCashFloat', event.target.value)}
                          placeholder="Ex : 5 000 USD"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="agencyDailyLimit">Plafond journalier *</Label>
                        <Input
                          id="agencyDailyLimit"
                          value={formData.transferAgencyCompliance.dailyTransactionLimit}
                          onChange={(event) => handleTransferAgencyComplianceChange('dailyTransactionLimit', event.target.value)}
                          placeholder="Ex : 25 000 USD / jour"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="agencyCommission">Commission agence</Label>
                        <Input
                          id="agencyCommission"
                          value={formData.transferAgencyCompliance.commissionRate}
                          onChange={(event) => handleTransferAgencyComplianceChange('commissionRate', event.target.value)}
                          placeholder="Ex : 3"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Devises prises en charge *</Label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {TRANSFER_AGENCY_CURRENCIES.map((currency) => (
                            <label key={currency} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                              <Checkbox
                                checked={formData.transferAgencyCompliance.supportedCurrencies.includes(currency)}
                                onCheckedChange={() => toggleTransferAgencyArrayValue('supportedCurrencies', currency)}
                                disabled={isSubmitting}
                              />
                              {currency}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Fonctions POS à activer</Label>
                        <div className="mt-2 grid gap-2">
                          {TRANSFER_AGENCY_PAYOUT_MODES.map((mode) => (
                            <label key={mode} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                              <Checkbox
                                checked={formData.transferAgencyCompliance.payoutModes.includes(mode)}
                                onCheckedChange={() => toggleTransferAgencyArrayValue('payoutModes', mode)}
                                disabled={isSubmitting}
                              />
                              {mode}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {moduleOverview && (
              <div className="space-y-2 rounded-lg border border-dashed border-muted p-4 bg-muted/50">
                <p className="text-sm font-semibold">{moduleOverview.title}</p>
                <p className="text-sm text-muted-foreground">{moduleOverview.description}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {moduleOverview.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label>Services que vous comptez activer *</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {serviceOptions.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3 transition hover:border-primary"
                  >
                    <Checkbox
                      checked={formData.moduleServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <div>
                      <p className="text-sm font-semibold">{service.label}</p>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="serviceNote">Services & attentes des utilisateurs *</Label>
              <Textarea
                id="serviceNote"
                placeholder="Décrivez les services spécifiques que vous allez offrir, la cible (ex : commerce alimentaire, agent relais paiement) et les interfaces attendues."
                value={formData.serviceNote}
                onChange={(e) => handleInputChange('serviceNote', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        );
      case 'contacts':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Coordonnées & présence</h3>
            <div>
              <Label htmlFor="registrationNumber">Numéro d’enregistrement *</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                placeholder="RCCM / NIF / ID NAT"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rue, quartier, repère"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Kinshasa, Goma..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="République démocratique du Congo"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="contactEmail">Email de contact *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@mon-entreprise.com"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Téléphone de contact *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+243..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="primaryMarket">Marchés & segments</Label>
                <Input
                  id="primaryMarket"
                  value={formData.primaryMarket}
                  onChange={(e) => handleInputChange('primaryMarket', e.target.value)}
                  placeholder="Ex : B2B alimentaire, retail urbain, e-services"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="expectedVolume">Volume estimé</Label>
                <Input
                  id="expectedVolume"
                  value={formData.expectedVolume}
                  onChange={(e) => handleInputChange('expectedVolume', e.target.value)}
                  placeholder="Ex : 100 transactions / 50 colis / 50 clients quotidiens"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">KYC, sécurité & documents</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">Contrôles KYC renforcés</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {KYC_CHECKS.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">Anti-fraude</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {ANTI_FRAUD_RULES.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <DocumentUpload
                label="Pièce d’identité"
                docType="idCard"
                file={formData.documents.idCard}
                onChange={(file) => handleFileChange('idCard', file)}
                disabled={isSubmitting}
              />
              <DocumentUpload
                label="Document fiscal"
                docType="taxDocument"
                file={formData.documents.taxDocument}
                onChange={(file) => handleFileChange('taxDocument', file)}
                disabled={isSubmitting}
              />
              <DocumentUpload
                label="Licence commerciale"
                docType="businessLicense"
                file={formData.documents.businessLicense}
                onChange={(file) => handleFileChange('businessLicense', file)}
                disabled={isSubmitting}
              />
              <DocumentUpload
                label="Relevé bancaire ou wallet"
                docType="bankStatement"
                file={formData.documents.bankStatement}
                onChange={(file) => handleFileChange('bankStatement', file)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/50">
                <p className="text-sm font-semibold">Mesures de sécurité</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {SECURITY_MEASURES.map((measure) => (
                    <li key={measure}>{measure}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/50">
                <p className="text-sm font-semibold">Processus d’auto-identification</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {IDENTIFICATION_FLOW.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Compte entreprise</h1>
            <p className="text-muted-foreground">Gérez votre accès professionnel eNkamba par modules.</p>
          </div>
        </div>

        {businessUser && (
          <BusinessStatusCard
            status={businessUser.status}
            businessName={businessUser.businessName}
            rejectionReason={businessUser.rejectionReason}
            onRetry={() => setShowForm(true)}
          />
        )}

        {businessRequest && !showForm && (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{businessRequest.businessName}</CardTitle>
                  <CardDescription>{businessRequest.type}</CardDescription>
                </div>
                <StatusBadge status={businessRequest.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Numéro d’enregistrement</Label>
                  <p className="font-medium">{businessRequest.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sous-catégorie</Label>
                  <p className="font-medium">{businessRequest.subCategory}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Adresse</Label>
                  <p className="font-medium">{businessRequest.address}, {businessRequest.city}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pays</Label>
                  <p className="font-medium">{businessRequest.country}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{businessRequest.contactEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{businessRequest.contactPhone}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Profil</Label>
                  <p className="font-medium">{businessRequest.entityNature}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Services actifs</Label>
                  <p className="font-medium">{(businessRequest.moduleServices || []).join(', ') || 'Aucun'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Marchés / volumes</Label>
                  <p className="font-medium">
                    {businessRequest.primaryMarket || 'Non précisé'} • {businessRequest.expectedVolume || 'Volume en cours de définition'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Note services</Label>
                  <p className="text-sm text-muted-foreground">{businessRequest.serviceNote || '—'}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
                Modifier la demande
              </Button>
            </CardContent>
          </Card>
        )}

        {(!businessRequest || showForm) && (
          <Card>
            <CardHeader>
              <CardTitle>Obtenir un compte entreprise</CardTitle>
              <CardDescription>
                Le formulaire se déploie page par page (identité, modules, contacts, KYC) pour aligner chaque sous-module avec vos services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {STEPS.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          index === currentStep ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-xs text-muted-foreground">{step.title}</p>
                    </div>
                  ))}
                </div>
                <Progress value={((currentStep + 1) / STEPS.length) * 100} />
              </div>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                {renderStepContent()}
                <div className="flex gap-3 pt-2">
                  {currentStep > 0 && (
                    <Button type="button" variant="outline" onClick={handleBackStep} disabled={isSubmitting}>
                      Retour
                    </Button>
                  )}
                  <Button
                    type={currentStep === STEPS.length - 1 ? 'submit' : 'button'}
                    onClick={currentStep === STEPS.length - 1 ? undefined : handleNextStep}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting && currentStep === STEPS.length - 1 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Soumission en cours...
                      </>
                    ) : currentStep === STEPS.length - 1 ? (
                      'Soumettre la demande'
                    ) : (
                      'Étape suivante'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface DocumentUploadProps {
  label: string;
  docType: keyof BusinessFormState['documents'];
  file: File | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
}

function DocumentUpload({ label, docType, file, onChange, disabled }: DocumentUploadProps) {
  return (
    <div data-doc-type={docType} className="rounded-xl border border-dashed border-border p-4">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">KYC amélioré : selfie + pièce + preuve de point de service.</p>
      <div className="mt-2">
        {file ? (
          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
            <span className="text-sm text-primary">{file.name}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)} disabled={disabled}>
              ✕
            </Button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground transition hover:border-primary">
            <Upload size={16} />
            <span>Cliquez pour télécharger</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] || null)}
              disabled={disabled}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
        )}
      </div>
    </div>
  );
}
