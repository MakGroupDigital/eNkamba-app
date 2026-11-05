'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, CheckCircle2, Shield, Download, Share2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { SonasIcon, RawbankAssuranceIcon, SunuAssuranceIcon, ActivaAssuranceIcon } from "@/components/icons/insurance-icons";

type PaymentStep = 'company' | 'offer' | 'info' | 'payment' | 'receipt';

interface InsuranceCompany {
  id: string;
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  description: string;
  rating: number;
}

interface InsuranceOffer {
  id: string;
  companyId: string;
  name: string;
  type: string;
  coverage: string[];
  price: number;
  currency: 'USD' | 'CDF';
  duration: string;
  description: string;
}

interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
}

interface PaymentReceipt {
  id: string;
  date: string;
  company: InsuranceCompany;
  offer: InsuranceOffer;
  customer: CustomerInfo;
  paymentMethod: string;
}

// Base de données des compagnies d'assurance
const INSURANCE_COMPANIES: InsuranceCompany[] = [
  {
    id: 'sonas',
    name: 'SONAS',
    logo: SonasIcon,
    description: 'Société Nationale d\'Assurance',
    rating: 4.5,
  },
  {
    id: 'rawbank-assurance',
    name: 'Rawbank Assurance',
    logo: RawbankAssuranceIcon,
    description: 'Assurance de confiance',
    rating: 4.7,
  },
  {
    id: 'sunu',
    name: 'SUNU Assurances',
    logo: SunuAssuranceIcon,
    description: 'Leader africain de l\'assurance',
    rating: 4.6,
  },
  {
    id: 'activa',
    name: 'ACTIVA Assurance',
    logo: ActivaAssuranceIcon,
    description: 'Votre partenaire assurance',
    rating: 4.4,
  },
];

// Base de données des offres d'assurance
const INSURANCE_OFFERS: InsuranceOffer[] = [
  // SONAS
  {
    id: 'sonas-auto',
    companyId: 'sonas',
    name: 'Assurance Auto',
    type: 'Automobile',
    coverage: ['Responsabilité civile', 'Vol', 'Incendie', 'Bris de glace'],
    price: 150,
    currency: 'USD',
    duration: '1 an',
    description: 'Protection complète pour votre véhicule',
  },
  {
    id: 'sonas-sante',
    companyId: 'sonas',
    name: 'Assurance Santé',
    type: 'Santé',
    coverage: ['Hospitalisation', 'Consultations', 'Médicaments', 'Analyses'],
    price: 200,
    currency: 'USD',
    duration: '1 an',
    description: 'Couverture santé pour toute la famille',
  },
  {
    id: 'sonas-vie',
    companyId: 'sonas',
    name: 'Assurance Vie',
    type: 'Vie',
    coverage: ['Décès', 'Invalidité', 'Épargne'],
    price: 100,
    currency: 'USD',
    duration: '1 an',
    description: 'Protégez l\'avenir de votre famille',
  },
  // Rawbank Assurance
  {
    id: 'rawbank-habitation',
    companyId: 'rawbank-assurance',
    name: 'Assurance Habitation',
    type: 'Habitation',
    coverage: ['Incendie', 'Vol', 'Dégâts des eaux', 'Responsabilité civile'],
    price: 120,
    currency: 'USD',
    duration: '1 an',
    description: 'Protégez votre maison et vos biens',
  },
  {
    id: 'rawbank-voyage',
    companyId: 'rawbank-assurance',
    name: 'Assurance Voyage',
    type: 'Voyage',
    coverage: ['Annulation', 'Bagages', 'Rapatriement', 'Frais médicaux'],
    price: 50,
    currency: 'USD',
    duration: '1 voyage',
    description: 'Voyagez l\'esprit tranquille',
  },
  // SUNU
  {
    id: 'sunu-entreprise',
    companyId: 'sunu',
    name: 'Assurance Entreprise',
    type: 'Entreprise',
    coverage: ['Locaux', 'Matériel', 'Responsabilité', 'Perte d\'exploitation'],
    price: 500,
    currency: 'USD',
    duration: '1 an',
    description: 'Protection complète pour votre entreprise',
  },
  {
    id: 'sunu-moto',
    companyId: 'sunu',
    name: 'Assurance Moto',
    type: 'Moto',
    coverage: ['Responsabilité civile', 'Vol', 'Accident'],
    price: 80,
    currency: 'USD',
    duration: '1 an',
    description: 'Roulez en toute sécurité',
  },
  // ACTIVA
  {
    id: 'activa-scolaire',
    companyId: 'activa',
    name: 'Assurance Scolaire',
    type: 'Scolaire',
    coverage: ['Accidents scolaires', 'Responsabilité civile', 'Vol de matériel'],
    price: 30,
    currency: 'USD',
    duration: '1 an scolaire',
    description: 'Protégez vos enfants à l\'école',
  },
  {
    id: 'activa-agricole',
    companyId: 'activa',
    name: 'Assurance Agricole',
    type: 'Agriculture',
    coverage: ['Récoltes', 'Bétail', 'Matériel agricole'],
    price: 250,
    currency: 'USD',
    duration: '1 an',
    description: 'Sécurisez votre activité agricole',
  },
];

