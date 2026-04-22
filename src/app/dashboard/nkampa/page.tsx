'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mic, Phone, X, Loader2, Package, Store, Heart, User, ArrowLeft } from 'lucide-react';
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

// Sous-catégories de produits
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

// Données des fournisseurs/vendeurs
const ALL_SUPPLIERS = [
  {
    id: 'seller-1',
    name: 'Fournisseur Premium',
    type: 'supplier',
    location: 'Kinshasa',
    rating: 4.6,
    reviews: 23,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller1/300/300',
    category: 'alimentaire',
  },
  {
    id: 'seller-2',
    name: 'Grossiste Goma',
    type: 'wholesaler',
    location: 'Goma',
    rating: 4.7,
    reviews: 34,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller2/300/300',
    category: 'alimentaire',
  },
  {
    id: 'seller-3',
    name: 'Producteur Bio Bukavu',
    type: 'producer',
    location: 'Bukavu',
    rating: 4.9,
    reviews: 45,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller3/300/300',
    category: 'bio',
  },
  {
    id: 'seller-4',
    name: 'ElectroShop',
    type: 'retailer',
    location: 'Kinshasa',
    rating: 4.8,
    reviews: 45,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller4/300/300',
    category: 'tech',
  },
  {
    id: 'seller-5',
    name: 'TechStore',
    type: 'retailer',
    location: 'Kinshasa',
    rating: 4.5,
    reviews: 28,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller5/300/300',
    category: 'tech',
  },
  {
    id: 'seller-6',
    name: 'Fashion Plus',
    type: 'retailer',
    location: 'Kinshasa',
    rating: 4.7,
    reviews: 32,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller6/300/300',
    category: 'mode',
  },
  {
    id: 'seller-7',
    name: 'AudioWorld',
    type: 'retailer',
    location: 'Kinshasa',
    rating: 4.9,
    reviews: 56,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller7/300/300',
    category: 'tech',
  },
  {
    id: 'seller-8',
    name: 'Digital Store',
    type: 'digital',
    location: 'En ligne',
    rating: 4.8,
    reviews: 67,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller8/300/300',
    category: 'services',
  },
  {
    id: 'seller-9',
    name: 'Tech Academy',
    type: 'digital',
    location: 'En ligne',
    rating: 4.9,
    reviews: 89,
    phone: '+243 XXX XXX XXX',
    image: 'https://picsum.photos/seed/seller9/300/300',
    category: 'services',
  },
];

// Données de démonstration avec types et sous-catégories
const ALL_PRODUCTS = [
  // Produits de Kasang Elektronique (seller-1)
  {
    id: 'prod-1',
    name: 'iPhone 15 Pro Max',
    price: 1299000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/iphone15/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'tech',
    sellerId: 'seller-1',
    sellerName: 'Kasang Elektronique',
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 'prod-2',
    name: 'Samsung Galaxy S24',
    price: 999000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/samsung-s24/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'tech',
    sellerId: 'seller-1',
    sellerName: 'Kasang Elektronique',
    rating: 4.7,
    reviews: 189,
  },
  {
    id: 'prod-3',
    name: 'MacBook Pro 16"',
    price: 2499000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/macbook/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'tech',
    sellerId: 'seller-1',
    sellerName: 'Kasang Elektronique',
    rating: 4.9,
    reviews: 156,
  },
  {
    id: 'prod-4',
    name: 'iPad Air',
    price: 599000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/ipad/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'tech',
    sellerId: 'seller-1',
    sellerName: 'Kasang Elektronique',
    rating: 4.6,
    reviews: 98,
  },
  // Autres produits (pour démonstration)
  {
    id: 'p-5',
    name: 'Montre Connectée',
    price: 150000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/watch/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'tech',
    sellerId: 'seller-5',
    sellerName: 'TechStore',
    rating: 4.5,
    reviews: 28,
  },
  {
    id: 'p-6',
    name: 'Sac à Main Cuir',
    price: 85000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/bag1/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'mode',
    sellerId: 'seller-6',
    sellerName: 'Fashion Plus',
    rating: 4.7,
    reviews: 32,
  },
  {
    id: 'p-7',
    name: 'Casque Audio Premium',
    price: 120000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/headphones/300/300',
    location: 'Kinshasa',
    type: 'product',
    subcategory: 'tech',
    sellerId: 'seller-7',
    sellerName: 'AudioWorld',
    rating: 4.9,
    reviews: 56,
  },
  // Produits Digitaux
  {
    id: 'p-8',
    name: 'Template WordPress Premium',
    price: 15000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/web/300/300',
    location: 'En ligne',
    type: 'digital',
    subcategory: 'services',
    sellerId: 'seller-8',
    sellerName: 'Digital Store',
    rating: 4.8,
    reviews: 67,
  },
  {
    id: 'p-9',
    name: 'Cours Programmation Python',
    price: 25000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/code/300/300',
    location: 'En ligne',
    type: 'digital',
    subcategory: 'services',
    sellerId: 'seller-9',
    sellerName: 'Tech Academy',
    rating: 4.9,
    reviews: 89,
  },
];

