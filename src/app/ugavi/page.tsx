'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Navigation, Send, PackageSearch, Calculator, MapPin, History, Home, Bell, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const UgaviLogo = () => (
  <div className="flex items-center gap-2">
    <div className="bg-accent p-2 rounded-lg">
      <Navigation className="text-primary-foreground transform -rotate-45" />
    </div>
    <span className="font-headline text-2xl font-bold text-primary-foreground">Ugavi</span>
  </div>
);

const quickActions = [
  { icon: Send, label: "Envoyer un colis", href: "#", variant: "default" },
  { icon: PackageSearch, label: "Suivi de colis", href: "#", variant: "secondary" }
];

const coreServices = [
  { title: "Afrique → Diaspora", description: "Expédiez vos colis depuis l'Afrique vers le monde entier.", icon: "✈️" },
  { title: "Diaspora → Afrique", description: "Envoyez des biens à vos proches en Afrique en toute simplicité.", icon: "🌍" }
];

const features = [
  { icon: Calculator, label: "Calculer les frais", href: "#" },
  { icon: MapPin, label: "Trouver un point relais", href: "#" },
  { icon: History, label: "Historique d'envoi", href: "#" }
];

const navItems = [
  { href: '/ugavi', icon: Home, label: 'Accueil' },
  { href: '#', icon: PackageSearch, label: 'Suivi' },
  { href: '#', icon: Bell, label: 'Notifications' },
  { href: '#', icon: User, label: 'Profil' },
];

export default function UgaviPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-primary p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <UgaviLogo />
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/50 hover:text-primary-foreground" asChild>
            <Link href="/ecosystem">{'<'} Écosystème</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto max-w-4xl p-4 space-y-8">
            
          {/* Tracking Section */}
          <Card className="shadow-lg animate-in fade-in-up duration-500">
            <CardContent className="p-4 space-y-3">
              <label htmlFor="tracking-number" className="font-headline text-lg font-semibold text-primary">
                Suivez votre colis en temps réel
              </label>
              <div className="flex gap-2">
                <Input
                  id="tracking-number"
                  placeholder="Entrez le numéro de suivi"
                  className="h-12 text-base flex-1"
                />
                <Button size="icon" className="h-12 w-12 bg-accent hover:bg-accent/90">
                  <Search className="h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 animate-in fade-in-up duration-500" style={{animationDelay: '150ms'}}>
             {quickActions.map(action => (
              <Card key={action.label} className={cn("text-center transition-transform hover:scale-105 hover:shadow-xl", action.variant === 'default' ? 'bg-primary text-primary-foreground' : 'bg-card')}>
                <Link href={action.href}>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <action.icon className="h-8 w-8" />
                    <span className="font-headline font-semibold">{action.label}</span>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Core Services */}
           <div className="space-y-4 animate-in fade-in-up duration-500" style={{animationDelay: '300ms'}}>
            {coreServices.map(service => (
              <Card key={service.title}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-4xl">{service.icon}</div>
                  <div>
                    <p className="font-headline font-bold text-primary">{service.title}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                   <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
           </div>
           
          {/* Key Features */}
          <div className="animate-in fade-in-up duration-500" style={{animationDelay: '450ms'}}>
            <h3 className="font-headline text-xl font-bold text-primary mb-4">Autres fonctionnalités</h3>
             <div className="grid grid-cols-3 gap-4 text-center">
              {features.map(feature => (
                <Link href={feature.href} key={feature.label} className="flex flex-col items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted shadow-inner">
                    <feature.icon className="h-8 w-8 text-primary/80" />
                  </div>
                  <span className="px-1">{feature.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-primary text-primary-foreground shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-stretch">
          {navItems.map((item, index) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:bg-primary/50',
                index === 0 ? 'text-accent' : 'opacity-80'
              )}
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
