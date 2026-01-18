'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

const legalDocuments = [
  {
    title: "Conditions d'utilisation",
    description: "Les termes et conditions d'utilisation de la plateforme eNkamba",
    lastUpdated: "15 janvier 2024",
  },
  {
    title: "Politique de confidentialité",
    description: "Comment nous collectons, utilisons et protégeons vos données personnelles",
    lastUpdated: "15 janvier 2024",
  },
  {
    title: "Politique de cookies",
    description: "Information sur l'utilisation des cookies sur notre plateforme",
    lastUpdated: "15 janvier 2024",
  },
  {
    title: "Mentions légales",
    description: "Informations légales sur eNkamba et ses services",
    lastUpdated: "15 janvier 2024",
  },
  {
    title: "CGV - Conditions Générales de Vente",
    description: "Conditions générales de vente pour les services eNkamba",
    lastUpdated: "15 janvier 2024",
  },
  {
    title: "Politique de remboursement",
    description: "Politique de remboursement et d'annulation des transactions",
    lastUpdated: "15 janvier 2024",
  },
];

export default function LegalPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold text-primary">Documents Légaux</h1>
            <p className="text-sm text-muted-foreground">Consultez nos termes et politiques</p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {legalDocuments.map((doc, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="font-headline flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {doc.title}
                  </CardTitle>
                  <CardDescription className="mt-2">{doc.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Dernière mise à jour : {doc.lastUpdated}
                </p>
                <Button variant="outline" size="sm">
                  Consulter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            Si vous avez des questions concernant nos documents légaux, veuillez nous contacter à{' '}
            <a href="mailto:legal@enkamba.io" className="text-primary hover:underline">
              legal@enkamba.io
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
