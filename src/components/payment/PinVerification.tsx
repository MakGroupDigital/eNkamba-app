'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface PinVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentDetails?: {
    recipient: string;
    amount: string;
    currency: string;
  };
}

export function PinVerification({ isOpen, onClose, onSuccess, paymentDetails }: PinVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mounted, setMounted] = useState(false);
  const maxAttempts = 3;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const checkPinExists = useCallback(async () => {
    if (!user) return;
    
    try {
      const pinDoc = await getDoc(doc(db, 'users', user.uid, 'security', 'pin'));
      setHasPin(pinDoc.exists());
      setPin('');
      setConfirmPin('');
      setAttempts(0);
    } catch (error) {
      console.error('Erreur vérification PIN:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de vérifier le code PIN',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (isOpen && user && mounted) {
      checkPinExists();
    }
    
    if (!isOpen) {
      setPin('');
      setConfirmPin('');
      setAttempts(0);
      setHasPin(null);
    }
  }, [isOpen, user, mounted, checkPinExists]);

  const createPin = async () => {
    if (!user) return;

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        variant: 'destructive',
        title: 'Code PIN invalide',
        description: 'Le code PIN doit contenir exactement 4 chiffres',
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les codes PIN ne correspondent pas',
      });
      return;
    }

    setIsCreatingPin(true);

    try {
      const hashedPin = btoa(pin);
      
      await setDoc(doc(db, 'users', user.uid, 'security', 'pin'), {
        pin: hashedPin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Code PIN créé ! ✅',
        description: 'Votre code PIN a été enregistré avec succès',
        className: 'bg-green-600 text-white border-none',
      });

      setHasPin(true);
      setPin('');
      setConfirmPin('');
      
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Erreur création PIN:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le code PIN',
      });
    } finally {
      setIsCreatingPin(false);
    }
  };

  const verifyPin = async () => {
    if (!user) return;

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        variant: 'destructive',
        title: 'Code PIN invalide',
        description: 'Le code PIN doit contenir exactement 4 chiffres',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const pinDoc = await getDoc(doc(db, 'users', user.uid, 'security', 'pin'));
      
      if (!pinDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Code PIN non trouvé',
        });
        setIsVerifying(false);
        return;
      }

      const storedPin = pinDoc.data().pin;
      const hashedPin = btoa(pin);

      if (hashedPin === storedPin) {
        toast({
          title: 'Code PIN vérifié ! ✅',
          description: 'Confirmation du paiement...',
          className: 'bg-green-600 text-white border-none',
        });
        
        setPin('');
        setAttempts(0);
        
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          toast({
            variant: 'destructive',
            title: 'Trop de tentatives',
            description: 'Paiement annulé pour des raisons de sécurité',
          });
          setPin('');
          setAttempts(0);
          setTimeout(() => onClose(), 1000);
        } else {
          toast({
            variant: 'destructive',
            title: 'Code PIN incorrect',
            description: `Il vous reste ${maxAttempts - newAttempts} tentative(s)`,
          });
          setPin('');
        }
      }
    } catch (error) {
      console.error('Erreur vérification PIN:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de vérifier le code PIN',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
  };

  const handleConfirmPinInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(numericValue);
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#32BB78]" />
            {hasPin === false ? 'Créer votre code PIN' : 'Vérification du code PIN'}
          </DialogTitle>
          <DialogDescription>
            {hasPin === false 
              ? 'Créez un code PIN à 4 chiffres pour sécuriser vos paiements'
              : 'Entrez votre code PIN pour confirmer le paiement'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {paymentDetails && hasPin !== false && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-center mb-3">Récapitulatif du paiement</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Destinataire :</span>
                <span className="font-semibold">{paymentDetails.recipient}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant :</span>
                <span className="font-bold text-[#32BB78]">
                  {paymentDetails.amount} {paymentDetails.currency}
                </span>
              </div>
            </div>
          )}

          {hasPin === null ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#32BB78]"></div>
            </div>
          ) : hasPin === false ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Sécurisez vos paiements</p>
                    <p className="text-xs">Créez un code PIN à 4 chiffres. Vous devrez le saisir avant chaque paiement.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pin">Code PIN (4 chiffres)</Label>
                <div className="relative">
                  <Input
                    id="new-pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => handlePinInput(e.target.value)}
                    className="text-center text-2xl tracking-widest font-bold pr-10"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirmer le code PIN</Label>
                <div className="relative">
                  <Input
                    id="confirm-pin"
                    type={showConfirmPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => handleConfirmPinInput(e.target.value)}
                    className="text-center text-2xl tracking-widest font-bold pr-10"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {pin.length === 4 && confirmPin.length === 4 && pin === confirmPin && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Les codes PIN correspondent</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-pin">Entrez votre code PIN</Label>
                <div className="relative">
                  <Input
                    id="verify-pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => handlePinInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && pin.length === 4) {
                        verifyPin();
                      }
                    }}
                    className="text-center text-3xl tracking-widest font-bold pr-10"
                    maxLength={4}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {attempts > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Code PIN incorrect. Il vous reste <strong>{maxAttempts - attempts}</strong> tentative(s).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCreatingPin || isVerifying}
          >
            Annuler
          </Button>
          {hasPin === false ? (
            <Button
              onClick={createPin}
              disabled={isCreatingPin || pin.length !== 4 || confirmPin.length !== 4 || pin !== confirmPin}
              className="bg-[#32BB78] hover:bg-[#2a9d63]"
            >
              {isCreatingPin ? 'Création...' : 'Créer le code PIN'}
            </Button>
          ) : (
            <Button
              onClick={verifyPin}
              disabled={isVerifying || pin.length !== 4}
              className="bg-[#32BB78] hover:bg-[#2a9d63]"
            >
              {isVerifying ? 'Vérification...' : 'Confirmer le paiement'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
