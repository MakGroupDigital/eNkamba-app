'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, Lightbulb, Loader2 } from "lucide-react";
import Logo from '@/components/logo';

interface ReportData {
  summary: string;
  anomalies: string;
  recommendations: string;
}

function ReportView() {
  const searchParams = useSearchParams();
  const data = searchParams.get('data');
  let report: ReportData | null = null;
  let error: string | null = null;

  if (data) {
    try {
      report = JSON.parse(decodeURIComponent(atob(data)));
    } catch (e) {
      console.error("Failed to parse report data from URL", e);
      error = "Les données du rapport sont invalides ou corrompues.";
    }
  } else {
    error = "Aucune donnée de rapport fournie.";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-8 flex justify-between items-center">
            <Logo />
            <p className="text-sm text-muted-foreground">Rapport Financier Partagé</p>
        </header>

        {error && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle />
                        Erreur de Chargement
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error}</p>
                </CardContent>
            </Card>
        )}

        {report && (
          <div className="animate-in fade-in duration-500">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-headline">
                          <FileText className="h-5 w-5 text-primary" />
                          Rapport Financier IA
                      </CardTitle>
                       <CardDescription className="mt-1">Généré le {new Date().toLocaleDateString('fr-FR')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h3 className="font-headline font-semibold text-lg flex items-center gap-2">Résumé de l'activité</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap mt-2">{report.summary}</p>
                      </div>
                       <div className="border-t pt-4">
                          <h3 className="font-headline font-semibold text-lg flex items-center gap-2 text-destructive">
                               <AlertTriangle className="h-5 w-5" />
                              Anomalies et Risques Potentiels
                          </h3>
                          <p className="text-muted-foreground whitespace-pre-wrap mt-2">{report.anomalies}</p>
                      </div>
                      <div className="border-t pt-4">
                          <h3 className="font-headline font-semibold text-lg flex items-center gap-2 text-accent">
                              <Lightbulb className="h-5 w-5" />
                             Recommandations Personnalisées
                          </h3>
                          <p className="text-muted-foreground whitespace-pre-wrap mt-2">{report.recommendations}</p>
                      </div>
                  </CardContent>
              </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportViewPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ReportView />
        </Suspense>
    )
}
