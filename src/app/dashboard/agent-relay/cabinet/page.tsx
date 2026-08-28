'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Store,
  Building,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Banknote,
  CreditCard,
  Globe,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CabinetPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Cabinet Kenz</h1>
          <p className="text-sm text-muted-foreground">
            Ouvrez un cabinet de services financiers complet
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#073B9A] via-[#073B9A] to-[#073B9A] p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Store size={40} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold font-headline mb-2">
                Devenez Cabiniste
              </h2>
              <p className="text-white/90 mb-4">
                Ouvrez votre propre cabinet de services financiers avec notre plateforme 
                complète et bénéficiez de revenus plus élevés.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Commission 10-15%
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Services étendus
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Services Offered */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building size={24} className="text-[#F51B2B]" />
            Services de cabinet complets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Services bancaires',
                description: 'Dépôts, retraits, virements, ouverture de comptes',
                commission: '5-8%',
                category: 'Bancaire'
              },
              {
                title: 'Change de devises',
                description: 'Achat et vente de devises étrangères',
                commission: '2-5%',
                category: 'Change'
              },
              {
                title: 'Transferts internationaux',
                description: 'Envois d\'argent vers l\'étranger et réception',
                commission: '3-6%',
                category: 'International'
              },
              {
                title: 'Microfinance',
                description: 'Octroi de microcrédits et épargne',
                commission: '8-12%',
                category: 'Crédit'
              },
              {
                title: 'Assurances',
                description: 'Vente de polices d\'assurance diverses',
                commission: '10-20%',
                category: 'Assurance'
              },
              {
                title: 'Paiements marchands',
                description: 'Solutions de paiement pour commerçants',
                commission: '1-3%',
                category: 'Commerce'
              }
            ].map((service, index) => (
              <div key={index} className="p-4 rounded-xl border border-border hover:border-[#F51B2B]/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{service.title}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {service.category}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-[#F51B2B]/15 text-[#F51B2B]">
                    {service.commission}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 size={24} className="text-[#F51B2B]" />
            Prérequis pour ouvrir un cabinet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-[#F51B2B]">Prérequis obligatoires</h3>
              <div className="space-y-3">
                {[
                  'Local commercial dédié (min. 20m²)',
                  'Capital de départ (500,000 FCFA min.)',
                  'Licence commerciale valide',
                  'Expérience dans les services financiers',
                  'Formation certifiante (5 jours)'
                ].map((req, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F51B2B] flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-primary">Équipements requis</h3>
              <div className="space-y-3">
                {[
                  'Coffre-fort sécurisé',
                  'Système de sécurité (caméras)',
                  'Connexion internet haut débit',
                  'Ordinateur + imprimante',
                  'Signalétique Kenz'
                ].map((eq, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{eq}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={24} className="text-[#F51B2B]" />
            Avantages du cabinet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-[#F51B2B]/10">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-[#F51B2B]/15 flex items-center justify-center">
                <Banknote size={24} className="text-[#F51B2B]" />
              </div>
              <h3 className="font-semibold mb-2">Revenus élevés</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Gagnez entre 300,000 et 1,000,000 FCFA par mois
              </p>
              <Badge variant="secondary" className="bg-[#F51B2B]/15 text-[#F51B2B]">
                10-15% commission
              </Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-[#F51B2B]/10">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-[#F51B2B]/15 flex items-center justify-center">
                <Globe size={24} className="text-[#F51B2B]" />
              </div>
              <h3 className="font-semibold mb-2">Marque reconnue</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Bénéficiez de la notoriété Kenz
              </p>
              <Badge variant="secondary" className="bg-[#F51B2B]/15 text-[#F51B2B]">
                Branding inclus
              </Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-[#F51B2B]/10">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-[#F51B2B]/15 flex items-center justify-center">
                <BarChart3 size={24} className="text-[#F51B2B]" />
              </div>
              <h3 className="font-semibold mb-2">Outils avancés</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Tableau de bord et analytics complets
              </p>
              <Badge variant="secondary" className="bg-[#F51B2B]/15 text-[#F51B2B]">
                Pro dashboard
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={24} className="text-[#F51B2B]" />
            Investissement requis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Coûts initiaux</h3>
              <div className="space-y-3">
                {[
                  { item: 'Caution de garantie', amount: '500,000 FCFA' },
                  { item: 'Équipements de base', amount: '200,000 FCFA' },
                  { item: 'Formation et certification', amount: '100,000 FCFA' },
                  { item: 'Signalétique et branding', amount: '150,000 FCFA' }
                ].map((cost, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">{cost.item}</span>
                    <Badge variant="outline">{cost.amount}</Badge>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-[#F51B2B]/10 border border-[#F51B2B]/30">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total initial</span>
                  <span className="text-lg font-bold text-[#F51B2B]">950,000 FCFA</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Retour sur investissement</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-2">Scénario conservateur</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    50 transactions/jour × 2,000 FCFA commission moyenne
                  </p>
                  <div className="flex justify-between">
                    <span className="text-sm">Revenus mensuels</span>
                    <span className="font-semibold text-primary">300,000 FCFA</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm">ROI</span>
                    <span className="font-semibold text-primary">3-4 mois</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-2">Scénario optimiste</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    150 transactions/jour × 2,500 FCFA commission moyenne
                  </p>
                  <div className="flex justify-between">
                    <span className="text-sm">Revenus mensuels</span>
                    <span className="font-semibold text-primary">1,125,000 FCFA</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm">ROI</span>
                    <span className="font-semibold text-primary">1 mois</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} className="text-[#F51B2B]" />
            Processus d\'ouverture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Candidature détaillée',
                description: 'Dossier complet avec business plan et documents',
                duration: '1 semaine'
              },
              {
                step: 2,
                title: 'Évaluation et visite',
                description: 'Évaluation du dossier et visite du local',
                duration: '1-2 semaines'
              },
              {
                step: 3,
                title: 'Formation certifiante',
                description: 'Formation intensive de 5 jours sur tous les services',
                duration: '1 semaine'
              },
              {
                step: 4,
                title: 'Installation et ouverture',
                description: 'Installation des équipements et ouverture officielle',
                duration: '1 semaine'
              }
            ].map((process, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <div className="h-10 w-10 rounded-full bg-[#F51B2B] text-white flex items-center justify-center font-semibold">
                  {process.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{process.title}</h3>
                  <p className="text-sm text-muted-foreground">{process.description}</p>
                </div>
                <Badge variant="outline">{process.duration}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button 
          size="lg" 
          className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-[#073B9A] to-[#073B9A] hover:from-[#073B9A] hover:to-[#073B9A] shadow-lg"
          asChild
        >
          <Link href="/dashboard/agent-relay/application?type=cabinet">
            <Store size={20} className="mr-2" />
            Ouvrir mon cabinet Kenz
          </Link>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Besoin d'aide ? <Link href="/dashboard/settings/help" className="text-[#F51B2B] hover:underline">Parlez à un conseiller</Link>
        </p>
      </div>
    </div>
  );
}