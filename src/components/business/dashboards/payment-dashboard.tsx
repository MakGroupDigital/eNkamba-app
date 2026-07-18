'use client';

import React, { useEffect, useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';
import {
  CreditIcon,
  LinkAccountIcon,
  PaymentNavIcon,
  ReportNavIcon,
  SecurityIcon,
  WalletNavIcon,
} from '@/components/icons/service-icons';
import { addDoc, arrayUnion, collection, doc, limit, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface PaymentDashboardProps {
  businessUser: BusinessUser;
}

type PaymentTab = 'overview' | 'api' | 'tokens' | 'generation' | 'integration' | 'docs' | 'transactions' | 'balance' | 'pos-transfer';
type PosMode = 'send' | 'payout' | 'cash' | 'history';
type PosTransferStatus = 'available' | 'verification' | 'blocked' | 'paid' | 'cancelled' | 'expired' | 'refunded';
type PosTransfer = {
  id: string;
  internalReference: string;
  clientCode: string;
  senderName: string;
  senderPhone: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  amount: number;
  fee: number;
  totalCollected: number;
  currency: string;
  payoutCity: string;
  payoutOfficeCode: string;
  status: PosTransferStatus;
  createdAtMs: number;
};

const tabs: Array<{ id: PaymentTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Vue d’ensemble', icon: PaymentNavIcon },
  { id: 'pos-transfer', label: 'Transfert POS', icon: PaymentNavIcon },
  { id: 'api', label: 'API', icon: LinkAccountIcon },
  { id: 'tokens', label: 'Tokens', icon: SecurityIcon },
  { id: 'generation', label: 'Génération', icon: CreditIcon },
  { id: 'integration', label: 'Intégration', icon: WalletNavIcon },
  { id: 'docs', label: 'Documentation', icon: ReportNavIcon },
  { id: 'transactions', label: 'Transactions', icon: BusinessDashboardIcons.BarChart },
  { id: 'balance', label: 'Solde', icon: WalletNavIcon },
];

export function PaymentDashboard({ businessUser }: PaymentDashboardProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('overview');
  const [posMode, setPosMode] = useState<PosMode>('send');
  const isTransferAgency = businessUser.subCategory === 'TRANSFER_AGENCY';
  const isIntegrator = businessUser.subCategory === 'API_INTEGRATION';
  const showTransferTools = businessUser.businessType === 'PAYMENT';
  const activeTabs = showTransferTools
    ? tabs
    : tabs.filter((tab) => tab.id !== 'pos-transfer');
  const baseQuickActions = [
    { label: 'API', tab: 'api' as const, icon: LinkAccountIcon },
    { label: 'Tokens', tab: 'tokens' as const, icon: SecurityIcon },
    { label: 'Générer', tab: 'generation' as const, icon: CreditIcon },
    { label: 'Docs', tab: 'docs' as const, icon: ReportNavIcon },
  ];
  const posQuickActions = [
    { label: 'Nouveau transfert', tab: 'pos-transfer' as const, posMode: 'send' as const, icon: CreditIcon },
    { label: 'Payer code', tab: 'pos-transfer' as const, posMode: 'payout' as const, icon: PaymentNavIcon },
    { label: 'Caisse POS', tab: 'pos-transfer' as const, posMode: 'cash' as const, icon: WalletNavIcon },
    { label: 'Audit POS', tab: 'pos-transfer' as const, posMode: 'history' as const, icon: ReportNavIcon },
  ];
  const quickActions = showTransferTools ? [...baseQuickActions, ...posQuickActions] : baseQuickActions;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.14),transparent_34%),linear-gradient(180deg,rgba(50,187,120,0.05)_0%,rgba(50,187,120,0.08)_54%,rgba(50,187,120,0.04)_100%)] pb-24 text-foreground">
      <div className="sticky top-0 z-30 rounded-b-[32px] bg-gradient-to-r from-[#009058] via-[#009058] to-[#009058] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg shadow-[#009058]/20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl border border-white/30 bg-white shadow-md">
                <PaymentNavIcon size={62} className="h-[62px] w-[62px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Mbongo Business</p>
                <h1 className="truncate text-xl font-black leading-tight">{businessUser.businessName}</h1>
                <p className="truncate text-xs font-medium text-white/75">
                  {isTransferAgency ? 'Agence de transfert d’argent POS' : isIntegrator ? 'Intégrateur API' : 'Agent agréé / compte paiement'}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-bold backdrop-blur sm:flex">
              <BusinessDashboardIcons.CheckCircle className="h-4 w-4" />
              Compte actif
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    if ('posMode' in action && action.posMode) {
                      setPosMode(action.posMode);
                    }
                    setActiveTab(action.tab);
                  }}
                  className="group flex min-w-[88px] flex-col items-center gap-2 rounded-2xl bg-white/12 p-2.5 text-center ring-1 ring-white/18 transition hover:bg-white/20"
                >
                  <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-md transition group-hover:scale-105">
                    <Icon size={58} className="h-[58px] w-[58px]" />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-bold leading-tight text-white">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <section className="overflow-hidden rounded-3xl border border-[#009058] bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {activeTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === id
                    ? 'bg-[#009058] text-white shadow-md shadow-[#009058]/20'
                    : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-[#009058]'
                }`}
              >
                <Icon size={34} className="h-[34px] w-[34px]" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'overview' && <PaymentOverview isIntegrator={isIntegrator} />}
        {activeTab === 'api' && <PaymentAPI />}
        {activeTab === 'tokens' && <PaymentTokens />}
        {activeTab === 'generation' && <PaymentGeneration />}
        {activeTab === 'integration' && <PaymentIntegration />}
        {activeTab === 'docs' && <PaymentDocumentation />}
        {activeTab === 'transactions' && <PaymentTransactions />}
        {activeTab === 'balance' && <AgentBalance />}
        {activeTab === 'pos-transfer' && <PaymentPosTransferAgency businessUser={businessUser} initialMode={posMode} />}
      </div>
    </div>
  );
}

function PaymentOverview({ isIntegrator }: { isIntegrator: boolean }) {
  const stats = [
    { label: 'Volume du jour', value: '0 FC', icon: CreditIcon, color: 'green' },
    { label: 'Transactions', value: '0', icon: BusinessDashboardIcons.BarChart, color: 'blue' },
    { label: 'Taux de succès', value: '0%', icon: BusinessDashboardIcons.CheckCircle, color: 'emerald' },
    isIntegrator
      ? { label: 'Appels API', value: '0', icon: LinkAccountIcon, color: 'orange' }
      : { label: 'Commissions', value: '0 FC', icon: WalletNavIcon, color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      {stats.map((stat, idx) => (
        <PaymentMetricCard key={`${stat.label}-${idx}`} stat={stat} />
      ))}
    </div>
  );
}

function PaymentAPI() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Clés API" subtitle="Séparez toujours les environnements test et production." action="+ Générer une clé">
        <ApiCredential label="Clé publique" value="pk_live_xxxxxxxxxxxxx" />
        <ApiCredential label="Clé secrète" value="sk_live_xxxxxxxxxxxxx" sensitive />
        <ApiCredential label="Webhook secret" value="whsec_xxxxxxxxxxxxx" sensitive />
      </Panel>
      <Panel title="Statut API" subtitle="Préparation du trafic technique Mbongo.">
        <div className="grid gap-3">
          {[
            ['Environnement', 'Live + Sandbox'],
            ['Version API', 'v1'],
            ['Webhooks', 'Non configurés'],
            ['Dernier appel', 'Aucun'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-[#009058] px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <span className="text-sm font-black text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PaymentTokens() {
  return (
    <Panel title="Tokens d’accès" subtitle="Créez des tokens limités par usage, durée et module." action="+ Nouveau token">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: 'Token checkout', scope: 'Paiement client', status: 'Prêt' },
          { title: 'Token wallet', scope: 'Solde & mouvements', status: 'À générer' },
          { title: 'Token reporting', scope: 'Rapports & exports', status: 'À générer' },
        ].map((token) => (
          <div key={token.title} className="rounded-3xl border border-[#009058] bg-[#009058] p-4">
            <SecurityIcon size={34} />
            <p className="mt-3 font-black text-foreground">{token.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{token.scope}</p>
            <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#009058]">
              {token.status}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PaymentGeneration() {
  const [generatedKey, setGeneratedKey] = useState('pk_test_demo_xxxxxxxx');
  const generateKey = () => {
    const suffix = Math.random().toString(36).slice(2, 12);
    setGeneratedKey(`pk_test_${suffix}`);
  };

  return (
    <Panel title="Génération" subtitle="Génération locale de prévisualisation. La clé réelle doit être créée côté serveur sécurisé.">
      <div className="rounded-3xl bg-[#009058] p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Nouvelle clé test</p>
        <code className="mt-3 block overflow-x-auto rounded-2xl bg-white/10 p-4 text-sm font-bold text-white">{generatedKey}</code>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button onClick={generateKey} className="rounded-2xl bg-[#009058] px-4 py-3 text-sm font-bold text-white">Générer</button>
          <button className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#009058]">Copier</button>
          <button className="rounded-2xl bg-[#FFA500] px-4 py-3 text-sm font-bold text-white">Révoquer</button>
        </div>
      </div>
    </Panel>
  );
}

function PaymentIntegration() {
  return (
    <Panel title="Intégration" subtitle="Points d’intégration recommandés pour vos apps, sites et boutiques.">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Checkout web', 'Redirection sécurisée ou composant embarqué.'],
          ['Mobile money', 'Encaissements client et confirmation de statut.'],
          ['Wallet business', 'Solde, commissions et mouvements.'],
          ['Webhooks', 'Notifications paiement réussi, échoué, remboursé.'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-[#009058] bg-white p-4">
            <LinkAccountIcon size={34} />
            <p className="mt-3 font-black text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PaymentDocumentation() {
  return (
    <Panel title="Documentation" subtitle="Guides rapides pour brancher Mbongo dans un produit.">
      <div className="space-y-3">
        {[
          ['Démarrage rapide', 'Créer une clé test, appeler le checkout, vérifier le statut.'],
          ['Référence API', 'Endpoints paiement, wallet, remboursement, reporting.'],
          ['Webhooks', 'Signature, retry, idempotence et événements.'],
          ['Sécurité', 'Rotation des secrets, scopes, tokens courts et logs.'],
        ].map(([title, text]) => (
          <button key={title} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-[#009058] px-4 py-4 text-left">
            <span>
              <span className="block font-black text-foreground">{title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
            </span>
            <ReportNavIcon size={28} />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function PaymentTransactions() {
  return (
    <Panel title="Historique des transactions" subtitle="Les paiements, remboursements et encaissements apparaîtront ici.">
      <EmptyPaymentState icon={BusinessDashboardIcons.BarChart} text="Aucune transaction pour le moment" />
    </Panel>
  );
}

function AgentBalance() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-[#009058] to-[#009058] p-6 text-white">
          <p className="text-sm font-bold text-white/70">Solde total</p>
          <p className="mt-2 text-4xl font-black">0 FC</p>
        </div>
        <div className="rounded-3xl bg-[#FFA500] p-6 text-white">
          <p className="text-sm font-bold text-white/70">Commissions gagnées</p>
          <p className="mt-2 text-4xl font-black">0 FC</p>
        </div>
      </div>
      <Panel title="Relevé du jour" subtitle="Synthèse des dépôts, retraits et net business.">
        {['Dépôts', 'Retraits', 'Net du jour'].map((item) => (
          <div key={item} className="mb-3 flex items-center justify-between rounded-2xl bg-[#009058] px-4 py-3">
            <span className="text-sm font-bold text-muted-foreground">{item}</span>
            <span className="font-black text-foreground">0 FC</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function generatePosTransferCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `POS-${suffix}`;
}

function maskPaymentValue(value: string) {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '—';
  if (cleaned.length <= 4) return `${cleaned.slice(0, 1)}***`;
  return `${cleaned.slice(0, 2)}***${cleaned.slice(-2)}`;
}

function printPaymentPosReceipt(transfer: PosTransfer, businessUser: BusinessUser, type: 'send' | 'payout', duplicate = false) {
  const title = type === 'send' ? 'REÇU D’ENVOI POS' : 'REÇU DE PAIEMENT POS';
  const printedAt = new Date().toLocaleString('fr-FR');
  const code = type === 'send' ? transfer.clientCode : `${transfer.clientCode.slice(0, 4)}••••`;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title><style>
  body{margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a}.ticket{width:80mm;margin:18px auto;background:#fff;border:1px solid #dbe7df;border-radius:14px;overflow:hidden}.head{padding:14px;background:#0A8B46;color:#fff;text-align:center}.brand{font-size:18px;font-weight:900}.sub{font-size:10px;opacity:.85}.body{padding:14px}h1{margin:0 0 10px;font-size:14px;color:#0A8B46;text-align:center}.dup{margin:0 auto 8px;width:fit-content;border:1px solid #f59e0b;border-radius:999px;padding:3px 8px;color:#b45309;font-size:10px;font-weight:900}.row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed #dbe7df;padding:7px 0;font-size:11px}.row span:last-child{text-align:right;font-weight:800}.code{margin:12px 0;border:2px solid #0A8B46;border-radius:12px;padding:10px;text-align:center;font-family:monospace;font-size:17px;font-weight:900;color:#0A8B46}.sign{margin-top:12px;min-height:44px;border:1px dashed #94a3b8;border-radius:10px;padding:8px;font-size:10px;color:#475569}.note{margin-top:10px;font-size:9px;line-height:1.45;color:#64748b;text-align:center}@media print{body{background:#fff}.ticket{margin:0;border-radius:0}}
  </style></head><body><section class="ticket"><div class="head"><div class="brand">eNKAMBA POS</div><div class="sub">${businessUser.businessName || 'Agence de transfert'}</div></div><div class="body"><h1>${title}</h1>${duplicate ? '<div class="dup">DUPLICATA</div>' : ''}<div class="row"><span>Référence</span><span>${transfer.internalReference}</span></div><div class="row"><span>Code</span><span>${code}</span></div><div class="row"><span>Expéditeur</span><span>${maskPaymentValue(transfer.senderName)}</span></div><div class="row"><span>Bénéficiaire</span><span>${maskPaymentValue(transfer.beneficiaryName)}</span></div><div class="row"><span>Destination</span><span>${transfer.payoutCity}</span></div><div class="row"><span>Montant</span><span>${transfer.amount.toLocaleString('fr-FR')} ${transfer.currency}</span></div>${type === 'send' ? `<div class="row"><span>Frais 3%</span><span>${transfer.fee.toLocaleString('fr-FR')} ${transfer.currency}</span></div><div class="row"><span>Total</span><span>${transfer.totalCollected.toLocaleString('fr-FR')} ${transfer.currency}</span></div>` : ''}<div class="row"><span>Statut</span><span>${transfer.status === 'paid' ? 'Payé' : 'Disponible'}</span></div><div class="row"><span>Date</span><span>${printedAt}</span></div><div class="code">${code}</div><div class="sign">${type === 'send' ? 'Signature expéditeur' : 'Signature bénéficiaire'}<br/><br/></div><p class="note">Code unique à usage unique. Toute réimpression est journalisée.</p></div></section><script>window.onload=()=>window.print()</script></body></html>`;
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

function PaymentPosTransferAgency({ businessUser, initialMode }: { businessUser: BusinessUser; initialMode: PosMode }) {
  const { toast } = useToast();
  const businessId = businessUser.businessId || businessUser.uid;
  const [mode, setMode] = useState<PosMode>(initialMode);
  const [transfers, setTransfers] = useState<PosTransfer[]>([]);
  const [cashSessionId, setCashSessionId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [cashBalance, setCashBalance] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lookupCode, setLookupCode] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<PosTransfer | null>(null);
  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    senderDocument: '',
    beneficiaryName: '',
    beneficiaryPhone: '',
    beneficiaryDocument: '',
    payoutCity: '',
    payoutOfficeCode: '',
    amount: '',
    currency: 'USD',
    reason: '',
    senderSignature: '',
    beneficiarySignature: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'business_pos_transfers'), where('businessId', '==', businessId), limit(60));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((item) => {
        const data = item.data() as any;
        return {
          id: item.id,
          internalReference: data.internalReference || `TR-${item.id.slice(0, 8).toUpperCase()}`,
          clientCode: data.clientCode || '',
          senderName: data.senderName || '',
          senderPhone: data.senderPhone || '',
          beneficiaryName: data.beneficiaryName || '',
          beneficiaryPhone: data.beneficiaryPhone || '',
          amount: Number(data.amount || 0),
          fee: Number(data.fee || 0),
          totalCollected: Number(data.totalCollected || 0),
          currency: data.currency || 'USD',
          payoutCity: data.payoutCity || '',
          payoutOfficeCode: data.payoutOfficeCode || '',
          status: (data.status || 'available') as PosTransferStatus,
          createdAtMs: data.createdAt?.toMillis?.() || Date.parse(data.createdAtIso || '') || 0,
        };
      });
      setTransfers(items.sort((a, b) => b.createdAtMs - a.createdAtMs));
    });
  }, [businessId]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const amount = Number(form.amount || 0);
  const fee = Math.round(amount * 0.03 * 100) / 100;
  const totalCollected = Math.round((amount + fee) * 100) / 100;
  const sentTotal = transfers.reduce((sum, item) => sum + item.totalCollected, 0);
  const paidTotal = transfers.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);

  const openCashSession = async () => {
    const initial = Number(openingBalance || 0);
    const ref = await addDoc(collection(db, 'business_pos_cash_sessions'), {
      businessId,
      businessName: businessUser.businessName,
      agentUid: businessUser.uid,
      openingBalance: initial,
      expectedBalance: initial,
      status: 'open',
      currency: form.currency,
      openedAt: serverTimestamp(),
      openedAtIso: new Date().toISOString(),
    });
    setCashSessionId(ref.id);
    setCashBalance(initial);
    toast({ title: 'Caisse ouverte', description: 'Les opérations POS sont actives.' });
  };

  const createTransfer = async () => {
    if (!cashSessionId) {
      toast({ variant: 'destructive', title: 'Caisse fermée', description: 'Ouvrez la caisse avant de créer un transfert.' });
      return;
    }
    if (!form.senderName || !form.senderPhone || !form.beneficiaryName || !form.beneficiaryPhone || !form.payoutCity || amount <= 0 || !form.senderSignature) {
      toast({ variant: 'destructive', title: 'Formulaire incomplet', description: 'Identités, montant, destination et signature sont obligatoires.' });
      return;
    }
    setIsSaving(true);
    try {
      const internalReference = `TRF-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
      const clientCode = generatePosTransferCode();
      const payload = {
        businessId,
        businessName: businessUser.businessName,
        businessOwnerUid: businessUser.uid,
        cashSessionId,
        internalReference,
        clientCode,
        ...form,
        amount,
        fee,
        feeRate: 0.03,
        totalCollected,
        status: 'available',
        senderSignature: { signerName: form.senderSignature, declaration: 'Je confirme l’exactitude des informations et autorise l’envoi du montant indiqué.', signedAtIso: new Date().toISOString() },
        expiresAtIso: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auditTrail: [{ action: 'transfer_created', actorUid: businessUser.uid, businessId, atIso: new Date().toISOString() }],
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };
      const created = await runTransaction(db, async (tx) => {
        const cashRef = doc(db, 'business_pos_cash_sessions', cashSessionId);
        const cashSnap = await tx.get(cashRef);
        if (!cashSnap.exists() || cashSnap.data()?.status !== 'open') throw new Error('Caisse non ouverte');
        const transferRef = doc(collection(db, 'business_pos_transfers'));
        tx.set(transferRef, payload);
        tx.update(cashRef, {
          expectedBalance: Number(cashSnap.data()?.expectedBalance || 0) + totalCollected,
          sentTotal: Number(cashSnap.data()?.sentTotal || 0) + totalCollected,
          updatedAt: serverTimestamp(),
        });
        return { id: transferRef.id, ...payload, createdAtMs: Date.now() } as PosTransfer;
      });
      setCashBalance((current) => current + totalCollected);
      setSelectedTransfer(created);
      toast({ title: 'Transfert disponible', description: `Code client: ${clientCode}` });
      printPaymentPosReceipt(created, businessUser, 'send');
      setForm((current) => ({ ...current, senderName: '', senderPhone: '', senderDocument: '', beneficiaryName: '', beneficiaryPhone: '', beneficiaryDocument: '', amount: '', reason: '', senderSignature: '' }));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Création refusée', description: error instanceof Error ? error.message : 'Impossible de créer le transfert.' });
    } finally {
      setIsSaving(false);
    }
  };

  const lookupTransfer = () => {
    const code = lookupCode.trim().toUpperCase();
    const phone = lookupPhone.replace(/\D/g, '');
    const found = transfers.find((item) => {
      const sameCode = item.clientCode.toUpperCase() === code || item.internalReference.toUpperCase() === code;
      const samePhone = !phone || item.beneficiaryPhone.replace(/\D/g, '').endsWith(phone.slice(-7));
      return sameCode && samePhone;
    });
    setSelectedTransfer(found || null);
    if (!found) toast({ variant: 'destructive', title: 'Transfert introuvable', description: 'Vérifiez le code et le téléphone bénéficiaire.' });
  };

  const payTransfer = async () => {
    if (!selectedTransfer || !cashSessionId) return;
    if (selectedTransfer.status !== 'available') {
      toast({ variant: 'destructive', title: 'Paiement impossible', description: 'Ce transfert n’est plus disponible.' });
      return;
    }
    if (!form.beneficiarySignature) {
      toast({ variant: 'destructive', title: 'Signature requise', description: 'Le bénéficiaire doit signer.' });
      return;
    }
    setIsSaving(true);
    try {
      await runTransaction(db, async (tx) => {
        const transferRef = doc(db, 'business_pos_transfers', selectedTransfer.id);
        const transferSnap = await tx.get(transferRef);
        if (!transferSnap.exists()) throw new Error('Transfert introuvable');
        const fresh = transferSnap.data() as any;
        if (fresh.status !== 'available') throw new Error('Transfert déjà payé ou bloqué');
        const cashRef = doc(db, 'business_pos_cash_sessions', cashSessionId);
        const cashSnap = await tx.get(cashRef);
        if (!cashSnap.exists() || cashSnap.data()?.status !== 'open') throw new Error('Caisse non ouverte');
        const currentCash = Number(cashSnap.data()?.expectedBalance || 0);
        if (currentCash < Number(fresh.amount || 0)) throw new Error('Liquidité caisse insuffisante');
        tx.update(transferRef, {
          status: 'paid',
          paidAt: serverTimestamp(),
          paidAtIso: new Date().toISOString(),
          paidByUid: businessUser.uid,
          beneficiarySignature: { signerName: form.beneficiarySignature, declaration: 'Je confirme avoir reçu intégralement le montant indiqué.', signedAtIso: new Date().toISOString() },
          auditTrail: arrayUnion({ action: 'transfer_paid', actorUid: businessUser.uid, businessId, atIso: new Date().toISOString() }),
          updatedAt: serverTimestamp(),
        });
        tx.update(cashRef, {
          expectedBalance: currentCash - Number(fresh.amount || 0),
          payoutTotal: Number(cashSnap.data()?.payoutTotal || 0) + Number(fresh.amount || 0),
          updatedAt: serverTimestamp(),
        });
      });
      const paid = { ...selectedTransfer, status: 'paid' as PosTransferStatus };
      setSelectedTransfer(paid);
      setCashBalance((current) => current - selectedTransfer.amount);
      setForm((current) => ({ ...current, beneficiarySignature: '' }));
      toast({ title: 'Paiement confirmé', description: 'Le transfert est marqué payé.' });
      printPaymentPosReceipt(paid, businessUser, 'payout');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Paiement refusé', description: error instanceof Error ? error.message : 'Impossible de payer ce transfert.' });
    } finally {
      setIsSaving(false);
    }
  };

  const closeCashSession = async () => {
    if (!cashSessionId) return;
    await updateDoc(doc(db, 'business_pos_cash_sessions', cashSessionId), { status: 'closed', closedAt: serverTimestamp(), closedAtIso: new Date().toISOString(), closingBalance: cashBalance });
    setCashSessionId('');
    toast({ title: 'Caisse clôturée', description: 'Session POS fermée.' });
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <PaymentMetricCard stat={{ label: 'Caisse POS', value: cashSessionId ? `${cashBalance.toLocaleString('fr-FR')} ${form.currency}` : 'Fermée', icon: WalletNavIcon, color: 'green' }} />
        <PaymentMetricCard stat={{ label: 'Envoyés', value: `${sentTotal.toLocaleString('fr-FR')} ${form.currency}`, icon: CreditIcon, color: 'orange' }} />
        <PaymentMetricCard stat={{ label: 'Payés', value: `${paidTotal.toLocaleString('fr-FR')} ${form.currency}`, icon: PaymentNavIcon, color: 'emerald' }} />
        <PaymentMetricCard stat={{ label: 'Disponibles', value: String(transfers.filter((item) => item.status === 'available').length), icon: SecurityIcon, color: 'orange' }} />
      </div>

      <section className="rounded-3xl border border-[#009058] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {([
            ['send', 'Envoyer'],
            ['payout', 'Payer'],
            ['cash', 'Caisse'],
            ['history', 'Historique'],
          ] as Array<[PosMode, string]>).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={`h-10 rounded-2xl text-xs font-black ${mode === id ? 'bg-[#009058] text-white' : 'bg-primary/5 text-muted-foreground'}`}>{label}</button>
          ))}
        </div>
      </section>

      {mode === 'cash' && (
        <Panel title="Caisse agence" subtitle="Une caisse ouverte est obligatoire pour encaisser ou payer.">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} disabled={Boolean(cashSessionId)} inputMode="decimal" className="h-12 rounded-2xl border border-[#009058] px-4 text-sm font-bold outline-none" placeholder="Solde initial" />
            {cashSessionId ? <button onClick={closeCashSession} className="h-12 rounded-2xl bg-red-50 px-5 text-sm font-black text-red-700">Clôturer</button> : <button onClick={openCashSession} className="h-12 rounded-2xl bg-[#009058] px-5 text-sm font-black text-white">Ouvrir caisse</button>}
          </div>
        </Panel>
      )}

      {mode === 'send' && (
        <Panel title="Nouveau transfert POS" subtitle="Frais automatiques à 3 %, code sécurisé et reçu POS imprimable.">
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentPosInput label="Expéditeur" value={form.senderName} onChange={(v) => setForm({ ...form, senderName: v })} />
            <PaymentPosInput label="Téléphone expéditeur" value={form.senderPhone} onChange={(v) => setForm({ ...form, senderPhone: v })} />
            <PaymentPosInput label="Pièce expéditeur" value={form.senderDocument} onChange={(v) => setForm({ ...form, senderDocument: v })} />
            <PaymentPosInput label="Bénéficiaire" value={form.beneficiaryName} onChange={(v) => setForm({ ...form, beneficiaryName: v })} />
            <PaymentPosInput label="Téléphone bénéficiaire" value={form.beneficiaryPhone} onChange={(v) => setForm({ ...form, beneficiaryPhone: v })} />
            <PaymentPosInput label="Pièce bénéficiaire" value={form.beneficiaryDocument} onChange={(v) => setForm({ ...form, beneficiaryDocument: v })} />
            <PaymentPosInput label="Ville de paiement" value={form.payoutCity} onChange={(v) => setForm({ ...form, payoutCity: v })} />
            <PaymentPosInput label="Bureau payeur" value={form.payoutOfficeCode} onChange={(v) => setForm({ ...form, payoutOfficeCode: v })} />
            <PaymentPosInput label="Montant" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} inputMode="decimal" />
            <select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="h-11 rounded-2xl border border-[#009058] bg-white px-3 text-sm font-bold">{['USD', 'CDF', 'EUR', 'RMB'].map((currency) => <option key={currency}>{currency}</option>)}</select>
            <PaymentPosInput label="Motif" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} />
            <PaymentPosInput label="Signature expéditeur" value={form.senderSignature} onChange={(v) => setForm({ ...form, senderSignature: v })} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-primary/5 p-4 text-center">
            <div><p className="text-xs font-bold text-muted-foreground">Montant</p><p className="font-black">{amount.toLocaleString('fr-FR')}</p></div>
            <div><p className="text-xs font-bold text-muted-foreground">Frais 3%</p><p className="font-black text-[#FFA500]">{fee.toLocaleString('fr-FR')}</p></div>
            <div><p className="text-xs font-bold text-muted-foreground">Total</p><p className="font-black text-[#009058]">{totalCollected.toLocaleString('fr-FR')}</p></div>
          </div>
          <button disabled={isSaving} onClick={createTransfer} className="mt-4 h-12 w-full rounded-2xl bg-[#009058] text-sm font-black text-white disabled:opacity-60">{isSaving ? 'Traitement...' : 'Confirmer et imprimer'}</button>
        </Panel>
      )}

      {mode === 'payout' && (
        <Panel title="Paiement bénéficiaire" subtitle="Recherche par code sécurisé et téléphone bénéficiaire.">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} className="h-12 rounded-2xl border border-[#009058] px-4 text-sm font-bold uppercase outline-none" placeholder="Code transfert" />
            <input value={lookupPhone} onChange={(event) => setLookupPhone(event.target.value)} className="h-12 rounded-2xl border border-[#009058] px-4 text-sm font-bold outline-none" placeholder="Téléphone bénéficiaire" />
            <button onClick={lookupTransfer} className="h-12 rounded-2xl bg-[#009058] px-5 text-sm font-black text-white">Rechercher</button>
          </div>
          {selectedTransfer && (
            <div className="mt-4 rounded-2xl bg-primary/5 p-4">
              <p className="text-xs font-black uppercase text-[#009058]">{selectedTransfer.internalReference}</p>
              <h3 className="mt-1 text-xl font-black">{selectedTransfer.amount.toLocaleString('fr-FR')} {selectedTransfer.currency}</h3>
              <p className="text-sm font-semibold text-muted-foreground">{maskPaymentValue(selectedTransfer.senderName)} → {selectedTransfer.beneficiaryName}</p>
              {selectedTransfer.status === 'available' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input value={form.beneficiarySignature} onChange={(event) => setForm({ ...form, beneficiarySignature: event.target.value })} className="h-12 rounded-2xl border border-[#009058] bg-white px-4 text-sm font-bold outline-none" placeholder="Signature bénéficiaire" />
                  <button disabled={isSaving} onClick={payTransfer} className="h-12 rounded-2xl bg-[#009058] px-5 text-sm font-black text-white disabled:opacity-60">Payer et imprimer</button>
                </div>
              )}
              <button type="button" onClick={() => printPaymentPosReceipt(selectedTransfer, businessUser, selectedTransfer.status === 'paid' ? 'payout' : 'send', true)} className="mt-3 text-xs font-black text-[#009058]">Réimprimer duplicata</button>
            </div>
          )}
        </Panel>
      )}

      {mode === 'history' && (
        <Panel title="Historique POS" subtitle="Transferts, paiements et statuts de l’agence.">
          <div className="space-y-2">{transfers.length === 0 ? <EmptyPaymentState icon={BusinessDashboardIcons.BarChart} text="Aucun transfert POS" /> : transfers.slice(0, 20).map((item) => (<button key={item.id} onClick={() => setSelectedTransfer(item)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary/5 p-3 text-left"><span><span className="block text-sm font-black">{item.internalReference}</span><span className="text-xs font-semibold text-muted-foreground">{maskPaymentValue(item.senderName)} → {item.beneficiaryName}</span></span><span className="text-right text-sm font-black text-[#009058]">{item.amount.toLocaleString('fr-FR')} {item.currency}<span className="block text-xs text-muted-foreground">{item.status}</span></span></button>))}</div>
        </Panel>
      )}
    </section>
  );
}

function PaymentPosInput({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-black text-muted-foreground">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} className="h-11 w-full rounded-2xl border border-[#009058] bg-white px-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10" />
    </label>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#009058] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action && (
          <button className="rounded-2xl bg-[#009058] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#009058]">
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ApiCredential({ label, value, sensitive = false }: { label: string; value: string; sensitive?: boolean }) {
  return (
    <div className="mb-3 rounded-2xl border border-[#009058] bg-[#009058] p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white p-3 text-sm font-bold text-foreground">
          {sensitive ? value.replace(/x/g, '•') : value}
        </code>
        <button className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#009058] ring-1 ring-[#009058]">Copier</button>
      </div>
    </div>
  );
}

function PaymentMetricCard({ stat }: { stat: { label: string; value: string; icon: React.ComponentType<any>; color: string } }) {
  const Icon = stat.icon;
  const colorClasses = {
    green: 'bg-[#009058] text-[#009058] border-[#009058]',
    blue: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    emerald: 'bg-[#009058] text-[#009058] border-[#009058]',
    orange: 'bg-[#fff7ed] text-[#FFA500] border-[#fed7aa]',
  };
  const className = colorClasses[stat.color as keyof typeof colorClasses] || colorClasses.green;

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold opacity-75">{stat.label}</p>
          <p className="mt-2 text-2xl font-black">{stat.value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
          <Icon className="h-6 w-6 opacity-80" size={28} />
        </div>
      </div>
    </div>
  );
}

function PaymentPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/18 bg-white/14 p-3 text-center backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyPaymentState({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#009058] bg-[#009058] px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
        <Icon className="h-12 w-12 text-[#009058]" size={48} />
      </div>
      <p className="font-black text-foreground">{text}</p>
    </div>
  );
}
