'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedPayment, PaymentMethod, PaymentContext } from '@/hooks/useUnifiedPayment';
import { QRScannerComponent } from './QRScannerComponent';
import {
  ArrowLeft,
  Loader2,
  QrCode,
  CreditCard,
  User,
  Mail,
  Phone,
  Bluetooth,
  Wifi,
  CheckCircle2,
  Camera,
} from 'lucide-react';

export interface UnifiedPaymentFlowProps {
  context: PaymentContext;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
  customIcon?: React.ReactNode;
  customLabel?: string;
}

export function UnifiedPaymentFlow(props: UnifiedPaymentFlowProps) {
  const {
    context,
    onSuccess,
    onError,
    onBack,
    customIcon,
    customLabel = 'Payer',
  } = props;

  const { toast } = useToast();
  const { isProcessing, balance, searchRecipient, processPayment } = useUnifiedPayment({ context });

  const [step, setStep] = useState<'method' | 'details' | 'confirm' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');

  const paymentMethods = [
    { id: 'qrcode' as PaymentMethod, icon: QrCode, label: 'Scanner QR Code', description: 'Scannez le code QR' },
    { id: 'card' as PaymentMethod, icon: CreditCard, label: 'Par Carte', description: 'Numéro de carte' },
    { id: 'account' as PaymentMethod, icon: User, label: 'Par Compte', description: 'Numéro ENK...' },
    { id: 'email' as PaymentMethod, icon: Mail, label: 'Par Email', description: 'Adresse email' },
    { id: 'phone' as PaymentMethod, icon: Phone, label: 'Par Téléphone', description: 'Numéro de téléphone' },
    { id: 'bluetooth' as PaymentMethod, icon: Bluetooth, label: 'Par Bluetooth', description: 'Proximité sans fil' },
    { id: 'wifi' as PaymentMethod, icon: Wifi, label: 'Par WiFi', description: 'Connexion locale' },
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('details');
  };

  const handleSearch = async () => {
    if (!paymentMethod) return;

    setIsSearching(true);
    try {
      const recipient = await searchRecipient(recipientIdentifier, paymentMethod);
      if (recipient) {
        setRecipientInfo(recipient);
        setStep('confirm');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const startQRScanning = async () => {
    setIsScanning(true);
  };

  const stopQRScanning = () => {
    setIsScanning(false);
  };

  const handleQRCodeInput = (code: string) => {
    setQrCodeData(code);
    stopQRScanning();
    setStep('confirm');
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Montant invalide',
      });
      return;
    }

    const success = await processPayment({
      amount: parseFloat(amount),
      paymentMethod: paymentMethod!,
      recipientId: recipientInfo?.uid,
      recipientIdentifier: paymentMethod !== 'bluetooth' && paymentMethod !== 'wifi' ? recipientIdentifier : undefined,
      qrCodeData: paymentMethod === 'qrcode' ? qrCodeData : undefined,
      description: description || undefined,
    });

    if (success) {
      setStep('success');
      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess('transaction_id');
      }
    } else if (onError) {
      onError(new Error('Erreur lors du paiement'));
    }
  };

  const handleBack = () => {
    if (step === 'method') {
      if (onBack) onBack();
    } else if (step === 'details') {
      setStep('method');
      setPaymentMethod(null);
      setRecipientIdentifier('');
      setQrCodeData('');
      stopQRScanning();
    } else if (step === 'confirm') {
      setStep('details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {step !== 'success' && (
        <div className="flex items-center gap-4">
          {step !== 'method' && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft />
            </Button>
          )}
          <div>
            <h2 className="font-headline text-2xl font-bold text-[#32BB78]">{customLabel}</h2>
            <p className="text-sm text-muted-foreground">Solde: {balance.toLocaleString('fr-FR')} CDF</p>
          </div>
        </div>
      )}

      {/* Step 1: Method Selection */}
      {step === 'method' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card
                key={method.id}
                className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
                onClick={() => handleMethodSelect(method.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 rounded-full bg-[#32BB78]/20">
                      <Icon className="w-8 h-8 text-[#32BB78]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{method.label}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Détails du Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod === 'qrcode' ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">📱 Scanner QR Code Réel</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Utilisez votre caméra pour scanner</li>
                    <li>Détection automatique en temps réel</li>
                    <li>Ou entrez le code manuellement</li>
                  </ul>
                </div>

                {!isScanning ? (
                  <Button onClick={startQRScanning} className="w-full bg-[#32BB78] hover:bg-[#2a9d63] gap-2">
                    <Camera className="h-4 w-4" />
                    Démarrer le scan
                  </Button>
                ) : (
                  <QRScannerComponent
                    onSuccess={handleQRCodeInput}
                    onCancel={stopQRScanning}
                    isLoading={isProcessing}
                  />
                )}
              </>
            ) : paymentMethod === 'bluetooth' || paymentMethod === 'wifi' ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">
                    {paymentMethod === 'bluetooth' ? '📱 Paiement par Bluetooth' : '📡 Paiement par WiFi'}
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    {paymentMethod === 'bluetooth' ? (
                      <>
                        <li>Assurez-vous que Bluetooth est activé</li>
                        <li>Approchez votre téléphone du destinataire</li>
                        <li>Les appareils vont se détecter automatiquement</li>
                      </>
                    ) : (
                      <>
                        <li>Assurez-vous que WiFi est activé</li>
                        <li>Connectez-vous au même réseau WiFi</li>
                        <li>Le destinataire recevra une notification</li>
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

                <Button
                  onClick={() => setStep('confirm')}
                  className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                >
                  Continuer
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {paymentMethod === 'email' && 'Email'}
                    {paymentMethod === 'phone' && 'Téléphone'}
                    {paymentMethod === 'card' && 'Numéro de carte'}
                    {paymentMethod === 'account' && 'Numéro de compte'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={
                        paymentMethod === 'email'
                          ? 'user@example.com'
                          : paymentMethod === 'phone'
                            ? '+243812345678'
                            : paymentMethod === 'card'
                              ? '1234 5678 9012 3456'
                              : 'ENK000000000000'
                      }
                      value={recipientIdentifier}
                      onChange={(e) => setRecipientIdentifier(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-[#32BB78] hover:bg-[#2a9d63]"
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Chercher'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmer le Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              {recipientInfo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinataire</span>
                  <span className="font-semibold">{recipientInfo.fullName}</span>
                </div>
              )}
              {(paymentMethod === 'bluetooth' || paymentMethod === 'wifi') && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="font-semibold">
                    {paymentMethod === 'bluetooth' ? 'Bluetooth' : 'WiFi'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold text-lg">{parseFloat(amount || '0').toLocaleString('fr-FR')} CDF</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Nouveau solde</span>
                <span className="text-[#32BB78]">
                  {(balance - parseFloat(amount || '0')).toLocaleString('fr-FR')} CDF
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isProcessing}>
                Retour
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Confirmer le Paiement'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
              <div>
                <h3 className="font-semibold text-lg text-green-900">Paiement Effectué!</h3>
                <p className="text-sm text-green-700 mt-2">
                  {parseFloat(amount || '0').toLocaleString('fr-FR')} CDF ont été payés avec succès
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
