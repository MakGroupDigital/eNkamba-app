'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateFinancialReport, type FinancialReportOutput } from "@/ai/flows/ai-report-generation";
import { Sparkles, FileText, AlertTriangle, Lightbulb, Loader2, Download, Share2, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { jsPDF } from "jspdf";
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ReportPage() {
  const [accountHistory, setAccountHistory] = useState("");
  const [report, setReport] = useState<FinancialReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report]);

  const handleGenerateReport = async () => {
    if (!accountHistory.trim()) {
      setError("Veuillez coller votre historique de compte.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await generateFinancialReport({ accountHistory });
      setReport(result);
    } catch (e) {
      console.error(e);
      setError("Une erreur est survenue lors de la génération du rapport. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header ---
    doc.setFillColor(14, 90, 89); // Primary color
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Mbongo.io", 15, 16);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("Rapport Financier IA", pageWidth - 15, 16, { align: 'right' });


    // --- Document Title ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(14, 90, 89);
    doc.text("Votre Rapport d'Analyse", 15, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 15, 46);

    let y = 65;

    const addSection = (title: string, content: string, icon: string, color: [number, number, number]) => {
        if (y > 250) { // Add new page if content is too long
            doc.addPage();
            y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`${icon} ${title}`, 15, y);
        y += 8;
        
        doc.setDrawColor(220, 220, 220);
        doc.line(15, y-2, pageWidth - 15, y-2);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        const splitContent = doc.splitTextToSize(content, pageWidth - 30);
        doc.text(splitContent, 15, y + 4);
        y += (splitContent.length * 5) + 15;
    }

    addSection("Résumé de votre activité", report.summary, '📄', [14, 90, 89]);
    addSection("Anomalies et Risques Potentiels", report.anomalies, '⚠️', [220, 38, 38]);
    addSection("Recommandations Personnalisées", report.recommendations, '💡', [255, 140, 0]);

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
        doc.text('© Mbongo.io - Ce document est généré par une IA et est à titre informatif.', 15, 287);
    }
    
    doc.save("rapport-financier-ia-mbongo.pdf");
  };

  const handleShare = async () => {
    if (!report) return;
    const reportJson = JSON.stringify(report);
    const reportBase64 = btoa(unescape(encodeURIComponent(reportJson)));
    const url = `${window.location.origin}/report/view?data=${reportBase64}`;
    
    try {
        const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#0E5A59', light: '#FFFFFF' } });
        setQrCodeDataUrl(dataUrl);
    } catch (err) {
        console.error("Failed to generate QR code", err);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <Card className="animate-in fade-in duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-6 w-6 text-primary" />
            Assistant Financier IA
          </CardTitle>
          <CardDescription>
            Collez votre historique de compte ci-dessous pour générer une analyse intelligente, détecter des anomalies, et recevoir des recommandations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Exemple :&#10;15/05/2024 - Dépôt de salaire - +1500 USD&#10;16/05/2024 - Achat Yango - -10 USD&#10;17/05/2024 - Transfert à John Doe - -50 USD&#10;..."
            className="min-h-[150px] font-mono text-sm"
            value={accountHistory}
            onChange={(e) => setAccountHistory(e.target.value)}
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button onClick={handleGenerateReport} disabled={isLoading || !accountHistory.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              "Générer le rapport"
            )}
          </Button>
          <Alert variant="default" className="border-accent">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="font-headline text-accent">Avis Important</AlertTitle>
            <AlertDescription>
              Les suggestions fournies par l'IA sont à titre informatif uniquement. Vous êtes seul responsable des actions que vous entreprenez.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>

      {isLoading && (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        </div>
      )}

      {report && (
        <div ref={reportRef} className="animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                             <CardTitle className="flex items-center gap-2 font-headline">
                                <FileText className="h-5 w-5 text-primary" />
                                Votre Rapport IA
                            </CardTitle>
                             <CardDescription className="mt-1">Généré le {new Date().toLocaleDateString('fr-FR')}</CardDescription>
                        </div>
                       <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                                <Download className="mr-2 h-4 w-4" />
                                PDF
                            </Button>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={handleShare}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Partager
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><QrCode/>Partager le Rapport</DialogTitle>
                                    <DialogDescription>
                                        Scannez ce QR code avec n'importe quel appareil pour afficher le rapport.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                                       {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="QR Code" /> : <Loader2 className="h-8 w-8 animate-spin" />}
                                    </div>
                                </DialogContent>
                            </Dialog>
                       </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-headline font-semibold text-lg flex items-center gap-2">Résumé de votre activité</h3>
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
  );
}
