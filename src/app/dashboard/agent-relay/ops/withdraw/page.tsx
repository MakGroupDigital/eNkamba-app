'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Banknote, CreditCard, HandCoins, Loader2, Smartphone } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { PinVerification } from '@/components/payment/PinVerification';

type WithdrawMethod = 'mobile_money' | 'agent' | 'bank' | 'card';

const operators = ['Airtel', 'Orange', 'Vodacom', 'Africell'] as const;

export default function AgentOpsWithdrawPage() {
  const { toast } = useToast();
  const { withdrawFunds, isLoading, balance } = useWalletTransactions();

  const [method, setMethod] = useState<WithdrawMethod>('mobile_money');
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [showPinDialog, setShowPinDialog] = useState(false);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'CDF' | 'USD'>('CDF');

  // mobile money
  const [operator, setOperator] = useState<(typeof operators)[number]>('Airtel');
  const [phoneNumber, setPhoneNumber] = useState('');

  // cash/agent
  const [agentIdentifier, setAgentIdentifier] = useState('');

  // bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // card
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);

  const validateDetails = () => {
    if (!amountNumber || amountNumber <= 0) {
      toast({ variant: 'destructive', title: 'Montant invalide', description: 'Entrez un montant.' });
      return false;
    }
    if (amountNumber > balance) {
      toast({ variant: 'destructive', title: 'Solde insuffisant', description: 'Votre solde est insuffisant.' });
      return false;
    }

    if (method === 'mobile_money') {
      if (!phoneNumber.trim()) {
        toast({ variant: 'destructive', title: 'Téléphone requis', description: 'Entrez un numéro Mobile Money.' });
        return false;
      }
      return true;
    }

    if (method === 'agent') {
      if (!agentIdentifier.trim()) {
        toast({ variant: 'destructive', title: 'Identifiant requis', description: 'Entrez un identifiant agent/caisse.' });
        return false;
      }
      return true;
    }

    if (method === 'bank') {
      if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
        toast({ variant: 'destructive', title: 'Champs requis', description: 'Remplissez les informations bancaires.' });
        return false;
      }
      return true;
    }

    if (method === 'card') {
      if (!cardNumber.trim() || !cardHolder.trim()) {
        toast({ variant: 'destructive', title: 'Champs requis', description: 'Remplissez les informations carte.' });
        return false;
      }
      return true;
    }

    return false;
  };

  const goConfirm = () => {
    if (!validateDetails()) return;
    setStep('confirm');
  };

  const startPin = () => {
    if (!validateDetails()) return;
    setShowPinDialog(true);
  };

  const performWithdraw = async () => {
    try {
      await withdrawFunds(amountNumber, method, {
        currency,
        phoneNumber: method === 'mobile_money' ? phoneNumber : undefined,
        operator: method === 'mobile_money' ? operator : undefined,
        agentIdentifier: method === 'agent' ? agentIdentifier : undefined,
        bankName: method === 'bank' ? bankName : undefined,
        accountNumber: method === 'bank' ? accountNumber : undefined,
        accountHolder: method === 'bank' ? accountHolder : undefined,
        cardNumber: method === 'card' ? cardNumber : undefined,
        cardHolder: method === 'card' ? cardHolder : undefined,
      });

      toast({ title: 'Retrait initié', description: 'Opération envoyée.' });
      setShowPinDialog(false);
      setStep('details');
      setAmount('');
      setPhoneNumber('');
      setAgentIdentifier('');
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setCardNumber('');
      setCardHolder('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err?.message || 'Retrait impossible.' });
      setShowPinDialog(false);
    }
  };

  const detailsSummary = useMemo(() => {
    if (method === 'mobile_money') return `${operator} • ${phoneNumber || '—'} • ${currency}`;
    if (method === 'agent') return `Caisse/Agent • ${agentIdentifier || '—'}`;
    if (method === 'bank') return `${bankName || 'Banque'} • ${accountNumber || '—'}`;
    return `Carte • ${cardNumber ? cardNumber.slice(-4).padStart(4, '•') : '—'}`;
  }, [accountNumber, agentIdentifier, bankName, cardNumber, currency, method, operator, phoneNumber]);

  return (
    <AgentOpsShell title="Retrait" subtitle="Mobile Money, caisse/agent, banque ou carte.">
      <div className="space-y-4">
        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Solde</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">
                  {balance.toLocaleString('fr-FR')} CDF
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#479B67]/10 flex items-center justify-center">
                <HandCoins className="text-[#479B67]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={method} onValueChange={(v) => { setMethod(v as WithdrawMethod); setStep('details'); }}>
          <TabsList className="grid w-full grid-cols-4 rounded-xl">
            <TabsTrigger value="mobile_money" className="rounded-lg">MM</TabsTrigger>
            <TabsTrigger value="agent" className="rounded-lg">Caisse</TabsTrigger>
            <TabsTrigger value="bank" className="rounded-lg">Banque</TabsTrigger>
            <TabsTrigger value="card" className="rounded-lg">Carte</TabsTrigger>
          </TabsList>

          <TabsContent value="mobile_money">
            <Card className="rounded-2xl border border-gray-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Smartphone className="h-4 w-4" /> Mobile Money
                </div>
                <div className="grid gap-2">
                  <Label>Opérateur</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {operators.map((op) => (
                      <Button
                        key={op}
                        variant={operator === op ? 'default' : 'outline'}
                        className={operator === op ? 'bg-[#479B67] hover:bg-[#479B67]' : ''}
                        onClick={() => setOperator(op)}
                        type="button"
                      >
                        {op}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mm-phone">Téléphone</Label>
                  <Input
                    id="mm-phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+\s-]/g, ''))}
                    placeholder="+243..."
                    className="h-12 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent">
            <Card className="rounded-2xl border border-gray-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Banknote className="h-4 w-4" /> Retrait en caisse
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agent-id">Identifiant agent/caisse</Label>
                  <Input
                    id="agent-id"
                    value={agentIdentifier}
                    onChange={(e) => setAgentIdentifier(e.target.value)}
                    placeholder="Ex: CAISSE-01"
                    className="h-12 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card className="rounded-2xl border border-gray-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Banknote className="h-4 w-4" /> Banque
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank-name">Banque</Label>
                  <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank-account">Numéro de compte</Label>
                  <Input id="bank-account" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank-holder">Titulaire</Label>
                  <Input id="bank-holder" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="card">
            <Card className="rounded-2xl border border-gray-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CreditCard className="h-4 w-4" /> Carte
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-number">Numéro de carte</Label>
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="XXXX XXXX XXXX XXXX"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-holder">Titulaire</Label>
                  <Input id="card-holder" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="rounded-2xl border border-gray-200">
          <CardContent className="p-5 space-y-4">
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
              <div className="text-xs text-gray-500">Devise: {currency}</div>
            </div>

            {step === 'details' ? (
              <Button
                onClick={goConfirm}
                className="w-full h-12 rounded-xl bg-[#479B67] hover:bg-[#479B67] text-white"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">Résumé</div>
                  <div className="text-xs text-gray-600 mt-1">{detailsSummary}</div>
                  <div className="text-lg font-bold text-gray-900 tabular-nums mt-2">
                    {amountNumber.toLocaleString('fr-FR')} {currency}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep('details')}>
                    Modifier
                  </Button>
                  <Button
                    onClick={startPin}
                    disabled={isLoading}
                    className="h-12 rounded-xl bg-[#479B67] hover:bg-[#479B67] text-white"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PinVerification
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onSuccess={performWithdraw}
          paymentDetails={{
            recipient: 'Retrait',
            amount: amount || '0',
            currency,
          }}
        />
      </div>
    </AgentOpsShell>
  );
}

