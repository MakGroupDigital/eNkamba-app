'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, MessageCircle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { HelpIcon } from '@/components/icons/service-icons';

const faqs = [
  {
    category: "Compte",
    questions: [
      {
        q: "Comment créer un compte eNkamba ?",
        a: "Pour créer un compte, rendez-vous sur la page d'inscription et remplissez le formulaire avec vos informations. Vous devrez ensuite compléter la vérification KYC.",
      },
      {
        q: "Comment réinitialiser mon mot de passe ?",
        a: "Allez dans Paramètres > Sécurité & Mot de passe et cliquez sur 'Changer le mot de passe'. Vous pouvez aussi utiliser la fonctionnalité 'Mot de passe oublié' sur la page de connexion.",
      },
    ],
  },
  {
    category: "Paiements",
    questions: [
      {
        q: "Comment envoyer de l'argent ?",
        a: "Allez dans Mbongo > Envoi, sélectionnez le type de destinataire (Mbongo, Mobile Money, Banque, International), entrez les détails et confirmez la transaction.",
      },
      {
        q: "Quelles devises sont supportées ?",
        a: "eNkamba supporte toutes les devises principales, avec conversion automatique. Les devises principales sont CDF, USD et EUR.",
      },
    ],
  },
  {
    category: "Sécurité",
    questions: [
      {
        q: "Mon compte est-il sécurisé ?",
        a: "Oui, eNkamba utilise un chiffrement de niveau bancaire et des protocoles de sécurité avancés pour protéger vos données et transactions.",
      },
      {
        q: "Comment activer l'authentification à deux facteurs ?",
        a: "Allez dans Paramètres > Sécurité & Mot de passe et activez l'authentification à deux facteurs (2FA) dans la section dédiée.",
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <HelpIcon size={28} />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold text-primary">Centre d'aide</h1>
            <p className="text-sm text-muted-foreground">Trouvez des réponses à vos questions</p>
          </div>
        </div>
      </header>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold mb-1">Chat en direct</p>
            <p className="text-xs text-muted-foreground">Disponible 24/7</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold mb-1">Email</p>
            <p className="text-xs text-muted-foreground">support@enkamba.io</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold mb-1">Téléphone</p>
            <p className="text-xs text-muted-foreground">+243 XXX XXX XXX</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <div className="space-y-6">
        <h2 className="font-headline text-xl font-bold">Questions fréquentes</h2>
        {filteredFAQs.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="font-headline">{category.category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.questions.map((faq, index) => {
                const globalIndex = categoryIndex * 100 + index;
                const isExpanded = expandedIndex === globalIndex;
                return (
                  <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                      className="w-full text-left"
                    >
                      <p className="font-semibold hover:text-primary transition-colors">
                        {faq.q}
                      </p>
                    </button>
                    {isExpanded && (
                      <p className="text-sm text-muted-foreground mt-2 pl-4 border-l-2 border-primary">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQs.length === 0 && searchQuery && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Aucun résultat trouvé pour "{searchQuery}". Essayez avec d'autres mots-clés.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
