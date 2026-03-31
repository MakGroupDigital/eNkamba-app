'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, School, Download, Share2, Printer } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import html2canvas from 'html2canvas';

type PaymentStep = 'school' | 'student' | 'payment' | 'receipt';

interface SchoolInfo {
  code: string;
  name: string;
  address: string;
  phone: string;
  logo?: string;
}

interface StudentInfo {
  fullName: string;
  studentNumber: string;
  grade: string;
  age: string;
  amount: number;
  currency: 'CDF' | 'USD';
  paymentType: string;
}

interface PaymentReceipt {
  id: string;
  date: string;
  school: SchoolInfo;
  student: StudentInfo;
  paidBy: string;
  paymentMethod: string;
}

// Base de données simulée des écoles
const SCHOOLS_DB: Record<string, SchoolInfo> = {
  'SCH001': {
    code: 'SCH001',
    name: 'Complexe Scolaire Boboto',
    address: 'Avenue Kasa-Vubu, Kinshasa',
    phone: '+243 XXX XXX XXX',
  },
  'SCH002': {
    code: 'SCH002',
    name: 'Institut Technique Industriel',
    address: 'Boulevard Lumumba, Kinshasa',
    phone: '+243 XXX XXX XXX',
  },
  'SCH003': {
    code: 'SCH003',
    name: 'Lycée Français René Descartes',
    address: 'Gombe, Kinshasa',
    phone: '+243 XXX XXX XXX',
  },
};

