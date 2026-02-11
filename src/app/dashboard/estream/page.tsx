'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, Video, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EStreamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-40">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-primary/10">
        <div className="container mx-auto max-w-2xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-headline text-2xl font-bold text-primary">eStream</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
        {/* Coming Soon Banner */}
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 rounded-full" />
                <div className="relative bg-primary/20 rounded-full p-6">
                  <Video className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary">Fonctionnalité en Développement</h2>
              <p className="text-muted-foreground">eStream arrive bientôt avec des innovations révolutionnaires</p>
            </div>
          </CardContent>
        </Card>

        {/* Innovations Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Innovations eStream
          </h3>

          <div className="grid gap-4">
            {/* Innovation 1 */}
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-lg p-3 flex-shrink-0">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground">Streaming Vidéo en Direct</h4>
                    <p className="text-sm text-muted-foreground">
                      Diffusez vos moments en direct avec vos amis et la communauté eNkamba en temps réel
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Innovation 2 */}
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/20 rounded-lg p-3 flex-shrink-0">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground">Communauté Interactive</h4>
                    <p className="text-sm text-muted-foreground">
                      Interagissez avec les créateurs via des commentaires, réactions et partages instantanés
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Innovation 3 */}
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/20 rounded-lg p-3 flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground">Monétisation pour Créateurs</h4>
                    <p className="text-sm text-muted-foreground">
                      Gagnez de l'argent avec vos vidéos grâce aux dons, abonnements et partenariats
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Innovation 4 */}
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 rounded-lg p-3 flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground">Découverte Intelligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Algorithme IA qui recommande les vidéos basées sur vos intérêts et préférences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Innovation 5 */}
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 rounded-lg p-3 flex-shrink-0">
                    <Video className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground">Édition Avancée</h4>
                    <p className="text-sm text-muted-foreground">
                      Outils de montage intégrés avec filtres, effets et musique libre de droits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline Section */}
        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Feuille de Route</h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="w-0.5 h-12 bg-primary/30" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Phase 1: Fondations</p>
                  <p className="text-xs text-muted-foreground">Upload et lecture vidéo optimisée</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary/50" />
                  <div className="w-0.5 h-12 bg-primary/30" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Phase 2: Communauté</p>
                  <p className="text-xs text-muted-foreground">Commentaires, likes et partages</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary/30" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Phase 3: Monétisation</p>
                  <p className="text-xs text-muted-foreground">Système de revenus pour créateurs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">
              Soyez parmi les premiers à découvrir eStream. Restez connecté pour les mises à jour !
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/dashboard/mbongo-dashboard">
                Retour au Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