export default function NkampaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { contactSeller, buyProduct } = useNkampaEcommerce();
  const { balance, isLoading: balanceLoading } = useWalletTransactions();
  const { cart, isOpen, setIsOpen, addToCart, removeFromCart, updateQuantity, total, itemCount } = useNkampaCart();

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

  // Rotation automatique des bannières
  useEffect(() => {
    bannerTimerRef.current = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % ALL_PRODUCTS.length);
    }, 5000);
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, []);

  // Filtrer les produits selon la catégorie et sous-catégorie
  const getFilteredProducts = () => {
    let filtered = ALL_PRODUCTS;

    if (selectedMainCategory) {
      filtered = filtered.filter((p) => p.type === selectedMainCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Filtrer les fournisseurs selon la catégorie
  const getFilteredSuppliers = () => {
    let filtered = ALL_SUPPLIERS;

    if (selectedMainCategory && selectedMainCategory !== 'all') {
      filtered = filtered.filter((s) => s.type === selectedMainCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter((s) => s.category === selectedSubcategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Déterminer si on affiche les fournisseurs ou les produits
  const isSupplierView = ['suppliers', 'wholesalers', 'retail', 'producers'].includes(selectedMainCategory || '');
  const filteredProducts = getFilteredProducts();
  const filteredSuppliers = getFilteredSuppliers();
  const categoryLabel = MAIN_CATEGORIES.find((c) => c.id === selectedMainCategory)?.label || 'Tous les produits';

  const handleContactSeller = async (product: any) => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour contacter le vendeur',
        variant: 'destructive',
      });
      return;
    }

    try {
      const conversationId = await contactSeller(product);
      router.push(`/dashboard/miyiki-chat/${conversationId}`);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du contact du vendeur',
        variant: 'destructive',
      });
    }
  };

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
    <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-40 bg-gray-100">
        <Image
          src={supplier.image}
          alt={supplier.name}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
          {supplier.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <LocationIcon className="w-3 h-3" />
          <span>{supplier.location}</span>
        </div>
        {supplier.rating && (
          <div className="flex items-center gap-1 text-xs">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(supplier.rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {supplier.reviews !== undefined && (
              <span className="text-gray-600">({supplier.reviews})</span>
            )}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={() => handleContactSeller(supplier)}
          >
            <Phone className="w-3 h-3 mr-1" />
            Appeler
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs h-8"
            onClick={() => handleContactSeller(supplier)}
          >
            <Mic className="w-3 h-3 mr-1" />
            Écrire
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProductCard = ({ product }: { product: any }) => (
    <Link href={`/dashboard/nkampa/product/${product.id}`}>
      <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative w-full h-40 bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
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
              {product.price.toLocaleString()}
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
            <span>{product.location}</span>
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
      {/* Navigation Bar */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary via-primary to-green-800 text-white shadow-lg">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">eNkamba Shop</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto scrollbar-hide">
          <Link href="/dashboard/nkampa" className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
            >
              <Store className="w-4 h-4" />
              Boutique
            </Button>
          </Link>
          <Link href="/dashboard/nkampa/orders" className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
            >
              <Package className="w-4 h-4" />
              Mes Commandes
            </Button>
          </Link>
          <Link href="/dashboard/nkampa/favorites" className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
            >
              <Heart className="w-4 h-4" />
              Favoris
            </Button>
          </Link>
          <Link href="/dashboard/nkampa/seller" className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
            >
              <User className="w-4 h-4" />
              Devenir Vendeur
            </Button>
          </Link>
        </div>
      </div>

      {/* Header avec recherche */}
      <div className="sticky top-[120px] z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher produits, fournisseurs, grossiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
          />
          <Mic className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="space-y-6 pb-8">
        {/* Catégories principales */}
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {MAIN_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isActive = selectedMainCategory === cat.id;
              const content = (
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
        {selectedMainCategory && selectedMainCategory !== 'all' && (
          <div className="px-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Filtrer par type:</p>
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
              {PRODUCT_SUBCATEGORIES.map((subcat) => (
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
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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
            <div className="relative h-48 mx-4 mt-4 rounded-lg overflow-hidden shadow-md bg-gradient-to-r from-green-700 to-green-900">
              {/* Images défilantes avec transition */}
              <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
                <Image
                  src={ALL_PRODUCTS[bannerIndex].image}
                  alt="Bannière"
                  fill
                  className="object-cover opacity-40"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-700/90 to-green-900/70" />
              <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                <div>
                  <Badge className="bg-white text-green-700">🌾 Nouveau</Badge>
                </div>
                <div className="animate-pulse">
                  <h2 className="text-white font-bold text-lg mb-1">
                    {ALL_PRODUCTS[bannerIndex].name}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {ALL_PRODUCTS[bannerIndex].price.toLocaleString()} {ALL_PRODUCTS[bannerIndex].currency}
                  </p>
                </div>
              </div>
              {/* Indicateurs de bannière */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {ALL_PRODUCTS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setBannerIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === bannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Affichage de tous les produits */}
            <div className="px-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Tous les produits</h2>
                  <p className="text-xs text-gray-600">
                    {ALL_PRODUCTS.length} produit{ALL_PRODUCTS.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ALL_PRODUCTS.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
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
