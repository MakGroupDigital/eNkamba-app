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
        description: 'Renseignez l\'adresse et le numéro de téléphone.',
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
        <div className="relative w-full aspect-square bg-gray-200">
          <Image
            src={images[currentImageIndex] || '/placeholder-product.png'}
            alt={product.name}
            fill
            className="object-cover"
          />
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
          onClick={() => setIsFavorite(!isFavorite)}
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

      {/* Onglets (Photos, Vidéo, Points forts) */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200">
        <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold">Photos 1/6</button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-200">Vidéo</button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-200">Points forts</button>
      </div>

      {/* Livraison rapide */}
      <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-lg">🚚</span>
        <span className="text-sm font-semibold text-green-700">Livraison rapide & sécurisée</span>
      </div>

      {/* Prix et réduction */}
      <div className="mx-4 mt-4 space-y-2">
        <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2">
          <p className="text-xs text-green-700 font-semibold">5% de réduction | Prix inférieur à celui des produits similaires</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-green-600">{priceInCDF.toLocaleString()}</span>
            <span className="text-sm text-gray-500 line-through">{(priceInCDF * 1.05).toLocaleString()}</span>
            <span className="text-xs text-gray-500">CDF</span>
          </div>
          <p className="text-xs text-gray-600">Commande minimale : 1 pièce</p>
        </div>

        {/* Réduction supplémentaire */}
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💚</span>
            <span className="text-xs font-semibold text-green-700">5 $US de réduction sur 3 000 $US</span>
          </div>
          <span className="text-lg">›</span>
        </div>
      </div>

      {/* Description produit */}
      <div className="mx-4 mt-4 space-y-3">
        <h2 className="font-bold text-gray-900">{product.name}</h2>
        <p className="text-sm text-gray-600">{product.description || 'Produit de qualité professionnelle'}</p>

        {/* Voir avis */}
        <button className="text-sm text-green-600 font-semibold flex items-center gap-1">
          Voir les avis sur le produit (1)
          <span>›</span>
        </button>
      </div>

      {/* Infos supplémentaires */}
      <div className="mx-4 mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">💚 N°3 des plus populaires dans Câbles audio et vidéo</span>
          <span className="text-gray-600">›</span>
        </div>
        <div className="text-right text-xs text-gray-500">Expédition en 5 jours</div>
      </div>

      {/* Vendeur */}
      <div className="mx-4 mt-4 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
            {storeDoc.storeName?.charAt(0) || 'e'}
          </div>
          <div>
            <p className="font-bold text-gray-900">Vendeur vérifié : {storeDoc.storeName}</p>
            <div className="flex gap-2 text-xs text-gray-600">
              <span>✓ Personnalisation mineure</span>
              <span>✓ Personnalisation sur plan</span>
            </div>
          </div>
        </div>
        <span className="text-lg">›</span>
      </div>

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
          <button className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 rounded-lg py-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors">
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
      <div className="mx-4 mb-32 mt-4 flex gap-2 text-xs text-gray-600">
        <span>✓ Produits de qualité</span>
        <span>✓ Paiement sécurisé</span>
        <span>✓ Support dédié</span>
        <span>✓ Garantie satisfait ou remboursé</span>
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
        description: 'Renseignez l’adresse et le numéro de téléphone.',
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
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" onClick={() => router.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold truncate">{storeDoc.storeName}</h1>
              <p className="text-xs text-white/80">Boutique en attente d’approbation</p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-4">
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-900">Accès non disponible</p>
              <p className="text-xs text-amber-800 mt-1">Ce produit n’est pas encore public.</p>
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
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-36">
      {/* Header moderne et futuriste avec navigation */}
      <header className="sticky top-0 z-30">
        <div className="relative px-3 pt-3">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-[min(760px,95vw)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(16,185,129,0.55),transparent)] blur-2xl" />

          <div className="mx-auto max-w-6xl">
            {/* Floating frame (gradient border) */}
            <div className="relative rounded-[28px] p-[1px] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <div className="absolute inset-0 rounded-[28px] bg-[conic-gradient(at_30%_30%,rgba(16,185,129,1),rgba(34,197,94,0.55),rgba(16,185,129,0.22),rgba(16,185,129,1))] opacity-95" />
              <div className="relative rounded-[27px] border border-white/10 bg-background/65 backdrop-blur-2xl">
                {/* Top row */}
                <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-foreground/80 hover:bg-primary/10 hover:text-foreground"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <div className="min-w-0 flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-[0_10px_35px_rgba(16,185,129,0.22)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.55),transparent_60%)]" />
                      <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-white/20 blur-md" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-sm font-extrabold tracking-tight text-foreground truncate">
                        {product.name}
                      </h1>
                      <p className="text-xs text-muted-foreground truncate">{storeDoc.storeName}</p>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={share}
                    className="text-foreground/80 hover:bg-primary/10 hover:text-foreground"
                    aria-label="Partager"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="rounded-3xl overflow-hidden border border-primary/10 bg-white">
          <div className="relative w-full aspect-square bg-gray-100">
            <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {images.map((src, idx) => (
                <div key={idx} className="relative min-w-full h-full snap-center">
                  <Image src={src} alt={product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {images.map((_, idx) => (
                <span key={idx} className="h-1.5 w-1.5 rounded-full bg-white/85 shadow" />
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Prix</p>
                <p className="text-2xl font-extrabold text-primary">
                  {priceInCDF.toLocaleString()} CDF
                </p>
                {product.currency && product.currency !== 'CDF' && product.currency !== 'FC' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix original: {(product.price || 0).toLocaleString()} {product.currency}
                  </p>
                )}
              </div>
              <Badge className="bg-primary/10 text-primary border border-primary/15">
                {product.storeCategory || storeDoc.category || 'Nkampa'}
              </Badge>
            </div>
            {product.description ? <p className="text-sm text-muted-foreground mt-3">{product.description}</p> : null}
            <Link
              href={`/shop/${slug}`}
              className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Store className="h-4 w-4" />
              <span className="truncate">Boutique: {storeDoc.storeName}</span>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Infos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-primary/10 bg-white p-3">
              <p className="text-xs text-muted-foreground">Localisation</p>
              <p className="font-semibold">{product.location || '—'}</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-white p-3">
              <p className="text-xs text-muted-foreground">Sous-catégorie</p>
              <p className="font-semibold">{product.storeSubcategory || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button asChild className="bg-primary hover:bg-primary/90 flex-1">
            <Link href={`/shop/${slug}`}>Retour boutique</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard/nkampa">Explorer Nkampa</Link>
          </Button>
        </div>
      </div>

      {/* Barre d'action flottante minimaliste et futuriste */}
      <div className="fixed inset-x-0 bottom-6 z-40 px-4 pointer-events-none">
        <div className="mx-auto max-w-5xl">
          {/* Conteneur principal avec effet glassmorphism */}
          <div className="relative pointer-events-auto">
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-emerald-500/20 to-primary/20 rounded-[32px] blur-xl opacity-60" />
            
            {/* Barre principale */}
            <div className="relative rounded-[28px] p-[1px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-primary via-emerald-500 to-primary opacity-90" />
              
              <div className="relative rounded-[27px] bg-background/95 backdrop-blur-2xl border border-white/20">
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Contrôle quantité compact */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/5 border border-primary/10">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-95"
                      aria-label="Réduire"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold text-primary">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => current + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-95"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Prix total */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="text-lg font-black text-primary truncate">
                      {totalPrice.toLocaleString()} <span className="text-xs">CDF</span>
                    </p>
                  </div>

                  {/* Bouton Panier */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 text-primary transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                    aria-label="Ajouter au panier"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>

                  {/* Bouton Acheter */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isBuying}
                    className="relative overflow-hidden rounded-2xl px-6 py-3 font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-500 to-primary" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 animate-shimmer" />
                    <span className="relative flex items-center gap-2">
                      {isBuying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Traitement...</span>
                        </>
                      ) : (
                        <>
                          <span>Acheter</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Champs d'adresse toujours visibles */}
                <div className="px-4 pb-3 pt-1 space-y-2 border-t border-primary/5">
                  <input
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    placeholder="📍 Adresse de livraison"
                    className="w-full h-10 rounded-xl border border-primary/10 bg-white/50 px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-white"
                  />
                  <input
                    value={shippingPhone}
                    onChange={(event) => setShippingPhone(event.target.value)}
                    placeholder="📞 Téléphone"
                    className="w-full h-10 rounded-xl border border-primary/10 bg-white/50 px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reçu de paiement */}
      {showReceipt && completedOrder && (
        <OrderReceipt
          order={completedOrder}
          onClose={() => {
            setShowReceipt(false);
            // Rediriger vers la conversation avec le vendeur
            if (conversationId) {
              router.push(`/dashboard/miyiki-chat/${conversationId}`);
            }
          }}
        />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
