'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Smartphone, CreditCard, Bitcoin } from 'lucide-react';
import Link from 'next/link';

type PaymentMethod = 'mobile_money' | 'credit_card' | 'debit_card' | 'crypto';

export default function AddFundsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFunds, isLoading } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'amount' | 'details' | 'confirm'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [cryptoDetails, setCryptoDetails] = useState({
    currency: 'BTC',
    walletAddress: '',
  });

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide',
      });
      return;
    }
    setStep('details');
  };

  const handleDetailsSubmit = async () => {
    if (paymentMethod === 'mobile_money' && !phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de téléphone',
      });
      return;
    }

    if (paymentMethod === 'crypto' && !cryptoDetails.walletAddress) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer votre adresse de portefeuille crypto',
      });
      return;
    }

    if (paymentMethod !== 'mobile_money' && paymentMethod !== 'crypto') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Veuillez remplir tous les détails de la carte',
        });
        return;
      }
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      const result = await addFunds(
        parseFloat(amount), 
        paymentMethod as 'mobile_money' | 'credit_card' | 'debit_card' | 'crypto', 
        {
          phoneNumber,
          cardDetails: paymentMethod !== 'mobile_money' && paymentMethod !== 'crypto' ? cardDetails : undefined,
          cryptoDetails: paymentMethod === 'crypto' ? cryptoDetails : undefined,
        }
      );

      toast({
        title: 'Succès',
        description: `${parseFloat(amount).toLocaleString('fr-FR')} CDF ont été ajoutés à votre portefeuille`,
        className: 'bg-green-600 text-white border-none',
      });

      setTimeout(() => {
        router.push('/dashboard/wallet');
      }, 2000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout de fonds',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Ajouter des fonds
            </h1>
            <p className="text-sm text-muted-foreground">Choisissez votre méthode de paiement</p>
          </div>
        </header>

        {/* Step 1: Payment Method Selection */}
        {step === 'method' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('mobile_money')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <Smartphone className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Mobile Money</h3>
                    <p className="text-sm text-muted-foreground">Vodacom, Airtel, Orange</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('credit_card')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <CreditCard className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Carte Bancaire</h3>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('crypto')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#FFA500]/20">
                    <Bitcoin className="w-8 h-8 text-[#FFA500]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Cryptomonnaie</h3>
                    <p className="text-sm text-muted-foreground">Bitcoin, USDT, ETH...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <Card>
            <CardHeader>
              <CardTitle>Montant à ajouter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('method')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleAmountSubmit}
                  className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                >
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {paymentMethod === 'mobile_money' 
                  ? 'Numéro de téléphone' 
                  : paymentMethod === 'crypto'
                  ? 'Détails Cryptomonnaie'
                  : 'Détails de la carte'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethod === 'mobile_money' ? (
                <div>
                  <label className="text-sm font-medium mb-2 block">Numéro de téléphone</label>
                  <Input
                    type="tel"
                    placeholder="+243 812 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              ) : paymentMethod === 'crypto' ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cryptomonnaie</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={cryptoDetails.currency}
                      onChange={(e) => setCryptoDetails({ ...cryptoDetails, currency: e.target.value })}
                    >
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="USDT">Tether (USDT)</option>
                      <option value="USDC">USD Coin (USDC)</option>
                      <option value="BNB">Binance Coin (BNB)</option>
                      <option value="XRP">Ripple (XRP)</option>
                      <option value="ADA">Cardano (ADA)</option>
                      <option value="SOL">Solana (SOL)</option>
                      <option value="DOGE">Dogecoin (DOGE)</option>
                      <option value="TRX">Tron (TRX)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Votre adresse de portefeuille</label>
                    <Input
                      type="text"
                      placeholder="Entrez votre adresse crypto"
                      value={cryptoDetails.walletAddress}
                      onChange={(e) => setCryptoDetails({ ...cryptoDetails, walletAddress: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ Vérifiez bien votre adresse. Les transactions crypto sont irréversibles.
                    </p>
                  </div>
                  <div className="bg-[#FFA500]/10 border border-[#FFA500]/30 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-[#FFA500] mb-2">📌 Instructions:</p>
                    <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                      <li>Sélectionnez votre cryptomonnaie</li>
                      <li>Entrez votre adresse de portefeuille</li>
                      <li>Vous recevrez une adresse de dépôt eNkamba</li>
                      <li>Envoyez vos crypto à cette adresse</li>
                      <li>Les fonds seront convertis en CDF automatiquement</li>
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Numéro de carte</label>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date d'expiration</label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">CVV</label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        maxLength={3}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom du titulaire</label>
                    <Input
                      type="text"
                      placeholder="Jean Dupont"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('amount')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleDetailsSubmit}
                  className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                >
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmer l'ajout de fonds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold text-lg">{parseFloat(amount).toLocaleString('fr-FR')} CDF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="font-semibold">
                    {paymentMethod === 'mobile_money' 
                      ? 'Mobile Money' 
                      : paymentMethod === 'crypto'
                      ? 'Cryptomonnaie'
                      : 'Carte bancaire'}
                  </span>
                </div>
                {paymentMethod === 'mobile_money' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-semibold">{phoneNumber}</span>
                  </div>
                )}
                {paymentMethod === 'crypto' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crypto</span>
                      <span className="font-semibold">{cryptoDetails.currency}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Adresse</span>
                      <span className="font-mono text-xs text-right max-w-[200px] break-all">
                        {cryptoDetails.walletAddress.substring(0, 20)}...
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p>
                  ✓ Vos données sont sécurisées et chiffrées<br />
                  {paymentMethod === 'crypto' ? (
                    <>
                      ✓ Conversion automatique au taux du marché<br />
                      ✓ Fonds disponibles après confirmation blockchain
                    </>
                  ) : (
                    <>
                      ✓ Aucun frais supplémentaire<br />
                      ✓ Fonds disponibles immédiatement
                    </>
                  )}
                </p>
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
                  className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer'
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
