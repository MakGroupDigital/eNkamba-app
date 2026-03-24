'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type PaymentMethod = 'mobile_money' | 'credit_card' | 'debit_card' | 'crypto' | 'paypal' | 'wonyapay';

export default function AddFundsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFunds, isLoading } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'details' | 'confirm'>('method');
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
  const [wonyaDetails, setWonyaDetails] = useState({
    currency: 'CDF' as 'CDF' | 'USD',
    motif: '',
  });
  const [usdToCdfRate, setUsdToCdfRate] = useState<number>(2800);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  // Charger le taux de change USD/CDF pour WonyaPay et PayPal
  useEffect(() => {
    if (paymentMethod === 'paypal' || (paymentMethod === 'wonyapay' && wonyaDetails.currency === 'USD')) {
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
  }, [paymentMethod, wonyaDetails.currency]);

  // Calculer la conversion en temps réel
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      if (paymentMethod === 'wonyapay' && wonyaDetails.currency === 'USD') {
        setConvertedAmount(parseFloat(amount) * usdToCdfRate);
      } else if (paymentMethod === 'paypal') {
        setConvertedAmount(parseFloat(amount) * usdToCdfRate);
      } else {
        setConvertedAmount(parseFloat(amount));
      }
    } else {
      setConvertedAmount(0);
    }
  }, [amount, wonyaDetails.currency, usdToCdfRate, paymentMethod]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
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

    if ((paymentMethod === 'mobile_money' || paymentMethod === 'wonyapay') && !phoneNumber) {
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

    if (paymentMethod !== 'mobile_money' && paymentMethod !== 'crypto' && paymentMethod !== 'wonyapay' && paymentMethod !== 'paypal') {
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
    if (!user) return;
    
    try {
      // Si PayPal, rediriger vers le lien de paiement avec le montant pré-rempli
      if (paymentMethod === 'paypal') {
        const returnUrl = encodeURIComponent(`https://enkamba.io/ok?amount=${amount}&userId=${user.uid}`);
        const cancelUrl = encodeURIComponent(`https://enkamba.io/cancel`);
        
        // Le lien PayPal avec les paramètres de retour
        const paypalUrl = `https://www.paypal.com/ncp/payment/D723Q3TM3HQRW?return=${returnUrl}&cancel_return=${cancelUrl}`;
        
        window.open(paypalUrl, '_blank');
        
        toast({
          title: 'Redirection PayPal',
          description: 'Vous allez être redirigé vers PayPal pour finaliser le paiement',
          className: 'bg-blue-600 text-white border-none',
        });
        
        return;
      }

      const result = await addFunds(
        parseFloat(amount), 
        paymentMethod as 'mobile_money' | 'credit_card' | 'debit_card' | 'crypto' | 'wonyapay',
        {
          phoneNumber,
          cardDetails: paymentMethod !== 'mobile_money' && paymentMethod !== 'crypto' && paymentMethod !== 'wonyapay' ? cardDetails : undefined,
          cryptoDetails: paymentMethod === 'crypto' ? cryptoDetails : undefined,
          wonyaDetails: paymentMethod === 'wonyapay' ? wonyaDetails : undefined,
        }
      );

      if (result.transactionStatus === 'pending') {
        toast({
          title: 'Demande envoyée',
          description: result.message || 'Votre dépôt WonyaPay est en attente de confirmation',
          className: 'bg-amber-600 text-white border-none',
        });
      } else {
        toast({
          title: 'Succès',
          description: `${parseFloat(amount).toLocaleString('fr-FR')} CDF ont été ajoutés à votre portefeuille`,
          className: 'bg-green-600 text-white border-none',
        });
      }

      router.push('/dashboard/wallet');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer border-2 hover:border-[#0B6E4F] transition-colors"
              onClick={() => handleMethodSelect('wonyapay')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex gap-3 items-center justify-center h-16 flex-wrap">
                    {/* Airtel Money Logo */}
                    <div className="flex items-center">
                      <Image 
                        src="/logoairtel.png" 
                        alt="Airtel Money" 
                        width={80} 
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* M-Pesa Logo */}
                    <div className="flex items-center">
                      <Image 
                        src="/logompsa.png" 
                        alt="M-Pesa" 
                        width={80} 
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Orange Money Logo */}
                    <div className="flex items-center">
                      <Image 
                        src="/logo-orange.png" 
                        alt="Orange Money" 
                        width={80} 
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Africell Logo */}
                    <div className="flex items-center">
                      <Image 
                        src="/logoafricell.png" 
                        alt="Africell Money" 
                        width={80} 
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Mobile Money</h3>
                    <p className="text-sm text-muted-foreground">Airtel, M-Pesa, Orange, Africell</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#0070BA] transition-colors"
              onClick={() => handleMethodSelect('paypal')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex items-center justify-center h-16">
                    <svg viewBox="0 0 124 33" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253B80"/>
                      <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="#179BD7"/>
                      <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z" fill="#253B80"/>
                      <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7"/>
                      <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z" fill="#222D65"/>
                      <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z" fill="#253B80"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">PayPal</h3>
                    <p className="text-sm text-muted-foreground">Paiement sécurisé</p>
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
                  <div className="flex gap-3 items-center justify-center h-16">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-lg">VISA</div>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded-full bg-red-500"></div>
                      <div className="w-6 h-6 rounded-full bg-orange-500 -ml-3"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Carte Bancaire</h3>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#FFA500] transition-colors"
              onClick={() => handleMethodSelect('crypto')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex gap-2 items-center justify-center h-16">
                    <div className="text-4xl">₿</div>
                    <div className="text-4xl">Ξ</div>
                    <div className="text-4xl">💰</div>
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

        {/* Step 2: Payment Details with Amount */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {paymentMethod === 'mobile_money' 
                  ? 'Détails Mobile Money'
                  : paymentMethod === 'paypal'
                  ? 'Paiement PayPal'
                  : paymentMethod === 'wonyapay'
                  ? 'Dépôt Mobile Money'
                  : paymentMethod === 'crypto'
                  ? 'Détails Cryptomonnaie'
                  : 'Détails de la carte'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulaire WonyaPay avec montant et devise */}
              {paymentMethod === 'wonyapay' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Devise</label>
                    <select
                      className="w-full rounded-md border bg-background p-2"
                      value={wonyaDetails.currency}
                      onChange={(e) => setWonyaDetails({ ...wonyaDetails, currency: e.target.value as 'CDF' | 'USD' })}
                    >
                      <option value="CDF">Franc Congolais (CDF)</option>
                      <option value="USD">Dollar Américain (USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Montant ({wonyaDetails.currency})
                    </label>
                    <Input
                      type="number"
                      placeholder={`Entrez le montant en ${wonyaDetails.currency}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                    {wonyaDetails.currency === 'USD' && amount && parseFloat(amount) > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-muted-foreground">Vous recevrez:</p>
                        <p className="text-xl font-bold text-[#32BB78]">
                          {isLoadingRate ? (
                            'Calcul...'
                          ) : (
                            `${convertedAmount.toLocaleString('fr-FR')} CDF`
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

                  <div>
                    <label className="text-sm font-medium mb-2 block">Motif (optionnel)</label>
                    <Input
                      type="text"
                      placeholder="Dépôt portefeuille eNkamba"
                      value={wonyaDetails.motif}
                      onChange={(e) => setWonyaDetails({ ...wonyaDetails, motif: e.target.value })}
                    />
                  </div>

                  <div className="rounded-lg border border-[#0B6E4F]/20 bg-[#0B6E4F]/5 p-4 text-sm">
                    <p className="mb-2 font-semibold text-[#0B6E4F]">Mobile Money RDC</p>
                    <p className="text-muted-foreground">
                      Dépôt via Airtel, M-Pesa, Orange ou Africell. La transaction peut rester en attente jusqu&apos;à confirmation du réseau.
                    </p>
                  </div>
                </>
              )}

              {/* Formulaire PayPal */}
              {paymentMethod === 'paypal' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Montant (USD)</label>
                    <Input
                      type="number"
                      placeholder="Entrez le montant en USD"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                    {amount && parseFloat(amount) > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-muted-foreground">Vous recevrez environ:</p>
                        <p className="text-xl font-bold text-[#32BB78]">
                          {isLoadingRate ? (
                            'Calcul...'
                          ) : (
                            `${convertedAmount.toLocaleString('fr-FR')} CDF`
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Taux: 1 USD = {usdToCdfRate.toLocaleString('fr-FR')} CDF
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0070BA]/10 border border-[#0070BA]/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Vous serez redirigé vers PayPal pour finaliser votre paiement de manière sécurisée.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Paiement 100% sécurisé</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Protection des achats PayPal</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Fonds disponibles immédiatement</span>
                    </div>
                  </div>
                </>
              )}

              {/* Autres méthodes de paiement */}
              {paymentMethod === 'mobile_money' && (
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
                    <label className="text-sm font-medium mb-2 block">Numéro de téléphone</label>
                    <Input
                      type="tel"
                      placeholder="+243 812 345 678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'crypto' && (
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
              )}

              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
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
                  onClick={() => setStep('method')}
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
                  <span className="font-bold text-lg">
                    {paymentMethod === 'paypal' 
                      ? `$${parseFloat(amount).toLocaleString('en-US')} USD`
                      : paymentMethod === 'wonyapay'
                      ? `${parseFloat(amount).toLocaleString('fr-FR')} ${wonyaDetails.currency}`
                      : `${parseFloat(amount).toLocaleString('fr-FR')} CDF`}
                  </span>
                </div>
                {paymentMethod === 'paypal' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Équivalent CDF</span>
                    <span className="font-bold text-[#32BB78]">
                      {(parseFloat(amount) * usdToCdfRate).toLocaleString('fr-FR')} CDF
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="font-semibold">
                    {paymentMethod === 'mobile_money' 
                      ? 'Mobile Money'
                      : paymentMethod === 'paypal'
                      ? 'PayPal'
                      : paymentMethod === 'wonyapay'
                      ? 'Mobile Money'
                      : paymentMethod === 'crypto'
                      ? 'Cryptomonnaie'
                      : 'Carte bancaire'}
                  </span>
                </div>
                {(paymentMethod === 'mobile_money' || paymentMethod === 'wonyapay') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-semibold">{phoneNumber}</span>
                  </div>
                )}
                {paymentMethod === 'wonyapay' && (
                  <>
                    {wonyaDetails.currency === 'USD' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Crédit portefeuille</span>
                        <span className="font-bold text-[#32BB78]">
                          {convertedAmount.toLocaleString('fr-FR')} CDF
                        </span>
                      </div>
                    )}
                    {wonyaDetails.currency === 'USD' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taux de change</span>
                        <span className="font-semibold">
                          1 USD = {usdToCdfRate.toLocaleString('fr-FR')} CDF
                        </span>
                      </div>
                    )}
                    {wonyaDetails.motif && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Motif</span>
                        <span className="max-w-[220px] text-right font-semibold">{wonyaDetails.motif}</span>
                      </div>
                    )}
                  </>
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
                  ) : paymentMethod === 'wonyapay' ? (
                    <>
                      ✓ Dépôt initié via Mobile Money sécurisé<br />
                      {wonyaDetails.currency === 'USD' && '✓ Conversion automatique USD → CDF'}<br />
                      ✓ Crédit portefeuille après confirmation opérateur
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