export default function InsurancePage() {
  const { toast } = useToast();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<PaymentStep>('company');
  const [selectedCompany, setSelectedCompany] = useState<InsuranceCompany | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<InsuranceOffer | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
  });
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showCompanyDrawer, setShowCompanyDrawer] = useState(false);
  const [showOfferDrawer, setShowOfferDrawer] = useState(false);

  const handleSelectCompany = (company: InsuranceCompany) => {
    setSelectedCompany(company);
    setShowCompanyDrawer(false);
    setShowOfferDrawer(true);
  };

  const handleSelectOffer = (offer: InsuranceOffer) => {
    setSelectedOffer(offer);
    setShowOfferDrawer(false);
    setStep('info');
  };

  const handlePayment = async () => {
    if (!selectedCompany || !selectedOffer || !customer.fullName || !customer.phone) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setIsPaying(true);
    setStep('payment');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newReceipt: PaymentReceipt = {
      id: `ENK-INS-${Date.now()}`,
      date: new Date().toISOString(),
      company: selectedCompany,
      offer: selectedOffer,
      customer,
      paymentMethod: 'Kenz Pay Wallet',
    };

    setReceipt(newReceipt);
    setIsPaying(false);
    setStep('receipt');

    toast({
      title: "Paiement réussi !",
      description: `Assurance ${selectedOffer.name} souscrite avec succès.`,
    });
  };

  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `recu-assurance-${receipt?.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Reçu téléchargé",
          description: "Le reçu a été téléchargé avec succès.",
        });
      } catch (error) {
        console.error('Erreur téléchargement:', error);
      }
    }
  };

  const handleShareReceipt = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `recu-${receipt?.id}.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Reçu d\'assurance',
                text: `Reçu de souscription d\'assurance - ${receipt?.id}`,
                files: [file],
              });
            } else {
              toast({
                title: "Partage non disponible",
                description: "Utilisez le bouton de téléchargement.",
              });
            }
          }
        });
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    }
  };

  const companyOffers = selectedCompany 
    ? INSURANCE_OFFERS.filter(o => o.companyId === selectedCompany.id)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#073B9A] to-[#073B9A] bg-clip-text text-transparent">
              Assurance
            </h1>
            <p className="text-sm text-muted-foreground">Souscrivez à une assurance en quelques clics</p>
          </div>
        </header>

        {/* Sélection initiale */}
        {step === 'company' && (
          <Card>
            <CardHeader>
              <CardTitle>Choisissez votre compagnie d'assurance</CardTitle>
              <CardDescription>Sélectionnez parmi les meilleures compagnies de RDC</CardDescription>
            </CardHeader>
            <CardContent>
              <Sheet open={showCompanyDrawer} onOpenChange={setShowCompanyDrawer}>
                <SheetTrigger asChild>
                  <Button className="w-full h-16 text-lg" onClick={() => setShowCompanyDrawer(true)}>
                    <Shield className="mr-2 w-6 h-6" />
                    Voir les compagnies d'assurance
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Compagnies d'assurance</SheetTitle>
                    <SheetDescription>Choisissez votre assureur</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(80vh-120px)]">
                    {INSURANCE_COMPANIES.map((company) => {
                      const LogoComponent = company.logo;
                      return (
                        <button
                          key={company.id}
                          onClick={() => handleSelectCompany(company)}
                          className="w-full p-4 border-2 rounded-lg hover:border-primary transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <LogoComponent className="w-12 h-12" />
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{company.name}</h3>
                              <p className="text-sm text-muted-foreground">{company.description}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-semibold">{company.rating}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        )}

        {/* Drawer des offres */}
        <Sheet open={showOfferDrawer} onOpenChange={setShowOfferDrawer}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedCompany && (() => {
                  const LogoComponent = selectedCompany.logo;
                  return <LogoComponent className="w-8 h-8" />;
                })()}
                {selectedCompany?.name}
              </SheetTitle>
              <SheetDescription>Choisissez votre offre d'assurance</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(80vh-120px)]">
              {companyOffers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => handleSelectOffer(offer)}
                  className="w-full p-4 border-2 rounded-lg hover:border-primary transition-all text-left"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{offer.name}</h3>
                        <Badge className="mt-1">{offer.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{offer.price} {offer.currency}</p>
                        <p className="text-xs text-muted-foreground">{offer.duration}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {offer.coverage.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">✓ {item}</Badge>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Informations client */}
        {step === 'info' && selectedOffer && selectedCompany && (
          <Card>
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {(() => {
                    const LogoComponent = selectedCompany.logo;
                    return <LogoComponent className="w-6 h-6" />;
                  })()}
                  <span className="font-semibold">{selectedOffer.name}</span>
                  <Badge>{selectedOffer.price} {selectedOffer.currency}</Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  value={customer.fullName}
                  onChange={(e) => setCustomer(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: Jean Mukendi"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone *</Label>
                <Input
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +243 XXX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: jean@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse *</Label>
                <Input
                  value={customer.address}
                  onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: Avenue Kasa-Vubu, Kinshasa"
                />
              </div>
              <div className="space-y-2">
                <Label>Numéro d'identité</Label>
                <Input
                  value={customer.idNumber}
                  onChange={(e) => setCustomer(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="Ex: 1-XXXX-NXXXXX-XX"
                />
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/10">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Montant à payer:</span>
                  <span className="text-2xl font-bold text-primary">{selectedOffer.price} {selectedOffer.currency}</span>
                </div>
              </div>
              <Button className="w-full h-12 bg-gradient-to-r from-primary to-primary" onClick={handlePayment}>
                Payer maintenant
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paiement en cours */}
        {step === 'payment' && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Paiement en cours...</h3>
              <p className="text-muted-foreground">Veuillez patienter</p>
            </CardContent>
          </Card>
        )}

        {/* Reçu */}
        {step === 'receipt' && receipt && (
          <div className="space-y-6">
            <div ref={receiptRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#073B9A] to-[#073B9A] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Image src="/kenz-logo.png" alt="Kenz" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Kenz Pay</h2>
                      <p className="text-sm opacity-90">Reçu d'assurance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Référence</p>
                    <p className="font-mono font-bold text-lg">{receipt.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <p className="text-center text-xl font-bold mt-2">Souscription réussie</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center py-6 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Prime payée</p>
                  <p className="text-4xl font-bold text-primary">
                    {receipt.offer.price} {receipt.offer.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(receipt.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">COMPAGNIE D'ASSURANCE</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const LogoComponent = receipt.company.logo;
                        return <LogoComponent className="w-10 h-10" />;
                      })()}
                      <span className="font-bold text-lg">{receipt.company.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{receipt.company.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">OFFRE SOUSCRITE</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Produit:</span>
                      <span className="font-semibold">{receipt.offer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge>{receipt.offer.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Durée:</span>
                      <span className="font-semibold">{receipt.offer.duration}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Couvertures:</p>
                      <div className="flex flex-wrap gap-1">
                        {receipt.offer.coverage.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">✓ {item}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">ASSURÉ</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom:</span>
                      <span className="font-semibold">{receipt.customer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Téléphone:</span>
                      <span className="font-semibold">{receipt.customer.phone}</span>
                    </div>
                    {receipt.customer.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{receipt.customer.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adresse:</span>
                      <span className="text-sm text-right">{receipt.customer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Ce reçu confirme votre souscription. Vous recevrez votre police d'assurance par email.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kenz Pay © {new Date().getFullYear()} - Tous droits réservés
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" onClick={handleDownloadReceipt} className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
              <Button variant="outline" onClick={handleShareReceipt} className="gap-2">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
              <Button onClick={() => router.push('/dashboard/mbongo-dashboard')} className="gap-2">
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
