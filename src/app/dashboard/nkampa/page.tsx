'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
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
  const { balance, isLoading: balanceLoading } = useWalletTransactions();
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
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const bannerProducts = (() => {
    const withTime = (firestoreProducts || []).slice().sort((a: any, b: any) => {
      const aMs = a?.createdAt?.toMillis?.() || 0;
      const bMs = b?.createdAt?.toMillis?.() || 0;
      return bMs - aMs;
    });
    return withTime.slice(0, 6);
  })();

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
  const getFilteredProducts = () => {
    let filtered: any[] = (firestoreProducts || []) as any[];

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
  };

  // Filtrer les fournisseurs selon la catégorie
  const getFilteredSuppliers = () => {
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
  };

  // Déterminer si on affiche les fournisseurs ou les produits
  const filteredProducts = getFilteredProducts();
  const filteredSuppliers = getFilteredSuppliers();
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
      {/* Ultra-modern Header */}
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
                  <Link href="/dashboard" className="flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-foreground/80 hover:bg-primary/10 hover:text-foreground"
                      aria-label="Retour"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>

                  <div className="min-w-0 flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-[0_10px_35px_rgba(16,185,129,0.22)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.55),transparent_60%)]" />
                      <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-white/20 blur-md" />
                    </div>
                    <h1 className="truncate text-sm font-extrabold tracking-tight text-foreground sm:text-base">
                      eNkamba <span className="text-primary">Shop</span>
                    </h1>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(true)}
                    className="relative text-foreground/80 hover:bg-primary/10 hover:text-foreground"
                    aria-label="Ouvrir le panier"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black text-primary-foreground shadow">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Dock row */}
                <div className="flex flex-col gap-2 px-3 pb-3 sm:px-4">
                  <nav className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                      { href: '/dashboard/nkampa', label: 'Boutique', icon: NkampaNavShopIcon, accent: 'text-primary' },
                      { href: '/dashboard/nkampa/orders', label: 'Commandes', icon: NkampaNavOrdersIcon, accent: 'text-amber-600' },
                      { href: '/dashboard/nkampa/favorites', label: 'Favoris', icon: NkampaNavFavoritesIcon, accent: 'text-pink-600' },
                      hasStoreChecked && myStore
                        ? { href: '/dashboard/nkampa/store/dashboard', label: 'Ma boutique', icon: NkampaNavSellerIcon, accent: 'text-sky-600' }
                        : { href: '/dashboard/nkampa/store', label: 'Créer boutique', icon: NkampaNavSellerIcon, accent: 'text-sky-600' },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isActive = pathname === t.href;
                      return (
                        <Link
                          key={t.href}
                          href={t.href}
                          aria-current={isActive ? 'page' : undefined}
                          className={[
                            'group relative flex-shrink-0 px-0.5 py-2 text-xs font-semibold transition',
                            isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground',
                            isActive
                              ? 'after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-primary after:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                              : 'after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-transparent group-hover:after:bg-primary/30',
                          ].join(' ')}
                        >
                          <span className="flex items-center gap-2">
                            <Icon
                              className={[
                                'h-4 w-4',
                                isActive ? 'text-primary' : `${t.accent} opacity-85`,
                                'transition-opacity group-hover:opacity-100',
                              ].join(' ')}
                            />
                            {t.label}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="flex items-center gap-2 rounded-2xl ring-1 ring-primary/10 bg-background/40 px-3 py-2 backdrop-blur">
                    <Search className="h-4 w-4 text-foreground/60" />
                    <input
                      type="text"
                      placeholder="Rechercher…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-44 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none transition-[width] focus:w-72 md:w-72 md:focus:w-96"
                    />
                    <button
                      type="button"
                      className="rounded-xl p-2 text-foreground/60 transition hover:bg-primary/10 hover:text-foreground"
                      aria-label="Recherche vocale"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
          <div className="px-4">
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
          <div className="px-4">
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
            {/* Bannière promotionnelle défilante */}
            <div className="relative h-48 mx-4 mt-4 rounded-2xl overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.18)] bg-gradient-to-br from-primary via-emerald-700 to-green-900">
              {/* Images défilantes avec transition */}
              <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
                {bannerProducts.length > 0 && (
                  <Image
                    src={bannerProducts[bannerIndex]?.image || bannerProducts[bannerIndex]?.images?.[0] || 'https://picsum.photos/seed/banner/1200/600'}
                    alt="Bannière"
                    fill
                    className="object-cover opacity-40"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-emerald-700/75 to-green-900/70" />
              <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                <div>
                  <Badge className="bg-white text-green-700">🌾 Nouveau</Badge>
                </div>
                <div className="animate-pulse">
                  {bannerProducts.length > 0 ? (
                    <>
                      <h2 className="text-white font-bold text-lg mb-1">
                        {bannerProducts[bannerIndex]?.name}
                      </h2>
                      <p className="text-white/90 text-sm">
                        {Number(bannerProducts[bannerIndex]?.price || 0).toLocaleString()} {bannerProducts[bannerIndex]?.currency || 'CDF'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-white font-bold text-lg mb-1">Découvrez Nkampa</h2>
                      <p className="text-white/90 text-sm">Ajoutez vos premiers produits pour les voir ici.</p>
                    </>
                  )}
                </div>
              </div>
              {/* Indicateurs de bannière */}
              {bannerProducts.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {bannerProducts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === bannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Affichage de tous les produits */}
            <div className="px-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Tous les produits</h2>
                  <p className="text-xs text-gray-600">
                    {firestoreProducts.length} produit{firestoreProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {productsLoading ? (
                <div className="py-10 flex items-center justify-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement…
                </div>
              ) : firestoreProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {firestoreProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Aucun produit pour le moment.
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
