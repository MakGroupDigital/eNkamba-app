'use client';

import { use } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, getDoc, getDocs, increment, limit, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Share2, Loader2, Heart, MessageCircle, ShoppingCart, Check, MapPinned, Route, ShieldCheck, DownloadCloud, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNkampaCart } from '@/hooks/useNkampaCart';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { OrderReceipt } from '@/components/nkampa/OrderReceipt';
import { PinVerification } from '@/components/payment/PinVerification';
import { getDashboardLocationOrDefault } from '@/lib/dashboard-location';

type PickupRouteContext = {
  enabled: boolean;
  storeLocationLabel: string;
  buyerLocationLabel: string;
  buyerLatitude: number;
  buyerLongitude: number;
  destinationQuery: string;
  suggestedTransportMode?: 'foot' | 'car' | 'train';
};

type PendingPurchase = {
  shippingAddress: string;
  shippingPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  pickupRoute?: PickupRouteContext;
};

type SellerReview = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  authorAvatar?: string;
  productName?: string;
  createdAt?: any;
};

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
  const { buyProduct, products: marketplaceProducts } = useNkampaEcommerce();
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
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [isPreparingRoute, setIsPreparingRoute] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  useEffect(() => {
    if (!storeDoc?.id) return;

    const reviewsQuery = query(
      collection(db, 'nkampa_store_reviews'),
      where('storeId', '==', storeDoc.id),
      limit(12)
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const nextReviews = snapshot.docs
          .map((reviewDoc) => {
            const data = reviewDoc.data() as any;
            return {
              id: reviewDoc.id,
              rating: Number(data.rating || 0),
              comment: data.comment || '',
              authorName: data.authorName || 'Client eNkamba',
              authorAvatar: data.authorAvatar || '',
              productName: data.productName || '',
              createdAt: data.createdAt,
            };
          })
          .sort((left, right) => {
            const leftTime = typeof left.createdAt?.toMillis === 'function' ? left.createdAt.toMillis() : Number(left.createdAt?.seconds || 0) * 1000;
            const rightTime = typeof right.createdAt?.toMillis === 'function' ? right.createdAt.toMillis() : Number(right.createdAt?.seconds || 0) * 1000;
            return rightTime - leftTime;
          });
        setSellerReviews(nextReviews);
      },
      (error) => {
        console.error('Erreur chargement avis boutique:', error);
      }
    );

    return () => unsubscribe();
  }, [storeDoc?.id]);

  const isOwner = !!user && !!storeDoc && user.uid === storeDoc.ownerId;
  const isApproved = storeDoc?.status === 'active' || storeDoc?.status === 'approved';

  const images: string[] = useMemo(() => {
    if (!product) return [];
    const list = Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : [];
    return list.slice(0, 8);
  }, [product]);

  const totalPrice = useMemo(() => priceInCDF * quantity, [priceInCDF, quantity]);
  const productRating = Number(product?.rating || product?.averageRating || storeDoc?.rating || 4.8);
  const productReviewCount = Number(product?.reviewsCount || product?.reviewCount || product?.commentsCount || 0);
  const productSalesCount = Number(product?.salesCount || product?.ordersCount || product?.soldCount || 0);
  const productStock = product?.stock ?? product?.availableStock ?? product?.quantityAvailable ?? product?.quantity ?? null;
  const deliveryDelay = product?.deliveryDelay || (product?.shippingDays ? `${product.shippingDays} jour(s)` : product?.fastDelivery ? '24h - 48h' : 'Selon la zone');
  const isSellerVerified = Boolean(storeDoc?.verified || storeDoc?.isVerified || storeDoc?.status === 'active' || storeDoc?.status === 'approved');
  const sellerTrustLevel = storeDoc?.trustLevel || storeDoc?.sellerLevel || (isSellerVerified ? 'Premium' : 'Standard');
  const deliverySuccessRate = Number(storeDoc?.deliverySuccessRate || storeDoc?.successRate || 96);
  const sellerReviewAverage = sellerReviews.length
    ? sellerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / sellerReviews.length
    : Number(storeDoc?.rating || storeDoc?.averageRating || productRating || 0);
  const sellerReviewCount = sellerReviews.length || Number(storeDoc?.reviewsCount || storeDoc?.reviewCount || 0);
  const isDigitalProduct =
    product?.listingType === 'digital' ||
    product?.storeCategory === 'digital' ||
    Boolean(product?.hasDigitalDelivery || product?.digitalDelivery?.files?.length);
  const similarOffers = useMemo(() => {
    if (!product) return [];
    const currentWords = new Set(
      `${product.name || ''} ${product.description || ''} ${product.storeCategory || ''} ${product.category || ''}`
        .toLowerCase()
        .split(/[^a-z0-9À-ÿ]+/i)
        .map((word) => word.trim())
        .filter((word) => word.length > 2)
    );
    const currentPrice = Number(product.price || 0);

    return [...(marketplaceProducts || [])]
      .filter((candidate: any) => candidate?.id && candidate.id !== product.id && (candidate.image || candidate.images?.[0]))
      .map((candidate: any) => {
        const candidateWords = `${candidate.name || ''} ${candidate.description || ''} ${candidate.storeCategory || ''} ${candidate.category || ''}`
          .toLowerCase()
          .split(/[^a-z0-9À-ÿ]+/i)
          .map((word) => word.trim())
          .filter((word) => word.length > 2);
        const wordScore = candidateWords.reduce((score, word) => score + (currentWords.has(word) ? 12 : 0), 0);
        const categoryScore =
          String(candidate.storeCategory || candidate.category || '').toLowerCase() === String(product.storeCategory || product.category || '').toLowerCase()
            ? 55
            : 0;
        const storeScore = candidate.storeId === product.storeId || candidate.storeSlug === product.storeSlug ? 20 : 0;
        const locationScore = candidate.location && product.location && String(candidate.location).toLowerCase() === String(product.location).toLowerCase() ? 12 : 0;
        const candidatePrice = Number(candidate.price || 0);
        const priceScore = currentPrice > 0 && candidatePrice > 0
          ? Math.max(0, 25 - Math.abs(candidatePrice - currentPrice) / Math.max(currentPrice, candidatePrice) * 25)
          : 0;
        const popularityScore =
          Math.log1p(Number(candidate.clickCount || candidate.views || 0)) * 3 +
          Math.log1p(Number(candidate.sold || candidate.salesCount || 0)) * 4 +
          Number(candidate.rating || 0);

        return {
          product: candidate,
          score: wordScore + categoryScore + storeScore + locationScore + priceScore + popularityScore,
        };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 10)
      .map((item) => item.product);
  }, [marketplaceProducts, product]);

  const resolveCurrentLocation = async () => {
    const storedLocation = getDashboardLocationOrDefault();

    return {
      latitude: storedLocation.latitude,
      longitude: storedLocation.longitude,
      address: storedLocation.label,
    };
  };

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
      className: 'bg-primary text-white border-none',
    });
  };

  const preparePurchase = async (): Promise<PendingPurchase> => {
    if (!product) {
      throw new Error('Produit indisponible');
    }

    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour acheter ce produit.',
        variant: 'destructive',
      });
      throw new Error('Utilisateur non authentifié');
    }

    if (isDigitalProduct) {
      return {
        shippingAddress: 'Livraison digitale - accès disponible après paiement',
        shippingPhone: user.phoneNumber || user.email || 'Compte eNkamba',
        deliveryOption: 'delivery',
      };
    }

    if (deliveryOption === 'delivery' && (!shippingAddress.trim() || !shippingPhone.trim())) {
      toast({
        title: 'Informations manquantes',
        description: "Renseignez l'adresse et le numéro de téléphone.",
        variant: 'destructive',
      });
      throw new Error('Informations de livraison incomplètes');
    }

    let routeContext: PickupRouteContext | undefined;

    let finalShippingAddress = shippingAddress.trim();
    let finalShippingPhone = shippingPhone.trim();

    if (deliveryOption === 'pickup') {
      setIsPreparingRoute(true);
      const currentLocation = await resolveCurrentLocation();
      routeContext = {
        enabled: true,
        storeLocationLabel: storeDoc?.location || storeDoc?.storeName || 'Boutique',
        buyerLocationLabel: currentLocation.address,
        buyerLatitude: currentLocation.latitude,
        buyerLongitude: currentLocation.longitude,
        destinationQuery: `${storeDoc?.storeName || 'Boutique'}, ${storeDoc?.location || ''}`.trim(),
        suggestedTransportMode: 'foot',
      };
      finalShippingAddress = `Retrait en boutique - ${routeContext.storeLocationLabel}`;
      finalShippingPhone = shippingPhone.trim() || user?.phoneNumber || user?.email || 'Retrait boutique';
    }

    return {
      shippingAddress: finalShippingAddress,
      shippingPhone: finalShippingPhone,
      deliveryOption,
      pickupRoute: routeContext,
    };
  };

  const finalizePurchase = async (purchase: PendingPurchase) => {
    if (!product) return;
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
        purchase.shippingAddress,
        purchase.shippingPhone,
        {
          deliveryOption: purchase.deliveryOption,
          pickupRoute: purchase.pickupRoute,
        }
      );

      toast({
        title: 'Commande confirmée',
        description: `Commande ${result.orderNumber} créée avec succès.`,
        className: 'bg-primary text-white border-none',
      });

      // Afficher le reçu de paiement
      setCompletedOrder(result.order);
      setConversationId(result.conversationId);
      setPendingPurchase(null);
      setShowOrderSummary(false);
      setShowReceipt(true);
    } catch (error: any) {
      toast({
        title: 'Paiement impossible',
        description: error?.message || 'Une erreur est survenue pendant le paiement.',
        variant: 'destructive',
      });
    } finally {
      setIsPreparingRoute(false);
      setIsBuying(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      const purchase = await preparePurchase();
      setPendingPurchase(purchase);
      setShowOrderSummary(true);
    } catch (error) {
      setIsPreparingRoute(false);
    }
  };

  const handleOpenPickupRoute = (order: any) => {
    setShowReceipt(false);
    router.push(`/dashboard/ugavi?orderId=${order.id}&source=nkampa`);
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
      let existingConversation: { id: string; [key: string]: any } | null = null;

      for (const conversationDoc of snapshot.docs) {
        const data = conversationDoc.data();
        if (data.participants?.includes(storeDoc.ownerId)) {
          existingConversation = { id: conversationDoc.id, ...data };
          break;
        }
      }

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
          className: 'bg-primary text-white border-none',
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
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-primary text-white border-none' });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-primary text-white border-none' });
      } catch {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de partager le lien.' });
      }
    }
  };

  const submitSellerReview = async () => {
    const comment = reviewComment.trim();

    if (!user?.uid) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour laisser une note.',
        variant: 'destructive',
      });
      return;
    }

    if (!storeDoc?.id || !product) return;

    if (reviewRating < 1 || reviewRating > 5 || comment.length < 3) {
      toast({
        title: 'Avis incomplet',
        description: 'Choisissez une note et écrivez un court commentaire.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'nkampa_store_reviews'), {
        storeId: storeDoc.id,
        storeSlug: slug,
        storeName: storeDoc.storeName || 'Boutique eNkamba',
        ownerId: storeDoc.ownerId || '',
        productId: product.id,
        productName: product.name || '',
        rating: reviewRating,
        comment,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Client eNkamba',
        authorAvatar: user.photoURL || '',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'nkampa_stores', storeDoc.id), {
        reviewsCount: increment(1),
        ratingTotal: increment(reviewRating),
        lastReviewAt: serverTimestamp(),
      }).catch(() => undefined);

      setReviewRating(5);
      setReviewComment('');
      toast({
        title: 'Avis publié',
        description: 'Votre note a été ajoutée à cette boutique.',
        className: 'bg-primary text-white border-none',
      });
    } catch (error) {
      console.error('Erreur publication avis boutique:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier votre avis pour le moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
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
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary text-white p-4 shadow-lg">
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
    <div className="min-h-screen max-w-full overflow-x-hidden bg-white pb-36">
      {/* Header vert eNkamba */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary text-white px-4 py-3 shadow-lg">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 transition-all hover:bg-white/30">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/90 px-3 py-2">
            <span className="text-xs text-gray-600 truncate">{product.name}</span>
          </div>

          <button onClick={share} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 transition-all hover:bg-white/30">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Image principale avec badge et favoris */}
      <div className="relative max-w-full overflow-hidden bg-gray-100">
        <div className="relative aspect-square w-full max-w-full overflow-hidden bg-gray-200">
          <div className="flex transition-transform duration-300 ease-out h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
            {images.map((src, idx) => (
              <div key={idx} className="relative min-w-full h-full flex-shrink-0">
                <Image
                  src={src}
                  alt={`${product.name} - Photo ${idx + 1}`}
                  fill
                  sizes="100vw"
                  quality={90}
                  priority={idx === 0}
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
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>eNkamba</span>
          </div>
          <div className="text-[10px] text-primary">QUALITÉ PRO</div>
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
          <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold">
            Photos {images.length}
          </button>
        </div>
      )}

      {/* Livraison rapide - Afficher seulement si info disponible */}
      {product.fastDelivery && (
        <div className="mx-4 mt-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-lg">🚚</span>
          <span className="text-sm font-semibold text-primary">Livraison rapide & sécurisée</span>
        </div>
      )}

      {/* Prix */}
      <div className="mx-4 mt-4 max-w-[calc(100vw-2rem)] space-y-2">
        {/* Afficher réduction seulement si disponible */}
        {product.discount && product.discount > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
            <p className="text-xs text-primary font-semibold">
              {product.discount}% de réduction
            </p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="break-words text-3xl font-black text-primary">{priceInCDF.toLocaleString()}</span>
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
      <div className="mx-4 mt-4 max-w-[calc(100vw-2rem)] space-y-3">
        <h2 className="break-words font-bold text-gray-900">{product.name}</h2>
        {product.description && (
          <p className="break-words text-sm text-gray-600">{product.description}</p>
        )}

        {/* Catégorie si disponible */}
        {(product.storeCategory || storeDoc.category) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Catégorie:</span>
            <span className="text-xs font-semibold text-primary">
              {product.storeCategory || storeDoc.category}
            </span>
          </div>
        )}
      </div>

      {/* Signaux marketplace essentiels */}
      <div className="mx-4 mt-4 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 hover:bg-amber-50">
            ★ {productRating.toFixed(1)}
            <span className="ml-1 font-medium text-amber-600">
              ({productReviewCount > 0 ? `${productReviewCount.toLocaleString('fr-FR')} avis` : 'avis vérifiés'})
            </span>
          </Badge>
          <Badge className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 hover:bg-blue-50">
            {productSalesCount > 0 ? `${productSalesCount.toLocaleString('fr-FR')} ventes` : 'Nouveau produit'}
          </Badge>
          {productStock !== null && (
            <Badge className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-50">
              Stock {Number(productStock).toLocaleString('fr-FR')}
            </Badge>
          )}
          {product.discount && product.discount > 0 && (
            <Badge className="rounded-full bg-red-50 px-2.5 py-1 text-red-700 hover:bg-red-50">
              Promo -{product.discount}%
            </Badge>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <div className="rounded-xl bg-primary/5 px-3 py-2 text-primary">
            <p className="font-black">{isSellerVerified ? 'Vendeur vérifié' : 'Vendeur contrôlé'}</p>
            <p className="mt-0.5 text-primary/75">Niveau {sellerTrustLevel}</p>
          </div>
          <div className="rounded-xl bg-primary/5 px-3 py-2 text-primary">
            <p className="font-black">Livré par eNKAMBA</p>
            <p className="mt-0.5 text-primary/75">{deliveryDelay}</p>
          </div>
          <div className="rounded-xl bg-orange-50 px-3 py-2 text-orange-800">
            <p className="font-black">Paiement sécurisé</p>
            <p className="mt-0.5 text-orange-700/75">eNkamba Pay</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-800">
            <p className="font-black">Livraison réussie</p>
            <p className="mt-0.5 text-slate-600">{deliverySuccessRate}%</p>
          </div>
        </div>
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
        className="mx-4 mt-4 w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/15 bg-gradient-to-r from-primary via-white to-orange-50 p-3 transition-colors hover:bg-gray-100"
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm">
              {storeDoc.logoUrl ? (
                <Image
                  src={storeDoc.logoUrl}
                  alt={storeDoc.storeName || 'Boutique'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-white font-bold">
                  {storeDoc.storeName?.charAt(0) || 'e'}
                </div>
              )}
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-gray-900">Boutique officielle</p>
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="truncate font-extrabold text-primary">{storeDoc.storeName}</p>
              {storeDoc.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{storeDoc.description}</p>
              )}
              {storeDoc.location && (
                <p className="mt-1 text-[11px] font-medium text-gray-500">{storeDoc.location}</p>
              )}
            </div>
          </div>
          <span className="text-lg">›</span>
        </div>
      </button>

      {/* Avis boutique / fournisseur */}
      <div className="mx-4 mt-4 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">Avis sur le vendeur</p>
            <p className="mt-1 text-xs text-slate-500">
              Notez la boutique, le fournisseur ou l’entreprise après votre expérience.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right">
            <div className="flex items-center justify-end gap-1 text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-black">{sellerReviewAverage.toFixed(1)}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-bold text-amber-700">
              {sellerReviewCount.toLocaleString('fr-FR')} avis
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <div className="mb-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= reviewRating;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className="rounded-full p-1 transition hover:bg-white"
                  aria-label={`Donner ${value} étoile${value > 1 ? 's' : ''}`}
                >
                  <Star className={`h-6 w-6 ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
          <Textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="Votre commentaire sur la boutique, le fournisseur ou l’entreprise..."
            className="min-h-20 resize-none rounded-2xl border-slate-200 bg-white text-sm focus-visible:ring-primary"
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              onClick={submitSellerReview}
              disabled={isSubmittingReview}
              className="rounded-full bg-primary px-5 text-white hover:bg-primary"
            >
              {isSubmittingReview ? 'Publication...' : 'Publier l’avis'}
            </Button>
          </div>
        </div>

        {sellerReviews.length > 0 && (
          <div className="mt-4 space-y-2">
            {sellerReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-slate-900">{review.authorName}</p>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-3.5 w-3.5 ${index < Math.round(review.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{review.comment}</p>
                {review.productName && (
                  <p className="mt-2 line-clamp-1 text-[10px] font-semibold text-slate-400">
                    Produit concerné : {review.productName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Option logistique */}
      <div className="mx-4 mt-4 max-w-[calc(100vw-2rem)] space-y-2">
        {isDigitalProduct ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                <DownloadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Accès digital après paiement</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Aucun transport physique n’est requis. Le téléchargement sera débloqué dans vos commandes dès que le paiement est confirmé.
                </p>
                {product.digitalProductTypeLabel && (
                  <p className="mt-2 text-xs font-bold text-primary">{product.digitalProductTypeLabel}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-primary/15 bg-primary/5/70 p-3">
              <p className="text-sm font-bold text-gray-900">Logistique / livraison</p>
              <p className="mt-1 text-xs text-gray-600">
                Choisissez la livraison classique ou le retrait avec itinéraire vers la boutique.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOption('delivery')}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    deliveryOption === 'delivery'
                      ? 'border-primary bg-white shadow-sm'
                      : 'border-gray-200 bg-white/80'
                  }`}
                >
                  <p className="font-semibold text-gray-900">Livraison</p>
                  <p className="text-xs text-gray-500">Le vendeur livre à votre adresse</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOption('pickup')}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    deliveryOption === 'pickup'
                      ? 'border-primary bg-white shadow-sm'
                      : 'border-gray-200 bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-gray-900">Retrait en boutique</p>
                  </div>
                  <p className="text-xs text-gray-500">Itinéraire disponible dans vos commandes</p>
                </button>
              </div>
            </div>

            {deliveryOption === 'delivery' ? (
              <input
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="📍 Adresse de livraison"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <div className="flex items-start gap-2">
                  <MapPinned className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Retrait choisi</p>
                    <p className="mt-1">
                      Après paiement, l’itinéraire vers <span className="font-bold">{storeDoc.storeName}</span> sera enregistré et disponible à tout moment dans vos commandes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <input
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              placeholder={deliveryOption === 'pickup' ? '📞 Téléphone de contact (optionnel)' : '📞 Téléphone'}
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </>
        )}
      </div>

      {similarOffers.length > 0 && (
        <section className="mx-4 mt-5 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Offres similaires</h2>
              <p className="text-xs font-semibold text-slate-500">
                Propositions calculées selon la catégorie, le contenu, le prix et la boutique.
              </p>
            </div>
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Recommandé</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {similarOffers.map((offer: any) => {
              const offerImage = offer.image || offer.images?.[0] || 'https://picsum.photos/seed/nkampa-similar/400/400';
              const offerHref = offer.storeSlug ? `/shop/${offer.storeSlug}/product/${offer.id}` : '/dashboard/nkampa';
              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => router.push(offerHref)}
                  className="w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    <Image
                      src={offerImage}
                      alt={offer.name || 'Offre similaire'}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1 p-2.5">
                    <p className="line-clamp-2 min-h-[2rem] text-[11px] font-bold leading-4 text-slate-900">{offer.name}</p>
                    <p className="truncate text-sm font-black text-primary">
                      {Number(offer.price || 0).toLocaleString('fr-FR')} {offer.currency || 'CDF'}
                    </p>
                    <p className="line-clamp-1 text-[10px] font-semibold text-slate-500">
                      {offer.storeName || offer.sellerName || 'Boutique eNkamba'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Boutons d'action flottants */}
      <div className="fixed bottom-0 left-0 right-0 z-30 w-full max-w-full space-y-2 overflow-hidden border-t border-gray-200 bg-white p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddToCart}
            className="flex min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-2 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ShoppingCart className="h-5 w-5 shrink-0" />
            <span className="truncate">Ajouter au panier</span>
          </button>
          <button 
            onClick={handleChat}
            className="flex min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-2 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">Chat</span>
          </button>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={isBuying || isPreparingRoute}
          className="flex w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary disabled:opacity-50"
        >
          {isBuying || isPreparingRoute ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isPreparingRoute ? 'Préparation de l’itinéraire...' : 'Traitement...'}
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
      <div className="mx-4 mb-32 mt-4 flex max-w-[calc(100vw-2rem)] flex-wrap gap-2 text-xs text-gray-600">
        <span>✓ Produits de qualité</span>
        <span>✓ Paiement sécurisé</span>
        {product.warranty && <span>✓ Garantie {product.warranty}</span>}
        {product.returns && <span>✓ Retours acceptés</span>}
      </div>

      {/* Reçu de paiement */}
      <Dialog open={showOrderSummary} onOpenChange={setShowOrderSummary}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto overflow-x-hidden rounded-3xl border-0 p-0 sm:max-w-lg">
          <div className="bg-gradient-to-r from-primary via-primary to-primary px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Confirmer la commande</DialogTitle>
              <DialogDescription className="text-white/85">
                Vérifiez les détails puis confirmez le paiement avec votre PIN eNkambaPay.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Produit</p>
              <p className="mt-2 text-lg font-black text-slate-900">{product.name}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Quantité</p>
                  <p className="font-bold text-slate-900">{quantity}</p>
                </div>
                <div>
                  <p className="text-slate-500">Montant total</p>
                  <p className="font-bold text-primary">{totalPrice.toLocaleString()} CDF</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">Mode choisi</p>
              <p className="mt-1 text-sm text-slate-600">
                {isDigitalProduct
                  ? 'Accès digital après paiement'
                  : pendingPurchase?.deliveryOption === 'pickup'
                    ? 'Retrait en boutique avec itinéraire'
                    : 'Livraison à domicile'}
              </p>
              <p className="mt-3 text-xs text-slate-500">Adresse / destination</p>
              <p className="text-sm font-semibold text-slate-900">{pendingPurchase?.shippingAddress}</p>
              <p className="mt-3 text-xs text-slate-500">Téléphone</p>
              <p className="text-sm font-semibold text-slate-900">{pendingPurchase?.shippingPhone}</p>
              {pendingPurchase?.pickupRoute?.enabled && (
                <>
                  <p className="mt-3 text-xs text-slate-500">Départ actuel</p>
                  <p className="text-sm font-semibold text-slate-900">{pendingPurchase.pickupRoute.buyerLocationLabel}</p>
                  <p className="mt-3 text-xs text-slate-500">Boutique</p>
                  <p className="text-sm font-semibold text-slate-900">{pendingPurchase.pickupRoute.storeLocationLabel}</p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-900">Paiement sécurisé</p>
              <p className="mt-1 text-sm text-orange-800">
                Votre solde actuel est de {balance.toLocaleString()} CDF. Le paiement sera confirmé avec votre PIN eNkambaPay.
              </p>
            </div>
          </div>
          <DialogFooter className="border-t bg-slate-50 px-6 py-4">
            <div className="grid w-full grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="min-w-0"
                onClick={() => setShowOrderSummary(false)}
              >
                Modifier
              </Button>
              <Button
                type="button"
                className="min-w-0 bg-primary hover:bg-primary"
                onClick={() => setShowPinDialog(true)}
                disabled={!pendingPurchase}
              >
                Confirmer le paiement
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinVerification
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={() => {
          setShowPinDialog(false);
          if (pendingPurchase) {
            void finalizePurchase(pendingPurchase);
          }
        }}
        paymentDetails={{
          recipient: storeDoc.storeName || product.sellerName || 'Boutique Nkampa',
          amount: totalPrice.toLocaleString(),
          currency: 'CDF',
        }}
      />

      {showReceipt && completedOrder && (
        <OrderReceipt
          order={completedOrder}
          primaryActionLabel={
            completedOrder?.digitalDelivery?.files?.length
              ? 'Accéder au téléchargement'
              : completedOrder?.pickupRoute?.enabled
                ? 'Aller à la boutique'
                : undefined
          }
          onPrimaryAction={
            completedOrder?.digitalDelivery?.files?.length
              ? () => router.push(`/dashboard/nkampa/orders/${completedOrder.id}/digital`)
              : completedOrder?.pickupRoute?.enabled
              ? () => handleOpenPickupRoute(completedOrder)
              : undefined
          }
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
