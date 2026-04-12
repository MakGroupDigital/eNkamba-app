'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
    { value: 'TRANSPORT_COMPANY', label: 'Entreprise de transport & flotte' },
    { value: 'RELAY', label: 'Point relais / hub client' },
    { value: 'RELAY_AGENT', label: 'Agent relais Mobile Money' },
    { value: 'WAREHOUSE_HUB', label: 'Entrepôt & gestion de stock' },
    { value: 'LAST_MILE', label: 'Livraison last-mile & agents de proximité' },
  ],
  PAYMENT: [
    { value: 'API_INTEGRATION', label: 'Intégration API / plateforme' },
    { value: 'ACCREDITED_ENTERPRISE', label: 'Entreprise accréditée (collecte & cash-in)' },
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
      'Gestion de la flotte, planification des véhicules et conducteurs.',
      'Tracking des colis, points relais et collectes terrain.',
      'Scanner QR, agents relais et supervision des points mobiles.',
      'Alertes GPS, zones à risque et inventaire des hubs.',
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
      label: 'Flotte & conducteurs',
      description: 'Ajoutez véhicules, chauffeurs et rapports d’activité par route.',
    },
    {
      id: 'tracking',
      label: 'Tracking colis & QR',
      description: 'Reliez chaque colis à un scanner QR et suivez-la en temps réel.',
    },
    {
      id: 'relay',
      label: 'Agents relais & points de service',
      description: 'Points de dépôt, cabine ou kiosque avec KYC, horaires et photos.',
    },
    {
      id: 'warehouse',
      label: 'Hub stockage',
      description: 'Gestion de stock, accès sécurisé, photos façade et contrat.',
    },
  ],
  PAYMENT: [
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
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
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

export default function BusinessAccountPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { businessRequest, isLoading, isSubmitting, submitBusinessRequest } = useBusinessAccount();
  const { businessUser } = useBusinessStatus();

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

  const selectedEntityType = ENTITY_TYPES.find(type => type.value === formData.entityNature);
  const moduleOverview = formData.type ? MODULE_OVERVIEW[formData.type] : null;
  const serviceOptions = formData.type ? SERVICE_CATALOG[formData.type] : [];

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
        if (formData.type === 'PAYMENT' && !formData.paymentRole) {
          toast({ variant: 'destructive', title: 'Rôle', description: 'Précisez si vous êtes intégrateur, agent agréé ou plateforme fintech.' });
          return false;
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

  if (isLoading) {
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
            )}
            {formData.type === 'LOGISTICS' && (
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
            )}
            {formData.type === 'PAYMENT' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="paymentRole">Rôle de paiement *</Label>
                  <Select
                    value={formData.paymentRole}
                    onValueChange={(value) => handleInputChange('paymentRole', value)}
                    disabled={isSubmitting}
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
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
            <span className="text-sm text-green-700">{file.name}</span>
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
