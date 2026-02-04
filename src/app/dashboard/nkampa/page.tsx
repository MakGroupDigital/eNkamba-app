'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, Star, ShoppingCart, X, Plus, Minus, MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { NkampaIcon, SearchIcon, ElectronicsIconBrand, FashionIconBrand, HomeKitchenIconBrand, BeautyIconBrand, SportsIconBrand, OthersIconBrand } from "@/components/icons/service-icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Currency = 'CDF' | 'USD' | 'EUR';

interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  image: string;
  quantity: number;
  rating: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  image: string;
  rating: number;
}

const allCategories = [
  { name: "Électronique", icon: ElectronicsIconBrand },
  { name: "Mode & Vêtements", icon: FashionIconBrand },
  { name: "Maison & Cuisine", icon: HomeKitchenIconBrand },
  { name: "Beauté & Soins", icon: BeautyIconBrand },
  { name: "Sport & Loisirs", icon: SportsIconBrand },
  { name: "Livres & Médias", icon: OthersIconBrand },
  { name: "Jouets & Enfants", icon: OthersIconBrand },
  { name: "Santé & Wellness", icon: OthersIconBrand },
  { name: "Automobile & Moto", icon: OthersIconBrand },
  { name: "Jardin & Extérieur", icon: OthersIconBrand },
  { name: "Fournitures Bureau", icon: OthersIconBrand },
  { name: "Animaux & Accessoires", icon: OthersIconBrand },
  { name: "Art & Loisirs Créatifs", icon: OthersIconBrand },
  { name: "Musique & Instruments", icon: OthersIconBrand },
  { name: "Gourmet & Vins", icon: OthersIconBrand },
  { name: "Autres", icon: OthersIconBrand },
];

const categories = allCategories.slice(0, 6);

const products: Product[] = [
  { id: '1', name: "Smartphone Pro X", price: 1125000, currency: 'CDF', image: "https://picsum.photos/seed/phone1/400/400", rating: 4.5 },
  { id: '2', name: "Montre Connectée", price: 300000, currency: 'CDF', image: "https://picsum.photos/seed/watch2/400/400", rating: 4.8 },
  { id: '3', name: "Casque Audio Sans Fil", price: 212500, currency: 'CDF', image: "https://picsum.photos/seed/headphones3/400/400", rating: 4.6 },
  { id: '4', name: "Laptop Ultra-fin", price: 2375000, currency: 'CDF', image: "https://picsum.photos/seed/laptop4/400/400", rating: 4.9 },
];

