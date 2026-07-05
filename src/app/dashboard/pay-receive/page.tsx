'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo, useRef } from 'react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, QrCode, Mail, Phone, CreditCard, Hash, Download, Share2,
  AlertCircle, Loader2, User, Upload, X, ArrowRightLeft, Users, BriefcaseBusiness,
  Gift, TrendingUp, Truck, FileSpreadsheet, CalendarClock, ShieldCheck, Plus,
  Trash2, CheckCircle2, ClipboardList, HelpCircle, Save
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import { useToast } from '@/hooks/use-toast';
import { PinVerification } from '@/components/payment/PinVerification';
import { TransferByIdentifier } from '@/components/payment/TransferByIdentifier';
import { BrandedQRCodeCard, createBrandedQRCodeDataUrl } from '@/components/qrcode/branded-qr-code-card';
import QRCodeLib from 'qrcode';
import jsQR from 'jsqr';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Currency = 'CDF' | 'USD' | 'EUR';

interface ScannedQRData {
  accountNumber: string;
  fullName: string;
  email?: string;
  isValid: boolean;
}

type MultiPayStep = 1 | 2 | 3 | 4;
type MultiPayType = 'same' | 'different' | 'salary' | 'bonus' | 'commission' | 'suppliers' | 'excel' | 'scheduled';

interface MultiPayRecipient {
  id: string;
  accountNumber: string;
  fullName: string;
  amount: string;
  role?: string;
  reason?: string;
  reference?: string;
}

const MULTI_PAY_TYPES: Array<{
  id: MultiPayType;
  title: string;
  subtitle: string;
  icon: ComponentType<any>;
  tone: string;
}> = [
  { id: 'same', title: 'Même montant à plusieurs', subtitle: 'Même montant pour tous les bénéficiaires', icon: Users, tone: 'bg-primary/10 text-primary' },
  { id: 'different', title: 'Montants différents', subtitle: 'Chaque bénéficiaire reçoit un montant différent', icon: User, tone: 'bg-blue-50 text-blue-700' },
  { id: 'salary', title: 'Salaires', subtitle: 'Paiement mensuel des employés', icon: BriefcaseBusiness, tone: 'bg-orange-50 text-orange-700' },
  { id: 'bonus', title: 'Primes', subtitle: 'Primes, bonus et indemnités', icon: Gift, tone: 'bg-purple-50 text-purple-700' },
  { id: 'commission', title: 'Commissions', subtitle: 'Commissions commerciales', icon: TrendingUp, tone: 'bg-amber-50 text-amber-700' },
  { id: 'suppliers', title: 'Fournisseurs', subtitle: 'Prestataires et partenaires', icon: Truck, tone: 'bg-sky-50 text-sky-700' },
  { id: 'excel', title: 'Importer Excel', subtitle: 'Importer un fichier CSV/Excel exporté', icon: FileSpreadsheet, tone: 'bg-primary/10 text-primary' },
  { id: 'scheduled', title: 'Paiement programmé', subtitle: 'Planifier vos paiements récurrents', icon: CalendarClock, tone: 'bg-violet-50 text-violet-700' },
];

const MULTI_PAY_FEE_RATE = 0.005;

