'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  MapPin,
  Phone,
  Mail,
  User,
  Building
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  idNumber: string;
  
  // Business Info
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessPhone: string;
  yearsInBusiness: string;
  
  // Agent Type
  agentType: string;
  
  // Documents
  documents: {
    idCard: File | null;
    businessLicense: File | null;
    proofOfAddress: File | null;
    businessPhotos: File[];
  };
}

const agentTypes = {
  'agent-relais': {
    title: 'Agent Relais',
    description: 'Services financiers de base',
    color: 'from-primary to-primary'
  },
  'cabinet': {
    title: 'Cabiniste',
    description: 'Cabinet de services complets',
    color: 'from-[#25543A] to-[#25543A]'
  },
  'point-service': {
    title: 'Point de Service',
    description: 'Services intégrés à votre activité',
    color: 'from-[#25543A] to-[#25543A]'
  }
};

export default function AgentApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentType = searchParams?.get('type') ?? 'agent-relais';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    idNumber: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    businessPhone: '',
    yearsInBusiness: '',
    agentType: agentType,
    documents: {
      idCard: null,
      businessLicense: null,
      proofOfAddress: null,
      businessPhotos: []
    }
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const handleMultipleFileUpload = (field: string, files: FileList) => {
    const fileArray = Array.from(files);
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: fileArray
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Redirect to success page
    router.push('/dashboard/agent-relay/success');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-headline mb-2">
                Informations personnelles
              </h2>
              <p className="text-sm text-muted-foreground">
                Renseignez vos informations personnelles
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idNumber">Numéro CNI/Passeport *</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="Numéro de pièce d'identité"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-headline mb-2">
                Informations commerciales
              </h2>
              <p className="text-sm text-muted-foreground">
                Détails sur votre activité commerciale
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom du commerce *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Nom de votre commerce"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessType">Type d'activité *</Label>
                <Select onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre activité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epicerie">Épicerie</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Café</SelectItem>
                    <SelectItem value="salon">Salon de coiffure</SelectItem>
                    <SelectItem value="garage">Garage</SelectItem>
                    <SelectItem value="boutique">Boutique</SelectItem>
                    <SelectItem value="pharmacie">Pharmacie</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessAddress">Adresse du commerce *</Label>
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="Adresse complète de votre commerce"
                  rows={3}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Téléphone du commerce</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    placeholder="Numéro du commerce"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Années d'activité *</Label>
                  <Select onValueChange={(value) => handleInputChange('yearsInBusiness', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durée d'activité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moins-1">Moins d'1 an</SelectItem>
                      <SelectItem value="1-2">1-2 ans</SelectItem>
                      <SelectItem value="3-5">3-5 ans</SelectItem>
                      <SelectItem value="plus-5">Plus de 5 ans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-headline mb-2">
                Documents requis
              </h2>
              <p className="text-sm text-muted-foreground">
                Téléchargez les documents nécessaires
              </p>
            </div>
            
            <div className="space-y-6">
              {/* ID Card */}
              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={20} className="text-primary" />
                  <div>
                    <h3 className="font-semibold">Pièce d'identité *</h3>
                    <p className="text-sm text-muted-foreground">CNI ou Passeport (recto-verso)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('idCard', e.target.files[0])}
                    className="flex-1"
                  />
                  {formData.documents.idCard && (
                    <CheckCircle2 size={20} className="text-primary" />
                  )}
                </div>
              </div>

              {/* Business License */}
              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Building size={20} className="text-primary" />
                  <div>
                    <h3 className="font-semibold">Autorisation commerciale</h3>
                    <p className="text-sm text-muted-foreground">Registre de commerce ou autorisation (si applicable)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('businessLicense', e.target.files[0])}
                    className="flex-1"
                  />
                  {formData.documents.businessLicense && (
                    <CheckCircle2 size={20} className="text-primary" />
                  )}
                </div>
              </div>

              {/* Proof of Address */}
              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin size={20} className="text-primary" />
                  <div>
                    <h3 className="font-semibold">Justificatif de domicile *</h3>
                    <p className="text-sm text-muted-foreground">Facture récente (électricité, eau, etc.)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfAddress', e.target.files[0])}
                    className="flex-1"
                  />
                  {formData.documents.proofOfAddress && (
                    <CheckCircle2 size={20} className="text-primary" />
                  )}
                </div>
              </div>

              {/* Business Photos */}
              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Camera size={20} className="text-primary" />
                  <div>
                    <h3 className="font-semibold">Photos du commerce *</h3>
                    <p className="text-sm text-muted-foreground">Extérieur et intérieur (2-5 photos)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleMultipleFileUpload('businessPhotos', e.target.files)}
                    className="flex-1"
                  />
                  {formData.documents.businessPhotos.length > 0 && (
                    <Badge variant="secondary">
                      {formData.documents.businessPhotos.length} photo(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-headline mb-2">
                Récapitulatif de votre candidature
              </h2>
              <p className="text-sm text-muted-foreground">
                Vérifiez vos informations avant soumission
              </p>
            </div>
            
            {/* Agent Type */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h3 className="font-semibold mb-2">Type d'agent sélectionné</h3>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${agentTypes[agentType as keyof typeof agentTypes]?.color} flex items-center justify-center text-white font-bold`}>
                  {agentTypes[agentType as keyof typeof agentTypes]?.title.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{agentTypes[agentType as keyof typeof agentTypes]?.title}</p>
                  <p className="text-sm text-muted-foreground">{agentTypes[agentType as keyof typeof agentTypes]?.description}</p>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3">Informations personnelles</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nom:</span> {formData.firstName} {formData.lastName}</div>
                <div><span className="text-muted-foreground">Email:</span> {formData.email}</div>
                <div><span className="text-muted-foreground">Téléphone:</span> {formData.phone}</div>
                <div><span className="text-muted-foreground">CNI/Passeport:</span> {formData.idNumber}</div>
              </div>
            </div>

            {/* Business Info */}
            <div className="p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3">Informations commerciales</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Commerce:</span> {formData.businessName}</div>
                <div><span className="text-muted-foreground">Type:</span> {formData.businessType}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Adresse:</span> {formData.businessAddress}</div>
              </div>
            </div>

            {/* Documents */}
            <div className="p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3">Documents téléchargés</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {formData.documents.idCard ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span>Pièce d'identité</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.documents.proofOfAddress ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span>Justificatif de domicile</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.documents.businessPhotos.length > 0 ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span>Photos du commerce ({formData.documents.businessPhotos.length})</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Candidature Agent Relais</h1>
          <p className="text-sm text-muted-foreground">
            Étape {currentStep} sur {totalSteps} - {agentTypes[agentType as keyof typeof agentTypes]?.title}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Précédent
        </Button>
        
        {currentStep === totalSteps ? (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-gradient-to-r from-primary to-primary"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma candidature'}
            {!isSubmitting && <CheckCircle2 size={16} />}
          </Button>
        ) : (
          <Button onClick={nextStep} className="gap-2">
            Suivant
            <ArrowLeft size={16} className="rotate-180" />
          </Button>
        )}
      </div>
    </div>
  );
}
