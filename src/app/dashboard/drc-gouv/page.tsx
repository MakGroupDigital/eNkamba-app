'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { DrcCustomsIcon, DrcDgiIcon, DrcMinistryIcon, DrcProvinceIcon, DrcRevenueIcon, DrcTradeIcon, DrcTaxFileIcon, DrcTaxHistoryIcon, DrcTaxIdIcon, DrcTaxPaymentIcon, TaxIcon } from '@/components/icons/service-icons';
import { useToast } from '@/hooks/use-toast';

type ServiceCard = { title: string; detail: string; Icon: typeof DrcDgiIcon; href?: string };

const administrations: ServiceCard[] = [
  { title: 'DGI', detail: 'Impôts et facture normalisée', Icon: DrcDgiIcon, href: '/dashboard/tax-declaration' },
  { title: 'DGDA', detail: 'Douanes, importations et exportations', Icon: DrcCustomsIcon, href: '/dashboard/drc-gouv/service/customs' },
  { title: 'DGRAD', detail: 'Recettes administratives et domaniales', Icon: DrcRevenueIcon, href: '/dashboard/drc-gouv/service/revenue' },
  { title: 'Provinces & ETD', detail: 'Impôts, taxes et redevances locales', Icon: DrcProvinceIcon },
  { title: 'Contribuables', detail: 'Particuliers, entreprises et organisations', Icon: DrcDgiIcon },
  { title: 'Ministère', detail: 'Informations, actualités et services', Icon: DrcMinistryIcon },
];

const essentials: ServiceCard[] = [
  { title: 'Obtenir ou vérifier un NIF', detail: 'Préparer son dossier puis continuer sur e-NIF', Icon: DrcDgiIcon, href: '/dashboard/drc-gouv/service/nif' },
  { title: 'Déclarer et payer un impôt', detail: 'Préparation et suivi fiscal', Icon: DrcTaxPaymentIcon, href: '/dashboard/tax-declaration' },
  { title: 'Dédouaner une marchandise', detail: 'Préparer le dossier avant SYDONIAWorld', Icon: DrcTradeIcon, href: '/dashboard/drc-gouv/service/customs' },
  { title: 'Facture normalisée', detail: 'Vérifier un document ou préparer son émission', Icon: DrcRevenueIcon, href: '/dashboard/drc-gouv/service/invoice' },
  { title: 'Recettes non fiscales', detail: 'Suivre une note de perception DGRAD', Icon: DrcRevenueIcon, href: '/dashboard/drc-gouv/service/revenue' },
  { title: 'Reçus et réclamations', detail: 'Vérifier un titre ou préparer un recours', Icon: DrcCustomsIcon, href: '/dashboard/drc-gouv/service/claims' },
];

const provinces = ['Bas-Uele', 'Équateur', 'Haut-Katanga', 'Haut-Lomami', 'Haut-Uele', 'Ituri', 'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Kinshasa', 'Kongo-Central', 'Kwango', 'Kwilu', 'Lomami', 'Lualaba', 'Mai-Ndombe', 'Maniema', 'Mongala', 'Nord-Kivu', 'Nord-Ubangi', 'Sankuru', 'Sud-Kivu', 'Sud-Ubangi', 'Tanganyika', 'Tshopo', 'Tshuapa'];

