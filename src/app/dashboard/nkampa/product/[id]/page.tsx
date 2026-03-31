'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Heart, 
  Share2, 
  Star, 
  MapPin, 
  Phone, 
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  Users,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNkampaCart } from '@/hooks/useNkampaCart';
import { useAuth } from '@/hooks/useAuth';
import { getProductWithSeller } from '@/lib/nkampa-data';
import {
  TruckDeliveryIcon,
  PlaneExpressIcon,
  ShipLogisticsIcon,
  WalletPayIcon,
  MobileMoneyIcon,
  BankCardIcon,
  CashOnDeliveryIcon,
  VerifiedBadgeIcon,
} from '@/components/icons/nkampa-icons';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useNkampaCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(0);

  // Get product with seller info from centralized data
  const product = getProductWithSeller(id);

  // Mapping des icônes de livraison
  const getShippingIcon = (name: string) => {
    if (name.includes('Enkamba') || name.includes('Livraison')) return TruckDeliveryIcon;
    if (name.includes('Express') || name.includes('Diaspora')) return PlaneExpressIcon;
    if (name.includes('Logistics')) return ShipLogisticsIcon;
    return TruckDeliveryIcon;
  };

  // Mapping des icônes de paiement
  const getPaymentIcon = (name: string) => {
    if (name.includes('eKAMBA') || name.includes('Pay')) return WalletPayIcon;
    if (name.includes('Mobile')) return MobileMoneyIcon;
    if (name.includes('Carte') || name.includes('bancaire')) return BankCardIcon;
    if (name.includes('livraison') || name.includes('Paiement')) return CashOnDeliveryIcon;
    return WalletPayIcon;
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
          <Button onClick={() => router.back()}>Retour</Button>
        </div>
      </div>
    );
  }

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: 'Ajouté au panier',
      description: `${quantity}x ${product.name} ajouté au panier`,
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour acheter',
        variant: 'destructive',
      });
      return;
    }
    // Rediriger vers le checkout
    router.push('/dashboard/nkampa/checkout');
  };

  const handleContactSeller = () => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour contacter le vendeur',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/dashboard/miyiki-chat/seller-${product.seller.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg flex-shrink-0">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold flex-1 text-center truncate px-2">Détails du produit</h1>
          <button 
            onClick={() => {
              const productLink = `${window.location.origin}/dashboard/nkampa/product/${product.id}`;
              if (navigator.share) {
                navigator.share({
                  title: product.name,
                  text: `${product.name} - ${product.price.toLocaleString()} ${product.currency}`,
                  url: productLink,
                }).catch(() => {
                  navigator.clipboard.writeText(productLink);
                  toast({
                    title: 'Lien copié',
                    description: 'Le lien du produit a été copié',
                  });
                });
              } else {
                navigator.clipboard.writeText(productLink);
                toast({
                  title: 'Lien copié',
                  description: 'Le lien du produit a été copié',
                });
              }
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Image Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative bg-white rounded-2xl overflow-hidden aspect-square">
            {product.specialOffer && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  🔥 {product.offerLabel}
                </div>
              </div>
            )}
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
            />
            {discount > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                -{discount}%
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  selectedImage === idx ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Image
                  src={img}
                  alt={`${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {/* Title & Rating */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold">{product.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviews} avis • {product.sold} vendus
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-primary/10 to-green-800/10 p-4 rounded-xl">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-primary">{product.price.toLocaleString()} {product.currency}</span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.originalPrice.toLocaleString()} {product.currency}
                </span>
              )}
            </div>
            {product.groupBuyPrice && (
              <div className="text-sm text-muted-foreground">
                Achat groupé (3+): <span className="font-bold text-primary">{product.groupBuyPrice.toLocaleString()} {product.currency}</span>
                <span className="ml-2 text-xs">({product.groupBuyCount} personnes ont déjà commandé)</span>
              </div>
            )}
          </div>

          {/* Seller Info */}
          <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Seller Header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{product.seller.name}</h3>
                      {product.seller.verified && (
                        <Badge className="bg-green-600 text-white text-xs whitespace-nowrap">✓ {product.seller.badge}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.seller.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="whitespace-nowrap">{product.seller.rating} ({product.seller.reviews} avis)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{product.seller.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleContactSeller}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Contacter</span>
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/nkampa/seller/${product.seller.id}`)}
                    size="sm"
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-green-800 text-white"
                  >
                    🏪 <span className="hidden sm:inline">Voir la boutique</span><span className="sm:hidden">Boutique</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>{product.stock} en stock</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{product.sold} personnes ont acheté</span>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">Caractéristiques</h3>
            <div className="grid grid-cols-2 gap-4">
              {product.specs.map((spec: any, idx: number) => (
                <div key={idx}>
                  <p className="text-sm text-muted-foreground">{spec.label}</p>
                  <p className="font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Options */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Options de livraison
            </h3>
            <div className="space-y-2">
              {product.shipping.map((option: any, idx: number) => {
                const ShippingIcon = getShippingIcon(option.name);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === idx}
                      onChange={() => setSelectedShipping(idx)}
                      className="w-4 h-4"
                    />
                    <div className="flex-shrink-0">
                      <ShippingIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.days}</p>
                    </div>
                    {option.verified && (
                      <div className="flex items-center gap-1">
                        <VerifiedBadgeIcon className="w-4 h-4" />
                        <span className="text-xs text-green-600 font-medium">Vérifié</span>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">Moyens de paiement</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {product.paymentMethods.map((method: any, idx: number) => {
                const PaymentIcon = getPaymentIcon(method.name);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={selectedPayment === idx}
                      onChange={() => setSelectedPayment(idx)}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <div className="flex-shrink-0">
                      <PaymentIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium truncate">{method.name}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quantity & Actions */}
        <div className="space-y-3 sticky bottom-0 bg-white p-4 rounded-t-2xl border-t">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Quantité:</span>
            <div className="flex items-center gap-3 bg-muted rounded-lg p-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 hover:bg-white rounded transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 hover:bg-white rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              variant="outline"
              className="flex-1 gap-2 h-12"
            >
              <ShoppingCart className="w-5 h-5" />
              Ajouter au panier
            </Button>
            <Button
              onClick={handleBuyNow}
              className="flex-1 bg-gradient-to-r from-primary to-green-800 text-white h-12 font-bold"
            >
              Acheter maintenant
            </Button>
            <Button
              onClick={() => setIsFavorite(!isFavorite)}
              variant="outline"
              size="icon"
              className="h-12 w-12"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
