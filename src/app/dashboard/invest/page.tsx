'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Icône personnalisée Investissement
const InvestIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 7H16M21 7V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="13" cy="15" r="1.5" fill="currentColor"/>
    <circle cx="21" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

// Icône Sécurité
const SecurityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M12 2L4 6V12C4 16.5 7 20.5 12 22C17 20.5 20 16.5 20 12V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icône Rentabilité
const ProfitIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 8C15 8 16 7 17 7C18 7 19 8 19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icône Diversification
const DiversifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
  </svg>
);

// Icône Opportunité
const OpportunityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4 slide-up">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Investir
            </h1>
            <p className="text-sm text-muted-foreground">Opportunités d'investissement</p>
          </div>
        </header>

        {/* Hero Card avec animation */}
        <Card className="bg-gradient-to-br from-[#32BB78]/10 via-[#32BB78]/5 to-transparent border-[#32BB78]/20 overflow-hidden slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icône principale avec effet glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#32BB78]/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-[#32BB78] to-[#2a9d63] p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 text-white">
                    <InvestIcon />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  Opportunités d'investissement
                </h2>
                <p className="text-muted-foreground max-w-md leading-relaxed">
                  Découvrez bientôt des opportunités d'investissement sécurisées et rentables adaptées à vos objectifs financiers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State moderne */}
        <Card className="border-2 border-dashed border-[#32BB78]/30 bg-gradient-to-br from-orange-500/5 to-transparent slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icône opportunité */}
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-6 rounded-2xl border-2 border-orange-500/30">
                  <div className="w-12 h-12 text-orange-600">
                    <OpportunityIcon />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  Aucune opportunité disponible
                </h3>
                <p className="text-muted-foreground max-w-lg leading-relaxed">
                  Nous travaillons activement pour vous proposer des opportunités d'investissement de qualité. Revenez bientôt pour découvrir nos offres exclusives.
                </p>
              </div>

              {/* Badge informatif */}
              <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-6 py-3 rounded-full border border-orange-200 dark:border-orange-800">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span>Nouvelles opportunités à venir</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards avec icônes personnalisées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Sécurité */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform">
                  <SecurityIcon />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Sécurité
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tous les investissements seront vérifiés et sécurisés pour votre tranquillité
              </p>
            </CardContent>
          </Card>

          {/* Rentabilité */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 text-green-600 group-hover:scale-110 transition-transform">
                  <ProfitIcon />
                </div>
                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Rentabilité
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Des opportunités avec des rendements attractifs et compétitifs
              </p>
            </CardContent>
          </Card>

          {/* Diversification */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 text-purple-600 group-hover:scale-110 transition-transform">
                  <DiversifyIcon />
                </div>
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  Diversification
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plusieurs types d'investissements pour diversifier votre portefeuille
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA moderne */}
        <Card className="bg-gradient-to-r from-[#32BB78] to-[#2a9d63] text-white shadow-xl slide-up" style={{ animationDelay: '0.4s' }}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-lg mb-1">Restez informé</h3>
                <p className="text-sm text-white/90">
                  Soyez le premier à découvrir nos nouvelles opportunités d'investissement
                </p>
              </div>
              <Button variant="secondary" size="lg" disabled className="whitespace-nowrap">
                Bientôt disponible
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
