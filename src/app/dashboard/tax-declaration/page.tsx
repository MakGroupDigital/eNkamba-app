'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Calculator, CreditCard, Download, Building2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type CompanyCategory = 'grande' | 'moyenne' | 'petite' | 'micro';
type TaxType = 'IS_IBP' | 'TVA' | 'IPR' | 'IERE' | 'IMPOT_MOBILIER';
type DeclarationStep = 'category' | 'taxType' | 'identification' | 'data' | 'calculation' | 'summary' | 'payment' | 'success';

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
  const [step, setStep] = useState<DeclarationStep>('category');
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
  const [montantTotal, setMontantTotal] = useState(0);
  const [declarationId, setDeclarationId] = useState('');

  const handleNext = () => {
    const steps: DeclarationStep[] = ['category', 'taxType', 'identification', 'data', 'calculation', 'summary', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: DeclarationStep[] = ['category', 'taxType', 'identification', 'data', 'calculation', 'summary', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
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
              Déclaration Fiscale DGI
            </h1>
            <p className="text-sm text-muted-foreground">Système officiel de déclaration d'impôts RDC</p>
          </div>
        </header>

        {/* Étape 1: Catégorie d'entreprise */}
        {step === 'category' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Sélectionnez votre catégorie d'entreprise
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
              <Button className="w-full" onClick={handleNext}>
                Continuer <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Type d'impôt */}
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

        {/* Étape 3: Identification */}
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

        {/* Étape 4: Données fiscales */}
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

        {/* Étape 5: Calcul */}
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

        {/* Étape 6: Récapitulatif */}
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

        {/* Étape 7: Paiement */}
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

        {/* Étape 8: Succès */}
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
