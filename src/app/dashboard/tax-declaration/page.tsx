'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Calculator, CreditCard, Download, Building2, User } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type ProfileType = 'morale' | 'physique';
type CompanyCategory = 'grande' | 'moyenne' | 'petite' | 'micro';
type TaxType = 'IS_IBP' | 'TVA' | 'IPR' | 'IERE' | 'IMPOT_MOBILIER';
type DeclarationStep = 'profileType' | 'nifCheck' | 'nifForm' | 'category' | 'taxType' | 'identification' | 'data' | 'calculation' | 'summary' | 'payment' | 'success';

const categoryInfo = {
  grande: { label: 'Grande Entreprise', description: 'Formulaires détaillés avec annexes' },
  moyenne: { label: 'Moyenne Entreprise', description: 'Formulaires intermédiaires' },
  petite: { label: 'Petite Entreprise', description: 'Formulaires simplifiés' },
  micro: { label: 'Micro-Entreprise', description: 'Formulaires ultra-simplifiés' },
};

const taxTypeInfo = {
  IS_IBP: { label: 'IS / IBP - Impôt sur les Sociétés / Impôt sur les Bénéfices Professionnels', deadline: '30 avril' },
  TVA: { label: 'TVA - Taxe sur la Valeur Ajoutée', deadline: 'Mensuel' },
  IPR: { label: 'IPR - Impôt Professionnel sur les Rémunérations', deadline: 'Mensuel' },
  IERE: { label: 'IERE - Impôt Exceptionnel sur les Rémunérations des Expatriés (25%)', deadline: 'Mensuel' },
  IMPOT_MOBILIER: { label: 'Impôt Mobilier', deadline: 'À la distribution' },
};

