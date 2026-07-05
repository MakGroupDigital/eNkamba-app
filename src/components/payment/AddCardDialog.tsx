'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';
import { AddCardData } from '@/hooks/useSavedCards';
import { MastercardLogo, VisaLogo } from '@/components/payment/card-brand-logos';

interface AddCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: AddCardData) => Promise<boolean>;
  isLoading: boolean;
}

export function AddCardDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddCardDialogProps) {
  const [cardType, setCardType] = useState<'visa' | 'mastercard'>('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardHolder,
      expiryMonth,
      expiryYear,
      cvv,
      cardType,
    });

    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setCardNumber('');
    setCardHolder('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setCardType('visa');
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#25543A]" />
            Ajouter une Carte
          </DialogTitle>
          <DialogDescription>
            Ajoutez votre carte Visa ou Mastercard de manière sécurisée
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type de Carte</label>
            <Select value={cardType} onValueChange={(value: any) => setCardType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">
                  <div className="flex items-center gap-2">
                    <VisaLogo className="h-5 w-14" />
                    <span>Visa</span>
                  </div>
                </SelectItem>
                <SelectItem value="mastercard">
                  <div className="flex items-center gap-2">
                    <MastercardLogo className="h-5 w-14" />
                    <span>Mastercard</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Number */}
          <div>
            <label className="text-sm font-medium mb-2 block">Numéro de Carte</label>
            <Input
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => formatCardNumber(e.target.value)}
              maxLength={19}
              required
            />
          </div>

          {/* Card Holder */}
          <div>
            <label className="text-sm font-medium mb-2 block">Titulaire de la Carte</label>
            <Input
              placeholder="Jean Dupont"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              required
            />
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Mois</label>
              <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = String(i + 1).padStart(2, '0');
                    return (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Année</label>
              <Select value={expiryYear} onValueChange={setExpiryYear}>
                <SelectTrigger>
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">CVV</label>
              <Input
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                type="password"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#25543A] hover:bg-[#25543A]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                'Ajouter la Carte'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
