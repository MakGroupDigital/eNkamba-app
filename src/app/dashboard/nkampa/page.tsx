'use client';

import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Mic, X, Loader2, ArrowLeft, ShoppingCart, Camera } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AllCategoriesIcon,
  SuppliersIcon,
  WholesalersIcon,
  RetailersIcon,
  ProducersIcon,
  DigitalProductsIcon,
  TrackingIcon,
  ProductIcon,
  ServiceIcon,
} from '@/components/icons/nkampa-category-icons';
import {
  LocationIcon,
  StarIcon,
  MOQIcon,
  PriceIcon,
} from '@/components/icons/nkampa-ecommerce-icons';
import { convertToCDFSync } from '@/lib/currency-converter';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNkampaCart } from '@/hooks/useNkampaCart';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { FloatingCart } from '@/components/nkampa/FloatingCart';
import {
  NkampaNavFavoritesIcon,
  NkampaNavOrdersIcon,
  NkampaNavSellerIcon,
  NkampaNavShopIcon,
} from '@/components/icons/nkampa-nav-icons';
import { useNkampaStore } from '@/hooks/useNkampaStore';
import { useNkampaStores } from '@/hooks/useNkampaStores';

// Catégories principales avec icônes modernes
const MAIN_CATEGORIES = [
  { id: 'all', label: 'Tout', icon: AllCategoriesIcon, type: null },
  { id: 'produit', label: 'Produit', icon: ProductIcon, type: 'product' },
  { id: 'service', label: 'Service', icon: ServiceIcon, type: 'service' },
  { id: 'digital', label: 'Digital', icon: DigitalProductsIcon, type: 'digital' },
  { id: 'suppliers', label: 'Fournisseurs', icon: SuppliersIcon, type: 'supplier' },
  { id: 'wholesalers', label: 'Grossistes', icon: WholesalersIcon, type: 'wholesaler' },
  { id: 'retail', label: 'Détaillants', icon: RetailersIcon, type: 'retailer' },
  { id: 'producers', label: 'Producteurs', icon: ProducersIcon, type: 'producer' },
  { id: 'tracking', label: 'Suivi colis', icon: TrackingIcon, href: '/dashboard/package-tracking' },
];

type SubcategoryOption = { id: string; label: string; icon: string };

// Sous-catégories Produit
const PRODUCT_SUBCATEGORIES = [
  { id: 'alimentaire', label: 'Alimentaire', icon: '🍎' },
  { id: 'bio', label: 'Bio', icon: '🌿' },
  { id: 'electro', label: 'Électroménager', icon: '⚡' },
  { id: 'mode', label: 'Mode', icon: '👗' },
  { id: 'accessoires', label: 'Accessoires', icon: '👜' },
  { id: 'tech', label: 'Technologie', icon: '💻' },
  { id: 'maison', label: 'Maison & Décor', icon: '🏠' },
  { id: 'beaute', label: 'Beauté & Santé', icon: '💄' },
  { id: 'sports', label: 'Sports & Loisirs', icon: '⚽' },
];

// Sous-catégories Service
const SERVICE_SUBCATEGORIES: SubcategoryOption[] = [
  { id: 'livraison', label: 'Livraison', icon: '🚚' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'reparation', label: 'Réparation', icon: '🛠️' },
  { id: 'installation', label: 'Installation', icon: '🧰' },
  { id: 'menage', label: 'Ménage', icon: '🧹' },
  { id: 'formation', label: 'Formation', icon: '🎓' },
  { id: 'sante', label: 'Santé', icon: '🩺' },
  { id: 'event', label: 'Événementiel', icon: '🎉' },
];

