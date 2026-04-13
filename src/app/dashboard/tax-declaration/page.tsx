'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, ArrowRight, ArrowLeft, FileText, DollarSign, CheckCheck } from 'lucide-react';

type ProfileType = 'moral' | 'physical' | null;
type TaxCategory = 'grande' | 'moyenne' | 'petite' | 'micro' | null;
type TaxType = 'IS_IBP' | 'TVA' | 'IPR' | 'IERE' | 'IMPOT_MOBILIER' | null;

interface NIFFormData {
  fullName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  activityType: string;
  activityDescription: string;
  address: string;
  phone: string;
}

interface ContributorData {
  nif: string;
  businessName: string;
  taxCenter: string;
  period: string;
  address: string;
  phone: string;
  email: string;
}

interface FiscalData {
  [key: string]: string | number;
}

export default function TaxDeclarationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [hasNIF, setHasNIF] = useState<boolean | null>(null);
  const [taxCategory, setTaxCategory] = useState<TaxCategory>(null);
  const [taxType, setTaxType] = useState<TaxType>(null);
  const [nifFormData, setNifFormData] = useState<NIFFormData>({
    fullName: '',
    birthDate: '',
    birthPlace: '',
    nationality: '',
    activityType: '',
    activityDescription: '',
    address: '',
    phone: '',
  });
  const [contributorData, setContributorData] = useState<ContributorData>({
    nif: '',
    businessName: '',
    taxCenter: '',
    period: '',
    address: '',
    phone: '',
    email: '',
  });
  const [fiscalData, setFiscalData] = useState<FiscalData>({});
  const [calculatedTax, setCalculatedTax] = useState<number>(0);

  const handleProfileSelection = (type: ProfileType) => {
    setProfileType(type);
    setCurrentStep(2);
  };

  const handleNIFVerification = (hasNif: boolean) => {
    setHasNIF(hasNif);
    if (hasNif) {
      setCurrentStep(4);
    } else {
      setCurrentStep(3);
    }
  };

  const handleNIFFormSubmit = () => {
    if (nifFormData.fullName && nifFormData.birthDate && nifFormData.nationality) {
      setCurrentStep(4);
    }
  };

  const handleCategorySelection = (category: TaxCategory) => {
    setTaxCategory(category);
    setCurrentStep(5);
  };

  const handleTaxTypeSelection = (type: TaxType) => {
    setTaxType(type);
    setCurrentStep(6);
  };

  const handleContributorDataSubmit = () => {
    if (contributorData.nif && contributorData.businessName && contributorData.email) {
      setCurrentStep(7);
    }
  };

  const handleFiscalDataSubmit = () => {
    setCurrentStep(8);
    calculateTax();
  };

  const calculateTax = () => {
    const baseAmount = Object.values(fiscalData).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
    const taxRate = getTaxRate();
    setCalculatedTax(Math.round(baseAmount * taxRate));
  };

  const getTaxRate = (): number => {
    switch (taxType) {
      case 'IS_IBP':
        return 0.30;
      case 'TVA':
        return 0.18;
      case 'IPR':
        return 0.15;
      case 'IERE':
        return 0.10;
      case 'IMPOT_MOBILIER':
        return 0.16;
      default:
        return 0;
    }
  };

  const handleNext = () => {
    if (currentStep < 11) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handlePayment = () => {
    setCurrentStep(11);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sélection du type de profil</CardTitle>
              <CardDescription>Choisissez votre type de profil fiscal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 text-lg"
                  onClick={() => handleProfileSelection('moral')}
                >
                  Personne Morale
                </Button>
                <Button
                  variant="outline"
                  className="h-24 text-lg"
                  onClick={() => handleProfileSelection('physical')}
                >
                  Personne Physique
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Vérification NIF</CardTitle>
              <CardDescription>Avez-vous déjà un NIF?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup onValueChange={(value) => handleNIFVerification(value === 'yes')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="has-nif" />
                  <Label htmlFor="has-nif" className="cursor-pointer">Oui, j'ai un NIF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no-nif" />
                  <Label htmlFor="no-nif" className="cursor-pointer">Non, je dois demander un NIF</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Demande de NIF</CardTitle>
              <CardDescription>Remplissez le formulaire pour demander un NIF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={nifFormData.fullName}
                    onChange={(e) => setNifFormData({ ...nifFormData, fullName: e.target.value })}
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={nifFormData.birthDate}
                    onChange={(e) => setNifFormData({ ...nifFormData, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="birthPlace">Lieu de naissance</Label>
                  <Input
                    id="birthPlace"
                    value={nifFormData.birthPlace}
                    onChange={(e) => setNifFormData({ ...nifFormData, birthPlace: e.target.value })}
                    placeholder="Ville/Pays"
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationalité</Label>
                  <Input
                    id="nationality"
                    value={nifFormData.nationality}
                    onChange={(e) => setNifFormData({ ...nifFormData, nationality: e.target.value })}
                    placeholder="Votre nationalité"
                  />
                </div>
                <div>
                  <Label htmlFor="activityType">Type d'activité</Label>
                  <Input
                    id="activityType"
                    value={nifFormData.activityType}
                    onChange={(e) => setNifFormData({ ...nifFormData, activityType: e.target.value })}
                    placeholder="Ex: Commerce, Services"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={nifFormData.phone}
                    onChange={(e) => setNifFormData({ ...nifFormData, phone: e.target.value })}
                    placeholder="+243..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="activityDescription">Description de l'activité</Label>
                  <Textarea
                    id="activityDescription"
                    value={nifFormData.activityDescription}
                    onChange={(e) => setNifFormData({ ...nifFormData, activityDescription: e.target.value })}
                    placeholder="Décrivez votre activité"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={nifFormData.address}
                    onChange={(e) => setNifFormData({ ...nifFormData, address: e.target.value })}
                    placeholder="Votre adresse complète"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sélection de la catégorie</CardTitle>
              <CardDescription>Choisissez votre catégorie fiscale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['grande', 'moyenne', 'petite', 'micro'].map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    className="h-20"
                    onClick={() => handleCategorySelection(cat as TaxCategory)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)} Entreprise
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sélection du type d'impôt</CardTitle>
              <CardDescription>Choisissez le type d'impôt applicable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'IS_IBP', label: 'IS/IBP' },
                  { value: 'TVA', label: 'TVA' },
                  { value: 'IPR', label: 'IPR' },
                  { value: 'IERE', label: 'IERE' },
                  { value: 'IMPOT_MOBILIER', label: 'Impôt Mobilier' },
                ].map((tax) => (
                  <Button
                    key={tax.value}
                    variant="outline"
                    className="h-20"
                    onClick={() => handleTaxTypeSelection(tax.value as TaxType)}
                  >
                    {tax.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Identification du contribuable</CardTitle>
              <CardDescription>Remplissez vos informations de contribuable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    value={contributorData.nif}
                    onChange={(e) => setContributorData({ ...contributorData, nif: e.target.value })}
                    placeholder="Votre NIF"
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Raison sociale</Label>
                  <Input
                    id="businessName"
                    value={contributorData.businessName}
                    onChange={(e) => setContributorData({ ...contributorData, businessName: e.target.value })}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div>
                  <Label htmlFor="taxCenter">Centre impôt</Label>
                  <Input
                    id="taxCenter"
                    value={contributorData.taxCenter}
                    onChange={(e) => setContributorData({ ...contributorData, taxCenter: e.target.value })}
                    placeholder="Centre impôt"
                  />
                </div>
                <div>
                  <Label htmlFor="period">Période</Label>
                  <Input
                    id="period"
                    type="month"
                    value={contributorData.period}
                    onChange={(e) => setContributorData({ ...contributorData, period: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={contributorData.address}
                    onChange={(e) => setContributorData({ ...contributorData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={contributorData.phone}
                    onChange={(e) => setContributorData({ ...contributorData, phone: e.target.value })}
                    placeholder="+243..."
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contributorData.email}
                    onChange={(e) => setContributorData({ ...contributorData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Données fiscales</CardTitle>
              <CardDescription>Remplissez les données fiscales pour la catégorie {taxCategory}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revenue">Chiffre d'affaires</Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={fiscalData.revenue || ''}
                    onChange={(e) => setFiscalData({ ...fiscalData, revenue: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="expenses">Charges</Label>
                  <Input
                    id="expenses"
                    type="number"
                    value={fiscalData.expenses || ''}
                    onChange={(e) => setFiscalData({ ...fiscalData, expenses: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="profit">Bénéfice</Label>
                  <Input
                    id="profit"
                    type="number"
                    value={fiscalData.profit || ''}
                    onChange={(e) => setFiscalData({ ...fiscalData, profit: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="deductions">Déductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={fiscalData.deductions || ''}
                    onChange={(e) => setFiscalData({ ...fiscalData, deductions: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Calcul de l'impôt
              </CardTitle>
              <CardDescription>Résumé du calcul de votre impôt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Chiffre d'affaires:</span>
                  <span className="font-semibold">{Number(fiscalData.revenue || 0).toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>Charges:</span>
                  <span className="font-semibold">{Number(fiscalData.expenses || 0).toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>Bénéfice:</span>
                  <span className="font-semibold">{Number(fiscalData.profit || 0).toLocaleString()} FC</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg">
                  <span>Impôt à payer:</span>
                  <span className="font-bold text-green-600">{calculatedTax.toLocaleString()} FC</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 9:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Récapitulatif
              </CardTitle>
              <CardDescription>Vérifiez vos informations avant de procéder au paiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Type de profil</h3>
                  <p className="text-gray-600">{profileType === 'moral' ? 'Personne Morale' : 'Personne Physique'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Catégorie</h3>
                  <p className="text-gray-600">{taxCategory ? taxCategory.charAt(0).toUpperCase() + taxCategory.slice(1) : ''} Entreprise</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Type d'impôt</h3>
                  <p className="text-gray-600">{taxType}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Raison sociale</h3>
                  <p className="text-gray-600">{contributorData.businessName}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">NIF</h3>
                  <p className="text-gray-600">{contributorData.nif}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold mb-2">Montant à payer</h3>
                  <p className="text-2xl font-bold text-green-600">{calculatedTax.toLocaleString()} FC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 10:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Paiement</CardTitle>
              <CardDescription>Procédez au paiement de votre déclaration fiscale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-lg font-semibold mb-2">Montant à payer</p>
                <p className="text-3xl font-bold text-blue-600">{calculatedTax.toLocaleString()} FC</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Méthodes de paiement disponibles:</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Virement bancaire
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Mobile Money
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Carte bancaire
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 11:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCheck className="w-6 h-6" />
                Succès
              </CardTitle>
              <CardDescription>Votre déclaration fiscale a été soumise avec succès</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Déclaration acceptée</h3>
                <p className="text-gray-600 mb-4">
                  Votre déclaration fiscale a été enregistrée avec succès. Un reçu de confirmation a été envoyé à votre email.
                </p>
                <div className="bg-white p-4 rounded border border-green-200 text-left">
                  <p className="text-sm"><span className="font-semibold">Numéro de référence:</span> TAX-2024-001</p>
                  <p className="text-sm"><span className="font-semibold">Date:</span> {new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm"><span className="font-semibold">Montant payé:</span> {calculatedTax.toLocaleString()} FC</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Déclaration Fiscale</h1>
          <p className="text-gray-600">Étape {currentStep} sur 11</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 11) * 100}%` }}
            />
          </div>
        </div>

        {renderStep()}

        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </Button>
          {currentStep < 9 && (
            <Button
              onClick={currentStep === 3 ? handleNIFFormSubmit : currentStep === 6 ? handleContributorDataSubmit : currentStep === 7 ? handleFiscalDataSubmit : handleNext}
              className="flex-1 flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {currentStep === 9 && (
            <Button
              onClick={handleNext}
              className="flex-1 flex items-center gap-2"
            >
              Continuer vers le paiement
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {currentStep === 10 && (
            <Button
              onClick={handlePayment}
              className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              Confirmer le paiement
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
