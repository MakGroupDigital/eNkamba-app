'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddCardDialog } from './AddCardDialog';
import { useSavedCards, AddCardData } from '@/hooks/useSavedCards';
import { Plus, Trash2, CreditCard } from 'lucide-react';

export function SavedCardsSection() {
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

  const getCardBrand = (cardType: string) => {
    return cardType === 'visa' ? 'Visa' : 'Mastercard';
  };

  const getCardColor = (cardType: string) => {
    return cardType === 'visa' 
      ? 'from-blue-600 to-blue-400' 
      : 'from-red-600 to-orange-500';
  };

  return (
    <>
      <Card className="border-0 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-xl">Mes Cartes</CardTitle>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#32BB78] hover:bg-[#2a9d63] gap-2"
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
              <p className="text-muted-foreground mb-4">Aucune carte enregistrée</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#32BB78] hover:bg-[#2a9d63]"
              >
                Ajouter votre première carte
              </Button>
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
                        <p className="text-xs opacity-80 mb-1">
                          {getCardBrand(card.cardType)}
                        </p>
                        <p className="text-sm font-semibold">{card.cardHolder}</p>
                      </div>
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

      <AddCardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddCard}
        isLoading={isLoading}
      />
    </>
  );
}
