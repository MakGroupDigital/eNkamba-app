'use client';

import { useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, GraduationCap, Printer, Search, School } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PinVerification } from '@/components/payment/PinVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type EducationKind = 'BASIC' | 'HIGHER_PROFESSIONAL';
type Fee = { id: string; label: string; amount: number; currency: string; appliesTo: string; dueDate: string };
type Institution = { id: string; reference: string; name: string; category: EducationKind; address: string; city: string; phone: string; logoUrl: string; status: string };
type Receipt = { reference: string; receiptNumber: string; amount: number; currency: string; feeLabel: string; institutionName: string; date: string; student: Record<string, string> };

function parseInstitutionCode(value: string) {
  const raw = value.trim();
  const qr = raw.match(/^KENZ:EDUCATION:([^:]+):([^:]+)$/i);
  return { id: qr?.[1] || '', reference: (qr?.[2] || raw).trim().toUpperCase() };
}

function randomCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function EducationFeePayment({ kind }: { kind: EducationKind }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isHigher = kind === 'HIGHER_PROFESSIONAL';
  const [code, setCode] = useState('');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [feeId, setFeeId] = useState('');
  const [student, setStudent] = useState({ fullName: '', studentNumber: '', grade: '', faculty: '', department: '', level: '', academicYear: '' });
  const [stage, setStage] = useState<'lookup' | 'details' | 'paying' | 'receipt'>('lookup');
  const [lookingUp, setLookingUp] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const selectedFee = useMemo(() => fees.find((fee) => fee.id === feeId) || null, [fees, feeId]);
  const eligibleFees = fees.filter((fee) => fee.currency === 'CDF');

  const lookup = async () => {
    if (code.trim().length < 5) return;
    setLookingUp(true);
    setError('');
    try {
      const parsed = parseInstitutionCode(code);
      if (!parsed.reference) throw new Error('Saisissez une référence ou scannez le QR de l’établissement.');
      let accountSnapshot = parsed.id ? await getDoc(doc(db, 'education_accounts', parsed.id)) : null;
      if (!accountSnapshot?.exists()) {
        const matches = await getDocs(query(collection(db, 'education_accounts'), where('paymentReference', '==', parsed.reference)));
        accountSnapshot = matches.docs[0] || null;
      }
      if (!accountSnapshot?.exists()) throw new Error('Aucun établissement ne correspond à cette référence.');
      const account = accountSnapshot.data();
      if (String(account.paymentReference || '').toUpperCase() !== parsed.reference) throw new Error('Le QR ne correspond pas à la référence de cet établissement.');
      const feeSnapshot = await getDocs(query(collection(db, 'education_accounts', accountSnapshot.id, 'fees'), where('active', '==', true)));
      const result = {
        institution: {
          id: accountSnapshot.id,
          reference: String(account.paymentReference || account.reference || ''),
          name: String(account.institutionName || ''),
          category: String(account.category || '') as EducationKind,
          address: String(account.address || ''),
          city: String(account.city || ''),
          phone: String(account.phone || ''),
          logoUrl: String(account.logoUrl || ''),
          status: String(account.status || '').toUpperCase(),
        },
        fees: feeSnapshot.docs.map((item) => {
          const fee = item.data();
          return { id: item.id, label: String(fee.label || ''), amount: Number(fee.amount || 0), currency: String(fee.currency || 'CDF').toUpperCase(), appliesTo: String(fee.appliesTo || ''), dueDate: String(fee.dueDate || '') };
        }).filter((fee) => fee.label && Number.isFinite(fee.amount) && fee.amount > 0),
      };
      if (result.institution.category !== kind) {
        throw new Error(isHigher ? 'Cette référence correspond à une école primaire ou secondaire.' : 'Cette référence correspond à un établissement supérieur ou professionnel.');
      }
      setInstitution(result.institution);
      setFees(result.fees);
      setFeeId('');
      setStage('details');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Établissement introuvable.';
      setError(message);
      toast({ variant: 'destructive', title: 'Recherche impossible', description: message });
    } finally {
      setLookingUp(false);
    }
  };

  const beginPayment = () => {
    if (!institution || !selectedFee || !student.fullName.trim() || (isHigher ? !student.faculty || !student.level : !student.grade)) return;
    setRequestId(crypto.randomUUID());
    setPinOpen(true);
  };

  const pay = async (pin?: string) => {
    if (!institution || !selectedFee || !pin || !user?.uid || !requestId) return;
    setPinOpen(false);
    setStage('paying');
    setError('');
    try {
      const institutionRef = doc(db, 'education_accounts', institution.id);
      const feeRef = doc(db, 'education_accounts', institution.id, 'fees', selectedFee.id);
      const payerRef = doc(db, 'users', user.uid);
      const pinRef = doc(db, 'users', user.uid, 'security', 'pin');
      const businessWalletRef = doc(db, 'business_wallets', institution.id);
      const paymentRef = doc(db, 'education_accounts', institution.id, 'payments', requestId);
      const receiptRef = doc(db, 'education_accounts', institution.id, 'receipts', requestId);
      const payerReceiptRef = doc(db, 'users', user.uid, 'receipts', requestId);
      const payerTransactionRef = doc(db, 'users', user.uid, 'transactions', requestId);
      const businessLedgerRef = doc(db, 'business_wallets', institution.id, 'transactions', requestId);
      const payerNoticeRef = doc(collection(db, 'users', user.uid, 'notifications'));
      const studentData = {
        fullName: student.fullName.trim(), studentNumber: student.studentNumber.trim(), grade: student.grade,
        faculty: student.faculty, department: student.department.trim(), level: student.level, academicYear: student.academicYear.trim(),
      };
      const receiptResult = await runTransaction(db, async (transaction) => {
        const [institutionSnap, feeSnap, payerSnap, pinSnap, walletSnap, priorPaymentSnap] = await Promise.all([
          transaction.get(institutionRef), transaction.get(feeRef), transaction.get(payerRef), transaction.get(pinRef),
          transaction.get(businessWalletRef), transaction.get(paymentRef),
        ]);
        if (!institutionSnap.exists() || !feeSnap.exists() || !payerSnap.exists() || !pinSnap.exists()) throw new Error('Établissement, frais, wallet ou PIN introuvable.');
        if (pinSnap.data().pin !== btoa(pin)) throw new Error('PIN incorrect. Vérifiez votre code puis réessayez.');
        if (priorPaymentSnap.exists()) {
          const previous = priorPaymentSnap.data();
          if (previous.payerId !== user.uid) throw new Error('Cette référence de paiement a déjà été utilisée.');
          return { reference: previous.reference, receiptNumber: previous.receiptNumber, amount: previous.amount, currency: previous.currency, feeLabel: previous.feeLabel, institutionName: previous.institutionName, paidAt: previous.paidAt || new Date().toISOString() };
        }
        const freshInstitution = institutionSnap.data();
        const freshFee = feeSnap.data();
        if (String(freshInstitution.status || '').toUpperCase() !== 'APPROVED') throw new Error('L’établissement n’est pas encore validé.');
        if (freshFee.active !== true || freshFee.currency !== 'CDF' || Number(freshFee.amount) !== selectedFee.amount) throw new Error('Le frais a changé ou n’est plus disponible. Actualisez la liste.');
        const amount = Number(freshFee.amount);
        if (!Number.isInteger(amount) || amount <= 0) throw new Error('Montant de frais invalide.');
        const payer = payerSnap.data();
        const payerBalance = Number(payer.walletBalance || 0);
        if (payerBalance < amount) throw new Error('Solde Kenz Pay insuffisant.');
        const businessWallet = walletSnap.data() || {};
        const businessBalance = Number(businessWallet.availableBalance || 0);
        const reference = randomCode('KENZ-EDU');
        const receiptNumber = randomCode('RCP-EDU');
        const paidAt = new Date().toISOString();
        const payerName = String(payer.fullName || payer.displayName || user.displayName || user.email || 'Client Kenz');
        const record = {
          id: requestId, transactionId: requestId, reference, receiptNumber, educationId: institution.id,
          educationReference: String(freshInstitution.paymentReference || freshInstitution.reference || ''),
          institutionName: String(freshInstitution.institutionName || ''), payerId: user.uid, payerName,
          student: studentData, feeId: selectedFee.id, feeLabel: String(freshFee.label || ''), amount, currency: 'CDF',
          status: 'PAID', paymentMethod: 'Kenz Pay', paymentChannel: 'kenz_wallet', paidAt, createdAt: serverTimestamp(),
        };
        transaction.update(payerRef, { walletBalance: payerBalance - amount, lastTransactionTime: serverTimestamp() });
        transaction.set(businessWalletRef, {
          accountId: institution.id, ownerId: String(freshInstitution.ownerId || freshInstitution.userId || ''),
          accountName: String(freshInstitution.institutionName || ''), currency: 'CDF', availableBalance: businessBalance + amount,
          receivedTotal: Number(businessWallet.receivedTotal || 0) + amount, transactionCount: Number(businessWallet.transactionCount || 0) + 1,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        transaction.set(institutionRef, { receivedTotal: Number(freshInstitution.receivedTotal || 0) + amount, transactionCount: Number(freshInstitution.transactionCount || 0) + 1, lastPaymentAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(paymentRef, record);
        transaction.set(receiptRef, { ...record, verificationCode: reference, generatedAt: serverTimestamp() });
        transaction.set(payerReceiptRef, { ...record, receiptId: requestId, verificationCode: reference, generatedAt: serverTimestamp() });
        transaction.set(businessLedgerRef, { id: requestId, type: 'education_fee_received', amount, currency: 'CDF', status: 'completed', reference, paymentId: requestId, feeLabel: record.feeLabel, payerName, studentName: studentData.fullName, previousBalance: businessBalance, newBalance: businessBalance + amount, createdAt: serverTimestamp() });
        transaction.set(payerTransactionRef, { id: requestId, type: 'payment_sent', context: 'services', service: 'education', amount, amountInCDF: amount, currency: 'CDF', status: 'completed', description: `${record.feeLabel} - ${record.institutionName}`, previousBalance: payerBalance, newBalance: payerBalance - amount, educationId: institution.id, educationPaymentId: requestId, reference, timestamp: serverTimestamp(), createdAt: paidAt });
        transaction.set(payerNoticeRef, { id: payerNoticeRef.id, type: 'education_payment', title: 'Paiement confirmé', message: `${record.feeLabel} payé pour ${record.institutionName}. Référence ${reference}.`, amount, currency: 'CDF', transactionId: requestId, context: 'education', read: false, timestamp: serverTimestamp(), createdAt: paidAt });
        const owner = String(freshInstitution.ownerId || freshInstitution.userId || '');
        if (owner) {
          const ownerNoticeRef = doc(collection(db, 'users', owner, 'notifications'));
          transaction.set(ownerNoticeRef, { id: ownerNoticeRef.id, type: 'education_payment_received', title: 'Frais scolaires reçus', message: `${amount.toLocaleString('fr-FR')} CDF reçus pour ${record.feeLabel}.`, amount, currency: 'CDF', transactionId: requestId, educationId: institution.id, context: 'education', read: false, timestamp: serverTimestamp(), createdAt: paidAt });
        }
        return { reference, receiptNumber, amount, currency: 'CDF', feeLabel: record.feeLabel, institutionName: record.institutionName, paidAt };
      });
      const result = receiptResult;
      setReceipt({
        reference: result.reference,
        receiptNumber: result.receiptNumber,
        amount: result.amount,
        currency: result.currency,
        feeLabel: result.feeLabel,
        institutionName: result.institutionName,
        date: result.paidAt || new Date().toISOString(),
        student: { ...student },
      });
      setStage('receipt');
      toast({ title: 'Paiement confirmé', description: `${result.amount.toLocaleString('fr-FR')} ${result.currency} payés à ${result.institutionName}.` });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Le paiement n’a pas abouti.';
      setError(message);
      setStage('details');
      toast({ variant: 'destructive', title: 'Paiement refusé', description: message });
    }
  };

  const field = (key: keyof typeof student, label: string, placeholder: string, required = false) => (
    <label className="grid gap-1.5 text-sm font-medium" key={key}>{label}{required && ' *'}
      <Input required={required} value={student[key]} onChange={(event) => setStudent((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />
    </label>
  );

  return <main className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-2xl px-4 py-5 pb-24 text-slate-900">
    <header className="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={() => stage === 'details' ? setStage('lookup') : history.back()} aria-label="Retour"><ArrowLeft /></Button>
      <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#073B9A]">Kenz Pay · Éducation</p><h1 className="text-xl font-bold">{isHigher ? 'Frais académiques' : 'Frais scolaires'}</h1></div>
    </header>

    {stage === 'lookup' && <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-[#073B9A]/10 text-[#073B9A]"><GraduationCap /></div>
      <h2 className="text-lg font-semibold">Rechercher l’établissement</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">Saisissez sa référence Kenz ou le contenu de son QR de paiement.</p>
      <Input value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void lookup()} placeholder="Ex. EDU-KIN-123ABC" autoCapitalize="characters" />
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <Button className="mt-4 w-full bg-[#073B9A]" onClick={() => void lookup()} disabled={lookingUp || code.trim().length < 5}><Search className="mr-2 h-4 w-4" />{lookingUp ? 'Recherche…' : 'Rechercher'}</Button>
    </section>}

    {stage === 'details' && institution && <div className="space-y-4">
      <section className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        {institution.logoUrl ? <img src={institution.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#073B9A]/10 text-[#073B9A]"><School /></div>}
        <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{institution.name}</h2><p className="text-sm text-slate-500">{institution.reference} · {[institution.city, institution.address].filter(Boolean).join(', ')}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${institution.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{institution.status === 'APPROVED' ? 'Vérifié' : 'En vérification'}</span>
      </section>
      {institution.status !== 'APPROVED' ? <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Cet établissement n’est pas encore validé. Le paiement sera disponible après vérification de son dossier.</section> : <>
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">{isHigher ? 'Informations de l’étudiant' : 'Informations de l’élève'}</h2>
          {field('fullName', 'Nom complet', 'Nom et prénom', true)}
          {isHigher ? <div className="grid gap-3 sm:grid-cols-2">{field('studentNumber', 'Matricule', 'Numéro étudiant', true)}{field('faculty', 'Faculté / programme', 'Ex. Sciences', true)}{field('department', 'Département', 'Optionnel')}{field('level', 'Niveau / promotion', 'Ex. L1, G2', true)}{field('academicYear', 'Année académique', '2026-2027')}</div> : <div className="grid gap-3 sm:grid-cols-2">{field('studentNumber', 'Matricule', 'Numéro élève')}{field('grade', 'Classe', 'Ex. 5e primaire', true)}</div>}
        </section>
        <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Frais à payer</h2>
          {eligibleFees.length === 0 ? <p className="text-sm text-slate-500">Aucun frais actif en CDF n’est publié par cet établissement.</p> : eligibleFees.map((fee) => <label key={fee.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${feeId === fee.id ? 'border-[#073B9A] bg-[#073B9A]/5' : 'border-slate-200'}`}><input type="radio" name="education-fee" checked={feeId === fee.id} onChange={() => setFeeId(fee.id)} className="accent-[#073B9A]" /><span className="min-w-0 flex-1"><strong className="block">{fee.label}</strong><small className="text-slate-500">{fee.appliesTo || 'Frais de l’établissement'}{fee.dueDate ? ` · Échéance ${fee.dueDate}` : ''}</small></span><strong className="whitespace-nowrap">{fee.amount.toLocaleString('fr-FR')} {fee.currency}</strong></label>)}
          {fees.some((fee) => fee.currency !== 'CDF') && <p className="text-xs text-slate-500">Les frais en devise autre que CDF sont temporairement indisponibles, car le wallet Kenz Pay est libellé en CDF.</p>}
        </section>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button onClick={beginPayment} disabled={!selectedFee || !student.fullName || (isHigher ? !student.faculty || !student.level : !student.grade)} className="w-full bg-[#073B9A]">Confirmer et payer avec Kenz Pay</Button>
      </>}
    </div>}

    {stage === 'paying' && <section className="rounded-2xl border bg-white p-10 text-center shadow-sm"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#073B9A] border-t-transparent"/><h2 className="font-semibold">Paiement sécurisé en cours</h2><p className="mt-1 text-sm text-slate-500">Ne fermez pas cette page.</p></section>}

    {stage === 'receipt' && receipt && <section className="rounded-2xl border bg-white p-6 shadow-sm" id="education-payment-receipt">
      <div className="mb-5 flex items-center gap-3 border-b pb-4"><CheckCircle2 className="h-9 w-9 text-emerald-600"/><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Paiement confirmé</p><h2 className="text-lg font-bold">Reçu Kenz Pay</h2></div></div>
      <p className="text-center text-3xl font-bold">{receipt.amount.toLocaleString('fr-FR')} {receipt.currency}</p>
      <p className="mb-5 text-center text-sm text-slate-500">{receipt.institutionName} · {receipt.feeLabel}</p>
      <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t pt-4 text-sm"><dt>Référence</dt><dd className="font-mono font-semibold">{receipt.reference}</dd><dt>N° reçu</dt><dd className="font-mono">{receipt.receiptNumber}</dd><dt>Payeur</dt><dd>{user?.displayName || user?.email || 'Client Kenz'}</dd><dt>Bénéficiaire</dt><dd>{receipt.student.fullName}</dd>{receipt.student.studentNumber && <><dt>Matricule</dt><dd>{receipt.student.studentNumber}</dd></>}<dt>Date</dt><dd>{new Date(receipt.date).toLocaleString('fr-FR')}</dd><dt>Mode</dt><dd>Kenz Pay</dd></dl>
      <div className="mt-5 flex gap-3 print:hidden"><Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Imprimer / PDF</Button><Button className="flex-1 bg-[#073B9A]" onClick={() => { setStage('lookup'); setInstitution(null); setCode(''); setReceipt(null); }}>Nouveau paiement</Button></div>
    </section>}
    <PinVerification isOpen={pinOpen} onClose={() => setPinOpen(false)} onSuccess={(verifiedPin) => void pay(verifiedPin)} purpose="payment" paymentDetails={selectedFee ? { recipient: institution?.name || 'Établissement', amount: selectedFee.amount.toLocaleString('fr-FR'), currency: selectedFee.currency } : undefined} />
  </main>;
}
