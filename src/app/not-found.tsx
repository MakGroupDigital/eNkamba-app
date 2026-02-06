'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  AlertCircle,
  ArrowLeft,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  // Vérifier la connexion internet
  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Compte à rebours pour redirection automatique
  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, router]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background flex items-center justify-center p-4">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        .pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>

      <Card className="w-full max-w-2xl border-[#32BB78]/20 shadow-2xl">
        <CardContent className="p-8 sm:p-12">
          {/* Icône 404 animée */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Cercles pulsants */}
              <div className="absolute inset-0 rounded-full bg-[#32BB78]/20 pulse-ring"></div>
              <div className="absolute inset-0 rounded-full bg-[#32BB78]/20 pulse-ring" style={{ animationDelay: '1s' }}></div>
              
              {/* Icône principale */}
              <div className="relative bg-gradient-to-br from-[#32BB78] to-[#2a9d63] rounded-full p-8 float-animation">
                <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center mb-6">
            <h1 className="font-headline text-6xl sm:text-8xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Page introuvable
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>
          </div>

          {/* État de connexion */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-[#32BB78]" />
                <span className="text-sm text-[#32BB78] font-semibold">Connexion active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500 font-semibold">Pas de connexion</span>
              </>
            )}
          </div>

          {/* Compte à rebours */}
          {autoRedirect && (
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Redirection automatique dans{' '}
                <span className="font-bold text-[#32BB78]">{countdown}</span> secondes
              </p>
              <button
                onClick={() => setAutoRedirect(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline mt-1"
              >
                Annuler la redirection
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-[#32BB78] to-[#2a9d63] hover:from-[#2a9d63] hover:to-[#1f7a4a] text-white gap-2"
            >
              <Home className="w-4 h-4" />
              Tableau de bord
            </Button>

            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-[#32BB78]/30 hover:bg-[#32BB78]/10 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="w-full border-[#32BB78]/30 hover:bg-[#32BB78]/10 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>

            <Button
              onClick={() => {
                if (!isOnline) {
                  alert('Veuillez vérifier votre connexion internet');
                } else {
                  window.location.reload();
                }
              }}
              variant="outline"
              className="w-full border-[#32BB78]/30 hover:bg-[#32BB78]/10 gap-2"
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              Vérifier connexion
            </Button>
          </div>

          {/* Suggestions */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#32BB78]" />
              Pages populaires
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link 
                href="/dashboard/wallet" 
                className="text-muted-foreground hover:text-[#32BB78] transition-colors"
              >
                → Portefeuille
              </Link>
              <Link 
                href="/dashboard/send" 
                className="text-muted-foreground hover:text-[#32BB78] transition-colors"
              >
                → Envoyer
              </Link>
              <Link 
                href="/dashboard/history" 
                className="text-muted-foreground hover:text-[#32BB78] transition-colors"
              >
                → Historique
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="text-muted-foreground hover:text-[#32BB78] transition-colors"
              >
                → Paramètres
              </Link>
            </div>
          </div>

          {/* Message d'aide */}
          <div className="mt-6 p-4 bg-[#32BB78]/10 rounded-lg border border-[#32BB78]/20">
            <p className="text-xs text-muted-foreground text-center">
              Si le problème persiste, contactez le support eNkamba
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
