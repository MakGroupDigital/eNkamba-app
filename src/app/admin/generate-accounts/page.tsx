'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { generateMissingAccountNumbers } from '@/lib/generate-account-numbers';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function GenerateAccountsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Vérifier que l'utilisateur est admin (vous pouvez ajouter une vérification plus stricte)
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">Vous devez être connecté pour accéder à cette page</p>
            <Button onClick={() => router.push('/login')}>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResults(null);

    try {
      const result = await generateMissingAccountNumbers();
      setResults(result);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération');
      console.error('Erreur:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Générer les Numéros de Compte eNkamba</CardTitle>
          <p className="text-muted-foreground">
            Cette page permet de générer automatiquement les numéros de compte (accountNumber) 
            pour tous les utilisateurs qui n'en ont pas encore.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avertissement */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Attention
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Cette opération va parcourir tous les utilisateurs de la base de données 
                  et générer un numéro de compte pour ceux qui n'en ont pas. 
                  Cette opération peut prendre quelques secondes.
                </p>
              </div>
            </div>
          </div>

          {/* Bouton de génération */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="bg-[#32BB78] hover:bg-[#2a9d63] gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Générer les numéros manquants
                </>
              )}
            </Button>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Erreur
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Résultats */}
          {results && (
            <div className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{results.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{results.updated}</p>
                    <p className="text-sm text-muted-foreground">Mis à jour</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{results.errors}</p>
                    <p className="text-sm text-muted-foreground">Erreurs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Message de succès */}
              {results.errors === 0 && results.updated > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Génération réussie !
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {results.updated} numéro(s) de compte ont été générés avec succès.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste détaillée */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Détails</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {results.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          result.status === 'updated'
                            ? 'bg-green-50 dark:bg-green-950/20'
                            : result.status === 'error'
                            ? 'bg-red-50 dark:bg-red-950/20'
                            : 'bg-gray-50 dark:bg-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {result.status === 'updated' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : result.status === 'error' ? (
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono truncate">{result.uid}</p>
                            <p className="text-xs text-muted-foreground">{result.accountNumber}</p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            result.status === 'updated'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : result.status === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {result.status === 'updated'
                            ? 'Créé'
                            : result.status === 'error'
                            ? 'Erreur'
                            : 'Ignoré'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bouton retour */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