export default function DrcGouvPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [declarationCount, setDeclarationCount] = useState(0);
  const [nifCount, setNifCount] = useState(0);
  const [dgiCount, setDgiCount] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  const [province, setProvince] = useState('all');

  useEffect(() => {
    if (!user?.uid) return;
    const stopDeclarations = onSnapshot(query(collection(db, 'taxDeclarations'), where('userId', '==', user.uid)), snapshot => {
      setDeclarationCount(snapshot.size);
      setDgiCount(snapshot.docs.filter(item => item.data().status === 'READY_FOR_DGI').length);
      setReportedCount(snapshot.docs.filter(item => item.data().status === 'PAYMENT_REPORTED').length);
    });
    const stopNif = onSnapshot(query(collection(db, 'taxNifRequests'), where('userId', '==', user.uid)), snapshot => setNifCount(snapshot.size));
    return () => { stopDeclarations(); stopNif(); };
  }, [user?.uid]);
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
        <div><span className="drc-gouv-kicker">DRC GOUV · KENZ PAY</span><h1>Services financiers publics dans votre téléphone</h1><p>Impôts, douanes, recettes non fiscales et suivi des démarches officielles depuis un portail unique.</p><div className="drc-gouv-province"><DrcProvinceIcon size={24}/><span><strong>Choisir ma province</strong><small>{province === 'all' ? '26 provinces disponibles' : `Services publics · ${province}`}</small></span><select aria-label="Choisir une province" value={province} onChange={event => setProvince(event.target.value)}><option value="all">Toutes les provinces (26)</option>{provinces.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
        <div className="drc-gouv-map" aria-hidden="true"><div className="drc-gouv-map-grid"/><span className="drc-gouv-node one"><DrcMinistryIcon/></span><span className="drc-gouv-node two"><DrcRevenueIcon/></span><span className="drc-gouv-node three"><DrcProvinceIcon/></span><span className="drc-gouv-node four"><DrcTaxFileIcon/></span></div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><article className="drc-gouv-stat"><DrcTaxFileIcon/><span>Déclarations suivies</span><strong>{declarationCount}</strong></article><article className="drc-gouv-stat"><DrcTaxPaymentIcon/><span>À finaliser sur DGI</span><strong>{dgiCount}</strong></article><article className="drc-gouv-stat"><DrcTaxIdIcon/><span>Dossiers NIF</span><strong>{nifCount}</strong></article><article className="drc-gouv-stat"><DrcTaxHistoryIcon/><span>Paiements signalés</span><strong>{reportedCount}</strong></article></section>

      <section className="mt-7"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.18em] text-[#073B9A]">ADMINISTRATIONS</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Vos services publics</h2></div><TaxIcon size={44}/></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{administrations.map((service) => renderService(service))}</div></section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]"><div className="drc-gouv-import"><div className="flex items-start justify-between gap-4"><div><span className="drc-gouv-kicker text-[#073B9A]">GUICHET COORDONNÉ</span><h2>Documents Import-Export</h2><p>Demander ou suivre les formalités DGDA, OCC, OGEFREM et services habilités.</p></div><DrcTradeIcon size={48}/></div><div className="drc-gouv-import-steps"><span><b>1</b>Dossier unique</span><ArrowRight/><span><b>2</b>Validation des services</span><ArrowRight/><span><b>3</b>Paiement via les canaux habilités</span></div><button type="button" onClick={() => pending('Documents Import-Export')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073B9A] px-5 py-3 text-sm font-extrabold text-white"><DrcTradeIcon size={20}/>Démarrer une demande</button></div><aside className="rounded-2xl border border-[#073B9A]/10 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Services essentiels</h2><div className="mt-3 divide-y divide-[#073B9A]/10">{essentials.map((service) => renderService(service, true))}</div></aside></section>

      <section className="mt-6 grid gap-3 rounded-2xl border border-[#073B9A]/10 bg-white p-4 sm:grid-cols-3"><div className="flex items-center gap-3"><DrcTaxIdIcon size={28}/><span><strong className="block text-sm">Suivi des démarches</strong><small className="text-xs text-slate-500">Références locales Kenz</small></span></div><div className="flex items-center gap-3"><DrcTaxHistoryIcon size={28}/><span><strong className="block text-sm">Justificatifs officiels</strong><small className="text-xs text-slate-500">Émis par la DGI, à conserver ici</small></span></div><a href="https://dgi.gouv.cd/communiques-officiels/" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-left"><DrcTaxPaymentIcon size={28}/><span><strong className="block text-sm">Calendrier fiscal DGI</strong><small className="text-xs text-slate-500">Échéances et communiqués à jour</small></span><ExternalLink className="ml-auto text-[#073B9A]" size={16}/></a></section>
    </main>
  </div>;
}
