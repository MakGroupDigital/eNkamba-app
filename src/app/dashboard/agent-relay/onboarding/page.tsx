'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Handshake,
  Store,
  MapPin,
  FileText,
  Shield,
  Smartphone,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  completed: boolean;
}

export default function AgentRelayOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bienvenue',
      description: 'Découvrez les avantages du programme Agent Relais',
      icon: Handshake,
      completed: false
    },
    {
      id: 'requirements',
      title: 'Prérequis',
      description: 'Vérifiez que vous remplissez les conditions',
      icon: CheckCircle2,
      completed: false
    },
    {
      id: 'type-selection',
      title: 'Type d\'agent',
      description: 'Choisissez votre type de partenariat',
      icon: Store,
      completed: false
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Préparez vos documents requis',
      icon: FileText,
      completed: false
    },
    {
      id: 'application',
      title: 'Candidature',
      description: 'Remplissez votre dossier de candidature',
      icon: Shield,
      completed: false
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center">
              <Handshake size={48} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline mb-4">
                Bienvenue dans le programme Agent Relais eNkamba
              </h2>
              <p className="text-muted-foreground mb-6">
                Rejoignez notre réseau de plus de 2,500 agents et développez votre activité 
                en offrant des services financiers dans votre communauté.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Technologie simple</h3>
                <p className="text-sm text-muted-foreground">
                  Interface intuitive et formation complète fournie
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Proximité</h3>
                <p className="text-sm text-muted-foreground">
                  Servez votre communauté locale avec des services essentiels
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Formation</h3>
                <p className="text-sm text-muted-foreground">
                  Support continu et formation certifiante
                </p>
              </div>
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-headline mb-4">
                Prérequis généraux
              </h2>
              <p className="text-muted-foreground">
                Assurez-vous de remplir ces conditions avant de continuer
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                'Être majeur et résider dans une zone couverte',
                'Disposer d\'un smartphone Android ou iOS',
                'Avoir une activité commerciale ou un local',
                'Passer la vérification d\'identité (KYC)',
                'Suivre la formation obligatoire',
                'Respecter les règles de conformité'
              ].map((requirement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                  <span className="text-sm">{requirement}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-[#FFA500]/10 border border-[#FFA500]/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-[#FFA500] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#FFA500] mb-1">Important</h4>
                  <p className="text-sm text-[#FFA500]">
                    Tous les agents doivent respecter la réglementation locale et 
                    les politiques anti-blanchiment d\'argent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'type-selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-headline mb-4">
                Choisissez votre type d\'agent
              </h2>
              <p className="text-muted-foreground">
                Sélectionnez le type de partenariat qui correspond à votre situation
              </p>
            </div>
            
            <div className="grid gap-4">
              {[
                {
                  type: 'Agent Relais',
                  description: 'Services de base dans votre commerce',
                  commission: '5-10%',
                  investment: 'Minimal',
                  color: 'from-primary to-primary'
                },
                {
                  type: 'Cabiniste',
                  description: 'Cabinet de services financiers complet',
                  commission: '10-15%',
                  investment: 'Moyen',
                  color: 'from-[#0A8B46] to-[#0A8B46]'
                },
                {
                  type: 'Point de Service',
                  description: 'Services intégrés à votre activité',
                  commission: '3-8%',
                  investment: 'Aucun',
                  color: 'from-[#0A8B46] to-[#0A8B46]'
                }
              ].map((option, index) => (
                <div key={index} className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{option.type}</h3>
                    <Badge variant="secondary">{option.commission}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Investissement: {option.investment}</span>
                    <span>Commission: {option.commission}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-headline mb-4">
                Documents requis
              </h2>
              <p className="text-muted-foreground">
                Préparez ces documents pour votre candidature
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Documents personnels</h3>
                {[
                  'Pièce d\'identité (CNI, Passeport)',
                  'Justificatif de domicile récent',
                  'Photo d\'identité récente',
                  'Attestation de résidence'
                ].map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <FileText size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm">{doc}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Documents commerciaux</h3>
                {[
                  'Registre de commerce (si applicable)',
                  'Autorisation d\'exercer',
                  'Photos du local/commerce',
                  'Références commerciales'
                ].map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Store size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'application':
        return (
          <div className="text-center space-y-6">
            <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center">
              <Shield size={48} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-muted-foreground mb-6">
                Vous avez maintenant toutes les informations nécessaires pour 
                démarrer votre candidature d\'agent relais eNkamba.
              </p>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Prochaines étapes</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</div>
                  <span className="text-sm">Remplir le formulaire de candidature</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</div>
                  <span className="text-sm">Télécharger vos documents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</div>
                  <span className="text-sm">Attendre la validation (2-5 jours)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">4</div>
                  <span className="text-sm">Suivre la formation obligatoire</span>
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
          <h1 className="text-2xl font-bold font-headline">Devenir Agent Relais</h1>
          <p className="text-sm text-muted-foreground">
            Processus d\'inscription - Étape {currentStep + 1} sur {steps.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    index <= currentStep 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs text-center max-w-16">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
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
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Précédent
        </Button>
        
        {currentStep === steps.length - 1 ? (
          <Button 
            className="gap-2 bg-gradient-to-r from-primary to-primary"
            asChild
          >
            <Link href="/dashboard/agent-relay/application">
              Commencer ma candidature
              <ArrowRight size={16} />
            </Link>
          </Button>
        ) : (
          <Button onClick={nextStep} className="gap-2">
            Suivant
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
