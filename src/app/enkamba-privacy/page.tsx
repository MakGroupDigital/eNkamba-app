'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EnkambaPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Politique de confidentialité - eNKAMBA</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-gray-700">
                Guangzhou eNKAMBA International Company CO., Ltd s\'engage à protéger la vie privée de ses partenaires établissements. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles et commerciales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Informations collectées</h2>
              <p className="text-gray-700 mb-3">Nous collectons les informations suivantes:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Informations de compte partenaire (nom, email, téléphone)</li>
                <li>Informations commerciales (SIRET, numéro de TVA, secteur d\'activité)</li>
                <li>Informations de paiement (coordonnées bancaires, adresse de facturation)</li>
                <li>Données de ventes et d\'inventaire</li>
                <li>Historique de transactions et de commandes</li>
                <li>Données de localisation (si autorisé)</li>
                <li>Informations de communication (messages, tickets support)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Utilisation des informations</h2>
              <p className="text-gray-700 mb-3">Nous utilisons vos informations pour:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Gérer votre compte partenaire et vos ventes</li>
                <li>Traiter les paiements et les commissions</li>
                <li>Vous envoyer des rapports et des analyses</li>
                <li>Améliorer nos services ecommerce</li>
                <li>Vous envoyer des offres et des promotions partenaires</li>
                <li>Prévenir la fraude et les abus</li>
                <li>Respecter les obligations légales et réglementaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Partage des informations</h2>
              <p className="text-gray-700">
                Nous ne vendons pas vos informations. Nous pouvons partager vos informations avec:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3">
                <li>Nos partenaires logistiques pour traiter les livraisons</li>
                <li>Nos prestataires de paiement pour traiter les transactions</li>
                <li>Les autorités légales si requis par la loi</li>
                <li>Nos sous-traitants pour l\'amélioration des services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Sécurité des données</h2>
              <p className="text-gray-700">
                Guangzhou eNKAMBA International Company CO., Ltd utilise des mesures de sécurité appropriées pour protéger vos informations contre l\'accès non autorisé, la modification ou la destruction. Nous utilisons le chiffrement SSL et les protocoles de sécurité standards de l\'industrie.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cookies et technologies de suivi</h2>
              <p className="text-gray-700">
                Notre plateforme utilise des cookies pour améliorer votre expérience. Vous pouvez contrôler les cookies via les paramètres de votre navigateur. Nous utilisons également des technologies de suivi pour analyser l\'utilisation de la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Vos droits</h2>
              <p className="text-gray-700 mb-3">Vous avez le droit de:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Accéder à vos informations personnelles</li>
                <li>Corriger les informations inexactes</li>
                <li>Demander la suppression de vos données</li>
                <li>Vous opposer au traitement de vos données</li>
                <li>Retirer votre consentement à tout moment</li>
                <li>Obtenir une copie de vos données</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Rétention des données</h2>
              <p className="text-gray-700">
                Nous conservons vos informations aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Vous pouvez demander la suppression de vos données à tout moment, sous réserve des obligations légales de conservation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Conformité RGPD</h2>
              <p className="text-gray-700">
                eNKAMBA respecte le Règlement Général sur la Protection des Données (RGPD) et les lois de protection des données applicables. Nous avons mis en place des mesures appropriées pour assurer la conformité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
              <p className="text-gray-700">
                Pour toute question concernant cette politique de confidentialité, veuillez nous contacter:
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
