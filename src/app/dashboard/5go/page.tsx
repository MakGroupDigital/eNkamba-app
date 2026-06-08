'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiveGoBusIcon, FiveGoFlightIcon, FiveGoHotelIcon, FiveGoIcon } from '@/components/icons/service-icons';

const fiveGoServices = [
  {
    title: 'Hôtels',
    description: 'Réserver un hôtel et confirmer le séjour.',
    icon: FiveGoHotelIcon,
    href: '/dashboard/hotels',
  },
  {
    title: "Billets d'avion",
    description: 'Rechercher un vol et acheter un billet.',
    icon: FiveGoFlightIcon,
    href: '/dashboard/flights',
  },
  {
    title: 'Billet de bus',
    description: 'Réserver un trajet et acheter un ticket.',
    icon: FiveGoBusIcon,
    href: '/dashboard/pay-bill?type=bus',
  },
];

export default function FiveGoPage() {
  return (
    <div className="min-h-screen bg-[#32BB78]">
      <div className="mx-auto max-w-4xl space-y-5 p-4">
        <header className="relative overflow-hidden rounded-[1.75rem] bg-[#32BB78] p-5 text-white shadow-lg shadow-[#32BB78]/20">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18">
              <FiveGoIcon size={32} />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold">5go</h1>
              <p className="text-sm text-white/80">Voyage, séjour et réservation dans un seul espace.</p>
            </div>
          </div>
        </header>

        <Card className="overflow-hidden rounded-2xl border-[#32BB78]">
          <CardHeader className="bg-gradient-to-r from-[#32BB78]/10 to-transparent">
            <CardTitle className="font-headline flex items-center gap-2 text-foreground">
              <span className="h-2 w-2 rounded-full bg-[#32BB78]" />
              Services 5go
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {fiveGoServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Link
                    href={service.href}
                    key={service.title}
                    className="group flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-4 text-center text-sm font-medium text-foreground transition-all duration-300 hover:scale-[1.02] hover:border-[#32BB78]/30 hover:shadow-md"
                  >
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      <IconComponent size={40} />
                    </div>
                    <span className="text-center text-xs font-bold leading-tight">{service.title}</span>
                    <span className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{service.description}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
