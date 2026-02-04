'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { ArrowLeft, Loader2, Mail, Phone, CreditCard, User, Smartphone, Zap, AlertCircle, CheckCircle2, Bluetooth, Wifi } from 'lucide-react';
import Link from 'next/link';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

type TransferMethod = 'email' | 'phone' | 'card' | 'account' | 'bluetooth' | 'wifi' | null;

export default function SendPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'recipient' | 'amount' | 'confirm' | 'success'>('method');
  const [transferMethod, setTransferMethod] = useState<TransferMethod>(null);
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [senderCurrency, setSenderCurrency] = useState('CDF');
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const handleMethodSelect = (method: TransferMethod) => {
    setTransferMethod(method);
    setStep('recipient');
  };

  const searchRecipient = useCallback(async () => {
    if (!recipientIdentifier.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer une valeur',
      });
      return;
    }

    // Vérifier que l'utilisateur n'essaie pas de s'envoyer de l'argent à lui-même
    if (recipientIdentifier.trim() === user?.email || recipientIdentifier.trim() === user?.phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous ne pouvez pas envoyer de l\'argent à vous-même',
      });
      return;
    }

    setIsSearching(true);
    try {
      const searchFn = httpsCallable(functions, 'searchUserByIdentifier');
      const result = await searchFn({
        searchMethod: transferMethod,
        searchQuery: recipientIdentifier.trim(),
        currentUserId: user?.uid,
      });

      const data = result.data as any;

      if (data.success && data.user) {
        // Vérifier que ce n'est pas l'utilisateur lui-même
        if (data.user.uid === user?.uid) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Vous ne pouvez pas envoyer de l\'argent à vous-même',
          });
          return;
        }
        setRecipientInfo(data.user);
        setStep('amount');
      } else {
        toast({
          variant: 'destructive',
          title: 'Non trouvé',
          description: 'Destinataire non trouvé',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de la recherche',
      });
    } finally {
      setIsSearching(false);
    }
  }, [recipientIdentifier, transferMethod, user?.uid, user?.email, user?.phoneNumber, toast]);

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Montant invalide',
      });
      return;
    }

    if (parseFloat(amount) > balance) {
      toast({
        variant: 'destructive',
        title: 'Solde insuffisant',
        description: `Vous avez ${balance.toLocaleString('fr-FR')} CDF. Veuillez ajouter des fonds.`,
      });
      return;
    }

    // Pour Bluetooth et WiFi, on va directement à la confirmation
    if (transferMethod === 'bluetooth' || transferMethod === 'wifi') {
      setStep('confirm');
    } else {
      setStep('confirm');
    }
  };

  const confirmTransfer = async () => {
    if (!user) return;

    // Pour Bluetooth et WiFi, on n'a pas besoin de recipientInfo
    if ((transferMethod === 'bluetooth' || transferMethod === 'wifi') && !recipientInfo) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Destinataire non spécifié',
      });
      return;
    }

    if (!recipientInfo && transferMethod !== 'bluetooth' && transferMethod !== 'wifi') return;

    setIsTransferring(true);
    try {
      const sendMoneyFn = httpsCallable(functions, 'sendMoney');
      const result = await sendMoneyFn({
        senderId: user.uid,
        amount: parseFloat(amount),
        senderCurrency,
        transferMethod,
        recipientIdentifier: (transferMethod !== 'bluetooth' && transferMethod !== 'wifi') ? recipientIdentifier : undefined,
        recipientId: recipientInfo?.uid,
        description: description || undefined,
      });

      const data = result.data as any;

      if (data.success) {
        setTransactionId(data.transactionId);
        setStep('success');

        toast({
          title: 'Succès',
          description: `${parseFloat(amount).toLocaleString('fr-FR')} ${senderCurrency} envoyés${recipientInfo ? ` à ${recipientInfo.fullName}` : ''} (${data.amountReceived.toLocaleString('fr-FR')} ${data.recipientCurrency} reçus)`,
          className: 'bg-green-600 text-white border-none',
        });

        setTimeout(() => {
          router.push('/dashboard/wallet');
        }, 3000);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'envoi',
      });
    } finally {
      setIsTransferring(false);
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
              Envoyer de l'argent
            </h1>
            <p className="text-sm text-muted-foreground">Solde: {balance.toLocaleString('fr-FR')} CDF</p>
          </div>
        </header>

        {/* Step 1: Method Selection */}
        {step === 'method' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('email')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <Mail className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Par Email</h3>
                    <p className="text-sm text-muted-foreground">Adresse email</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('phone')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <Phone className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Par Téléphone</h3>
                    <p className="text-sm text-muted-foreground">Numéro de téléphone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('card')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <CreditCard className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Par Carte</h3>
                    <p className="text-sm text-muted-foreground">Numéro de carte</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('account')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <User className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Par Compte</h3>
                    <p className="text-sm text-muted-foreground">Numéro ENK...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('bluetooth')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <Bluetooth className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Par Bluetooth</h3>
                    <p className="text-sm text-muted-foreground">Proximité sans fil</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('wifi')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <Wifi className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Par WiFi</h3>
                    <p className="text-sm text-muted-foreground">Connexion locale</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Recipient */}
        {step === 'recipient' && (
          <Card>
            <CardHeader>
              <CardTitle>Destinataire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(transferMethod === 'bluetooth' || transferMethod === 'wifi') ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
                    <p className="font-semibold">
                      {transferMethod === 'bluetooth' ? '📱 Transfert par Bluetooth' : '📡 Transfert par WiFi'}
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      {transferMethod === 'bluetooth' ? (
                        <>
                          <li>Assurez-vous que Bluetooth est activé</li>
                          <li>Approchez votre téléphone du destinataire</li>
                          <li>Les appareils vont se détecter automatiquement</li>
                          <li>Confirmez le transfert sur les deux appareils</li>
                        </>
                      ) : (
                        <>
                          <li>Assurez-vous que WiFi est activé</li>
                          <li>Connectez-vous au même réseau WiFi</li>
                          <li>Le destinataire recevra une notification</li>
                          <li>Confirmez le transfert sur les deux appareils</li>
                        </>
                      )}
                    </ul>
                  </div>

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
                    <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
                    <Input
                      type="text"
                      placeholder="Ex: Remboursement, Partage de frais..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('method');
                        setAmount('');
                        setDescription('');
                      }}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={() => {
                        if (!amount || parseFloat(amount) <= 0) {
                          toast({
                            variant: 'destructive',
                            title: 'Erreur',
                            description: 'Montant invalide',
                          });
                          return;
                        }
                        if (parseFloat(amount) > balance) {
                          toast({
                            variant: 'destructive',
                            title: 'Solde insuffisant',
                            description: `Vous avez ${balance.toLocaleString('fr-FR')} CDF. Veuillez ajouter des fonds.`,
                          });
                          return;
                        }
                        setStep('confirm');
                      }}
                      className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                    >
                      Continuer
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {transferMethod === 'email' && 'Email'}
                      {transferMethod === 'phone' && 'Téléphone'}
                      {transferMethod === 'card' && 'Numéro de carte'}
                      {transferMethod === 'account' && 'Numéro de compte'}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={
                          transferMethod === 'email' ? 'user@example.com' :
                          transferMethod === 'phone' ? '+243812345678' :
                          transferMethod === 'card' ? '1234 5678 9012 3456' :
                          transferMethod === 'account' ? 'ENK000000000000' :
                          'Identifiant'
                        }
                        value={recipientIdentifier}
                        onChange={(e) => setRecipientIdentifier(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchRecipient()}
                        className="flex-1"
                      />
                      <Button
                        onClick={searchRecipient}
                        disabled={isSearching}
                        className="bg-[#32BB78] hover:bg-[#2a9d63]"
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Chercher'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('method');
                        setRecipientIdentifier('');
                      }}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Amount */}
        {step === 'amount' && recipientInfo && (
          <div className="space-y-4">
            <Card className="border-[#32BB78]/20 bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Destinataire</p>
                  <p className="text-lg font-semibold">{recipientInfo.fullName}</p>
                  <p className="text-sm text-muted-foreground">{recipientInfo.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Montant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Devise</label>
                  <select
                    value={senderCurrency}
                    onChange={(e) => setSenderCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#32BB78]"
                  >
                    <option value="CDF">CDF - Franc Congolais</option>
                    <option value="USD">USD - Dollar Américain</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - Livre Sterling</option>
                    <option value="ZAR">ZAR - Rand Sud-Africain</option>
                    <option value="KES">KES - Shilling Kényan</option>
                    <option value="UGX">UGX - Shilling Ougandais</option>
                    <option value="RWF">RWF - Franc Rwandais</option>
                    <option value="TZS">TZS - Shilling Tanzanien</option>
                    <option value="XOF">XOF - Franc CFA Ouest</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Montant ({senderCurrency})</label>
                  <Input
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
                  <Input
                    type="text"
                    placeholder="Ex: Remboursement, Partage de frais..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('recipient');
                      setAmount('');
                      setDescription('');
                    }}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleTransfer}
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    Continuer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmer l'envoi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                {recipientInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destinataire</span>
                      <span className="font-semibold">{recipientInfo.fullName}</span>
                    </div>
                  </>
                )}
                {(transferMethod === 'bluetooth' || transferMethod === 'wifi') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Méthode</span>
                    <span className="font-semibold">
                      {transferMethod === 'bluetooth' ? 'Bluetooth' : 'WiFi'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant à envoyer</span>
                  <span className="font-bold text-lg">{parseFloat(amount).toLocaleString('fr-FR')} {senderCurrency}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Nouveau solde</span>
                  <span className="text-[#32BB78]">{(balance - parseFloat(amount)).toLocaleString('fr-FR')} {senderCurrency}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">💱 Conversion de devises</p>
                <p>Le montant sera converti automatiquement selon les taux de change actuels de Google Finance.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(recipientInfo ? 'amount' : 'recipient')}
                  className="flex-1"
                  disabled={isTransferring}
                >
                  Retour
                </Button>
                <Button
                  onClick={confirmTransfer}
                  className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  disabled={isTransferring}
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    'Confirmer'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
                <div>
                  <h3 className="font-semibold text-lg text-green-900">Argent envoyé!</h3>
                  <p className="text-sm text-green-700 mt-2">
                    {parseFloat(amount).toLocaleString('fr-FR')} CDF ont été envoyés à {recipientInfo?.fullName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
