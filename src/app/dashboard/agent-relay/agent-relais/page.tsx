'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Handshake,
  Smartphone,
  Users,
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  Banknote
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AgentRelaisPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Agent Relais eNkamba</h1>
          <p className="text-sm text-muted-foreground">
            Offrez des services financiers de base dans votre commerce
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary via-primary to-primary p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Handshake size={40} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold font-headline mb-2">
                Devenez Agent Relais
              </h2>
              <p className="text-white/90 mb-4">
                Rejoignez notre réseau et offrez des services financiers essentiels 
                à votre communauté tout en générant des revenus supplémentaires.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Commission 5-10%
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Formation incluse
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
            <Smartphone size={24} className="text-primary" />
            Services que vous pourrez offrir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Dépôt d\'argent',
                description: 'Permettez à vos clients de déposer de l\'argent sur leur compte eNkamba',
                commission: '2-3%'
              },
              {
                title: 'Retrait d\'argent',
                description: 'Facilitez les retraits d\'argent liquide pour vos clients',
                commission: '3-5%'
              },
              {
                title: 'Transfert d\'argent',
                description: 'Aidez vos clients à envoyer de l\'argent à leurs proches',
                commission: '1-2%'
              },
              {
                title: 'Paiement de factures',
                description: 'Permettez le paiement de factures (électricité, eau, téléphone)',
                commission: '1-3%'
              },
              {
                title: 'Recharge téléphonique',
                description: 'Vendez du crédit téléphonique pour tous les opérateurs',
                commission: '5-8%'
              },
              {
                title: 'Consultation de solde',
                description: 'Aidez vos clients à vérifier leur solde et historique',
                commission: 'Gratuit'
              }
            ].map((service, index) => (
              <div key={index} className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{service.title}</h3>
                  <Badge variant="outline" className="text-xs">
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
            <CheckCircle2 size={24} className="text-primary" />
            Prérequis pour devenir Agent Relais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-primary">Prérequis obligatoires</h3>
              <div className="space-y-3">
                {[
                  'Avoir un commerce ou local commercial',
                  'Disposer d\'un smartphone Android/iOS',
                  'Être majeur et résider dans la zone',
                  'Passer la vérification KYC',
                  'Suivre la formation de 2 jours'
                ].map((req, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-[#FFA500]">Recommandations</h3>
              <div className="space-y-3">
                {[
                  'Avoir une clientèle régulière',
                  'Être ouvert au moins 8h/jour',
                  'Disposer d\'un coffre-fort',
                  'Avoir une connexion internet stable',
                  'Parler les langues locales'
                ].map((rec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-[#FFA500] flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FFA500]" />
                    </div>
                    <span className="text-sm">{rec}</span>
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
            <TrendingUp size={24} className="text-primary" />
            Vos avantages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-primary/5">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Banknote size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Revenus attractifs</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Gagnez entre 50,000 et 200,000 FCFA par mois selon votre activité
              </p>
              <Badge variant="secondary">5-10% commission</Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-primary/5">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Clientèle élargie</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Attirez de nouveaux clients grâce aux services financiers
              </p>
              <Badge variant="secondary">+30% clients</Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-primary/5">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Support complet</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Formation, support technique et marketing inclus
              </p>
              <Badge variant="secondary">24/7 support</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} className="text-primary" />
            Processus d\'inscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Candidature en ligne',
                description: 'Remplissez le formulaire et téléchargez vos documents',
                duration: '15 minutes'
              },
              {
                step: 2,
                title: 'Vérification',
                description: 'Notre équipe vérifie votre dossier et vos documents',
                duration: '2-3 jours'
              },
              {
                step: 3,
                title: 'Formation',
                description: 'Formation obligatoire sur les services et procédures',
                duration: '2 jours'
              },
              {
                step: 4,
                title: 'Activation',
                description: 'Activation de votre compte et début de l\'activité',
                duration: '1 jour'
              }
            ].map((process, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
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
          className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 shadow-lg"
          asChild
        >
          <Link href="/dashboard/agent-relay/application?type=agent-relais">
            <Handshake size={20} className="mr-2" />
            Postuler comme Agent Relais
          </Link>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Des questions ? <Link href="/dashboard/settings/help" className="text-primary hover:underline">Contactez notre équipe</Link>
        </p>
      </div>
    </div>
  );
}