// Sous-catégories Digital
const DIGITAL_SUBCATEGORIES: SubcategoryOption[] = [
  { id: 'templates', label: 'Templates', icon: '🧩' },
  { id: 'cours', label: 'Cours', icon: '📚' },
  { id: 'logiciels', label: 'Logiciels', icon: '💾' },
  { id: 'ebooks', label: 'eBooks', icon: '📖' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
];

// Sous-catégories Partenaires (Fournisseurs/Grossistes/Détaillants/Producteurs)
const SUPPLIER_SUBCATEGORIES: SubcategoryOption[] = [
  { id: 'alimentaire', label: 'Alimentaire', icon: '🍎' },
  { id: 'bio', label: 'Bio', icon: '🌿' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'mode', label: 'Mode', icon: '👗' },
  { id: 'maison', label: 'Maison', icon: '🏠' },
  { id: 'beaute', label: 'Beauté', icon: '💄' },
];

const WHOLESALER_SUBCATEGORIES: SubcategoryOption[] = [
  { id: 'alimentaire', label: 'Alimentaire', icon: '🍎' },
  { id: 'electro', label: 'Électro', icon: '⚡' },
  { id: 'mode', label: 'Textile', icon: '👕' },
  { id: 'construction', label: 'Construction', icon: '🧱' },
];

const RETAILER_SUBCATEGORIES: SubcategoryOption[] = [
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'mode', label: 'Mode', icon: '👗' },
  { id: 'maison', label: 'Maison', icon: '🏠' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
];

const PRODUCER_SUBCATEGORIES: SubcategoryOption[] = [
  { id: 'bio', label: 'Bio', icon: '🌿' },
  { id: 'alimentaire', label: 'Agro', icon: '🌾' },
  { id: 'artisanat', label: 'Artisanat', icon: '🧵' },
];

const NKAMPA_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#32BB78"/><stop offset="1" stop-color="#32BB78"/></linearGradient></defs><rect width="900" height="420" fill="url(#g)"/><circle cx="720" cy="70" r="180" fill="#fff" opacity=".12"/><circle cx="120" cy="360" r="150" fill="#FF8C00" opacity=".22"/></svg>`
  );

function optimizeMarketplaceImage(src?: string, width = 420, height = 420) {
  if (!src) return NKAMPA_IMAGE_PLACEHOLDER;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  try {
    const url = new URL(src);

    if (url.hostname.includes('res.cloudinary.com') && url.pathname.includes('/image/upload/')) {
      const transform = `f_auto,q_auto:eco,c_fill,g_auto,w_${width},h_${height},dpr_auto`;
      url.pathname = url.pathname.replace('/image/upload/', `/image/upload/${transform}/`);
      return url.toString();
    }

    if (url.hostname === 'picsum.photos') {
      const seedMatch = url.pathname.match(/^\/seed\/([^/]+)/);
      if (seedMatch?.[1]) {
        return `https://picsum.photos/seed/${seedMatch[1]}/${width}/${height}`;
      }
      return `https://picsum.photos/${width}/${height}`;
    }

    return src;
  } catch {
    return src;
  }
}

type ImageSignature = {
  r: number;
  g: number;
  b: number;
};

function getProductImageSource(product: any) {
  return product?.image || product?.images?.[0] || '';
}

function colorDistance(left: ImageSignature, right: ImageSignature) {
  return Math.sqrt(
    (left.r - right.r) ** 2 +
    (left.g - right.g) ** 2 +
    (left.b - right.b) ** 2
  );
}

function computeImageSignatureFromSource(src: string): Promise<ImageSignature | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3];
          if (alpha < 40) continue;
          r += pixels[index];
          g += pixels[index + 1];
          b += pixels[index + 2];
          count += 1;
        }

        resolve(count ? { r: r / count, g: g / count, b: b / count } : null);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function computeImageSignatureFromFile(file: File) {
  return new Promise<ImageSignature | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        resolve(null);
        return;
      }
      void computeImageSignatureFromSource(reader.result).then(resolve);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

