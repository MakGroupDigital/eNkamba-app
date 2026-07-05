'use client';

import { useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowRight, Loader2, Smartphone } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { db } from '@/lib/firebase';
import { PinVerification } from '@/components/payment/PinVerification';

const operators = ['Airtel', 'Orange', 'Vodacom', 'Africell'] as const;
type Operator = (typeof operators)[number];

export default function AgentOpsAirtimePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance } = useWalletTransactions();

  const [operator, setOperator] = useState<Operator>('Airtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);

  const validate = () => {
    if (!user) return false;
    if (!phoneNumber.trim()) {
      toast({ variant: 'destructive', title: 'Téléphone requis', description: 'Entrez le numéro à recharger.' });
      return false;
    }
    if (!amountNumber || amountNumber <= 0) {
      toast({ variant: 'destructive', title: 'Montant invalide', description: 'Entrez un montant.' });
      return false;
    }
    if (amountNumber > balance) {
      toast({ variant: 'destructive', title: 'Solde insuffisant', description: 'Votre solde est insuffisant.' });
      return false;
    }
    return true;
  };

  const startPin = () => {
    if (!validate()) return;
    setShowPinDialog(true);
  };

  const performAirtime = async () => {
    if (!user) return;
    if (!validate()) return;

    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentBalance = userDoc.exists() ? userDoc.data()?.walletBalance || 0 : 0;

      if (amountNumber > currentBalance) {
        throw new Error('Solde insuffisant');
      }

      const newBalance = Math.max(0, currentBalance - amountNumber);

      await updateDoc(userRef, {
        walletBalance: newBalance,
        lastTransactionTime: serverTimestamp(),
      });

      const txRef = collection(db, 'users', user.uid, 'transactions');
      const txDoc = await addDoc(txRef, {
        type: 'payment',
        amount: amountNumber,
        paymentMethod: 'airtime',
        status: 'completed',
        description: `Airtime ${operator} • ${phoneNumber}`,
        previousBalance: currentBalance,
        newBalance,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        operator,
        phoneNumber,
      });

      const notifRef = collection(db, 'users', user.uid, 'notifications');
      await addDoc(notifRef, {
        type: 'airtime',
        title: 'Airtime effectué',
        message: `Recharge ${operator} (${phoneNumber}) • ${amountNumber.toLocaleString('fr-FR')} CDF`,
        amount: amountNumber,
        transactionId: txDoc.id,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Airtime réussi',
        description: 'Le solde a été débité.',
        className: 'bg-primary text-white border-none',
      });

      setShowPinDialog(false);
      setStep('details');
      setAmount('');
      setPhoneNumber('');
      setOperator('Airtel');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err?.message || 'Airtime impossible.' });
      setShowPinDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AgentOpsShell title="Airtime" subtitle="Vente de crédit téléphonique (débit sur walletBalance).">
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
                <Smartphone className="text-[#479B67]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200">
          <CardContent className="p-5 space-y-4">
            <Tabs value={operator} onValueChange={(v) => setOperator(v as Operator)}>
              <TabsList className="grid w-full grid-cols-4 rounded-xl">
                {operators.map((op) => (
                  <TabsTrigger key={op} value={op} className="rounded-lg">
                    {op}
                  </TabsTrigger>
                ))}
              </TabsList>
              {operators.map((op) => (
                <TabsContent key={op} value={op} className="mt-4">
                  <div className="text-sm text-gray-600">
                    Opérateur sélectionné: <span className="font-semibold text-gray-900">{op}</span>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {step === 'details' ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Numéro à recharger</Label>
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
                  <Label htmlFor="amount">Montant (CDF)</Label>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="Ex: 1000"
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button
                  onClick={() => {
                    if (!validate()) return;
                    setStep('confirm');
                  }}
                  className="w-full h-12 rounded-xl bg-[#479B67] hover:bg-[#479B67] text-white"
                >
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">Résumé</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {operator} • {phoneNumber || '—'}
                  </div>
                  <div className="text-lg font-bold text-gray-900 tabular-nums mt-2">
                    {amountNumber.toLocaleString('fr-FR')} CDF
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep('details')}>
                    Modifier
                  </Button>
                  <Button
                    onClick={startPin}
                    disabled={isProcessing}
                    className="h-12 rounded-xl bg-[#479B67] hover:bg-[#479B67] text-white"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PinVerification
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onSuccess={performAirtime}
          paymentDetails={{
            recipient: `Airtime ${operator}`,
            amount: amount || '0',
            currency: 'CDF',
          }}
        />
      </div>
    </AgentOpsShell>
  );
}

