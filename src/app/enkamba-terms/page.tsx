'use client';

import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const sections = [
  {
    title: '1. Acceptation',
    text: 'En utilisant eNkamba, vous acceptez les présentes conditions. Elles encadrent l’accès aux apps de chat, marché, paiement, logistique, réseau social, IA, comptes professionnels et services associés.',
  },
  {
    title: '2. Compte utilisateur',
    text: 'Chaque utilisateur doit fournir des informations exactes. Certaines opérations sensibles peuvent demander une vérification KYC, un PIN, une biométrie ou une validation supplémentaire.',
  },
  {
    title: '3. Paiements et wallet',
    text: 'Les opérations financières doivent être autorisées par le propriétaire du compte. Les transactions, reçus, litiges, remboursements et contrôles antifraude peuvent être journalisés pour protéger les utilisateurs.',
  },
  {
    title: '4. Marché et vendeurs',
    text: 'Les vendeurs, fournisseurs et entreprises sont responsables des produits, prix, stocks, délais, garanties et informations publiées. eNkamba peut contrôler ou suspendre les comptes suspects.',
  },
  {
    title: '5. Logistique',
    text: 'Les expéditions, agences, relais, livreurs et codes de suivi doivent respecter les règles de déclaration, sécurité, douane, preuve de livraison et traçabilité.',
  },
  {
    title: '6. Communication et contenu',
    text: 'Les messages, publications, médias, appels et commentaires doivent respecter les autres utilisateurs. Les contenus frauduleux, illicites, violents, haineux ou trompeurs peuvent être supprimés.',
  },
  {
    title: '7. Sécurité',
    text: 'Vous ne devez pas partager votre PIN, OTP, QR sensible ou accès au compte. Toute tentative d’accès non autorisé, fraude, usurpation ou abus peut entraîner une restriction ou suspension.',
  },
  {
    title: '8. Disponibilité',
    text: 'eNkamba cherche à maintenir un service stable, mais certaines fonctionnalités peuvent dépendre du réseau, des partenaires, des services de paiement, de la localisation ou des infrastructures externes.',
  },
  {
    title: '9. Modification des conditions',
    text: 'Les conditions peuvent évoluer avec les modules et obligations légales. La version publiée dans l’application est celle applicable au moment de l’utilisation.',
  },
];

export default function EnkambaTermsPage() {
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
            <h1 className="text-xl font-black">Conditions d’utilisation</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="overflow-hidden rounded-2xl border-primary/15">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl bg-primary p-5 text-white">
              <FileText className="mb-3 h-8 w-8" />
              <h2 className="text-2xl font-black">Utiliser eNkamba avec responsabilité</h2>
              <p className="mt-2 text-sm text-white/80">
                Ces conditions expliquent les règles générales d’utilisation de la plateforme numérique intégrée eNkamba.
              </p>
            </div>

            {sections.map((section) => (
              <section key={section.title} className="rounded-xl border bg-white p-4">
                <h3 className="text-base font-black">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
              </section>
            ))}

            <section className="rounded-xl border bg-white p-4">
              <h3 className="text-base font-black">Contact</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pour toute question liée aux conditions d’utilisation, contactez le support eNkamba depuis l’application ou via les canaux officiels communiqués par la plateforme.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
