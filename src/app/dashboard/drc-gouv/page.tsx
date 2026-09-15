'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeDollarSign, BellRing, Building2, ClipboardList, FileBadge2, FileText, Headphones, Landmark, MapPinned, PackageCheck, ReceiptText, ShieldCheck, Truck, UsersRound } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { TaxIcon } from '@/components/icons/service-icons';
import { useToast } from '@/hooks/use-toast';

type ServiceCard = { title: string; detail: string; Icon: typeof Building2; href?: string };

const administrations: ServiceCard[] = [
  { title: 'DGI', detail: 'Impôts et facture normalisée', Icon: Building2, href: '/dashboard/tax-declaration' },
  { title: 'DGDA', detail: 'Douanes, importations et exportations', Icon: PackageCheck },
  { title: 'DGRAD', detail: 'Recettes administratives et domaniales', Icon: Landmark },
  { title: 'Provinces & ETD', detail: 'Impôts, taxes et redevances locales', Icon: MapPinned },
  { title: 'Contribuables', detail: 'Particuliers, entreprises et organisations', Icon: UsersRound },
  { title: 'Ministère', detail: 'Informations, actualités et services', Icon: Building2 },
];

const essentials: ServiceCard[] = [
  { title: 'Obtenir ou vérifier un NIF', detail: 'Immatriculation fiscale sécurisée', Icon: FileBadge2 },
  { title: 'Déclarer et payer un impôt', detail: 'Déclaration fiscale et paiement', Icon: ReceiptText, href: '/dashboard/tax-declaration' },
  { title: 'Dédouaner une marchandise', detail: 'Déclaration, droits, contrôle et mainlevée', Icon: Truck },
  { title: 'Facture normalisée', detail: 'Émettre ou vérifier une facture', Icon: FileText },
  { title: 'Recettes non fiscales', detail: 'Actes générateurs et notes de perception', Icon: BadgeDollarSign },
  { title: 'Reçus et réclamations', detail: 'Télécharger un reçu ou introduire un recours', Icon: Headphones },
];

export default function DrcGouvPage() {
  const { toast } = useToast();
  const pending = (label: string) => toast({ title: 'Fonction en cours de déploiement', description: `${label} sera bientôt disponible dans DRC Gouv.` });
  const renderService = (service: ServiceCard, compact = false) => {
    const content = <><span className="drc-gouv-icon"><service.Icon /></span><span><strong>{service.title}</strong><small>{service.detail}</small></span><ArrowRight /></>;
    return service.href ? <Link key={service.title} href={service.href} className={compact ? 'drc-gouv-essential' : 'drc-gouv-administration'}>{content}</Link> : <button key={service.title} type="button" onClick={() => pending(service.title)} className={compact ? 'drc-gouv-essential' : 'drc-gouv-administration'}>{content}</button>;
  };

  return <div className="min-h-screen bg-[#f7f9ff] pb-28 text-[#071e55]">
    <DashboardHeader searchPlaceholder="Rechercher un service gouvernemental" />
    <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <Link href="/dashboard/mbongo-dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#073B9A]"><ArrowLeft size={17}/>Retour à Kenz Pay</Link>
      <section className="drc-gouv-hero">
        <div><span className="drc-gouv-kicker">DRC GOUV · KENZ PAY</span><h1>Services financiers publics dans votre téléphone</h1><p>Impôts, douanes, recettes non fiscales, paiements et reçus sécurisés depuis un seul portail.</p><div className="drc-gouv-province"><MapPinned size={21}/><span><strong>Choisir ma province</strong><small>Afficher les régies, taxes et services locaux</small></span><select aria-label="Choisir une province" defaultValue="all"><option value="all">Toutes les provinces (26)</option><option>Kinshasa</option><option>Haut-Katanga</option><option>Nord-Kivu</option><option>Kongo-Central</option></select></div></div>
        <div className="drc-gouv-map" aria-hidden="true"><div className="drc-gouv-map-grid"/><span className="drc-gouv-node one"><Building2/></span><span className="drc-gouv-node two"><BadgeDollarSign/></span><span className="drc-gouv-node three"><ShieldCheck/></span><span className="drc-gouv-node four"><ReceiptText/></span></div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><article className="drc-gouv-stat"><ClipboardList/><span>Mes dossiers</span><strong>0</strong></article><article className="drc-gouv-stat"><BadgeDollarSign/><span>Paiements en attente</span><strong>0</strong></article><article className="drc-gouv-stat"><FileText/><span>Documents disponibles</span><strong>0</strong></article><article className="drc-gouv-stat"><Headphones/><span>Réclamations</span><strong>0</strong></article></section>

      <section className="mt-7"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.18em] text-[#073B9A]">ADMINISTRATIONS</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Vos services publics</h2></div><TaxIcon size={44}/></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{administrations.map((service) => renderService(service))}</div></section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]"><div className="drc-gouv-import"><div className="flex items-start justify-between gap-4"><div><span className="drc-gouv-kicker text-[#073B9A]">GUICHET COORDONNÉ</span><h2>Documents Import-Export</h2><p>Demander ou suivre les formalités DGDA, OCC, OGEFREM et services habilités.</p></div><PackageCheck className="text-[#F51B2B]" size={48}/></div><div className="drc-gouv-import-steps"><span><b>1</b>Dossier unique</span><ArrowRight/><span><b>2</b>Validation des services</span><ArrowRight/><span><b>3</b>Paiement sécurisé</span></div><button type="button" onClick={() => pending('Documents Import-Export')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-5 py-3 text-sm font-extrabold text-white"><PackageCheck size={18}/>Démarrer une demande</button></div><aside className="rounded-2xl border border-[#073B9A]/10 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Services essentiels</h2><div className="mt-3 divide-y divide-[#073B9A]/10">{essentials.map((service) => renderService(service, true))}</div></aside></section>

      <section className="mt-6 grid gap-3 rounded-2xl border border-[#073B9A]/10 bg-white p-4 sm:grid-cols-3"><div className="flex items-center gap-3"><ShieldCheck className="text-[#073B9A]"/><span><strong className="block text-sm">Données protégées</strong><small className="text-xs text-slate-500">Paiements et documents sécurisés</small></span></div><div className="flex items-center gap-3"><ReceiptText className="text-[#073B9A]"/><span><strong className="block text-sm">Reçus vérifiables</strong><small className="text-xs text-slate-500">Historique disponible dans Kenz</small></span></div><button type="button" onClick={() => pending('Alertes gouvernementales')} className="flex items-center gap-3 text-left"><BellRing className="text-[#F51B2B]"/><span><strong className="block text-sm">Alertes et échéances</strong><small className="text-xs text-slate-500">Recevez les rappels importants</small></span></button></section>
    </main>
  </div>;
}
