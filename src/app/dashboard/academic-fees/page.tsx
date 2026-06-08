'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import html2canvas from 'html2canvas';

type PaymentStep = 'university' | 'student' | 'payment' | 'receipt';

interface UniversityInfo {
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

interface StudentInfo {
  fullName: string;
  studentNumber: string;
  faculty: string;
  department: string;
  level: string;
  academicYear: string;
  amount: number;
  currency: 'CDF' | 'USD';
  paymentType: string;
}

interface PaymentReceipt {
  id: string;
  date: string;
  university: UniversityInfo;
  student: StudentInfo;
  paidBy: string;
  paymentMethod: string;
}

// Base de données simulée des universités
const UNIVERSITIES_DB: Record<string, UniversityInfo> = {
  'UNIKIN': {
    code: 'UNIKIN',
    name: 'Université de Kinshasa',
    address: 'Mont Amba, Kinshasa',
    phone: '+243 XXX XXX XXX',
    email: 'info@unikin.ac.cd',
  },
  'UPN': {
    code: 'UPN',
    name: 'Université Pédagogique Nationale',
    address: 'Ngaliema, Kinshasa',
    phone: '+243 XXX XXX XXX',
    email: 'contact@upn.ac.cd',
  },
  'UNIKIN-TECH': {
    code: 'UNIKIN-TECH',
    name: 'Institut Supérieur de Techniques Appliquées',
    address: 'Gombe, Kinshasa',
    phone: '+243 XXX XXX XXX',
    email: 'info@ista.ac.cd',
  },
  'UCC': {
    code: 'UCC',
    name: 'Université Cardinal Malula',
    address: 'Limete, Kinshasa',
    phone: '+243 XXX XXX XXX',
    email: 'contact@ucc.ac.cd',
  },
};

const FACULTIES = [
  'Sciences',
  'Médecine',
  'Droit',
  'Économie',
  'Polytechnique',
  'Lettres et Sciences Humaines',
  'Sciences Sociales',
  'Agronomie',
  'Pharmacie',
  'Psychologie et Sciences de l\'Éducation',
  'Sciences de l\'Information et de la Communication',
  'Gestion',
];

export default function AcademicFeesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<PaymentStep>('university');
  const [universityCode, setUniversityCode] = useState('');
  const [university, setUniversity] = useState<UniversityInfo | null>(null);
  const [student, setStudent] = useState<StudentInfo>({
    fullName: '',
    studentNumber: '',
    faculty: '',
    department: '',
    level: '',
    academicYear: '2025-2026',
    amount: 0,
    currency: 'USD',
    paymentType: 'Frais académiques',
  });
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const handleVerifyUniversity = () => {
    const foundUniversity = UNIVERSITIES_DB[universityCode.toUpperCase()];
    if (foundUniversity) {
      setUniversity(foundUniversity);
      setStep('student');
      toast({
        title: "Université trouvée",
        description: `${foundUniversity.name}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Aucune université trouvée avec ce code. Veuillez vérifier.",
      });
    }
  };

  const handlePayment = async () => {
    if (!university || !student.fullName || !student.faculty || !student.level || student.amount <= 0) {
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
      id: `ENK-ACAD-${Date.now()}`,
      date: new Date().toISOString(),
      university,
      student,
      paidBy: 'Étudiant/Parent', // À récupérer du profil utilisateur
      paymentMethod: 'eNkambaPay Wallet',
    };

    setReceipt(newReceipt);
    setIsPaying(false);
    setStep('receipt');

    toast({
      title: "Paiement réussi !",
      description: `Frais académiques de ${student.amount.toLocaleString('fr-FR')} ${student.currency} payés avec succès.`,
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
        link.download = `recu-frais-academiques-${receipt?.id}.png`;
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
                title: 'Reçu de paiement académique',
                text: `Reçu de paiement des frais académiques - ${receipt?.id}`,
                files: [file],
              });
            } else {
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
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#32BB78] to-[#32BB78] bg-clip-text text-transparent">
              Paiement Frais Académiques
            </h1>
            <p className="text-sm text-muted-foreground">Payez vos frais universitaires en toute sécurité</p>
          </div>
        </header>

        {/* Progress Steps */}
        {step !== 'receipt' && (
          <div className="flex items-center justify-center gap-2">
            {[
              { key: 'university', label: 'Université', icon: GraduationCap },
              { key: 'student', label: 'Étudiant', icon: GraduationCap },
              { key: 'payment', label: 'Paiement', icon: CheckCircle2 },
            ].map((s, idx) => {
              const steps: PaymentStep[] = ['university', 'student', 'payment'];
              const currentIdx = steps.indexOf(step);
              const isActive = s.key === step;
              const isCompleted = idx < currentIdx;
              const Icon = s.icon;

              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-white' : isCompleted ? 'bg-primary text-white' : 'bg-muted'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  {idx < 2 && <div className={`h-0.5 w-8 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step: Code Université */}
        {step === 'university' && (
          <Card>
            <CardHeader>
              <CardTitle>Code de l'université</CardTitle>
              <CardDescription>Entrez le code unique de votre établissement universitaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="universityCode">Code de l'université *</Label>
                <Input
                  id="universityCode"
                  value={universityCode}
                  onChange={(e) => setUniversityCode(e.target.value.toUpperCase())}
                  placeholder="Ex: UNIKIN"
                  className="text-lg font-mono uppercase"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">
                  Le code est fourni par votre université. Contactez le secrétariat académique si vous ne l'avez pas.
                </p>
              </div>

              {/* Exemples de codes */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <p className="text-sm font-semibold">Codes d'exemple pour test:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(UNIVERSITIES_DB).map((code) => (
                    <Button
                      key={code}
                      variant="outline"
                      size="sm"
                      onClick={() => setUniversityCode(code)}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleVerifyUniversity}
                disabled={!universityCode || universityCode.length < 2}
              >
                Vérifier le code <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Informations Étudiant */}
        {step === 'student' && university && (
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'étudiant</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary">{university.name}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet de l'étudiant *</Label>
                <Input
                  id="fullName"
                  value={student.fullName}
                  onChange={(e) => setStudent(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: Jean Mukendi Kabongo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentNumber">Matricule *</Label>
                <Input
                  id="studentNumber"
                  value={student.studentNumber}
                  onChange={(e) => setStudent(prev => ({ ...prev, studentNumber: e.target.value }))}
                  placeholder="Ex: 2024-001-UNIKIN"
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculté *</Label>
                  <Select value={student.faculty} onValueChange={(value) => setStudent(prev => ({ ...prev, faculty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACULTIES.map((faculty) => (
                        <SelectItem key={faculty} value={faculty}>{faculty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Niveau *</Label>
                  <Select value={student.level} onValueChange={(value) => setStudent(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L1">L1 - Première Licence</SelectItem>
                      <SelectItem value="L2">L2 - Deuxième Licence</SelectItem>
                      <SelectItem value="L3">L3 - Troisième Licence</SelectItem>
                      <SelectItem value="M1">M1 - Master 1</SelectItem>
                      <SelectItem value="M2">M2 - Master 2</SelectItem>
                      <SelectItem value="Doctorat">Doctorat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département/Option</Label>
                <Input
                  id="department"
                  value={student.department}
                  onChange={(e) => setStudent(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Ex: Informatique, Médecine Générale, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Année académique</Label>
                <Select value={student.academicYear} onValueChange={(value) => setStudent(prev => ({ ...prev, academicYear: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Type de frais</Label>
                <Select value={student.paymentType} onValueChange={(value) => setStudent(prev => ({ ...prev, paymentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frais académiques">Frais académiques</SelectItem>
                    <SelectItem value="Inscription">Inscription</SelectItem>
                    <SelectItem value="Réinscription">Réinscription</SelectItem>
                    <SelectItem value="Minerval">Minerval</SelectItem>
                    <SelectItem value="Frais de laboratoire">Frais de laboratoire</SelectItem>
                    <SelectItem value="Frais de bibliothèque">Frais de bibliothèque</SelectItem>
                    <SelectItem value="Frais de stage">Frais de stage</SelectItem>
                    <SelectItem value="Frais de mémoire">Frais de mémoire/TFC</SelectItem>
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
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CDF">CDF</SelectItem>
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
                <Button variant="outline" onClick={() => setStep('university')} className="flex-1">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Retour
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-primary" 
                  onClick={handlePayment}
                  disabled={!student.fullName || !student.studentNumber || !student.faculty || !student.level || student.amount <= 0}
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
              <div className="bg-gradient-to-r from-[#32BB78] to-[#32BB78] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">eNkambaPay</h2>
                      <p className="text-sm opacity-90">Reçu de paiement académique</p>
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

                {/* Informations Université */}
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">ÉTABLISSEMENT</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom:</span>
                      <span className="font-semibold text-right">{receipt.university.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      <span className="font-mono font-semibold">{receipt.university.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adresse:</span>
                      <span className="text-sm text-right">{receipt.university.address}</span>
                    </div>
                  </div>
                </div>

                {/* Informations Étudiant */}
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">ÉTUDIANT</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom complet:</span>
                      <span className="font-semibold text-right">{receipt.student.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Matricule:</span>
                      <span className="font-mono font-semibold">{receipt.student.studentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Faculté:</span>
                      <span className="font-semibold text-right">{receipt.student.faculty}</span>
                    </div>
                    {receipt.student.department && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Département:</span>
                        <span className="font-semibold text-right">{receipt.student.department}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Niveau:</span>
                      <span className="font-semibold">{receipt.student.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Année académique:</span>
                      <span className="font-semibold">{receipt.student.academicYear}</span>
                    </div>
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
                    Présentez ce reçu au secrétariat académique pour validation
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
