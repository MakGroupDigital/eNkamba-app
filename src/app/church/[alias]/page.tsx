'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { collection, doc, getDoc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  MessageCircleHeart,
  QrCode,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

import { EChurchIcon } from '@/components/icons/service-icons';
import { PinVerification } from '@/components/payment/PinVerification';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import {
  CHURCH_PAYMENT_CATEGORIES,
  ECHURCH_PRIMARY,
  formatChurchCurrency,
  getChurchCategory,
  type ChurchAccount,
  type ChurchCampaign,
  type ChurchParish,
  type ChurchPaymentCategory,
  type ChurchQrCode,
} from '@/lib/echurch';
import { db, functions } from '@/lib/firebase';

type ReceiptResult = {
  transactionId: string;
  receiptId: string;
  reference: string;
  receiptNumber: string;
};

export default function ChurchPaymentPage() {
  const params = useParams<{ alias: string }>();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { balance } = useWalletTransactions();
  const { toast } = useToast();
  const [account, setAccount] = useState<ChurchAccount | null>(null);
  const [parishes, setParishes] = useState<ChurchParish[]>([]);
  const [campaigns, setCampaigns] = useState<ChurchCampaign[]>([]);
  const [contextQr, setContextQr] = useState<ChurchQrCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptResult | null>(null);
  const [form, setForm] = useState({
    parishId: '',
    campaignId: '',
    category: 'offering' as ChurchPaymentCategory,
    amount: '',
    isAnonymous: false,
    message: '',
  });

  const alias = decodeURIComponent(params?.alias || '');
  const qrId = searchParams?.get('qr') || '';

  useEffect(() => {
    if (!alias) return;
    setIsLoading(true);
    const accountQuery = query(collection(db, 'church_accounts'), where('paymentAlias', '==', alias), limit(1));
    return onSnapshot(accountQuery, (snapshot) => {
      const item = snapshot.docs[0];
      setAccount(item ? ({ id: item.id, ...item.data() } as ChurchAccount) : null);
      setIsLoading(false);
    }, () => {
      setAccount(null);
      setIsLoading(false);
    });
  }, [alias]);

  useEffect(() => {
    if (!account) {
      setParishes([]);
      setCampaigns([]);
      return;
    }
    const accountRef = doc(db, 'church_accounts', account.id);
    const parishUnsubscribe = onSnapshot(collection(accountRef, 'parishes'), (snapshot) => {
      setParishes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChurchParish).filter((item) => item.status === 'active'));
    });
    const campaignUnsubscribe = onSnapshot(collection(accountRef, 'campaigns'), (snapshot) => {
      setCampaigns(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChurchCampaign).filter((item) => item.status === 'active'));
    });
    return () => { parishUnsubscribe(); campaignUnsubscribe(); };
  }, [account]);

  useEffect(() => {
    if (!account || !qrId) {
      setContextQr(null);
      return;
    }
    let cancelled = false;
    const loadQr = async () => {
      const snapshot = await getDoc(doc(db, 'church_accounts', account.id, 'payment_qrcodes', qrId));
      if (!cancelled) setContextQr(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as ChurchQrCode) : null);
    };
    void loadQr();
    return () => { cancelled = true; };
  }, [account, qrId]);

  useEffect(() => {
    if (!contextQr) return;
    setForm((current) => ({
      ...current,
      parishId: contextQr.parishId || current.parishId,
      campaignId: contextQr.campaignId || current.campaignId,
      category: contextQr.category || current.category,
    }));
  }, [contextQr]);

  const selectedParish = useMemo(() => parishes.find((item) => item.id === form.parishId), [form.parishId, parishes]);
  const selectedCampaign = useMemo(() => campaigns.find((item) => item.id === form.campaignId), [campaigns, form.campaignId]);
  const selectedCategory = getChurchCategory(form.category);
  const amount = Number(form.amount);
  const canPay = Boolean(user && account?.status === 'validated' && Number.isFinite(amount) && amount > 0 && amount <= balance && !isProcessing);

  const beginPayment = () => {
    if (!account || account.status !== 'validated') return;
    if (!user) {
      const returnTo = typeof window !== 'undefined' ? window.location.href : `/church/${alias}`;
      window.location.assign(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Montant invalide', description: 'Indiquez une contribution supérieure à zéro.' });
      return;
    }
    if (amount > balance) {
      toast({ variant: 'destructive', title: 'Solde insuffisant', description: `Votre wallet Kenz contient ${formatChurchCurrency(balance)}.` });
      return;
    }
    setShowPin(true);
  };

  const processContribution = async () => {
    if (!account || !user) return;
    setShowPin(false);
    setIsProcessing(true);
    try {
      const processChurchPayment = httpsCallable(functions, 'processChurchPayment');
      const result = await processChurchPayment({
        churchId: account.id,
        amount,
        category: form.category,
        parishId: form.parishId || null,
        campaignId: form.campaignId || null,
        qrId: contextQr?.id || null,
        isAnonymous: form.isAnonymous,
        message: form.message.trim() || null,
        source: contextQr ? 'qr' : 'link',
      });
      const data = result.data as ReceiptResult & { success?: boolean };
      if (!data.success) throw new Error('Paiement non confirmé');
      setReceipt(data);
      toast({ title: 'Contribution reçue', description: 'Votre reçu eChurch est disponible.' });
    } catch (error: any) {
      console.error('Paiement eChurch:', error);
      toast({ variant: 'destructive', title: 'Contribution impossible', description: error?.message || 'Le paiement n’a pas pu être finalisé.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReceipt = () => {
    if (!account || !receipt) return;
    const pdf = new jsPDF();
    pdf.setFillColor(10, 139, 70);
    pdf.rect(0, 0, 210, 32, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text('Kenz Church Pay', 15, 17);
    pdf.setFontSize(10);
    pdf.text('Reçu électronique de contribution', 15, 24);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(18);
    pdf.text('Contribution confirmée', 15, 50);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const content = [
      `Église : ${account.name}`,
      `Référence : ${receipt.reference}`,
      `Reçu : ${receipt.receiptNumber}`,
      `Motif : ${selectedCategory.label}`,
      `Montant : ${formatChurchCurrency(amount)}`,
      `Paroisse : ${selectedParish?.name || 'Collecte générale'}`,
      `Campagne : ${selectedCampaign?.name || 'Aucune'}`,
      `Canal : Wallet Kenz Pay`,
      `Statut : Confirmé`,
      `Date : ${new Intl.DateTimeFormat('fr-CD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`,
      '',
      'Ce reçu confirme la réception de votre contribution. Il peut être vérifié à partir de sa référence dans Kenz Church Pay.',
    ];
    pdf.text(content, 15, 64, { maxWidth: 180, lineHeightFactor: 1.7 });
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Kenz Church Pay - Gestion digitale des dons, dîmes, offrandes et finances de paroisses.', 15, 287, { maxWidth: 180 });
    pdf.save(`recu-${receipt.reference}.pdf`);
  };

  if (isLoading || isAuthLoading) {
    return <main className="min-h-screen bg-[#FFFFFF]"><div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></main>;
  }

  if (!account) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] p-5"><Card className="w-full max-w-md rounded-3xl border-0 shadow-sm"><CardContent className="p-7 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><QrCode className="h-8 w-8" /></span><h1 className="mt-5 text-xl font-black text-slate-950">Lien eChurch introuvable</h1><p className="mt-2 text-sm leading-6 text-slate-600">Ce QR ou lien de contribution n’est plus disponible.</p><Button asChild variant="outline" className="mt-6"><Link href="/dashboard/mbongo-dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Retour à Kenz Pay</Link></Button></CardContent></Card></main>;
  }

  if (account.status !== 'validated') {
    return <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] p-5"><Card className="w-full max-w-md rounded-3xl border-0 shadow-sm"><CardContent className="p-7 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F51B2B]/10 text-[#F51B2B]"><ShieldCheck className="h-8 w-8" /></span><h1 className="mt-5 text-xl font-black text-slate-950">Collecte indisponible</h1><p className="mt-2 text-sm leading-6 text-slate-600">Le compte de {account.name} est en cours de vérification. Réessayez après son activation officielle.</p></CardContent></Card></main>;
  }

  if (receipt) {
    return <main className="min-h-screen bg-[#FFFFFF] p-4 sm:p-6"><section className="mx-auto max-w-md overflow-hidden rounded-[28px] bg-white shadow-xl shadow-primary/10"><div className="bg-primary px-6 pb-11 pt-6 text-center text-white"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><CheckCircle2 className="h-8 w-8" /></div><p className="mt-4 text-xl font-black">Contribution confirmée</p><p className="mt-2 text-sm text-white/78">Merci pour votre soutien à {account.name}.</p></div><div className="-mt-6 px-5 pb-6"><div className="rounded-2xl bg-white p-4 text-center shadow-lg shadow-black/10"><p className="text-xs font-bold text-slate-500">Montant reçu</p><p className="mt-1 text-3xl font-black text-primary">{formatChurchCurrency(amount)}</p><Badge className="mt-3 border border-primary/15 bg-primary/10 text-primary">{selectedCategory.label}</Badge></div><div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"><ReceiptLine label="Référence" value={receipt.reference} /><ReceiptLine label="Paroisse" value={selectedParish?.name || 'Collecte générale'} /><ReceiptLine label="Canal" value="Wallet Kenz Pay" /><ReceiptLine label="Statut" value="Confirmé" /></div><Button className="mt-5 w-full bg-primary hover:bg-primary" onClick={downloadReceipt}><ReceiptText className="mr-2 h-4 w-4" />Télécharger le reçu PDF</Button><Button asChild variant="ghost" className="mt-2 w-full text-primary"><Link href="/dashboard/mbongo-dashboard">Retour à Kenz Pay</Link></Button></div></section></main>;
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-8">
      <section className="relative overflow-hidden bg-primary px-5 pb-16 pt-6 text-white"><div className="absolute -right-20 -top-14 h-48 w-48 rounded-full bg-white/10" /><div className="relative mx-auto flex max-w-2xl items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white p-1">{account.logoUrl ? <img src={account.logoUrl} alt="Logo" className="h-full w-full rounded-xl object-cover" /> : <EChurchIcon size={48} className="h-full w-full" />}</div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Kenz Church Pay</p><h1 className="mt-1 truncate text-lg font-black">{account.name}</h1></div></div><Badge className="border border-white/20 bg-white/10 text-white"><BadgeCheck className="mr-1 h-3.5 w-3.5" />Vérifié</Badge></div></section>
      <section className="relative z-10 mx-auto -mt-9 max-w-2xl px-3 sm:px-5"><Card className="rounded-[24px] border-0 shadow-xl shadow-black/10"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><HeartHandshake className="h-5 w-5" /></span><div><p className="text-sm font-black text-slate-950">Contribuer en toute confiance</p><p className="mt-0.5 text-xs text-slate-500">Votre contribution est enregistrée et un reçu est généré après confirmation.</p></div></div>{contextQr && <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/[0.04] p-3"><QrCode className="h-5 w-5 text-primary" /><p className="text-sm font-bold text-slate-700">{contextQr.campaignName || contextQr.parishName || contextQr.categoryLabel || 'Contribution ciblée'}</p></div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Paroisse"><Select value={form.parishId || 'general'} disabled={Boolean(contextQr?.parishId)} onValueChange={(value) => setForm({ ...form, parishId: value === 'general' ? '' : value, campaignId: '' })}><SelectTrigger><SelectValue placeholder="Collecte générale" /></SelectTrigger><SelectContent><SelectItem value="general">Collecte générale</SelectItem>{parishes.map((parish) => <SelectItem key={parish.id} value={parish.id}>{parish.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Motif"><Select value={form.category} disabled={Boolean(contextQr?.category)} onValueChange={(value) => setForm({ ...form, category: value as ChurchPaymentCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHURCH_PAYMENT_CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Campagne (facultatif)" className="sm:col-span-2"><Select value={form.campaignId || 'none'} disabled={Boolean(contextQr?.campaignId)} onValueChange={(value) => setForm({ ...form, campaignId: value === 'none' ? '' : value })}><SelectTrigger><SelectValue placeholder="Aucune campagne" /></SelectTrigger><SelectContent><SelectItem value="none">Aucune campagne</SelectItem>{campaigns.filter((campaign) => !form.parishId || campaign.parishId === form.parishId).map((campaign) => <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Montant de votre contribution (CDF) *" className="sm:col-span-2"><Input type="number" min="1" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Ex. 10 000" className="h-12 text-lg font-black" /></Field><Field label="Intention ou message (facultatif)" className="sm:col-span-2"><Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Vous pouvez laisser un message avec votre contribution." /></Field></div>
        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 p-3"><span><span className="block text-sm font-bold text-slate-800">Contribuer anonymement</span><span className="mt-0.5 block text-xs text-slate-500">L'Église ne verra pas votre identité sur la contribution.</span></span><Switch checked={form.isAnonymous} onCheckedChange={(checked) => setForm({ ...form, isAnonymous: checked })} /></label>
        {user && <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/10 bg-primary/[0.04] p-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><WalletCards className="h-4 w-4 text-primary" />Solde Kenz Pay</span><span className="font-black text-primary">{formatChurchCurrency(balance)}</span></div>}
        <Button className="mt-5 h-12 w-full bg-primary text-base font-black hover:bg-primary" disabled={!canPay && Boolean(user)} onClick={beginPayment}>{isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <WalletCards className="mr-2 h-5 w-5" />}{user ? `Payer ${amount > 0 ? formatChurchCurrency(amount) : ''}` : 'Se connecter pour contribuer'}</Button><div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Paiement sécurisé par Kenz Pay. Le PIN est demandé avant toute confirmation.</div></CardContent></Card></section>
      <footer className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 px-5 text-center text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-primary" />Contribution traçable · Reçu électronique · Kenz Church Pay</footer>
      <PinVerification isOpen={showPin} onClose={() => setShowPin(false)} onSuccess={processContribution} purpose="payment" paymentDetails={{ recipient: account.name, amount: form.amount || '0', currency: 'CDF' }} />
    </main>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-bold text-slate-700">{label}</Label>{children}</div>; }
function ReceiptLine({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4"><span className="text-slate-500">{label}</span><span className="max-w-[60%] text-right font-bold text-slate-900">{value}</span></div>; }
