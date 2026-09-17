'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EnkambaCookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Politique relative aux cookies - KENZ</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Qu\'est-ce qu\'un cookie?</h2>
              <p className="text-gray-700">
                Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez la plateforme KENZ. Les cookies nous aident à reconnaître votre appareil et à améliorer votre expérience de navigation sur notre plateforme ecommerce.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Types de cookies utilisés par KENZ</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Cookies essentiels</h3>
                  <p className="text-gray-700">
                    Ces cookies sont nécessaires au fonctionnement de la plateforme KENZ. Ils incluent les cookies de session, les cookies d\'authentification et les cookies de sécurité pour protéger votre compte partenaire.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Cookies de performance</h3>
                  <p className="text-gray-700">
                    Ces cookies nous aident à comprendre comment vous utilisez la plateforme KENZ et à améliorer ses performances. Ils collectent des données anonymes sur l\'utilisation.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Cookies de fonctionnalité</h3>
                  <p className="text-gray-700">
                    Ces cookies mémorisent vos préférences et vos choix pour personnaliser votre expérience sur la plateforme ecommerce KENZ.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Cookies de marketing</h3>
                  <p className="text-gray-700">
                    Ces cookies suivent votre activité pour vous afficher des publicités et des offres pertinentes. Vous pouvez les désactiver à tout moment dans vos préférences.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Cookies tiers</h2>
              <p className="text-gray-700">
                Nous utilisons également des cookies tiers de services comme Google Analytics pour analyser le trafic de la plateforme KENZ et améliorer nos services. Ces services peuvent avoir leurs propres politiques de confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Comment contrôler les cookies</h2>
              <p className="text-gray-700 mb-3">Vous pouvez contrôler les cookies de plusieurs façons:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Modifier les paramètres de votre navigateur pour refuser les cookies</li>
                <li>Supprimer les cookies existants de votre appareil</li>
                <li>Utiliser les outils de gestion des cookies sur la plateforme KENZ</li>
                <li>Vous désabonner des cookies de marketing</li>
                <li>Utiliser le mode de navigation privée de votre navigateur</li>
              </ul>
              <p className="text-gray-700 mt-4 text-sm">
                Veuillez noter que désactiver certains cookies peut affecter la fonctionnalité de la plateforme KENZ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Cookies spécifiques utilisés par KENZ</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">_enkamba_session</p>
                  <p className="text-sm text-gray-600">Identifie votre session utilisateur partenaire</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">_enkamba_auth</p>
                  <p className="text-sm text-gray-600">Authentification sécurisée du compte partenaire</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">_ga</p>
                  <p className="text-sm text-gray-600">Google Analytics - suivi du trafic de la plateforme</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">_enkamba_preferences</p>
                  <p className="text-sm text-gray-600">Vos préférences de plateforme ecommerce</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">_enkamba_cart</p>
                  <p className="text-sm text-gray-600">Contenu du panier d\'achat</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">_enkamba_language</p>
                  <p className="text-sm text-gray-600">Préférence de langue sélectionnée</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Durée de conservation</h2>
              <p className="text-gray-700">
                La plupart des cookies KENZ expirent après une période définie (généralement 30 jours à 1 an). Les cookies de session expirent à la fermeture de votre navigateur. Vous pouvez les supprimer manuellement à tout moment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Consentement aux cookies</h2>
              <p className="text-gray-700">
                Lors de votre première visite sur la plateforme KENZ, nous vous demandons de consentir à l\'utilisation de cookies. Vous pouvez modifier vos préférences à tout moment dans les paramètres de votre compte partenaire.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Conformité RGPD</h2>
              <p className="text-gray-700">
                Guangzhou KENZ International Company CO., Ltd respecte le Règlement Général sur la Protection des Données (RGPD) concernant l\'utilisation des cookies. Nous obtenons votre consentement explicite avant d\'utiliser des cookies non essentiels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Modifications de cette politique</h2>
              <p className="text-gray-700">
                Nous pouvons mettre à jour cette politique relative aux cookies de temps en temps. Les modifications entreront en vigueur dès leur publication sur la plateforme KENZ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
              <p className="text-gray-700">
                Si vous avez des questions concernant cette politique relative aux cookies, veuillez nous contacter:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-1 text-sm">
                <p><strong>Email:</strong> privacy@enkamba.com</p>
                <p><strong>Téléphone:</strong> +33 (0)1 XX XX XX XX</p>
                <p><strong>Adresse:</strong> Guangzhou, Chine</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
