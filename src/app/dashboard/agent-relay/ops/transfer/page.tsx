'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import { PinVerification } from '@/components/payment/PinVerification';
import { TransferByIdentifier } from '@/components/payment/TransferByIdentifier';

type Currency = 'CDF' | 'USD' | 'EUR';

type Recipient = {
  uid: string;
  fullName: string;
  enkNumber: string;
};

export default function AgentOpsTransferPage() {
  const { toast } = useToast();
  const { sendMoney, isProcessing, balance } = useMoneyTransfer();

  const [step, setStep] = useState<'find' | 'confirm'>('find');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('CDF');

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);

  const startPin = () => {
    if (!recipient) return;
    if (!amount || Number(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Montant invalide',
        description: 'Entrez un montant supérieur à 0.',
      });
      return;
    }
    setShowPinDialog(true);
  };

  const handleSend = async () => {
    if (!recipient) return;

    const ok = await sendMoney({
      amount: Number(amount),
      senderCurrency: currency,
      transferMethod: 'account',
      recipientId: recipient.uid,
      description: `Transfert agent vers ${recipient.fullName}`,
    });

    setShowPinDialog(false);

    if (ok) {
      toast({
        title: 'Transfert effectué',
        description: 'Opération enregistrée avec succès.',
        className: 'bg-primary text-white border-none',
      });
      setStep('find');
      setRecipient(null);
      setAmount('');
      setCurrency('CDF');
    }
  };

  return (
    <AgentOpsShell title="Transfert" subtitle="Envoyer de l’argent à un client ou partenaire.">
      <div className="space-y-4">
        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Solde disponible</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">
                  {balance.toLocaleString('fr-FR')} CDF
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#073B9A]/10 flex items-center justify-center">
                <Send className="text-[#073B9A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 'find' && (
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-5">
              <TransferByIdentifier
                onCancel={() => {
                  toast({ title: 'Annulé', description: 'Recherche interrompue.' });
                }}
                onTransferComplete={(userInfo, a, c) => {
                  setRecipient({ uid: userInfo.uid, fullName: userInfo.fullName, enkNumber: userInfo.enkNumber });
                  setAmount(a);
                  setCurrency(c);
                  setStep('confirm');
                }}
              />
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && recipient && (
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">Destinataire</div>
                  <div className="text-lg font-semibold text-gray-900">{recipient.fullName}</div>
                  <div className="text-xs text-gray-500 font-mono">{recipient.enkNumber}</div>
                </div>
                <Button variant="outline" onClick={() => setStep('find')} className="rounded-xl">
                  Changer
                </Button>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Montant</div>
                  <div className="text-xl font-bold text-gray-900 tabular-nums">
                    {amountNumber.toLocaleString('fr-FR')} {currency}
                  </div>
                </div>
                <div className="text-xs text-gray-500">Frais: 0</div>
              </div>

              <Button
                onClick={startPin}
                disabled={isProcessing}
                className="w-full h-12 rounded-xl bg-[#073B9A] hover:bg-[#073B9A] text-white"
              >
                Confirmer et envoyer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <PinVerification
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onSuccess={handleSend}
          paymentDetails={
            recipient
              ? {
                  recipient: recipient.fullName,
                  amount: amount || '0',
                  currency: currency,
                }
              : undefined
          }
        />
      </div>
    </AgentOpsShell>
  );
}

