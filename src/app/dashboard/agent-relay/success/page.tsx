'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  FileText,
  ArrowRight,
  Home
} from 'lucide-react';
import Link from 'next/link';

export default function AgentRelaySuccessPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* Success Message */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary via-primary to-primary p-8 text-white text-center">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold font-headline mb-2">
            Candidature envoyée avec succès !
          </h1>
          <p className="text-white/90 text-lg">
            Votre dossier de candidature Agent Relais eNkamba a été reçu et est en cours de traitement.
          </p>
        </div>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-headline mb-4">
              Prochaines étapes
            </h2>
            <p className="text-muted-foreground">
              Voici ce qui va se passer maintenant
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Confirmation de réception',
                description: 'Vous recevrez un email de confirmation dans les prochaines minutes',
                timeframe: 'Immédiat',
                icon: Mail,
                status: 'completed'
              },
              {
                step: 2,
                title: 'Vérification du dossier',
                description: 'Notre équipe vérifie vos documents et informations',
                timeframe: '24-48 heures',
                icon: FileText,
                status: 'in-progress'
              },
              {
                step: 3,
                title: 'Validation et contact',
                description: 'Nous vous contactons pour finaliser votre inscription',
                timeframe: '2-3 jours ouvrés',
                icon: Phone,
                status: 'pending'
              },
              {
                step: 4,
                title: 'Formation et activation',
                description: 'Formation obligatoire et activation de votre compte',
                timeframe: '1 semaine',
                icon: CheckCircle2,
                status: 'pending'
              }
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold ${
                  step.status === 'completed' 
                    ? 'bg-primary text-white' 
                    : step.status === 'in-progress'
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    step.step
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{step.title}</h3>
                    {step.status === 'completed' && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Terminé
                      </Badge>
                    )}
                    {step.status === 'in-progress' && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        En cours
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{step.timeframe}</span>
                  </div>
                </div>
                <step.icon size={20} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Informations importantes
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Numéro de dossier</h4>
              <p className="text-blue-700 font-mono text-lg">ENK-AR-{Date.now().toString().slice(-8)}</p>
              <p className="text-sm text-blue-600 mt-1">
                Conservez ce numéro pour toute correspondance
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FFA500]/10 border border-[#FFA500]/30">
                <h4 className="font-semibold text-[#FFA500] mb-2">Documents manquants ?</h4>
                <p className="text-sm text-[#FFA500]">
                  Si des documents sont manquants, nous vous contacterons par email 
                  avec les instructions pour les compléter.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Formation obligatoire</h4>
                <p className="text-sm text-primary">
                  Une fois approuvé, vous devrez suivre une formation de 1-2 jours 
                  avant l'activation de votre compte.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Besoin d'aide ?</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Mail size={20} className="text-primary" />
                <h4 className="font-semibold">Email</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Pour toute question sur votre candidature
              </p>
              <p className="text-sm font-medium">agents@enkamba.io</p>
            </div>
            
            <div className="p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Phone size={20} className="text-primary" />
                <h4 className="font-semibold">Téléphone</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Support candidats agents
              </p>
              <p className="text-sm font-medium">+237 6XX XXX XXX</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          asChild
        >
          <Link href="/dashboard">
            <Home size={16} />
            Retour au tableau de bord
          </Link>
        </Button>
        
        <Button 
          className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary"
          asChild
        >
          <Link href="/dashboard/agent-relay">
            <ArrowRight size={16} />
            Voir d'autres options d'agent
          </Link>
        </Button>
      </div>

      {/* Footer Message */}
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          Merci de votre intérêt pour le programme Agent Relais eNkamba. 
          Nous sommes impatients de vous accueillir dans notre réseau !
        </p>
      </div>
    </div>
  );
}