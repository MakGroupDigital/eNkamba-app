'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Building2, Check, Code2, CreditCard, Sparkles, Zap } from 'lucide-react';
import { collection, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { PinVerification } from '@/components/payment/PinVerification';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { db } from '@/lib/firebase';
import { EnkambaAIIcon } from '@/components/icons/service-icons';

type AiPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: any;
  features: string[];
  highlight?: boolean;
};

const plans: AiPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    period: 'inclus',
    description: 'Pour découvrir eNkamba AI au quotidien.',
    icon: Sparkles,
    features: ['Questions simples', 'Historique limité', 'Assistance eNkamba de base', 'Réponses standard'],
  },
  {
    id: 'paid',
    name: 'Payant',
    price: 10000,
    period: 'par mois',
    description: 'Pour un usage personnel régulier.',
    icon: Zap,
    features: ['Réponses plus rapides', 'Historique étendu', 'Aide commerce et paiement', 'Résumé de documents courts'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 25000,
    period: 'par mois',
    description: 'Pour les utilisateurs avancés.',
    icon: BadgeCheck,
    highlight: true,
    features: ['Analyse avancée', 'Aide logistique et marché', 'Priorité de traitement', 'Support IA enrichi'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 100000,
    period: 'par mois',
    description: 'Pour entreprises, agences et équipes.',
    icon: Building2,
    features: ['Accès équipe', 'Rapports business', 'Assistance opérations', 'Priorité entreprise'],
  },
];

const startupUnitPrice = 3500;

export default function AiSubscriptionPage() {
  const { user } = useAuth();
  const { balance } = useWalletTransactions();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [startupUsers, setStartupUsers] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<(AiPlan | { id: string; name: string; price: number; period: string }) | null>(null);
  const [showPinVerification, setShowPinVerification] = useState(false);

  const startupAmount = useMemo(() => Math.max(1, startupUsers) * startupUnitPrice, [startupUsers]);

  const executePlanPayment = async (plan: AiPlan | { id: string; name: string; price: number; period: string }) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Connexion requise', description: 'Veuillez vous connecter pour activer un abonnement.' });
      return;
    }

    setSelectedPlan(plan.id);
    setIsProcessing(true);

    try {
      const amount = Number(plan.price || 0);
      const userRef = doc(db, 'users', user.uid);
      const subscriptionRef = doc(db, 'aiSubscriptions', user.uid);
      const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const currentBalance = Number(userSnap.data()?.walletBalance || 0);

        if (amount > 0 && currentBalance < amount) {
          throw new Error('Solde eNkamba Pay insuffisant');
        }

        if (amount > 0) {
          transaction.set(
            userRef,
            {
              uid: user.uid,
              walletBalance: currentBalance - amount,
              lastTransactionTime: serverTimestamp(),
            },
            { merge: true }
          );
        }

        transaction.set(
          subscriptionRef,
          {
            userId: user.uid,
            planId: plan.id,
            planName: plan.name,
            amount,
            currency: 'CDF',
            status: 'active',
            provider: 'enkamba_pay',
            startupUsers: plan.id === 'startup_api' ? startupUsers : null,
            activatedAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAt),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(transactionRef, {
          type: 'payment',
          amount,
          paymentMethod: 'enkamba_pay',
          status: 'completed',
          description: amount > 0 ? `Abonnement eNkamba AI - ${plan.name}` : 'Activation eNkamba AI gratuit',
          previousBalance: currentBalance,
          newBalance: amount > 0 ? currentBalance - amount : currentBalance,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            module: 'ai',
            planId: plan.id,
            planName: plan.name,
            startupUsers: plan.id === 'startup_api' ? startupUsers : null,
          },
        });
      });

      toast({
        title: 'Abonnement activé',
        description: `${plan.name} est maintenant actif via eNkamba Pay.`,
        className: 'bg-primary text-white border-none',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Paiement impossible',
        description: error?.message || 'Veuillez réessayer.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const requestPlanActivation = (plan: AiPlan | { id: string; name: string; price: number; period: string }) => {
    setSelectedPlan(plan.id);

    if (plan.price <= 0) {
      void executePlanPayment(plan);
      return;
    }

    setPendingPlan(plan);
    setShowPinVerification(true);
  };

  const handlePinSuccess = () => {
    const plan = pendingPlan;
    setShowPinVerification(false);
    setPendingPlan(null);

    if (plan) {
      void executePlanPayment(plan);
    }
  };

  const startupPlan = {
    id: 'startup_api',
    name: 'Startup API',
    price: startupAmount,
    period: 'selon utilisateurs',
  };

  return (
    <main className="h-full overflow-y-auto bg-[#f6fbf8] px-4 pb-36 pt-4 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard/ai/chat">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">eNkamba Pay</p>
            <h1 className="truncate text-2xl font-black">Mon abonnement IA</h1>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
            <EnkambaAIIcon size={34} />
          </div>
        </header>

        <section className="mt-5 rounded-[2rem] bg-primary p-5 text-white shadow-2xl shadow-primary/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-white/70">Solde eNkamba Pay</p>
              <p className="mt-1 text-3xl font-black">{balance.toLocaleString('fr-FR')} CDF</p>
              <p className="mt-2 max-w-xl text-sm font-medium text-white/75">
                Choisissez un plan IA. Le paiement est débité directement depuis votre portefeuille eNkamba Pay.
              </p>
            </div>
            <div className="rounded-2xl bg-white/12 px-4 py-3 text-sm font-black backdrop-blur">
              Paiement sécurisé
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const active = selectedPlan === plan.id;
            return (
              <article
                key={plan.id}
                className={`rounded-[1.75rem] border bg-white p-4 shadow-sm transition ${
                  plan.highlight ? 'border-primary shadow-primary/15' : 'border-primary/10'
                } ${active ? 'ring-2 ring-primary/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  {plan.highlight && <span className="rounded-full bg-[#FFA500] px-3 py-1 text-[11px] font-black text-white">Populaire</span>}
                </div>
                <h2 className="mt-4 text-xl font-black">{plan.name}</h2>
                <p className="mt-1 min-h-10 text-sm font-medium text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-2xl font-black">{plan.price === 0 ? '0' : plan.price.toLocaleString('fr-FR')}</span>
                  <span className="ml-1 text-sm font-bold text-muted-foreground">CDF {plan.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm font-semibold text-foreground/78">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => requestPlanActivation(plan)}
                  disabled={isProcessing}
                  className="mt-5 w-full rounded-2xl"
                >
                  <CreditCard className="h-4 w-4" />
                  {plan.price === 0 ? 'Activer' : 'Payer avec eNkamba Pay'}
                </Button>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-[2rem] border border-primary/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Code2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Startup API</h2>
                  <p className="text-sm font-medium text-muted-foreground">Pour intégrer eNkamba AI dans une application ou un service externe.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {['Accès API', 'Facturation par utilisateur', 'Support intégration'].map((item) => (
                  <div key={item} className="rounded-2xl bg-primary/5 px-3 py-2 text-sm font-bold text-primary">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-sm rounded-[1.5rem] bg-[#f6fbf8] p-4">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Utilisateurs API</label>
              <input
                type="number"
                min={1}
                value={startupUsers}
                onChange={(event) => setStartupUsers(Math.max(1, Number(event.target.value || 1)))}
                className="mt-2 h-12 w-full rounded-2xl border border-primary/15 bg-white px-4 text-lg font-black outline-none focus:border-primary"
              />
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                Total : <span className="text-primary">{startupAmount.toLocaleString('fr-FR')} CDF</span>
              </p>
              <Button onClick={() => requestPlanActivation(startupPlan)} disabled={isProcessing} className="mt-4 w-full rounded-2xl">
                <CreditCard className="h-4 w-4" />
                Payer l'intégration API
              </Button>
            </div>
          </div>
        </section>
      </div>

      <PinVerification
        isOpen={showPinVerification}
        onClose={() => {
          setShowPinVerification(false);
          setPendingPlan(null);
        }}
        onSuccess={handlePinSuccess}
        purpose="payment"
        paymentDetails={
          pendingPlan
            ? {
                recipient: 'eNkamba AI',
                amount: pendingPlan.price.toLocaleString('fr-FR'),
                currency: 'CDF',
              }
            : undefined
        }
      />
    </main>
  );
}
