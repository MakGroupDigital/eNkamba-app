'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBusinessAccount } from '@/hooks/useBusinessAccount';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { ArrowLeft, Loader2, Upload, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { BusinessStatusCard } from '@/components/business/business-status-card';
import { BusinessFormState, BusinessType } from '@/types/business-account.types';

const BUSINESS_TYPES = [
  { value: 'COMMERCE', label: 'Commerce (B2B/B2C)' },
  { value: 'LOGISTICS', label: 'Logistique' },
  { value: 'PAYMENT', label: 'Système de Paiement (Fintech)' },
];

const COMMERCE_SUBCATEGORIES = [
  { value: 'WHOLESALE', label: 'Vente en gros' },
  { value: 'RETAIL', label: 'Détail' },
  { value: 'EQUIPMENT_PRODUCER', label: 'Producteur d\'équipements' },
  { value: 'PRODUCT_PRODUCER', label: 'Producteur de produits' },
];

const LOGISTICS_SUBCATEGORIES = [
  { value: 'TRANSPORT_COMPANY', label: 'Entreprise de transport' },
  { value: 'RELAY_AGENT', label: 'Agent relais' },
];

const PAYMENT_SUBCATEGORIES = [
  { value: 'API_INTEGRATION', label: 'Intégration API' },
  { value: 'ACCREDITED_ENTERPRISE', label: 'Entreprise accréditée' },
  { value: 'APPROVED_AGENT', label: 'Agent agréé' },
];

const getSubcategories = (type: BusinessType | '') => {
  switch (type) {
    case 'COMMERCE':
      return COMMERCE_SUBCATEGORIES;
    case 'LOGISTICS':
      return LOGISTICS_SUBCATEGORIES;
    case 'PAYMENT':
      return PAYMENT_SUBCATEGORIES;
    default:
      return [];
  }
};

const StatusBadge = ({ status }: { status: string }) => {
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
};

export default function BusinessAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { businessRequest, isLoading, isSubmitting, submitBusinessRequest } = useBusinessAccount();
  const { businessUser } = useBusinessStatus();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BusinessFormState>({
    businessName: '',
    type: '',
    subCategory: '',
    registrationNumber: '',
    address: '',
    city: '',
    country: '',
    contactEmail: '',
    contactPhone: '',
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Réinitialiser la sous-catégorie si le type change
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        subCategory: '',
      }));
    }
  };

  const handleFileChange = (docType: keyof typeof formData.documents, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: file,
      },
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.businessName.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom de l\'entreprise est requis' });
      return false;
    }
    if (!formData.type) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Sélectionnez un type d\'entreprise' });
      return false;
    }
    if (!formData.subCategory) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Sélectionnez une sous-catégorie' });
      return false;
    }
    if (!formData.registrationNumber.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le numéro d\'enregistrement est requis' });
      return false;
    }
    if (!formData.address.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'adresse est requise' });
      return false;
    }
    if (!formData.city.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La ville est requise' });
      return false;
    }
    if (!formData.country.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le pays est requis' });
      return false;
    }
    if (!formData.contactEmail.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'email de contact est requis' });
      return false;
    }
    if (!formData.contactPhone.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le téléphone de contact est requis' });
      return false;
    }
    if (formData.type === 'PAYMENT' && !formData.apiCallbackUrl?.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'URL de callback API est requise pour les systèmes de paiement' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await submitBusinessRequest(formData);
      toast({
        title: 'Succès',
        description: 'Votre demande a été soumise avec succès',
      });
      setShowForm(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de la soumission',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Compte Entreprise</h1>
            <p className="text-muted-foreground">Gérez votre compte professionnel eNkamba</p>
          </div>
        </div>

        {/* Business Status Card */}
        {businessUser && (
          <div className="mb-8">
            <BusinessStatusCard
              status={businessUser.status}
              businessName={businessUser.businessName}
              rejectionReason={businessUser.rejectionReason}
              onRetry={() => setShowForm(true)}
            />
          </div>
        )}

        {/* Existing Request */}
        {businessRequest && !showForm && (
          <Card className="mb-8 border-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Numéro d'enregistrement</Label>
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

              {businessRequest.status === 'REJECTED' && businessRequest.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Raison du rejet :</p>
                  <p className="text-sm text-red-700 mt-1">{businessRequest.rejectionReason}</p>
                </div>
              )}

              {businessRequest.status === 'PENDING' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Votre demande est en cours de vérification. Nous vous contacterons dès que possible.
                  </p>
                </div>
              )}

              {businessRequest.status === 'VERIFIED' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    Votre compte entreprise a été vérifié avec succès !
                  </p>
                </div>
              )}

              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="w-full"
              >
                Modifier la demande
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {(!businessRequest || showForm) && (
          <Card>
            <CardHeader>
              <CardTitle>Obtenir un compte entreprise</CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous pour demander un compte professionnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informations de l'entreprise</h3>

                  <div>
                    <Label htmlFor="businessName">Nom de l'entreprise *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Nom de votre entreprise"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type d'entreprise *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleInputChange('type', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubcategories(formData.type as BusinessType).map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Numéro d'enregistrement *</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      placeholder="Ex: 12345-ABC"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Adresse</h3>

                  <div>
                    <Label htmlFor="address">Adresse *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Rue et numéro"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Ville"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Pays *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Pays"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informations de contact</h3>

                  <div>
                    <Label htmlFor="contactEmail">Email de contact *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="contact@entreprise.com"
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

                {/* Payment-specific fields */}
                {formData.type === 'PAYMENT' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Configuration API</h3>
                    <div>
                      <Label htmlFor="apiCallbackUrl">URL de callback API *</Label>
                      <Input
                        id="apiCallbackUrl"
                        value={formData.apiCallbackUrl || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiCallbackUrl: e.target.value }))}
                        placeholder="https://votre-domaine.com/callback"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Les documents peuvent être uploadés manuellement après la soumission via Firebase Console
                  </p>
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                    ℹ️ Pour cette version de test, les documents sont optionnels
                  </p>

                  <DocumentUpload
                    label="Pièce d'identité (optionnel)"
                    docType="idCard"
                    file={formData.documents.idCard}
                    onChange={(file) => handleFileChange('idCard', file)}
                    disabled={isSubmitting}
                  />

                  <DocumentUpload
                    label="Document fiscal (optionnel)"
                    docType="taxDocument"
                    file={formData.documents.taxDocument}
                    onChange={(file) => handleFileChange('taxDocument', file)}
                    disabled={isSubmitting}
                  />

                  <DocumentUpload
                    label="Licence commerciale (optionnel)"
                    docType="businessLicense"
                    file={formData.documents.businessLicense}
                    onChange={(file) => handleFileChange('businessLicense', file)}
                    disabled={isSubmitting}
                  />

                  <DocumentUpload
                    label="Relevé bancaire (optionnel)"
                    docType="bankStatement"
                    file={formData.documents.bankStatement}
                    onChange={(file) => handleFileChange('bankStatement', file)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  {showForm && businessRequest && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Soumission en cours...
                      </>
                    ) : (
                      'Soumettre la demande'
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
  docType: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
}

function DocumentUpload({ label, docType, file, onChange, disabled }: DocumentUploadProps) {
  return (
    <div className="border-2 border-dashed rounded-lg p-4">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-2">
        {file ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
            <span className="text-sm text-green-700">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              ✕
            </Button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-3 cursor-pointer hover:bg-muted rounded transition-colors">
            <Upload size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cliquez pour télécharger</span>
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
