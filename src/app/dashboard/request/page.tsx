'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ArrowLeft, Loader2, Search, Mail, Phone, CreditCard, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface UserSearchResult {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  cardNumber: string;
  accountNumber: string;
  profileImage?: string;
}

type SearchMethod = 'card' | 'account' | 'email' | 'phone' | null;

export default function RequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [step, setStep] = useState<'method' | 'search' | 'confirm' | 'success'>('method');
  const [searchMethod, setSearchMethod] = useState<SearchMethod>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleMethodSelect = (method: SearchMethod) => {
    setSearchMethod(method);
    setStep('search');
  };

  const searchUser = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer une valeur de recherche',
      });
      return;
    }

    setIsSearching(true);
    try {
      const searchUserFn = httpsCallable(functions, 'searchUserByIdentifier');
      const result = await searchUserFn({
        searchMethod,
        searchQuery: searchQuery.trim(),
        currentUserId: user?.uid,
      });

      const data = result.data as any;

      if (data.success && data.user) {
        setFoundUser(data.user);
        setStep('confirm');
      } else {
        toast({
          variant: 'destructive',
          title: 'Utilisateur non trouvé',
          description: 'Aucun utilisateur ne correspond à cette recherche',
        });
        setFoundUser(null);
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
  }, [searchQuery, searchMethod, user?.uid, toast]);

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide',
      });
      return;
    }

    if (!foundUser) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Utilisateur non sélectionné',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const createRequestFn = httpsCallable(functions, 'createMoneyRequest');
      const result = await createRequestFn({
        fromUserId: user?.uid,
        toUserId: foundUser.uid,
        amount: parseFloat(amount),
        description: description || 'Demande de paiement',
      });

      const data = result.data as any;

      if (data.success) {
        setRequestId(data.requestId);
        setStep('success');

        toast({
          title: 'Succès',
          description: `Demande de ${parseFloat(amount).toLocaleString('fr-FR')} CDF envoyée à ${foundUser.fullName}`,
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
        description: error.message || 'Erreur lors de la création de la demande',
      });
    } finally {
      setIsSubmitting(false);
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
              Demander de l'argent
            </h1>
            <p className="text-sm text-muted-foreground">Demandez un paiement à un utilisateur eNkamba</p>
          </div>
        </header>

        {/* Step 1: Search Method Selection */}
        {step === 'method' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <h3 className="font-semibold text-lg">Numéro de Carte</h3>
                    <p className="text-sm text-muted-foreground">Numéro de carte eNkamba</p>
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
                    <h3 className="font-semibold text-lg">Numéro de Compte</h3>
                    <p className="text-sm text-muted-foreground">Numéro ENK...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <h3 className="font-semibold text-lg">Adresse Email</h3>
                    <p className="text-sm text-muted-foreground">Email de l'utilisateur</p>
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
                    <h3 className="font-semibold text-lg">Numéro de Téléphone</h3>
                    <p className="text-sm text-muted-foreground">Numéro de téléphone</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Search User */}
        {step === 'search' && (
          <Card>
            <CardHeader>
              <CardTitle>
                Rechercher un utilisateur
                {searchMethod === 'card' && ' - Numéro de Carte'}
                {searchMethod === 'account' && ' - Numéro de Compte'}
                {searchMethod === 'email' && ' - Email'}
                {searchMethod === 'phone' && ' - Téléphone'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {searchMethod === 'card' && 'Entrez le numéro de carte'}
                  {searchMethod === 'account' && 'Entrez le numéro de compte (ENK...)'}
                  {searchMethod === 'email' && 'Entrez l\'adresse email'}
                  {searchMethod === 'phone' && 'Entrez le numéro de téléphone'}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={
                      searchMethod === 'card' ? '1234 5678 9012 3456' :
                      searchMethod === 'account' ? 'ENK000000000000' :
                      searchMethod === 'email' ? 'user@example.com' :
                      '+243812345678'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                    className="flex-1"
                  />
                  <Button
                    onClick={searchUser}
                    disabled={isSearching}
                    className="bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('method');
                    setSearchQuery('');
                    setFoundUser(null);
                  }}
                  className="flex-1"
                >
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm Request */}
        {step === 'confirm' && foundUser && (
          <div className="space-y-4">
            {/* User Info Card */}
            <Card className="border-[#32BB78]/20 bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5">
              <CardHeader>
                <CardTitle className="text-lg">Informations de l'utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-semibold text-lg">{foundUser.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Numéro de compte</p>
                    <p className="font-mono font-semibold">{foundUser.accountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Numéro de carte</p>
                    <p className="font-mono font-semibold">{foundUser.cardNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold text-sm break-all">{foundUser.email}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-semibold">{foundUser.phoneNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle>Détails de la demande</CardTitle>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
                  <Input
                    type="text"
                    placeholder="Ex: Remboursement, Partage de frais..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p>
                    ✓ {foundUser.fullName} recevra un email et une notification<br />
                    ✓ Il pourra accepter ou refuser la demande<br />
                    ✓ Vous serez notifié de sa réponse
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('search');
                      setAmount('');
                      setDescription('');
                    }}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting || !amount}
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      'Envoyer la demande'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-green-100">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-green-900">Demande envoyée avec succès!</h3>
                  <p className="text-sm text-green-700 mt-2">
                    {foundUser?.fullName} a reçu votre demande de {parseFloat(amount).toLocaleString('fr-FR')} CDF
                  </p>
                  <p className="text-xs text-green-600 mt-4">
                    Redirection vers le portefeuille dans 3 secondes...
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
