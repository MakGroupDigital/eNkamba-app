'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Calculator, CreditCard, Download } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type TaxType = 'IPR' | 'ICA' | 'TVA' | 'IMPOT_FONCIER' | 'AUTRE';
type DeclarationStep = 'type' | 'info' | 'revenue' | 'deductions' | 'summary' | 'payment' | 'success';

interface TaxDeclaration {
  id?: string;
  type: TaxType;
  period: string;
  year: string;
  // Informations personnelles/entreprise
  taxpayerName: string;
  taxpayerNumber: string;
  address: string;
  phone: string;
  // Revenus
  grossRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  // Déductions
  professionalExpenses: number;
  socialCharges: number;
  otherDeductions: number;
  totalDeductions: number;
  // Calcul
  taxableIncome: number;
  taxRate: number;
  taxAmount: number;
  // Statut
  status: 'draft' | 'submitted' | 'paid';
  createdAt?: string;
  submittedAt?: string;
  paidAt?: string;
}

const taxTypes = {
  IPR: { label: 'IPR - Impôt sur les Revenus des Personnes', rate: 0.30 },
  ICA: { label: 'ICA - Impôt sur le Chiffre d\'Affaires', rate: 0.01 },
  TVA: { label: 'TVA - Taxe sur la Valeur Ajoutée', rate: 0.16 },
  IMPOT_FONCIER: { label: 'Impôt Foncier', rate: 0.01 },
  AUTRE: { label: 'Autre type d\'impôt', rate: 0.10 },
};

