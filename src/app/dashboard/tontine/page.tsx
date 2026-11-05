'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PinVerification } from '@/components/payment/PinVerification';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  HandCoins,
  Link as LinkIcon,
  LockKeyhole,
  LogIn,
  Plus,
  QrCode,
  ReceiptText,
  RotateCcw,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type Currency = 'CDF' | 'USD' | 'EUR';
type Frequency = 'daily' | 'weekly' | 'monthly';
type TontineModel = 'rotating' | 'savings' | 'goal' | 'enterprise';
type GroupType = 'private' | 'association' | 'enterprise' | 'organization' | 'cooperative' | 'public_invite';
type MemberStatus = 'pending_contract' | 'active' | 'late' | 'suspended';
type MemberRole = 'chief' | 'treasurer' | 'controller' | 'member';
type TontineStatus = 'active' | 'paused' | 'completed' | 'under_review';
type PinAction = 'accept_contract' | 'pay_contribution' | 'deposit_guarantee';

interface TontineGroup {
  id: string;
  name: string;
  model: TontineModel;
  groupType: GroupType;
  description?: string;
  currency: Currency;
  contributionAmount: number;
  frequency: Frequency;
  maxMembers: number;
  minMembers: number;
  memberCount: number;
  activeMemberCount: number;
  collectedAmount: number;
  expectedAmount: number;
  guaranteeAmount: number;
  guaranteePool: number;
  reservePool: number;
  penaltyAmount: number;
  graceDays: number;
  maxLatePayments: number;
  durationCycles: number;
  currentCycle: number;
  nextDueDate?: any;
  nextBeneficiaryName?: string;
  status: TontineStatus;
  securityLevel: 'standard' | 'renforce' | 'pro';
  inviteToken: string;
  inviteLink: string;
  paymentLink: string;
  qrPayload: string;
  ussdCode: string;
  memberIds: string[];
  creatorId: string;
  createdAt?: any;
}

interface TontineMember {
  id: string;
  uid: string;
  displayName: string;
  email?: string | null;
  role: MemberRole;
  status: MemberStatus;
  joinOrder: number;
  contributionsPaid: number;
  totalContributed: number;
  guaranteePaid: number;
  lateCount: number;
  contractAccepted: boolean;
  mandateAccepted: boolean;
  nextBeneficiaryCycle: number;
  joinedAt?: any;
  lastPaidAt?: any;
}

interface TontinePayment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  currency: Currency;
  cycle: number;
  status: 'completed' | 'reversed';
  paidAt?: any;
  description: string;
}

interface TontineDocument {
  id: string;
  title: string;
  type: 'contract' | 'mandate' | 'report' | 'decision';
  status: 'accepted' | 'pending' | 'generated';
  createdAt?: any;
}

interface TontineLedgerEntry {
  id: string;
  type: 'debit' | 'credit' | 'reserve' | 'guarantee' | 'decision';
  amount: number;
  currency: Currency;
  label: string;
  actorName: string;
  createdAt?: any;
}

const PRIMARY = '#073B9A';
const ORANGE = '#F51B2B';

const modelLabels: Record<TontineModel, string> = {
  rotating: 'Ristourne rotative',
  savings: 'Tontine d’épargne',
  goal: 'Tontine par objectif',
  enterprise: 'Ristourne d’entreprise',
};

const frequencyLabels: Record<Frequency, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
};

const groupTypeLabels: Record<GroupType, string> = {
  private: 'Privée',
  association: 'Association',
  enterprise: 'Entreprise',
  organization: 'Organisation',
  cooperative: 'Coopérative',
  public_invite: 'Publique sur invitation',
};

const TontineCircleIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="15" fill={PRIMARY} />
    <circle cx="24" cy="14" r="5" fill={PRIMARY} />
    <circle cx="34" cy="29" r="5" fill={ORANGE} />
    <circle cx="14" cy="29" r="5" fill="white" opacity="0.92" />
    <path d="M19 20a12 12 0 0 1 10 0M29 28a12 12 0 0 1-10 0" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
  </svg>
);

const TontinePeopleIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <circle cx="24" cy="16" r="6" fill={PRIMARY} />
    <circle cx="13" cy="20" r="5" fill={PRIMARY} opacity=".82" />
    <circle cx="35" cy="20" r="5" fill={PRIMARY} opacity=".82" />
    <path d="M11 35c1.6-6 6-9 13-9s11.4 3 13 9" fill={PRIMARY} />
    <path d="M5 35c1-4.8 4-7.2 9-7.2M43 35c-1-4.8-4-7.2-9-7.2" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" opacity=".82" />
  </svg>
);

const TontineCoinIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="16" fill="white" stroke={PRIMARY} strokeWidth="4" />
    <circle cx="24" cy="24" r="10" fill={PRIMARY} opacity=".12" />
    <path d="M24 14v20M29 18.5c-1.2-1.6-3-2.3-5.2-2.3-2.8 0-4.8 1.5-4.8 3.8 0 5.4 10 2.4 10 8.1 0 2.4-2.1 4-5.2 4-2.4 0-4.4-.8-5.8-2.6" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="35" cy="13" r="5" fill={ORANGE} />
  </svg>
);

const TontineCalendarIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="12" width="28" height="28" rx="6" fill="white" stroke={ORANGE} strokeWidth="4" />
    <path d="M16 8v8M32 8v8M11 21h26" stroke={ORANGE} strokeWidth="4" strokeLinecap="round" />
    <rect x="17" y="26" width="5" height="5" rx="1.5" fill={PRIMARY} />
    <rect x="26" y="26" width="5" height="5" rx="1.5" fill={PRIMARY} />
  </svg>
);

const TontineGiftIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <rect x="9" y="20" width="30" height="20" rx="5" fill={ORANGE} />
    <path d="M24 20v20M9 28h30" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 18c-2.6-6-9.5-6.5-10.3-1.8-.6 3.3 4.4 4.1 10.3 1.8ZM24 18c2.6-6 9.5-6.5 10.3-1.8.6 3.3-4.4 4.1-10.3 1.8Z" fill="white" stroke={PRIMARY} strokeWidth="2" />
  </svg>
);

const TontineShieldIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <path d="M32 7 51 15v15c0 13-8.2 22.8-19 27-10.8-4.2-19-14-19-27V15l19-8Z" fill="white" stroke={PRIMARY} strokeWidth="4" />
    <rect x="22" y="28" width="20" height="16" rx="5" fill={PRIMARY} />
    <path d="M26 28v-5a6 6 0 0 1 12 0v5" stroke={PRIMARY} strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="36" r="2" fill="white" />
  </svg>
);

const TontineCreateIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <circle cx="19" cy="18" r="6" stroke="white" strokeWidth="3" />
    <path d="M8 36c1.8-7 6-10 11-10s9.2 3 11 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M35 15v12M29 21h12" stroke={ORANGE} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const TontineLinkIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <path d="M19 28 29 18M17 20l-4 4a8 8 0 0 0 11 11l4-4M31 28l4-4a8 8 0 0 0-11-11l-4 4" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="12" r="4" fill={ORANGE} />
  </svg>
);

const TontineQrIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <path d="M10 10h10v10H10zM28 10h10v10H28zM10 28h10v10H10z" stroke="currentColor" strokeWidth="3" />
    <path d="M29 29h4v4h-4zM36 28h2v10h-8M24 24h4M24 34h2M34 24h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="38" cy="38" r="4" fill={ORANGE} />
  </svg>
);

const TontineWalletIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="15" width="32" height="24" rx="7" stroke="white" strokeWidth="3" />
    <path d="M13 15v-4h21v4" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <rect x="28" y="24" width="12" height="8" rx="3" fill={ORANGE} />
    <circle cx="33" cy="28" r="1.6" fill="white" />
  </svg>
);

const cleanNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const frequencyDays = (frequency: Frequency) => {
  if (frequency === 'daily') return 1;
  if (frequency === 'weekly') return 7;
  return 30;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseTontineInvitePayload = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.type === 'enkamba_tontine_invite' && (parsed.token || parsed.groupId)) {
      return String(parsed.token || parsed.groupId);
    }
    return null;
  } catch {
    try {
      const url = new URL(trimmed);
      const invite = url.searchParams.get('invite');
      const context = url.searchParams.get('context');
      if (invite && (!context || context === 'tontine')) return invite;
      return null;
    } catch {
      return trimmed.startsWith('invite_') || trimmed.startsWith('tontine_') ? trimmed : null;
    }
  }
};

