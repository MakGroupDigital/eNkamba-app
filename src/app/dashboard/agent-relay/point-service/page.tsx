'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  MapPin,
  Store,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Banknote,
  Smartphone,
  Coffee,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PointServicePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Point de Service eNkamba</h1>
          <p className="text-sm text-muted-foreground">
            Intégrez nos services dans votre activité existante
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MapPin size={40} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold font-headline mb-2">
                Devenez Point de Service
              </h2>
              <p className="text-white/90 mb-4">
                Ajoutez des services financiers à votre commerce existant sans 
                investissement initial et générez des revenus complémentaires.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Commission 3-8%
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Aucun investissement
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ideal For */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store size={24} className="text-orange-600" />
            Idéal pour votre type de commerce
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                type: 'Boutiques',
                icon: ShoppingBag,
                description: 'Épiceries, magasins de proximité, bazars',
                examples: ['Épicerie de quartier', 'Magasin général', 'Bazar']
              },
              {
                type: 'Restaurants & Cafés',
                icon: Coffee,
                description: 'Restaurants, cafés, bars, maquis',
                examples: ['Restaurant local', 'Café internet', 'Maquis']
              },
              {
                type: 'Services',
                icon: Smartphone,
                description: 'Salons, garages, ateliers, bureaux',
                examples: ['Salon de coiffure', 'Garage auto', 'Atelier couture']
              }
            ].map((business, index) => (
              <div key={index} className="p-4 rounded-xl border border-border hover:border-orange-500/30 transition-colors">
                <div className="text-center mb-4">
                  <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
                    <business.icon size={24} className="text-orange-600" />
                  </div>
                  <h3 className="font-semibold">{business.type}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{business.description}</p>
                </div>
                <div className="space-y-1">
                  {business.examples.map((example, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-orange-600" />
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services Offered */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone size={24} className="text-orange-600" />
            Services que vous pourrez offrir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Recharge téléphonique',
                description: 'Vendez du crédit pour tous les opérateurs',
                commission: '5-8%',
                difficulty: 'Facile'
              },
              {
                title: 'Paiement de factures',
                description: 'Électricité, eau, internet, TV',
                commission: '2-5%',
                difficulty: 'Facile'
              },
              {
                title: 'Transfert d\'argent',
                description: 'Envois locaux et nationaux',
                commission: '1-3%',
                difficulty: 'Moyen'
              },
              {
                title: 'Dépôt/Retrait',
                description: 'Services bancaires de base',
                commission: '2-4%',
                difficulty: 'Moyen'
              },
              {
                title: 'Consultation solde',
                description: 'Vérification de comptes clients',
                commission: 'Gratuit',
                difficulty: 'Facile'
              },
              {
                title: 'Cartes prépayées',
                description: 'Vente de cartes de transport, etc.',
                commission: '3-6%',
                difficulty: 'Facile'
              }
            ].map((service, index) => (
              <div key={index} className="p-4 rounded-xl border border-border hover:border-orange-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{service.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-1 ${
                        service.difficulty === 'Facile' 
                          ? 'border-primary text-primary' 
                          : 'border-orange-500 text-orange-700'
                      }`}
                    >
                      {service.difficulty}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
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
            <CheckCircle2 size={24} className="text-orange-600" />
            Prérequis simples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-orange-600">Prérequis obligatoires</h3>
              <div className="space-y-3">
                {[
                  'Avoir un commerce existant',
                  'Smartphone Android/iOS',
                  'Bonne réputation locale',
                  'Formation de base (1 jour)',
                  'Respect des procédures'
                ].map((req, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-orange-600 flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-primary">Avantages</h3>
              <div className="space-y-3">
                {[
                  'Aucun investissement initial',
                  'Horaires flexibles',
                  'Formation rapide',
                  'Support technique inclus',
                  'Revenus complémentaires'
                ].map((advantage, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={24} className="text-orange-600" />
            Exemples de revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-orange-50">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
                <Coffee size={24} className="text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Petit café</h3>
              <p className="text-sm text-muted-foreground mb-2">
                20 transactions/jour
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Recharges</span>
                  <span>15,000 FCFA</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Factures</span>
                  <span>8,000 FCFA</span>
                </div>
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total/mois</span>
                    <span className="text-orange-600">23,000 FCFA</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-orange-50">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
                <ShoppingBag size={24} className="text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Épicerie</h3>
              <p className="text-sm text-muted-foreground mb-2">
                50 transactions/jour
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Recharges</span>
                  <span>35,000 FCFA</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Transferts</span>
                  <span>20,000 FCFA</span>
                </div>
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total/mois</span>
                    <span className="text-orange-600">55,000 FCFA</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-orange-50">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
                <Smartphone size={24} className="text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Salon coiffure</h3>
              <p className="text-sm text-muted-foreground mb-2">
                30 transactions/jour
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Services divers</span>
                  <span>25,000 FCFA</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Fidélité client</span>
                  <span>15,000 FCFA</span>
                </div>
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total/mois</span>
                    <span className="text-orange-600">40,000 FCFA</span>
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
            <Clock size={24} className="text-orange-600" />
            Processus d\'inscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Candidature simple',
                description: 'Formulaire rapide avec photos de votre commerce',
                duration: '10 minutes'
              },
              {
                step: 2,
                title: 'Vérification express',
                description: 'Validation de votre commerce et documents',
                duration: '24-48h'
              },
              {
                step: 3,
                title: 'Formation rapide',
                description: 'Formation d\'1 jour sur les services de base',
                duration: '1 jour'
              },
              {
                step: 4,
                title: 'Activation immédiate',
                description: 'Activation de votre compte et début d\'activité',
                duration: 'Immédiat'
              }
            ].map((process, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <div className="h-10 w-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold">
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
          className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-lg"
          asChild
        >
          <Link href="/dashboard/agent-relay/application?type=point-service">
            <MapPin size={20} className="mr-2" />
            Devenir Point de Service
          </Link>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Questions ? <Link href="/dashboard/settings/help" className="text-orange-600 hover:underline">Contactez-nous</Link>
        </p>
      </div>
    </div>
  );
}