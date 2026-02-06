'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Sparkles, Lock, Rocket, Target, PiggyBank, LineChart, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function InvestPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const investmentOptions = [
    {
      icon: PiggyBank,
      title: 'Épargne Intelligente',
      description: 'Faites fructifier votre argent avec des taux compétitifs',
      color: 'from-blue-500 to-blue-600',
      badge: 'Bientôt',
    },
    {
      icon: LineChart,
      title: 'Actions & Crypto',
      description: 'Investissez dans les marchés financiers mondiaux',
      color: 'from-purple-500 to-purple-600',
      badge: 'Bientôt',
    },
    {
      icon: Target,
      title: 'Objectifs Financiers',
      description: 'Planifiez et atteignez vos objectifs d\'investissement',
      color: 'from-green-500 to-green-600',
      badge: 'Bientôt',
    },
    {
      icon: Shield,
      title: 'Investissements Sécurisés',
      description: 'Options à faible risque pour protéger votre capital',
      color: 'from-orange-500 to-orange-600',
      badge: 'Bientôt',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="font-headline text-xl font-bold">Investir</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-20 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
            <Rocket className="w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <h2 className="font-headline text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Fonctionnalité en Développement
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Notre équipe travaille activement sur des solutions d'investissement innovantes pour vous aider à faire croître votre patrimoine.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>Lancement prévu prochainement</span>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investmentOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card className="relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 h-full">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Lock Overlay */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-muted/80 backdrop-blur-sm rounded-full p-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1 flex items-center gap-2">
                          {option.title}
                          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {option.badge}
                          </span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <motion.div
                      animate={{
                        opacity: hoveredCard === index ? 1 : 0.5,
                        x: hoveredCard === index ? 5 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>En cours de développement</span>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Restez informé</h3>
                  <p className="text-sm text-muted-foreground">
                    Nous vous notifierons dès que les fonctionnalités d'investissement seront disponibles. 
                    En attendant, explorez nos autres services financiers comme l'épargne, le crédit et les tontines.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/savings">
                        <PiggyBank className="w-4 h-4 mr-2" />
                        Épargne
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/credit">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Crédit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/tontine">
                        <Target className="w-4 h-4 mr-2" />
                        Tontine
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <Button size="lg" asChild className="bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90">
            <Link href="/dashboard/mbongo-dashboard">
              Retour au Dashboard
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
