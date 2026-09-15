'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { BadgeCheck, GraduationCap, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

type EducationRequest = { id: string; ownerId?: string; userId?: string; institutionName?: string; category?: string; level?: string; city?: string; registrationNumber?: string; legalDocuments?: Array<{ name?: string; url?: string }> };

export default function EducationAccountsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<EducationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const adminRecord = await getDoc(doc(db, 'admins', user.uid));
      if (!adminRecord.exists()) { setUnauthorized(true); setRows([]); return; }
      setUnauthorized(false);
      const snapshot = await getDocs(query(collection(db, 'education_accounts'), where('status', '==', 'PENDING')));
      setRows(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as EducationRequest).sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Chargement impossible', description: error instanceof Error ? error.message : 'Réessayez.' });
    } finally { setLoading(false); }
  }, [user?.uid, toast]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (row: EducationRequest, decision: 'APPROVED' | 'REJECTED') => {
    const reason = decision === 'REJECTED' ? window.prompt('Indiquez les corrections demandées :')?.trim() : '';
    if (decision === 'REJECTED' && !reason) return;
    setBusyId(row.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'education_accounts', row.id), {
        status: decision,
        reviewReason: decision === 'REJECTED' ? reason : null,
        reviewedBy: user?.uid,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const ownerId = row.ownerId || row.userId;
      if (ownerId) {
        const notice = doc(collection(db, 'users', ownerId, 'notifications'));
        batch.set(notice, {
          id: notice.id,
          type: decision === 'APPROVED' ? 'education_account_approved' : 'education_account_rejected',
          title: decision === 'APPROVED' ? 'Établissement validé' : 'Dossier Éducation à corriger',
          message: decision === 'APPROVED' ? `${row.institutionName || 'Votre établissement'} peut maintenant recevoir les paiements Kenz Pay.` : `Le dossier de ${row.institutionName || 'votre établissement'} doit être corrigé : ${reason}`,
          educationId: row.id,
          context: 'education',
          read: false,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      toast({ title: decision === 'APPROVED' ? 'Établissement validé' : 'Dossier retourné', description: row.institutionName });
      await load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action refusée', description: error instanceof Error ? error.message : 'Vérifiez vos droits administrateur.' });
    } finally { setBusyId(''); }
  };

  if (authLoading || loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-[#073B9A]" /></div>;
  if (unauthorized) return <main className="mx-auto max-w-xl p-8"><section className="rounded-xl border bg-white p-8 text-center"><h1 className="text-xl font-bold">Accès réservé</h1><p className="mt-2 text-sm text-slate-500">Ce centre est réservé aux administrateurs Kenz.</p></section></main>;
  return <main className="mx-auto max-w-5xl space-y-5 p-4 pb-24 md:p-8">
    <header className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><GraduationCap className="h-8 w-8 text-[#073B9A]"/><div><p className="text-xs font-bold uppercase tracking-wider text-[#073B9A]">Administration Kenz</p><h1 className="text-2xl font-bold">Dossiers Éducation</h1></div></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4"/>Actualiser</Button></header>
    {rows.length ? rows.map((row) => <article key={row.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">{row.institutionName}</h2><p className="mt-1 text-sm text-slate-500">{row.category === 'BASIC' ? 'Enseignement général' : 'Supérieur et formation professionnelle'} · {row.level} · {row.city}</p><p className="mt-1 text-xs text-slate-500">N° légal : {row.registrationNumber || 'Non fourni'}</p>{row.legalDocuments?.map((document, index) => document.url && <a key={index} className="mt-2 inline-block text-sm font-medium text-[#073B9A] underline" href={document.url} target="_blank" rel="noreferrer">{document.name || 'Consulter le document légal'}</a>)}</div><div className="flex gap-2"><Button disabled={busyId === row.id} onClick={() => void decide(row, 'APPROVED')} className="bg-[#073B9A]"><BadgeCheck className="mr-2 h-4 w-4"/>Valider</Button><Button disabled={busyId === row.id} variant="outline" onClick={() => void decide(row, 'REJECTED')}><XCircle className="mr-2 h-4 w-4"/>À corriger</Button></div></div></article>) : <section className="rounded-xl border bg-white p-10 text-center text-slate-500">Aucun dossier Éducation en attente.</section>}
  </main>;
}