export default function TaxDeclarationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<DeclarationStep>('type');
  const [declaration, setDeclaration] = useState<TaxDeclaration>({
    type: 'IPR',
    period: 'mensuel',
    year: new Date().getFullYear().toString(),
    taxpayerName: '',
    taxpayerNumber: '',
    address: '',
    phone: '',
    grossRevenue: 0,
    otherRevenue: 0,
    totalRevenue: 0,
    professionalExpenses: 0,
    socialCharges: 0,
    otherDeductions: 0,
    totalDeductions: 0,
    taxableIncome: 0,
    taxRate: 0.30,
    taxAmount: 0,
    status: 'draft',
  });

  const calculateTax = () => {
    const totalRevenue = declaration.grossRevenue + declaration.otherRevenue;
    const totalDeductions = declaration.professionalExpenses + declaration.socialCharges + declaration.otherDeductions;
    const taxableIncome = Math.max(0, totalRevenue - totalDeductions);
    const taxRate = taxTypes[declaration.type].rate;
    const taxAmount = taxableIncome * taxRate;

    setDeclaration(prev => ({
      ...prev,
      totalRevenue,
      totalDeductions,
      taxableIncome,
      taxRate,
      taxAmount,
    }));
  };

  const handleNext = () => {
    const steps: DeclarationStep[] = ['type', 'info', 'revenue', 'deductions', 'summary', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      if (step === 'deductions') {
        calculateTax();
      }
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: DeclarationStep[] = ['type', 'info', 'revenue', 'deductions', 'summary', 'payment', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmitDeclaration = () => {
    setDeclaration(prev => ({
      ...prev,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      id: `TAX-${Date.now()}`,
    }));
    handleNext();
  };

  const handlePayment = async () => {
    // Simuler le paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDeclaration(prev => ({
      ...prev,
      status: 'paid',
      paidAt: new Date().toISOString(),
    }));

    toast({
      title: "Paiement réussi !",
      description: `Votre impôt de ${declaration.taxAmount.toLocaleString('fr-FR')} CDF a été payé avec succès.`,
    });

    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Déclaration et Paiement d'Impôts
            </h1>
            <p className="text-sm text-muted-foreground">Processus officiel de déclaration fiscale RDC</p>
          </div>
        </header>

        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {[
              { key: 'type', label: 'Type', icon: FileText },
              { key: 'info', label: 'Informations', icon: FileText },
              { key: 'revenue', label: 'Revenus', icon: Calculator },
              { key: 'deductions', label: 'Déductions', icon: Calculator },
              { key: 'summary', label: 'Récapitulatif', icon: CheckCircle2 },
              { key: 'payment', label: 'Paiement', icon: CreditCard },
            ].map((s, idx) => {
              const steps: DeclarationStep[] = ['type', 'info', 'revenue', 'deductions', 'summary', 'payment'];
              const currentIdx = steps.indexOf(step);
              const isActive = s.key === step;
              const isCompleted = idx < currentIdx;
              const Icon = s.icon;

              return (
                <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-muted'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
                  </div>
                  {idx < 5 && <div className={`h-0.5 w-8 ${isCompleted ? 'bg-green-600' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step: Type d'impôt */}
        {step === 'type' && (
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez le type d'impôt</CardTitle>
              <CardDescription>Choisissez le type d'impôt que vous souhaitez déclarer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(taxTypes).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      declaration.type === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="taxType"
                      value={key}
                      checked={declaration.type === key}
                      onChange={(e) => setDeclaration(prev => ({ ...prev, type: e.target.value as TaxType, taxRate: value.rate }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{value.label}</p>
                      <p className="text-sm text-muted-foreground">Taux: {(value.rate * 100).toFixed(0)}%</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={declaration.period} onValueChange={(value) => setDeclaration(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="trimestriel">Trimestriel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Année fiscale</Label>
                  <Select value={declaration.year} onValueChange={(value) => setDeclaration(prev => ({ ...prev, year: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full" onClick={handleNext}>
                Continuer <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Informations */}
        {step === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Informations du contribuable</CardTitle>
              <CardDescription>Renseignez vos informations personnelles ou d'entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet / Raison sociale *</Label>
                <Input
                  value={declaration.taxpayerName}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, taxpayerName: e.target.value }))}
                  placeholder="Ex: Jean Mukendi / SARL TechCongo"
                />
              </div>

              <div className="space-y-2">
                <Label>Numéro d'identification fiscale (NIF) *</Label>
                <Input
                  value={declaration.taxpayerNumber}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, taxpayerNumber: e.target.value }))}
                  placeholder="Ex: A1234567X"
                />
              </div>

              <div className="space-y-2">
                <Label>Adresse complète *</Label>
                <Textarea
                  value={declaration.address}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: 123 Avenue de la Liberté, Gombe, Kinshasa"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Numéro de téléphone *</Label>
                <Input
                  value={declaration.phone}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +243 XXX XXX XXX"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleNext}
                  disabled={!declaration.taxpayerName || !declaration.taxpayerNumber}
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Revenus */}
        {step === 'revenue' && (
          <Card>
            <CardHeader>
              <CardTitle>Déclaration des revenus</CardTitle>
              <CardDescription>Indiquez vos revenus pour la période sélectionnée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Revenu brut principal (CDF) *</Label>
                <Input
                  type="number"
                  value={declaration.grossRevenue || ''}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, grossRevenue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">Salaire, chiffre d'affaires, ou revenu principal</p>
              </div>

              <div className="space-y-2">
                <Label>Autres revenus (CDF)</Label>
                <Input
                  type="number"
                  value={declaration.otherRevenue || ''}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, otherRevenue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">Revenus locatifs, dividendes, etc.</p>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total des revenus:</span>
                  <span className="text-2xl font-bold text-primary">
                    {(declaration.grossRevenue + declaration.otherRevenue).toLocaleString('fr-FR')} CDF
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleNext}
                  disabled={declaration.grossRevenue <= 0}
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Déductions */}
        {step === 'deductions' && (
          <Card>
            <CardHeader>
              <CardTitle>Déductions fiscales</CardTitle>
              <CardDescription>Indiquez vos déductions autorisées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Frais professionnels (CDF)</Label>
                <Input
                  type="number"
                  value={declaration.professionalExpenses || ''}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, professionalExpenses: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Frais de transport, fournitures, etc.</p>
              </div>

              <div className="space-y-2">
                <Label>Charges sociales (CDF)</Label>
                <Input
                  type="number"
                  value={declaration.socialCharges || ''}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, socialCharges: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">CNSS, INPP, etc.</p>
              </div>

              <div className="space-y-2">
                <Label>Autres déductions (CDF)</Label>
                <Input
                  type="number"
                  value={declaration.otherDeductions || ''}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, otherDeductions: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Dons, intérêts d'emprunt, etc.</p>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total des déductions:</span>
                  <span className="text-xl font-bold">
                    {(declaration.professionalExpenses + declaration.socialCharges + declaration.otherDeductions).toLocaleString('fr-FR')} CDF
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  Calculer l'impôt <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Récapitulatif */}
        {step === 'summary' && (
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif de la déclaration</CardTitle>
              <CardDescription>Vérifiez les informations avant de soumettre</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations */}
              <div>
                <h3 className="font-semibold mb-3">Informations du contribuable</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom:</span>
                    <span className="font-medium">{declaration.taxpayerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NIF:</span>
                    <span className="font-medium">{declaration.taxpayerNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type d'impôt:</span>
                    <Badge>{taxTypes[declaration.type].label}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Période:</span>
                    <span className="font-medium">{declaration.period} - {declaration.year}</span>
                  </div>
                </div>
              </div>

              {/* Calcul */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-green-800/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Revenus totaux:</span>
                  <span className="font-semibold">{declaration.totalRevenue.toLocaleString('fr-FR')} CDF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Déductions totales:</span>
                  <span className="font-semibold text-red-600">- {declaration.totalDeductions.toLocaleString('fr-FR')} CDF</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-semibold">Revenu imposable:</span>
                  <span className="font-bold">{declaration.taxableIncome.toLocaleString('fr-FR')} CDF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taux d'imposition:</span>
                  <span className="font-semibold">{(declaration.taxRate * 100).toFixed(0)}%</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Impôt à payer:</span>
                  <span className="text-3xl font-bold text-primary">{declaration.taxAmount.toLocaleString('fr-FR')} CDF</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Modifier
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-primary to-green-800" onClick={handleSubmitDeclaration}>
                  Soumettre la déclaration <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Paiement */}
        {step === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle>Paiement de l'impôt</CardTitle>
              <CardDescription>Déclaration soumise - Référence: {declaration.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-900">Déclaration soumise avec succès</h3>
                    <p className="text-sm text-green-700">Votre déclaration a été enregistrée</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Référence:</span>
                    <span className="font-mono font-bold text-green-900">{declaration.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Date:</span>
                    <span className="font-medium text-green-900">{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold">Montant à payer:</span>
                  <span className="text-3xl font-bold text-primary">{declaration.taxAmount.toLocaleString('fr-FR')} CDF</span>
                </div>
                <p className="text-sm text-muted-foreground">Le paiement sera débité de votre portefeuille eNkamba</p>
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

        {/* Step: Succès */}
        {step === 'success' && (
          <Card className="border-green-200">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Paiement réussi !</h2>
                <p className="text-muted-foreground">Votre impôt a été payé avec succès</p>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Référence:</span>
                  <span className="font-mono font-bold text-green-900">{declaration.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Type:</span>
                  <span className="font-medium text-green-900">{taxTypes[declaration.type].label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Montant payé:</span>
                  <span className="font-bold text-green-900">{declaration.taxAmount.toLocaleString('fr-FR')} CDF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Date:</span>
                  <span className="font-medium text-green-900">{new Date().toLocaleDateString('fr-FR')}</span>
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
