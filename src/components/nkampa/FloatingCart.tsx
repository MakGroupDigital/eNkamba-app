'use client';

import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CartItem } from '@/hooks/useNkampaCart';

interface FloatingCartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  total: number;
  itemCount: number;
}

export const FloatingCart = ({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  total,
  itemCount,
}: FloatingCartProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isOpen && itemCount === 0) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Floating Cart */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out',
          isOpen ? 'w-96' : 'w-20'
        )}
      >
        {/* Collapsed View */}
        {!isOpen && itemCount > 0 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center flex-col gap-1"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-bold">{itemCount}</span>
          </button>
        )}

        {/* Expanded View */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="font-bold">Panier ({itemCount})</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Votre panier est vide</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    {/* Product Image */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-2">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.product.sellerName}
                      </p>
                      <p className="font-bold text-sm text-primary">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => onRemove(item.product.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                      <div className="flex items-center gap-1 bg-white border rounded-lg">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-1 hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-1 hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-4 space-y-3 bg-muted/30">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-primary to-primary text-white hover:from-primary/90 hover:to-primary/90 h-10 font-semibold flex items-center justify-center gap-2"
                >
                  Passer la commande
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Continue Shopping */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full h-10"
                >
                  Continuer les achats
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
