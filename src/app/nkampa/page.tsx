'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, ArrowRight, Tag, Star, LayoutGrid, Filter, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import EnkambaLogo from "@/components/enkamba-logo";
import Image from "next/image";

const categories = [
    { name: "Électronique", icon: "💻" },
    { name: "Mode & Vêtements", icon: "👗" },
    { name: "Maison & Cuisine", icon: "🍳" },
    { name: "Beauté & Soins", icon: "💄" },
    { name: "Sport & Loisirs", icon: "⚽" },
    { name: "Autres", icon: "📦" },
];

const products = [
    { name: "Smartphone Pro X", price: "450 $", image: "https://picsum.photos/seed/phone1/400/400", rating: 4.5 },
    { name: "Montre Connectée", price: "120 $", image: "https://picsum.photos/seed/watch2/400/400", rating: 4.8 },
    { name: "Casque Audio Sans Fil", price: "85 $", image: "https://picsum.photos/seed/headphones3/400/400", rating: 4.6 },
    { name: "Laptop Ultra-fin", price: "950 $", image: "https://picsum.photos/seed/laptop4/400/400", rating: 4.9 },
];

export default function NkampaPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-card p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
               <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-headline text-2xl font-bold text-primary">Nkampa</span>
          </div>
           <div className="hidden sm:flex gap-2">
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/login">Commencer</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/login">Se Connecter</Link>
                </Button>
           </div>
           <Button variant="ghost" className="sm:hidden" asChild>
                <Link href="/ecosystem">{'<'} Écosystème</Link>
            </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto max-w-6xl p-4 space-y-8">
            
          {/* Hero & Search */}
          <section className="text-center bg-primary/5 p-8 rounded-2xl animate-in fade-in-up">
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-primary">La place de marché qui connecte l'Afrique</h1>
              <p className="max-w-2xl mx-auto mt-2 text-muted-foreground">Achetez, vendez et développez votre activité, que vous soyez un particulier, une entreprise ou une institution.</p>
              <div className="relative max-w-xl mx-auto mt-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher un produit, une marque..."
                  className="h-12 w-full rounded-full bg-card pl-12 text-base shadow-md"
                />
                <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 rounded-full">Rechercher</Button>
              </div>
          </section>

          {/* Categories */}
          <section className="animate-in fade-in-up" style={{animationDelay: '150ms'}}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-2xl font-bold text-primary">Catégories</h2>
                <Button variant="ghost" size="sm" className="text-primary">
                    Tout voir <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                  {categories.map(cat => (
                      <Link href="#" key={cat.name} className="group">
                        <Card className="p-4 flex flex-col items-center justify-center gap-2 rounded-2xl h-full transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
                           <div className="text-3xl">{cat.icon}</div>
                           <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{cat.name}</p>
                        </Card>
                      </Link>
                  ))}
              </div>
          </section>

          {/* Featured Products */}
          <section className="animate-in fade-in-up" style={{animationDelay: '300ms'}}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-2xl font-bold text-primary flex items-center gap-2"><Tag className="text-accent"/> Meilleures offres</h2>
                 <Button variant="ghost" size="sm" className="text-primary">
                    Tout voir <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.map(prod => (
                      <Card key={prod.name} className="rounded-xl overflow-hidden group transition-shadow hover:shadow-lg">
                          <div className="aspect-square overflow-hidden bg-muted">
                            <Image src={prod.image} alt={prod.name} width={400} height={400} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          </div>
                          <CardContent className="p-3 space-y-1">
                              <h3 className="font-headline text-base font-semibold truncate">{prod.name}</h3>
                              <div className="flex justify-between items-center">
                                  <p className="text-lg font-bold text-primary">{prod.price}</p>
                                  <div className="flex items-center gap-1 text-sm text-amber-500">
                                      <Star className="w-4 h-4 fill-current"/>
                                      <span>{prod.rating}</span>
                                  </div>
                              </div>
                              <Button variant="outline" size="sm" className="w-full mt-2">Ajouter au Panier</Button>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </section>

        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
          {[
            { href: '#', icon: ShoppingBag, label: 'Accueil' },
            { href: '#', icon: LayoutGrid, label: 'Catégories' },
            { href: '/dashboard/masolo', icon: Filter, label: 'Filtres' },
            { href: '#', icon: ShoppingCart, label: 'Panier' },
            { href: '#', icon: Star, label: 'Mon Nkampa' }
          ].map((item, index) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn('flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors', index === 0 ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