export default function SchoolFeesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<PaymentStep>('school');
  const [schoolCode, setSchoolCode] = useState('');
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [student, setStudent] = useState<StudentInfo>({
    fullName: '',
    studentNumber: '',
    grade: '',
    age: '',
    amount: 0,
    currency: 'CDF',
    paymentType: 'Frais scolaires',
  });
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const handleVerifySchool = () => {
    const foundSchool = SCHOOLS_DB[schoolCode.toUpperCase()];
    if (foundSchool) {
      setSchool(foundSchool);
      setStep('student');
      toast({
        title: "École trouvée",
        description: `${foundSchool.name}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Aucune école trouvée avec ce code. Veuillez vérifier.",
      });
    }
  };

  const handlePayment = async () => {
    if (!school || !student.fullName || !student.grade || student.amount <= 0) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setIsPaying(true);
    setStep('payment');

    // Simuler le paiement
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newReceipt: PaymentReceipt = {
      id: `ENK-${Date.now()}`,
      date: new Date().toISOString(),
      school,
      student,
      paidBy: 'Parent/Tuteur', // À récupérer du profil utilisateur
      paymentMethod: 'eNkambaPay Wallet',
    };

    setReceipt(newReceipt);
    setIsPaying(false);
    setStep('receipt');

    toast({
      title: "Paiement réussi !",
      description: `Frais scolaires de ${student.amount.toLocaleString('fr-FR')} ${student.currency} payés avec succès.`,
    });
  };

  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `recu-frais-scolaires-${receipt?.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Reçu téléchargé",
          description: "Le reçu a été téléchargé avec succès.",
        });
      } catch (error) {
        console.error('Erreur téléchargement:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de télécharger le reçu.",
        });
      }
    }
  };

  const handleShareReceipt = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `recu-${receipt?.id}.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Reçu de paiement',
                text: `Reçu de paiement des frais scolaires - ${receipt?.id}`,
                files: [file],
              });
            } else {
              // Fallback: copier dans le presse-papier
              toast({
                title: "Partage non disponible",
                description: "Utilisez le bouton de téléchargement.",
              });
            }
          }
        });
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Paiement Frais Scolaires
            </h1>
            <p className="text-sm text-muted-foreground">Payez les frais scolaires en toute sécurité</p>
          </div>
        </header>

        {/* Progress Steps */}
        {step !== 'receipt' && (
          <div className="flex items-center justify-center gap-2">
            {[
              { key: 'school', label: 'École', icon: School },
              { key: 'student', label: 'Élève', icon: School },
              { key: 'payment', label: 'Paiement', icon: CheckCircle2 },
            ].map((s, idx) => {
              const steps: PaymentStep[] = ['school', 'student', 'payment'];
              const currentIdx = steps.indexOf(step);
              const isActive = s.key === step;
              const isCompleted = idx < currentIdx;
              const Icon = s.icon;

              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-muted'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  {idx < 2 && <div className={`h-0.5 w-8 ${isCompleted ? 'bg-green-600' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step: Code École */}
        {step === 'school' && (
          <Card>
            <CardHeader>
              <CardTitle>Code de l'école</CardTitle>
              <CardDescription>Entrez le code unique de l'établissement scolaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolCode">Code de l'école *</Label>
                <Input
                  id="schoolCode"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="Ex: SCH001"
                  className="text-lg font-mono uppercase"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Le code est fourni par l'école. Contactez l'administration si vous ne l'avez pas.
                </p>
              </div>

              {/* Exemples de codes */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <p className="text-sm font-semibold">Codes d'exemple pour test:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(SCHOOLS_DB).map((code) => (
                    <Button
                      key={code}
                      variant="outline"
                      size="sm"
                      onClick={() => setSchoolCode(code)}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleVerifySchool}
                disabled={!schoolCode || schoolCode.length < 3}
              >
                Vérifier le code <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Informations Élève */}
        {step === 'student' && school && (
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'élève</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <School className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary">{school.name}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet de l'élève *</Label>
                <Input
                  id="fullName"
                  value={student.fullName}
                  onChange={(e) => setStudent(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: Jean Mukendi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Classe *</Label>
                  <Select value={student.grade} onValueChange={(value) => setStudent(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maternelle">Maternelle</SelectItem>
                      <SelectItem value="1ère Primaire">1ère Primaire</SelectItem>
                      <SelectItem value="2ème Primaire">2ème Primaire</SelectItem>
                      <SelectItem value="3ème Primaire">3ème Primaire</SelectItem>
                      <SelectItem value="4ème Primaire">4ème Primaire</SelectItem>
                      <SelectItem value="5ème Primaire">5ème Primaire</SelectItem>
                      <SelectItem value="6ème Primaire">6ème Primaire</SelectItem>
                      <SelectItem value="1ère Secondaire">1ère Secondaire</SelectItem>
                      <SelectItem value="2ème Secondaire">2ème Secondaire</SelectItem>
                      <SelectItem value="3ème Secondaire">3ème Secondaire</SelectItem>
                      <SelectItem value="4ème Secondaire">4ème Secondaire</SelectItem>
                      <SelectItem value="5ème Secondaire">5ème Secondaire</SelectItem>
                      <SelectItem value="6ème Secondaire">6ème Secondaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    value={student.age}
                    onChange={(e) => setStudent(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentNumber">Numéro d'élève (si applicable)</Label>
                <Input
                  id="studentNumber"
                  value={student.studentNumber}
                  onChange={(e) => setStudent(prev => ({ ...prev, studentNumber: e.target.value }))}
                  placeholder="Ex: 2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Type de frais</Label>
                <Select value={student.paymentType} onValueChange={(value) => setStudent(prev => ({ ...prev, paymentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frais scolaires">Frais scolaires</SelectItem>
                    <SelectItem value="Minerval">Minerval</SelectItem>
                    <SelectItem value="Inscription">Inscription</SelectItem>
                    <SelectItem value="Uniforme">Uniforme</SelectItem>
                    <SelectItem value="Cantine">Cantine</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Activités">Activités extra-scolaires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant à payer *</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    value={student.amount || ''}
                    onChange={(e) => setStudent(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="text-lg font-semibold flex-1"
                  />
                  <Select value={student.currency} onValueChange={(value: 'CDF' | 'USD') => setStudent(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDF">CDF</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {student.currency === 'USD' && student.amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {(student.amount * 2800).toLocaleString('fr-FR')} CDF
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('school')} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-green-800" 
                  onClick={handlePayment}
                  disabled={!student.fullName || !student.grade || student.amount <= 0}
                >
                  Payer maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Paiement en cours */}
        {step === 'payment' && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Paiement en cours...</h3>
              <p className="text-muted-foreground">
                Veuillez patienter pendant le traitement du paiement
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: Reçu */}
        {step === 'receipt' && receipt && (
          <div className="space-y-6">
            {/* Reçu moderne eNkambaPay */}
            <div ref={receiptRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header avec dégradé */}
              <div className="bg-gradient-to-r from-[#32BB78] to-[#2a9d63] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">eNkambaPay</h2>
                      <p className="text-sm opacity-90">Reçu de paiement</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Référence</p>
                    <p className="font-mono font-bold text-lg">{receipt.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <p className="text-center text-xl font-bold mt-2">Paiement réussi</p>
              </div>

              {/* Corps du reçu */}
              <div className="p-6 space-y-6">
                {/* Montant */}
                <div className="text-center py-6 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Montant payé</p>
                  <p className="text-4xl font-bold text-primary">
                    {receipt.student.amount.toLocaleString('fr-FR')} {receipt.student.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(receipt.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Informations École */}
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">ÉTABLISSEMENT</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom:</span>
                      <span className="font-semibold text-right">{receipt.school.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      <span className="font-mono font-semibold">{receipt.school.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adresse:</span>
                      <span className="text-sm text-right">{receipt.school.address}</span>
                    </div>
                  </div>
                </div>

                {/* Informations Élève */}
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">ÉLÈVE</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom complet:</span>
                      <span className="font-semibold text-right">{receipt.student.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Classe:</span>
                      <span className="font-semibold">{receipt.student.grade}</span>
                    </div>
                    {receipt.student.studentNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Numéro:</span>
                        <span className="font-mono font-semibold">{receipt.student.studentNumber}</span>
                      </div>
                    )}
                    {receipt.student.age && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Âge:</span>
                        <span className="font-semibold">{receipt.student.age} ans</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails du paiement */}
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">DÉTAILS DU PAIEMENT</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge>{receipt.student.paymentType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payé par:</span>
                      <span className="font-semibold">{receipt.paidBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Méthode:</span>
                      <span className="font-semibold">{receipt.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Ce reçu est généré électroniquement et ne nécessite pas de signature
                  </p>
                  <p className="text-xs text-muted-foreground">
                    eNkambaPay © {new Date().getFullYear()} - Tous droits réservés
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    www.enkamba.cd
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" onClick={handleDownloadReceipt} className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
              <Button variant="outline" onClick={handleShareReceipt} className="gap-2">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
              <Button onClick={() => router.push('/dashboard/mbongo-dashboard')} className="gap-2">
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
