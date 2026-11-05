'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { BadgeCheck, Church, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import type { ChurchAccount } from '@/lib/echurch';

type ChurchRequest = ChurchAccount & { legalDocument?: { fileUrl?: string; fileName?: string } | null };

const PENDING_STATUSES = ['submitted', 'under_review'];

/** Validation Kenz des comptes eChurch : tant qu'une Église n'est pas validée, elle ne peut pas recevoir de paiement. */
export default function ChurchAccountsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<ChurchRequest[]>([]);
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
      const snapshot = await getDocs(query(collection(db, 'church_accounts'), where('status', 'in', PENDING_STATUSES)));
      const items = await Promise.all(snapshot.docs.map(async (item) => {
        const legal = await getDoc(doc(db, 'church_accounts', item.id, 'documents', 'legal_reference')).catch(() => null);
        return { id: item.id, ...item.data(), legalDocument: legal?.exists() ? legal.data() : null } as ChurchRequest;
      }));
      setRows(items.sort((a: any, b: any) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0)));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Chargement impossible', description: error instanceof Error ? error.message : 'Réessayez.' });
    } finally { setLoading(false); }
  }, [user?.uid, toast]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (row: ChurchRequest, decision: 'validated' | 'rejected') => {
    const reason = decision === 'rejected' ? window.prompt('Indiquez les corrections demandées :')?.trim() : '';
    if (decision === 'rejected' && !reason) return;
    setBusyId(row.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'church_accounts', row.id), {
        status: decision,
        rejectionReason: decision === 'rejected' ? reason : null,
        reviewedBy: user?.uid,
        ...(decision === 'validated' ? { verifiedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(collection(db, 'church_accounts', row.id, 'audit_logs')), {
        action: decision === 'validated' ? 'account_validated' : 'account_rejected',
        actorId: user?.uid,
        entityType: 'account',
        entityId: row.id,
        reason: reason || null,
        createdAt: serverTimestamp(),
      });
      if (row.ownerId) {
        const notice = doc(collection(db, 'users', row.ownerId, 'notifications'));
        batch.set(notice, {
          id: notice.id,
          type: decision === 'validated' ? 'church_account_validated' : 'church_account_rejected',
          title: decision === 'validated' ? 'Église validée' : 'Dossier eChurch à corriger',
          message: decision === 'validated'
            ? `${row.name} peut maintenant recevoir les paiements Kenz Pay (référence ${row.publicId}).`
            : `Le dossier de ${row.name} doit être corrigé : ${reason}`,
          churchId: row.id,
          context: 'echurch',
          read: false,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      toast({ title: decision === 'validated' ? 'Église validée' : 'Dossier retourné', description: row.name });
      await load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action refusée', description: error instanceof Error ? error.message : 'Vérifiez vos droits administrateur.' });
    } finally { setBusyId(''); }
  };

  if (authLoading || loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-[#073B9A]" /></div>;
  if (unauthorized) return <main className="mx-auto max-w-xl p-8"><section className="rounded-xl border bg-white p-8 text-center"><h1 className="text-xl font-bold">Accès réservé</h1><p className="mt-2 text-sm text-slate-500">Ce centre est réservé aux administrateurs Kenz.</p></section></main>;
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 pb-24 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Church className="h-8 w-8 text-[#073B9A]" /><div><p className="text-xs font-bold uppercase tracking-wider text-[#073B9A]">Administration Kenz</p><h1 className="text-2xl font-bold">Dossiers eChurch</h1></div></div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
      </header>
      {rows.length ? rows.map((row) => (
        <article key={row.id} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-semibold">{row.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{[row.city, row.country].filter(Boolean).join(', ')} · Réf. {row.publicId}</p>
              <p className="mt-1 text-sm text-slate-500">{row.representativeName} ({row.representativeRole}) · {row.phone} · {row.email}</p>
              {row.legalName && <p className="mt-1 text-xs text-slate-500">Nom légal : {row.legalName}</p>}
              {row.legalDocument?.fileUrl
                ? <a className="mt-2 inline-block text-sm font-medium text-[#073B9A] underline" href={row.legalDocument.fileUrl} target="_blank" rel="noreferrer">{row.legalDocument.fileName || 'Consulter le document légal'}</a>
                : <p className="mt-2 text-xs font-medium text-amber-700">Aucun document légal fourni</p>}
            </div>
            <div className="flex gap-2">
              <Button disabled={busyId === row.id} onClick={() => void decide(row, 'validated')} className="bg-[#073B9A]"><BadgeCheck className="mr-2 h-4 w-4" />Valider</Button>
              <Button disabled={busyId === row.id} variant="outline" onClick={() => void decide(row, 'rejected')}><XCircle className="mr-2 h-4 w-4" />À corriger</Button>
            </div>
          </div>
        </article>
      )) : <section className="rounded-xl border bg-white p-10 text-center text-slate-500">Aucun dossier eChurch en attente.</section>}
    </main>
  );
}
