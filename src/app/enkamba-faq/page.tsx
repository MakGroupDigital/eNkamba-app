'use client';

import { useState } from 'react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EnkambaFAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const faqs = [
    {
      question: 'Qu\'est-ce que la plateforme KENZ?',
      answer: 'KENZ est une plateforme ecommerce innovante développée par Guangzhou KENZ International Company CO., Ltd. Elle permet aux établissements et partenaires commerciaux de vendre leurs produits en ligne avec une portée mondiale.',
    },
    {
      question: 'Comment devenir partenaire KENZ?',
      answer: 'Pour devenir partenaire, contactez notre équipe commerciale. Nous proposons différents types de partenariats: Détaillant, Grossiste, Producteur et Fournisseur. Chaque type offre des avantages spécifiques adaptés à votre activité.',
    },
    {
      question: 'Quels sont les frais de commission?',
      answer: 'Les frais de commission varient selon votre type de partenariat et votre catégorie de produits. Contactez notre équipe pour obtenir un devis personnalisé basé sur votre volume de ventes.',
    },
    {
      question: 'Comment fonctionne le système de paiement?',
      answer: 'KENZ propose un système de paiement sécurisé avec plusieurs options: cartes de crédit, virements bancaires, portefeuilles numériques et paiements mobiles. Les paiements sont traités en temps réel.',
    },
    {
      question: 'Quel est le délai de livraison?',
      answer: 'Les délais de livraison dépendent de votre localisation et du type de produit. En général, les commandes sont livrées entre 2 à 7 jours ouvrables. Vous pouvez suivre votre commande en temps réel.',
    },
    {
      question: 'Comment gérer mon inventaire?',
      answer: 'Notre tableau de bord partenaire vous permet de gérer votre inventaire en temps réel, de mettre à jour les prix, de suivre les ventes et de générer des rapports détaillés.',
    },
    {
      question: 'Quel support client est disponible?',
      answer: 'Nous offrons un support client 24/7 en plusieurs langues. Vous pouvez nous contacter par email, téléphone ou chat en direct. Notre équipe répond généralement dans les 2 heures.',
    },
    {
      question: 'Comment puis-je augmenter mes ventes?',
      answer: 'KENZ propose des outils marketing intégrés: promotions, publicités ciblées, programmes de fidélité et analytics détaillées pour optimiser vos ventes.',
    },
  ];

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Questions Fréquemment Posées - KENZ</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-gray-600 text-lg">
            Trouvez les réponses aux questions les plus courantes sur nos services ecommerce pour partenaires établissements.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-left font-semibold text-gray-900">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    openItems.includes(index) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openItems.includes(index) && (
                <CardContent className="px-6 py-4 bg-gray-50 border-t">
                  <p className="text-gray-700">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Vous n\'avez pas trouvé votre réponse?</h2>
            <p className="text-gray-600 mb-6">
              Notre équipe de support KENZ est disponible 24/7 pour vous aider.
            </p>
            <a href="mailto:support@enkamba.com">
              <Button className="bg-primary hover:bg-primary/90">
                Contacter le support
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
