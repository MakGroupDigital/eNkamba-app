'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, Phone, CreditCard, Hash, Search, X, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resolveUserByIdentifier, isValidIdentifier } from '@/lib/user-resolver';

type IdentifierType = 'phone' | 'email' | 'enkNumber' | 'cardNumber';
type Currency = 'CDF' | 'USD' | 'EUR';

interface UserInfo {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  enkNumber: string;
  cardNumber: string;
}

interface TransferByIdentifierProps {
  onCancel: () => void;
  onTransferComplete: (userInfo: UserInfo, amount: string, currency: Currency) => void;
}

export function TransferByIdentifier({ onCancel, onTransferComplete }: TransferByIdentifierProps) {
  const { toast } = useToast();
  
  const [identifierType, setIdentifierType] = useState<IdentifierType>('phone');
  const [identifierValue, setIdentifierValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');

  const identifierOptions = [
    { value: 'phone', label: 'Numéro de Téléphone', icon: Phone, placeholder: '+243...' },
    { value: 'email', label: 'Adresse Email', icon: Mail, placeholder: 'user@example.com' },
    { value: 'enkNumber', label: 'Numéro eNkamba', icon: Hash, placeholder: 'ENK000000000000' },
    { value: 'cardNumber', label: 'Numéro de Carte', icon: CreditCard, placeholder: '1234 5678 9012 3456' },
  ];

  const currentOption = identifierOptions.find(opt => opt.value === identifierType);

  // Rechercher l'utilisateur
  const handleSearch = async () => {
    if (!identifierValue.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un identifiant',
      });
      return;
    }

    // Valider le format
    if (!isValidIdentifier(identifierValue)) {
      toast({
        variant: 'destructive',
        title: 'Format invalide',
        description: 'L\'identifiant saisi ne correspond à aucun format reconnu',
      });
      return;
    }

    setIsSearching(true);
    try {
      console.log('Recherche utilisateur avec:', identifierValue);
      
      const resolvedUser = await resolveUserByIdentifier(identifierValue);

      if (!resolvedUser) {
        toast({
          variant: 'destructive',
          title: 'Utilisateur introuvable',
          description: 'Aucun compte eNkamba trouvé avec cet identifiant',
        });
        setUserInfo(null);
        return;
      }

      console.log(`Utilisateur trouvé via ${resolvedUser.foundBy}:`, resolvedUser.uid);

      const userData = resolvedUser.data;

      // Générer le numéro eNkamba si pas présent
      let enkNumber = userData.accountNumber;
      if (!enkNumber) {
        const hash = resolvedUser.uid.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        enkNumber = `ENK${String(hash).padStart(12, '0')}`;
      }

      // Générer le numéro de carte si pas présent
      let cardNumber = userData.cardNumber;
      if (!cardNumber) {
        const hash = resolvedUser.uid.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const cardNum = String(hash).padStart(16, '0');
        cardNumber = cardNum.match(/.{1,4}/g)?.join(' ') || cardNum;
      }

      const foundUser: UserInfo = {
        uid: resolvedUser.uid,
        fullName: userData.fullName || userData.name || userData.displayName || 'Utilisateur eNkamba',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        enkNumber: enkNumber,
        cardNumber: cardNumber,
      };

      setUserInfo(foundUser);
      toast({
        title: 'Utilisateur trouvé ✅',
        description: `${foundUser.fullName} (trouvé via ${resolvedUser.foundBy})`,
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error) {
      console.error('Erreur recherche utilisateur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de rechercher l\'utilisateur',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Continuer vers le paiement
  const handleContinue = () => {
    if (!userInfo) return;
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide',
      });
      return;
    }

    onTransferComplete(userInfo, amount, currency);
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      {!userInfo ? (
        <>
          {/* Sélection du type d'identifiant */}
          <Card className="p-4 space-y-4">
            <div>
              <Label className="text-base font-bold mb-3 block">Type d'identifiant</Label>
              <div className="grid grid-cols-2 gap-2">
                {identifierOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={identifierType === option.value ? 'default' : 'outline'}
                      className={`h-auto py-3 flex flex-col items-center gap-2 ${
                        identifierType === option.value 
                          ? 'bg-[#32BB78] hover:bg-[#2a9d63]' 
                          : ''
                      }`}
                      onClick={() => {
                        setIdentifierType(option.value as IdentifierType);
                        setIdentifierValue('');
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs text-center">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Champ de saisie */}
            <div>
              <Label htmlFor="identifier" className="text-sm">
                {currentOption?.label}
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="identifier"
                  placeholder={currentOption?.placeholder}
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !identifierValue.trim()}
                  className="bg-[#32BB78] hover:bg-[#2a9d63]"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Button
            variant="ghost"
            className="w-full"
            onClick={onCancel}
          >
            Annuler
          </Button>
        </>
      ) : (
        <>
          {/* Informations de l'utilisateur trouvé */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Destinataire</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUserInfo(null);
                  setIdentifierValue('');
                  setAmount('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Avatar et nom */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="bg-[#32BB78]/10 rounded-full p-6">
                <User className="w-12 h-12 text-[#32BB78]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-[#32BB78]">{userInfo.fullName}</p>
              </div>
            </div>

            {/* Toutes les informations */}
            <div className="space-y-3 bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#32BB78]/10 rounded-full p-2">
                  <Hash className="w-4 h-4 text-[#32BB78]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Numéro eNkamba</p>
                  <p className="font-semibold truncate">{userInfo.enkNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 rounded-full p-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Numéro de Carte</p>
                  <p className="font-semibold truncate">{userInfo.cardNumber}</p>
                </div>
              </div>

              {userInfo.phoneNumber && (
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 rounded-full p-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-semibold truncate">{userInfo.phoneNumber}</p>
                  </div>
                </div>
              )}

              {userInfo.email && (
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 rounded-full p-2">
                    <Mail className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold truncate">{userInfo.email}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Montant */}
          <Card className="p-4 space-y-3">
            <Label htmlFor="amount" className="text-base font-bold">Montant à envoyer</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-center text-2xl h-14 font-bold flex-1"
              />
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger className="w-[100px] h-14 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDF">CDF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Boutons d'action */}
          <Button
            className="w-full bg-gradient-to-r from-[#32BB78] to-green-800 hover:from-[#2a9d63] hover:to-green-700 h-12 text-base font-bold"
            onClick={handleContinue}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setUserInfo(null);
              setIdentifierValue('');
              setAmount('');
            }}
          >
            Rechercher un autre utilisateur
          </Button>
        </>
      )}
    </div>
  );
}