export default function TontinePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinAction, setPinAction] = useState<{ type: PinAction; groupId: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openedGroupId, setOpenedGroupId] = useState('');
  const [groups, setGroups] = useState<TontineGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<TontineGroup[]>([]);
  const [members, setMembers] = useState<TontineMember[]>([]);
  const [payments, setPayments] = useState<TontinePayment[]>([]);
  const [documents, setDocuments] = useState<TontineDocument[]>([]);
  const [ledger, setLedger] = useState<TontineLedgerEntry[]>([]);
  const [selectedQrCode, setSelectedQrCode] = useState('');
  const [form, setForm] = useState({
    name: '',
    model: 'rotating' as TontineModel,
    groupType: 'private' as GroupType,
    description: '',
    contributionAmount: '',
    currency: 'CDF' as Currency,
    frequency: 'monthly' as Frequency,
    maxMembers: '10',
    minMembers: '3',
    guaranteeAmount: '',
    penaltyAmount: '',
    graceDays: '3',
    maxLatePayments: '2',
    durationCycles: '10',
  });

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setWalletBalance(Number(snapshot.data()?.walletBalance || 0));
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      return;
    }

    const q = query(collection(db, 'tontines'), where('memberIds', 'array-contains', user.uid));
    return onSnapshot(q, (snapshot) => {
      const nextGroups = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as TontineGroup)
        .sort((a, b) => Number(toDate(b.createdAt)?.getTime() || 0) - Number(toDate(a.createdAt)?.getTime() || 0));
      setGroups(nextGroups);
      if (!selectedGroupId && nextGroups.length > 0) {
        setSelectedGroupId(nextGroups[0].id);
      }
    });
  }, [user, selectedGroupId]);

  useEffect(() => {
    const q = query(collection(db, 'tontines'), where('visibility', '==', 'public'), limit(20));
    return onSnapshot(q, (snapshot) => {
      setPublicGroups(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TontineGroup));
    });
  }, []);

  useEffect(() => {
    const invite = searchParams?.get('invite');
    if (invite) {
      setInviteLink(invite);
      setShowJoinForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedGroupId) {
      setMembers([]);
      setPayments([]);
      setDocuments([]);
      setLedger([]);
      return;
    }

    const groupRef = doc(db, 'tontines', selectedGroupId);
    const unsubMembers = onSnapshot(query(collection(groupRef, 'members'), orderBy('joinOrder', 'asc')), (snapshot) => {
      setMembers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TontineMember));
    });
    const unsubPayments = onSnapshot(query(collection(groupRef, 'payments'), orderBy('paidAt', 'desc'), limit(50)), (snapshot) => {
      setPayments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TontinePayment));
    });
    const unsubDocuments = onSnapshot(query(collection(groupRef, 'documents'), orderBy('createdAt', 'desc'), limit(30)), (snapshot) => {
      setDocuments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TontineDocument));
    });
    const unsubLedger = onSnapshot(query(collection(groupRef, 'ledger'), orderBy('createdAt', 'desc'), limit(80)), (snapshot) => {
      setLedger(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TontineLedgerEntry));
    });

    return () => {
      unsubMembers();
      unsubPayments();
      unsubDocuments();
      unsubLedger();
    };
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || groups[0],
    [groups, selectedGroupId],
  );

  const openedGroup = useMemo(
    () => groups.find((group) => group.id === openedGroupId),
    [groups, openedGroupId],
  );

  const currentMember = useMemo(
    () => members.find((member) => member.uid === user?.uid),
    [members, user],
  );

  const openGroupWorkspace = (groupId: string) => {
    setSelectedGroupId(groupId);
    setOpenedGroupId(groupId);
  };

  useEffect(() => {
    let cancelled = false;
    const generateQrCode = async () => {
      if (!selectedGroup?.qrPayload) {
        setSelectedQrCode('');
        return;
      }
      try {
        const QRCode = await import('qrcode');
        const dataUrl = await QRCode.toDataURL(selectedGroup.qrPayload, {
          width: 260,
          margin: 2,
          color: { dark: PRIMARY, light: '#FFFFFF' },
        });
        if (!cancelled) setSelectedQrCode(dataUrl);
      } catch (error) {
        console.error('Erreur QR tontine:', error);
        if (!cancelled) setSelectedQrCode('');
      }
    };
    generateQrCode();
    return () => {
      cancelled = true;
    };
  }, [selectedGroup?.qrPayload]);

  const filteredPublicGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return publicGroups;
    return publicGroups.filter((group) => `${group.name} ${modelLabels[group.model]} ${group.description || ''}`.toLowerCase().includes(term));
  }, [publicGroups, searchTerm]);

  const totals = useMemo(() => {
    const totalSaved = groups.reduce((sum, group) => sum + Number(group.collectedAmount || 0), 0);
    const nextContribution = selectedGroup?.contributionAmount || 0;
    const lateMembers = members.filter((member) => member.status === 'late').length;
    return { totalSaved, nextContribution, lateMembers };
  }, [groups, selectedGroup, members]);

  const formatCurrency = (amount: number, currency: Currency = 'CDF') =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (value: any) => {
    const date = toDate(value);
    if (!date) return 'À planifier';
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const getDisplayName = () => user?.displayName || user?.email?.split('@')[0] || 'Membre Kenz';

  const handleCreateTontine = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Connexion requise', description: 'Connectez-vous avant de créer une tontine.' });
      return;
    }
    const contributionAmount = cleanNumber(form.contributionAmount);
    const maxMembers = Math.max(2, cleanNumber(form.maxMembers, 10));
    const minMembers = Math.max(2, Math.min(cleanNumber(form.minMembers, 3), maxMembers));

    if (!form.name.trim() || contributionAmount <= 0) {
      toast({ variant: 'destructive', title: 'Formulaire incomplet', description: 'Ajoutez le nom et le montant de cotisation.' });
      return;
    }

    setIsCreating(true);
    try {
      const groupRef = doc(collection(db, 'tontines'));
      const token = makeId('invite');
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://enkamba.app';
      const dueDate = addDays(new Date(), frequencyDays(form.frequency));
      const durationCycles = cleanNumber(form.durationCycles, maxMembers);
      const guaranteeAmount = cleanNumber(form.guaranteeAmount, Math.round(contributionAmount * 0.3));
      const groupData: Omit<TontineGroup, 'id'> & { visibility: 'private' | 'public'; rules: Record<string, unknown> } = {
        name: form.name.trim(),
        model: form.model,
        groupType: form.groupType,
        description: form.description.trim(),
        currency: form.currency,
        contributionAmount,
        frequency: form.frequency,
        maxMembers,
        minMembers,
        memberCount: 1,
        activeMemberCount: 1,
        collectedAmount: 0,
        expectedAmount: contributionAmount * minMembers,
        guaranteeAmount,
        guaranteePool: 0,
        reservePool: 0,
        penaltyAmount: cleanNumber(form.penaltyAmount),
        graceDays: cleanNumber(form.graceDays, 3),
        maxLatePayments: cleanNumber(form.maxLatePayments, 2),
        durationCycles,
        currentCycle: 1,
        nextDueDate: dueDate,
        nextBeneficiaryName: getDisplayName(),
        status: 'active',
        securityLevel: form.model === 'enterprise' ? 'pro' : 'renforce',
        inviteToken: token,
        inviteLink: `${origin}/dashboard/tontine?invite=${token}`,
        paymentLink: `${origin}/dashboard/tontine?pay=${groupRef.id}`,
        qrPayload: JSON.stringify({ type: 'enkamba_tontine_invite', groupId: groupRef.id, token }),
        ussdCode: `*454*${groupRef.id.slice(0, 6)}#`,
        memberIds: [user.uid],
        creatorId: user.uid,
        createdAt: serverTimestamp(),
        visibility: form.groupType === 'public_invite' ? 'public' : 'private',
        rules: {
          contributionAmount,
          frequency: form.frequency,
          dueHour: '18:00',
          guaranteeAmount,
          penaltyAmount: cleanNumber(form.penaltyAmount),
          graceDays: cleanNumber(form.graceDays, 3),
          maxLatePayments: cleanNumber(form.maxLatePayments, 2),
          exitConditions: 'Sortie possible après solde des cotisations, garanties et décisions en attente.',
          sensitiveActions: 'Validation obligatoire 2 sur 3: chef, trésorier, contrôleur.',
        },
      };

      const batch = writeBatch(db);
      batch.set(groupRef, groupData);
      batch.set(doc(groupRef, 'members', user.uid), {
        uid: user.uid,
        displayName: getDisplayName(),
        email: user.email || null,
        role: 'chief',
        status: 'active',
        joinOrder: 1,
        contributionsPaid: 0,
        totalContributed: 0,
        guaranteePaid: 0,
        lateCount: 0,
        contractAccepted: true,
        mandateAccepted: true,
        nextBeneficiaryCycle: 1,
        mandate: {
          source: 'wallet_enkamba',
          maxAmount: contributionAmount,
          frequency: form.frequency,
          groupId: groupRef.id,
          active: true,
        },
        acceptedAt: serverTimestamp(),
        joinedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'users', user.uid, 'tontines', groupRef.id), {
        groupId: groupRef.id,
        name: form.name.trim(),
        role: 'chief',
        status: 'active',
        joinedAt: serverTimestamp(),
      });
      batch.set(doc(groupRef, 'documents', makeId('contract')), {
        title: 'Contrat numérique et mandat de prélèvement',
        type: 'contract',
        status: 'accepted',
        createdAt: serverTimestamp(),
        acceptedBy: user.uid,
        proof: {
          method: 'pin_or_session',
          device: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          ipStatus: 'captured_by_platform_when_available',
        },
      });
      batch.set(doc(groupRef, 'ledger', makeId('decision')), {
        type: 'decision',
        amount: 0,
        currency: form.currency,
        label: 'Création de la tontine et activation du contrat communautaire',
        actorName: getDisplayName(),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setSelectedGroupId(groupRef.id);
      setShowCreateForm(false);
      setForm((current) => ({ ...current, name: '', description: '', contributionAmount: '' }));
      toast({ title: 'Tontine créée', description: 'Le groupe, le contrat, le lien et le QR d’invitation sont prêts.' });
    } catch (error) {
      console.error('Erreur création tontine:', error);
      toast({ variant: 'destructive', title: 'Création impossible', description: 'La tontine n’a pas pu être enregistrée.' });
    } finally {
      setIsCreating(false);
    }
  };

  const parseInviteToken = (value: string) => {
    const tontinePayload = parseTontineInvitePayload(value);
    if (tontinePayload) return tontinePayload;
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const url = new URL(trimmed);
      return url.searchParams.get('invite') || url.searchParams.get('token') || trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleJoinByValue = async (value: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Connexion requise', description: 'Connectez-vous pour rejoindre une tontine.' });
      return;
    }
    const token = parseInviteToken(value);
    if (!token) {
      toast({ variant: 'destructive', title: 'Lien invalide', description: 'Collez un lien, un token ou un identifiant de tontine.' });
      return;
    }

    setIsJoining(true);
    try {
      let groupId = token;
      let groupSnap = await getDoc(doc(db, 'tontines', groupId));
      if (!groupSnap.exists()) {
        const found = await getDocs(query(collection(db, 'tontines'), where('inviteToken', '==', token), limit(1)));
        if (found.empty) throw new Error('not-found');
        groupSnap = found.docs[0];
        groupId = groupSnap.id;
      }
      const group = { id: groupId, ...groupSnap.data() } as TontineGroup;
      if (group.memberIds?.includes(user.uid)) {
        setSelectedGroupId(groupId);
        setShowJoinForm(false);
        toast({ title: 'Déjà membre', description: 'Cette tontine est déjà liée à votre compte.' });
        return;
      }
      if (Number(group.memberCount || 0) >= Number(group.maxMembers || 0)) {
        throw new Error('full');
      }

      const groupRef = doc(db, 'tontines', groupId);
      const joinOrder = Number(group.memberCount || 0) + 1;
      const batch = writeBatch(db);
      batch.set(doc(groupRef, 'members', user.uid), {
        uid: user.uid,
        displayName: getDisplayName(),
        email: user.email || null,
        role: 'member',
        status: 'pending_contract',
        joinOrder,
        contributionsPaid: 0,
        totalContributed: 0,
        guaranteePaid: 0,
        lateCount: 0,
        contractAccepted: false,
        mandateAccepted: false,
        nextBeneficiaryCycle: joinOrder,
        joinedAt: serverTimestamp(),
      });
      batch.update(groupRef, {
        memberIds: arrayUnion(user.uid),
        memberCount: increment(1),
        expectedAmount: increment(Number(group.contributionAmount || 0)),
      });
      batch.set(doc(db, 'users', user.uid, 'tontines', groupId), {
        groupId,
        name: group.name,
        role: 'member',
        status: 'pending_contract',
        joinedAt: serverTimestamp(),
      });
      batch.set(doc(groupRef, 'documents', makeId('join')), {
        title: `Adhésion en attente de ${getDisplayName()}`,
        type: 'mandate',
        status: 'pending',
        createdAt: serverTimestamp(),
        memberId: user.uid,
      });
      await batch.commit();
      setSelectedGroupId(groupId);
      setShowJoinForm(false);
      setInviteLink('');
      toast({ title: 'Invitation acceptée', description: 'Validez maintenant le contrat et le mandat pour activer votre place.' });
    } catch (error: any) {
      const description = error?.message === 'full' ? 'Cette tontine a atteint le nombre maximum de membres.' : 'Aucune tontine active ne correspond à ce lien.';
      toast({ variant: 'destructive', title: 'Adhésion impossible', description });
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByLink = async () => {
    await handleJoinByValue(inviteLink);
  };

  const handleTontineScan = async (data: string) => {
    const token = parseTontineInvitePayload(data);
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'QR non reconnu',
        description: 'Ce scanner accepte uniquement les QR de tontine KENZ.',
      });
      return;
    }
    setShowScanner(false);
    setInviteLink(token);
    await handleJoinByValue(token);
  };

  const openPinAction = (type: PinAction, groupId: string) => {
    setPinAction({ type, groupId });
    setShowPin(true);
  };

  const handlePinSuccess = async () => {
    const action = pinAction;
    setShowPin(false);
    setPinAction(null);
    if (!action) return;
    if (action.type === 'accept_contract') await acceptContract(action.groupId);
    if (action.type === 'pay_contribution') await payContribution(action.groupId);
    if (action.type === 'deposit_guarantee') await depositGuarantee(action.groupId);
  };

  const acceptContract = async (groupId: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const groupRef = doc(db, 'tontines', groupId);
      const memberRef = doc(groupRef, 'members', user.uid);
      await updateDoc(memberRef, {
        status: 'active',
        contractAccepted: true,
        mandateAccepted: true,
        acceptedAt: serverTimestamp(),
        mandate: {
          source: 'wallet_enkamba',
          groupId,
          active: true,
          acceptedAt: serverTimestamp(),
        },
      });
      await updateDoc(groupRef, { activeMemberCount: increment(1) });
      await setDoc(doc(db, 'users', user.uid, 'tontines', groupId), { status: 'active', contractAccepted: true }, { merge: true });
      await addDoc(collection(groupRef, 'documents'), {
        title: `Contrat et mandat acceptés par ${getDisplayName()}`,
        type: 'contract',
        status: 'accepted',
        memberId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Contrat validé', description: 'Votre mandat limité est actif pour cette tontine.' });
    } catch (error) {
      console.error('Erreur validation contrat:', error);
      toast({ variant: 'destructive', title: 'Validation impossible', description: 'Le contrat n’a pas pu être validé.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const payContribution = async (groupId: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'users', user.uid);
        const groupRef = doc(db, 'tontines', groupId);
        const memberRef = doc(groupRef, 'members', user.uid);
        const userSnap = await tx.get(userRef);
        const groupSnap = await tx.get(groupRef);
        const memberSnap = await tx.get(memberRef);
        if (!groupSnap.exists() || !memberSnap.exists()) throw new Error('missing-group');
        const group = groupSnap.data() as TontineGroup;
        const member = memberSnap.data() as TontineMember;
        if (!member.contractAccepted || !member.mandateAccepted) throw new Error('contract-required');
        const amount = Number(group.contributionAmount || 0);
        const balance = Number(userSnap.data()?.walletBalance || 0);
        if (balance < amount) throw new Error('insufficient');
        const cycle = Number(group.currentCycle || 1);
        const paymentRef = doc(groupRef, 'payments', `${user.uid}_${cycle}`);
        const paymentSnap = await tx.get(paymentRef);
        if (paymentSnap.exists()) throw new Error('already-paid');
        const reserveAmount = Math.round(amount * 0.02);
        tx.update(userRef, { walletBalance: balance - amount });
        tx.update(groupRef, {
          collectedAmount: increment(amount),
          reservePool: increment(reserveAmount),
          nextDueDate: addDays(new Date(), frequencyDays(group.frequency)),
        });
        tx.update(memberRef, {
          status: 'active',
          contributionsPaid: increment(1),
          totalContributed: increment(amount),
          lastPaidAt: serverTimestamp(),
        });
        tx.set(paymentRef, {
          memberId: user.uid,
          memberName: member.displayName || getDisplayName(),
          amount,
          currency: group.currency,
          cycle,
          status: 'completed',
          paidAt: serverTimestamp(),
          description: `Cotisation cycle ${cycle}`,
        });
        tx.set(doc(groupRef, 'ledger', makeId('debit')), {
          type: 'debit',
          amount,
          currency: group.currency,
          label: `Débit wallet membre - cycle ${cycle}`,
          actorName: member.displayName || getDisplayName(),
          createdAt: serverTimestamp(),
        });
        tx.set(doc(groupRef, 'ledger', makeId('credit')), {
          type: 'credit',
          amount: amount - reserveAmount,
          currency: group.currency,
          label: `Crédit caisse tontine - cycle ${cycle}`,
          actorName: member.displayName || getDisplayName(),
          createdAt: serverTimestamp(),
        });
        tx.set(doc(collection(db, 'users', user.uid, 'transactions')), {
          type: 'tontine_contribution',
          amount: -amount,
          currency: group.currency,
          description: `Cotisation ${group.name}`,
          recipientName: group.name,
          status: 'completed',
          createdAt: serverTimestamp(),
          reference: paymentRef.id,
          groupId,
        });
      });
      toast({ title: 'Cotisation payée', description: 'Le wallet a été débité et le journal financier mis à jour.' });
    } catch (error: any) {
      const messages: Record<string, string> = {
        insufficient: 'Solde insuffisant dans votre wallet Kenz.',
        'already-paid': 'Votre cotisation de ce cycle est déjà enregistrée.',
        'contract-required': 'Vous devez accepter le contrat et le mandat avant de payer.',
        'missing-group': 'Cette tontine est introuvable.',
      };
      toast({ variant: 'destructive', title: 'Paiement refusé', description: messages[error?.message] || 'La cotisation n’a pas pu être validée.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const depositGuarantee = async (groupId: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'users', user.uid);
        const groupRef = doc(db, 'tontines', groupId);
        const memberRef = doc(groupRef, 'members', user.uid);
        const userSnap = await tx.get(userRef);
        const groupSnap = await tx.get(groupRef);
        const memberSnap = await tx.get(memberRef);
        if (!groupSnap.exists() || !memberSnap.exists()) throw new Error('missing-group');
        const group = groupSnap.data() as TontineGroup;
        const member = memberSnap.data() as TontineMember;
        const remaining = Math.max(0, Number(group.guaranteeAmount || 0) - Number(member.guaranteePaid || 0));
        if (remaining <= 0) throw new Error('already-guaranteed');
        const balance = Number(userSnap.data()?.walletBalance || 0);
        if (balance < remaining) throw new Error('insufficient');
        tx.update(userRef, { walletBalance: balance - remaining });
        tx.update(groupRef, { guaranteePool: increment(remaining) });
        tx.update(memberRef, { guaranteePaid: increment(remaining) });
        tx.set(doc(groupRef, 'ledger', makeId('guarantee')), {
          type: 'guarantee',
          amount: remaining,
          currency: group.currency,
          label: 'Dépôt de garantie membre',
          actorName: member.displayName || getDisplayName(),
          createdAt: serverTimestamp(),
        });
        tx.set(doc(collection(db, 'users', user.uid, 'transactions')), {
          type: 'tontine_guarantee',
          amount: -remaining,
          currency: group.currency,
          description: `Garantie ${group.name}`,
          recipientName: group.name,
          status: 'completed',
          createdAt: serverTimestamp(),
          groupId,
        });
      });
      toast({ title: 'Garantie déposée', description: 'Votre protection financière est enregistrée.' });
    } catch (error: any) {
      const description = error?.message === 'already-guaranteed' ? 'Votre garantie est déjà complète.' : error?.message === 'insufficient' ? 'Solde wallet insuffisant.' : 'Le dépôt de garantie a échoué.';
      toast({ variant: 'destructive', title: 'Garantie refusée', description });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyInvite = async (group: TontineGroup) => {
    await navigator.clipboard?.writeText(group.inviteLink || group.inviteToken);
    toast({ title: 'Lien copié', description: 'Vous pouvez inviter les membres par chat, SMS ou QR.' });
  };

  const createDecisionRequest = async (type: string, label: string) => {
    if (!user || !selectedGroup) return;
    await addDoc(collection(db, 'tontines', selectedGroup.id, 'decisions'), {
      type,
      label,
      status: 'pending',
      approvals: [user.uid],
      requiredApprovals: 2,
      createdBy: user.uid,
      createdByName: getDisplayName(),
      createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'tontines', selectedGroup.id, 'ledger'), {
      type: 'decision',
      amount: 0,
      currency: selectedGroup.currency,
      label: `Demande de validation: ${label}`,
      actorName: getDisplayName(),
      createdAt: serverTimestamp(),
    });
    toast({ title: 'Validation créée', description: 'Une action sensible attend 2 approbations sur 3.' });
  };

  const sendReminders = async () => {
    if (!selectedGroup) return;
    const targetMembers = members.filter((member) => member.status === 'late' || member.status === 'pending_contract');
    await addDoc(collection(db, 'tontines', selectedGroup.id, 'ledger'), {
      type: 'decision',
      amount: 0,
      currency: selectedGroup.currency,
      label: `Rappels envoyés à ${targetMembers.length || members.length} membre(s)`,
      actorName: getDisplayName(),
      createdAt: serverTimestamp(),
    });
    toast({ title: 'Rappels envoyés', description: 'Les membres concernés seront notifiés dans leur espace Kenz.' });
  };

  const exportReport = () => {
    if (!selectedGroup) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      group: selectedGroup,
      members,
      payments,
      ledger,
      documents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-tontine-${selectedGroup.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadInviteCard = () => {
    if (!selectedGroup || !selectedQrCode) return;
    const link = document.createElement('a');
    link.href = selectedQrCode;
    link.download = `invitation-tontine-${selectedGroup.id}.png`;
    link.click();
  };

  const schedule = useMemo(() => {
    if (!selectedGroup) return [];
    const baseDate = toDate(selectedGroup.nextDueDate) || new Date();
    const orderedMembers = members.length > 0 ? members : [];
    return Array.from({ length: Number(selectedGroup.durationCycles || selectedGroup.maxMembers || 1) }).map((_, index) => {
      const member = orderedMembers[index % Math.max(orderedMembers.length, 1)];
      return {
        cycle: index + 1,
        dueDate: addDays(baseDate, index * frequencyDays(selectedGroup.frequency)),
        beneficiary: member?.displayName || `Bénéficiaire ${index + 1}`,
        secured: Number(selectedGroup.guaranteePool || 0) + Number(selectedGroup.reservePool || 0) >= Number(selectedGroup.guaranteeAmount || 0),
      };
    });
  }, [selectedGroup, members]);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="container mx-auto max-w-6xl space-y-4 p-3 pb-6 animate-in fade-in duration-500 sm:p-4">
        {!openedGroup && (
          <header className="relative h-[292px] overflow-hidden rounded-[28px] bg-[#073B9A] px-5 pt-4 text-white shadow-lg shadow-[#073B9A]/15 md:h-[320px] md:px-8 md:pt-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_48%,rgba(255,255,255,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-end gap-1">
                  <span className="font-headline text-[22px] font-black leading-none tracking-tight text-white"><span className="text-[#F51B2B]">e</span>NKAMBA</span>
                </div>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white/75">Ristourne & Tontine</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black">3</span>
                </button>
                <div className="h-9 w-9 overflow-hidden rounded-full bg-white p-0.5">
                  {user?.photoURL ? <img src={user.photoURL} alt="Profil" className="h-full w-full rounded-full object-cover" /> : <div className="flex h-full w-full items-center justify-center rounded-full bg-[#073B9A]/10 font-black text-[#073B9A]">{getDisplayName().charAt(0)}</div>}
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-7 md:mt-10">
              <div className="relative z-20">
                <h1 className="max-w-[240px] text-[24px] font-semibold leading-[1.12] md:max-w-[520px] md:text-5xl">
                  Épargnez ensemble,<br />
                  <span className="font-black text-white">avancez ensemble.</span>
                </h1>
                <p className="mt-4 text-[13px] font-semibold text-white/84">Sûr · Transparent · Automatique</p>
              </div>
              <div className="absolute -right-1 -top-2 h-36 w-48 md:right-10 md:top-[-18px] md:h-52 md:w-72" aria-hidden="true">
                <div className="absolute bottom-0 right-1 h-20 w-40 rounded-[50%] bg-white/18 ring-1 ring-white/20 md:h-32 md:w-64" />
                <div className="absolute bottom-8 right-16 flex h-20 w-20 items-center justify-center rounded-[22px] bg-white text-[#073B9A] shadow-xl md:bottom-14 md:right-24 md:h-28 md:w-28 md:rounded-[30px]">
                  <TontineShieldIcon className="h-14 w-14 md:h-20 md:w-20" />
                </div>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <span key={item} className="absolute h-6 w-6 rounded-full bg-white/88 shadow-md md:h-9 md:w-9" style={{ bottom: `${6 + (item % 3) * 16}px`, right: `${6 + item * 20}px` }} />
                ))}
                <span className="absolute right-36 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#073B9A] shadow-lg md:right-60 md:h-14 md:w-14"><TontineCoinIcon className="h-7 w-7 md:h-10 md:w-10" /></span>
                <span className="absolute right-0 top-11 flex h-7 w-7 items-center justify-center rounded-full bg-[#F51B2B] text-sm font-black text-white shadow-lg md:right-2 md:top-20 md:h-10 md:w-10 md:text-lg">$</span>
              </div>
            </div>
          </header>
        )}

        {!openedGroup && (
        <Card className="-mt-[108px] mx-2 rounded-[24px] border-0 bg-white shadow-xl shadow-black/10 md:mx-8">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-black text-slate-950">Aperçu global</h2>
              <button type="button" className="flex items-center gap-1 text-[11px] font-bold text-[#073B9A]">Voir tout <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <OverviewTile icon={TontinePeopleIcon} label="Mes groupes" value={String(groups.length).padStart(2, '0')} sub="Groupes actifs" />
              <OverviewTile icon={TontineCoinIcon} label="Épargné total" value={formatCurrency(totals.totalSaved, selectedGroup?.currency || 'CDF')} sub="Toutes tontines" />
              <OverviewTile icon={TontineCalendarIcon} label="Prochaine échéance" value={selectedGroup ? `${Math.max(0, Math.ceil(((toDate(selectedGroup.nextDueDate)?.getTime() || Date.now()) - Date.now()) / 86400000))} Jours` : 'Aucune'} sub={selectedGroup ? formatDate(selectedGroup.nextDueDate) : 'À planifier'} />
              <OverviewTile icon={TontineGiftIcon} label="Prochain bénéficiaire" value={selectedGroup?.nextBeneficiaryName || 'À définir'} sub={selectedGroup ? formatDate(selectedGroup.nextDueDate) : 'Aucune date'} accent />
            </div>

            <div className="rounded-[18px] bg-[#064e31] p-4 text-white">
              <div className="text-center">
                <p className="text-base font-black">Créez ou rejoignez une ristourne</p>
                <p className="text-xs font-semibold text-white/76">Simple, rapide et sécurisé</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                    <button type="button" className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-[14px] border border-white/18 bg-white/8 p-2 text-center text-[11px] font-black leading-tight text-white">
                      <TontineCreateIcon className="h-8 w-8" />
                      Créer un groupe
                    </button>
              </DialogTrigger>
              <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#073B9A]">Créer une tontine professionnelle</DialogTitle>
                  <DialogDescription>Définissez les règles avant invitation. Les fonds resteront traçables par wallet et journal financier.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2 sm:grid-cols-2">
                  <Field label="Nom du groupe" className="sm:col-span-2">
                    <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex: Famille Bomoko 2026" />
                  </Field>
                  <Field label="Modèle">
                    <Select value={form.model} onValueChange={(value) => setForm({ ...form, model: value as TontineModel })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(modelLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Type de groupe">
                    <Select value={form.groupType} onValueChange={(value) => setForm({ ...form, groupType: value as GroupType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Montant cotisation">
                    <Input type="number" value={form.contributionAmount} onChange={(event) => setForm({ ...form, contributionAmount: event.target.value })} />
                  </Field>
                  <Field label="Devise">
                    <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value as Currency })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="CDF">CDF</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Fréquence">
                    <Select value={form.frequency} onValueChange={(value) => setForm({ ...form, frequency: value as Frequency })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="daily">Quotidienne</SelectItem><SelectItem value="weekly">Hebdomadaire</SelectItem><SelectItem value="monthly">Mensuelle</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Membres min / max">
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" value={form.minMembers} onChange={(event) => setForm({ ...form, minMembers: event.target.value })} />
                      <Input type="number" value={form.maxMembers} onChange={(event) => setForm({ ...form, maxMembers: event.target.value })} />
                    </div>
                  </Field>
                  <Field label="Garantie">
                    <Input type="number" value={form.guaranteeAmount} onChange={(event) => setForm({ ...form, guaranteeAmount: event.target.value })} placeholder="Auto si vide" />
                  </Field>
                  <Field label="Pénalité retard">
                    <Input type="number" value={form.penaltyAmount} onChange={(event) => setForm({ ...form, penaltyAmount: event.target.value })} />
                  </Field>
                  <Field label="Grâce / retards max">
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" value={form.graceDays} onChange={(event) => setForm({ ...form, graceDays: event.target.value })} />
                      <Input type="number" value={form.maxLatePayments} onChange={(event) => setForm({ ...form, maxLatePayments: event.target.value })} />
                    </div>
                  </Field>
                  <Field label="Cycles">
                    <Input type="number" value={form.durationCycles} onChange={(event) => setForm({ ...form, durationCycles: event.target.value })} />
                  </Field>
                  <Field label="Description / objectif" className="sm:col-span-2">
                    <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Objectif, règles particulières, communauté..." />
                  </Field>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>Annuler</Button>
                  <Button onClick={handleCreateTontine} disabled={isCreating} className="bg-[#073B9A] hover:bg-[#073B9A]">{isCreating ? 'Création...' : 'Créer et activer'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showJoinForm} onOpenChange={setShowJoinForm}>
              <DialogTrigger asChild>
                    <button type="button" className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-[14px] border border-white/18 bg-white/8 p-2 text-center text-[11px] font-black leading-tight text-white">
                      <TontineLinkIcon className="h-8 w-8" />
                      Rejoindre avec un lien
                    </button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#073B9A]">Rejoindre par invitation</DialogTitle>
                  <DialogDescription>Collez le lien, le token ou l’identifiant du groupe. Le contrat sera à valider avec votre PIN.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label>Lien ou token</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} onChange={(event) => setInviteLink(event.target.value)} placeholder="invite_xxx ou lien KENZ" />
                    <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}><QrCode className="h-4 w-4" /></Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowJoinForm(false)}>Annuler</Button>
                  <Button onClick={handleJoinByLink} disabled={isJoining} className="bg-[#073B9A] hover:bg-[#073B9A]">{isJoining ? 'Vérification...' : 'Rejoindre'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

                <button type="button" onClick={() => setShowScanner(true)} className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-[14px] border border-white/18 bg-white/8 p-2 text-center text-[11px] font-black leading-tight text-white">
                  <TontineQrIcon className="h-8 w-8" />
                  Scanner QR Code
                </button>
            {selectedGroup && (
                  <button type="button" onClick={() => openPinAction('pay_contribution', selectedGroup.id)} disabled={isProcessing || currentMember?.status !== 'active'} className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-[14px] border border-white/18 bg-white/8 p-2 text-center text-[11px] font-black leading-tight text-white disabled:opacity-45">
                    <TontineWalletIcon className="h-8 w-8" />
                    Payer ma cotisation
                  </button>
            )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm">
            {[
              ['overview', 'Vue'],
              ['groups', 'Groupes'],
              ['calendar', 'Calendrier'],
              ['payments', 'Paiements'],
              ['members', 'Membres'],
              ['guarantees', 'Garanties'],
              ['documents', 'Documents'],
              ['reports', 'Rapports'],
            ].map(([value, label]) => <TabsTrigger key={value} value={value} className="min-w-max rounded-xl">{label}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {openedGroup ? (
              <>
                <Button variant="outline" className="rounded-xl border-[#073B9A]/20 text-[#073B9A]" onClick={() => setOpenedGroupId('')}>
                  Retour aux tontines
                </Button>
                <TontineGroupWorkspace
                  group={openedGroup}
                  currentMember={currentMember}
                  members={members}
                  payments={payments}
                  ledger={ledger}
                  documents={documents}
                  schedule={schedule}
                  qrCode={selectedQrCode}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onPay={() => openPinAction('pay_contribution', openedGroup.id)}
                  onAcceptContract={() => openPinAction('accept_contract', openedGroup.id)}
                  onDepositGuarantee={() => openPinAction('deposit_guarantee', openedGroup.id)}
                  onInvite={() => copyInvite(openedGroup)}
                  onDownloadQr={downloadInviteCard}
                  onOpenRules={() => setShowRules(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  onSendReminders={sendReminders}
                  onDecision={createDecisionRequest}
                  onExportReport={exportReport}
                  isProcessing={isProcessing}
                />
              </>
            ) : !selectedGroup ? (
              <EmptyState onCreate={() => setShowCreateForm(true)} onJoin={() => setShowJoinForm(true)} />
            ) : (
              <>
                <div className="mx-2 mt-1 flex items-center justify-between md:mx-8">
                  <h2 className="text-[15px] font-black text-slate-950">Mes groupes actifs</h2>
                  <button type="button" className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">Voir tous <ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mx-2 grid gap-2.5 md:mx-8 md:grid-cols-1">
                    {groups.map((group) => (
                      <HomeGroupCard
                        key={group.id}
                        group={group}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        onOpen={openGroupWorkspace}
                      />
                    ))}
                </div>
                <Card className="mx-2 overflow-hidden rounded-2xl border-[#073B9A]/10 bg-[#eefbf4] shadow-sm md:mx-8">
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <TontineQrIcon className="h-10 w-10 text-[#073B9A]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-slate-950">Partagez votre groupe facilement</p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">Invitez vos proches avec votre QR Code ou votre lien unique.</p>
                      </div>
                    </div>
                    <Button onClick={() => selectedGroup && copyInvite(selectedGroup)} className="h-11 rounded-xl bg-[#073B9A] text-xs hover:bg-[#073B9A]">
                      <LinkIcon className="mr-2 h-4 w-4" />Partager mon groupe
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-[#073B9A]/10">
                <CardHeader><CardTitle className="text-[#073B9A]">Mes tontines</CardTitle><CardDescription>Groupes liés à votre compte.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {groups.length === 0 ? <EmptyMini text="Aucune tontine liée à votre compte." /> : groups.map((group) => (
                    <GroupCard key={group.id} group={group} currentMember={members.find((member) => member.uid === user?.uid)} onCopy={copyInvite} onSelect={openGroupWorkspace} selected={selectedGroupId === group.id} />
                  ))}
                </CardContent>
              </Card>
              <Card className="border-[#073B9A]/10">
                <CardHeader><CardTitle className="text-[#073B9A]">Découvrir</CardTitle><CardDescription>Tontines publiques sur invitation.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher un groupe" />
                  </div>
                  {filteredPublicGroups.length === 0 ? <EmptyMini text="Aucune tontine publique disponible." /> : filteredPublicGroups.map((group) => (
                    <div key={group.id} className="rounded-2xl border border-[#073B9A]/10 p-3">
                      <p className="font-black text-slate-900">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{modelLabels[group.model]} · {formatCurrency(group.contributionAmount, group.currency)}</p>
                      <Button className="mt-3 w-full bg-[#073B9A] hover:bg-[#073B9A]" onClick={() => { setInviteLink(group.inviteToken); setShowJoinForm(true); }}>Rejoindre</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-3">
            <Card className="border-[#073B9A]/10">
              <CardHeader><CardTitle className="text-[#073B9A]">Calendrier des cycles</CardTitle><CardDescription>Ordre bénéficiaire et contrôle de protection avant remise du pot.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {schedule.length === 0 ? <EmptyMini text="Sélectionnez une tontine pour voir le calendrier." /> : schedule.map((item) => (
                  <div key={item.cycle} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#073B9A]/10 font-black text-[#073B9A]">{item.cycle}</div>
                      <div><p className="font-bold">{item.beneficiary}</p><p className="text-xs text-muted-foreground">{formatDate(item.dueDate)}</p></div>
                    </div>
                    <Badge className={item.secured ? 'bg-[#073B9A]' : 'bg-[#F51B2B]'}>{item.secured ? 'Protégé' : 'Garantie requise'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-3">
            <Card className="border-[#073B9A]/10">
              <CardHeader><CardTitle className="text-[#073B9A]">Paiements et journal</CardTitle><CardDescription>Chaque mouvement est traçable. Aucun historique n’est supprimé.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {payments.length === 0 ? <EmptyMini text="Aucun paiement enregistré." /> : payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 p-3">
                    <div><p className="font-bold">{payment.memberName}</p><p className="text-xs text-muted-foreground">{payment.description} · {formatDate(payment.paidAt)}</p></div>
                    <p className="font-black text-[#073B9A]">{formatCurrency(payment.amount, payment.currency)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-3">
            <Card className="border-[#073B9A]/10">
              <CardHeader><CardTitle className="text-[#073B9A]">Membres et rôles</CardTitle><CardDescription>Chef, trésorier et contrôleur valident les actions sensibles.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {members.length === 0 ? <EmptyMini text="Aucun membre chargé." /> : members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-[#073B9A]/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-black">{member.displayName}</p><p className="text-xs text-muted-foreground">{member.role} · ordre {member.joinOrder}</p></div>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className={member.status === 'active' ? 'bg-[#073B9A]' : ''}>{member.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <MiniStat label="Cotisations" value={`${member.contributionsPaid || 0}`} />
                      <MiniStat label="Garantie" value={formatCurrency(member.guaranteePaid || 0, selectedGroup?.currency || 'CDF')} />
                      <MiniStat label="Retards" value={`${member.lateCount || 0}`} />
                    </div>
                  </div>
                ))}
              </CardContent>
              {selectedGroup && currentMember?.role === 'chief' && (
                <CardFooter className="gap-2">
                  <Button variant="outline" onClick={sendReminders}><Send className="mr-2 h-4 w-4" />Envoyer rappels</Button>
                  <Button variant="outline" onClick={() => createDecisionRequest('beneficiary_order', 'Modifier l’ordre bénéficiaire')}><ClipboardCheck className="mr-2 h-4 w-4" />Demander validation</Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="guarantees" className="space-y-3">
            <Card className="border-[#073B9A]/10">
              <CardHeader><CardTitle className="text-[#073B9A]">Garanties et réserve</CardTitle><CardDescription>Protection des membres avant remise de pot.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {selectedGroup ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Metric icon={ShieldCheck} label="Garantie demandée" value={formatCurrency(selectedGroup.guaranteeAmount, selectedGroup.currency)} />
                      <Metric icon={Banknote} label="Garantie groupe" value={formatCurrency(selectedGroup.guaranteePool, selectedGroup.currency)} />
                      <Metric icon={BadgeCheck} label="Réserve collective" value={formatCurrency(selectedGroup.reservePool, selectedGroup.currency)} accent />
                    </div>
                    <Progress value={Math.min(100, ((currentMember?.guaranteePaid || 0) / Math.max(selectedGroup.guaranteeAmount || 1, 1)) * 100)} />
                    <Button onClick={() => openPinAction('deposit_guarantee', selectedGroup.id)} className="bg-[#073B9A] hover:bg-[#073B9A]"><ShieldCheck className="mr-2 h-4 w-4" />Déposer ma garantie</Button>
                    <div className="grid gap-2 sm:grid-cols-5">
                      {['Préfinancement', 'Dépôt garantie', 'Mandat wallet', 'Réserve collective', 'Garantie chef plafonnée'].map((item) => <Badge key={item} variant="outline" className="justify-center rounded-xl border-[#073B9A]/20 py-2 text-[#073B9A]">{item}</Badge>)}
                    </div>
                  </>
                ) : <EmptyMini text="Aucune tontine sélectionnée." />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            <Card className="border-[#073B9A]/10">
              <CardHeader><CardTitle className="text-[#073B9A]">Documents</CardTitle><CardDescription>Contrats, mandats, rapports et décisions.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {documents.length === 0 ? <EmptyMini text="Aucun document généré." /> : documents.map((documentItem) => (
                  <div key={documentItem.id} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 p-3">
                    <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-[#073B9A]" /><div><p className="font-bold">{documentItem.title}</p><p className="text-xs text-muted-foreground">{documentItem.type} · {formatDate(documentItem.createdAt)}</p></div></div>
                    <Badge variant="outline">{documentItem.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-3">
            <Card className="border-[#073B9A]/10">
              <CardHeader><CardTitle className="text-[#073B9A]">Rapports et audit</CardTitle><CardDescription>Export chef, trésorier, contrôleur, entreprise et auditeur.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportReport} disabled={!selectedGroup} className="bg-[#073B9A] hover:bg-[#073B9A]"><Download className="mr-2 h-4 w-4" />Exporter le rapport JSON</Button>
                <div className="space-y-2">
                  {ledger.length === 0 ? <EmptyMini text="Aucun mouvement dans le journal." /> : ledger.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 p-3">
                      <div><p className="font-bold">{entry.label}</p><p className="text-xs text-muted-foreground">{entry.actorName} · {formatDate(entry.createdAt)}</p></div>
                      <p className="font-black text-[#073B9A]">{entry.amount ? formatCurrency(entry.amount, entry.currency) : entry.type}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PinVerification
        isOpen={showPin}
        onClose={() => {
          setShowPin(false);
          setPinAction(null);
        }}
        onSuccess={handlePinSuccess}
        purpose="payment"
        paymentDetails={{
          recipient: selectedGroup?.name || 'Tontine Kenz',
          amount: String(selectedGroup?.contributionAmount || selectedGroup?.guaranteeAmount || 0),
          currency: selectedGroup?.currency || 'CDF',
        }}
      />

      <TontineQRScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleTontineScan}
      />

      {selectedGroup && (
        <>
          <Dialog open={showRules} onOpenChange={setShowRules}>
            <DialogContent className="rounded-2xl sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-[#073B9A]">Règlement du groupe</DialogTitle>
                <DialogDescription>Règles financières et sécurité appliquées à cette tontine.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 text-sm">
                <MiniStat label="Type" value={modelLabels[selectedGroup.model]} />
                <MiniStat label="Cotisation" value={`${formatCurrency(selectedGroup.contributionAmount, selectedGroup.currency)} · ${frequencyLabels[selectedGroup.frequency]}`} />
                <MiniStat label="Garantie" value={formatCurrency(selectedGroup.guaranteeAmount, selectedGroup.currency)} />
                <MiniStat label="Retard" value={`Grâce ${selectedGroup.graceDays} jour(s), maximum ${selectedGroup.maxLatePayments} retard(s)`} />
                <MiniStat label="Actions sensibles" value="Toute modification importante exige 2 validations sur 3." />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="rounded-2xl sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-[#073B9A]">Paramètres Tontine</DialogTitle>
                <DialogDescription>Les paramètres sensibles passent par validation du comité.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Button variant="outline" onClick={() => createDecisionRequest('rules_update', 'Modifier le montant ou la fréquence')}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />Proposer une modification des règles
                </Button>
                <Button variant="outline" onClick={() => createDecisionRequest('replacement', 'Remplacer un membre indisponible')}>
                  <UserRoundCheck className="mr-2 h-4 w-4" />Demander un remplacement membre
                </Button>
                <Button variant="outline" onClick={() => createDecisionRequest('incident_review', 'Ouvrir un contrôle incident')}>
                  <AlertTriangle className="mr-2 h-4 w-4" />Ouvrir un incident
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function TontineQRScannerDialog({
  open,
  onOpenChange,
  onScan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('Positionnez le QR de tontine dans le cadre.');
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const stop = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const start = async () => {
      try {
        setCameraError('');
        setStatus('Initialisation de la caméra...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          setStatus('Caméra ouverte. Si le scan automatique ne démarre pas sur ce navigateur, collez le code manuellement.');
          return;
        }

        const detector = new Detector({ formats: ['qr_code'] });
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const rawValue = codes?.[0]?.rawValue;
            if (rawValue) {
              onScan(rawValue);
              stop();
              return;
            }
          } catch (error) {
            setCameraError('Lecture automatique indisponible. Vous pouvez coller le token ou le lien.');
          }
          frameRef.current = requestAnimationFrame(scan);
        };
        setStatus('Scan Tontine actif.');
        frameRef.current = requestAnimationFrame(scan);
      } catch (error: any) {
        setCameraError(error?.message || 'Impossible d’ouvrir la caméra.');
        setStatus('Collez le token ou le lien de tontine si la caméra est indisponible.');
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#073B9A]">
            <ScanLine className="h-5 w-5" />
            Scanner Tontine
          </DialogTitle>
          <DialogDescription>
            Ce scanner accepte uniquement les QR d’invitation Tontine KENZ.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-3xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
            </div>
            <div className="absolute left-3 top-3 rounded-full bg-[#073B9A] px-3 py-1 text-xs font-black text-white">
              QR Tontine
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700">{status}</p>
          {cameraError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{cameraError}</p>}
          <div className="space-y-2">
            <Label>Token ou lien Tontine</Label>
            <div className="flex gap-2">
              <Input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="invite_xxx ou lien /dashboard/tontine?invite=..." />
              <Button onClick={() => onScan(manualCode)} className="bg-[#073B9A] hover:bg-[#073B9A]">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Fermer
            </Button>
            <Button variant="outline" className="flex-1 border-[#073B9A]/20 text-[#073B9A]" onClick={() => setStatus('Caméra active. Montrez uniquement un QR Tontine.')}>
              <Camera className="mr-2 h-4 w-4" />
              Caméra
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/12 px-3 py-2 ring-1 ring-white/15">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">{label}</p>
      <p className="truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function OverviewTile({ icon: Icon, label, value, sub, accent = false }: { icon: any; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#073B9A]/10 bg-white p-2.5 text-center shadow-sm">
      <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${accent ? 'bg-[#F51B2B]/10 text-[#F51B2B]' : 'bg-[#073B9A]/10 text-[#073B9A]'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="truncate text-[10px] font-bold text-slate-700">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">{sub}</p>
    </div>
  );
}

function HomeGroupCard({
  group,
  formatCurrency,
  formatDate,
  onOpen,
}: {
  group: TontineGroup;
  formatCurrency: (amount: number, currency?: Currency) => string;
  formatDate: (value: any) => string;
  onOpen: (id: string) => void;
}) {
  const paid = Math.min(Number(group.memberCount || 0), Math.round((Number(group.collectedAmount || 0) / Math.max(Number(group.contributionAmount || 1), 1)) % Math.max(Number(group.maxMembers || 1), 1)));
  const expected = Number(group.contributionAmount || 0) * Number(group.maxMembers || 0);
  const progress = Math.min(100, (Number(group.collectedAmount || 0) / Math.max(expected, 1)) * 100);
  const accent = group.model === 'savings' ? ORANGE : PRIMARY;
  const Icon = group.model === 'savings' ? TontineCoinIcon : TontinePeopleIcon;

  return (
    <button
      type="button"
      onClick={() => onOpen(group.id)}
      className="w-full rounded-2xl border border-[#073B9A]/10 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#073B9A]/10" style={{ color: accent }}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-black text-slate-950">{group.name}</p>
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#073B9A]" />
            </div>
            <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{modelLabels[group.model]} · {group.memberCount} membres</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="whitespace-nowrap text-[10px] font-bold text-slate-700">{paid}/{group.maxMembers} ont payé</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accent }} />
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground">Prochaine échéance</p>
          <p className="mt-1 text-xs font-black text-[#073B9A]">{formatDate(group.nextDueDate)}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-slate-100 pt-2 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
          <p className="text-[10px] font-bold text-muted-foreground">Ma contribution</p>
          <div className="text-right">
            <p className="text-sm font-black text-[#073B9A]">{formatCurrency(group.contributionAmount, group.currency)}</p>
            <p className="text-[10px] font-semibold text-muted-foreground">{formatCurrency(group.collectedAmount, group.currency)} / {formatCurrency(expected, group.currency)}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function TontineGroupWorkspace({
  group,
  currentMember,
  members,
  payments,
  ledger,
  documents,
  schedule,
  qrCode,
  formatCurrency,
  formatDate,
  onPay,
  onAcceptContract,
  onDepositGuarantee,
  onInvite,
  onDownloadQr,
  onOpenRules,
  onOpenSettings,
  onSendReminders,
  onDecision,
  onExportReport,
  isProcessing,
}: {
  group: TontineGroup;
  currentMember?: TontineMember;
  members: TontineMember[];
  payments: TontinePayment[];
  ledger: TontineLedgerEntry[];
  documents: TontineDocument[];
  schedule: Array<{ cycle: number; dueDate: Date; beneficiary: string; secured: boolean }>;
  qrCode: string;
  formatCurrency: (amount: number, currency?: Currency) => string;
  formatDate: (value: any) => string;
  onPay: () => void;
  onAcceptContract: () => void;
  onDepositGuarantee: () => void;
  onInvite: () => void;
  onDownloadQr: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onSendReminders: () => void;
  onDecision: (type: string, label: string) => void;
  onExportReport: () => void;
  isProcessing: boolean;
}) {
  const currentCycle = Number(group.currentCycle || 1);
  const paidThisCycle = payments.filter((payment) => payment.cycle === currentCycle && payment.status === 'completed');
  const paidMemberIds = new Set(paidThisCycle.map((payment) => payment.memberId));
  const paidMembers = members.filter((member) => paidMemberIds.has(member.uid)).length;
  const lateMembers = members.filter((member) => member.status === 'late').length;
  const pendingMembers = Math.max(0, Number(group.memberCount || 0) - paidMembers - lateMembers);
  const paymentRate = Math.min(100, Math.round((paidMembers / Math.max(Number(group.maxMembers || 1), 1)) * 100));
  const totalExpected = Number(group.contributionAmount || 0) * Number(group.maxMembers || 0);
  const remaining = Math.max(0, totalExpected - Number(group.collectedAmount || 0));
  const nextDate = toDate(group.nextDueDate);
  const daysLeft = nextDate ? Math.max(0, Math.ceil((nextDate.getTime() - Date.now()) / 86400000)) : 0;
  const nextBeneficiary = schedule[0]?.beneficiary || group.nextBeneficiaryName || 'À définir';
  const chief = members.find((member) => member.role === 'chief');

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] bg-[#073B9A] text-white shadow-xl shadow-[#073B9A]/20">
        <div className="relative p-4 sm:p-5">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 15% 15%, #fff 0 1px, transparent 2px), radial-gradient(circle at 85% 20%, #F51B2B 0 2px, transparent 4px)', backgroundSize: '32px 32px, 72px 72px' }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/25">
                <Users className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-headline text-2xl font-black">{group.name}</h2>
                  <Badge className="bg-white/16 text-white hover:bg-white/16"><CheckCircle2 className="mr-1 h-3 w-3" />{group.status === 'active' ? 'Groupe actif' : group.status}</Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-white/76">{modelLabels[group.model]} · {group.memberCount} membres</p>
              </div>
            </div>
            <Badge className="rounded-full bg-[#F51B2B] text-white hover:bg-[#F51B2B]">Sécurité {group.securityLevel}</Badge>
          </div>

          <div className="relative mt-5 grid gap-3 rounded-3xl border border-white/14 bg-white/8 p-4 sm:grid-cols-3">
            <HeroStat label="Cagnotte actuelle" value={formatCurrency(group.collectedAmount, group.currency)} sub={`sur ${formatCurrency(totalExpected, group.currency)} attendus`} />
            <HeroStat label="Prochaine échéance" value={formatDate(group.nextDueDate)} sub={`${daysLeft} jour(s) restant(s)`} />
            <div>
              <p className="text-xs font-bold text-white/66">Prochain bénéficiaire</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-black text-[#073B9A]">{nextBeneficiary.charAt(0)}</div>
                <div>
                  <p className="font-black">{nextBeneficiary}</p>
                  <p className="text-xs text-white/70">Position {schedule[0]?.cycle || 1}/{group.maxMembers}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/22">
              <div className="h-full rounded-full bg-[#75f0a9]" style={{ width: `${paymentRate}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs font-black text-white">
              <span>{paidMembers} / {group.maxMembers} ont payé</span>
              <span>{paymentRate}%</span>
            </div>
          </div>
        </div>
      </section>

      <Card className="-mt-8 rounded-[24px] border-[#073B9A]/10 bg-white shadow-lg">
        <CardContent className="grid grid-cols-3 gap-1 p-2 sm:grid-cols-6">
          <QuickAction icon={WalletCards} label="Payer ma cotisation" onClick={onPay} disabled={isProcessing || currentMember?.status !== 'active'} />
          <QuickAction icon={UserRoundCheck} label="Inviter" onClick={onInvite} />
          <QuickAction icon={QrCode} label="QR Code du groupe" onClick={onDownloadQr} disabled={!qrCode} />
          <QuickAction icon={CalendarDays} label="Calendrier" onClick={() => document.getElementById('tontine-calendar-panel')?.scrollIntoView({ behavior: 'smooth' })} />
          <QuickAction icon={FileText} label="Règlement" onClick={onOpenRules} />
          <QuickAction icon={ShieldCheck} label="Paramètres" onClick={onOpenSettings} />
        </CardContent>
      </Card>

      {currentMember?.status === 'pending_contract' && (
        <Card className="border-[#F51B2B]/30 bg-[#fff7ed]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-[#F51B2B]">Contrat et mandat requis</p>
              <p className="text-sm text-[#F51B2B]/80">Validez avec votre PIN avant cotisation. Le mandat est limité à cette tontine.</p>
            </div>
            <Button onClick={onAcceptContract} className="bg-[#073B9A] hover:bg-[#073B9A]"><LockKeyhole className="mr-2 h-4 w-4" />Valider</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="apercu" className="w-full">
        <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm">
          {[
            ['apercu', 'Aperçu'],
            ['membres', 'Membres'],
            ['cotisations', 'Cotisations'],
            ['calendrier', 'Calendrier'],
            ['transactions', 'Transactions'],
            ['documents', 'Documents'],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="min-w-max rounded-xl px-4 text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="apercu" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <Card className="border-[#073B9A]/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-950">Informations du groupe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoLine icon={RotateCcw} label="Type" value={modelLabels[group.model]} />
                <InfoLine icon={HandCoins} label="Montant par membre" value={formatCurrency(group.contributionAmount, group.currency)} />
                <InfoLine icon={CalendarDays} label="Fréquence" value={frequencyLabels[group.frequency]} />
                <InfoLine icon={ClipboardCheck} label="Durée" value={`${group.durationCycles} cycle(s)`} />
                <InfoLine icon={CalendarDays} label="Prochaine échéance" value={formatDate(group.nextDueDate)} />
                <InfoLine icon={Banknote} label="Devise" value={group.currency} />
                <InfoLine icon={UserCheck} label="Chef de groupe" value={chief?.displayName || 'À définir'} />
                <Button variant="ghost" onClick={onOpenRules} className="mt-2 w-full justify-between rounded-xl text-[#073B9A]">
                  Voir le règlement complet <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-[#073B9A]/10 bg-[#FFFFFF]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-[#073B9A]">Résumé financier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoLine icon={HandCoins} label="Montant total" value={formatCurrency(totalExpected, group.currency)} strong />
                  <InfoLine icon={CheckCircle2} label="Total payé" value={formatCurrency(group.collectedAmount, group.currency)} strong valueClass="text-[#073B9A]" />
                  <InfoLine icon={AlertTriangle} label="Reste à payer" value={formatCurrency(remaining, group.currency)} strong valueClass="text-red-600" />
                </CardContent>
              </Card>

              <Card className="border-[#073B9A]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-950">Statut des cotisations</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-[130px_1fr] items-center gap-4">
                  <ContributionDonut paid={paidMembers} pending={pendingMembers} late={lateMembers} total={Number(group.maxMembers || 0)} />
                  <div className="space-y-2 text-sm">
                    <Legend color="#073B9A" label="Ont payé" value={paidMembers} />
                    <Legend color="#F51B2B" label="En attente" value={pendingMembers} />
                    <Legend color="#ef4444" label="En retard" value={lateMembers} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" onClick={onSendReminders} className="w-full justify-between rounded-xl text-[#073B9A]">
                    Voir tous les membres <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <Card id="tontine-calendar-panel" className="border-[#073B9A]/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base text-slate-950">Calendrier des bénéficiaires</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#073B9A]" onClick={() => onDecision('beneficiary_order', 'Modifier l’ordre bénéficiaire')}>Voir tout</Button>
            </CardHeader>
            <CardContent className="flex gap-3 overflow-x-auto pb-4">
              {schedule.slice(0, 8).map((item, index) => (
                <div key={item.cycle} className={`min-w-[118px] rounded-2xl border p-3 text-center ${index === 0 ? 'border-[#073B9A] bg-[#FFFFFF]' : 'border-[#073B9A]/10 bg-white'}`}>
                  <p className="mb-2 text-left text-xs font-black text-[#073B9A]">{item.cycle}</p>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#073B9A]/10 font-black text-[#073B9A]">{item.beneficiary.charAt(0)}</div>
                  <p className="mt-2 truncate text-sm font-black text-slate-950">{item.beneficiary}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.dueDate)}</p>
                  {index === 0 && <Badge className="mt-2 bg-[#073B9A]">Prochain</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#073B9A]/10 bg-[#FFFFFF]">
            <CardContent className="grid gap-4 p-4 md:grid-cols-2">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#073B9A]">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground">Niveau de sécurité du groupe</p>
                  <p className="text-xl font-black text-[#073B9A]">Élevé</p>
                  <p className="mt-1 text-xs font-semibold text-[#073B9A]">✓ Dépôt de garantie actif · ✓ Mandat de prélèvement actif · ✓ Fonds protégés</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-7 w-7 text-[#073B9A]" />
                  <div>
                    <p className="font-black text-slate-950">Cagnotte sécurisée</p>
                    <p className="text-xs text-muted-foreground">Les fonds sont protégés par contrat, garantie et journal d’audit.</p>
                  </div>
                </div>
                <Button className="mt-3 bg-[#073B9A] hover:bg-[#073B9A]" onClick={onDepositGuarantee}>Compléter ma garantie</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membres" className="mt-4 grid gap-3 md:grid-cols-2">
          {members.length === 0 ? <EmptyMini text="Aucun membre chargé." /> : members.map((member) => (
            <div key={member.id} className="rounded-2xl border border-[#073B9A]/10 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#073B9A]/10 font-black text-[#073B9A]">{member.displayName.charAt(0)}</div>
                  <div><p className="font-black">{member.displayName}</p><p className="text-xs text-muted-foreground">{member.role} · position {member.joinOrder}</p></div>
                </div>
                <Badge className={member.status === 'active' ? 'bg-[#073B9A]' : 'bg-[#F51B2B]'}>{member.status}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="cotisations" className="mt-4 space-y-2">
          {payments.length === 0 ? <EmptyMini text="Aucune cotisation enregistrée." /> : payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} formatCurrency={formatCurrency} formatDate={formatDate} />
          ))}
        </TabsContent>

        <TabsContent value="calendrier" className="mt-4 space-y-2">
          {schedule.map((item) => (
            <div key={item.cycle} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 bg-white p-3">
              <div><p className="font-black">Cycle {item.cycle} · {item.beneficiary}</p><p className="text-xs text-muted-foreground">{formatDate(item.dueDate)}</p></div>
              <Badge className={item.secured ? 'bg-[#073B9A]' : 'bg-[#F51B2B]'}>{item.secured ? 'Protégé' : 'Garantie à renforcer'}</Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-2">
          <Button onClick={onExportReport} className="mb-2 bg-[#073B9A] hover:bg-[#073B9A]"><Download className="mr-2 h-4 w-4" />Exporter le rapport</Button>
          {ledger.length === 0 ? <EmptyMini text="Aucun mouvement dans le journal." /> : ledger.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 bg-white p-3">
              <div><p className="font-black">{entry.label}</p><p className="text-xs text-muted-foreground">{entry.actorName} · {formatDate(entry.createdAt)}</p></div>
              <p className="font-black text-[#073B9A]">{entry.amount ? formatCurrency(entry.amount, entry.currency) : entry.type}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-2">
          {documents.length === 0 ? <EmptyMini text="Aucun document généré." /> : documents.map((documentItem) => (
            <div key={documentItem.id} className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 bg-white p-3">
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-[#073B9A]" /><div><p className="font-black">{documentItem.title}</p><p className="text-xs text-muted-foreground">{documentItem.type} · {formatDate(documentItem.createdAt)}</p></div></div>
              <Badge variant="outline">{documentItem.status}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-white/66">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-white/68">{sub}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, disabled = false }: { icon: any; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl px-2 text-center text-xs font-black text-slate-800 transition hover:bg-[#073B9A]/6 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon className="h-6 w-6 text-slate-800" />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function InfoLine({ icon: Icon, label, value, strong = false, valueClass = '' }: { icon: any; label: string; value: string; strong?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0 text-[#073B9A]" />
        <span className="truncate">{label}</span>
      </div>
      <span className={`max-w-[55%] truncate text-right ${strong ? 'font-black' : 'font-semibold'} ${valueClass || 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

function ContributionDonut({ paid, pending, late, total }: { paid: number; pending: number; late: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const paidDeg = (paid / safeTotal) * 360;
  const pendingDeg = (pending / safeTotal) * 360;
  return (
    <div
      className="relative flex h-28 w-28 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#073B9A 0deg ${paidDeg}deg, #F51B2B ${paidDeg}deg ${paidDeg + pendingDeg}deg, #ef4444 ${paidDeg + pendingDeg}deg 360deg)` }}
    >
      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
        <p className="text-xl font-black text-slate-950">{total}</p>
        <p className="text-[10px] font-bold text-muted-foreground">Membres</p>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-black text-slate-950">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function PaymentRow({ payment, formatCurrency, formatDate }: { payment: TontinePayment; formatCurrency: (amount: number, currency?: Currency) => string; formatDate: (value: any) => string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#073B9A]/10 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#073B9A]/10 text-[#073B9A]">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div><p className="font-black">{payment.memberName}</p><p className="text-xs text-muted-foreground">{payment.description} · {formatDate(payment.paidAt)}</p></div>
      </div>
      <p className="font-black text-[#073B9A]">{formatCurrency(payment.amount, payment.currency)}</p>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="border-[#073B9A]/10 bg-white">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-[#F51B2B]/10 text-[#F51B2B]' : 'bg-[#073B9A]/10 text-[#073B9A]'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-black text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#FFFFFF] p-2">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="font-black text-slate-950">{value}</p>
    </div>
  );
}

function GroupCard({
  group,
  currentMember,
  selected,
  onCopy,
  onSelect,
}: {
  group: TontineGroup;
  currentMember?: TontineMember;
  selected?: boolean;
  onCopy: (group: TontineGroup) => void;
  onSelect: (id: string) => void;
}) {
  const progress = Math.min(100, (Number(group.memberCount || 0) / Math.max(Number(group.maxMembers || 1), 1)) * 100);
  return (
    <Card className={`border-[#073B9A]/10 bg-white transition ${selected ? 'ring-2 ring-[#073B9A]/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#073B9A]/10">
              <TontineCircleIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-headline text-lg font-black text-slate-950">{group.name}</p>
                <Badge className="bg-[#073B9A]">{modelLabels[group.model]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{group.description || groupTypeLabels[group.groupType]}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span>{group.memberCount}/{group.maxMembers} membres</span>
                <span>{frequencyLabels[group.frequency]}</span>
                <span>Cycle {group.currentCycle}</span>
                <span>Niveau {group.securityLevel}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onCopy(group)}><LinkIcon className="mr-2 h-4 w-4" />Inviter</Button>
            <Button size="sm" onClick={() => onSelect(group.id)} className="bg-[#073B9A] hover:bg-[#073B9A]">Ouvrir</Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Remplissage du groupe</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
        {currentMember && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[#073B9A]/20 text-[#073B9A]"><UserCheck className="mr-1 h-3 w-3" />{currentMember.status}</Badge>
            {currentMember.contractAccepted ? <Badge className="bg-[#073B9A]"><CheckCircle2 className="mr-1 h-3 w-3" />Contrat OK</Badge> : <Badge className="bg-[#F51B2B]"><AlertTriangle className="mr-1 h-3 w-3" />Contrat requis</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <Card className="border-[#073B9A]/10 bg-white">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#073B9A]/10">
          <RotateCcw className="h-8 w-8 text-[#073B9A]" />
        </div>
        <p className="font-headline text-xl font-black text-[#073B9A]">Aucune tontine active</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Créez une tontine ou rejoignez un groupe avec un lien/QR. Les cotisations, garanties, documents et rapports seront suivis en temps réel.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={onCreate} className="bg-[#073B9A] hover:bg-[#073B9A]"><Plus className="mr-2 h-4 w-4" />Créer</Button>
          <Button variant="outline" onClick={onJoin}><LogIn className="mr-2 h-4 w-4" />Rejoindre</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#073B9A]/20 bg-[#FFFFFF] p-4 text-center text-sm font-semibold text-muted-foreground">
      <ReceiptText className="mx-auto mb-2 h-5 w-5 text-[#073B9A]" />
      {text}
    </div>
  );
}