export default function NkampaPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);  const [showAllCategories, setShowAllCategories] = useState(false);  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mbongo' | 'card'>('mbongo');

  const formatPrice = (price: number, currency: Currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Ajouté au panier",
      description: `${product.name} a été ajouté au panier.`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
    toast({
      title: "Retiré du panier",
      description: "L'article a été retiré.",
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQuantity) };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (!address || !phone) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir l'adresse et le numéro de téléphone.",
      });
      return;
    }
    setShowCheckout(true);
  };

  const handleConfirmOrder = async () => {
    // Rediriger vers le paiement unifié avec contexte nkampa
    // Le paiement sera traité via le système unifié
    const paymentData = {
      context: 'nkampa',
      amount: cartTotal,
      description: `Achat de ${cartItemsCount} article(s) sur Nkampa`,
      metadata: {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        address,
        phone,
        paymentMethod
      }
    };
    
    // Stocker les données de paiement dans sessionStorage
    sessionStorage.setItem('nkampa_payment_data', JSON.stringify(paymentData));
    
    // Rediriger vers la page de paiement
    window.location.href = '/dashboard/pay?context=nkampa';
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground animate-in fade-in duration-500">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-primary via-primary to-green-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <NkampaIcon size={32} />
            </div>
            <div>
              <span className="font-headline text-2xl font-bold text-white">Nkampa</span>
              <p className="text-xs text-white/70">Marketplace eNkamba</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 relative"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto max-w-6xl p-4 space-y-8">
          {/* Hero & Search */}
          <section className="text-center bg-gradient-to-br from-primary/5 to-green-800/5 dark:from-primary/10 dark:to-green-800/10 p-8 rounded-3xl animate-in fade-in-up border border-primary/20 dark:border-primary/30">
            <div className="flex justify-center mb-4">
              <NkampaIcon size={64} />
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-800 bg-clip-text text-transparent">
              La place de marché mondiale
            </h1>
            <p className="max-w-2xl mx-auto mt-2 text-muted-foreground">
              Achetez, vendez et développez votre activité, que vous soyez un particulier, une entreprise ou une institution.
            </p>
            <div className="relative max-w-xl mx-auto mt-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <SearchIcon size={20} className="text-muted-foreground" />
              </div>
              <Input
                id="search"
                placeholder="Rechercher un produit, une marque..."
                className="h-14 w-full rounded-full bg-card pl-14 text-base shadow-lg border-primary/20 dark:border-primary/40"
              />
              <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90">
                Rechercher
              </Button>
            </div>
          </section>

          {/* Categories */}
          <section className="animate-in fade-in-up" style={{animationDelay: '150ms'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-headline text-2xl font-bold text-primary">Catégories</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => setShowAllCategories(true)}>
                Tout voir <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
              {categories.map(cat => {
                const IconComponent = cat.icon;
                return (
                  <button key={cat.name} className="group">
                    <Card className="p-4 flex flex-col items-center justify-center gap-3 rounded-2xl h-full transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
                      <IconComponent size={40} />
                      <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{cat.name}</p>
                    </Card>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Featured Products */}
          <section className="animate-in fade-in-up" style={{animationDelay: '300ms'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-headline text-2xl font-bold bg-gradient-to-r from-primary to-green-800 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-2xl">🏷️</span> Meilleures offres
              </h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Tout voir <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map(product => (
                <Card key={product.id} className="rounded-xl overflow-hidden group transition-shadow hover:shadow-lg">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <Image src={product.image} alt={product.name} width={400} height={400} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <h3 className="font-headline text-base font-semibold truncate">{product.name}</h3>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-primary">{formatPrice(product.price, product.currency)}</p>
                      <div className="flex items-center gap-1 text-sm text-amber-500">
                        <Star className="w-4 h-4 fill-current"/>
                        <span>{product.rating}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => addToCart(product)}
                    >
                      Ajouter au Panier
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mon Panier ({cartItemsCount} article{cartItemsCount > 1 ? 's' : ''})</DialogTitle>
            <DialogDescription>Vérifiez vos articles avant de passer commande.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Votre panier est vide</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">{item.name}</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="font-bold">{formatPrice(item.price * item.quantity, item.currency)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(cartTotal, 'CDF')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCart(false)}>
              Continuer les achats
            </Button>
            {cart.length > 0 && (
              <Button onClick={handleCheckout} className="bg-gradient-to-r from-primary to-green-800">
                Passer la commande <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finaliser la commande</DialogTitle>
            <DialogDescription>Remplissez vos informations de livraison.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse de livraison</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="Entrez votre adresse complète"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                placeholder="+243 XXX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Méthode de paiement</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === 'mbongo' ? 'default' : 'outline'}
                  className={cn(paymentMethod === 'mbongo' && 'bg-primary')}
                  onClick={() => setPaymentMethod('mbongo')}
                >
                  Mbongo
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className={cn(paymentMethod === 'card' && 'bg-primary')}
                  onClick={() => setPaymentMethod('card')}
                >
                  Carte
                </Button>
              </div>
            </div>
            <Card className="p-4 bg-muted/50">
              <div className="flex justify-between font-bold">
                <span>Total à payer</span>
                <span className="text-primary">{formatPrice(cartTotal, 'CDF')}</span>
              </div>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Retour
            </Button>
            <Button onClick={handleConfirmOrder} className="bg-gradient-to-r from-primary to-green-800">
              Confirmer la commande <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-center">Commande confirmée !</DialogTitle>
            <DialogDescription className="text-center">
              Votre commande a été passée avec succès. Vous recevrez une notification lorsque votre colis sera expédié.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSuccess(false)} className="w-full sm:w-auto">
              Parfait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Categories Dialog */}
      <Dialog open={showAllCategories} onOpenChange={setShowAllCategories}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Toutes les catégories</DialogTitle>
            <DialogDescription>Explorez toutes nos catégories de produits.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 py-6">
            {allCategories.map(cat => {
              const IconComponent = cat.icon;
              return (
                <button key={cat.name} className="group">
                  <Card className="p-4 flex flex-col items-center justify-center gap-3 rounded-2xl h-full transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
                    <IconComponent size={40} />
                    <p className="text-sm font-medium text-foreground text-center transition-colors group-hover:text-primary">{cat.name}</p>
                  </Card>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
