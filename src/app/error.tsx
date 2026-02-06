'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  ArrowLeft,
  Bug,
  Copy,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  // Logger l'erreur
  useEffect(() => {
    console.error('Error caught by error boundary:', error);
  }, [error]);

  const handleCopyError = () => {
    const errorText = `
Erreur eNkamba
--------------
Message: ${error.message}
Digest: ${error.digest || 'N/A'}
Stack: ${error.stack || 'N/A'}
Date: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-red-500/5 to-background flex items-center justify-center p-4">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes pulse-error {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
        .pulse-error {
          animation: pulse-error 2s ease-in-out infinite;
        }
      `}</style>

      <Card className="w-full max-w-2xl border-red-500/20 shadow-2xl">
        <CardContent className="p-8 sm:p-12">
          {/* Icône d'erreur animée */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Cercle pulsant */}
              <div className="absolute inset-0 rounded-full bg-red-500/20 pulse-error"></div>
              
              {/* Icône principale */}
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-8 shake-animation">
                <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center mb-6">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Oups ! Une erreur s'est produite
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Quelque chose s'est mal passé. Ne vous inquiétez pas, nous allons résoudre cela.
            </p>
          </div>

          {/* Message d'erreur */}
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  Erreur détectée
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 break-words">
                  {error.message || 'Une erreur inattendue s\'est produite'}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono">
                    ID: {error.digest}
                  </p>
                )}
              </div>
            </div>
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

          {/* Actions principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Button
              onClick={reset}
              className="w-full bg-gradient-to-r from-[#32BB78] to-[#2a9d63] hover:from-[#2a9d63] hover:to-[#1f7a4a] text-white gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>

            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full border-[#32BB78]/30 hover:bg-[#32BB78]/10 gap-2"
            >
              <Home className="w-4 h-4" />
              Tableau de bord
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-[#32BB78]/30 hover:bg-[#32BB78]/10 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>

            <Button
              onClick={handleCopyError}
              variant="outline"
              className="w-full border-[#32BB78]/30 hover:bg-[#32BB78]/10 gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#32BB78]" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier l'erreur
                </>
              )}
            </Button>
          </div>

          {/* Détails techniques (collapsible) */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              {showDetails ? 'Masquer' : 'Afficher'} les détails techniques
            </button>
            
            {showDetails && (
              <div className="mt-3 p-4 bg-muted rounded-lg border border-border">
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                  {error.stack || 'Aucun détail disponible'}
                </pre>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="pt-6 border-t border-border">
            <p className="text-sm font-semibold text-foreground mb-3">
              Que faire maintenant ?
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#32BB78] mt-0.5">•</span>
                <span>Vérifiez votre connexion internet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#32BB78] mt-0.5">•</span>
                <span>Actualisez la page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#32BB78] mt-0.5">•</span>
                <span>Essayez de vous reconnecter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#32BB78] mt-0.5">•</span>
                <span>Si le problème persiste, contactez le support</span>
              </li>
            </ul>
          </div>

          {/* Message d'aide */}
          <div className="mt-6 p-4 bg-[#32BB78]/10 rounded-lg border border-[#32BB78]/20">
            <p className="text-xs text-muted-foreground text-center">
              Besoin d'aide ? Contactez le support eNkamba avec l'ID d'erreur ci-dessus
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