export default function PayReceivePage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { sendMoney, isProcessing: isTransferring, balance } = useMoneyTransfer();
  
  const [mode, setMode] = useState<'receive' | 'pay' | 'scanner' | 'payment-method' | 'multi-pay' | 'transfer'>('receive');
  const [previousMode, setPreviousMode] = useState<'receive' | 'pay' | 'scanner' | 'payment-method' | 'multi-pay' | 'transfer'>('receive');
  const [payMethod, setPayMethod] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedImageData, setImportedImageData] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('CDF');
  const [paymentDestination, setPaymentDestination] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinContext, setPinContext] = useState<'single' | 'multi'>('single');
  
  // États pour paiement multiple
  const [multiPayStep, setMultiPayStep] = useState<MultiPayStep>(1);
  const [multiPayType, setMultiPayType] = useState<MultiPayType>('different');
  const [multiPayRecipients, setMultiPayRecipients] = useState<MultiPayRecipient[]>([]);
  const [isProcessingMultiPay, setIsProcessingMultiPay] = useState(false);
  const [multiPaySameAmount, setMultiPaySameAmount] = useState('');
  const [multiPayReason, setMultiPayReason] = useState('Paiement multiple');
  const [multiPayReference, setMultiPayReference] = useState('');
  const [multiPayScheduleDate, setMultiPayScheduleDate] = useState('');
  const [multiPayBusinessName, setMultiPayBusinessName] = useState('');
  const [multiPayApprover, setMultiPayApprover] = useState('');
  const [manualRecipientName, setManualRecipientName] = useState('');
  const [manualRecipientIdentifier, setManualRecipientIdentifier] = useState('');
  const [manualRecipientAmount, setManualRecipientAmount] = useState('');
  const [manualRecipientRole, setManualRecipientRole] = useState('');
  const [multiPayBatchReference, setMultiPayBatchReference] = useState('');
  const [multiPayResults, setMultiPayResults] = useState<Array<{ recipient: string; amount: number; success: boolean; error?: string }>>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiPayImportRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const multiPayTotalAmount = useMemo(
    () => multiPayRecipients.reduce((sum, recipient) => sum + (parseFloat(recipient.amount) || 0), 0),
    [multiPayRecipients]
  );
  const multiPayFees = useMemo(() => Math.round(multiPayTotalAmount * MULTI_PAY_FEE_RATE * 100) / 100, [multiPayTotalAmount]);
  const multiPayOperatorFees = 0;
  const multiPayDebitTotal = useMemo(
    () => Math.round((multiPayTotalAmount + multiPayFees + multiPayOperatorFees) * 100) / 100,
    [multiPayFees, multiPayTotalAmount]
  );
  const selectedMultiPayType = MULTI_PAY_TYPES.find((type) => type.id === multiPayType) || MULTI_PAY_TYPES[1];
  const multiPayHasInvalidAmounts = multiPayRecipients.some((recipient) => !recipient.amount || parseFloat(recipient.amount) <= 0);
  const multiPayDuplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let duplicates = 0;
    multiPayRecipients.forEach((recipient) => {
      const key = recipient.accountNumber.trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) duplicates += 1;
      seen.add(key);
    });
    return duplicates;
  }, [multiPayRecipients]);

  // Lire le paramètre mode de l'URL au chargement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const modeParam = searchParams?.get('mode');
    if (modeParam === 'transfer') {
      setMode('transfer');
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      
      setAccountNumber(accountNum);
      setAccountName(fullName);

      // Format: accountNumber|fullName|email|uid
      const qrData = `${accountNum}|${fullName}|${email}|${profile.uid}`;
      
      QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#25543A', light: '#ffffff' },
      }).then(setQrCode);
    }
  }, [profile?.uid, profile?.name, profile?.fullName, profile?.email]);

  useEffect(() => {
    if (mode !== 'scanner' || !isScanning) return;
    const currentVideo = videoRef.current;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setHasCameraPermission(true);
        if (currentVideo) {
          currentVideo.srcObject = stream;
          currentVideo.onloadedmetadata = () => scanQRFromVideo();
        }
      } catch (error) {
        setHasCameraPermission(false);
        setScanError('Accès caméra refusé.');
      }
    };

    getCameraPermission();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isScanning]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentProfileImage = profile?.profileImage || profile?.photoURL || user?.photoURL || null;

  const parseQRData = (data: string): ScannedQRData | null => {
    try {
      if (data.startsWith('ENK')) {
        const parts = data.split('|');
        if (parts.length >= 2) {
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            isValid: true,
          };
        }
        return {
          accountNumber: parts[0],
          fullName: 'Compte eNkamba',
          isValid: true,
        };
      }
      return { accountNumber: data, fullName: 'QR code invalide', isValid: false };
    } catch (error) {
      return null;
    }
  };

  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      const qrData = parseQRData(code.data);
      if (qrData?.isValid) {
        setScannedData(qrData);
        setIsScanning(false);
        setScanError(null);
        
        // Si on vient du mode multi-pay, ajouter directement à la liste
        if (previousMode === 'multi-pay') {
          handleAddRecipientToMultiPay(qrData);
        } else {
          setPaymentDestination(qrData.accountNumber);
          toast({ title: 'QR Code Détecté ✅', description: `Destinataire: ${qrData.fullName}` });
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
  };

  const handleAddRecipientToMultiPay = (qrData: ScannedQRData, options?: Partial<MultiPayRecipient>) => {
    // Vérifier si le destinataire n'est pas déjà dans la liste
    const alreadyAdded = multiPayRecipients.some(r => r.accountNumber === qrData.accountNumber);
    if (alreadyAdded) {
      toast({
        variant: 'destructive',
        title: 'Destinataire déjà ajouté',
        description: `${qrData.fullName} est déjà dans la liste`,
      });
      return;
    }

    // Ajouter le destinataire
    const newRecipient = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      accountNumber: qrData.accountNumber,
      fullName: qrData.fullName,
      amount: options?.amount || (multiPayType === 'same' ? multiPaySameAmount : ''),
      role: options?.role || '',
      reason: options?.reason || multiPayReason,
      reference: options?.reference || multiPayReference,
    };
    
    setMultiPayRecipients([...multiPayRecipients, newRecipient]);
    toast({
      title: 'Destinataire ajouté ✅',
      description: `${qrData.fullName} ajouté à la liste`,
    });
    
    // Retourner au mode multi-pay
    setScannedData(null);
    setPaymentDestination('');
    setMode('multi-pay');
    setMultiPayStep(2);
  };

  const handleAddManualRecipient = () => {
    if (!manualRecipientIdentifier.trim()) {
      toast({
        variant: 'destructive',
        title: 'Bénéficiaire requis',
        description: 'Ajoutez un numéro, ID eNkamba ou numéro de compte.',
      });
      return;
    }

    handleAddRecipientToMultiPay(
      {
        accountNumber: manualRecipientIdentifier.trim(),
        fullName: manualRecipientName.trim() || manualRecipientIdentifier.trim(),
        isValid: true,
      },
      {
        amount: manualRecipientAmount || (multiPayType === 'same' ? multiPaySameAmount : ''),
        role: manualRecipientRole,
        reason: multiPayReason,
        reference: multiPayReference,
      }
    );
    setManualRecipientName('');
    setManualRecipientIdentifier('');
    setManualRecipientAmount('');
    setManualRecipientRole('');
  };

  const updateMultiPayRecipient = (recipientId: string, patch: Partial<MultiPayRecipient>) => {
    setMultiPayRecipients((current) => current.map((recipient) => (recipient.id === recipientId ? { ...recipient, ...patch } : recipient)));
  };

  const removeMultiPayRecipient = (recipientId: string) => {
    setMultiPayRecipients((current) => current.filter((recipient) => recipient.id !== recipientId));
  };

  const applySameAmountToAll = () => {
    if (!multiPaySameAmount || parseFloat(multiPaySameAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Montant invalide',
        description: 'Entrez un montant commun valide.',
      });
      return;
    }

    setMultiPayRecipients((current) => current.map((recipient) => ({ ...recipient, amount: multiPaySameAmount })));
  };

  const handleMultiPayImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const importedRecipients = lines
        .slice(lines[0]?.toLowerCase().includes('nom') || lines[0]?.toLowerCase().includes('name') ? 1 : 0)
        .map((line) => {
          const cells = line.split(/[;,]/).map((cell) => cell.trim());
          const fullName = cells[0] || 'Bénéficiaire';
          const accountNumber = cells[1] || cells[0] || '';
          const amount = cells[2] || (multiPayType === 'same' ? multiPaySameAmount : '');
          const role = cells[3] || '';
          const reason = cells[4] || multiPayReason;
          return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fullName,
            accountNumber,
            amount,
            role,
            reason,
            reference: multiPayReference,
          } satisfies MultiPayRecipient;
        })
        .filter((recipient) => recipient.accountNumber);

      if (!importedRecipients.length) {
        throw new Error('Aucun bénéficiaire lisible dans le fichier.');
      }

      setMultiPayRecipients((current) => {
        const existing = new Set(current.map((recipient) => recipient.accountNumber.toLowerCase()));
        const fresh = importedRecipients.filter((recipient) => !existing.has(recipient.accountNumber.toLowerCase()));
        return [...current, ...fresh];
      });
      setMultiPayStep(2);
      toast({
        title: 'Import terminé',
        description: `${importedRecipients.length} bénéficiaire(s) importé(s).`,
        className: 'bg-primary text-white border-none',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Import impossible',
        description: error?.message || 'Vérifiez le fichier CSV/Excel exporté.',
      });
    } finally {
      event.target.value = '';
    }
  };

  const resetMultiPay = () => {
    setMultiPayStep(1);
    setMultiPayType('different');
    setMultiPayRecipients([]);
    setMultiPaySameAmount('');
    setMultiPayReason('Paiement multiple');
    setMultiPayReference('');
    setMultiPayScheduleDate('');
    setMultiPayBusinessName('');
    setMultiPayApprover('');
    setManualRecipientName('');
    setManualRecipientIdentifier('');
    setManualRecipientAmount('');
    setManualRecipientRole('');
    setMultiPayBatchReference('');
    setMultiPayResults([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setImportedImageData(imageDataUrl);
      setIsImporting(true);
      setImportProgress(0);

      const progressInterval = setInterval(() => {
        setImportProgress(prev => (prev >= 85 ? prev : prev + Math.random() * 25));
      }, 100);

      setTimeout(() => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas || !canvas.getContext('2d')) return;

          const ctx = canvas.getContext('2d')!;
          let width = img.width, height = img.height;
          const maxSize = 500;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let imageData = ctx.getImageData(0, 0, width, height);
          let code = jsQR(imageData.data, width, height);

          if (!code) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const bw = gray > 128 ? 255 : 0;
              data[i] = data[i + 1] = data[i + 2] = bw;
            }
            ctx.putImageData(imageData, 0, 0);
            code = jsQR(data, width, height);
          }

          setImportProgress(100);

          if (code) {
            const qrData = parseQRData(code.data);
            if (qrData?.isValid) {
              setScannedData(qrData);
              
              // Si on vient du mode multi-pay, ajouter directement à la liste
              if (previousMode === 'multi-pay') {
                handleAddRecipientToMultiPay(qrData);
              } else {
                setPaymentDestination(qrData.accountNumber);
              }
            }
          }

          setTimeout(() => {
            setIsImporting(false);
            setImportedImageData(null);
          }, 500);
        };
        img.src = imageDataUrl;
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const downloadQRCode = async () => {
    if (!qrCode) return;

    const brandedQRCode = await createBrandedQRCodeDataUrl({
      qrCode,
      title: 'QR paiement eNkamba',
      name: accountName,
      subtitle: accountNumber,
      centerImageSrc: paymentProfileImage,
      variant: 'payment',
    });

    const link = document.createElement('a');
    link.href = brandedQRCode;
    link.download = `eNkamba-QR-${accountNumber}.png`;
    
    try {
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
      toast({ title: 'QR Code Téléchargé ✅' });
    } catch (error) {
      console.error('Erreur téléchargement QR:', error);
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }
  };

  const shareQRCode = async () => {
    if (!qrCode) return;
    if (navigator.share) {
      navigator.share({
        title: 'Mon QR Code eNkamba',
        text: `Envoyez-moi de l\'argent via eNkamba. Compte: ${accountNumber}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(accountNumber);
      toast({ title: 'Compte copié dans le presse-papiers' });
    }
  };

  const validateMultiPayBeforePayment = () => {
    if (!multiPayRecipients.length) {
      toast({
        variant: 'destructive',
        title: 'Aucun bénéficiaire',
        description: 'Ajoutez au moins un bénéficiaire avant de continuer.',
      });
      return false;
    }

    if (multiPayDuplicateCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Doublons détectés',
        description: 'Retirez les bénéficiaires en double avant de payer.',
      });
      return false;
    }

    if (multiPayHasInvalidAmounts || multiPayTotalAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Montants invalides',
        description: 'Tous les bénéficiaires doivent avoir un montant valide.',
      });
      return false;
    }

    if (paymentCurrency === 'CDF' && multiPayDebitTotal > balance) {
      toast({
        variant: 'destructive',
        title: 'Solde insuffisant',
        description: `Vous avez ${balance.toLocaleString('fr-FR')} CDF. Total à débiter: ${multiPayDebitTotal.toLocaleString('fr-FR')} CDF`,
      });
      return false;
    }

    return true;
  };

  const saveMultiPayDraft = () => {
    try {
      const draft = {
        type: multiPayType,
        reason: multiPayReason,
        reference: multiPayReference,
        currency: paymentCurrency,
        recipients: multiPayRecipients,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(`enkamba-multi-pay-draft-${user?.uid || 'guest'}`, JSON.stringify(draft));
      toast({
        title: 'Brouillon enregistré',
        description: 'Vous pourrez reprendre ce paiement multiple plus tard.',
        className: 'bg-primary text-white border-none',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Brouillon non enregistré',
        description: 'Le stockage local est indisponible.',
      });
    }
  };

  const executeMultiPayBatch = async () => {
    if (!validateMultiPayBeforePayment()) return;

    setIsProcessingMultiPay(true);
    const batchReference = `ENKMP${Date.now().toString().slice(-10)}`;
    setMultiPayBatchReference(batchReference);
    const results: Array<{ recipient: string; amount: number; success: boolean; error?: string }> = [];

    for (let index = 0; index < multiPayRecipients.length; index += 1) {
      const recipient = multiPayRecipients[index];
      const amount = parseFloat(recipient.amount);

      toast({
        title: `Paiement ${index + 1}/${multiPayRecipients.length}`,
        description: `Envoi à ${recipient.fullName}...`,
      });

      try {
        const success = await sendMoney({
          amount,
          senderCurrency: paymentCurrency,
          transferMethod: 'account',
          recipientIdentifier: recipient.accountNumber,
          description: `${multiPayReason || selectedMultiPayType.title} | ${recipient.reason || ''} | Réf: ${batchReference}`,
        });

        results.push({
          recipient: recipient.fullName,
          amount,
          success,
          error: success ? undefined : 'Échec du transfert',
        });
      } catch (error: any) {
        results.push({
          recipient: recipient.fullName,
          amount,
          success: false,
          error: error?.message || 'Erreur inconnue',
        });
      }

      if (index < multiPayRecipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    setMultiPayResults(results);
    setIsProcessingMultiPay(false);
    setMultiPayStep(4);

    const successCount = results.filter((result) => result.success).length;
    const failCount = results.length - successCount;
    toast({
      title: failCount ? 'Paiement terminé avec vérification' : 'Paiement envoyé avec succès',
      description: `${successCount} réussi(s), ${failCount} échoué(s).`,
      className: failCount ? undefined : 'bg-primary text-white border-none',
      variant: failCount ? 'destructive' : undefined,
    });
  };

  const downloadMultiPayReceipt = () => {
    const successCount = multiPayResults.filter((result) => result.success).length;
    const rows = multiPayResults.map((result, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${result.recipient}</td>
        <td>${result.amount.toLocaleString('fr-FR')} ${paymentCurrency}</td>
        <td>${result.success ? 'Envoyé' : 'Échec'}</td>
      </tr>
    `).join('');

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reçu paiement multiple ${multiPayBatchReference}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; background: #f8fafc; }
            .receipt { max-width: 780px; margin: 0 auto; background: white; border: 1px solid #dbe7df; border-radius: 18px; overflow: hidden; }
            .header { background: #25543A; color: white; padding: 22px 26px; }
            h1 { margin: 0; font-size: 24px; }
            .content { padding: 24px 26px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
            .label { color: #64748b; font-size: 12px; font-weight: 700; }
            .value { margin-top: 4px; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
            th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            th { background: #f0f7f3; color: #25543A; }
            .total { margin-top: 18px; border-radius: 12px; background: #f0f7f3; padding: 14px; color: #25543A; font-weight: 900; }
          </style>
        </head>
        <body>
          <section class="receipt">
            <div class="header">
              <h1>Reçu Paiement Multiple</h1>
              <p>Référence: ${multiPayBatchReference || 'ENKMP'}</p>
            </div>
            <div class="content">
              <div class="grid">
                <div class="box"><div class="label">Type</div><div class="value">${selectedMultiPayType.title}</div></div>
                <div class="box"><div class="label">Motif</div><div class="value">${multiPayReason}</div></div>
                <div class="box"><div class="label">Bénéficiaires</div><div class="value">${successCount}/${multiPayResults.length} réussis</div></div>
                <div class="box"><div class="label">Date</div><div class="value">${new Date().toLocaleString('fr-FR')}</div></div>
              </div>
              <table>
                <thead><tr><th>#</th><th>Bénéficiaire</th><th>Montant</th><th>Statut</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="total">Total débité demandé: ${multiPayDebitTotal.toLocaleString('fr-FR')} ${paymentCurrency}</div>
            </div>
          </section>
        </body>
      </html>`;

    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `recu-paiement-multiple-${multiPayBatchReference || Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePayment = async () => {
    console.log('=== handlePayment APPELÉE ===');
    console.log('paymentDestination:', paymentDestination);
    console.log('paymentAmount:', paymentAmount);
    console.log('paymentCurrency:', paymentCurrency);
    console.log('scannedData:', scannedData);
    
    if (!paymentDestination || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      console.log('Validation échouée');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs.',
      });
      return;
    }

    // Ouvrir la vérification PIN
    setPinContext('single');
    setShowPinDialog(true);
  };

  const handlePinSuccess = async () => {
    if (pinContext === 'multi') {
      setShowPinDialog(false);
      await executeMultiPayBatch();
      return;
    }

    // PIN vérifié, procéder au paiement
    setShowPinDialog(false);
    
    // Petit délai pour laisser le dialog se fermer proprement
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setIsPaying(true);
    console.log('Appel de sendMoney...');
    
    // Effectuer le vrai transfert
    const success = await sendMoney({
      amount: parseFloat(paymentAmount),
      senderCurrency: paymentCurrency,
      transferMethod: payMethod === 'account' ? 'account' : payMethod === 'phone' ? 'phone' : payMethod === 'card' ? 'card' : 'email',
      recipientIdentifier: paymentDestination,
      description: `Paiement de ${paymentAmount} ${paymentCurrency} à ${scannedData?.fullName || paymentDestination}`,
    });

    setIsPaying(false);
    console.log('Résultat de sendMoney:', success);

    if (success) {
      console.log('Paiement réussi');
      toast({
        title: 'Paiement réussi ! ✅',
        description: `${paymentAmount} ${paymentCurrency} envoyé à ${scannedData?.fullName || paymentDestination}`,
      });

      setMode('receive');
      setScannedData(null);
      setPaymentDestination('');
      setPaymentAmount('');
    } else {
      console.log('Paiement échoué');
      // Le toast d'erreur est déjà affiché par sendMoney
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-md p-4 flex flex-col min-h-screen bg-muted/20">
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <header className="flex items-center justify-between gap-4 mb-4 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-headline text-xl font-bold text-primary">
            {mode === 'receive' ? 'Recevoir de l\'argent' : mode === 'multi-pay' ? 'Paiement Multiple' : 'Scanner QR'}
          </h1>
        </div>
        {mode === 'receive' && (
          <div className="flex gap-2">
            <Button 
              size="icon" 
              className="bg-[#25543A] hover:bg-[#25543A] text-white"
              onClick={() => {
                setPreviousMode('receive');
                setMode('scanner');
                setIsScanning(true);
              }}
            >
              <QrCode className="w-5 h-5" />
            </Button>
          </div>
        )}
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          <canvas ref={canvasRef} className="hidden" />

          {mode === 'receive' && (
            <>
              <div className="w-full max-w-sm space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {qrCode && (
                    <BrandedQRCodeCard
                      qrCode={qrCode}
                      title="QR paiement eNkamba"
                      name={accountName}
                      subtitle={accountNumber}
                      centerImageSrc={paymentProfileImage}
                      variant="payment"
                      qrAlt="Mon QR Code paiement eNkamba"
                    />
                  )}

                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={downloadQRCode}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={shareQRCode}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Les gens peuvent scanner ce code pour vous envoyer de l'argent
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 h-12 text-base font-bold"
                  onClick={() => {
                    setPreviousMode('receive');
                    setMode('scanner');
                  }}
                >
                  Payer quelqu'un
                </Button>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 h-12 text-base font-bold"
                  onClick={() => {
                    setMode('multi-pay');
                    setMultiPayStep(1);
                  }}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Payer à plusieurs
                </Button>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 h-12 text-base font-bold"
                  onClick={() => setMode('transfer')}
                >
                  <ArrowRightLeft className="w-5 h-5 mr-2" />
                  Transfer
                </Button>
              </div>
            </>
          )}

          {mode === 'scanner' && !scannedData && (
            <div className="w-full max-w-sm space-y-4">
              {isImporting && importedImageData ? (
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
                  <img 
                    src={importedImageData} 
                    alt="Imported QR" 
                    className="w-full h-full object-contain p-2 bg-white"
                  />
                  <div className="absolute inset-0 bg-black/30">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#25543A] to-transparent shadow-lg shadow-[#25543A]"
                      style={{ top: `${importProgress}%`, transition: 'top 0.1s linear' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-lg">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    playsInline 
                    muted 
                  />
                  {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Accès Caméra Requis</AlertTitle>
                        <AlertDescription>Veuillez autoriser l'accès à la caméra.</AlertDescription>
                      </Alert>
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-3/4 border-4 border-dashed border-primary/70 rounded-2xl animate-pulse" />
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
                      <p className="animate-pulse">🔍 Recherche de QR Code...</p>
                    </div>
                  )}
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="mr-2" />
                {isImporting ? 'Scan en cours...' : 'Importer une Image'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />

              {previousMode !== 'multi-pay' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-center text-muted-foreground mb-3">QR code introuvable ?</p>
                  <div className="space-y-2">
                    {[
                      { id: 'account', icon: Hash, label: 'Numéro de Compte' },
                      { id: 'phone', icon: Phone, label: 'Numéro de Téléphone' },
                      { id: 'card', icon: CreditCard, label: 'Numéro de Carte' },
                      { id: 'email', icon: Mail, label: 'Adresse Email' },
                    ].map(({ id, icon: Icon, label }) => (
                      <Button
                        key={id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setPayMethod(id);
                          setMode('payment-method');
                        }}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  if (previousMode === 'multi-pay') {
                    setMode('multi-pay');
                  } else {
                    setMode('receive');
                  }
                  setIsScanning(true);
                }}
              >
                Retour
              </Button>
            </div>
          )}

          {mode === 'payment-method' && !scannedData && (
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Label className="text-base font-bold">Entrez le {payMethod === 'account' ? 'numéro de compte' : payMethod === 'phone' ? 'numéro de téléphone' : payMethod === 'card' ? 'numéro de carte' : 'email'}</Label>
                <Input
                  placeholder={payMethod === 'account' ? 'ENK000000000000' : payMethod === 'phone' ? '+243...' : payMethod === 'card' ? '1234 5678 9012 3456' : 'user@example.com'}
                  value={paymentDestination}
                  onChange={(e) => setPaymentDestination(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  if (paymentDestination) {
                    setScannedData({
                      accountNumber: paymentDestination,
                      fullName: paymentDestination,
                      isValid: true,
                    });
                  }
                }}
              >
                Continuer
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setMode('scanner');
                  setPayMethod(null);
                }}
              >
                Retour
              </Button>
            </div>
          )}

          {(mode === 'scanner' || mode === 'payment-method') && scannedData && (
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-primary/10 rounded-full p-4 flex justify-center">
                <User className="h-16 w-16 text-primary" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-muted-foreground">Vous payez à :</p>
                <p className="font-bold text-lg text-primary">{scannedData.fullName}</p>
                <p className="text-xs text-muted-foreground">{scannedData.accountNumber}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <Label htmlFor="amount" className="text-sm">Montant</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      id="amount"
                      type="number" 
                      placeholder="0.00" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="text-center text-2xl h-14 font-bold flex-1"
                    />
                    <Select value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as Currency)}>
                      <SelectTrigger className="w-[100px] h-14 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 h-12 text-base font-bold"
                onClick={handlePayment}
                disabled={isPaying || !paymentAmount}
              >
                {isPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isPaying ? 'Paiement en cours...' : 'Envoyer l\'argent'}
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setScannedData(null);
                  setPaymentDestination('');
                  setPaymentAmount('');
                  setMode('scanner');
                  setIsScanning(true);
                }}
              >
                Annuler
              </Button>
            </div>
          )}

          {mode === 'multi-pay' && (
            <div className="w-full max-w-sm space-y-4">
              <div className="rounded-[8px] border border-primary/15 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">eNKAMBA Pay</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">
                      {multiPayType === 'salary' ? 'Paiement des Salaires' : 'Paiement Multiple'}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">Étape {multiPayStep} sur 4</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </Button>
                </div>

                <div className="mb-5 grid grid-cols-4 gap-2">
                  {[
                    { step: 1, label: 'Type' },
                    { step: 2, label: 'Bénéficiaires' },
                    { step: 3, label: 'Résumé' },
                    { step: 4, label: 'Confirmation' },
                  ].map((item) => (
                    <div key={item.step} className="flex flex-col items-center gap-1">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${
                        multiPayStep >= item.step ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {multiPayStep > item.step ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                      </span>
                      <span className={`text-[10px] font-bold ${multiPayStep >= item.step ? 'text-primary' : 'text-slate-400'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {multiPayStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-black text-slate-950">Choisissez le type de paiement</h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Sélectionnez le mode adapté à votre opération.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {MULTI_PAY_TYPES.map((type) => {
                        const Icon = type.icon;
                        const active = multiPayType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              setMultiPayType(type.id);
                              if (type.id === 'same') setMultiPayReason('Même montant pour tous');
                              else if (type.id === 'salary') setMultiPayReason('Paiement des salaires');
                              else if (type.id === 'bonus') setMultiPayReason('Paiement des primes');
                              else if (type.id === 'commission') setMultiPayReason('Paiement des commissions');
                              else if (type.id === 'suppliers') setMultiPayReason('Paiement fournisseurs');
                            }}
                            className={`min-h-[118px] rounded-[8px] border p-3 text-left transition ${
                              active ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/15' : 'border-slate-200 bg-white hover:border-primary/30'
                            }`}
                          >
                            <span className={`mb-3 grid h-10 w-10 place-items-center rounded-[8px] ${type.tone}`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="block text-sm font-black leading-tight text-slate-950">{type.title}</span>
                            <span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-500">{type.subtitle}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-3 rounded-[8px] bg-slate-50 p-3">
                      <Label>Motif du paiement</Label>
                      <Input value={multiPayReason} onChange={(event) => setMultiPayReason(event.target.value)} placeholder="Salaire, prime, fournisseur..." />
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={multiPayReference} onChange={(event) => setMultiPayReference(event.target.value)} placeholder="Référence interne" />
                        <Select value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as Currency)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CDF">CDF</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(multiPayType === 'salary' || multiPayType === 'scheduled') && (
                        <div className="grid gap-2">
                          <Input value={multiPayBusinessName} onChange={(event) => setMultiPayBusinessName(event.target.value)} placeholder="Entreprise / organisation" />
                          <Input value={multiPayApprover} onChange={(event) => setMultiPayApprover(event.target.value)} placeholder="Validateur financier" />
                        </div>
                      )}
                      {multiPayType === 'scheduled' && (
                        <Input type="date" value={multiPayScheduleDate} onChange={(event) => setMultiPayScheduleDate(event.target.value)} />
                      )}
                    </div>

                    <Button className="h-12 w-full font-black" onClick={() => setMultiPayStep(2)}>
                      Continuer
                    </Button>
                  </div>
                )}

                {multiPayStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Scanner QR', icon: QrCode, action: () => { setPreviousMode('multi-pay'); setMode('scanner'); setIsScanning(true); } },
                        { label: 'Contacts', icon: User, action: handleAddManualRecipient },
                        { label: 'Depuis groupe', icon: Users, action: () => toast({ title: 'Groupe', description: 'Ajoutez les membres manuellement ou par import pour ce lot.' }) },
                        { label: 'Excel', icon: FileSpreadsheet, action: () => multiPayImportRef.current?.click() },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button key={item.label} type="button" onClick={item.action} className="rounded-[8px] border border-slate-200 bg-white p-2 text-center text-[10px] font-black text-slate-700">
                            <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <input ref={multiPayImportRef} type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={handleMultiPayImportFile} />

                    {multiPayType === 'same' && (
                      <div className="rounded-[8px] border border-primary/15 bg-primary/5 p-3">
                        <Label>Même montant pour tous</Label>
                        <div className="mt-2 flex gap-2">
                          <Input type="number" value={multiPaySameAmount} onChange={(event) => setMultiPaySameAmount(event.target.value)} placeholder="Montant" />
                          <Button type="button" variant="outline" onClick={applySameAmountToAll}>Appliquer</Button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-[8px] border border-slate-200 p-3">
                      <p className="mb-3 text-sm font-black text-slate-950">Ajouter un bénéficiaire</p>
                      <div className="grid gap-2">
                        <Input value={manualRecipientName} onChange={(event) => setManualRecipientName(event.target.value)} placeholder="Nom complet / société" />
                        <Input value={manualRecipientIdentifier} onChange={(event) => setManualRecipientIdentifier(event.target.value)} placeholder="Numéro, ID eNkamba ou compte ENK" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={manualRecipientRole} onChange={(event) => setManualRecipientRole(event.target.value)} placeholder="Rôle" />
                          <Input type="number" value={manualRecipientAmount} onChange={(event) => setManualRecipientAmount(event.target.value)} placeholder="Montant" />
                        </div>
                        <Button type="button" variant="outline" className="gap-2" onClick={handleAddManualRecipient}>
                          <Plus className="h-4 w-4" />
                          Ajouter un bénéficiaire
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-950">Liste des bénéficiaires ({multiPayRecipients.length})</p>
                        <button type="button" className="text-xs font-black text-primary" onClick={() => setMultiPayRecipients([])}>Vider</button>
                      </div>
                      {multiPayRecipients.length === 0 ? (
                        <div className="rounded-[8px] border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
                          Aucun bénéficiaire ajouté.
                        </div>
                      ) : (
                        <div className="max-h-[310px] space-y-2 overflow-y-auto pr-1">
                          {multiPayRecipients.map((recipient, index) => (
                            <div key={recipient.id} className="rounded-[8px] border border-slate-200 bg-white p-3">
                              <div className="flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</div>
                                <div className="min-w-0 flex-1">
                                  <Input value={recipient.fullName} onChange={(event) => updateMultiPayRecipient(recipient.id, { fullName: event.target.value })} className="h-8 border-0 bg-transparent px-0 font-black" />
                                  <Input value={recipient.accountNumber} onChange={(event) => updateMultiPayRecipient(recipient.id, { accountNumber: event.target.value })} className="h-8 border-0 bg-transparent px-0 text-xs text-slate-500" />
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeMultiPayRecipient(recipient.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <Input type="number" value={recipient.amount} onChange={(event) => updateMultiPayRecipient(recipient.id, { amount: event.target.value })} placeholder="Montant" className="h-9" />
                                <Input value={recipient.role || ''} onChange={(event) => updateMultiPayRecipient(recipient.id, { role: event.target.value })} placeholder="Rôle / fonction" className="h-9" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-[8px] bg-primary/5 p-3">
                      <div className="flex justify-between text-sm"><span>Bénéficiaires</span><strong>{multiPayRecipients.length}</strong></div>
                      <div className="mt-1 flex justify-between text-sm"><span>Total</span><strong>{multiPayTotalAmount.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                      <div className="mt-1 flex justify-between text-sm"><span>Frais (0,5%)</span><strong>{multiPayFees.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                      <div className="mt-2 flex justify-between border-t border-primary/15 pt-2 text-sm"><span>Total à débiter</span><strong className="text-primary">{multiPayDebitTotal.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setMultiPayStep(1)}>Précédent</Button>
                      <Button onClick={() => {
                        if (validateMultiPayBeforePayment()) setMultiPayStep(3);
                      }}>Continuer</Button>
                    </div>
                  </div>
                )}

                {multiPayStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-black text-slate-950">Résumé du paiement</h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Vérifiez les informations avant validation.</p>
                    </div>
                    <div className="rounded-[8px] border border-slate-200 p-3 text-sm">
                      <div className="flex justify-between py-1"><span className="text-slate-500">Type</span><strong>{selectedMultiPayType.title}</strong></div>
                      <div className="flex justify-between py-1"><span className="text-slate-500">Motif</span><strong className="text-right">{multiPayReason}</strong></div>
                      <div className="flex justify-between py-1"><span className="text-slate-500">Devise</span><strong>{paymentCurrency}</strong></div>
                      <div className="flex justify-between py-1"><span className="text-slate-500">Exécution</span><strong>{multiPayScheduleDate || 'Aujourd’hui'}</strong></div>
                    </div>
                    <div className="rounded-[8px] border border-slate-200 p-3">
                      <div className="mb-2 flex justify-between">
                        <p className="text-sm font-black text-slate-950">Détail des paiements ({multiPayRecipients.length})</p>
                        <button type="button" className="text-xs font-black text-primary" onClick={() => setMultiPayStep(2)}>Modifier</button>
                      </div>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {multiPayRecipients.map((recipient) => (
                          <div key={recipient.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate font-semibold">{recipient.fullName}</span>
                            <strong className="shrink-0">{Number(recipient.amount || 0).toLocaleString('fr-FR')} {paymentCurrency}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[8px] bg-slate-50 p-3 text-sm">
                      <div className="flex justify-between py-1"><span>Total bénéficiaires</span><strong>{multiPayRecipients.length}</strong></div>
                      <div className="flex justify-between py-1"><span>Montant total</span><strong>{multiPayTotalAmount.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                      <div className="flex justify-between py-1"><span>Frais eNKAMBA</span><strong>{multiPayFees.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                      <div className="flex justify-between py-1"><span>Frais opérateur</span><strong>{multiPayOperatorFees.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-black">Total à débiter</span><strong className="text-primary">{multiPayDebitTotal.toLocaleString('fr-FR')} {paymentCurrency}</strong></div>
                    </div>
                    <div className="rounded-[8px] border border-primary/15 bg-primary/5 p-3 text-xs font-semibold text-primary">
                      <ShieldCheck className="mb-2 h-5 w-5" />
                      Les fonds sont sécurisés et la transaction sera exécutée après validation PIN.
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setMultiPayStep(2)}>Modifier</Button>
                      <Button disabled={isProcessingMultiPay} onClick={() => {
                        if (!validateMultiPayBeforePayment()) return;
                        setPinContext('multi');
                        setShowPinDialog(true);
                      }}>
                        {isProcessingMultiPay ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Valider et payer
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="gap-2" onClick={saveMultiPayDraft}><Save className="h-4 w-4" /> Brouillon</Button>
                      <Button variant="ghost" className="gap-2" onClick={() => toast({ title: 'Programmation', description: 'La programmation sera conservée avec la date choisie.' })}><CalendarClock className="h-4 w-4" /> Programmer</Button>
                    </div>
                  </div>
                )}

                {multiPayStep === 4 && (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-950">Paiement envoyé avec succès !</h4>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {multiPayResults.filter((result) => result.success).length} paiement(s) réussi(s) sur {multiPayResults.length}.
                      </p>
                    </div>
                    <div className="rounded-[8px] bg-primary/5 p-4">
                      <p className="text-xs font-bold text-slate-500">Référence de transaction</p>
                      <p className="mt-1 font-mono text-lg font-black text-primary">{multiPayBatchReference || 'ENKMP'}</p>
                    </div>
                    <div className="space-y-2 text-left">
                      {multiPayResults.map((result) => (
                        <div key={`${result.recipient}-${result.amount}`} className="flex items-center justify-between rounded-[8px] border border-slate-200 p-3 text-sm">
                          <span className="font-semibold">{result.recipient}</span>
                          <span className={result.success ? 'font-black text-primary' : 'font-black text-red-600'}>
                            {result.success ? 'Envoyé' : 'Échec'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-between" onClick={downloadMultiPayReceipt}>
                        <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Télécharger le reçu</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button variant="outline" className="w-full justify-between" onClick={() => navigator.share?.({ title: 'Paiement multiple eNkamba', text: `Référence ${multiPayBatchReference}` })}>
                        <span className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Partager le reçu</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button className="h-12 w-full font-black" onClick={() => {
                        resetMultiPay();
                        setMode('receive');
                      }}>
                        Accueil
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {multiPayStep < 4 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    resetMultiPay();
                    setMode('receive');
                  }}
                >
                  Retour
                </Button>
              )}
            </div>
          )}

          {mode === 'transfer' && (
            <TransferByIdentifier
              onCancel={() => setMode('receive')}
              onTransferComplete={(userInfo, transferAmount, transferCurrency) => {
                // Préparer les données pour le paiement
                setScannedData({
                  accountNumber: userInfo.enkNumber,
                  fullName: userInfo.fullName,
                  email: userInfo.email,
                  isValid: true,
                });
                setPaymentDestination(userInfo.enkNumber);
                setPaymentAmount(transferAmount);
                setPaymentCurrency(transferCurrency);
                setPayMethod('account');
                
                // Ouvrir directement la vérification PIN
                setShowPinDialog(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog Vérification PIN */}
      {showPinDialog && (
        <PinVerification
          key={`pin-${Date.now()}`}
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onSuccess={handlePinSuccess}
          paymentDetails={
            pinContext === 'multi'
              ? {
                  recipient: `${multiPayRecipients.length} bénéficiaire(s)`,
                  amount: String(multiPayDebitTotal),
                  currency: paymentCurrency,
                }
              : scannedData
                ? {
                    recipient: scannedData.fullName,
                    amount: paymentAmount,
                    currency: paymentCurrency,
                  }
                : undefined
          }
        />
      )}
    </div>
  );
}
