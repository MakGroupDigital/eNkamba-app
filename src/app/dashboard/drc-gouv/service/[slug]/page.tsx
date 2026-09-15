'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Download, ExternalLink, FileCheck2, Info, Menu, Printer, Save, Trash2 } from 'lucide-react';
import { DrcCustomsIcon, DrcDgiIcon, DrcProvinceIcon, DrcRevenueIcon, DrcTaxFileIcon, DrcTaxHistoryIcon, DrcTaxIdIcon, DrcTaxPaymentIcon, DrcTradeIcon } from '@/components/icons/service-icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type ServiceKey = 'nif' | 'customs' | 'invoice' | 'revenue' | 'claims';
type FieldDef = { key: string; label: string; type?: 'text' | 'date' | 'email' | 'tel' | 'number' | 'textarea' | 'select'; options?: string[]; required?: boolean; wide?: boolean; placeholder?: string };
type Draft = { values: Record<string, string | boolean>; savedAt: string };

const SERVICES: Record<ServiceKey, { title: string; subtitle: string; Icon: typeof DrcDgiIcon; officialUrl: string; officialLabel: string; note: string }> = {
  nif: { title: 'Préparer un dossier NIF', subtitle: 'Identifiez le contribuable et rassemblez les éléments demandés avant la démarche officielle.', Icon: DrcTaxIdIcon, officialUrl: 'https://e-nif.dgirdc.cd/', officialLabel: 'Ouvrir e-NIF DGI', note: 'Ce formulaire Kenz est un aide-mémoire local. La demande, l’attribution et le certificat NIF sont exclusivement gérés par la DGI.' },
  customs: { title: 'Préparer un dossier douanier', subtitle: 'Organisez les renseignements et pièces utiles à la déclaration de marchandises.', Icon: DrcCustomsIcon, officialUrl: 'https://sydonia.douane.gouv.cd/', officialLabel: 'Ouvrir SYDONIAWorld', note: 'Cette préparation ne constitue pas un DAU et ne dépose aucune déclaration. Le dépôt officiel se fait dans SYDONIAWorld par le propriétaire/destinataire ou un commissionnaire agréé.' },
  invoice: { title: 'Facture normalisée', subtitle: 'Vérifiez un document DGI ou identifiez le dispositif homologué nécessaire à son émission.', Icon: DrcRevenueIcon, officialUrl: 'https://dgi.gouv.cd/verifier-un-document-authentification-qr-n/', officialLabel: 'Ouvrir l’authentificateur DGI', note: 'Kenz ne peut pas émettre une facture normalisée : elle doit être produite par un DEF raccordé à la DGI ou un SFE homologué. La vérification d’authenticité est faite par le service officiel.' },
  revenue: { title: 'Suivre une recette non fiscale', subtitle: 'Consignez les informations de la note officielle et retrouvez les étapes du recouvrement.', Icon: DrcRevenueIcon, officialUrl: 'https://logirad.dgrad.cd/registre-note-perception', officialLabel: 'Ouvrir LOGIRAD DGRAD', note: 'Une note de perception officielle est émise par l’ordonnateur compétent après contrôle. Le paiement se fait au compte du receveur du Trésor et donne lieu à un acquit libératoire; Kenz ne prélève pas ces fonds.' },
  claims: { title: 'Reçus et réclamations', subtitle: 'Vérifiez un document DGI ou préparez une réclamation écrite relative à une recette non fiscale.', Icon: DrcTaxHistoryIcon, officialUrl: 'https://dgi.gouv.cd/verifier-un-document-authentification-qr-n/', officialLabel: 'Vérifier un document DGI', note: 'Le brouillon de réclamation reste sur cet appareil. Il n’est pas transmis à la DGRAD; imprimez-le, signez-le et déposez-le auprès de l’autorité compétente avec les pièces requises.' },
};

