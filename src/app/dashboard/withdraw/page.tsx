'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Smartphone, Building2, QrCode as QrCodeIcon, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type WithdrawalMethod = 'mobile_money' | 'agent' | 'qr_scan';
type MobileMoneyProvider = 'vodacom' | 'airtel' | 'orange' | 'mtn' | 'moov' | 'wave' | 'flutterwave' | 'paypal' | 'wise';

interface MobileMoneyProviderInfo {
  id: MobileMoneyProvider;
  name: string;
  countries: string[];
  icon: string;
  color: string;
  minAmount: number;
  maxAmount: number;
  fee: number; // percentage
}

const MOBILE_MONEY_PROVIDERS: MobileMoneyProviderInfo[] = [
  // Africa
  {
    id: 'vodacom',
    name: 'Vodacom M-Pesa',
    countries: ['DRC', 'Tanzania', 'Kenya', 'Mozambique'],
    icon: '📱',
    color: 'from-red-500 to-red-600',
    minAmount: 100,
    maxAmount: 5000000,
    fee: 1.5,
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    countries: ['DRC', 'Kenya', 'Tanzania', 'Uganda', 'Zambia', 'Malawi'],
    icon: '📲',
    color: 'from-red-600 to-red-700',
    minAmount: 100,
    maxAmount: 5000000,
    fee: 1.5,
  },
  {
    id: 'orange',
    name: 'Orange Money',
    countries: ['Senegal', 'Mali', 'Ivory Coast', 'Cameroon', 'Guinea', 'Benin'],
    icon: '🟠',
    color: 'from-orange-500 to-orange-600',
    minAmount: 500,
    maxAmount: 3000000,
    fee: 2,
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    countries: ['Ghana', 'Cameroon', 'Ivory Coast', 'Uganda', 'Rwanda', 'Benin'],
    icon: '🟡',
    color: 'from-yellow-500 to-yellow-600',
    minAmount: 100,
    maxAmount: 5000000,
    fee: 1.5,
  },
  {
    id: 'moov',
    name: 'Moov Africa',
    countries: ['Togo', 'Benin', 'Ivory Coast', 'Cameroon'],
    icon: '📞',
    color: 'from-purple-500 to-purple-600',
    minAmount: 500,
    maxAmount: 2000000,
    fee: 2,
  },
  {
    id: 'wave',
    name: 'Wave Money',
    countries: ['Senegal', 'Mali', 'Ivory Coast', 'Burkina Faso'],
    icon: '〰️',
    color: 'from-blue-500 to-blue-600',
    minAmount: 500,
    maxAmount: 3000000,
    fee: 1,
  },
  // International
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    countries: ['Worldwide', 'Africa', 'Europe', 'Americas'],
    icon: '🌍',
    color: 'from-indigo-500 to-indigo-600',
    minAmount: 100,
    maxAmount: 10000000,
    fee: 2.5,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    countries: ['Worldwide'],
    icon: '🅿️',
    color: 'from-blue-600 to-blue-700',
    minAmount: 100,
    maxAmount: 50000000,
    fee: 3,
  },
  {
    id: 'wise',
    name: 'Wise (TransferWise)',
    countries: ['Worldwide'],
    icon: '💱',
    color: 'from-teal-500 to-teal-600',
    minAmount: 100,
    maxAmount: 100000000,
    fee: 1.5,
  },
];

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, withdrawFunds, isLoading } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'provider' | 'amount' | 'details' | 'confirm' | 'qr_scan'>('method');
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [agentLocation, setAgentLocation] = useState('');
  const [qrScanned, setQrScanned] = useState(false);
  const [scannedAgentData, setScannedAgentData] = useState<any>(null);

  const handleMethodSelect = (method: WithdrawalMethod) => {
    setWithdrawalMethod(method);
    if (method === 'mobile_money') {
      setStep('provider');
    } else if (method === 'agent') {
      setStep('amount');
    } else if (method === 'qr_scan') {
      setStep('qr_scan');
    }
  };

  const handleProviderSelect = (provider: MobileMoneyProvider) => {
    setSelectedProvider(provider);
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

    if (parseFloat(amount) > balance) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Solde insuffisant',
      });
      return;
    }

    const provider = MOBILE_MONEY_PROVIDERS.find(p => p.id === selectedProvider);
    if (provider && parseFloat(amount) < provider.minAmount) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Montant minimum: ${provider.minAmount.toLocaleString('fr-FR')} CDF`,
      });
      return;
    }

    if (provider && parseFloat(amount) > provider.maxAmount) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Montant maximum: ${provider.maxAmount.toLocaleString('fr-FR')} CDF`,
      });
      return;
    }

    setStep('details');
  };

  const handleDetailsSubmit = async () => {
    if (withdrawalMethod === 'mobile_money' && !phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de téléphone',
      });
      return;
    }

    if (withdrawalMethod === 'agent' && (!agentCode || !agentLocation)) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer le code et la localisation de l\'agent',
      });
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      const provider = MOBILE_MONEY_PROVIDERS.find(p => p.id === selectedProvider);
      const fee = provider ? (parseFloat(amount) * provider.fee) / 100 : 0;
      const totalAmount = parseFloat(amount) + fee;

      let details: any = {};

      if (withdrawalMethod === 'mobile_money') {
        details = {
          phoneNumber,
          provider: selectedProvider,
          providerName: provider?.name,
        };
      } else if (withdrawalMethod === 'agent') {
        details = {
          agentCode,
          agentLocation,
        };
      } else if (withdrawalMethod === 'qr_scan') {
        details = {
          agentId: scannedAgentData?.agentId,
          agentName: scannedAgentData?.agentName,
          agentLocation: scannedAgentData?.location,
        };
      }

      await withdrawFunds(totalAmount, withdrawalMethod === 'mobile_money' ? 'mobile_money' : 'agent', details);

      toast({
        title: 'Succès',
        description: `Retrait de ${parseFloat(amount).toLocaleString('fr-FR')} CDF initié. Frais: ${fee.toLocaleString('fr-FR')} CDF`,
        className: 'bg-green-600 text-white border-none',
      });

      setTimeout(() => {
        router.push('/dashboard/wallet');
      }, 2000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du retrait',
      });
    }
  };

  const handleQRScan = () => {
    // Simulation du scan QR - en production, utiliser une vraie librairie de scan QR
    const mockAgentData = {
      agentId: 'AGENT-001',
      agentName: 'Agent eNkamba Kinshasa',
      location: 'Kinshasa, Gombe',
      phoneNumber: '+243812345678',
    };
    setScannedAgentData(mockAgentData);
    setQrScanned(true);
    setStep('amount');
  };

  if (!user) {
    return null;
  }

  const provider = MOBILE_MONEY_PROVIDERS.find(p => p.id === selectedProvider);
  const fee = provider && amount ? (parseFloat(amount) * provider.fee) / 100 : 0;
  const totalAmount = amount ? parseFloat(amount) + fee : 0;

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
              Retirer des fonds
            </h1>
            <p className="text-sm text-muted-foreground">Solde disponible: {balance.toLocaleString('fr-FR')} CDF</p>
          </div>
        </header>

        {/* Step 1: Withdrawal Method Selection */}
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
                    <p className="text-sm text-muted-foreground">Vodacom, Airtel, Orange...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('agent')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <Building2 className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Agent eNkamba</h3>
                    <p className="text-sm text-muted-foreground">Retrait direct chez l'agent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
              onClick={() => handleMethodSelect('qr_scan')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-[#32BB78]/20">
                    <QrCodeIcon className="w-8 h-8 text-[#32BB78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Scanner QR</h3>
                    <p className="text-sm text-muted-foreground">Code QR de l'agent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Mobile Money Provider Selection */}
        {step === 'provider' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('method')}
                className="flex-1"
              >
                Retour
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOBILE_MONEY_PROVIDERS.map((provider) => (
                <Card
                  key={provider.id}
                  className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
                  onClick={() => handleProviderSelect(provider.id)}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{provider.icon}</span>
                        <span className="text-xs bg-[#32BB78]/20 text-[#32BB78] px-2 py-1 rounded">
                          {provider.fee}% frais
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm">{provider.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {provider.countries.join(', ')}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Min: {provider.minAmount.toLocaleString('fr-FR')} CDF</p>
                        <p>Max: {provider.maxAmount.toLocaleString('fr-FR')} CDF</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Amount */}
        {step === 'amount' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {withdrawalMethod === 'mobile_money' && `Montant - ${provider?.name}`}
                {withdrawalMethod === 'agent' && 'Montant à retirer'}
                {withdrawalMethod === 'qr_scan' && `Montant - ${scannedAgentData?.agentName}`}
              </CardTitle>
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
                {provider && amount && (
                  <div className="mt-3 p-3 bg-muted rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span className="font-semibold">{parseFloat(amount).toLocaleString('fr-FR')} CDF</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frais ({provider.fee}%):</span>
                      <span>{fee.toLocaleString('fr-FR')} CDF</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total à débiter:</span>
                      <span className="text-[#32BB78]">{totalAmount.toLocaleString('fr-FR')} CDF</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (withdrawalMethod === 'mobile_money') {
                      setStep('provider');
                    } else {
                      setStep('method');
                    }
                  }}
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

        {/* Step 4: Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {withdrawalMethod === 'mobile_money' && 'Numéro de téléphone'}
                {withdrawalMethod === 'agent' && 'Informations de l\'agent'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {withdrawalMethod === 'mobile_money' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Numéro de téléphone</label>
                  <Input
                    type="tel"
                    placeholder="+243 812 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Le numéro doit être valide pour {provider?.name}
                  </p>
                </div>
              )}

              {withdrawalMethod === 'agent' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Code de l'agent</label>
                    <Input
                      type="text"
                      placeholder="Ex: AGENT-001"
                      value={agentCode}
                      onChange={(e) => setAgentCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Localisation de l'agent</label>
                    <Input
                      type="text"
                      placeholder="Ex: Kinshasa, Gombe"
                      value={agentLocation}
                      onChange={(e) => setAgentLocation(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p>
                  ✓ Vos données sont sécurisées et chiffrées<br />
                  ✓ Retrait disponible dans 24-48 heures<br />
                  ✓ Frais appliqués selon le fournisseur
                </p>
              </div>

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

        {/* Step 5: Confirmation */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmer le retrait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold text-lg">{parseFloat(amount).toLocaleString('fr-FR')} CDF</span>
                </div>
                {provider && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frais ({provider.fee}%)</span>
                      <span className="font-semibold">{fee.toLocaleString('fr-FR')} CDF</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-lg">
                      <span>Total à débiter</span>
                      <span className="text-red-600">{totalAmount.toLocaleString('fr-FR')} CDF</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="font-semibold">
                    {withdrawalMethod === 'mobile_money' && `${provider?.name}`}
                    {withdrawalMethod === 'agent' && 'Agent eNkamba'}
                    {withdrawalMethod === 'qr_scan' && `${scannedAgentData?.agentName}`}
                  </span>
                </div>
                {withdrawalMethod === 'mobile_money' && (
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-semibold">{phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Important</p>
                  <p>Le retrait sera traité dans 24-48 heures. Vous recevrez une notification une fois le retrait complété.</p>
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
                  className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
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

        {/* Step 6: QR Scan */}
        {step === 'qr_scan' && (
          <Card>
            <CardHeader>
              <CardTitle>Scanner le code QR de l'agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!qrScanned ? (
                <>
                  <div className="bg-muted p-8 rounded-lg flex flex-col items-center justify-center gap-4 min-h-64">
                    <QrCodeIcon className="w-16 h-16 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">
                      Pointez votre caméra vers le code QR de l'agent eNkamba
                    </p>
                    <Button
                      onClick={handleQRScan}
                      className="bg-[#32BB78] hover:bg-[#2a9d63]"
                    >
                      Simuler le scan QR
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    En production, cela utilisera la caméra de votre appareil
                  </p>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <span className="font-semibold">Code QR scanné avec succès</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agent:</span>
                      <span className="font-semibold">{scannedAgentData?.agentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Localisation:</span>
                      <span className="font-semibold">{scannedAgentData?.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Téléphone:</span>
                      <span className="font-semibold">{scannedAgentData?.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('method');
                    setQrScanned(false);
                    setScannedAgentData(null);
                  }}
                  className="flex-1"
                >
                  Retour
                </Button>
                {qrScanned && (
                  <Button
                    onClick={() => setStep('amount')}
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    Continuer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
