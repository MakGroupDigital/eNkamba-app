'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useKycStatus } from '@/hooks/useKycStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Upload, Camera, Ticket, Loader2, CheckCircle, Smartphone, Building2, ArrowLeft, Check, CreditCard, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Step = 'identity' | 'selfie' | 'referral' | 'linkAccount' | 'completed';

// Types pour Mobile Money
type MobileMoneyStep = 'operator' | 'phone' | 'name' | 'confirm';
const MOBILE_MONEY_STEPS: MobileMoneyStep[] = ['operator', 'phone', 'name', 'confirm'];
const MOBILE_MONEY_STORAGE_KEY = 'enkamba_mobile_money_progress';

interface MobileMoneyData {
  operator: string;
  phoneNumber: string;
  accountName: string;
}

interface MobileMoneyProgress {
  currentStep: MobileMoneyStep;
  completedSteps: MobileMoneyStep[];
  data: MobileMoneyData;
}

// Types pour Compte Bancaire
type BankStep = 'bankName' | 'accountHolder' | 'accountNumber' | 'swiftIban' | 'address' | 'confirm';
const BANK_STEPS: BankStep[] = ['bankName', 'accountHolder', 'accountNumber', 'swiftIban', 'address', 'confirm'];
const BANK_STORAGE_KEY = 'enkamba_bank_progress';

interface BankData {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  swiftCode: string;
  iban: string;
  bankAddress: string;
  country: string;
}

interface BankProgress {
  currentStep: BankStep;
  completedSteps: BankStep[];
  data: BankData;
}

// Opérateurs Mobile Money populaires
const MOBILE_OPERATORS = [
  { value: 'orange', label: 'Orange Money', countries: ['CI', 'SN', 'CM', 'ML', 'BF', 'CD'] },
  { value: 'mtn', label: 'MTN Mobile Money', countries: ['CM', 'CI', 'GH', 'NG', 'UG', 'RW', 'CD'] },
  { value: 'mpesa', label: 'M-Pesa', countries: ['KE', 'TZ', 'CD', 'MZ', 'GH'] },
  { value: 'airtel', label: 'Airtel Money', countries: ['KE', 'TZ', 'UG', 'RW', 'CD', 'NG'] },
  { value: 'wave', label: 'Wave', countries: ['SN', 'CI', 'ML', 'BF'] },
  { value: 'moov', label: 'Moov Money', countries: ['CI', 'BJ', 'TG', 'NE', 'CF'] },
  { value: 'vodacom', label: 'Vodacom M-Pesa', countries: ['CD', 'TZ', 'MZ'] },
  { value: 'tigo', label: 'Tigo Cash', countries: ['TZ', 'GH', 'SN'] },
  { value: 'free', label: 'Free Money', countries: ['SN'] },
  { value: 'other', label: 'Autre opérateur', countries: [] },
];

// Liste des banques populaires
const POPULAR_BANKS = [
  'Ecobank',
  'Standard Bank',
  'First Bank',
  'Access Bank',
  'UBA (United Bank for Africa)',
  'Equity Bank',
  'KCB Bank',
  'BGFI Bank',
  'Société Générale',
  'Bank of Africa',
  'Rawbank',
  'Trust Merchant Bank',
  'HSBC',
  'Citibank',
  'JPMorgan Chase',
  'Bank of America',
  'Barclays',
  'BNP Paribas',
  'Autre',
];

const STEPS_ORDER: Step[] = ['identity', 'selfie', 'referral', 'linkAccount', 'completed'];
const KYC_STORAGE_KEY = 'enkamba_kyc_progress';

interface KycProgress {
  currentStep: Step;
  completedSteps: Step[];
  idFrontUploaded: boolean;
  idBackUploaded: boolean;
  selfieTaken: boolean;
}

