'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Watch, 
  Gem, 
  Smartphone,
  Zap,
  Lock,
  Wifi,
  AlertCircle,
  Clock,
  Smartphone as SmartbandIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function WearablesPage() {
  const router = useRouter();

  const wearableFeatures = [
    {
      icon: Watch,
      title: 'Paiements par Smartwatch',
      description: 'Payez directement depuis votre montre intelligente',
      status: 'En cours de développement',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Gem,
      title: 'Anneau de Paiement NFC',
      description: 'Anneau eNkamba pour paiements sans contact',
      status: 'En cours de développement',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: SmartbandIcon,
      title: 'Notifications Smartband',
      description: 'Recevez les alertes sur votre bracelet connecté',
      status: 'En cours de développement',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Wifi,
      title: 'Synchronisation Automatique',
      description: 'Tous vos appareils synchronisés en temps réel',
      status: 'En cours de développement',
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-500/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Wearables & IoT
            </h1>
            <p className="text-sm text-muted-foreground">Paiements sur vos appareils connectés</p>
          </div>
        </header>

        {/* Status Banner */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Fonctionnalité en cours de développement</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Cette fonctionnalité révolutionnaire est actuellement en développement. Elle sera disponible très bientôt pour transformer votre expérience de paiement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wearableFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-purple-400 transition-colors overflow-hidden">
                <CardHeader className={`bg-gradient-to-r ${feature.color} text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className="w-8 h-8" />
                      <div>
                        <CardTitle className="text-white">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-700 font-semibold">{feature.status}</span>
                  </div>
                  <Button disabled className="w-full" variant="outline">
                    Bientôt disponible
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Description */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Fonctionnalités Incluses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-sm">Paiements par Smartwatch</h4>
                  <p className="text-sm text-muted-foreground">Payez directement depuis votre montre intelligente sans sortir votre téléphone</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-sm">Anneau de Paiement NFC</h4>
                  <p className="text-sm text-muted-foreground">Anneau eNkamba pour paiements sans contact ultra-rapides et sécurisés</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-sm">Notifications Smartband</h4>
                  <p className="text-sm text-muted-foreground">Recevez les alertes de transactions directement sur votre bracelet connecté</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-sm">Synchronisation Automatique</h4>
                  <p className="text-sm text-muted-foreground">Tous vos appareils (montre, anneau, bracelet) synchronisés en temps réel</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-sm">Sécurité Biométrique</h4>
                  <p className="text-sm text-muted-foreground">Authentification par empreinte digitale ou reconnaissance faciale sur vos wearables</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-sm">Historique Intégré</h4>
                  <p className="text-sm text-muted-foreground">Consultez votre historique de transactions directement sur votre wearable</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              Sécurité & Confidentialité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Tous les paiements par wearables utilisent le chiffrement de niveau bancaire et la technologie NFC sécurisée.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Authentification biométrique obligatoire</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Limite de paiement configurable par appareil</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Notifications instantanées de chaque transaction</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Blocage à distance en cas de perte</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <div className="text-center py-8">
          <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200">
            <p className="text-sm font-semibold text-purple-900">
              🚀 Disponible très bientôt - Restez connecté!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
