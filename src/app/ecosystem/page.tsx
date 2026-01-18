'use client';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Bot,
  MessageSquare,
  ShoppingCart,
  Users,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import EnkambaLogo from '@/components/enkamba-logo';

const MbongoLogoIcon = () => (
  <div className="flex items-center justify-center">
    <div className="size-16 bg-primary rounded-full shadow-inner" />
    <div className="size-12 -ml-6 bg-accent rounded-full ring-4 ring-background" />
  </div>
);

const UgaviLogoIcon = () => <Navigation className="h-16 w-16 transform -rotate-45" />;

const solutions = [
  {
    title: 'Mbongo.io',
    subtitle: 'Finance Intégrée',
    description:
      "Votre portefeuille tout-en-un pour les transactions, l'épargne, le crédit et le change. Gérez tous vos besoins financiers depuis une seule application sécurisée et intuitive.",
    icon: MbongoLogoIcon,
    href: '/dashboard/mbongo-dashboard',
    color: 'bg-primary',
  },
  {
    title: 'Nkampa',
    subtitle: 'E-commerce',
    description:
      "La place de marché pour acheter et vendre des produits en toute confiance. Profitez d'une expérience d'achat en ligne fluide et sécurisée, connectée à votre portefeuille Mbongo.",
    icon: ShoppingCart,
    href: '/dashboard/nkampa',
    color: 'bg-primary',
  },
  {
    title: 'Miyiki-Chat',
    subtitle: 'Messagerie Unifiée',
    description:
      "Communiquez, collaborez et interagissez avec les services clients et les autres utilisateurs de l'écosystème. Une messagerie centralisée pour rester connecté.",
    icon: MessageSquare,
    href: '/dashboard/miyiki-chat',
    color: 'bg-primary',
  },
  {
    title: 'Ugavi',
    subtitle: 'Logistique Intelligente',
    description:
      "Suivez vos colis, gérez vos livraisons et optimisez votre chaîne d'approvisionnement grâce à notre solution logistique intégrée à l'écosystème eNkamba.",
    icon: UgaviLogoIcon,
    href: '/dashboard/ugavi',
    color: 'bg-primary',
  },
  {
    title: 'eNkamba.ai',
    subtitle: 'Assistant Intelligent',
    description:
      "Votre assistant personnel basé sur l'IA pour analyser vos finances, obtenir des recommandations personnalisées et interagir avec tous les services de l'écosystème.",
    icon: Bot,
    href: '/dashboard/ai',
    color: 'bg-primary',
  },
  {
    title: 'Makutano',
    subtitle: 'Social & Communauté',
    description:
      "Rejoignez des groupes de tontine, participez à des projets communautaires et connectez-vous avec d'autres membres de la diaspora et de la RDC.",
    icon: Users,
    href: '/dashboard/makutano',
    color: 'bg-primary',
  },
];

export default function EcosystemPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="container mx-auto flex items-center justify-center">
            <EnkambaLogo className="w-48"/>
        </div>
      </header>

      <Carousel setApi={setApi} className="h-full w-full">
        <CarouselContent>
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <CarouselItem key={index}>
                <div className={cn("flex h-screen w-screen items-center justify-center p-4 text-white", solution.color)}>
                    <div className="absolute inset-0 z-0 h-full w-full scale-150 blur-3xl bg-accent opacity-20"></div>
                    <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
                        
                        <div>
                             <Icon className="h-20 w-20" />
                        </div>
                       
                        <div className="mt-4">
                            <h1 className="font-headline text-5xl font-bold tracking-tighter">
                                {solution.title}
                            </h1>
                            <p className="text-xl text-white/80">{solution.subtitle}</p>
                        </div>

                        <p className="text-white/90 mt-6">
                            {solution.description}
                        </p>

                        <div className="w-full space-y-4 pt-6">
                             <Button asChild size="lg" className="w-full h-14 text-lg font-bold shadow-lg transition-transform duration-300 hover:scale-105 bg-accent text-accent-foreground">
                                <Link href={solution.href}>Commencer</Link>
                            </Button>
                            <div className="text-center">
                                <span className="text-white/60 text-sm">Déjà membre ? </span>
                                <Button asChild variant="link" className="text-white font-bold p-0">
                                    <Link href="/login">Se Connecter</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="hidden md:block">
            <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 text-white border-white/30 hover:bg-white/30" />
            <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 text-white border-white/30 hover:bg-white/30" />
        </div>
      </Carousel>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {solutions.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              current === index ? "w-6 bg-white" : "bg-white/50 hover:bg-white/75"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