type NavigationItem = { label: string; detail: string; href: string; Icon: typeof DrcDgiIcon; external?: boolean };
const serviceNavigation: Record<ServiceKey, NavigationItem[]> = {
  nif: [
    { label: 'Déclaration fiscale', detail: 'Préparer et suivre un dossier DGI', href: '/dashboard/tax-declaration', Icon: DrcTaxPaymentIcon },
    { label: 'Dossier douanier', detail: 'Préparer une importation ou exportation', href: '/dashboard/drc-gouv/service/customs', Icon: DrcTradeIcon },
    { label: 'Portail e-NIF', detail: 'Poursuivre la démarche officielle', href: SERVICES.nif.officialUrl, Icon: DrcDgiIcon, external: true },
  ],
  customs: [
    { label: 'Dossier NIF', detail: 'Préparer les informations du contribuable', href: '/dashboard/drc-gouv/service/nif', Icon: DrcTaxIdIcon },
    { label: 'Recettes non fiscales', detail: 'Suivre une note de perception', href: '/dashboard/drc-gouv/service/revenue', Icon: DrcRevenueIcon },
    { label: 'SYDONIAWorld', detail: 'Déclaration douanière officielle', href: SERVICES.customs.officialUrl, Icon: DrcCustomsIcon, external: true },
  ],
  invoice: [
    { label: 'Déclaration fiscale', detail: 'Ouvrir le parcours DGI', href: '/dashboard/tax-declaration', Icon: DrcTaxPaymentIcon },
    { label: 'Dossier douanier', detail: 'Importer ou exporter des marchandises', href: '/dashboard/drc-gouv/service/customs', Icon: DrcTradeIcon },
    { label: 'Vérificateur DGI', detail: 'Authentifier un document officiel', href: SERVICES.invoice.officialUrl, Icon: DrcTaxHistoryIcon, external: true },
  ],
  revenue: [
    { label: 'Réclamation DGRAD', detail: 'Préparer un recours écrit', href: '/dashboard/drc-gouv/service/claims', Icon: DrcTaxFileIcon },
    { label: 'Déclaration fiscale', detail: 'Accéder au parcours DGI', href: '/dashboard/tax-declaration', Icon: DrcTaxPaymentIcon },
    { label: 'LOGIRAD', detail: 'Registre officiel des notes', href: SERVICES.revenue.officialUrl, Icon: DrcRevenueIcon, external: true },
  ],
  claims: [
    { label: 'Recettes non fiscales', detail: 'Suivre une note DGRAD', href: '/dashboard/drc-gouv/service/revenue', Icon: DrcRevenueIcon },
    { label: 'Déclaration fiscale', detail: 'Accéder au parcours DGI', href: '/dashboard/tax-declaration', Icon: DrcTaxPaymentIcon },
    { label: 'Vérificateur DGI', detail: 'Authentifier un document officiel', href: SERVICES.claims.officialUrl, Icon: DrcTaxHistoryIcon, external: true },
  ],
};

