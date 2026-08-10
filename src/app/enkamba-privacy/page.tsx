'use client';

import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const sections = [
  {
    title: '1. Données collectées',
    text: 'eNkamba peut collecter les informations de compte, téléphone, email, profil, localisation autorisée, KYC, documents, transactions, commandes, colis, messages, appels, appareils et journaux de sécurité.',
  },
  {
    title: '2. Utilisation',
    text: 'Ces données servent à authentifier les utilisateurs, sécuriser les paiements, traiter les commandes, suivre les colis, afficher les contacts, fournir le chat, améliorer l’IA et prévenir la fraude.',
  },
  {
    title: '3. KYC et sécurité',
    text: 'Les documents d’identité, selfies et contrôles biométriques sont utilisés pour vérifier l’identité, protéger les comptes et respecter les obligations de conformité. Ils ne doivent pas être affichés publiquement.',
  },
  {
    title: '4. Localisation',
    text: 'La localisation peut être utilisée pour les services proches, la logistique, les cartes, les agences, la sécurité et certaines fonctions sociales. L’utilisateur peut gérer les autorisations depuis son appareil.',
  },
  {
    title: '5. Paiement',
    text: 'Les données financières sont traitées pour exécuter les transactions, générer les reçus, gérer les litiges, les limites, les audits et les alertes antifraude.',
  },
  {
    title: '6. Partage contrôlé',
    text: 'Certaines informations peuvent être partagées avec les partenaires nécessaires au service : paiement, livraison, agence, support, conformité ou obligation légale. eNkamba ne vend pas les données personnelles.',
  },
  {
    title: '7. Conservation',
    text: 'Les données sont conservées selon leur utilité, la sécurité du compte, les obligations légales, financières, logistiques et les besoins d’audit.',
  },
  {
    title: '8. Droits utilisateur',
    text: 'L’utilisateur peut demander l’accès, la correction ou la suppression de ses données lorsque cela est compatible avec les obligations légales, financières et de sécurité.',
  },
];

export default function EnkambaPrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/login">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">eNkamba</p>
            <h1 className="text-xl font-black">Politique de confidentialité</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="overflow-hidden rounded-2xl border-primary/15">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl bg-primary p-5 text-white">
              <ShieldCheck className="mb-3 h-8 w-8" />
              <h2 className="text-2xl font-black">Protection des données eNkamba</h2>
              <p className="mt-2 text-sm text-white/80">
                Cette politique explique comment la plateforme protège les informations utilisées par ses apps.
              </p>
            </div>

            {sections.map((section) => (
              <section key={section.title} className="rounded-xl border bg-white p-4">
                <h3 className="text-base font-black">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
              </section>
            ))}

            <section className="rounded-xl border bg-white p-4">
              <h3 className="text-base font-black">Contact confidentialité</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pour toute demande liée aux données personnelles, utilisez le support intégré ou les canaux officiels eNkamba.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
