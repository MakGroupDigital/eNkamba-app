'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  ArrowDownToLine,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Landmark,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Plus,
  QrCode,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Smartphone,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import DashboardHeader from '@/components/dashboard/dashboard-header';
import { EChurchIcon } from '@/components/icons/service-icons';
import { PinVerification } from '@/components/payment/PinVerification';
import { BrandedQRCodeCard, createBrandedQRCodeDataUrl } from '@/components/qrcode/branded-qr-code-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import {
  CHURCH_PAYMENT_CATEGORIES,
  churchStatusLabel,
  createChurchPublicId,
  ECHURCH_ORANGE,
  ECHURCH_PRIMARY,
  formatChurchCurrency,
  getChurchCategory,
  slugifyChurchName,
  type ChurchAccount,
  type ChurchCampaign,
  type ChurchParish,
  type ChurchQrCode,
  type ChurchTransaction,
  type ChurchPaymentCategory,
} from '@/lib/echurch';
import { db } from '@/lib/firebase';

type DashboardTab = 'overview' | 'collect' | 'parishes' | 'campaigns' | 'transactions' | 'reports';
type PendingAction = 'withdrawal' | null;

const accountTypes = [
  { value: 'church', label: 'Église' },
  { value: 'parish', label: 'Paroisse' },
  { value: 'ministry', label: 'Ministère' },
  { value: 'community', label: 'Communauté religieuse' },
] as const;

const toDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate() as Date;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: unknown, includeTime = false) => {
  const date = toDate(value);
  if (!date) return 'En attente';
  return new Intl.DateTimeFormat('fr-CD', {
    day: '2-digit',
    month: 'short',
    year: includeTime ? undefined : 'numeric',
    hour: includeTime ? '2-digit' : undefined,
    minute: includeTime ? '2-digit' : undefined,
  }).format(date);
};

const statusClassName = (status: ChurchAccount['status']) => {
  if (status === 'validated') return 'border-[#073B9A]/15 bg-[#073B9A]/10 text-[#073B9A]';
  if (status === 'rejected' || status === 'suspended') return 'border-red-100 bg-red-50 text-red-700';
  return 'border-[#F51B2B]/20 bg-[#F51B2B]/10 text-[#B15F00]';
};

function ChurchMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <span className="absolute inset-0 rounded-[30%] bg-white/15 ring-1 ring-white/30" />
      <EChurchIcon className="relative h-full w-full" size={44} />
    </span>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Building2; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-7 w-7" /></div>
      <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function EChurchPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<ChurchAccount | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [parishes, setParishes] = useState<ChurchParish[]>([]);
  const [campaigns, setCampaigns] = useState<ChurchCampaign[]>([]);
  const [transactions, setTransactions] = useState<ChurchTransaction[]>([]);
  const [qrCodes, setQrCodes] = useState<ChurchQrCode[]>([]);
  const [institutionalQr, setInstitutionalQr] = useState('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showCreateParish, setShowCreateParish] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingQr, setIsCreatingQr] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [signup, setSignup] = useState({
    name: '',
    legalName: '',
    type: 'church' as ChurchAccount['type'],
    country: 'République démocratique du Congo',
    region: '',
    city: '',
    address: '',
    representativeName: '',
    representativeRole: 'Pasteur principal',
    phone: '',
    email: '',
    slogan: '',
    acceptTerms: false,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [signupStep, setSignupStep] = useState(1);
  const [parishForm, setParishForm] = useState({ name: '', city: '', region: '', address: '' });
  const [campaignForm, setCampaignForm] = useState({ name: '', description: '', targetAmount: '', parishId: '', endsAt: '' });
  const [qrForm, setQrForm] = useState({ type: 'category' as ChurchQrCode['type'], parishId: '', campaignId: '', category: 'offering' as ChurchPaymentCategory });
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', destination: '', note: '' });

  useEffect(() => {
    if (!user) {
      setAccount(null);
      setIsAccountLoading(false);
      return;
    }
    setIsAccountLoading(true);
    const accountQuery = query(collection(db, 'church_accounts'), where('ownerId', '==', user.uid), limit(1));
    return onSnapshot(accountQuery, (snapshot) => {
      const item = snapshot.docs[0];
      setAccount(item ? ({ id: item.id, ...item.data() } as ChurchAccount) : null);
      setIsAccountLoading(false);
    }, () => {
      setIsAccountLoading(false);
      toast({ variant: 'destructive', title: 'eChurch indisponible', description: 'Impossible de charger votre compte Église.' });
    });
  }, [isAuthLoading, toast, user]);

  useEffect(() => {
    if (!account) {
      setParishes([]);
      setCampaigns([]);
      setTransactions([]);
      setQrCodes([]);
      return;
    }
    const accountRef = doc(db, 'church_accounts', account.id);
    const unsubParishes = onSnapshot(query(collection(accountRef, 'parishes'), orderBy('createdAt', 'desc')), (snapshot) => {
      setParishes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChurchParish));
    });
    const unsubCampaigns = onSnapshot(query(collection(accountRef, 'campaigns'), orderBy('createdAt', 'desc')), (snapshot) => {
      setCampaigns(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChurchCampaign));
    });
    const unsubTransactions = onSnapshot(query(collection(accountRef, 'transactions'), orderBy('createdAt', 'desc'), limit(80)), (snapshot) => {
      setTransactions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChurchTransaction));
    });
    const unsubQrs = onSnapshot(query(collection(accountRef, 'payment_qrcodes'), orderBy('createdAt', 'desc'), limit(40)), (snapshot) => {
      setQrCodes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChurchQrCode));
    });
    return () => {
      unsubParishes();
      unsubCampaigns();
      unsubTransactions();
      unsubQrs();
    };
  }, [account]);

  const paymentUrl = useMemo(() => {
    if (!account || typeof window === 'undefined') return '';
    return `${window.location.origin}/church/${account.paymentAlias}`;
  }, [account]);

  useEffect(() => {
    if (!account || account.status !== 'validated') {
      setInstitutionalQr('');
      return;
    }
    let cancelled = false;
    const createQr = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(paymentUrl, {
          width: 360,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark: ECHURCH_PRIMARY, light: '#FFFFFF' },
        });
        if (!cancelled) setInstitutionalQr(dataUrl);
      } catch {
        if (!cancelled) setInstitutionalQr('');
      }
    };
    void createQr();
    return () => { cancelled = true; };
  }, [account, paymentUrl]);

  useEffect(() => {
    if (!account || account.status !== 'validated' || qrCodes.some((item) => item.id === 'institutional')) return;
    void setDoc(doc(db, 'church_accounts', account.id, 'payment_qrcodes', 'institutional'), {
      churchId: account.id,
      alias: account.paymentAlias,
      type: 'institutional',
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: 'system',
    }, { merge: true });
  }, [account, qrCodes]);

  const isValidated = account?.status === 'validated';
  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((transaction) => {
        const date = toDate(transaction.paidAt || transaction.createdAt);
        return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }, [transactions]);
  const todayTotal = useMemo(() => {
    const today = new Date().toDateString();
    return transactions
      .filter((transaction) => toDate(transaction.paidAt || transaction.createdAt)?.toDateString() === today)
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }, [transactions]);
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach((transaction) => totals.set(transaction.categoryLabel, (totals.get(transaction.categoryLabel) || 0) + Number(transaction.amount || 0)));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [transactions]);

  const setSignupFromUser = () => {
    if (!user) return;
    setSignup((current) => ({
      ...current,
      representativeName: current.representativeName || user.displayName || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phoneNumber || '',
    }));
  };

  const createAccount = async () => {
    if (!user) return;
    const requiredFields = [signup.name, signup.country, signup.city, signup.address, signup.representativeName, signup.representativeRole, signup.phone, signup.email];
    if (requiredFields.some((value) => !value.trim()) || !signup.acceptTerms) {
      toast({ variant: 'destructive', title: 'Informations incomplètes', description: 'Complétez les informations requises et confirmez la déclaration.' });
      return;
    }
    setIsSaving(true);
    try {
      const accountRef = doc(collection(db, 'church_accounts'));
      const paymentAlias = `${slugifyChurchName(signup.name)}-${accountRef.id.slice(0, 6).toLowerCase()}`;
      const [logo, legalDocument] = await Promise.all([
        logoFile ? uploadToCloudinary(logoFile, 'image') : Promise.resolve(null),
        documentFile ? uploadToCloudinary(documentFile, 'raw') : Promise.resolve(null),
      ]);
      const data = {
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Administrateur Kenz',
        name: signup.name.trim(),
        type: signup.type,
        country: signup.country.trim(),
        city: signup.city.trim(),
        address: signup.address.trim(),
        representativeName: signup.representativeName.trim(),
        representativeRole: signup.representativeRole.trim(),
        phone: signup.phone.trim(),
        email: signup.email.trim().toLowerCase(),
        defaultCurrency: 'CDF' as const,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kinshasa',
        languages: ['fr'],
        paymentRecipientId: user.uid,
        paymentAlias,
        publicId: createChurchPublicId(signup.country),
        status: 'submitted' as const,
        receivedTotal: 0,
        transactionCount: 0,
        availableBalance: 0,
        createdAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        ...(signup.legalName.trim() ? { legalName: signup.legalName.trim() } : {}),
        ...(signup.region.trim() ? { region: signup.region.trim() } : {}),
        ...(signup.slogan.trim() ? { slogan: signup.slogan.trim() } : {}),
        ...(logo ? { logoUrl: logo.secureUrl } : {}),
      };
      await setDoc(accountRef, data);
      await setDoc(doc(accountRef, 'members', user.uid), {
        uid: user.uid,
        name: data.ownerName,
        email: data.email,
        role: 'super_admin',
        status: 'active',
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'users', user.uid, 'church_accounts', accountRef.id), {
        churchId: accountRef.id,
        name: data.name,
        role: 'super_admin',
        status: 'submitted',
        createdAt: serverTimestamp(),
      });
      if (legalDocument) {
        await setDoc(doc(accountRef, 'documents', 'legal_reference'), {
          type: 'legal_reference',
          fileUrl: legalDocument.secureUrl,
          fileName: documentFile?.name || 'document',
          status: 'submitted',
          uploadedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      await addDoc(collection(accountRef, 'audit_logs'), {
        action: 'church_account_submitted', actorId: user.uid, entityType: 'church_account', entityId: accountRef.id, createdAt: serverTimestamp(),
      });
      toast({ title: 'Compte eChurch soumis', description: 'La vérification Kenz est lancée. Le QR institutionnel sera activé après validation.' });
    } catch (error) {
      console.error('Création eChurch:', error);
      toast({ variant: 'destructive', title: 'Création impossible', description: 'Le compte Église n’a pas pu être soumis. Vérifiez vos fichiers et votre connexion.' });
    } finally {
      setIsSaving(false);
    }
  };

  const createParish = async () => {
    if (!account || !parishForm.name.trim() || !parishForm.city.trim()) {
      toast({ variant: 'destructive', title: 'Paroisse incomplète', description: 'Ajoutez au minimum le nom et la ville.' });
      return;
    }
    setIsSaving(true);
    try {
      const parishRef = doc(collection(db, 'church_accounts', account.id, 'parishes'));
      await setDoc(parishRef, {
        name: parishForm.name.trim(), city: parishForm.city.trim(), country: account.country, status: 'active', receivedTotal: 0, transactionCount: 0, createdAt: serverTimestamp(),
        ...(parishForm.region.trim() ? { region: parishForm.region.trim() } : {}),
        ...(parishForm.address.trim() ? { address: parishForm.address.trim() } : {}),
      });
      await addDoc(collection(db, 'church_accounts', account.id, 'audit_logs'), { action: 'parish_created', actorId: user?.uid, entityType: 'parish', entityId: parishRef.id, createdAt: serverTimestamp() });
      setParishForm({ name: '', city: '', region: '', address: '' });
      setShowCreateParish(false);
      toast({ title: 'Paroisse créée', description: 'Elle peut maintenant être sélectionnée dans les QR et campagnes.' });
    } catch {
      toast({ variant: 'destructive', title: 'Création impossible', description: 'La paroisse n’a pas été enregistrée.' });
    } finally { setIsSaving(false); }
  };

  const createCampaign = async () => {
    if (!account || !campaignForm.name.trim() || Number(campaignForm.targetAmount) <= 0) {
      toast({ variant: 'destructive', title: 'Campagne incomplète', description: 'Indiquez un nom et un objectif supérieur à zéro.' });
      return;
    }
    setIsSaving(true);
    try {
      const parish = parishes.find((item) => item.id === campaignForm.parishId);
      const campaignRef = doc(collection(db, 'church_accounts', account.id, 'campaigns'));
      await setDoc(campaignRef, {
        name: campaignForm.name.trim(), description: campaignForm.description.trim(), targetAmount: Number(campaignForm.targetAmount), collectedAmount: 0,
        currency: 'CDF', status: 'active', createdAt: serverTimestamp(),
        ...(parish ? { parishId: parish.id, parishName: parish.name } : {}),
        ...(campaignForm.endsAt ? { endsAt: new Date(`${campaignForm.endsAt}T23:59:59`) } : {}),
      });
      await addDoc(collection(db, 'church_accounts', account.id, 'audit_logs'), { action: 'campaign_created', actorId: user?.uid, entityType: 'campaign', entityId: campaignRef.id, createdAt: serverTimestamp() });
      setCampaignForm({ name: '', description: '', targetAmount: '', parishId: '', endsAt: '' });
      setShowCreateCampaign(false);
      toast({ title: 'Campagne activée', description: 'Vous pouvez maintenant générer son QR et suivre sa progression.' });
    } catch {
      toast({ variant: 'destructive', title: 'Création impossible', description: 'La campagne n’a pas été enregistrée.' });
    } finally { setIsSaving(false); }
  };

  const createDerivedQr = async () => {
    if (!account) return;
    const parish = parishes.find((item) => item.id === qrForm.parishId);
    const campaign = campaigns.find((item) => item.id === qrForm.campaignId);
    if (qrForm.type === 'parish' && !parish) {
      toast({ variant: 'destructive', title: 'Paroisse requise', description: 'Sélectionnez la paroisse concernée.' });
      return;
    }
    if (qrForm.type === 'campaign' && !campaign) {
      toast({ variant: 'destructive', title: 'Campagne requise', description: 'Sélectionnez la campagne concernée.' });
      return;
    }
    setIsCreatingQr(true);
    try {
      const qrRef = doc(collection(db, 'church_accounts', account.id, 'payment_qrcodes'));
      const category = qrForm.type === 'category' ? getChurchCategory(qrForm.category) : null;
      await setDoc(qrRef, {
        churchId: account.id,
        alias: `${account.paymentAlias}-${qrRef.id.slice(0, 5)}`,
        type: qrForm.type,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
        ...(parish ? { parishId: parish.id, parishName: parish.name } : {}),
        ...(campaign ? { campaignId: campaign.id, campaignName: campaign.name } : {}),
        ...(category ? { category: category.value, categoryLabel: category.label } : {}),
      });
      setShowQrDialog(false);
      setQrForm({ type: 'category', parishId: '', campaignId: '', category: 'offering' });
      toast({ title: 'QR contextuel créé', description: 'Il classe automatiquement les contributions reçues.' });
    } catch {
      toast({ variant: 'destructive', title: 'QR indisponible', description: 'Le QR n’a pas pu être créé.' });
    } finally { setIsCreatingQr(false); }
  };

  const requestWithdrawal = async () => {
    if (!account) return;
    const amount = Number(withdrawalForm.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !withdrawalForm.destination.trim()) {
      toast({ variant: 'destructive', title: 'Demande incomplète', description: 'Ajoutez un montant et le compte de destination.' });
      return;
    }
    if (amount > Number(account.availableBalance || 0)) {
      toast({ variant: 'destructive', title: 'Solde insuffisant', description: 'Le montant dépasse le solde eChurch disponible.' });
      return;
    }
    setPendingAction('withdrawal');
    setShowPin(true);
  };

  const handlePinSuccess = async () => {
    if (!account || pendingAction !== 'withdrawal') return;
    setShowPin(false);
    setPendingAction(null);
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'church_accounts', account.id, 'withdrawals'), {
        amount: Number(withdrawalForm.amount), currency: 'CDF', destination: withdrawalForm.destination.trim(), note: withdrawalForm.note.trim() || null,
        status: 'pending_approval', requestedBy: user?.uid, requestedAt: serverTimestamp(), approvals: [], requiredApprovals: 2,
      });
      await addDoc(collection(db, 'church_accounts', account.id, 'audit_logs'), { action: 'withdrawal_requested', actorId: user?.uid, entityType: 'withdrawal', createdAt: serverTimestamp() });
      setWithdrawalForm({ amount: '', destination: '', note: '' });
      setShowWithdrawalDialog(false);
      toast({ title: 'Retrait soumis', description: 'La demande attend les validations requises avant exécution.' });
    } catch {
      toast({ variant: 'destructive', title: 'Demande impossible', description: 'Le retrait n’a pas pu être enregistré.' });
    } finally { setIsSaving(false); }
  };

  const copy = async (value: string, label = 'Lien copié') => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: label, description: 'Vous pouvez maintenant le partager.' });
    } catch {
      toast({ variant: 'destructive', title: 'Copie impossible', description: 'Sélectionnez le lien manuellement.' });
    }
  };

  const share = async (url: string, title: string) => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { return; }
    }
    await copy(url, 'Lien prêt à partager');
  };

  const downloadInstitutionalQr = async () => {
    if (!account || !institutionalQr) return;
    const result = await createBrandedQRCodeDataUrl({
      qrCode: institutionalQr,
      title: 'QR de contribution',
      name: account.name,
      subtitle: account.publicId,
      details: [{ label: 'Paiement', value: 'Kenz Church Pay' }],
      centerImageSrc: account.logoUrl || '/eChurchLogo.jpeg',
      variant: 'payment',
    });
    const link = document.createElement('a');
    link.href = result;
    link.download = `qr-${account.paymentAlias}.png`;
    link.click();
  };

  const downloadReport = () => {
    if (!account) return;
    const report = new jsPDF();
    report.setFillColor(10, 139, 70);
    report.rect(0, 0, 210, 30, 'F');
    report.setTextColor(255, 255, 255);
    report.setFont('helvetica', 'bold');
    report.setFontSize(17);
    report.text('Kenz Church Pay', 15, 17);
    report.setFontSize(10);
    report.text(account.name, 15, 24);
    report.setTextColor(15, 23, 42);
    report.setFontSize(18);
    report.text('Rapport de collecte', 15, 48);
    report.setFont('helvetica', 'normal');
    report.setFontSize(10);
    report.text(`Généré le ${new Intl.DateTimeFormat('fr-CD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`, 15, 55);
    const lines = [
      `Total disponible : ${formatChurchCurrency(account.availableBalance)}`,
      `Collecté ce mois : ${formatChurchCurrency(currentMonthTotal)}`,
      `Transactions reçues : ${transactions.length}`,
      `Paroisses actives : ${parishes.filter((item) => item.status === 'active').length}`,
      '',
      'Dernières contributions :',
      ...transactions.slice(0, 18).map((item) => `${formatDate(item.paidAt || item.createdAt)} - ${item.categoryLabel} - ${formatChurchCurrency(item.amount)}${item.parishName ? ` - ${item.parishName}` : ''}`),
    ];
    report.text(lines, 15, 68, { maxWidth: 180, lineHeightFactor: 1.6 });
    report.setTextColor(100, 116, 139);
    report.setFontSize(8);
    report.text('Document généré par Kenz Church Pay. Les données financières restent traçables dans le journal du compte.', 15, 286, { maxWidth: 180 });
    report.save(`rapport-echurch-${slugifyChurchName(account.name)}.pdf`);
  };

  if (isAuthLoading || isAccountLoading) {
    return (
      <><DashboardHeader /><main className="min-h-screen bg-[#FFFFFF] pt-24"><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></main></>
    );
  }

  if (!user) {
    return (
      <><DashboardHeader /><main className="min-h-screen bg-[#FFFFFF] px-4 pb-8 pt-24"><section className="mx-auto max-w-lg rounded-3xl bg-white p-7 text-center shadow-sm"><ChurchMark className="mx-auto h-16 w-16" /><h1 className="mt-5 text-2xl font-black text-slate-950">Kenz Church Pay</h1><p className="mt-2 text-sm leading-6 text-slate-600">Connectez-vous pour créer ou administrer votre compte Église.</p><Button asChild className="mt-6 bg-primary hover:bg-primary"><Link href="/login">Se connecter</Link></Button></section></main></>
    );
  }

  if (!account) {
    return (
      <>
        <DashboardHeader />
        <main className="min-h-screen bg-[#FFFFFF] px-3 pb-10 pt-24 sm:px-5">
          <section className="mx-auto max-w-3xl overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-primary/10">
            <div className="relative overflow-hidden bg-primary px-5 pb-20 pt-6 text-white sm:px-8">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">Kenz Pay</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">eChurch</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/84">Centralisez les dons, dîmes, offrandes et campagnes de votre communauté avec Kenz Pay.</p></div><ChurchMark className="h-16 w-16 shrink-0" /></div>
            </div>
            <div className="-mt-12 px-4 pb-6 sm:px-7">
              <div className="rounded-2xl bg-white p-4 shadow-lg shadow-black/10 ring-1 ring-slate-950/5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-950">Créer un compte institutionnel</p><p className="mt-1 text-xs text-slate-600">Étape {signupStep} sur 3</p></div><span className="text-sm font-black text-primary">{Math.round((signupStep / 3) * 100)}%</span></div><Progress value={(signupStep / 3) * 100} className="mt-3 h-1.5" /></div>
              <div className="mt-5">
                {signupStep === 1 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nom officiel de l'Église *" className="sm:col-span-2"><Input value={signup.name} onFocus={setSignupFromUser} onChange={(event) => setSignup({ ...signup, name: event.target.value })} placeholder="Ex. Centre Chrétien Kenz" /></FormField><FormField label="Type de structure"><Select value={signup.type} onValueChange={(value) => setSignup({ ...signup, type: value as ChurchAccount['type'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accountTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></FormField><FormField label="Nom légal (facultatif)"><Input value={signup.legalName} onChange={(event) => setSignup({ ...signup, legalName: event.target.value })} placeholder="Dénomination ou association" /></FormField><FormField label="Slogan (facultatif)" className="sm:col-span-2"><Input value={signup.slogan} onChange={(event) => setSignup({ ...signup, slogan: event.target.value })} placeholder="Votre message de communauté" /></FormField></div>}
                {signupStep === 2 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Pays *"><Input value={signup.country} onChange={(event) => setSignup({ ...signup, country: event.target.value })} /></FormField><FormField label="Province / région"><Input value={signup.region} onChange={(event) => setSignup({ ...signup, region: event.target.value })} /></FormField><FormField label="Ville *"><Input value={signup.city} onChange={(event) => setSignup({ ...signup, city: event.target.value })} /></FormField><FormField label="Adresse complète *"><Input value={signup.address} onChange={(event) => setSignup({ ...signup, address: event.target.value })} /></FormField><FormField label="Nom du représentant légal *"><Input value={signup.representativeName} onFocus={setSignupFromUser} onChange={(event) => setSignup({ ...signup, representativeName: event.target.value })} /></FormField><FormField label="Fonction *"><Input value={signup.representativeRole} onChange={(event) => setSignup({ ...signup, representativeRole: event.target.value })} /></FormField><FormField label="Téléphone officiel *"><Input value={signup.phone} onFocus={setSignupFromUser} onChange={(event) => setSignup({ ...signup, phone: event.target.value })} /></FormField><FormField label="Email officiel *"><Input type="email" value={signup.email} onFocus={setSignupFromUser} onChange={(event) => setSignup({ ...signup, email: event.target.value })} /></FormField></div>}
                {signupStep === 3 && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><FormField label="Logo de l'Église"><input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} /><Button type="button" variant="outline" className="w-full justify-start" onClick={() => logoInputRef.current?.click()}><Plus className="mr-2 h-4 w-4" />{logoFile ? logoFile.name : 'Ajouter un logo'}</Button></FormField><FormField label="Document de référence"><Input type="file" accept=".pdf,image/*,.doc,.docx" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} /></FormField></div><div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-4"><div className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white"><ShieldCheck className="h-4 w-4" /></span><div><p className="text-sm font-black text-slate-950">Compte de réception Kenz Pay</p><p className="mt-1 text-xs leading-5 text-slate-600">Le wallet sécurisé du représentant servira à la réception institutionnelle. Les collectes seront séparées dans le solde eChurch et soumises aux validations de retrait.</p></div></div></div><label className="flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm text-slate-700"><Switch checked={signup.acceptTerms} onCheckedChange={(checked) => setSignup({ ...signup, acceptTerms: checked })} /><span>Je confirme représenter cette structure et je soumets les informations pour vérification Kenz.</span></label></div>}
              </div>
              <div className="mt-7 flex items-center justify-between gap-3 border-t pt-5"><Button type="button" variant="ghost" disabled={signupStep === 1} onClick={() => setSignupStep((value) => Math.max(1, value - 1))}>Retour</Button>{signupStep < 3 ? <Button type="button" className="bg-primary hover:bg-primary" onClick={() => { setSignupFromUser(); setSignupStep((value) => Math.min(3, value + 1)); }}>Continuer <ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button type="button" className="bg-primary hover:bg-primary" disabled={isSaving} onClick={createAccount}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Soumettre le compte</Button>}</div>
            </div>
          </section>
        </main>
      </>
    );
  }

  const recentTransactions = transactions.slice(0, 6);
  const accountLogo = account.logoUrl || '/eChurchLogo.jpeg';

  return (
    <>
      <DashboardHeader />
      <main className="min-h-screen bg-[#FFFFFF] px-3 pb-10 pt-24 sm:px-5">
        <div className="mx-auto max-w-6xl space-y-4">
          <section className="relative overflow-hidden rounded-[24px] bg-primary px-4 py-5 text-white shadow-lg shadow-primary/15 sm:px-6">
            <div className="absolute -right-14 -top-20 h-48 w-48 rounded-full bg-white/10" /><div className="absolute bottom-[-62px] right-24 h-36 w-36 rounded-full border border-white/15" />
            <div className="relative flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white p-1 shadow-sm">{account.logoUrl ? <img src={account.logoUrl} alt="Logo" className="h-full w-full rounded-xl object-cover" /> : <ChurchMark className="h-full w-full" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-lg font-black sm:text-xl">{account.name}</p><Badge className={`border px-2 py-0.5 text-[10px] font-black ${statusClassName(account.status)}`}>{churchStatusLabel[account.status]}</Badge></div><p className="mt-1 text-xs text-white/75">{account.publicId} · Kenz Church Pay</p></div></div><div className="flex items-center gap-2"><Button type="button" size="icon" variant="ghost" className="rounded-xl text-white hover:bg-white/10 hover:text-white" title="Notifications"><Bell className="h-5 w-5" /></Button><Button type="button" size="icon" variant="ghost" className="rounded-xl text-white hover:bg-white/10 hover:text-white" title="Paramètres"><Settings2 className="h-5 w-5" /></Button></div></div>
            {isValidated ? <div className="relative mt-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold text-white/70">Solde eChurch disponible</p><p className="mt-1 text-3xl font-black tracking-tight">{formatChurchCurrency(account.availableBalance)}</p><p className="mt-1 text-xs text-white/75">Collectes centralisées et traçables</p></div><div className="flex gap-2"><Button type="button" className="bg-white text-primary hover:bg-white/90" onClick={() => { setActiveTab('collect'); setTimeout(() => document.getElementById('echurch-collect')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }}><QrCode className="mr-2 h-4 w-4" />Encaisser</Button><Button type="button" className="border border-white/25 bg-white/10 text-white hover:bg-white/15" onClick={() => setShowWithdrawalDialog(true)}><ArrowDownToLine className="mr-2 h-4 w-4" />Retrait</Button></div></div> : <div className="relative mt-5 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/92"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#F51B2B]" /><p>{account.status === 'rejected' ? account.rejectionReason || 'Des informations doivent être corrigées avant l’activation.' : 'Votre compte est en cours de vérification. Le QR institutionnel et la collecte seront activés après validation Kenz.'}</p></div></div>}
          </section>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="space-y-4">
            <div className="rounded-[22px] border border-primary/10 bg-white p-2 shadow-[0_10px_28px_rgba(7, 59, 154,0.06)]">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 bg-transparent p-0 sm:grid-cols-6">
                <ChurchTab value="overview" icon={BarChart3} label="Aperçu" />
                <ChurchTab value="collect" icon={QrCode} label="Encaisser" />
                <ChurchTab value="parishes" icon={Building2} label="Paroisses" />
                <ChurchTab value="campaigns" icon={Megaphone} label="Campagnes" tone="orange" />
                <ChurchTab value="transactions" icon={ReceiptText} label="Transactions" />
                <ChurchTab value="reports" icon={FileText} label="Rapports" />
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={WalletCards} label="Disponible" value={formatChurchCurrency(account.availableBalance)} tone="green" /><Metric icon={Landmark} label="Ce mois" value={formatChurchCurrency(currentMonthTotal)} tone="orange" /><Metric icon={ReceiptText} label="Contributions" value={String(account.transactionCount || 0)} tone="green" /><Metric icon={Building2} label="Paroisses actives" value={String(parishes.filter((item) => item.status === 'active').length)} tone="green" /></div>
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Collectes récentes" action={<Button variant="ghost" className="h-auto px-0 text-xs font-bold text-primary" onClick={() => setActiveTab('transactions')}>Voir tout <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>} />{recentTransactions.length ? <div className="mt-2 divide-y">{recentTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}</div> : <EmptyState icon={ReceiptText} title="Aucune contribution" description="Les dons reçus via le QR ou le lien de paiement apparaîtront ici." action={isValidated ? <Button size="sm" onClick={() => setActiveTab('collect')} className="bg-primary hover:bg-primary">Ouvrir le QR</Button> : undefined} />}</CardContent></Card>
                <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Répartition par motif" />{categoryTotals.length ? <div className="mt-5 space-y-4">{categoryTotals.map(([label, total], index) => { const largest = categoryTotals[0]?.[1] || 1; return <div key={label}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-700">{label}</span><span className="font-black text-slate-950">{formatChurchCurrency(total)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (total / largest) * 100)}%`, opacity: 1 - index * 0.12 }} /></div></div>; })}</div> : <EmptyState icon={BarChart3} title="Données à venir" description="La répartition des contributions se construira automatiquement." />}</CardContent></Card></div>
              <div className="grid gap-4 lg:grid-cols-2"><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Campagnes actives" action={<Button variant="ghost" className="h-auto px-0 text-xs font-bold text-primary" onClick={() => setActiveTab('campaigns')}>Gérer <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>} />{campaigns.length ? <div className="mt-3 space-y-3">{campaigns.slice(0, 3).map((campaign) => <CampaignProgress key={campaign.id} campaign={campaign} />)}</div> : <EmptyState icon={Megaphone} title="Aucune campagne" description="Lancez une campagne et suivez les contributions vers un objectif précis." action={isValidated ? <Button size="sm" className="bg-primary hover:bg-primary" onClick={() => setShowCreateCampaign(true)}>Créer une campagne</Button> : undefined} />}</CardContent></Card>
                <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Contrôle et sécurité" /><div className="mt-4 space-y-3"><SecurityLine icon={ShieldCheck} label="QR institutionnel" value={isValidated ? 'Actif et traçable' : 'En attente de validation'} success={isValidated} /><SecurityLine icon={UsersRound} label="Rôles institutionnels" value="Super administrateur actif" success /><SecurityLine icon={ClipboardList} label="Retraits" value="Validation multi-niveaux" success /></div></CardContent></Card></div>
            </TabsContent>

            <TabsContent value="collect" className="mt-0" id="echurch-collect"><div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">{isValidated && institutionalQr ? <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">QR institutionnel</p><h2 className="mt-1 text-xl font-black text-slate-950">Collecte générale</h2><p className="mt-1 text-sm leading-6 text-slate-600">Un QR unique, permanent et prêt à imprimer pour toutes vos contributions.</p><div className="mx-auto mt-5 max-w-sm"><BrandedQRCodeCard qrCode={institutionalQr} title="Contribution eChurch" name={account.name} subtitle={account.publicId} centerImageSrc={accountLogo} variant="payment" /></div><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => copy(paymentUrl)}><Copy className="mr-2 h-4 w-4" />Copier</Button><Button className="bg-primary hover:bg-primary" onClick={downloadInstitutionalQr}><Download className="mr-2 h-4 w-4" />Télécharger</Button></div><Button variant="ghost" className="mt-2 w-full text-primary" onClick={() => share(paymentUrl, `Contribution - ${account.name}`)}><LinkIcon className="mr-2 h-4 w-4" />Partager le lien</Button></CardContent></Card> : <Card className="rounded-2xl border-0 shadow-sm"><EmptyState icon={QrCode} title="QR en attente" description="Le QR institutionnel est généré automatiquement lorsque le compte est validé par Kenz." /></Card>}
              <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-5"><SectionHeading title="QR et liens contextuels" action={isValidated ? <Button size="sm" className="bg-primary hover:bg-primary" onClick={() => setShowQrDialog(true)}><Plus className="mr-1 h-4 w-4" />Créer un QR</Button> : undefined} /><p className="mt-1 text-sm leading-6 text-slate-600">Classez automatiquement les entrées par paroisse, campagne ou motif sans modifier le QR principal.</p>{qrCodes.filter((item) => item.id !== 'institutional').length ? <div className="mt-4 space-y-2">{qrCodes.filter((item) => item.id !== 'institutional').map((item) => { const url = `${paymentUrl}?qr=${item.id}`; return <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><QrCode className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{item.campaignName || item.parishName || item.categoryLabel || 'QR eChurch'}</p><p className="mt-0.5 text-xs text-slate-500">{item.type === 'campaign' ? 'Campagne' : item.type === 'parish' ? 'Paroisse' : 'Motif'} · Actif</p></div><Button variant="ghost" size="icon" onClick={() => copy(url)} title="Copier le lien"><Copy className="h-4 w-4" /></Button></div>; })}</div> : <EmptyState icon={QrCode} title="Aucun QR contextuel" description="Créez un QR pour un culte, une paroisse ou une campagne spécifique." action={isValidated ? <Button size="sm" className="bg-primary hover:bg-primary" onClick={() => setShowQrDialog(true)}>Créer le premier QR</Button> : undefined} />}</CardContent></Card></div></TabsContent>

            <TabsContent value="parishes" className="mt-0"><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Paroisses et implantations" action={isValidated ? <Button size="sm" className="bg-primary hover:bg-primary" onClick={() => setShowCreateParish(true)}><Plus className="mr-1 h-4 w-4" />Ajouter</Button> : undefined} />{parishes.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{parishes.map((parish) => <div key={parish.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate font-black text-slate-950">{parish.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{parish.city}{parish.region ? `, ${parish.region}` : ''}</p></div></div><Badge className="border border-primary/15 bg-primary/10 text-[10px] text-primary">Active</Badge></div><div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-slate-500">Collecté</p><p className="mt-0.5 text-base font-black text-slate-950">{formatChurchCurrency(parish.receivedTotal)}</p></div><p className="text-xs font-bold text-slate-500">{parish.transactionCount || 0} opérations</p></div></div>)}</div> : <EmptyState icon={Building2} title="Aucune paroisse" description="Ajoutez vos implantations pour séparer les collectes et les rapports par localité." action={isValidated ? <Button className="bg-primary hover:bg-primary" onClick={() => setShowCreateParish(true)}>Ajouter une paroisse</Button> : undefined} />}</CardContent></Card></TabsContent>

            <TabsContent value="campaigns" className="mt-0"><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Campagnes et événements" action={isValidated ? <Button size="sm" className="bg-primary hover:bg-primary" onClick={() => setShowCreateCampaign(true)}><Plus className="mr-1 h-4 w-4" />Créer</Button> : undefined} />{campaigns.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div> : <EmptyState icon={Megaphone} title="Aucune campagne" description="Créez une collecte dédiée à la construction, une conférence ou une action sociale." action={isValidated ? <Button className="bg-primary hover:bg-primary" onClick={() => setShowCreateCampaign(true)}>Créer une campagne</Button> : undefined} />}</CardContent></Card></TabsContent>

            <TabsContent value="transactions" className="mt-0"><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><SectionHeading title="Journal des contributions" action={<span className="text-xs font-bold text-slate-500">{transactions.length} opération(s)</span>} />{transactions.length ? <div className="mt-3 divide-y">{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} detailed />)}</div> : <EmptyState icon={ReceiptText} title="Aucune opération" description="Chaque contribution validée via Kenz Pay apparaîtra ici avec sa référence et son motif." />}</CardContent></Card></TabsContent>

            <TabsContent value="reports" className="mt-0"><div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Rapport institutionnel</p><h2 className="mt-2 text-xl font-black text-slate-950">Une vision claire des collectes</h2><p className="mt-2 text-sm leading-6 text-slate-600">Générez un rapport récapitulatif des entrées, motifs, paroisses et dernières contributions.</p><div className="mt-5 grid grid-cols-2 gap-3"><ReportMetric label="Aujourd’hui" value={formatChurchCurrency(todayTotal)} /><ReportMetric label="Ce mois" value={formatChurchCurrency(currentMonthTotal)} /><ReportMetric label="Paroisses" value={String(parishes.length)} /><ReportMetric label="Transactions" value={String(transactions.length)} /></div><Button className="mt-5 w-full bg-primary hover:bg-primary" onClick={downloadReport}><Download className="mr-2 h-4 w-4" />Télécharger le rapport PDF</Button></CardContent></Card><Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-5"><SectionHeading title="Retraits contrôlés" /><p className="mt-2 text-sm leading-6 text-slate-600">Toute sortie de fonds est tracée et demande les validations prévues par votre organisation.</p><div className="mt-5 rounded-2xl bg-primary/[0.05] p-4"><p className="text-xs font-bold text-slate-600">Solde éligible</p><p className="mt-1 text-2xl font-black text-primary">{formatChurchCurrency(account.availableBalance)}</p><p className="mt-2 text-xs leading-5 text-slate-600">Le trésorier prépare la demande ; les responsables autorisés la valident avant exécution.</p></div><Button variant="outline" className="mt-4 w-full border-primary/20 text-primary hover:bg-primary/5" disabled={!isValidated} onClick={() => setShowWithdrawalDialog(true)}><ArrowDownToLine className="mr-2 h-4 w-4" />Demander un retrait</Button></CardContent></Card></div></TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showCreateParish} onOpenChange={setShowCreateParish}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Ajouter une paroisse</DialogTitle><DialogDescription>Cette implantation pourra disposer de ses propres QR et rapports.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><FormField label="Nom de la paroisse *" className="sm:col-span-2"><Input value={parishForm.name} onChange={(event) => setParishForm({ ...parishForm, name: event.target.value })} placeholder="Ex. Paroisse Kinshasa Centre" /></FormField><FormField label="Ville *"><Input value={parishForm.city} onChange={(event) => setParishForm({ ...parishForm, city: event.target.value })} /></FormField><FormField label="Région / province"><Input value={parishForm.region} onChange={(event) => setParishForm({ ...parishForm, region: event.target.value })} /></FormField><FormField label="Adresse" className="sm:col-span-2"><Input value={parishForm.address} onChange={(event) => setParishForm({ ...parishForm, address: event.target.value })} /></FormField></div><DialogFooter><Button variant="outline" onClick={() => setShowCreateParish(false)}>Annuler</Button><Button className="bg-primary hover:bg-primary" onClick={createParish} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Créer une campagne</DialogTitle><DialogDescription>Créez un objectif clair puis diffusez son QR dédié.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><FormField label="Nom de la campagne *" className="sm:col-span-2"><Input value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} placeholder="Ex. Construction du temple" /></FormField><FormField label="Objectif (CDF) *"><Input type="number" min="1" value={campaignForm.targetAmount} onChange={(event) => setCampaignForm({ ...campaignForm, targetAmount: event.target.value })} /></FormField><FormField label="Fin de campagne"><Input type="date" value={campaignForm.endsAt} onChange={(event) => setCampaignForm({ ...campaignForm, endsAt: event.target.value })} /></FormField><FormField label="Paroisse concernée" className="sm:col-span-2"><Select value={campaignForm.parishId || 'all'} onValueChange={(value) => setCampaignForm({ ...campaignForm, parishId: value === 'all' ? '' : value })}><SelectTrigger><SelectValue placeholder="Toute l'Église" /></SelectTrigger><SelectContent><SelectItem value="all">Toute l'Église</SelectItem>{parishes.map((parish) => <SelectItem key={parish.id} value={parish.id}>{parish.name}</SelectItem>)}</SelectContent></Select></FormField><FormField label="Description" className="sm:col-span-2"><Textarea value={campaignForm.description} onChange={(event) => setCampaignForm({ ...campaignForm, description: event.target.value })} placeholder="Objectif, bénéficiaire, précisions..." /></FormField></div><DialogFooter><Button variant="outline" onClick={() => setShowCreateCampaign(false)}>Annuler</Button><Button className="bg-primary hover:bg-primary" onClick={createCampaign} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Activer</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Créer un QR contextuel</DialogTitle><DialogDescription>Le QR conserve le compte Église tout en préremplissant la destination de la contribution.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><FormField label="Type de QR"><Select value={qrForm.type} onValueChange={(value) => setQrForm({ ...qrForm, type: value as ChurchQrCode['type'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="category">Par motif</SelectItem><SelectItem value="parish">Par paroisse</SelectItem><SelectItem value="campaign">Par campagne</SelectItem></SelectContent></Select></FormField>{qrForm.type === 'category' && <FormField label="Motif"><Select value={qrForm.category} onValueChange={(value) => setQrForm({ ...qrForm, category: value as ChurchPaymentCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHURCH_PAYMENT_CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></FormField>}{qrForm.type === 'parish' && <FormField label="Paroisse"><Select value={qrForm.parishId} onValueChange={(value) => setQrForm({ ...qrForm, parishId: value })}><SelectTrigger><SelectValue placeholder="Choisir une paroisse" /></SelectTrigger><SelectContent>{parishes.map((parish) => <SelectItem key={parish.id} value={parish.id}>{parish.name}</SelectItem>)}</SelectContent></Select></FormField>}{qrForm.type === 'campaign' && <FormField label="Campagne"><Select value={qrForm.campaignId} onValueChange={(value) => setQrForm({ ...qrForm, campaignId: value })}><SelectTrigger><SelectValue placeholder="Choisir une campagne" /></SelectTrigger><SelectContent>{campaigns.filter((campaign) => campaign.status === 'active').map((campaign) => <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>)}</SelectContent></Select></FormField>}</div><DialogFooter><Button variant="outline" onClick={() => setShowQrDialog(false)}>Annuler</Button><Button className="bg-primary hover:bg-primary" disabled={isCreatingQr} onClick={createDerivedQr}>{isCreatingQr && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Demander un retrait</DialogTitle><DialogDescription>La demande sera journalisée et soumise aux validations prévues.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><FormField label="Montant (CDF)"><Input type="number" min="1" max={account.availableBalance} value={withdrawalForm.amount} onChange={(event) => setWithdrawalForm({ ...withdrawalForm, amount: event.target.value })} /></FormField><FormField label="Compte ou destination"><Input value={withdrawalForm.destination} onChange={(event) => setWithdrawalForm({ ...withdrawalForm, destination: event.target.value })} placeholder="Wallet, mobile money ou compte bancaire" /></FormField><FormField label="Motif / note"><Textarea value={withdrawalForm.note} onChange={(event) => setWithdrawalForm({ ...withdrawalForm, note: event.target.value })} placeholder="Facultatif" /></FormField></div><DialogFooter><Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>Annuler</Button><Button className="bg-primary hover:bg-primary" onClick={requestWithdrawal}>Continuer</Button></DialogFooter></DialogContent></Dialog>
      <PinVerification isOpen={showPin} onClose={() => { setShowPin(false); setPendingAction(null); }} onSuccess={handlePinSuccess} purpose="payment" paymentDetails={{ recipient: account.name, amount: withdrawalForm.amount || '0', currency: 'CDF' }} />
    </>
  );
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-bold text-slate-700">{label}</Label>{children}</div>; }
function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="flex items-center justify-between gap-3"><h2 className="text-base font-black text-slate-950">{title}</h2>{action}</div>; }
function ChurchTab({ value, label, icon: Icon, tone = 'green' }: { value: DashboardTab; label: string; icon: typeof BarChart3; tone?: 'green' | 'orange' }) {
  const iconClassName = tone === 'orange'
    ? 'bg-[#F51B2B]/10 text-[#F51B2B]'
    : 'bg-primary/10 text-primary';

  return (
    <TabsTrigger
      value={value}
      className="group relative flex h-[62px] min-w-0 items-center justify-start gap-2.5 overflow-hidden rounded-[16px] border border-transparent px-2.5 text-left text-xs font-black text-slate-600 transition-all duration-200 hover:border-primary/10 hover:bg-primary/[0.045] hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_8px_18px_rgba(7, 59, 154,0.22)] sm:h-[66px] sm:flex-col sm:justify-center sm:gap-1 sm:px-2"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${iconClassName} transition-colors duration-200 group-data-[state=active]:bg-white/15 group-data-[state=active]:text-white`}>
        <Icon className="h-[18px] w-[18px] stroke-[2.25]" />
      </span>
      <span className="min-w-0 truncate leading-none">{label}</span>
      <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#F51B2B] opacity-0 transition-opacity group-data-[state=active]:opacity-100 sm:bottom-1" />
    </TabsTrigger>
  );
}
function Metric({ icon: Icon, label, value, tone }: { icon: typeof WalletCards; label: string; value: string; tone: 'green' | 'orange' }) { const color = tone === 'orange' ? 'bg-[#F51B2B]/10 text-[#F51B2B]' : 'bg-primary/10 text-primary'; return <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="p-4"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><p className="mt-3 text-xs font-bold text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-black text-slate-950">{value}</p></CardContent></Card>; }
function TransactionRow({ transaction, detailed = false }: { transaction: ChurchTransaction; detailed?: boolean }) { return <div className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ReceiptText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{transaction.categoryLabel}</p><p className="mt-0.5 truncate text-xs text-slate-500">{transaction.isAnonymous ? 'Contribution anonyme' : transaction.contributorName || 'Fidèle Kenz'}{transaction.parishName ? ` · ${transaction.parishName}` : ''}</p>{detailed && <p className="mt-1 text-[11px] font-medium text-slate-400">{transaction.reference} · {formatDate(transaction.paidAt || transaction.createdAt, true)}</p>}</div><div className="text-right"><p className="text-sm font-black text-primary">+{formatChurchCurrency(transaction.amount)}</p><p className="mt-0.5 text-[11px] text-slate-500">{formatDate(transaction.paidAt || transaction.createdAt)}</p></div></div>; }
function CampaignProgress({ campaign }: { campaign: ChurchCampaign }) { const progress = Math.min(100, Math.round((Number(campaign.collectedAmount || 0) / Math.max(1, Number(campaign.targetAmount || 0))) * 100)); return <div className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{campaign.name}</p><p className="mt-0.5 text-xs text-slate-500">{campaign.parishName || 'Toute l’Église'}</p></div><span className="text-sm font-black text-primary">{progress}%</span></div><Progress value={progress} className="mt-3 h-1.5" /><div className="mt-2 flex justify-between text-xs font-semibold text-slate-500"><span>{formatChurchCurrency(campaign.collectedAmount)}</span><span>{formatChurchCurrency(campaign.targetAmount)}</span></div></div>; }
function CampaignCard({ campaign }: { campaign: ChurchCampaign }) { const progress = Math.min(100, Math.round((Number(campaign.collectedAmount || 0) / Math.max(1, Number(campaign.targetAmount || 0))) * 100)); return <div className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F51B2B]/10 text-[#F51B2B]"><Megaphone className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-black text-slate-950">{campaign.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{campaign.description || campaign.parishName || 'Campagne eChurch'}</p></div><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></div><div className="mt-4 flex items-baseline justify-between gap-2"><span className="text-lg font-black text-primary">{formatChurchCurrency(campaign.collectedAmount)}</span><span className="text-xs font-bold text-slate-500">sur {formatChurchCurrency(campaign.targetAmount)}</span></div><Progress value={progress} className="mt-2 h-2" /><p className="mt-2 text-xs font-bold text-slate-500">{progress}% atteint{campaign.endsAt ? ` · Jusqu’au ${formatDate(campaign.endsAt)}` : ''}</p></div>; }
function SecurityLine({ icon: Icon, label, value, success = false }: { icon: typeof ShieldCheck; label: string; value: string; success?: boolean }) { return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${success ? 'bg-primary/10 text-primary' : 'bg-[#F51B2B]/10 text-[#F51B2B]'}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-black text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{value}</p></div>{success && <Check className="ml-auto h-4 w-4 text-primary" />}</div>; }
function ReportMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p></div>; }
