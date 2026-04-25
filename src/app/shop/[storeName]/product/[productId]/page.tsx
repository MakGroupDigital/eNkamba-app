'use client';

import { use } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, increment, limit, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Loader2, Heart, MessageCircle, ShoppingCart, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNkampaCart } from '@/hooks/useNkampaCart';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { OrderReceipt } from '@/components/nkampa/OrderReceipt';

export default function ShopProductPage({
  params,
}: {
  params: Promise<{ storeName: string; productId: string }>;
}) {
  const { storeName, productId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useNkampaCart();
  const { buyProduct } = useNkampaEcommerce();
  const { balance } = useWalletBalance();

  const slug = useMemo(() => (storeName || '').toLowerCase(), [storeName]);
  const [storeDoc, setStoreDoc] = useState<any | null>(null);
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [priceInCDF, setPriceInCDF] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Vérifier si le produit est en favori
  useEffect(() => {
    if (!user || !productId) return;

    const checkFavorite = async () => {
      try {
        const favoriteDoc = await getDoc(doc(db, 'nkampa_favorites', `${user.uid}_${productId}`));
        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error('Erreur vérification favori:', error);
      }
    };

    checkFavorite();
  }, [user, productId]);

  useEffect(() => {
    if (!product) return;

    const convertPrice = async () => {
      try {
        const { convertToCDF } = await import('@/lib/currency-converter');
        const price = Number(product.price || 0);
        const currency = product.currency || 'CDF';
        const converted = await convertToCDF(price, currency);
        setPriceInCDF(Math.round(converted));
      } catch (error) {
        console.error('Erreur conversion prix:', error);
        setPriceInCDF(Number(product.price || 0));
      }
    };

    convertPrice();
  }, [product]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const sq = query(collection(db, 'nkampa_stores'), where('slug', '==', slug), limit(1));
        const ssnap = await getDocs(sq);
        if (!mounted) return;
        if (ssnap.empty) {
          router.replace(`/shop/${slug}`);
          return;
        }
        const store = { id: ssnap.docs[0].id, ...(ssnap.docs[0].data() as any) };
        setStoreDoc(store);

        const psnap = await getDoc(doc(db, 'nkampa_products', productId));
        if (!mounted) return;
        if (!psnap.exists()) {
          router.replace(`/shop/${slug}`);
          return;
        }
        setProduct({ id: psnap.id, ...(psnap.data() as any) });
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        router.replace(`/shop/${slug}`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug, productId, router]);

  useEffect(() => {
    if (!productId) return;

    const sessionKey = `nkampa_product_view_${productId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) return;

    const registerView = async () => {
      try {
        await updateDoc(doc(db, 'nkampa_products', productId), {
          clickCount: increment(1),
        });
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(sessionKey, '1');
        }
      } catch (error) {
        console.error('Erreur mise à jour vues produit:', error);
      }
    };

    void registerView();
  }, [productId]);

  const isOwner = !!user && !!storeDoc && user.uid === storeDoc.ownerId;
  const isApproved = storeDoc?.status === 'active' || storeDoc?.status === 'approved';

  const images: string[] = useMemo(() => {
    if (!product) return [];
    const list = Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : [];
    return list.slice(0, 8);
  }, [product]);

  const totalPrice = useMemo(() => priceInCDF * quantity, [priceInCDF, quantity]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      {
        ...product,
        image: product.image || images[0] || '',
        images,
        storeSlug: storeDoc?.slug || slug,
        sellerName: product.sellerName || storeDoc?.storeName || 'Boutique Nkampa',
      },
      quantity
    );

    toast({
      title: 'Produit ajouté',
      description: `${quantity} article(s) ajouté(s) au panier`,
      className: 'bg-green-600 text-white border-none',
    });
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour acheter ce produit.',
        variant: 'destructive',
      });
      return;
    }

    if (!shippingAddress.trim() || !shippingPhone.trim()) {
      toast({
        title: 'Informations manquantes',
        description: "Renseignez l'adresse et le numéro de téléphone.",
        variant: 'destructive',
      });
      return;
    }

    setIsBuying(true);
    try {
      const result = await buyProduct(
        {
          ...product,
          image: product.image || images[0] || '',
          images,
          sellerName: product.sellerName || storeDoc?.storeName || 'Boutique Nkampa',
          storeSlug: product.storeSlug || storeDoc?.slug || slug,
        },
        quantity,
        shippingAddress.trim(),
        shippingPhone.trim()
      );

      toast({
        title: 'Commande confirmée',
        description: `Commande ${result.orderNumber} créée avec succès.`,
        className: 'bg-green-600 text-white border-none',
      });

      // Afficher le reçu de paiement
      setCompletedOrder(result.order);
      setConversationId(result.conversationId);
      setShowReceipt(true);
    } catch (error: any) {
      toast({
        title: 'Paiement impossible',
        description: error?.message || 'Une erreur est survenue pendant le paiement.',
        variant: 'destructive',
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleChat = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour discuter avec le vendeur.',
        variant: 'destructive',
      });
      return;
    }

    if (!storeDoc?.ownerId) {
      toast({
        title: 'Erreur',
        description: 'Impossible de contacter le vendeur.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Créer ou récupérer la conversation avec le vendeur
      const { addDoc, collection, query, where, getDocs, serverTimestamp } = await import('firebase/firestore');
      
      // Vérifier si une conversation existe déjà
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid)
      );
      
      const snapshot = await getDocs(q);
      let existingConversation = null;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants?.includes(storeDoc.ownerId)) {
          existingConversation = { id: doc.id, ...data };
        }
      });

      if (existingConversation) {
        // Envoyer un message automatique avec la référence du produit
        const messagesRef = collection(db, 'conversations', existingConversation.id, 'messages');
        await addDoc(messagesRef, {
          senderId: user.uid,
          text: `Bonjour, je suis intéressé par ce produit : ${product.name}`,
          timestamp: serverTimestamp(),
          productReference: {
            id: product.id,
            name: product.name,
            price: priceInCDF,
            currency: 'CDF',
            image: images[0] || product.image,
            storeSlug: slug,
          },
        });

        // Rediriger vers la conversation existante
        router.push(`/dashboard/miyiki-chat/${existingConversation.id}`);
      } else {
        // Créer une nouvelle conversation
        const newConversation = await addDoc(conversationsRef, {
          participants: [user.uid, storeDoc.ownerId],
          participantNames: {
            [user.uid]: user.displayName || user.email || 'Utilisateur',
            [storeDoc.ownerId]: storeDoc.storeName || 'Vendeur',
          },
          lastMessage: `Bonjour, je suis intéressé par ce produit : ${product.name}`,
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          type: 'nkampa_shop',
          shopId: storeDoc.id,
          shopName: storeDoc.storeName,
          productReference: {
            id: product.id,
            name: product.name,
            price: priceInCDF,
            currency: 'CDF',
            image: images[0] || product.image,
          },
        });

        // Envoyer le premier message avec la référence du produit
        const messagesRef = collection(db, 'conversations', newConversation.id, 'messages');
        await addDoc(messagesRef, {
          senderId: user.uid,
          text: `Bonjour, je suis intéressé par ce produit : ${product.name}`,
          timestamp: serverTimestamp(),
          productReference: {
            id: product.id,
            name: product.name,
            price: priceInCDF,
            currency: 'CDF',
            image: images[0] || product.image,
            storeSlug: slug,
          },
        });

        router.push(`/dashboard/miyiki-chat/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la conversation.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour ajouter aux favoris.',
        variant: 'destructive',
      });
      return;
    }

    if (!product) return;

    try {
      const favoriteId = `${user.uid}_${productId}`;
      const favoriteRef = doc(db, 'nkampa_favorites', favoriteId);

      if (isFavorite) {
        // Retirer des favoris
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
        toast({
          title: 'Retiré des favoris',
          description: 'Le produit a été retiré de vos favoris.',
          className: 'bg-gray-600 text-white border-none',
        });
      } else {
        // Ajouter aux favoris
        const { setDoc, serverTimestamp } = await import('firebase/firestore');
        await setDoc(favoriteRef, {
          userId: user.uid,
          productId: product.id,
          productName: product.name,
          productPrice: priceInCDF,
          productCurrency: 'CDF',
          productImage: images[0] || product.image || '',
          storeId: storeDoc.id,
          storeName: storeDoc.storeName,
          storeSlug: slug,
          addedAt: serverTimestamp(),
        });
        setIsFavorite(true);
        toast({
          title: 'Ajouté aux favoris',
          description: 'Le produit a été ajouté à vos favoris.',
          className: 'bg-green-600 text-white border-none',
        });
      }
    } catch (error) {
      console.error('Erreur gestion favoris:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier les favoris.',
        variant: 'destructive',
      });
    }
  };

  const share = async () => {
    const url = window.location.href;
    const title = product?.name ? String(product.name) : 'Produit';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-green-600 text-white border-none' });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-green-600 text-white border-none' });
      } catch {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de partager le lien.' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!storeDoc || !product) return null;

  if (!isApproved && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" onClick={() => router.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold truncate">{storeDoc.storeName}</h1>
              <p className="text-xs text-white/80">Boutique en attente d'approbation</p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-4">
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-900">Accès non disponible</p>
              <p className="text-xs text-amber-800 mt-1">Ce produit n'est pas encore public.</p>
              <Button asChild className="mt-3 bg-primary hover:bg-primary/90">
                <Link href={`/shop/${slug}`}>Retour boutique</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header vert eNkamba */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-2 bg-white/90 rounded-full px-3 py-2">
            <span className="text-xs text-gray-600 truncate">{product.name}</span>
          </div>

          <button onClick={share} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-all">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Image principale avec badge et favoris */}
      <div className="relative bg-gray-100">
        <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
          <div className="flex transition-transform duration-300 ease-out h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
            {images.map((src, idx) => (
              <div key={idx} className="relative min-w-full h-full flex-shrink-0">
                <Image
                  src={src}
                  alt={`${product.name} - Photo ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Boutons navigation gauche/droite */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Badge eNkamba Quality Pro */}
        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>eNkamba</span>
          </div>
          <div className="text-[10px] text-green-400">QUALITÉ PRO</div>
        </div>

        {/* Bouton Favoris */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:scale-110 transition-transform"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>

        {/* Indicateur images */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
            Photos {currentImageIndex + 1}/{images.length}
          </div>
        )}

        {/* Bouton caméra */}
        <button className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:scale-110 transition-transform">
          <span className="text-lg">📷</span>
        </button>
      </div>

      {/* Onglets (Photos, Vidéo, Points forts) - Afficher seulement si données disponibles */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 border-b border-gray-200">
          <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold">
            Photos {images.length}
          </button>
        </div>
      )}

      {/* Livraison rapide - Afficher seulement si info disponible */}
      {product.fastDelivery && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-lg">🚚</span>
          <span className="text-sm font-semibold text-green-700">Livraison rapide & sécurisée</span>
        </div>
      )}

      {/* Prix */}
      <div className="mx-4 mt-4 space-y-2">
        {/* Afficher réduction seulement si disponible */}
        {product.discount && product.discount > 0 && (
          <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2">
            <p className="text-xs text-green-700 font-semibold">
              {product.discount}% de réduction
            </p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-green-600">{priceInCDF.toLocaleString()}</span>
            {product.discount && product.discount > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {Math.round(priceInCDF / (1 - product.discount / 100)).toLocaleString()}
              </span>
            )}
            <span className="text-xs text-gray-500">CDF</span>
          </div>
          {product.minOrder && (
            <p className="text-xs text-gray-600">Commande minimale : {product.minOrder} pièce(s)</p>
          )}
        </div>
      </div>

      {/* Description produit */}
      <div className="mx-4 mt-4 space-y-3">
        <h2 className="font-bold text-gray-900">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-gray-600">{product.description}</p>
        )}

        {/* Catégorie si disponible */}
        {(product.storeCategory || storeDoc.category) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Catégorie:</span>
            <span className="text-xs font-semibold text-green-600">
              {product.storeCategory || storeDoc.category}
            </span>
          </div>
        )}
      </div>

      {/* Infos supplémentaires - Afficher seulement si disponibles */}
      {(product.shippingDays || product.location) && (
        <div className="mx-4 mt-4 space-y-2">
          {product.location && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">📍 {product.location}</span>
            </div>
          )}
          {product.shippingDays && (
            <div className="text-right text-xs text-gray-500">
              Expédition en {product.shippingDays} jour(s)
            </div>
          )}
        </div>
      )}

      {/* Vendeur */}
      <button 
        onClick={() => router.push(`/shop/${slug}`)}
        className="mx-4 mt-4 bg-gray-50 rounded-lg p-3 flex items-center justify-between w-full hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
            {storeDoc.storeName?.charAt(0) || 'e'}
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900">Vendeur vérifié : {storeDoc.storeName}</p>
            {storeDoc.description && (
              <p className="text-xs text-gray-600 mt-1">{storeDoc.description}</p>
            )}
          </div>
        </div>
        <span className="text-lg">›</span>
      </button>

      {/* Champs adresse et téléphone */}
      <div className="mx-4 mt-4 space-y-2">
        <input
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          placeholder="📍 Adresse de livraison"
          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        />
        <input
          value={shippingPhone}
          onChange={(e) => setShippingPhone(e.target.value)}
          placeholder="📞 Téléphone"
          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        />
      </div>

      {/* Boutons d'action flottants */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 rounded-lg py-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            Ajouter au panier
          </button>
          <button 
            onClick={handleChat}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 rounded-lg py-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Chat
          </button>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={isBuying}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg py-3 font-bold transition-colors flex items-center justify-center gap-2"
        >
          {isBuying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              Acheter
            </>
          )}
        </button>
      </div>

      {/* Badges de confiance */}
      <div className="mx-4 mb-32 mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
        <span>✓ Produits de qualité</span>
        <span>✓ Paiement sécurisé</span>
        {product.warranty && <span>✓ Garantie {product.warranty}</span>}
        {product.returns && <span>✓ Retours acceptés</span>}
      </div>

      {/* Reçu de paiement */}
      {showReceipt && completedOrder && (
        <OrderReceipt
          order={completedOrder}
          onClose={() => {
            setShowReceipt(false);
            if (conversationId) {
              router.push(`/dashboard/miyiki-chat/${conversationId}`);
            }
          }}
        />
      )}
    </div>
  );
}
