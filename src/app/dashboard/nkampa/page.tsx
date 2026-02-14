'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mic, ShoppingCart, MapPin, Phone, Star, X, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  SuppliersIcon,
  WholesalersIcon,
  RetailBuyIcon,
  ProInvoiceIcon,
  TrackingIcon,
  B2BProductIcon,
  B2CProductIcon,
  ContactIcon,
  LocationIcon,
  StarIcon,
  MOQIcon,
  PriceIcon,
} from '@/components/icons/nkampa-ecommerce-icons';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Données de démonstration
const DEMO_B2B_PRODUCTS = [
  {
    id: 'b2b-1',
    name: 'Milo - Poudre Chocolatée',
    price: 8500,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/milo/300/300',
    moq: '100 cartons',
    location: 'Kinshasa',
    category: 'B2B' as const,
    sellerId: 'seller-1',
    sellerName: 'Fournisseur Premium',
  },
  {
    id: 'b2b-2',
    name: 'Riz Blanc Premium',
    price: 45000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/rice/300/300',
    moq: '50 sacs',
    location: 'Goma',
    category: 'B2B' as const,
    sellerId: 'seller-2',
    sellerName: 'Grossiste Goma',
  },
  {
    id: 'b2b-3',
    name: 'Camion de Livraison',
    price: 1300000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/truck/300/300',
    location: 'Lubumbashi',
    category: 'B2B' as const,
    sellerId: 'seller-3',
    sellerName: 'Transport Lubumbashi',
  },
  {
    id: 'b2b-4',
    name: 'Tuyaux Ciment 3.5mm',
    price: 20000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/pipes/300/300',
    location: 'Matadi',
    category: 'B2B' as const,
    sellerId: 'seller-4',
    sellerName: 'Matériaux Matadi',
  },
];

const DEMO_B2C_PRODUCTS = [
  {
    id: 'b2c-1',
    name: 'Téléphone Smartphone Pro',
    price: 250000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/phone1/300/300',
    rating: 4.8,
    reviews: 45,
    location: 'Kinshasa',
    category: 'B2C' as const,
    sellerId: 'seller-5',
    sellerName: 'ElectroShop',
  },
  {
    id: 'b2c-2',
    name: 'Montre Connectée',
    price: 150000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/watch/300/300',
    rating: 4.5,
    reviews: 28,
    location: 'Kinshasa',
    category: 'B2C' as const,
    sellerId: 'seller-6',
    sellerName: 'TechStore',
  },
  {
    id: 'b2c-3',
    name: 'Sac à Main Cuir',
    price: 85000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/bag1/300/300',
    rating: 4.7,
    reviews: 32,
    location: 'Kinshasa',
    category: 'B2C' as const,
    sellerId: 'seller-7',
    sellerName: 'Fashion Plus',
  },
  {
    id: 'b2c-4',
    name: 'Casque Audio Premium',
    price: 120000,
    currency: 'CDF',
    image: 'https://picsum.photos/seed/headphones/300/300',
    rating: 4.9,
    reviews: 56,
    location: 'Kinshasa',
    category: 'B2C' as const,
    sellerId: 'seller-8',
    sellerName: 'AudioWorld',
  },
];

const CATEGORIES = [
  { id: 'suppliers', label: 'Fournisseurs', icon: SuppliersIcon },
  { id: 'wholesalers', label: 'Grossistes', icon: WholesalersIcon },
  { id: 'retail', label: 'Acheter détail', icon: RetailBuyIcon },
  { id: 'invoice', label: 'Facture pro', icon: ProInvoiceIcon },
  { id: 'tracking', label: 'Suivi colis', icon: TrackingIcon, href: '/dashboard/scanner' },
];

interface CartItem {
  product: any;
  quantity: number;
}

export default function NkampaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { contactSeller, buyProduct } = useNkampaEcommerce();

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotation automatique des bannières
  useEffect(() => {
    bannerTimerRef.current = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % DEMO_B2B_PRODUCTS.length);
    }, 5000);
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, []);

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

  const handleAddToCart = (product: any) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast({
      title: 'Ajouté au panier',
      description: `${product.name} a été ajouté au panier`,
    });
  };

  const handleBuyNow = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowCheckout(true);
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
      setTimeout(() => {
        router.push(`/dashboard/miyiki-chat/${result.conversationId}`);
      }, 1500);
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

  const ProductCard = ({ product, isBuy = false }: { product: any; isBuy?: boolean }) => (
    <Card className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
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
        <div className="flex gap-2 pt-2">
          {isBuy ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Panier
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs h-8"
                onClick={() => handleBuyNow(product)}
              >
                Acheter
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8"
              onClick={() => handleContactSeller(product)}
            >
              <Phone className="w-3 h-3 mr-1" />
              Contacter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec recherche */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
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

      {/* Panier flottant */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-20">
          <Button
            onClick={() => setShowCart(true)}
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {cart.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="space-y-6 pb-8">
        {/* Bannière promotionnelle défilante */}
        <div className="relative h-48 mx-4 mt-4 rounded-lg overflow-hidden shadow-md bg-gradient-to-r from-green-700 to-green-900">
          <Image
            src={DEMO_B2B_PRODUCTS[bannerIndex].image}
            alt="Bannière"
            fill
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-700/90 to-green-900/70" />
          <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
            <div>
              <Badge className="bg-white text-green-700">🌾 Nouveau</Badge>
            </div>
            <div className="animate-pulse">
              <h2 className="text-white font-bold text-lg mb-1">
                Acheter directement au producteur
              </h2>
              <p className="text-white/90 text-sm">
                Prix usine - Vente en gros
              </p>
            </div>
          </div>
          {/* Indicateurs de bannière */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {DEMO_B2B_PRODUCTS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === bannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Catégories */}
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const content = (
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center hover:from-primary/30 hover:to-primary/20 transition-colors">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center max-w-[70px]">
                    {cat.label}
                  </span>
                </div>
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

        {/* Section Produits B2B */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Produits en gros B2B</h2>
              <p className="text-xs text-gray-600">RDC & Diaspora</p>
            </div>
            <a href="#" className="text-primary font-semibold text-sm hover:text-primary/80">
              Voir tout →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEMO_B2B_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Section Produits B2C */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Produits à l'unité B2C</h2>
            <a href="#" className="text-primary font-semibold text-sm hover:text-primary/80">
              Voir tout →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEMO_B2C_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} isBuy={true} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal Panier */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Mon Panier ({cart.length})</h2>
              <button onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Votre panier est vide</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <Card key={item.product.id}>
                      <CardContent className="p-3 flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{item.product.name}</h3>
                          <p className="text-sm text-primary font-bold">
                            {item.product.price.toLocaleString()} {item.product.currency}
                          </p>
                          <p className="text-xs text-gray-600">Quantité: {item.quantity}</p>
                        </div>
                        <button
                          onClick={() =>
                            setCart(cart.filter((i) => i.product.id !== item.product.id))
                          }
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => {
                    setShowCart(false);
                    toast({
                      title: 'Fonctionnalité en développement',
                      description: 'Le paiement du panier sera bientôt disponible',
                    });
                  }}
                >
                  Procéder au paiement
                </Button>
              </>
            )}
          </div>
        </div>
      )}

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
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer l\'achat'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