const nifPersonFields: FieldDef[] = [
  { key: 'lastName', label: 'Nom', required: true }, { key: 'postName', label: 'Postnom', required: true }, { key: 'firstName', label: 'Prénom', required: true },
  { key: 'birthDate', label: 'Date de naissance', type: 'date', required: true }, { key: 'birthPlace', label: 'Lieu de naissance', required: true }, { key: 'nationality', label: 'Nationalité', required: true },
  { key: 'idType', label: 'Type de pièce', type: 'select', options: ['Carte d’électeur', 'Passeport', 'Permis de conduire', 'Autre'], required: true }, { key: 'idNumber', label: 'Numéro de pièce', required: true },
  { key: 'idIssuePlace', label: 'Lieu de délivrance', required: true }, { key: 'idIssueDate', label: 'Date de délivrance', type: 'date', required: true },
  { key: 'email', label: 'E-mail', type: 'email' }, { key: 'phone', label: 'Téléphone', type: 'tel', required: true }, { key: 'province', label: 'Province', type: 'select', options: ['Kinshasa','Kongo-Central','Kwango','Kwilu','Mai-Ndombe','Équateur','Mongala','Nord-Ubangi','Sud-Ubangi','Tshuapa','Tshopo','Bas-Uele','Haut-Uele','Ituri','Nord-Kivu','Sud-Kivu','Maniema','Sankuru','Kasaï','Kasaï-Central','Kasaï-Oriental','Lomami','Haut-Lomami','Lualaba','Haut-Katanga','Tanganyika'], required: true },
  { key: 'city', label: 'Ville / territoire', required: true }, { key: 'address', label: 'Adresse complète', wide: true, required: true }, { key: 'activity', label: 'Activité principale', wide: true, required: true },
];
const nifCompanyFields: FieldDef[] = [
  { key: 'legalName', label: 'Raison sociale', required: true }, { key: 'legalForm', label: 'Forme juridique', type: 'select', options: ['Établissement','SARL','SA','SAS','SNC','Association / ASBL','Autre'], required: true },
  { key: 'rccm', label: 'RCCM', required: true }, { key: 'nationalId', label: 'Identification nationale', required: true }, { key: 'representative', label: 'Représentant légal', required: true },
  { key: 'representativeId', label: 'Pièce d’identité du représentant', required: true }, { key: 'email', label: 'E-mail', type: 'email' }, { key: 'phone', label: 'Téléphone', type: 'tel', required: true },
  { key: 'province', label: 'Province du siège', type: 'select', options: nifPersonFields.find(f => f.key === 'province')?.options, required: true }, { key: 'city', label: 'Ville / territoire', required: true },
  { key: 'address', label: 'Adresse du siège', wide: true, required: true }, { key: 'activity', label: 'Activité principale', wide: true, required: true },
];
const customsFields: FieldDef[] = [
  { key: 'movement', label: 'Opération', type: 'select', options: ['Importation','Exportation','Transit'], required: true }, { key: 'declarant', label: 'Déclarant', type: 'select', options: ['Propriétaire / destinataire','Commissionnaire en douane agréé'], required: true },
  { key: 'fullName', label: 'Importateur / exportateur', required: true }, { key: 'nif', label: 'NIF', required: true }, { key: 'phone', label: 'Téléphone', type: 'tel' },
  { key: 'office', label: 'Bureau de douane détenteur', required: true }, { key: 'arrivalDate', label: 'Date d’arrivée / présentation', type: 'date', required: true },
  { key: 'transport', label: 'Mode de transport', type: 'select', options: ['Maritime','Aérien','Routier','Ferroviaire'], required: true }, { key: 'transportRef', label: 'B/L, AWB ou lettre de voiture', required: true },
  { key: 'regime', label: 'Régime douanier demandé', type: 'select', options: ['Mise à la consommation','Transit','Admission temporaire','Entrepôt','Exportation','À confirmer avec le déclarant'], required: true },
  { key: 'goods', label: 'Désignation détaillée des marchandises', type: 'textarea', wide: true, required: true }, { key: 'hsCode', label: 'Espèce tarifaire (SH, 8 chiffres)', placeholder: 'Laisser vide si non confirmé' },
  { key: 'origin', label: 'Pays d’origine', required: true }, { key: 'provenance', label: 'Pays de provenance / expédition', required: true },
  { key: 'quantity', label: 'Quantité et unité', required: true }, { key: 'packages', label: 'Nombre et type de colis', required: true }, { key: 'grossWeight', label: 'Poids brut (kg)', type: 'number', required: true },
  { key: 'invoiceValue', label: 'Valeur facture et devise', required: true }, { key: 'freight', label: 'Fret', required: true }, { key: 'insurance', label: 'Assurance', required: true },
];
const revenueFields: FieldDef[] = [
  { key: 'noteNumber', label: 'N° de note de perception', required: true }, { key: 'debtor', label: 'Nom de l’assujetti', required: true },
  { key: 'service', label: 'Service d’assiette / ministère', required: true }, { key: 'province', label: 'Province', type: 'select', options: nifPersonFields.find(f => f.key === 'province')?.options, required: true },
  { key: 'revenueType', label: 'Nature de la recette', required: true }, { key: 'amount', label: 'Montant dû', type: 'number', required: true },
  { key: 'currency', label: 'Devise', type: 'select', options: ['CDF','USD'], required: true }, { key: 'issuedAt', label: 'Date d’émission', type: 'date', required: true },
  { key: 'dueAt', label: 'Échéance mentionnée sur la note', type: 'date' }, { key: 'bank', label: 'Banque / compte du receveur (selon la note)', wide: true },
  { key: 'paymentReference', label: 'Référence de paiement / acquit', wide: true },
];
const claimFields: FieldDef[] = [
  { key: 'claimant', label: 'Nom du réclamant / société', required: true }, { key: 'representative', label: 'Mandataire (si applicable)' },
  { key: 'noteNumber', label: 'Référence de la note / extrait de rôle', required: true }, { key: 'receivedAt', label: 'Date de réception du titre', type: 'date', required: true },
  { key: 'province', label: 'Province / ressort concerné', type: 'select', options: nifPersonFields.find(f => f.key === 'province')?.options, required: true },
  { key: 'taxationPlace', label: 'Lieu de taxation', required: true }, { key: 'revenueType', label: 'Nature du droit, taxe ou redevance', required: true },
  { key: 'amount', label: 'Montant contesté (CDF)', type: 'number', required: true }, { key: 'uncontestedAmount', label: 'Montant non contesté déjà payé (CDF)', type: 'number' },
  { key: 'grounds', label: 'Motifs précis de la réclamation', type: 'textarea', wide: true, required: true }, { key: 'conclusions', label: 'Correction ou décision demandée', type: 'textarea', wide: true, required: true },
  { key: 'signatureName', label: 'Nom à porter sous la signature', required: true },
];
const fieldSets: Record<ServiceKey, FieldDef[]> = { nif: nifPersonFields, customs: customsFields, invoice: [], revenue: revenueFields, claims: claimFields };
const fieldTitle: Record<ServiceKey, string> = { nif: 'Informations du demandeur', customs: 'Identification et transport', invoice: 'Vérification', revenue: 'Détails du titre officiel', claims: 'Éléments obligatoires de la réclamation' };