export default function TaxDeclarationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<DeclarationStep>('profileType');
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [hasNif, setHasNif] = useState<boolean | null>(null);
  const [category, setCategory] = useState<CompanyCategory>('grande');
  const [taxType, setTaxType] = useState<TaxType>('IS_IBP');
  const [nif, setNif] = useState('');
  const [raisonSociale, setRaisonSociale] = useState('');
  const [centreImpot, setCentreImpot] = useState('');
  const [periode, setPeriode] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [declarantName, setDeclarantName] = useState('');
  const [declarationId, setDeclarationId] = useState('');
  
  const [nifFormData, setNifFormData] = useState({
    nomComplet: '',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: '',
    typeActivite: '',
    descriptionActivite: '',
    adresseActivite: '',
    telephoneActivite: '',
  });

  const handleNext = () => {
    const steps: DeclarationStep[] = ['profileType', 'nifCheck', 'nifForm', 'category', 'taxType', 'identification', 'data', 'calculation', 'summary', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: DeclarationStep[] = ['profileType', 'nifCheck', 'nifForm', 'category', 'taxType', 'identification', 'data', 'calculation', 'summary', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleProfileTypeSelect = (type: ProfileType) => {
    setProfileType(type);
    if (type === 'morale') {
      setStep('category');
    } else {
      setStep('nifCheck');
    }
  };

  const handleNifCheckResponse = (response: boolean) => {
    setHasNif(response);
    if (response) {
      setStep('category');
    } else {
      setStep('nifForm');
    }
  };

  const handleNifFormSubmit = () => {
    if (!nifFormData.nomComplet || !nifFormData.typeActivite || !nifFormData.descriptionActivite) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }
    toast({
      title: "Formulaire soumis",
      description: "Votre demande de NIF a été enregistrée. Vous recevrez votre NIF dans les 5 jours ouvrables.",
      className: 'bg-green-600 text-white border-none',
    });
    setStep('category');
  };

  const handleSubmit = () => {
    if (!nif) {
      toast({
        variant: "destructive",
        title: "NIF manquant",
        description: "Le NIF est obligatoire pour soumettre une déclaration.",
      });
      return;
    }
    setDeclarationId(`TAX-${Date.now()}`);
    handleNext();
  };

  const handlePayment = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: "Paiement réussi !",
      description: `Votre déclaration a été payée avec succès.`,
    });
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Taxe et Impôt DGI
            </h1>
            <p className="text-sm text-muted-foreground">Système officiel de déclaration d'impôts RDC</p>
          </div>
        </header>

        {/* Étape 1: Type de profil */}
        {step === 'profileType' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Sélectionnez votre type de profil
              </CardTitle>
              <CardDescription>Cela déterminera le flux de déclaration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleProfileTypeSelect('morale')}
                  className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <Building2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Personne Morale</h3>
                  <p className="text-sm text-muted-foreground">Entreprise, SARL, SA, etc.</p>
                </button>

                <button
                  onClick={() => handleProfileTypeSelect('physique')}
                  className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <User className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Personne Physique</h3>
                  <p className="text-sm text-muted-foreground">Travailleur indépendant, profession libérale</p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Vérification NIF (Personne Physique) */}
        {step === 'nifCheck' && profileType === 'physique' && (
          <Card>
            <CardHeader>
              <CardTitle>Vérification du NIF</CardTitle>
              <CardDescription>Avez-vous déjà un numéro NIF (Numéro d'Identification Fiscale) ?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  Le NIF est un numéro unique d'identification fiscale attribué par la DGI. Si vous ne l'avez pas, nous vous aiderons à le demander.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => handleNifCheckResponse(false)}
                >
                  Non, je n'ai pas de NIF
                </Button>
                <Button 
                  className="flex-1 h-12 bg-[#32BB78] hover:bg-[#2a9d63]"
                  onClick={() => handleNifCheckResponse(true)}
                >
                  Oui, j'ai un NIF
                </Button>
              </div>

              <Button variant="ghost" onClick={handleBack} className="w-full">
                <ArrowLeft className="mr-2 w-4 h-4" /> Retour
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Formulaire NIF (Personne Physique sans NIF) */}
        {step === 'nifForm' && profileType === 'physique' && (
          <Card>
            <CardHeader>
              <CardTitle>Demande de NIF</CardTitle>
              <CardDescription>Remplissez ce formulaire pour obtenir votre NIF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-900">
                  ℹ️ Après soumission, vous recevrez votre NIF dans les 5 jours ouvrables par email.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  value={nifFormData.nomComplet}
                  onChange={(e) => setNifFormData({...nifFormData, nomComplet: e.target.value})}
                  placeholder="Ex: Jean Mukendi"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de naissance *</Label>
                  <Input
                    type="date"
                    value={nifFormData.dateNaissance}
                    onChange={(e) => setNifFormData({...nifFormData, dateNaissance: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lieu de naissance *</Label>
                  <Input
                    value={nifFormData.lieuNaissance}
                    onChange={(e) => setNifFormData({...nifFormData, lieuNaissance: e.target.value})}
                    placeholder="Ex: Kinshasa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nationalité *</Label>
                <Input
                  value={nifFormData.nationalite}
                  onChange={(e) => setNifFormData({...nifFormData, nationalite: e.target.value})}
                  placeholder="Ex: Congolaise"
                />
              </div>

              <div className="space-y-2">
                <Label>Type d'activité *</Label>
                <Select value={nifFormData.typeActivite} onValueChange={(value) => setNifFormData({...nifFormData, typeActivite: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type d'activité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commerce">Commerce</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="artisanat">Artisanat</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description de l'activité *</Label>
                <Textarea
                  value={nifFormData.descriptionActivite}
                  onChange={(e) => setNifFormData({...nifFormData, descriptionActivite: e.target.value})}
                  placeholder="Décrivez votre activité professionnelle"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Adresse de l'activité</Label>
                <Textarea
                  value={nifFormData.adresseActivite}
                  onChange={(e) => setNifFormData({...nifFormData, adresseActivite: e.target.value})}
                  placeholder="Ex: 123 Avenue de la Liberté, Gombe, Kinshasa"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={nifFormData.telephoneActivite}
                  onChange={(e) => setNifFormData({...nifFormData, telephoneActivite: e.target.value})}
                  placeholder="+243 XXX XXX XXX"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]" onClick={handleNifFormSubmit}>
                  Soumettre la demande <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 4: Catégorie d'entreprise */}
        {step === 'category' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Sélectionnez votre catégorie {profileType === 'morale' ? "d'entreprise" : "d'activité"}
              </CardTitle>
              <CardDescription>Cela déterminera le niveau de détail des formulaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(categoryInfo).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      category === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      checked={category === key}
                      onChange={(e) => setCategory(e.target.value as CompanyCategory)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{value.label}</p>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

        {/* Étape 5: Type d'impôt */}
        {step === 'taxType' && (
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez le type d'impôt</CardTitle>
              <CardDescription>Choisissez le formulaire fiscal à remplir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(taxTypeInfo).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      taxType === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="taxType"
                      value={key}
                      checked={taxType === key}
                      onChange={(e) => setTaxType(e.target.value as TaxType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{value.label}</p>
                      <p className="text-sm text-muted-foreground">Échéance: {value.deadline}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 6: Identification */}
        {step === 'identification' && (
          <Card>
            <CardHeader>
              <CardTitle>Identification du contribuable</CardTitle>
              <CardDescription>Informations obligatoires pour tous les formulaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>NIF (Numéro d'Identification Fiscale) *</Label>
                <Input
                  value={nif}
                  onChange={(e) => setNif(e.target.value.toUpperCase())}
                  placeholder="Ex: A1234567X"
                />
              </div>

              <div className="space-y-2">
                <Label>Raison sociale / Nom commercial *</Label>
                <Input
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  placeholder="Ex: SARL TechCongo"
                />
              </div>

              <div className="space-y-2">
                <Label>Centre d'impôt *</Label>
                <Input
                  value={centreImpot}
                  onChange={(e) => setCentreImpot(e.target.value)}
                  placeholder="Ex: Centre Gombe"
                />
              </div>

              <div className="space-y-2">
                <Label>Période fiscale *</Label>
                <Select value={periode} onValueChange={setPeriode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="janvier">Janvier 2026</SelectItem>
                    <SelectItem value="fevrier">Février 2026</SelectItem>
                    <SelectItem value="mars">Mars 2026</SelectItem>
                    <SelectItem value="annuel">Annuel 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Adresse complète *</Label>
                <Textarea
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex: 123 Avenue de la Liberté, Gombe, Kinshasa"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+243 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleNext}
                  disabled={!nif || !raisonSociale || !centreImpot || !periode}
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 7: Données fiscales */}
        {step === 'data' && (
          <Card>
            <CardHeader>
              <CardTitle>Données fiscales</CardTitle>
              <CardDescription>Remplissez selon votre catégorie d'entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {category === 'grande' && (
                <>
                  <div className="space-y-2">
                    <Label>Chiffre d'affaires local (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Chiffre d'affaires export (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Produits d'exploitation (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Charges externes (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Salaires et traitements (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Amortissements (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </>
              )}

              {category === 'moyenne' && (
                <>
                  <div className="space-y-2">
                    <Label>Chiffre d'affaires (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Produits d'exploitation (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Achats (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Salaires (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </>
              )}

              {category === 'petite' && (
                <>
                  <div className="space-y-2">
                    <Label>Vente de biens (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prestations de services (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Achats (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Loyer (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </>
              )}

              {category === 'micro' && (
                <>
                  <div className="space-y-2">
                    <Label>Total recettes (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total dépenses (CDF)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 8: Calcul */}
        {step === 'calculation' && (
          <Card>
            <CardHeader>
              <CardTitle>Calcul de l'impôt</CardTitle>
              <CardDescription>Montant automatiquement calculé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-green-800/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Base imposable:</span>
                  <span className="font-semibold">500,000 CDF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taux applicable:</span>
                  <span className="font-semibold">30%</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Impôt dû:</span>
                  <span className="text-3xl font-bold text-primary">150,000 CDF</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nom du déclarant *</Label>
                <Input
                  value={declarantName}
                  onChange={(e) => setDeclarantName(e.target.value)}
                  placeholder="Ex: Jean Mukendi"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 9: Récapitulatif */}
        {step === 'summary' && (
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif de la déclaration</CardTitle>
              <CardDescription>Vérifiez avant de soumettre</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NIF:</span>
                  <span className="font-semibold">{nif}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Raison sociale:</span>
                  <span className="font-semibold">{raisonSociale}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type d'impôt:</span>
                  <Badge>{taxTypeInfo[taxType].label}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Catégorie:</span>
                  <Badge variant="outline">{categoryInfo[category].label}</Badge>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-green-800/10">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Montant à payer:</span>
                  <span className="text-3xl font-bold text-primary">150,000 CDF</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Modifier
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-primary to-green-800" onClick={handleSubmit}>
                  Soumettre la déclaration <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 10: Paiement */}
        {step === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle>Paiement de la déclaration</CardTitle>
              <CardDescription>Référence: {declarationId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-900">Déclaration soumise</h3>
                    <p className="text-sm text-green-700">Votre déclaration a été enregistrée</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Montant à payer:</span>
                  <span className="text-3xl font-bold text-primary">150,000 CDF</span>
                </div>
              </div>

              <Button className="w-full h-12 text-lg bg-gradient-to-r from-primary to-green-800" onClick={handlePayment}>
                <CreditCard className="mr-2 w-5 h-5" />
                Payer maintenant
              </Button>

              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/mbongo-dashboard')}>
                Payer plus tard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 11: Succès */}
        {step === 'success' && (
          <Card className="border-green-200">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Paiement réussi !</h2>
                <p className="text-muted-foreground">Votre déclaration fiscale a été payée</p>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Référence:</span>
                  <span className="font-mono font-bold text-green-900">{declarationId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Type:</span>
                  <span className="font-medium text-green-900">{taxTypeInfo[taxType].label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Montant payé:</span>
                  <span className="font-bold text-green-900">150,000 CDF</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 w-4 h-4" />
                  Télécharger le reçu
                </Button>
                <Button className="flex-1" onClick={() => router.push('/dashboard/mbongo-dashboard')}>
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
