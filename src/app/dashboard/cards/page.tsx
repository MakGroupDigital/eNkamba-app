'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCardDialog } from '@/components/payment/AddCardDialog';
import { MastercardLogo, VisaLogo } from '@/components/payment/card-brand-logos';
import { useSavedCards, AddCardData } from '@/hooks/useSavedCards';
import { ArrowLeft, Plus, Trash2, CreditCard, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CardsPage() {
  const { cards, isLoading, addCard, deleteCard } = useSavedCards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddCard = async (cardData: AddCardData) => {
    const success = await addCard(cardData);
    return success;
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingId(cardId);
    await deleteCard(cardId);
    setDeletingId(null);
  };

  const getCardColor = (cardType: string) => {
    return cardType === 'visa' 
      ? 'from-blue-600 to-blue-400' 
      : 'from-red-600 to-[#FFA500]';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0A8B46]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-8">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#0A8B46] to-[#0A8B46] bg-clip-text text-transparent">
              Mes Cartes
            </h1>
            <p className="text-sm text-muted-foreground">Gérez vos cartes bancaires</p>
          </div>
        </header>

        {/* Saved Cards */}
        <Card className="border-0 bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-xl">Cartes Enregistrées</CardTitle>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#0A8B46] hover:bg-[#0A8B46] gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une Carte
            </Button>
          </CardHeader>

          <CardContent>
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Aucune carte enregistrée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`relative h-48 rounded-xl bg-gradient-to-br ${getCardColor(
                      card.cardType
                    )} p-6 text-white shadow-lg overflow-hidden group`}
                  >
                    {/* Card background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                    </div>

                    {/* Card content */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs opacity-80 mb-1">Carte</p>
                          <p className="text-sm font-semibold">{card.cardHolder}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          {card.cardType === 'visa' ? (
                            <VisaLogo className="h-8 w-20" tone="onDark" />
                          ) : (
                            <MastercardLogo className="h-8 w-20" tone="onDark" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCard(card.id)}
                            disabled={deletingId === card.id}
                            className="text-white hover:bg-white/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Card number */}
                      <div>
                        <p className="text-lg font-mono tracking-widest mb-4">
                          •••• •••• •••• {card.lastFour}
                        </p>

                        {/* Expiry */}
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs opacity-80">Expire</p>
                            <p className="text-sm font-mono">
                              {card.expiryMonth}/{card.expiryYear}
                            </p>
                          </div>
                          {card.isDefault && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">
                              Par défaut
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Physical Card */}
        <Card className="border-0 bg-gradient-to-br from-[#0A8B46]/10 to-[#0A8B46]/5 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#0A8B46]" />
              Commander une Carte Physique
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Commandez une carte bancaire physique Visa ou Mastercard pour utiliser vos fonds en magasin et en ligne.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visa Card */}
              <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Carte Visa</h3>
                    <p className="text-sm text-muted-foreground">Acceptée mondialement</p>
                  </div>
                  <div className="w-[88px] h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center">
                    <VisaLogo className="h-7 w-[84px]" tone="onDark" />
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B46]"></span>
                    Paiements en ligne et en magasin
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B46]"></span>
                    Retraits aux distributeurs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B46]"></span>
                    Frais de gestion: 5 000 CDF
                  </li>
                </ul>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Commander Visa
                </Button>
              </div>

              {/* Mastercard */}
              <div className="border-2 border-red-200 rounded-lg p-6 hover:border-red-400 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Carte Mastercard</h3>
                    <p className="text-sm text-muted-foreground">Acceptée partout</p>
                  </div>
                  <div className="w-[88px] h-8 bg-gradient-to-br from-red-600 to-[#FFA500] rounded flex items-center justify-center">
                    <MastercardLogo className="h-7 w-[84px]" tone="onDark" />
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B46]"></span>
                    Paiements en ligne et en magasin
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B46]"></span>
                    Retraits aux distributeurs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B46]"></span>
                    Frais de gestion: 5 000 CDF
                  </li>
                </ul>

                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Commander Mastercard
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Info:</strong> Votre carte physique sera livrée dans un délai de 5 à 7 jours ouvrables. Des frais de livraison peuvent s'appliquer selon votre localisation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddCardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddCard}
        isLoading={isLoading}
      />
    </div>
  );
}
