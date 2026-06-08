'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'nkampa_favorites'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs: any[] = [];
      snapshot.forEach((doc) => {
        favs.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setFavorites(favs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'nkampa_favorites', favoriteId));
      toast({
        title: 'Retiré des favoris',
        className: 'bg-primary text-white border-none',
      });
    } catch (error) {
      console.error('Erreur suppression favori:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de retirer des favoris',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour voir vos favoris</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary via-primary to-primary text-white p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/nkampa">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Mes Favoris</h1>
            <p className="text-sm text-white/80">{favorites.length} produit(s)</p>
          </div>
        </div>
      </div>

      {/* Liste des favoris */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Aucun favori</p>
            <p className="text-sm text-gray-400 mb-4">
              Ajoutez des produits à vos favoris pour les retrouver facilement
            </p>
            <Link href="/dashboard/nkampa">
              <Button>Découvrir des produits</Button>
            </Link>
          </div>
        ) : (
          favorites.map((favorite) => (
            <Card key={favorite.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={favorite.productImage || 'https://via.placeholder.com/150'}
                      alt={favorite.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {favorite.productName}
                    </h3>
                    <p className="text-primary font-bold text-xl mb-2">
                      {favorite.productPrice?.toLocaleString()} {favorite.productCurrency || 'CDF'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {favorite.sellerName}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeFavorite(favorite.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => router.push(`/dashboard/nkampa?product=${favorite.productId}`)}
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
