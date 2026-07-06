'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Smartphone, Building2, QrCode as QrCodeIcon, CreditCard, Landmark, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type WithdrawalMethod = 'mobile_money' | 'agent' | 'card' | 'bank';

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, withdrawFunds, isLoading } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'details' | 'confirm'>('method');
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agentIdentifier, setAgentIdentifier] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [currency, setCurrency] = useState<'CDF' | 'USD'>('CDF');
  const [usdToCdfRate, setUsdToCdfRate] = useState<number>(2800);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  // Charger le taux de change USD/CDF
  useEffect(() => {
    if (withdrawalMethod === 'mobile_money' && currency === 'USD') {
      const loadExchangeRate = async () => {
        setIsLoadingRate(true);
        try {
          const { getUsdToCdfRate } = await import('@/lib/exchange-rate');
          const rate = await getUsdToCdfRate();
          setUsdToCdfRate(rate);
        } catch (error) {
          console.error('Erreur chargement taux:', error);
        } finally {
          setIsLoadingRate(false);
        }
      };
      loadExchangeRate();
    }
  }, [withdrawalMethod, currency]);

  // Calculer la conversion en temps réel
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      if (withdrawalMethod === 'mobile_money' && currency === 'USD') {
        // Si retrait en USD: calculer combien de CDF seront débités
        setConvertedAmount(parseFloat(amount) * usdToCdfRate);
      } else {
        setConvertedAmount(parseFloat(amount));
      }
    } else {
      setConvertedAmount(0);
    }
  }, [amount, currency, usdToCdfRate, withdrawalMethod]);

  const handleMethodSelect = (method: WithdrawalMethod) => {
    setWithdrawalMethod(method);
    setStep('details');
  };

  const handleDetailsSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide',
      });
      return;
    }

    // Vérifier le solde en tenant compte de la conversion
    const amountToDebit = withdrawalMethod === 'mobile_money' && currency === 'USD' 
      ? parseFloat(amount) * usdToCdfRate 
      : parseFloat(amount);

    if (amountToDebit > balance) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Solde insuffisant. Vous avez besoin de ${amountToDebit.toLocaleString('fr-FR')} CDF`,
      });
      return;
    }

    if (withdrawalMethod === 'mobile_money' && !phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de téléphone',
      });
      return;
    }

    if (withdrawalMethod === 'agent' && !agentIdentifier) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer le numéro eNkamba de l\'agent ou scanner son QR code',
      });
      return;
    }

    if (withdrawalMethod === 'card' && (!cardNumber || !cardHolder)) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir les informations de la carte',
      });
      return;
    }

    if (withdrawalMethod === 'bank' && (!bankName || !accountNumber || !accountHolder)) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir toutes les informations bancaires',
      });
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      let details: any = {};
      let amountToWithdraw = parseFloat(amount);

      if (withdrawalMethod === 'mobile_money') {
        // Pour Mobile Money: si USD, on envoie le montant USD
        // L'API calculera le montant CDF à débiter
        details = {
          phoneNumber,
          currency,
        };
      } else if (withdrawalMethod === 'agent') {
        details = {
          agentIdentifier,
        };
      } else if (withdrawalMethod === 'card') {
        details = {
          cardNumber,
          cardHolder,
        };
      } else if (withdrawalMethod === 'bank') {
        details = {
          bankName,
          accountNumber,
          accountHolder,
        };
      }

      await withdrawFunds(amountToWithdraw, withdrawalMethod!, details);

      toast({
        title: 'Succès',
        description: `Retrait de ${amountToWithdraw.toLocaleString('fr-FR')} ${withdrawalMethod === 'mobile_money' && currency === 'USD' ? 'USD' : 'CDF'} initié avec succès`,
        className: 'bg-primary text-white border-none',
      });

      router.push('/dashboard/wallet');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du retrait',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0A8B46]/5 to-background">
      <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#0A8B46] to-[#0A8B46] bg-clip-text text-transparent">
              Retirer des fonds
            </h1>
            <p className="text-sm text-muted-foreground">Solde disponible: {balance.toLocaleString('fr-FR')} CDF</p>
          </div>
        </header>

        {/* Step 1: Withdrawal Method Selection */}
        {step === 'method' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer border-2 hover:border-[#0A8B46] transition-colors"
              onClick={() => handleMethodSelect('mobile_money')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex gap-3 items-center justify-center h-16 flex-wrap">
                    <Image 
                      src="/logoairtel.png" 
                      alt="Airtel Money" 
                      width={60} 
                      height={30}
                      className="object-contain"
                    />
                    <Image 
                      src="/logompsa.png" 
                      alt="M-Pesa" 
                      width={60} 
                      height={30}
                      className="object-contain"
                    />
                    <Image 
                      src="/logo-orange.png" 
                      alt="Orange Money" 
                      width={60} 
                      height={30}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Mobile Money</h3>
                    <p className="text-sm text-muted-foreground">Airtel, M-Pesa, Orange, Africell</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#0A8B46] transition-colors"
              onClick={() => handleMethodSelect('agent')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-[#0A8B46] to-[#0A8B46]">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Agent eNkamba</h3>
                    <p className="text-sm text-muted-foreground">Retrait chez un agent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#0A8B46] transition-colors"
              onClick={() => handleMethodSelect('card')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Carte Visa/Mastercard</h3>
                    <p className="text-sm text-muted-foreground">Retrait vers votre carte</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#0A8B46] transition-colors"
              onClick={() => handleMethodSelect('bank')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
                    <Landmark className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Compte Bancaire</h3>
                    <p className="text-sm text-muted-foreground">Virement bancaire</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {withdrawalMethod === 'mobile_money' && 'Retrait Mobile Money'}
                {withdrawalMethod === 'agent' && 'Retrait Agent eNkamba'}
                {withdrawalMethod === 'card' && 'Retrait vers Carte'}
                {withdrawalMethod === 'bank' && 'Retrait Bancaire'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulaire Mobile Money */}
              {withdrawalMethod === 'mobile_money' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Devise</label>
                    <select
                      className="w-full rounded-md border bg-background p-2"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'CDF' | 'USD')}
                    >
                      <option value="CDF">Franc Congolais (CDF)</option>
                      <option value="USD">Dollar Américain (USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Montant à retirer ({currency})
                    </label>
                    <Input
                      type="number"
                      placeholder={`Entrez le montant en ${currency}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                    {currency === 'USD' && amount && parseFloat(amount) > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-muted-foreground">Montant à débiter de votre portefeuille:</p>
                        <p className="text-xl font-bold text-[#0A8B46]">
                          {isLoadingRate ? (
                            'Calcul...'
                          ) : (
                            `${(parseFloat(amount) * usdToCdfRate).toLocaleString('fr-FR')} CDF`
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Taux: 1 USD = {usdToCdfRate.toLocaleString('fr-FR')} CDF
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Numéro Mobile Money</label>
                    <Input
                      type="tel"
                      placeholder="0997654321"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Format: 10 chiffres (ex: 0997654321)
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#0A8B46]/20 bg-[#0A8B46]/5 p-4 text-sm">
                    <p className="mb-2 font-semibold text-[#0A8B46]">Mobile Money RDC</p>
                    <p className="text-muted-foreground">
                      Retrait via Airtel, M-Pesa, Orange ou Africell. Les fonds seront envoyés directement sur votre compte mobile money.
                    </p>
                  </div>
                </>
              )}

              {/* Formulaire Agent eNkamba */}
              {withdrawalMethod === 'agent' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Montant (CDF)</label>
                    <Input
                      type="number"
                      placeholder="Entrez le montant"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Numéro eNkamba de l'agent ou QR Code</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ex: +243812345678 ou AGENT-001"
                        value={agentIdentifier}
                        onChange={(e) => setAgentIdentifier(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          toast({
                            title: 'Scanner QR Code',
                            description: 'Fonctionnalité de scan QR à venir',
                          });
                        }}
                      >
                        <QrCodeIcon className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Entrez le numéro eNkamba de l'agent ou scannez son QR code
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#0A8B46]/20 bg-[#0A8B46]/5 p-4 text-sm">
                    <p className="mb-2 font-semibold text-[#0A8B46]">Agent eNkamba</p>
                    <p className="text-muted-foreground">
                      Retirez vos fonds en espèces auprès d'un agent eNkamba agréé. Présentez votre code de retrait à l'agent.
                    </p>
                  </div>
                </>
              )}

              {/* Formulaire Carte */}
              {withdrawalMethod === 'card' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Montant (CDF)</label>
                    <Input
                      type="number"
                      placeholder="Entrez le montant"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Numéro de carte</label>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom du titulaire</label>
                    <Input
                      type="text"
                      placeholder="Jean Dupont"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                    />
                  </div>

                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm">
                    <p className="mb-2 font-semibold text-blue-600">Carte Visa/Mastercard</p>
                    <p className="text-muted-foreground">
                      Les fonds seront transférés vers votre carte bancaire. Délai de traitement: 3-5 jours ouvrables.
                    </p>
                  </div>
                </>
              )}

              {/* Formulaire Banque */}
              {withdrawalMethod === 'bank' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Montant (CDF)</label>
                    <Input
                      type="number"
                      placeholder="Entrez le montant"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom de la banque</label>
                    <Input
                      type="text"
                      placeholder="Ex: Equity Bank, Rawbank, etc."
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Numéro de compte</label>
                    <Input
                      type="text"
                      placeholder="Entrez votre numéro de compte"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom du titulaire du compte</label>
                    <Input
                      type="text"
                      placeholder="Jean Dupont"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                    />
                  </div>

                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 text-sm">
                    <p className="mb-2 font-semibold text-purple-600">Virement Bancaire</p>
                    <p className="text-muted-foreground">
                      Les fonds seront transférés vers votre compte bancaire. Délai de traitement: 2-3 jours ouvrables.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('method')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleDetailsSubmit}
                  className="flex-1 bg-[#0A8B46] hover:bg-[#0A8B46]"
                >
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmer le retrait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold text-lg">
                    {withdrawalMethod === 'mobile_money' && currency === 'USD'
                      ? `${parseFloat(amount).toLocaleString('en-US')} USD`
                      : `${parseFloat(amount).toLocaleString('fr-FR')} CDF`}
                  </span>
                </div>
                {withdrawalMethod === 'mobile_money' && currency === 'USD' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Débit portefeuille</span>
                    <span className="font-bold text-red-600">
                      {(parseFloat(amount) * usdToCdfRate).toLocaleString('fr-FR')} CDF
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="font-semibold">
                    {withdrawalMethod === 'mobile_money' && 'Mobile Money'}
                    {withdrawalMethod === 'agent' && 'Agent eNkamba'}
                    {withdrawalMethod === 'card' && 'Carte Visa/Mastercard'}
                    {withdrawalMethod === 'bank' && 'Virement Bancaire'}
                  </span>
                </div>
                {withdrawalMethod === 'mobile_money' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-semibold">{phoneNumber}</span>
                  </div>
                )}
                {withdrawalMethod === 'agent' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-semibold">{agentIdentifier}</span>
                  </div>
                )}
                {withdrawalMethod === 'card' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carte</span>
                    <span className="font-semibold">**** {cardNumber.slice(-4)}</span>
                  </div>
                )}
                {withdrawalMethod === 'bank' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banque</span>
                      <span className="font-semibold">{bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compte</span>
                      <span className="font-semibold">{accountNumber}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-[#FFA500]/10 border border-[#FFA500]/30 rounded-lg p-4 flex gap-3 text-sm text-[#FFA500]">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Important</p>
                  <p>
                    {withdrawalMethod === 'mobile_money' && 'Le retrait sera traité instantanément vers votre compte mobile money.'}
                    {withdrawalMethod === 'agent' && 'Présentez votre code de retrait à l\'agent eNkamba pour récupérer vos fonds.'}
                    {withdrawalMethod === 'card' && 'Le retrait sera traité dans 3-5 jours ouvrables.'}
                    {withdrawalMethod === 'bank' && 'Le virement sera effectué dans 2-3 jours ouvrables.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('details')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#0A8B46] hover:bg-[#0A8B46]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer le retrait'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
