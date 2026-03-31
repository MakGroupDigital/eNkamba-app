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
  Menu,
  ChevronDown,
  Users,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  StoreStatsIcon,
  CustomersIcon,
  OrdersIcon,
  DeliveryIcon,
  ProductsIcon,
  RatingIcon,
  VerifiedIcon,
  ExperienceIcon,
} from '@/components/icons/seller-portal-icons';
import { SELLERS_DATA, PRODUCTS_DATA } from '@/lib/nkampa-data';

export default function SellerPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const seller = SELLERS_DATA[id] || SELLERS_DATA['seller-1'];

  // Get products for this seller
  const sellerProducts = Object.values(PRODUCTS_DATA).filter(
    (product: any) => product.sellerId === seller.id
  );

  const stats = [
    { label: 'Produits', value: sellerProducts.length.toString(), icon: ProductsIcon },
    { label: 'Clients satisfaits', value: '12.5K', icon: CustomersIcon },
    { label: 'Commandes', value: '8.2K', icon: OrdersIcon },
    { label: 'Taux de livraison', value: '99.8%', icon: DeliveryIcon },
  ];

  const categories = [
    { name: 'Téléphones', count: 45 },
    { name: 'Ordinateurs', count: 32 },
    { name: 'Accessoires', count: 78 },
    { name: 'Électroménager', count: 56 },
  ];

  const testimonials = [
    {
      author: 'Jean Mukendi',
      role: 'Client',
      text: 'Excellent service et produits de qualité. Je recommande vivement!',
      rating: 5,
      avatar: 'https://picsum.photos/seed/jean/50/50',
    },
    {
      author: 'Marie Kasongo',
      role: 'Client',
      text: 'Livraison rapide et produit conforme à la description.',
      rating: 5,
      avatar: 'https://picsum.photos/seed/marie/50/50',
    },
    {
      author: 'Pierre Tshimanga',
      role: 'Client',
      text: 'Très satisfait de mon achat. Service client réactif.',
      rating: 4,
      avatar: 'https://picsum.photos/seed/pierre/50/50',
    },
  ];

  const experience = [
    { year: '2015', title: 'Fondation de Kasang Elektronique', description: 'Début de l\'aventure avec une petite boutique' },
    { year: '2017', title: 'Expansion régionale', description: 'Ouverture de 3 nouvelles succursales' },
    { year: '2019', title: 'Certification eNKAMBA', description: 'Obtention de la certification officielle' },
    { year: '2023', title: 'Leader du marché', description: 'Devenir le leader en vente d\'électronique' },
  ];

  const [activeTab, setActiveTab] = useState('products');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const getSellerTypeLabel = () => {
    const types: any = {
      retailer: 'Détaillant',
      wholesaler: 'Grossiste',
      supplier: 'Fournisseur',
      producer: 'Producteur',
    };
    return types[seller.type] || 'Vendeur';
  };

  const handleContactSeller = () => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/dashboard/miyiki-chat/seller-${seller.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold flex-1 text-center">{seller.name}</h1>
          <button 
            onClick={() => {
              const storeLink = `${window.location.origin}/shop/${seller.storeName}`;
              if (navigator.share) {
                navigator.share({
                  title: seller.name,
                  text: `Découvrez la boutique ${seller.name} sur eNKAMBA`,
                  url: storeLink,
                }).catch(() => {
                  // Fallback to copy
                  navigator.clipboard.writeText(storeLink);
                  toast({
                    title: 'Lien copié',
                    description: 'Le lien de la boutique a été copié',
                  });
                });
              } else {
                // Fallback for browsers without share API
                navigator.clipboard.writeText(storeLink);
                toast({
                  title: 'Lien copié',
                  description: 'Le lien de la boutique a été copié',
                });
              }
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Banner - Shopify Style */}
      <div className="relative h-80 bg-gradient-to-r from-primary via-green-700 to-emerald-800 overflow-hidden">
        {/* Background Image with Overlay */}
        <Image
          src={seller.banner}
          alt={seller.name}
          fill
          className="object-cover opacity-40"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-green-700/85 to-emerald-800/90" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-36 -mb-36" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            {seller.name}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6 drop-shadow-md max-w-2xl">
            {seller.description}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Badge className="bg-white text-primary px-4 py-2 text-sm font-semibold">
              ⭐ {seller.rating} ({seller.reviews} avis)
            </Badge>
            {seller.verified && (
              <Badge className="bg-white/20 text-white px-4 py-2 text-sm font-semibold border border-white/30">
                ✓ {seller.badge}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Seller Info Card */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10 mb-8">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-white shadow-md">
                  <Image
                    src={seller.logo}
                    alt={seller.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{seller.name}</h1>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-green-600 text-white">{getSellerTypeLabel()}</Badge>
                      {seller.verified && (
                        <Badge className="bg-blue-600 text-white">✓ {seller.badge}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{seller.description}</p>
                  </div>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Heart
                      className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {stats.map((stat: any, idx: number) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={idx} className="text-center">
                        <div className="flex justify-center mb-2">
                          <IconComponent size={32} />
                        </div>
                        <p className="font-bold text-lg">{stat.value}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Rating & Location */}
                <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(seller.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold">{seller.rating}</span>
                    <span className="text-gray-600">({seller.reviews} avis)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {seller.location}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    Depuis {seller.founded}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleContactSeller}
                    className="gap-2 bg-gradient-to-r from-primary to-green-800 text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Phone className="w-4 h-4" />
                    {seller.phone}
                  </Button>
                </div>

                {/* Store Link - Share Section */}
                <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-green-800/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-gray-600 mb-2">Cliquer ici pour partager cet établissement ou le recommander:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200 text-primary font-bold">
                      {seller.storeName}-nkampa.shop
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const storeLink = `${window.location.origin}/shop/${seller.storeName}`;
                        navigator.clipboard.writeText(storeLink);
                        toast({
                          title: 'Lien copié',
                          description: 'Le lien de votre boutique a été copié',
                        });
                      }}
                      className="text-xs"
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex gap-4 border-b overflow-x-auto">
          {['products', 'about', 'testimonials', 'experience'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'products' && 'Produits'}
              {tab === 'about' && 'À propos'}
              {tab === 'testimonials' && 'Témoignages'}
              {tab === 'experience' && 'Expérience'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Categories Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>

            {/* Products Grid - Shopify Style */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {sellerProducts.map((product: any) => (
                <Link key={product.id} href={`/dashboard/nkampa/product/${product.id}`}>
                  <Card className="rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                    {/* Product Image */}
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    
                    {/* Product Info */}
                    <CardContent className="p-2.5 space-y-1.5">
                      <h3 className="font-semibold text-xs line-clamp-2 text-gray-800 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">({product.reviews})</span>
                      </div>
                      
                      {/* Price */}
                      <p className="text-sm font-bold text-primary">
                        {(product.price / 1000).toLocaleString()}K {product.currency}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">À propos de {seller.name}</h2>
                <p className="text-gray-700 mb-6">{seller.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Fondée en</p>
                    <p className="text-2xl font-bold">{seller.founded}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employés</p>
                    <p className="text-2xl font-bold">{seller.employees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Abonnés</p>
                    <p className="text-2xl font-bold">{seller.followers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-2xl font-bold">{getSellerTypeLabel()}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-green-800/10 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Nos valeurs</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Qualité garantie</li>
                    <li>✓ Service client 24/7</li>
                    <li>✓ Livraison rapide</li>
                    <li>✓ Garantie satisfaction</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <div className="space-y-4">
            {testimonials.map((testimonial: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold">{testimonial.author}</p>
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{testimonial.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            {experience.map((exp: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">{exp.year}</p>
                      <h3 className="text-lg font-bold">{exp.title}</h3>
                      <p className="text-gray-600">{exp.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">À propos</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="hover:text-white transition-colors"
                  >
                    Qui sommes-nous
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('experience')}
                    className="hover:text-white transition-colors"
                  >
                    Notre histoire
                  </button>
                </li>
                <li>
                  <a href="mailto:careers@enkamba.com" className="hover:text-white transition-colors">
                    Carrières
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button 
                    onClick={handleContactSeller}
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <Link href="/enkamba-faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/enkamba-returns" className="hover:text-white transition-colors">
                    Retours
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/enkamba-terms" className="hover:text-white transition-colors">
                    Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/enkamba-privacy" className="hover:text-white transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/enkamba-cookies" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Suivez-nous</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="https://facebook.com/enkamba" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/enkamba" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com/enkamba" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 space-y-4">
            <div className="text-center text-sm text-gray-400">
              <p>&copy; 2024 {seller.name}. Tous droits réservés. | Propulsé par eNKAMBA</p>
            </div>
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p><strong>Guangzhou eNKAMBA International Company CO., Ltd</strong></p>
              <p>Plateforme ecommerce pour partenaires établissements</p>
              <p>Email: support@enkamba.com | Tél: +33 (0)1 XX XX XX XX</p>
              <p>Adresse: Guangzhou, Chine</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
