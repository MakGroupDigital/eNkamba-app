'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CreditCard, Loader2, Phone, Wallet } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';

export default function AgentOpsCreditPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFunds, isLoading, balance } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'details' | 'confirm'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'wonyapay' | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [motif, setMotif] = useState('');
  const [currency] = useState<'CDF' | 'USD'>('CDF');
  const [usdToCdfRate] = useState<number>(2800);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const convertedAmount = useMemo(() => {
    if (!amountNumber) return 0;
    if (paymentMethod === 'paypal') return amountNumber * usdToCdfRate;
    return amountNumber;
  }, [amountNumber, paymentMethod, usdToCdfRate]);

  const handleConfirm = async () => {
    if (!user) return;
    if (!paymentMethod) return;

    if (!amountNumber || amountNumber <= 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer un montant valide.' });
      return;
    }

    if (paymentMethod === 'paypal') {
      const returnUrl = encodeURIComponent(`https://enkamba.io/ok?amount=${amount}&userId=${user.uid}`);
      const cancelUrl = encodeURIComponent(`https://enkamba.io/cancel`);
      const paypalUrl = `https://www.paypal.com/ncp/payment/D723Q3TM3HQRW?return=${returnUrl}&cancel_return=${cancelUrl}`;
      window.open(paypalUrl, '_blank');
      toast({
        title: 'Redirection PayPal',
        description: 'Finalisez le paiement sur PayPal.',
        className: 'bg-blue-600 text-white border-none',
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer un numéro de téléphone.' });
      return;
    }

    try {
      await addFunds(amountNumber, 'wonyapay', {
        phoneNumber,
        wonyaDetails: {
          currency,
          motif,
        },
      });

      toast({
        title: 'Dépôt initié',
        description: 'Opération envoyée. Le solde se mettra à jour après confirmation.',
      });

      setStep('method');
      setPaymentMethod(null);
      setAmount('');
      setPhoneNumber('');
      setMotif('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err?.message || 'Impossible de créditer le compte.',
      });
    }
  };

  return (
    <AgentOpsShell title="Créditer mon compte" subtitle="Flux wallet (WonyaPay / PayPal) dans le module agent.">
      <div className="space-y-4">
        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Solde actuel</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">
                  {balance.toLocaleString('fr-FR')} CDF
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#25543A]/10 flex items-center justify-center">
                <Wallet className="text-[#25543A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 'method' && (
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-5 space-y-4">
              <div className="text-sm font-semibold text-gray-900">Choisissez un moyen</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('wonyapay');
                    setStep('details');
                  }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md hover:border-gray-300 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#25543A]/10 flex items-center justify-center">
                    <Phone className="text-[#25543A]" />
                  </div>
                  <div className="mt-3 font-semibold text-gray-900">WonyaPay</div>
                  <div className="text-xs text-gray-600 mt-1">Mobile Money</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('paypal');
                    setStep('details');
                  }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md hover:border-gray-300 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <CreditCard className="text-blue-600" />
                  </div>
                  <div className="mt-3 font-semibold text-gray-900">PayPal</div>
                  <div className="text-xs text-gray-600 mt-1">Paiement en ligne</div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'details' && paymentMethod && (
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Détails</div>
                <Button variant="outline" className="rounded-xl" onClick={() => setStep('method')}>
                  Retour
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="Ex: 5000"
                  className="h-12 rounded-xl"
                />
              </div>

              {paymentMethod === 'wonyapay' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone (Mobile Money)</Label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+\s-]/g, ''))}
                      placeholder="+243..."
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="motif">Motif (optionnel)</Label>
                    <Input
                      id="motif"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Ex: Approvisionnement"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </>
              )}

              <Button
                onClick={() => setStep('confirm')}
                className="w-full h-12 rounded-xl bg-[#25543A] hover:bg-[#25543A] text-white"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && paymentMethod && (
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-5 space-y-4">
              <div className="text-sm font-semibold text-gray-900">Confirmation</div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Montant</div>
                  <div className="text-xl font-bold text-gray-900 tabular-nums">
                    {amountNumber.toLocaleString('fr-FR')} {paymentMethod === 'paypal' ? 'USD' : currency}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Équiv.: {convertedAmount.toLocaleString('fr-FR')} CDF
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep('details')}>
                  Modifier
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-[#25543A] hover:bg-[#25543A] text-white"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AgentOpsShell>
  );
}

