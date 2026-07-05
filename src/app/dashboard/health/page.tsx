'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HealthDoctorIcon,
  HealthEmergencyIcon,
  HealthHospitalIcon,
  HealthIcon,
  HealthPharmacyIcon,
  HealthTeleconsultIcon,
  MapPinIcon,
} from '@/components/icons/service-icons';

const healthSections = [
  {
    title: 'Urgence',
    description: 'Ambulance, aide rapide et orientation.',
    icon: HealthEmergencyIcon,
    href: '/dashboard/health?section=urgence',
  },
  {
    title: 'Hôpitaux',
    description: 'Structures proches et services disponibles.',
    icon: HealthHospitalIcon,
    href: '/dashboard/health?section=hopitaux',
  },
  {
    title: 'Médecin',
    description: 'Rendez-vous généraliste ou spécialiste.',
    icon: HealthDoctorIcon,
    href: '/dashboard/health?section=medecin',
  },
  {
    title: 'Pharmacie',
    description: 'Recherche, réservation et commande.',
    icon: HealthPharmacyIcon,
    href: '/dashboard/health?section=pharmacie',
  },
  {
    title: 'Téléconsultation',
    description: 'Consultation médicale à distance.',
    icon: HealthTeleconsultIcon,
    href: '/dashboard/health?section=teleconsultation',
  },
];

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-[#479B67]">
      <div className="mx-auto max-w-4xl space-y-5 p-4">
        <header className="rounded-[1.75rem] bg-[#479B67] p-5 text-white shadow-lg shadow-[#479B67]/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18">
              <HealthIcon size={32} />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold">Santé</h1>
              <p className="text-sm text-white/80">Urgences, hôpitaux, médecins et pharmacies.</p>
            </div>
          </div>
        </header>

        <Card className="overflow-hidden rounded-2xl border-[#479B67]">
          <CardHeader className="bg-gradient-to-r from-[#479B67]/10 to-transparent">
            <CardTitle className="font-headline flex items-center gap-2 text-foreground">
              <span className="h-2 w-2 rounded-full bg-[#479B67]" />
              Services santé
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {healthSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <Link
                    href={section.href}
                    key={section.title}
                    className="group flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-4 text-center text-sm font-medium text-foreground transition-all duration-300 hover:scale-[1.02] hover:border-[#479B67]/30 hover:shadow-md"
                  >
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      <IconComponent size={38} />
                    </div>
                    <span className="text-center text-xs font-bold leading-tight">{section.title}</span>
                    <span className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{section.description}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#479B67]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <MapPinIcon size={24} />
              </div>
              <div>
                <p className="font-semibold">Services proches de vous</p>
                <p className="text-sm text-muted-foreground">La localisation permettra d’afficher les structures médicales les plus proches.</p>
              </div>
            </div>
            <Button className="rounded-full bg-[#479B67] hover:bg-[#479B67]">
              <MapPin className="mr-2 h-4 w-4" />
              Activer la position
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
