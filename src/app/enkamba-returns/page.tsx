'use client';

import { ArrowLeft, CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EnkambaReturnsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Politique de Retours - eNKAMBA</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/10 border-primary/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Politique de retours eNKAMBA</h2>
            <p className="text-gray-700">
              Guangzhou eNKAMBA International Company CO., Ltd offre une politique de retours flexible pour tous les partenaires établissements et leurs clients.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex gap-4 mb-6">
              <Clock className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Délai de retour</h3>
                <p className="text-gray-700">
                  Les clients ont <strong>30 jours</strong> à partir de la date de livraison pour retourner un produit. Les partenaires établissements peuvent proposer des délais plus longs selon leur politique commerciale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6">Conditions de retour</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Le produit doit être dans son état original et non utilisé</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Tous les accessoires et emballages d\'origine doivent être inclus</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Aucun signe d\'usure, de dommage ou de manipulation</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Le reçu ou le numéro de commande eNKAMBA doit être fourni</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Le produit doit être retourné dans son emballage d\'origine</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6">Processus de retour eNKAMBA</h3>
            <div className="space-y-6">
              {[
                { step: 1, title: 'Initier le retour', desc: 'Contactez le partenaire établissements ou eNKAMBA avec votre numéro de commande' },
                { step: 2, title: 'Recevoir l\'étiquette', desc: 'Vous recevrez une étiquette de retour gratuite par email dans les 24 heures' },
                { step: 3, title: 'Expédier le produit', desc: 'Emballez le produit et utilisez l\'étiquette fournie pour l\'expédier' },
                { step: 4, title: 'Inspection', desc: 'Notre équipe inspecte le produit à la réception' },
                { step: 5, title: 'Remboursement', desc: 'Une fois approuvé, vous serez remboursé dans 5-7 jours ouvrables' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-8">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-3">Articles non retournables</h3>
                <ul className="space-y-2 text-orange-800 text-sm">
                  <li>• Articles personnalisés ou sur commande</li>
                  <li>• Produits numériques ou téléchargés</li>
                  <li>• Articles endommagés par le client</li>
                  <li>• Produits sans emballage d\'origine</li>
                  <li>• Articles utilisés ou portés</li>
                  <li>• Produits périssables ou consommables</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4">Remboursement</h3>
            <p className="text-gray-700 mb-4">
              Les remboursements incluent le prix du produit. Les frais de livraison originaux ne sont pas remboursés, sauf en cas d\'erreur de notre part ou du partenaire établissements.
            </p>
            <p className="text-gray-700 mb-4">
              Les remboursements sont traités sur le compte ou la méthode de paiement d\'origine dans un délai de 5 à 7 jours ouvrables après approbation.
            </p>
            <p className="text-gray-700">
              Pour les partenaires établissements, les remboursements sont crédités directement sur votre compte eNKAMBA.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/10 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Des questions sur les retours?</h2>
            <p className="text-gray-600 mb-6">
              Contactez notre équipe de support eNKAMBA pour toute assistance.
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