const getInitialProgress = (): KycProgress => {
  if (typeof window === 'undefined') {
    return {
      currentStep: 'identity',
      completedSteps: [],
      idFrontUploaded: false,
      idBackUploaded: false,
      selfieTaken: false,
    };
  }
  
  try {
    const saved = localStorage.getItem(KYC_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erreur lecture localStorage:', e);
  }
  
  return {
    currentStep: 'identity',
    completedSteps: [],
    idFrontUploaded: false,
    idBackUploaded: false,
    selfieTaken: false,
  };
};

export default function KycPage() {
  const router = useRouter();
  const { completeKyc, isKycCompleted, isLoading: kycLoading } = useKycStatus();
  const [isHydrated, setIsHydrated] = useState(false);
  const [progress, setProgress] = useState<KycProgress>(getInitialProgress);
  const [step, setStep] = useState<Step>('identity');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // États pour les données d'identité
  const [identityType, setIdentityType] = useState('passport');
  const [identityNumber, setIdentityNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('CD');

  // États pour Mobile Money Dialog
  const [mobileMoneyOpen, setMobileMoneyOpen] = useState(false);
  const [mobileMoneyStep, setMobileMoneyStep] = useState<MobileMoneyStep>('operator');
  const [mobileMoneyData, setMobileMoneyData] = useState<MobileMoneyData>({
    operator: '',
    phoneNumber: '',
    accountName: '',
  });
  const [mobileMoneyCompleted, setMobileMoneyCompleted] = useState<MobileMoneyStep[]>([]);
  const [mobileMoneyLinked, setMobileMoneyLinked] = useState(false);

  // États pour Bank Dialog
  const [bankOpen, setBankOpen] = useState(false);
  const [bankStep, setBankStep] = useState<BankStep>('bankName');
  const [bankData, setBankData] = useState<BankData>({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
    bankAddress: '',
    country: '',
  });
  const [bankCompleted, setBankCompleted] = useState<BankStep[]>([]);
  const [bankLinked, setBankLinked] = useState(false);

  // Vérifier si KYC est déjà complété et rediriger
  useEffect(() => {
    // Si le KYC est complété, rediriger vers le dashboard
    // Ne pas attendre le loading, rediriger immédiatement si complété
    if (isKycCompleted) {
      console.log('KYC déjà complété, redirection vers dashboard');
      router.push('/dashboard');
    }
  }, [isKycCompleted, router]);

  // Hydrater depuis localStorage au montage
  useEffect(() => {
    const savedProgress = getInitialProgress();
    setProgress(savedProgress);
    setStep(savedProgress.currentStep);
    setIsHydrated(true);

    // Charger la progression Mobile Money
    try {
      const savedMobileMoney = localStorage.getItem(MOBILE_MONEY_STORAGE_KEY);
      if (savedMobileMoney) {
        const parsed: MobileMoneyProgress = JSON.parse(savedMobileMoney);
        setMobileMoneyStep(parsed.currentStep);
        setMobileMoneyCompleted(parsed.completedSteps);
        setMobileMoneyData(parsed.data);
        if (parsed.completedSteps.includes('confirm')) {
          setMobileMoneyLinked(true);
        }
      }
    } catch (e) {
      console.error('Erreur lecture Mobile Money:', e);
    }

    // Charger la progression Bank
    try {
      const savedBank = localStorage.getItem(BANK_STORAGE_KEY);
      if (savedBank) {
        const parsed: BankProgress = JSON.parse(savedBank);
        setBankStep(parsed.currentStep);
        setBankCompleted(parsed.completedSteps);
        setBankData(parsed.data);
        if (parsed.completedSteps.includes('confirm')) {
          setBankLinked(true);
        }
      }
    } catch (e) {
      console.error('Erreur lecture Bank:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarder la progression dans localStorage
  const saveProgress = useCallback((newProgress: Partial<KycProgress>) => {
    setProgress(prev => {
      const updated = { ...prev, ...newProgress };
      try {
        localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Erreur sauvegarde localStorage:', e);
      }
      return updated;
    });
  }, []);

  // Vérifier si une étape est complétée
  const isStepCompleted = useCallback((stepToCheck: Step) => {
    return progress.completedSteps.includes(stepToCheck);
  }, [progress.completedSteps]);

  // Marquer une étape comme complétée
  const completeStep = useCallback((completedStep: Step) => {
    const stepIndex = STEPS_ORDER.indexOf(completedStep);
    const nextStep = STEPS_ORDER[stepIndex + 1] || 'completed';
    
    const newCompletedSteps = progress.completedSteps.includes(completedStep) 
      ? progress.completedSteps 
      : [...progress.completedSteps, completedStep];
    
    saveProgress({
      completedSteps: newCompletedSteps,
      currentStep: nextStep,
    });
    
    setStep(nextStep);
  }, [progress.completedSteps, saveProgress]);

  // ==================== MOBILE MONEY FUNCTIONS ====================
  
  const saveMobileMoneyProgress = useCallback((newData: Partial<MobileMoneyData>, completedStep?: MobileMoneyStep) => {
    const updatedData = { ...mobileMoneyData, ...newData };
    setMobileMoneyData(updatedData);
    
    let updatedCompleted = [...mobileMoneyCompleted];
    if (completedStep && !updatedCompleted.includes(completedStep)) {
      updatedCompleted.push(completedStep);
      setMobileMoneyCompleted(updatedCompleted);
    }
    
    const stepIndex = completedStep ? MOBILE_MONEY_STEPS.indexOf(completedStep) : -1;
    const nextStep = stepIndex >= 0 ? MOBILE_MONEY_STEPS[stepIndex + 1] || 'confirm' : mobileMoneyStep;
    
    if (completedStep) {
      setMobileMoneyStep(nextStep);
    }
    
    try {
      localStorage.setItem(MOBILE_MONEY_STORAGE_KEY, JSON.stringify({
        currentStep: nextStep,
        completedSteps: updatedCompleted,
        data: updatedData,
      }));
    } catch (e) {
      console.error('Erreur sauvegarde Mobile Money:', e);
    }
  }, [mobileMoneyData, mobileMoneyCompleted, mobileMoneyStep]);

  const handleMobileMoneyNext = () => {
    switch (mobileMoneyStep) {
      case 'operator':
        if (!mobileMoneyData.operator) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un opérateur.' });
          return;
        }
        saveMobileMoneyProgress({}, 'operator');
        break;
      case 'phone':
        if (!mobileMoneyData.phoneNumber || mobileMoneyData.phoneNumber.length < 8) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer un numéro valide.' });
          return;
        }
        saveMobileMoneyProgress({}, 'phone');
        break;
      case 'name':
        if (!mobileMoneyData.accountName || mobileMoneyData.accountName.length < 2) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer le nom du compte.' });
          return;
        }
        saveMobileMoneyProgress({}, 'name');
        break;
      case 'confirm':
        saveMobileMoneyProgress({}, 'confirm');
        setMobileMoneyLinked(true);
        toast({ title: 'Succès', description: 'Compte Mobile Money lié avec succès !' });
        setMobileMoneyOpen(false);
        break;
    }
  };

  const handleMobileMoneyPrev = () => {
    const currentIndex = MOBILE_MONEY_STEPS.indexOf(mobileMoneyStep);
    if (currentIndex > 0) {
      const prevStep = MOBILE_MONEY_STEPS[currentIndex - 1];
      if (!mobileMoneyCompleted.includes(prevStep)) {
        setMobileMoneyStep(prevStep);
      } else {
        toast({ title: 'Information', description: 'Cette étape a déjà été validée.' });
      }
    }
  };

  const getMobileMoneyProgress = () => {
    const currentIndex = MOBILE_MONEY_STEPS.indexOf(mobileMoneyStep);
    return ((currentIndex + 1) / MOBILE_MONEY_STEPS.length) * 100;
  };

  // ==================== BANK FUNCTIONS ====================
  
  const saveBankProgress = useCallback((newData: Partial<BankData>, completedStep?: BankStep) => {
    const updatedData = { ...bankData, ...newData };
    setBankData(updatedData);
    
    let updatedCompleted = [...bankCompleted];
    if (completedStep && !updatedCompleted.includes(completedStep)) {
      updatedCompleted.push(completedStep);
      setBankCompleted(updatedCompleted);
    }
    
    const stepIndex = completedStep ? BANK_STEPS.indexOf(completedStep) : -1;
    const nextStep = stepIndex >= 0 ? BANK_STEPS[stepIndex + 1] || 'confirm' : bankStep;
    
    if (completedStep) {
      setBankStep(nextStep);
    }
    
    try {
      localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify({
        currentStep: nextStep,
        completedSteps: updatedCompleted,
        data: updatedData,
      }));
    } catch (e) {
      console.error('Erreur sauvegarde Bank:', e);
    }
  }, [bankData, bankCompleted, bankStep]);

  const handleBankNext = () => {
    switch (bankStep) {
      case 'bankName':
        if (!bankData.bankName) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner une banque.' });
          return;
        }
        saveBankProgress({}, 'bankName');
        break;
      case 'accountHolder':
        if (!bankData.accountHolder || bankData.accountHolder.length < 2) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer le nom du titulaire.' });
          return;
        }
        saveBankProgress({}, 'accountHolder');
        break;
      case 'accountNumber':
        if (!bankData.accountNumber || bankData.accountNumber.length < 8) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer un numéro de compte valide.' });
          return;
        }
        saveBankProgress({}, 'accountNumber');
        break;
      case 'swiftIban':
        if (!bankData.swiftCode || bankData.swiftCode.length < 8) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer un code SWIFT/BIC valide.' });
          return;
        }
        saveBankProgress({}, 'swiftIban');
        break;
      case 'address':
        if (!bankData.country) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner le pays.' });
          return;
        }
        saveBankProgress({}, 'address');
        break;
      case 'confirm':
        saveBankProgress({}, 'confirm');
        setBankLinked(true);
        toast({ title: 'Succès', description: 'Compte bancaire lié avec succès !' });
        setBankOpen(false);
        break;
    }
  };

  const handleBankPrev = () => {
    const currentIndex = BANK_STEPS.indexOf(bankStep);
    if (currentIndex > 0) {
      const prevStep = BANK_STEPS[currentIndex - 1];
      if (!bankCompleted.includes(prevStep)) {
        setBankStep(prevStep);
      } else {
        toast({ title: 'Information', description: 'Cette étape a déjà été validée.' });
      }
    }
  };

  const getBankProgress = () => {
    const currentIndex = BANK_STEPS.indexOf(bankStep);
    return ((currentIndex + 1) / BANK_STEPS.length) * 100;
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  const stepsConfig = {
    identity: { progress: 25, title: "Pièce d'Identité" },
    selfie: { progress: 50, title: 'Selfie' },
    referral: { progress: 75, title: 'Code de Parrainage' },
    linkAccount: { progress: 100, title: 'Lier un Compte' },
    completed: { progress: 100, title: 'Vérification Terminée' },
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    
    // Arrêter l'ancienne stream si elle existe
    stopCamera();

    try {
      // Forcer la caméra frontale (selfie)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: 'user' }
        },
        audio: false
      }).catch(async () => {
        // Si exact: 'user' échoue, essayer sans contrainte
        console.log('Tentative avec caméra par défaut...');
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = "Impossible d'accéder à la caméra.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Accès à la caméra refusé. Veuillez autoriser l'accès.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "Aucune caméra trouvée sur cet appareil.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = "La caméra est utilisée par une autre application.";
      }
      
      setCameraError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erreur Caméra',
        description: errorMessage,
      });
    }
  }, [stopCamera, toast]);

  // Démarrer la caméra quand on arrive sur l'étape selfie
  useEffect(() => {
    if (step === 'selfie' && !selfie) {
      startCamera();
    }
    
    // Cleanup quand on quitte l'étape selfie
    return () => {
      if (step === 'selfie') {
        stopCamera();
      }
    };
  }, [step, selfie, startCamera, stopCamera]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Effet miroir
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setSelfie(dataUrl);
      stopCamera();
    }
  };

  const handleRetakePhoto = () => {
    setSelfie(null);
    setCameraError(null);
    // La caméra redémarrera automatiquement via useEffect
  };

  const handleNextStep = () => {
    switch (step) {
      case 'identity':
        // Validate identity form fields
        if (!identityType || !identityNumber || !fullName || !dateOfBirth || !country) {
          toast({ 
            variant: 'destructive', 
            title: 'Erreur', 
            description: 'Veuillez remplir tous les champs d\'identité.' 
          });
          return;
        }
        if (!idFront || !idBack) {
          toast({ 
            variant: 'destructive', 
            title: 'Erreur', 
            description: "Veuillez importer le recto et le verso de votre pièce d'identité." 
          });
          return;
        }
        saveProgress({ idFrontUploaded: true, idBackUploaded: true });
        completeStep('identity');
        break;
      case 'selfie':
        if (selfie) {
          stopCamera();
          saveProgress({ selfieTaken: true });
          completeStep('selfie');
        } else {
          toast({ 
            variant: 'destructive', 
            title: 'Erreur', 
            description: 'Veuillez prendre un selfie.' 
          });
        }
        break;
      case 'referral':
        completeStep('referral');
        break;
      case 'linkAccount':
        // Validation stricte AVANT d'appeler completeKyc
        if (!identityType || !identityType.trim()) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un type de pièce d\'identité.' });
          return;
        }
        if (!identityNumber || !identityNumber.trim()) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer votre numéro de pièce d\'identité.' });
          return;
        }
        if (!fullName || !fullName.trim()) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer votre nom complet.' });
          return;
        }
        if (!dateOfBirth || !dateOfBirth.trim()) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer votre date de naissance.' });
          return;
        }
        if (!country || !country.trim()) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner votre pays.' });
          return;
        }
        if (!progress.idFrontUploaded) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez uploader le recto de votre pièce d\'identité.' });
          return;
        }
        if (!progress.idBackUploaded) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez uploader le verso de votre pièce d\'identité.' });
          return;
        }
        if (!progress.selfieTaken) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez prendre un selfie.' });
          return;
        }

        setIsLoading(true);
        setTimeout(async () => {
          try {
            // Utiliser les données du formulaire
            const kycData = {
              identityType,
              identityNumber,
              fullName,
              dateOfBirth,
              country,
              linkedAccount: mobileMoneyLinked ? {
                type: 'mobile_money' as const,
                operator: mobileMoneyData.operator,
                phoneNumber: mobileMoneyData.phoneNumber,
                accountName: mobileMoneyData.accountName,
              } : bankLinked ? {
                type: 'bank' as const,
                bankName: bankData.bankName,
                accountNumber: bankData.accountNumber,
                accountHolder: bankData.accountHolder,
                swiftCode: bankData.swiftCode,
              } : undefined,
            };

            // Appeler completeKyc avec les données d'identité
            const result = await completeKyc(kycData);

            if (result.success) {
              setIsLoading(false);
              completeStep('linkAccount');
              // Nettoyer le localStorage après complétion totale
              localStorage.removeItem(KYC_STORAGE_KEY);
              
              // Rediriger immédiatement vers le dashboard
              // Ne pas attendre, rediriger tout de suite
              router.push('/dashboard');
            }
          } catch (error: any) {
            setIsLoading(false);
            console.error('Erreur complétude KYC:', error);
            // Afficher l'erreur à l'utilisateur
            toast({
              variant: 'destructive',
              title: 'Erreur KYC',
              description: error.message || 'Une erreur est survenue lors de la vérification.'
            });
          }
        }, 1500);
        break;
    }
  };

  // Empêcher de revenir en arrière sur les étapes complétées
  const handlePrevStep = () => {
    const currentIndex = STEPS_ORDER.indexOf(step);
    
    // Trouver la première étape non complétée avant l'étape actuelle
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevStep = STEPS_ORDER[i];
      if (!isStepCompleted(prevStep)) {
        if (step === 'selfie') stopCamera();
        setStep(prevStep);
        saveProgress({ currentStep: prevStep });
        return;
      }
    }
    
    // Si toutes les étapes précédentes sont complétées, ne rien faire
    toast({
      title: 'Information',
      description: 'Cette étape a déjà été validée.',
    });
  };

  // Afficher un loader pendant l'hydratation ou le chargement du KYC
  if (!isHydrated || kycLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 'identity':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Remplissez vos informations d&apos;identité et téléversez les documents.
            </p>
            
            {/* Identity Information Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identity-type">Type de pièce d&apos;identité</Label>
                <Select value={identityType} onValueChange={setIdentityType}>
                  <SelectTrigger id="identity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passeport</SelectItem>
                    <SelectItem value="national_id">Carte d&apos;identité nationale</SelectItem>
                    <SelectItem value="drivers_license">Permis de conduire</SelectItem>
                    <SelectItem value="residence_permit">Titre de séjour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identity-number">Numéro de pièce d&apos;identité</Label>
                <Input
                  id="identity-number"
                  placeholder="Ex: AB123456"
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Nom complet</Label>
                <Input
                  id="full-name"
                  placeholder="Prénom et Nom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date de naissance</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CD">🇨🇩 RDC</SelectItem>
                      <SelectItem value="CG">🇨🇬 Congo</SelectItem>
                      <SelectItem value="CM">🇨🇲 Cameroun</SelectItem>
                      <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                      <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                      <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                      <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                      <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                      <SelectItem value="ZA">🇿🇦 Afrique du Sud</SelectItem>
                      <SelectItem value="FR">🇫🇷 France</SelectItem>
                      <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                      <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                      <SelectItem value="GB">🇬🇧 Royaume-Uni</SelectItem>
                      <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-4">Téléversez vos documents</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label 
                  htmlFor="id-front" 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 block text-sm font-semibold text-primary">Importer Recto</span>
                  <Input 
                    id="id-front" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => setIdFront(e.target.files?.[0] || null)} 
                  />
                  {idFront && <p className="text-xs text-muted-foreground mt-2 truncate">{idFront.name}</p>}
                </label>
                <label 
                  htmlFor="id-back" 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 block text-sm font-semibold text-primary">Importer Verso</span>
                  <Input 
                    id="id-back" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => setIdBack(e.target.files?.[0] || null)} 
                  />
                  {idBack && <p className="text-xs text-muted-foreground mt-2 truncate">{idBack.name}</p>}
                </label>
              </div>
            </div>
          </div>
        );

      case 'selfie':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Centrez-vous dans le cadre et prenez une photo claire de votre visage.
            </p>
            
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {/* Video element - toujours présent mais caché si selfie pris */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${selfie ? 'hidden' : 'block'}`}
              />
              
              {/* Selfie preview */}
              {selfie && (
                <img 
                  src={selfie} 
                  alt="Selfie" 
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Loading state */}
              {!selfie && !cameraReady && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <span className="text-sm">Chargement de la caméra...</span>
                </div>
              )}
              
              {/* Error state */}
              {cameraError && !selfie && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                  <Alert variant="destructive" className="max-w-sm">
                    <Camera className="h-4 w-4" />
                    <AlertTitle>Erreur Caméra</AlertTitle>
                    <AlertDescription>
                      {cameraError}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={startCamera}
                      >
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            {!selfie ? (
              <Button
                className="w-full"
                onClick={handleTakePhoto}
                disabled={!cameraReady}
              >
                <Camera className="mr-2 h-4 w-4" />
                Prendre la photo
              </Button>
            ) : (
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={handleRetakePhoto}
              >
                Reprendre
              </Button>
            )}
          </div>
        );

      case 'referral':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Si vous avez un code de parrainage, entrez-le pour recevoir un bonus. 
              Sinon, un code vous sera attribué.
            </p>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Code de parrainage (facultatif)" className="pl-10" />
            </div>
          </div>
        );

      case 'linkAccount':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Liez votre compte mobile money ou bancaire pour des transactions plus rapides. (Facultatif)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant={mobileMoneyLinked ? "default" : "outline"} 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => !mobileMoneyLinked && setMobileMoneyOpen(true)}
              >
                {mobileMoneyLinked ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-semibold">Mobile Money Lié</span>
                    <span className="text-xs text-muted-foreground">
                      {MOBILE_OPERATORS.find(op => op.value === mobileMoneyData.operator)?.label}
                    </span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-6 w-6" />
                    <span className="font-semibold">Lier Mobile Money</span>
                  </>
                )}
              </Button>
              <Button 
                variant={bankLinked ? "default" : "outline"} 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => !bankLinked && setBankOpen(true)}
              >
                {bankLinked ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-semibold">Compte Bancaire Lié</span>
                    <span className="text-xs text-muted-foreground">{bankData.bankName}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-6 w-6" />
                    <span className="font-semibold">Lier Compte Bancaire</span>
                  </>
                )}
              </Button>
            </div>
            {(mobileMoneyLinked || bankLinked) && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Compte(s) lié(s)</AlertTitle>
                <AlertDescription className="text-green-700">
                  {mobileMoneyLinked && bankLinked 
                    ? 'Mobile Money et Compte Bancaire sont liés.'
                    : mobileMoneyLinked 
                      ? 'Mobile Money est lié. Vous pouvez aussi lier un compte bancaire.'
                      : 'Compte Bancaire est lié. Vous pouvez aussi lier Mobile Money.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="text-center py-8">
            <UserCheck className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold">Vérification Réussie !</h2>
            <p className="text-muted-foreground mt-2">
              Vous allez être redirigé vers votre tableau de bord.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg animate-in fade-in duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <UserCheck className="h-6 w-6 text-primary" />
            Vérification de Compte
          </CardTitle>
          <CardDescription>
            Pour votre sécurité, nous devons vérifier votre identité.
          </CardDescription>
          <Progress value={stepsConfig[step].progress} className="mt-4" />
          <p className="text-sm font-medium text-center text-primary mt-2">
            {stepsConfig[step].title}
          </p>
        </CardHeader>
        <CardContent className="min-h-[250px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        {step !== 'completed' && (
          <CardContent className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevStep} 
              disabled={step === 'identity' || isLoading || isStepCompleted(STEPS_ORDER[STEPS_ORDER.indexOf(step) - 1])}
            >
              Précédent
            </Button>
            <Button onClick={handleNextStep} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Suivant'}
            </Button>
          </CardContent>
        )}
        
        {/* Indicateur des étapes complétées */}
        {progress.completedSteps.length > 0 && step !== 'completed' && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>
                {progress.completedSteps.length} étape{progress.completedSteps.length > 1 ? 's' : ''} complétée{progress.completedSteps.length > 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ==================== MOBILE MONEY DIALOG ==================== */}
      <Dialog open={mobileMoneyOpen} onOpenChange={setMobileMoneyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Lier Mobile Money
            </DialogTitle>
            <DialogDescription>
              Liez votre compte Mobile Money pour des transferts rapides.
            </DialogDescription>
            <Progress value={getMobileMoneyProgress()} className="mt-2" />
            <p className="text-xs text-center text-muted-foreground">
              Étape {MOBILE_MONEY_STEPS.indexOf(mobileMoneyStep) + 1} sur {MOBILE_MONEY_STEPS.length}
            </p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key={mobileMoneyStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              {mobileMoneyStep === 'operator' && (
                <div className="space-y-4">
                  <Label>Sélectionnez votre opérateur Mobile Money</Label>
                  <Select 
                    value={mobileMoneyData.operator} 
                    onValueChange={(value) => saveMobileMoneyProgress({ operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILE_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mobileMoneyData.operator && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      {MOBILE_OPERATORS.find(op => op.value === mobileMoneyData.operator)?.label} sélectionné
                    </p>
                  )}
                </div>
              )}

              {mobileMoneyStep === 'phone' && (
                <div className="space-y-4">
                  <Label>Numéro de téléphone Mobile Money</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+243 XXX XXX XXX"
                      className="pl-10"
                      value={mobileMoneyData.phoneNumber}
                      onChange={(e) => saveMobileMoneyProgress({ phoneNumber: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entrez le numéro associé à votre compte {MOBILE_OPERATORS.find(op => op.value === mobileMoneyData.operator)?.label}
                  </p>
                </div>
              )}

              {mobileMoneyStep === 'name' && (
                <div className="space-y-4">
                  <Label>Nom du titulaire du compte</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nom complet"
                      className="pl-10"
                      value={mobileMoneyData.accountName}
                      onChange={(e) => saveMobileMoneyProgress({ accountName: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le nom doit correspondre à celui enregistré chez l&apos;opérateur.
                  </p>
                </div>
              )}

              {mobileMoneyStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Récapitulatif</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opérateur:</span>
                        <span className="font-medium">
                          {MOBILE_OPERATORS.find(op => op.value === mobileMoneyData.operator)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Numéro:</span>
                        <span className="font-medium">{mobileMoneyData.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Titulaire:</span>
                        <span className="font-medium">{mobileMoneyData.accountName}</span>
                      </div>
                    </div>
                  </div>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      En confirmant, vous acceptez de lier ce compte Mobile Money à votre profil eNkamba.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleMobileMoneyPrev}
              disabled={mobileMoneyStep === 'operator'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button onClick={handleMobileMoneyNext}>
              {mobileMoneyStep === 'confirm' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              ) : (
                'Suivant'
              )}
            </Button>
          </div>

          {mobileMoneyCompleted.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {mobileMoneyCompleted.length} étape(s) validée(s)
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== BANK DIALOG ==================== */}
      <Dialog open={bankOpen} onOpenChange={setBankOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Lier Compte Bancaire
            </DialogTitle>
            <DialogDescription>
              Liez votre compte bancaire pour des virements internationaux.
            </DialogDescription>
            <Progress value={getBankProgress()} className="mt-2" />
            <p className="text-xs text-center text-muted-foreground">
              Étape {BANK_STEPS.indexOf(bankStep) + 1} sur {BANK_STEPS.length}
            </p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key={bankStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              {bankStep === 'bankName' && (
                <div className="space-y-4">
                  <Label>Nom de la banque</Label>
                  <Select 
                    value={bankData.bankName} 
                    onValueChange={(value) => saveBankProgress({ bankName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une banque" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bankData.bankName === 'Autre' && (
                    <Input
                      placeholder="Nom de votre banque"
                      onChange={(e) => saveBankProgress({ bankName: e.target.value })}
                    />
                  )}
                </div>
              )}

              {bankStep === 'accountHolder' && (
                <div className="space-y-4">
                  <Label>Nom du titulaire du compte</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nom complet (tel qu'il apparaît sur le compte)"
                      className="pl-10"
                      value={bankData.accountHolder}
                      onChange={(e) => saveBankProgress({ accountHolder: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {bankStep === 'accountNumber' && (
                <div className="space-y-4">
                  <Label>Numéro de compte bancaire</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="pl-10"
                      value={bankData.accountNumber}
                      onChange={(e) => saveBankProgress({ accountNumber: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entrez votre numéro de compte ou IBAN complet.
                  </p>
                </div>
              )}

              {bankStep === 'swiftIban' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Code SWIFT/BIC</Label>
                    <Input
                      type="text"
                      placeholder="XXXXXXXX ou XXXXXXXXXXX"
                      value={bankData.swiftCode}
                      onChange={(e) => saveBankProgress({ swiftCode: e.target.value.toUpperCase() })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Le code SWIFT/BIC identifie votre banque internationalement (8 ou 11 caractères).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN (optionnel)</Label>
                    <Input
                      type="text"
                      placeholder="XX00 XXXX XXXX XXXX XXXX XX"
                      value={bankData.iban}
                      onChange={(e) => saveBankProgress({ iban: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              )}

              {bankStep === 'address' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pays de la banque</Label>
                    <Select 
                      value={bankData.country} 
                      onValueChange={(value) => saveBankProgress({ country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CD">🇨🇩 République Démocratique du Congo</SelectItem>
                        <SelectItem value="CG">🇨🇬 République du Congo</SelectItem>
                        <SelectItem value="CM">🇨🇲 Cameroun</SelectItem>
                        <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                        <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                        <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                        <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                        <SelectItem value="ZA">🇿🇦 Afrique du Sud</SelectItem>
                        <SelectItem value="FR">🇫🇷 France</SelectItem>
                        <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                        <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                        <SelectItem value="GB">🇬🇧 Royaume-Uni</SelectItem>
                        <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                        <SelectItem value="CN">🇨🇳 Chine</SelectItem>
                        <SelectItem value="AE">🇦🇪 Émirats Arabes Unis</SelectItem>
                        <SelectItem value="OTHER">🌍 Autre pays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Adresse de la banque (optionnel)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Adresse de l'agence bancaire"
                        className="pl-10"
                        value={bankData.bankAddress}
                        onChange={(e) => saveBankProgress({ bankAddress: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {bankStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Récapitulatif du compte bancaire</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Banque:</span>
                        <span className="font-medium">{bankData.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Titulaire:</span>
                        <span className="font-medium">{bankData.accountHolder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">N° Compte:</span>
                        <span className="font-medium">****{bankData.accountNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SWIFT/BIC:</span>
                        <span className="font-medium">{bankData.swiftCode}</span>
                      </div>
                      {bankData.iban && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IBAN:</span>
                          <span className="font-medium">****{bankData.iban.slice(-4)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pays:</span>
                        <span className="font-medium">{bankData.country}</span>
                      </div>
                    </div>
                  </div>
                  <Alert>
                    <Building2 className="h-4 w-4" />
                    <AlertDescription>
                      En confirmant, vous certifiez que ces informations bancaires sont exactes et vous appartiennent.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleBankPrev}
              disabled={bankStep === 'bankName'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button onClick={handleBankNext}>
              {bankStep === 'confirm' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              ) : (
                'Suivant'
              )}
            </Button>
          </div>

          {bankCompleted.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {bankCompleted.length} étape(s) validée(s)
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
