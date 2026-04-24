'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Mic, X, Loader2, ArrowLeft, ShoppingCart } from 'lucide-react';
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
        className: 'bg-green-600 text-white border-none',
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      // Réinitialiser les filtres pour voir tous les résultats
      setSelectedMainCategory(null);
      setSelectedSubcategory(null);
      
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
          className: 'bg-green-600 text-white border-none',
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

  // Rotation automatique des bannières (uniquement si on a des produits)
  useEffect(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    if (!bannerProducts || bannerProducts.length <= 1) return;

    bannerTimerRef.current = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerProducts.length);
    }, 5000);

    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerProducts.length]);

  useEffect(() => {
    if (bannerIndex >= (bannerProducts?.length || 0)) setBannerIndex(0);
  }, [bannerIndex, bannerProducts?.length]);

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

    return filtered;
  }, [sortedProducts, activeMainCategory?.type, activeMainCategory?.id, isSupplierView, selectedSubcategory, searchQuery]);

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

  const SupplierCard = ({ supplier }: { supplier: any }) => (
    <Link href={`/shop/${supplier.slug || ''}`} className={!supplier.slug ? 'pointer-events-none opacity-60' : ''}>
      <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={supplier.logoUrl || supplier.coverUrl || 'https://picsum.photos/seed/store/300/300'}
          alt={supplier.storeName || 'Boutique'}
          fill
          className="object-cover"
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

  const ProductCard = ({ product }: { product: any }) => (
    <Link href={product?.storeSlug ? `/shop/${product.storeSlug}/product/${product.id}` : `/dashboard/nkampa`} className={!product?.storeSlug ? 'pointer-events-none opacity-60' : ''}>
      <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={product.image || product.images?.[0] || 'https://picsum.photos/seed/product/300/300'}
            alt={product.name || 'Produit'}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            <PriceIcon className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold text-primary">
              {Number(product.price || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-600">{product.currency}</span>
          </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header futuriste vert sans transparence */}
      <header className="sticky top-0 z-30">
        {/* Fond vert solide avec effet de profondeur */}
        <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 shadow-2xl">
          {/* Effet de lumière néon en haut */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-80" />
          
          {/* Grille futuriste en arrière-plan */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-4">
            {/* Top row */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <Link href="/dashboard" className="flex-shrink-0">
                <button className="group relative h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ArrowLeft className="relative h-5 w-5 text-white m-auto" />
                </button>
              </Link>

              <div className="flex items-center gap-3">
                {/* Logo eNkamba avec effet holographique */}
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-white/30 rounded-2xl blur-xl" />
                  
                  {/* Logo container */}
                  <div className="relative h-12 w-12 rounded-2xl bg-white shadow-2xl overflow-hidden border-2 border-white/50">
                    <Image
                      src="/enkamba-logo.png"
                      alt="eNkamba"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight drop-shadow-lg">
                    eNkamba Shop
                  </h1>
                  <p className="text-xs text-white/80 font-medium">Marketplace du futur</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(true)}
                className="group relative h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <ShoppingCart className="relative h-5 w-5 text-white m-auto" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-6 min-w-[24px] flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-1.5 text-xs font-black text-white shadow-lg border-2 border-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Navigation futuriste */}
            <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
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
                    className="group relative"
                  >
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-green-600 shadow-xl shadow-white/20'
                        : 'text-white/90 hover:bg-white/10 backdrop-blur-sm border border-white/10'
                    }`}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full shadow-lg shadow-white/50" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Barre de recherche futuriste */}
            <div className="relative group">
              {/* Glow effect on focus */}
              <div className="absolute -inset-1 bg-white/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-lg transition-opacity" />
              
              <div className="relative flex items-center gap-3 rounded-2xl bg-white shadow-xl px-4 py-3 border-2 border-white/50">
                <Search className="h-5 w-5 text-green-600" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`relative rounded-xl p-2 transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  aria-label="Recherche vocale"
                >
                  <Mic className="h-5 w-5" />
                  {isListening && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-400 rounded-full animate-ping" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Effet de lumière néon en bas */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-60" />
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
                    src={bannerProducts[bannerIndex]?.image || bannerProducts[bannerIndex]?.images?.[0] || 'https://picsum.photos/seed/banner/1200/600'}
                    alt="Bannière"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              
              {/* Gradient overlay moderne - plus subtil */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent" />
              
              {/* Effet de lumière futuriste */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.3),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.2),transparent_50%)]" />
              
              {/* Contenu */}
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Badge en haut */}
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-full blur opacity-75" />
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
                        {bannerProducts[bannerIndex]?.name}
                      </h2>
                      <div className="flex items-baseline gap-2">
                        <p className="text-white font-black text-3xl drop-shadow-lg">
                          {Number(bannerProducts[bannerIndex]?.price || 0).toLocaleString()}
                        </p>
                        <p className="text-white/90 font-semibold text-lg drop-shadow">
                          {bannerProducts[bannerIndex]?.currency || 'CDF'}
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
                    {searchQuery ? `Résultats pour "${searchQuery}"` : 'Tous les produits'}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {searchQuery ? filteredProducts.length : sortedProducts.length} produit{(searchQuery ? filteredProducts.length : sortedProducts.length) !== 1 ? 's' : ''}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
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
              ) : (searchQuery ? filteredProducts : sortedProducts).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {(searchQuery ? filteredProducts : sortedProducts).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  {searchQuery ? `Aucun produit trouvé pour "${searchQuery}"` : 'Aucun produit pour le moment.'}
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
              <div className="bg-gradient-to-r from-primary/10 to-green-800/10 p-4 rounded-lg border border-primary/20">
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
                        ? 'text-green-600' 
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
