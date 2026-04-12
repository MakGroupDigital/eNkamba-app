'use client';

import { useState } from 'react';
import { useAccessCode } from '@/hooks/useAccessCode';
import { Lock, AlertCircle } from 'lucide-react';

export function AccessCodeGate({ children }: { children: React.ReactNode }) {
  const { isVerified, isLoading, error, verifyCode } = useAccessCode();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            {/* Header */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              eNkamba
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Application en développement
            </p>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSubmitting(true);
                const success = verifyCode(code);
                if (!success) {
                  setCode('');
                }
                setIsSubmitting(false);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Code d'accès
                </label>
                <input
                  id="code"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Entrez le code d'accès"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {isSubmitting ? 'Vérification...' : 'Accéder'}
              </button>
            </form>

            {/* Info Message */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">ℹ️ Information:</span> Cette application est actuellement en phase de développement et restreinte à l'équipe interne. Pour obtenir le code d'accès, veuillez contacter{' '}
                <span className="font-semibold">eNkamba</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
