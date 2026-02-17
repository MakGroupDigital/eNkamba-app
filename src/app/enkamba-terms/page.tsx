'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EnkambaTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Conditions d\'utilisation - eNKAMBA</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">Informations sur l\'entreprise</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Nom:</strong> Guangzhou eNKAMBA International Company CO., Ltd</p>
                <p><strong>Localisation:</strong> Guangzhou, Chine</p>
                <p><strong>Secteur:</strong> Plateforme ecommerce B2B</p>
                <p><strong>Service:</strong> Plateforme de vente en ligne pour partenaires établissements</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptation des conditions</h2>
              <p className="text-gray-700">
                En accédant et en utilisant la plateforme eNKAMBA, vous acceptez d\'être lié par ces conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser cette plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Utilisation de la plateforme</h2>
              <p className="text-gray-700 mb-3">
                La plateforme eNKAMBA est réservée aux partenaires établissements autorisés. Vous acceptez d\'utiliser cette plateforme uniquement à des fins commerciales légales.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Respecter toutes les lois et réglementations applicables</li>
                <li>Ne pas accéder à la plateforme de manière non autorisée</li>
                <li>Ne pas transmettre de virus ou de code malveillant</li>
                <li>Maintenir l\'intégrité des données de la plateforme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Comptes partenaires</h2>
              <p className="text-gray-700">
                Chaque partenaire est responsable de maintenir la confidentialité de ses identifiants de connexion. Vous acceptez d\'être responsable de toutes les activités qui se produisent sous votre compte partenaire.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Types de partenaires</h2>
              <p className="text-gray-700 mb-3">eNKAMBA propose quatre types de partenariats:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Détaillant:</strong> Vente au détail avec commission standard</li>
                <li><strong>Grossiste:</strong> Vente en gros avec tarifs préférentiels</li>
                <li><strong>Producteur:</strong> Vente directe de produits manufacturés</li>
                <li><strong>Fournisseur:</strong> Approvisionnement en gros pour autres partenaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Frais et commissions</h2>
              <p className="text-gray-700">
                Les frais de commission sont déterminés selon votre type de partenariat et votre catégorie de produits. Les frais sont prélevés automatiquement sur chaque vente. Un relevé détaillé est fourni mensuellement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Propriété intellectuelle</h2>
              <p className="text-gray-700">
                Tout le contenu de la plateforme eNKAMBA, y compris les textes, images et logos, est la propriété de Guangzhou eNKAMBA International Company CO., Ltd et est protégé par les lois sur les droits d\'auteur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Limitation de responsabilité</h2>
              <p className="text-gray-700">
                eNKAMBA ne sera pas responsable des dommages indirects, accidentels ou consécutifs résultant de votre utilisation de la plateforme ou de l\'incapacité à l\'utiliser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Modifications des conditions</h2>
              <p className="text-gray-700">
                Guangzhou eNKAMBA International Company CO., Ltd se réserve le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur dès leur publication.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Droit applicable</h2>
              <p className="text-gray-700">
                Ces conditions sont régies par les lois de la République Populaire de Chine et vous acceptez la juridiction exclusive des tribunaux compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
              <p className="text-gray-700">
                Pour toute question concernant ces conditions, veuillez contacter:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-1 text-sm">
                <p><strong>Email:</strong> support@enkamba.com</p>
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
