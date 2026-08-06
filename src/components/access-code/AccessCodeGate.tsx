'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAccessCode } from '@/hooks/useAccessCode';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { ResponsiveSplashBackground } from '@/components/shared/responsive-splash-background';
import { hasNativeCallAccess } from '@/lib/native-call-access';

export function AccessCodeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isVerified, isLoading, error, verifyCode } = useAccessCode();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  if (hasNativeCallAccess(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="relative isolate min-h-screen flex items-center justify-center overflow-hidden">
        <ResponsiveSplashBackground />
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/35 bg-white/88 px-8 py-7 shadow-2xl shadow-black/15 backdrop-blur-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-700">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden px-4 py-8 flex items-center justify-center">
        <ResponsiveSplashBackground />
        <div className="w-full max-w-md space-y-7 rounded-[2rem] border border-white/35 bg-white/90 p-6 shadow-2xl shadow-black/18 backdrop-blur-xl sm:p-8">
          {/* Logo avec effet flottant */}
          <div className="flex justify-center">
            <div className="relative animate-float">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"></div>
              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-primary shadow-2xl ring-4 ring-white/60">
                <Image
                  src="/enkamba-logo.png"
                  alt="eNkamba"
                  width={112}
                  height={112}
                  className="h-full w-full scale-[1.42] rounded-full object-cover [clip-path:circle(50%_at_50%_50%)]"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Titre minimaliste */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-950">
              Accès sécurisé
            </h1>
            <p className="text-sm font-medium text-gray-600 max-w-xs mx-auto">
              Entrez le code d'accès pour continuer
            </p>
          </div>

          {/* Formulaire */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              const success = await verifyCode(code);
              if (!success) {
                setCode('');
              }
              setIsSubmitting(false);
            }}
            className="space-y-4"
          >
            {/* Champ de code avec design épuré */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="code"
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 px-6 pr-12 rounded-2xl border-2 border-gray-200 bg-white text-center text-lg font-semibold tracking-wider text-gray-900 placeholder:text-gray-300 focus:border-primary focus:ring-0 outline-none transition-colors"
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCode((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showCode ? "Masquer le code" : "Afficher le code"}
                >
                  {showCode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-center text-gray-400">
                Code d'accès administrateur
              </p>
            </div>

            {/* Message d'erreur minimaliste */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Bouton de validation minimaliste */}
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full h-14 rounded-2xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <span>Accéder</span>
              )}
            </button>
          </form>

          {/* Badge de sécurité minimaliste */}
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-xs">Application en développement</p>
          </div>

          {/* Note d'information minimaliste */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-xs text-blue-800 leading-relaxed">
              Cette application est restreinte à l'équipe interne. 
              <br />
              Contactez <span className="font-semibold">eNkamba</span> pour obtenir l'accès.
            </p>
          </div>
        </div>

        <style jsx global>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