const SupplierCard = memo(function SupplierCard({ supplier }: { supplier: any }) {
  const imageUrl = optimizeMarketplaceImage(supplier.logoUrl || supplier.coverUrl || 'https://picsum.photos/seed/store/300/300');

  return (
    <Link href={`/shop/${supplier.slug || ''}`} className={!supplier.slug ? 'pointer-events-none opacity-60' : ''}>
      <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={imageUrl}
            alt={supplier.storeName || 'Boutique'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
          />
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
            {supplier.storeName || 'Boutique'}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <LocationIcon className="w-3 h-3" />
            <span>{supplier.location || '—'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

const ProductCard = memo(function ProductCard({ product }: { product: any }) {
  const priceInCDF = Math.round(
    convertToCDFSync(Number(product.price || 0), product.currency || 'CDF')
  );
  const imageUrl = optimizeMarketplaceImage(product.image || product.images?.[0] || 'https://picsum.photos/seed/product/300/300');

  return (
    <Link href={product?.storeSlug ? `/shop/${product.storeSlug}/product/${product.id}` : `/dashboard/nkampa`} className={!product?.storeSlug ? 'pointer-events-none opacity-60' : ''}>
      <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name || 'Produit'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
          />
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            <PriceIcon className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold text-primary">
              {priceInCDF.toLocaleString()}
            </span>
            <span className="text-xs text-gray-600">CDF</span>
          </div>
          {product.currency && product.currency !== 'CDF' && product.currency !== 'FC' && (
            <p className="text-xs text-gray-500">
              Prix original: {Number(product.price || 0).toLocaleString()} {product.currency}
            </p>
          )}
          {product.moq && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MOQIcon className="w-3 h-3" />
              <span>MOQ: {product.moq}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <LocationIcon className="w-3 h-3" />
            <span>{product.location || '—'}</span>
          </div>
          {product.rating && (
            <div className="flex items-center gap-1 text-xs">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {product.reviews !== undefined && (
                <span className="text-gray-600">({product.reviews})</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

export default function NkampaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();
  const { products: firestoreProducts, isLoading: productsLoading, buyProduct } = useNkampaEcommerce();
  const { stores: publicStores } = useNkampaStores({ statuses: ['active', 'approved'] });
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  const { cart, isOpen, setIsOpen, addToCart, removeFromCart, updateQuantity, total, itemCount } = useNkampaCart();
  const { store: myStore, hasChecked: hasStoreChecked } = useNkampaStore(user?.uid);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const photoSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [isPhotoSearching, setIsPhotoSearching] = useState(false);
  const [photoSearchPreview, setPhotoSearchPreview] = useState('');
  const [photoSearchResultIds, setPhotoSearchResultIds] = useState<string[]>([]);
  const [photoSearchLabel, setPhotoSearchLabel] = useState('');

  const clearPhotoSearch = () => {
    if (photoSearchPreview) URL.revokeObjectURL(photoSearchPreview);
    setPhotoSearchPreview('');
    setPhotoSearchResultIds([]);
    setPhotoSearchLabel('');
    if (photoSearchInputRef.current) photoSearchInputRef.current.value = '';
  };

  const handleTextSearchChange = (value: string) => {
    if (photoSearchPreview || photoSearchResultIds.length) {
      clearPhotoSearch();
    }
    setSearchQuery(value);
  };

  useEffect(() => {
    return () => {
      if (photoSearchPreview) URL.revokeObjectURL(photoSearchPreview);
    };
  }, [photoSearchPreview]);

  // Fonction de recherche vocale
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Non supporté',
        description: 'La recherche vocale n\'est pas supportée sur ce navigateur',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: '🎤 Écoute en cours...',
        description: 'Parlez maintenant',
        className: 'bg-primary text-white border-none',
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      // Réinitialiser les filtres pour voir tous les résultats
      setSelectedMainCategory(null);
      setSelectedSubcategory(null);
      clearPhotoSearch();
      
      // Définir la recherche
      setSearchQuery(transcript);
      
      // Attendre que le filtrage se fasse et afficher le nombre de résultats
      setTimeout(() => {
        const resultsSection = document.querySelector('[data-results-section]');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Compter les résultats filtrés
        const results = sortedProducts.filter((p: any) =>
          (p?.name || '').toLowerCase().includes(transcript.toLowerCase())
        );
        
        toast({
          title: '✅ Recherche effectuée',
          description: `"${transcript}" - ${results.length} résultat(s) trouvé(s)`,
          className: 'bg-primary text-white border-none',
        });
      }, 300);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error('Erreur reconnaissance vocale:', event.error);
      toast({
        title: 'Erreur',
        description: event.error === 'no-speech' 
          ? 'Aucune parole détectée. Réessayez.' 
          : 'Erreur lors de la reconnaissance vocale',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Erreur démarrage reconnaissance:', error);
      setIsListening(false);
      toast({
        title: 'Erreur',
        description: 'Impossible de démarrer la reconnaissance vocale',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoSearch = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Image requise',
        description: 'Choisissez une photo du produit ou de l’article.',
        variant: 'destructive',
      });
      return;
    }

    setIsPhotoSearching(true);
    setSelectedMainCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setPhotoSearchResultIds([]);
    setPhotoSearchLabel(file.name && !file.name.startsWith('image') ? file.name.replace(/\.[^.]+$/, '') : 'Photo produit');
    setPhotoSearchPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });

    try {
      const fileSignature = await computeImageSignatureFromFile(file);
      const filenameTokens = file.name
        .replace(/\.[^.]+$/, '')
        .toLowerCase()
        .split(/[^a-z0-9à-ÿ]+/i)
        .filter((token) => token.length >= 3 && !['image', 'photo', 'product', 'produit'].includes(token));

      const scoredProducts: Array<{ id: string; score: number }> = [];

      for (const product of sortedProducts.slice(0, 80)) {
        const productId = String(product?.id || '');
        if (!productId) continue;

        let score = 0;
        const searchableText = [
          product?.name,
          product?.description,
          product?.storeCategory,
          product?.storeSubcategory,
          product?.sellerName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (filenameTokens.some((token) => searchableText.includes(token))) {
          score += 140;
        }

        if (fileSignature) {
          const productSignature = await computeImageSignatureFromSource(getProductImageSource(product));
          if (productSignature) {
            score += Math.max(0, 180 - colorDistance(fileSignature, productSignature));
          }
        }

        if (score > 45) scoredProducts.push({ id: productId, score });
      }

      const matches = scoredProducts
        .sort((left, right) => right.score - left.score)
        .slice(0, 24)
        .map((item) => item.id);

      setPhotoSearchResultIds(matches);

      const resultsSection = document.querySelector('[data-results-section]');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      toast({
        title: matches.length ? 'Recherche par photo effectuée' : 'Aucun produit similaire',
        description: matches.length
          ? `${matches.length} article(s) proche(s) de la photo.`
          : 'Essayez une photo plus claire ou un autre angle du produit.',
        className: matches.length ? 'bg-primary text-white border-none' : undefined,
        variant: matches.length ? undefined : 'destructive',
      });
    } catch (error) {
      console.error('Erreur recherche par photo:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d’analyser cette photo.',
        variant: 'destructive',
      });
    } finally {
      setIsPhotoSearching(false);
      if (photoSearchInputRef.current) photoSearchInputRef.current.value = '';
    }
  };

  const activeMainCategory = selectedMainCategory
    ? MAIN_CATEGORIES.find((c) => c.id === selectedMainCategory) || null
    : null;

  const isSupplierView = ['suppliers', 'wholesalers', 'retail', 'producers'].includes(selectedMainCategory || '');

  const getSubcategoriesForMain = (mainId: string | null): SubcategoryOption[] => {
    if (!mainId) return [];
    switch (mainId) {
      case 'produit':
        return PRODUCT_SUBCATEGORIES;
      case 'service':
        return SERVICE_SUBCATEGORIES;
      case 'digital':
        return DIGITAL_SUBCATEGORIES;
      case 'suppliers':
        return SUPPLIER_SUBCATEGORIES;
      case 'wholesalers':
        return WHOLESALER_SUBCATEGORIES;
      case 'retail':
        return RETAILER_SUBCATEGORIES;
      case 'producers':
        return PRODUCER_SUBCATEGORIES;
      default:
        return [];
    }
  };

  const activeSubcategories = getSubcategoriesForMain(selectedMainCategory);

  const sortedProducts = useMemo(() => {
    const getCreatedAtMs = (product: any) => product?.createdAt?.toMillis?.() || 0;
    const getPopularityScore = (product: any) => {
      const clicks = Number(product?.clickCount ?? product?.viewCount ?? product?.views ?? 0);
      const sold = Number(product?.sold ?? 0);
      const reviews = Number(product?.reviews ?? 0);
      const rating = Number(product?.rating ?? 0);
      return clicks * 1000000 + sold * 10000 + reviews * 100 + Math.round(rating * 10);
    };

    return [...(firestoreProducts || [])].sort((left: any, right: any) => {
      const popularityDiff = getPopularityScore(right) - getPopularityScore(left);
      if (popularityDiff !== 0) return popularityDiff;
      return getCreatedAtMs(right) - getCreatedAtMs(left);
    });
  }, [firestoreProducts]);

  const bannerProducts = useMemo(() => sortedProducts.slice(0, 6), [sortedProducts]);
  const activeBannerProduct = bannerProducts[bannerIndex] || null;
  const activeBannerImage = useMemo(
    () =>
      optimizeMarketplaceImage(
        activeBannerProduct?.image || activeBannerProduct?.images?.[0] || 'https://picsum.photos/seed/banner/900/420',
        900,
        420
      ),
    [activeBannerProduct?.image, activeBannerProduct?.images]
  );

  // Rotation automatique des bannières (uniquement si on a des produits)
  // Rotation automatique des bannières (uniquement si on a des produits)
  useEffect(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    if (!bannerProducts || bannerProducts.length <= 1) {
      setBannerIndex(0);
      return;
    }

    // Réinitialiser l'index si hors limites
    setBannerIndex((current) => {
      if (current >= bannerProducts.length) return 0;
      return current;
    });

    bannerTimerRef.current = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerProducts.length);
    }, 5000);

    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, [bannerProducts.length]);

  // Filtrer les produits selon la catégorie et sous-catégorie
  const filteredProducts = useMemo(() => {
    let filtered: any[] = sortedProducts as any[];

    if (activeMainCategory?.type && !isSupplierView) {
      if (activeMainCategory.id === 'digital') {
        const allowed = new Set(DIGITAL_SUBCATEGORIES.map((d) => d.id));
        filtered = filtered.filter((p) => {
          const t = (p?.listingType || p?.type || '').toString();
          const cat = (p?.storeCategory || '').toString();
          const sub = (p?.storeSubcategory || p?.subcategory || '').toString();
          return t === 'digital' || cat === 'digital' || allowed.has(sub);
        });
      } else {
        filtered = filtered.filter((p) => {
          const t = (p?.listingType || p?.type || '').toString();
          return t === activeMainCategory.type;
        });
      }
    }

    if (selectedSubcategory) {
      filtered = filtered.filter((p) => {
        const sub = (p?.storeSubcategory || p?.subcategory || '').toString();
        const cat = (p?.storeCategory || '').toString();
        return sub === selectedSubcategory || cat === selectedSubcategory;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        (p?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (photoSearchPreview) {
      const visualMatches = new Set(photoSearchResultIds);
      filtered = filtered.filter((p) => visualMatches.has(String(p?.id || '')));
      filtered = [...filtered].sort((left, right) => photoSearchResultIds.indexOf(String(left?.id || '')) - photoSearchResultIds.indexOf(String(right?.id || '')));
    }

    return filtered;
  }, [sortedProducts, activeMainCategory?.type, activeMainCategory?.id, isSupplierView, selectedSubcategory, searchQuery, photoSearchResultIds, photoSearchPreview]);

  // Filtrer les fournisseurs selon la catégorie
  const filteredSuppliers = useMemo(() => {
    let filtered: any[] = (publicStores || []) as any[];

    if (activeMainCategory?.type && isSupplierView) {
      filtered = filtered.filter((s) => Array.isArray(s.businessRoles) && s.businessRoles.includes(activeMainCategory.type));
    }

    if (selectedSubcategory) {
      filtered = filtered.filter((s) => (s?.category || '') === selectedSubcategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((s) =>
        (s?.storeName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [publicStores, activeMainCategory?.type, isSupplierView, selectedSubcategory, searchQuery]);

  // Déterminer si on affiche les fournisseurs ou les produits
  const categoryLabel = MAIN_CATEGORIES.find((c) => c.id === selectedMainCategory)?.label || 'Tous les produits';
  const hasActiveProductSearch = Boolean(searchQuery || photoSearchPreview);
  const visibleDefaultProducts = hasActiveProductSearch ? filteredProducts : sortedProducts;
  const productResultsTitle = photoSearchPreview
    ? 'Résultats par photo'
    : searchQuery
      ? `Résultats pour "${searchQuery}"`
      : 'Tous les produits';

  const handleCheckoutFromCart = () => {
    if (cart.length === 0) {
      toast({
        title: 'Panier vide',
        description: 'Ajoutez des produits avant de passer la commande',
        variant: 'destructive',
      });
      return;
    }
    setShowCheckout(true);
    setIsOpen(false);
  };

  const handleProcessPayment = async () => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour acheter',
        variant: 'destructive',
      });
      return;
    }

    if (!shippingAddress || !shippingPhone) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir l\'adresse et le téléphone',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await buyProduct(
        selectedProduct,
        quantity,
        shippingAddress,
        shippingPhone
      );

      toast({
        title: 'Commande confirmée',
        description: `Commande ${result.orderId} créée avec succès`,
      });

      setShowCheckout(false);
      setSelectedProduct(null);
      setShippingAddress('');
      setShippingPhone('');

      // Rediriger vers le chat avec le vendeur
      router.push(`/dashboard/miyiki-chat/${result.conversationId}`);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du paiement',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.12),transparent_35%),linear-gradient(180deg,rgba(50,187,120,0.05)_0%,rgba(50,187,120,0.08)_52%,rgba(50,187,120,0.04)_100%)]">
      {/* Header avec fond vert et bordures arrondies en haut */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary via-primary to-primary backdrop-blur-xl shadow-lg shadow-primary/20 rounded-b-[32px] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <input
            ref={photoSearchInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handlePhotoSearch(event.target.files?.[0] || null)}
          />
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16 pt-2">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 rounded-xl bg-white shadow-lg overflow-hidden ring-2 ring-white/30">
                  <Image
                    src="/enkamba-logo.png"
                    alt="eNkamba"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-black text-white leading-none">
                    eNkamba Shop
                  </h1>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Commerce vivant
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Search + Cart */}
            <div className="flex items-center gap-3">
              {/* Search Bar - Desktop */}
              <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 min-w-[280px] transition-all focus-within:bg-white/30 focus-within:ring-2 focus-within:ring-white/50 focus-within:shadow-lg border border-white/30">
                <Search className="h-4 w-4 text-white" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => handleTextSearchChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
                />
                <button
                  type="button"
                  onClick={() => photoSearchInputRef.current?.click()}
                  disabled={isPhotoSearching}
                  className={`relative rounded-lg p-1.5 transition-all ${
                    photoSearchPreview
                      ? 'bg-white text-primary'
                      : 'text-white hover:bg-white/20'
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                  aria-label="Rechercher par photo"
                  title="Rechercher par photo"
                >
                  {isPhotoSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`rounded-lg p-1.5 transition-all ${
                    isListening
                      ? 'bg-red-500 text-white'
                      : 'text-white hover:bg-white/20'
                  }`}
                  aria-label="Recherche vocale"
                >
                  <Mic className="h-4 w-4" />
                  {isListening && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-red-400" />
                  )}
                </button>
              </div>

              {/* Cart Button */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-lg animate-bounce ring-2 ring-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {[
              { href: '/dashboard/nkampa', label: 'Boutique', icon: NkampaNavShopIcon },
              { href: '/dashboard/nkampa/orders', label: 'Commandes', icon: NkampaNavOrdersIcon },
              { href: '/dashboard/nkampa/favorites', label: 'Favoris', icon: NkampaNavFavoritesIcon },
              hasStoreChecked && myStore
                ? { href: '/dashboard/nkampa/store/dashboard', label: 'Ma boutique', icon: NkampaNavSellerIcon }
                : { href: '/dashboard/nkampa/store', label: 'Créer boutique', icon: NkampaNavSellerIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative group"
                >
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-primary shadow-md'
                      : 'text-white hover:bg-white/20 border border-transparent hover:border-white/30'
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute -bottom-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-white shadow-lg shadow-white/50" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden pb-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all focus-within:bg-white/30 focus-within:ring-2 focus-within:ring-white/50 focus-within:shadow-lg border border-white/30">
              <Search className="h-4 w-4 text-white" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => handleTextSearchChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
              />
              <button
                type="button"
                onClick={() => photoSearchInputRef.current?.click()}
                disabled={isPhotoSearching}
                className={`relative rounded-lg p-1.5 transition-all ${
                  photoSearchPreview
                    ? 'bg-white text-primary'
                    : 'text-white hover:bg-white/20'
                } disabled:cursor-not-allowed disabled:opacity-70`}
                aria-label="Rechercher par photo"
                title="Rechercher par photo"
              >
                {isPhotoSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`relative rounded-lg p-1.5 transition-all ${
                  isListening
                    ? 'bg-red-500 text-white'
                    : 'text-white hover:bg-white/20'
                }`}
                aria-label="Recherche vocale"
              >
                <Mic className="h-4 w-4" />
                {isListening && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-red-400" />
                )}
              </button>
            </div>
            {photoSearchPreview && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/20 p-2 text-xs font-semibold text-white">
                <span
                  role="img"
                  aria-label="Recherche photo"
                  className="h-8 w-8 rounded-lg bg-cover bg-center ring-1 ring-white/40"
                  style={{ backgroundImage: `url(${photoSearchPreview})` }}
                />
                <span className="min-w-0 flex-1 truncate">{photoSearchLabel || 'Recherche par photo'}</span>
                <button
                  type="button"
                  onClick={clearPhotoSearch}
                  className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
                  aria-label="Effacer la recherche photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="space-y-6 pb-8">
        {/* Catégories principales */}
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {MAIN_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isActive = selectedMainCategory === cat.id;
              const content = cat.href ? (
                <div className="flex-shrink-0 flex flex-col items-center gap-2 transition-all">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md bg-white text-primary hover:shadow-lg hover:scale-105`}
                  >
                    <IconComponent className="text-primary" size={32} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center max-w-[70px]">
                    {cat.label}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (cat.id === 'all') {
                      setSelectedMainCategory(null);
                      setSelectedSubcategory(null);
                    } else {
                      setSelectedMainCategory(isActive ? null : cat.id);
                      setSelectedSubcategory(null);
                    }
                  }}
                  className="flex-shrink-0 flex flex-col items-center gap-2 transition-all"
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
                      isActive || (cat.id === 'all' && !selectedMainCategory)
                        ? 'bg-primary text-white shadow-lg scale-110'
                        : 'bg-white text-primary hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    <IconComponent className={`${isActive || (cat.id === 'all' && !selectedMainCategory) ? 'text-white' : 'text-primary'}`} size={32} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center max-w-[70px]">
                    {cat.label}
                  </span>
                </button>
              );

              if (cat.href) {
                return (
                  <Link key={cat.id} href={cat.href}>
                    {content}
                  </Link>
                );
              }
              return <div key={cat.id}>{content}</div>;
            })}
          </div>
        </div>

        {/* Filtres par sous-catégories */}
        {selectedMainCategory && activeSubcategories.length > 0 && (
          <div className="px-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {isSupplierView ? 'Filtrer par catégorie:' : 'Filtrer par type:'}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSubcategory === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tous
              </button>
              {activeSubcategories.map((subcat) => (
                <button
                  key={subcat.id}
                  onClick={() => setSelectedSubcategory(subcat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedSubcategory === subcat.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{subcat.icon}</span>
                  {subcat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section Fournisseurs */}
        {isSupplierView && selectedMainCategory && (
          <div className="px-4" data-results-section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{categoryLabel}</h2>
                <p className="text-xs text-gray-600">
                  {filteredSuppliers.length} fournisseur{filteredSuppliers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {filteredSuppliers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun fournisseur trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Section Produits filtrés */}
        {!isSupplierView && selectedMainCategory && (
          <div className="px-4" data-results-section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{categoryLabel}</h2>
                <p className="text-xs text-gray-600">
                  {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun produit trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Section par défaut - Tous les produits */}
        {!selectedMainCategory && (
          <>
            {/* Bannière promotionnelle moderne et immersive */}
            <div className="relative h-56 mx-4 mt-4 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              {/* Image de fond avec overlay subtil */}
              <div className="absolute inset-0">
                {bannerProducts.length > 0 && (
                  <Image
                    src={activeBannerImage}
                    alt={activeBannerProduct?.name || 'Bannière Nkampa'}
                    fill
                    className="object-cover"
                    priority={bannerIndex === 0}
                    sizes="(max-width: 768px) calc(100vw - 32px), 900px"
                  />
                )}
              </div>
              
              {/* Gradient overlay moderne - plus subtil */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent" />
              
              {/* Effet de lumière futuriste */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.3),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(50,187,120,0.2),transparent_50%)]" />
              
              {/* Contenu */}
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Badge en haut */}
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary rounded-full blur opacity-75" />
                    <Badge className="relative bg-white/95 text-primary border-0 font-bold shadow-lg backdrop-blur-sm">
                      🌟 Tendance
                    </Badge>
                  </div>
                </div>
                
                {/* Informations produit en bas */}
                <div className="space-y-2">
                  {bannerProducts.length > 0 ? (
                    <>
                      <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                        <p className="text-xs font-semibold text-white/90">Produit vedette</p>
                      </div>
                      <h2 className="text-white font-black text-2xl drop-shadow-lg line-clamp-2">
                        {activeBannerProduct?.name}
                      </h2>
                      <div className="flex items-baseline gap-2">
                        <p className="text-white font-black text-3xl drop-shadow-lg">
                          {Number(activeBannerProduct?.price || 0).toLocaleString()}
                        </p>
                        <p className="text-white/90 font-semibold text-lg drop-shadow">
                          {activeBannerProduct?.currency || 'CDF'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-white font-black text-2xl drop-shadow-lg">
                        Découvrez Nkampa
                      </h2>
                      <p className="text-white/90 text-sm drop-shadow">
                        Votre marketplace de confiance
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Indicateurs de bannière modernes */}
              {bannerProducts.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {bannerProducts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBannerIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === bannerIndex 
                          ? 'w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' 
                          : 'w-1.5 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Aller à la bannière ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Affichage de tous les produits */}
            <div className="px-4" data-results-section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {productResultsTitle}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {visibleDefaultProducts.length} produit{visibleDefaultProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {hasActiveProductSearch && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      clearPhotoSearch();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Effacer
                  </button>
                )}
              </div>
              {productsLoading ? (
                <div className="py-10 flex items-center justify-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement…
                </div>
              ) : visibleDefaultProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {visibleDefaultProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  {photoSearchPreview
                    ? 'Aucun produit similaire trouvé pour cette photo.'
                    : searchQuery
                      ? `Aucun produit trouvé pour "${searchQuery}"`
                      : 'Aucun produit pour le moment.'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Panier */}

      {/* Modal Checkout */}
      {showCheckout && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Confirmer l'achat</h2>
                <button onClick={() => setShowCheckout(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Résumé produit */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedProduct.price.toLocaleString()} {selectedProduct.currency} x {quantity}
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  Total: {(selectedProduct.price * quantity).toLocaleString()} {selectedProduct.currency}
                </p>
              </div>

              {/* Solde du portefeuille */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/10 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Solde disponible</p>
                    <p className="text-2xl font-bold text-primary">
                      {balanceLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin inline" />
                      ) : (
                        `${balance.toLocaleString()} CDF`
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">Après achat</p>
                    <p className={`text-lg font-semibold ${
                      balance >= (selectedProduct.price * quantity) 
                        ? 'text-primary' 
                        : 'text-red-600'
                    }`}>
                      {(balance - (selectedProduct.price * quantity)).toLocaleString()} CDF
                    </p>
                  </div>
                </div>
                {balance < (selectedProduct.price * quantity) && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                    <span className="text-red-600 text-xs">⚠️</span>
                    <div className="flex-1">
                      <p className="text-xs text-red-700 font-semibold">Solde insuffisant</p>
                      <p className="text-xs text-red-600 mt-1">
                        Il vous manque {((selectedProduct.price * quantity) - balance).toLocaleString()} CDF
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs h-7 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setShowCheckout(false);
                          router.push('/dashboard/add-funds');
                        }}
                      >
                        Ajouter des fonds
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantité */}
              <div>
                <label className="text-sm font-semibold">Quantité</label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="text-sm font-semibold">Adresse de livraison</label>
                <Input
                  placeholder="Entrez votre adresse"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="text-sm font-semibold">Téléphone</label>
                <Input
                  placeholder="+243 XXX XXX XXX"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCheckout(false)}
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                  onClick={handleProcessPayment}
                  disabled={isProcessing || balance < (selectedProduct.price * quantity)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : balance < (selectedProduct.price * quantity) ? (
                    'Solde insuffisant'
                  ) : (
                    'Payer avec mon portefeuille'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Cart */}
      <FloatingCart
        items={cart}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckoutFromCart}
        total={total}
        itemCount={itemCount}
      />
    </div>
  );
}