function getEntryUrl(key: string, uid: string) { return `kenz:drc:${uid}:${key}`; }
function Field({ field, value, onChange }: { field: FieldDef; value: string; onChange: (value: string) => void }) {
  const common = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172a4c] outline-none focus:border-[#073B9A] focus:ring-2 focus:ring-[#073B9A]/10';
  return <label className={'grid gap-1.5 text-sm font-bold ' + (field.wide ? 'sm:col-span-2' : '')}>{field.label}{field.type === 'textarea' ? <textarea required={field.required} value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder={field.placeholder} className={common}/> : field.type === 'select' ? <select required={field.required} value={value} onChange={e => onChange(e.target.value)} className={common}><option value="">Choisir</option>{field.options?.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input required={field.required} type={field.type || 'text'} min={field.type === 'number' ? '0' : undefined} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} className={common}/>}</label>;
}

function printKenzForm(title: string, values: Record<string, string | boolean>) {
  const safe = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
  const rows = Object.entries(values).filter(([, value]) => value !== '' && value !== false).map(([label, value]) => `<tr><th>${safe(label)}</th><td>${safe(value === true ? 'Oui' : value)}</td></tr>`).join('');
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>${safe(title)}</title><style>body{font:15px Arial;color:#172a4c;max-width:800px;margin:32px auto;padding:0 24px}header{border-bottom:4px solid #f51b2b}h1{color:#073b9a}table{border-collapse:collapse;width:100%;margin:24px 0}th,td{text-align:left;border-bottom:1px solid #dce3ee;padding:10px}th{width:35%;color:#4b5d7a}.warn{padding:14px;background:#fff4e5;color:#704900}@media print{button{display:none}}</style><header><h1>KENZ · DRC GOUV</h1><strong>${safe(title)} · DOCUMENT DE PRÉPARATION</strong></header><table>${rows}</table><p class="warn">Document préparatoire Kenz, non soumis et non émis par l’administration. Il ne remplace aucun formulaire officiel, titre, facture normalisée, déclaration en douane ou reçu.</p><button onclick="print()">Imprimer / Enregistrer en PDF</button></html>`);
  win.document.close();
  return true;
}

export default function DrcGovernmentServicePage() {
  const params = useParams<{ slug: string }>();
  const routeSlug = params?.slug;
  const slug = routeSlug && routeSlug in SERVICES ? routeSlug as ServiceKey : undefined;
  const storageKey = slug ?? 'nif';
  const service = slug ? SERVICES[slug] : undefined;
  const navigationItems = slug ? serviceNavigation[slug] : [];
  const { user } = useAuth();
  const { toast } = useToast();
  const [personType, setPersonType] = useState<'physical' | 'legal'>('physical');
  const [values, setValues] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, boolean>>({});
  const [savedAt, setSavedAt] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [invoiceTab, setInvoiceTab] = useState<'verify' | 'emit'>('verify');
  const [localRecord, setLocalRecord] = useState<Record<string, string> | null>(null);
  const fields = useMemo(() => slug === 'nif' ? (personType === 'physical' ? nifPersonFields : nifCompanyFields) : slug ? fieldSets[slug] || [] : [], [personType, slug]);

  useEffect(() => {
    if (!user?.uid || !service) return;
    try {
      const raw = localStorage.getItem(getEntryUrl(storageKey, user.uid));
      if (raw) { const parsed = JSON.parse(raw) as Draft; setValues(parsed.values as Record<string, string>); setSavedAt(parsed.savedAt); }
      const record = localStorage.getItem(getEntryUrl(`${storageKey}:record`, user.uid));
      if (record) setLocalRecord(JSON.parse(record));
    } catch { /* Ignore unreadable local drafts. */ }
  }, [service, slug, storageKey, user?.uid]);

  if (!service) return <main className="min-h-screen bg-[#f6f8fc] p-8 text-center"><h1 className="text-2xl font-bold">Service introuvable</h1><Link className="mt-4 inline-block text-[#073B9A]" href="/dashboard/drc-gouv">Retour à DRC Gouv</Link></main>;

  const update = (key: string, value: string) => setValues(previous => ({ ...previous, [key]: value }));
  const saveLocal = () => {
    if (!user?.uid) { toast({ variant: 'destructive', title: 'Connexion requise', description: 'Connectez-vous pour garder un brouillon local associé à cette session.' }); return; }
    const now = new Date().toISOString();
    try {
      localStorage.setItem(getEntryUrl(storageKey, user.uid), JSON.stringify({ values, savedAt: now } satisfies Draft));
      setSavedAt(now);
      toast({ title: 'Brouillon enregistré sur cet appareil', description: 'Il n’a pas été envoyé à l’administration ni stocké dans le cloud.' });
    } catch {
      toast({ variant: 'destructive', title: 'Enregistrement impossible', description: 'Le stockage local du navigateur est indisponible ou saturé.' });
    }
  };
  const clearLocal = () => {
    if (!user?.uid) return;
    try {
      localStorage.removeItem(getEntryUrl(storageKey, user.uid)); localStorage.removeItem(getEntryUrl(`${storageKey}:record`, user.uid));
      setValues({}); setSavedAt(''); setLocalRecord(null);
      toast({ title: 'Brouillon supprimé de cet appareil' });
    } catch { toast({ variant: 'destructive', title: 'Suppression impossible', description: 'Le stockage local du navigateur est indisponible.' }); }
  };
  const onSubmit = (event: FormEvent) => { event.preventDefault(); saveLocal(); };
  const print = (extra: Record<string, string | boolean> = {}) => {
    const result = printKenzForm(service.title, { ...values, ...documents, ...extra });
    if (!result) toast({ variant: 'destructive', title: 'Fenêtre bloquée', description: 'Autorisez la fenêtre d’impression pour créer la fiche PDF.' });
  };
  const openOfficial = () => window.open(service.officialUrl, '_blank', 'noopener,noreferrer');
  const openCodeVerifier = async () => {
    if (!verifyCode.trim()) { toast({ variant: 'destructive', title: 'Référence requise', description: 'Saisissez le code UID de la facture ou du document.' }); return; }
    try { await navigator.clipboard.writeText(verifyCode.trim()); } catch { /* Clipboard is optional. */ }
    openOfficial();
    toast({ title: 'Authentificateur DGI ouvert', description: 'Le code a été copié si le navigateur autorise le presse-papiers. Collez-le dans le formulaire officiel.' });
  };
  const fileSet = slug === 'customs' ? ['Facture commerciale', 'Liste de colisage', 'Titre de transport (B/L, AWB ou LVI)', 'Certificat d’origine (si applicable)', 'Permis / autorisation sectorielle (si applicable)', 'Preuve de valeur / contrat de vente (si demandé)'] : slug === 'nif' ? (personType === 'physical' ? ['Pièce d’identité valide', 'Justificatif d’adresse', 'Éléments sur l’activité'] : ['RCCM ou agrément', 'Statuts / acte constitutif', 'Identification nationale', 'Pièce du représentant légal', 'Justificatif du siège']) : slug === 'claims' ? ['Copie de la note de perception / extrait de rôle', 'Preuve de paiement de la partie non contestée', 'Pièces étayant les motifs', 'Mandat signé si représentation'] : [];

  return <main className="min-h-screen bg-[#f6f8fc] px-4 pb-28 pt-5 text-[#122448] sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div className="mb-4 flex items-center gap-3">
      <Sheet>
        <SheetTrigger asChild><button type="button" aria-label="Ouvrir la navigation DRC Gouv" title="Navigation DRC Gouv" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#073B9A]/10 bg-white text-[#073B9A] shadow-sm transition hover:bg-[#edf3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#073B9A]"><Menu size={21}/></button></SheetTrigger>
        <SheetContent side="left" className="w-[min(86vw,360px)] border-r border-[#073B9A]/10 bg-[#f7f9ff] p-0 text-[#122448]">
          <SheetHeader className="border-b border-[#073B9A]/10 bg-white px-5 py-6 pr-14 text-left">
            <SheetTitle className="flex items-center gap-3 text-left"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf3ff]"><DrcProvinceIcon size={30}/></span><span>DRC Gouv<span className="mt-0.5 block text-xs font-semibold text-slate-500">Services publics · Kenz</span></span></SheetTitle>
            <SheetDescription className="sr-only">Accès au portail et aux démarches administratives associées.</SheetDescription>
          </SheetHeader>
          <nav className="space-y-2 p-4" aria-label="Navigation des services DRC Gouv">
            <SheetClose asChild><Link href="/dashboard/drc-gouv" className="mb-4 flex items-center gap-3 rounded-xl bg-[#073B9A] px-4 py-3.5 text-sm font-extrabold text-white shadow-sm"><DrcProvinceIcon size={24}/><span>Accueil du portail<small className="mt-0.5 block text-xs font-medium text-white/75">Tous les services publics</small></span><ArrowRight className="ml-auto" size={17}/></Link></SheetClose>
            <p className="px-2 pb-1 pt-2 text-[10px] font-black tracking-[.16em] text-[#073B9A]">ACCÈS LIÉS À CE SERVICE</p>
            {navigationItems.map(item => {
              const content = <><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#edf3ff]"><item.Icon size={27}/></span><span className="min-w-0 flex-1"><strong className="block text-sm">{item.label}</strong><small className="mt-0.5 block text-xs text-slate-500">{item.detail}</small></span>{item.external && <ExternalLink size={15} className="shrink-0 text-[#073B9A]"/>}</>;
              return item.external ? <SheetClose asChild key={item.label}><a href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white">{content}</a></SheetClose> : <SheetClose asChild key={item.label}><Link href={item.href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white">{content}</Link></SheetClose>;
            })}
          </nav>
          <div className="absolute inset-x-4 bottom-5 rounded-xl border border-[#073B9A]/10 bg-white p-3 text-xs text-slate-500"><span className="font-bold text-[#073B9A]">Service ouvert</span><span className="mt-1 block">{service.title}</span></div>
        </SheetContent>
      </Sheet>
      <div className="min-w-0"><span className="block text-[10px] font-black tracking-[.16em] text-[#073B9A]">DRC GOUV</span><span className="block truncate text-sm font-bold text-slate-700">{service.title}</span></div>
    </div>
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#073B9A]/10 sm:p-7"><div className="flex min-w-0 items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#edf3ff]"><service.Icon size={36}/></span><div><span className="text-[11px] font-black tracking-[.16em] text-[#073B9A]">KENZ · DRC GOUV</span><h1 className="mt-1 text-2xl font-black sm:text-3xl">{service.title}</h1><p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">{service.subtitle}</p></div></div><a href={service.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-4 py-3 text-sm font-extrabold text-white">{service.officialLabel}<ArrowUpRight size={17}/></a></header>
    <section className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-950"><Info size={21} className="mt-0.5 shrink-0"/><div><strong>Parcours officiel</strong><p className="mt-1">{service.note}</p></div></section>

    {slug === 'invoice' && <><section className="mt-4 flex gap-2 rounded-xl bg-white p-2 shadow-sm">{(['verify','emit'] as const).map(tab => <button key={tab} onClick={() => setInvoiceTab(tab)} className={'rounded-lg px-4 py-2.5 text-sm font-bold ' + (invoiceTab === tab ? 'bg-[#073B9A] text-white' : 'text-slate-600')}>{tab === 'verify' ? 'Vérifier un document' : 'Préparer l’émission'}</button>)}</section>{invoiceTab === 'verify' ? <section className="mt-3 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><DrcTaxHistoryIcon size={34}/><div><h2 className="font-black">Authentifier par référence</h2><p className="text-sm text-slate-500">Le résultat vient uniquement de la base officielle DGI.</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void openCodeVerifier(); }} placeholder="UID / numéro officiel du document" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 outline-[#073B9A]"/><button onClick={() => void openCodeVerifier()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#073B9A] px-5 py-3 text-sm font-extrabold text-white">Vérifier sur DGI <ExternalLink size={16}/></button></div></section> : <section className="mt-3 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="font-black">Émission conforme</h2><p className="mt-2 text-sm leading-6 text-slate-600">L’émission fiscale requiert un DEF raccordé à la DGI ou un SFE figurant sur la liste homologuée. Un PDF créé par Kenz ne serait pas une facture normalisée.</p><a href="https://dgi.gouv.cd/reforme-de-la-facture-normalisee/" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#073B9A]/15 px-4 py-3 text-sm font-bold text-[#073B9A]">Voir la réforme et les fournisseurs DGI <ExternalLink size={16}/></a></section>}</>}

    {fields.length > 0 && slug && <form onSubmit={onSubmit} className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">{fieldTitle[slug]}</h2>{savedAt && <p className="mt-1 text-xs text-slate-500">Brouillon local enregistré le {new Date(savedAt).toLocaleString('fr-FR')}</p>}</div>{slug === 'nif' && <div className="flex rounded-xl bg-[#f0f4fb] p-1">{(['physical','legal'] as const).map(type => <button type="button" key={type} onClick={() => { setPersonType(type); setValues({}); }} className={'rounded-lg px-3 py-2 text-xs font-extrabold ' + (personType === type ? 'bg-white text-[#073B9A] shadow-sm' : 'text-slate-500')}>{type === 'physical' ? 'Personne physique' : 'Personne morale'}</button>)}</div>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(field => <Field key={field.key} field={field} value={values[field.key] as string || ''} onChange={value => update(field.key, value)}/>)}</div>
      {fileSet.length > 0 && slug !== 'customs' && <fieldset className="mt-5 rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-black">Pièces à réunir · cochez après vérification</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{fileSet.map(name => <label key={name} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={!!documents[name]} onChange={e => setDocuments(old => ({ ...old, [name]: e.target.checked }))} className="mt-0.5 accent-[#073B9A]"/><span>{name}</span></label>)}</div></fieldset>}
      {slug === 'customs' && <div className="mt-4 rounded-xl bg-[#f4f7fc] p-4 text-sm leading-5"><strong className="text-[#073B9A]">Délai / contrôle</strong><p className="mt-1">La DGDA indique un dépôt de déclaration dans les 3 jours ouvrables après présentation à la douane. Le classement tarifaire et les droits doivent être liquidés par SYDONIA/DGDA; Kenz ne les estime pas ici.</p><a href="https://douane.gouv.cd/les-procedures-douanieres/les-procedures-de-dedouanement-a-limportation-en-rdc%EF%BF%BC/" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold text-[#073B9A]">Procédure DGDA <ExternalLink size={14}/></a></div>}
      {slug === 'claims' && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-5 text-red-950"><strong>Conditions à vérifier avant dépôt</strong><p className="mt-1">La procédure DGRAD publiée prévoit une réclamation écrite dans les 3 mois suivant la réception de la note ou de l’extrait, avec référence, nature et montant, lieu de taxation, motifs et conclusions; la partie non contestée doit être payée. Le recours ne suspend pas automatiquement le recouvrement. Confirmez le texte applicable à votre dossier.</p><a href="https://dgrad.gouv.cd/actualites/procedure-des-voies-de-recours/" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold text-[#073B9A]">Lire la procédure DGRAD <ExternalLink size={14}/></a></div>}
      {slug === 'claims' && <label className="mt-4 flex items-start gap-2 text-sm font-semibold"><input required type="checkbox" checked={!!documents['paidUncontested']} onChange={e => setDocuments(old => ({ ...old, paidUncontested: e.target.checked }))} className="mt-1 accent-[#073B9A]"/><span>Je confirme avoir traité la partie non contestée et compris que ce brouillon ne constitue pas un dépôt de recours.</span></label>}
      <div className="mt-5 flex flex-wrap gap-2"><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-4 py-3 text-sm font-extrabold text-white"><Save size={16}/>Enregistrer sur cet appareil</button><button type="button" onClick={() => print({ Type: slug === 'nif' ? (personType === 'physical' ? 'Personne physique' : 'Personne morale') : '' })} className="inline-flex items-center gap-2 rounded-xl border border-[#073B9A]/15 px-4 py-3 text-sm font-bold text-[#073B9A]"><Printer size={16}/>Imprimer / PDF</button><button type="button" onClick={clearLocal} className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-500"><Trash2 size={16}/>Effacer</button></div><p className="mt-3 text-xs text-slate-500">Les brouillons sont stockés localement dans ce navigateur et ne sont pas synchronisés avec vos autres appareils.</p></form>}

    {slug === 'revenue' && <section className="mt-4 rounded-2xl border border-[#073B9A]/10 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><DrcRevenueIcon size={30}/><div><h2 className="font-black">Étapes réelles de recouvrement</h2><p className="text-sm text-slate-500">Assiette → ordonnancement DGRAD → note de perception → receveur du Trésor → acquit libératoire.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><article className="rounded-xl bg-[#f4f7fc] p-4"><strong>1. Note officielle</strong><p className="mt-1 text-sm text-slate-600">Vérifiez le numéro, l’assujetti, la nature de la recette, le montant, la devise, le receveur et l’échéance inscrite.</p></article><article className="rounded-xl bg-[#f4f7fc] p-4"><strong>2. Paiement</strong><p className="mt-1 text-sm text-slate-600">Suivez uniquement les coordonnées de paiement figurant sur le titre officiel, auprès du receveur du Trésor.</p></article><article className="rounded-xl bg-[#f4f7fc] p-4"><strong>3. Justificatif</strong><p className="mt-1 text-sm text-slate-600">Conservez l’acquit libératoire officiel et rapprochez sa référence ci-dessous.</p></article></div><a href="https://dgrad.gouv.cd/guides/recouvrement/" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#073B9A]">Guide officiel DGRAD <ExternalLink size={15}/></a></section>}

    {slug === 'revenue' && localRecord && <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-black">Suivi local enregistré</h2><p className="mt-1 text-sm text-slate-500">Note {localRecord.noteNumber} · {localRecord.debtor} · {localRecord.amount} {localRecord.currency}</p><p className="mt-1 text-xs text-slate-500">{localRecord.paymentReference ? `Référence acquit saisie : ${localRecord.paymentReference} (non vérifiée)` : 'Paiement non signalé'}</p></div><button onClick={() => print({ 'Référence note': localRecord.noteNumber, Assujetti: localRecord.debtor, Montant: `${localRecord.amount} ${localRecord.currency}`, 'Référence acquit saisie': localRecord.paymentReference || 'Aucune' })} className="inline-flex items-center gap-2 text-sm font-bold text-[#073B9A]"><Download size={16}/>Fiche</button></div><button onClick={() => { setLocalRecord(null); localStorage.removeItem(getEntryUrl('revenue:record', user!.uid)); }} className="mt-3 text-xs font-bold text-red-600">Supprimer le suivi local</button></section>}
    {slug === 'revenue' && <form onSubmit={event => { event.preventDefault(); if (!user?.uid) { saveLocal(); return; } const record = { noteNumber: values.noteNumber || '', debtor: values.debtor || '', amount: values.amount || '', currency: values.currency || '', paymentReference: values.paymentReference || '', savedAt: new Date().toISOString() }; try { localStorage.setItem(getEntryUrl('revenue:record', user.uid), JSON.stringify(record)); setLocalRecord(record); saveLocal(); } catch { toast({ variant: 'destructive', title: 'Enregistrement impossible', description: 'Le stockage local du navigateur est indisponible ou saturé.' }); } }} className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><div className="grid gap-3 sm:grid-cols-2">{revenueFields.map(field => <Field key={field.key} field={field} value={values[field.key] as string || ''} onChange={value => update(field.key, value)}/>)}</div><div className="mt-5 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-4 py-3 text-sm font-extrabold text-white"><Save size={16}/>Enregistrer le suivi local</button><button type="button" onClick={openOfficial} className="inline-flex items-center gap-2 rounded-xl border border-[#073B9A]/15 px-4 py-3 text-sm font-bold text-[#073B9A]">Portail LOGIRAD <ExternalLink size={15}/></button></div><p className="mt-3 text-xs text-slate-500">Le statut saisi n’est pas vérifié par la DGRAD; le brouillon reste sur cet appareil.</p></form>}

    {slug === 'claims' && <section className="mt-4 rounded-2xl border border-[#073B9A]/10 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><DrcTaxFileIcon size={32}/><div><h2 className="font-black">Vérifier un reçu ou titre DGI</h2><p className="text-sm text-slate-500">Par référence unique ou code QR, la décision d’authenticité appartient au service DGI.</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="UID / numéro officiel" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3"/><button onClick={() => void openCodeVerifier()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#073B9A] px-4 py-3 text-sm font-extrabold text-white">Continuer la vérification <ExternalLink size={15}/></button></div></section>}
    {slug === 'claims' && <form onSubmit={onSubmit} className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-black">Brouillon de réclamation DGRAD</h2><p className="mt-1 text-sm text-slate-500">Formulaire de préparation conforme aux éléments publiés dans la procédure des voies de recours.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{claimFields.map(field => <Field key={field.key} field={field} value={values[field.key] as string || ''} onChange={value => update(field.key, value)}/>)}</div><div className="mt-4 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-4 py-3 text-sm font-extrabold text-white"><Save size={16}/>Enregistrer localement</button><button type="button" onClick={() => print({ 'Partie non contestée payée': documents.paidUncontested })} className="inline-flex items-center gap-2 rounded-xl border border-[#073B9A]/15 px-4 py-3 text-sm font-bold text-[#073B9A]"><Printer size={16}/>Imprimer / PDF signé</button><a href="mailto:secretariat.dg@dgrad.gouv.cd" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Contact DGRAD <ExternalLink size={15}/></a></div><p className="mt-3 text-xs text-slate-500">La boîte e-mail est un contact administratif publié, pas une API de dépôt. Vérifiez l’adresse et les modalités de remise avant d’envoyer des pièces personnelles.</p></form>}

    {slug === 'customs' && <form onSubmit={onSubmit} className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><div className="grid gap-3 sm:grid-cols-2">{customsFields.map(field => <Field key={field.key} field={field} value={values[field.key] as string || ''} onChange={value => update(field.key, value)}/>)}</div><fieldset className="mt-5 rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-black">Documents de transport et de commerce</legend><div className="grid gap-2 sm:grid-cols-2">{fileSet.map(name => <label key={name} className="flex gap-2 text-sm"><input type="checkbox" checked={!!documents[name]} onChange={e => setDocuments(old => ({ ...old, [name]: e.target.checked }))} className="accent-[#073B9A]"/>{name}</label>)}</div></fieldset><div className="mt-5 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-4 py-3 text-sm font-extrabold text-white"><Save size={16}/>Enregistrer la préparation</button><button type="button" onClick={() => print(documents)} className="inline-flex items-center gap-2 rounded-xl border border-[#073B9A]/15 px-4 py-3 text-sm font-bold text-[#073B9A]"><Printer size={16}/>Imprimer / PDF</button><button type="button" onClick={openOfficial} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Ouvrir SYDONIAWorld <ExternalLink size={15}/></button></div><p className="mt-3 text-xs text-slate-500">N’entrez ici que les informations nécessaires à la préparation. Le formulaire n’est pas transmis à la DGDA.</p></form>}

    <footer className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 text-xs text-slate-500 shadow-sm"><FileCheck2 size={20} className="text-[#073B9A]"/><span>Sources officielles consultées : DGI, DGDA / SYDONIAWorld et DGRAD / LOGIRAD. Vérifiez toujours les exigences et délais affichés par l’administration avant dépôt.</span><Link href="/dashboard/drc-gouv" className="ml-auto font-bold text-[#073B9A]">Services DRC Gouv</Link></footer>
  </div></main>;
}
