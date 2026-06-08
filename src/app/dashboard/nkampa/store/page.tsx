'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Store, Building2, User2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createNkampaStore, type NkampaBusinessRole, type NkampaStoreProfileType, type NkampaStoreSellType } from '@/lib/nkampa-store';
import { useNkampaStore } from '@/hooks/useNkampaStore';

const SELL_TYPE_OPTIONS: Array<{ id: NkampaStoreSellType; label: string }> = [
  { id: 'product', label: 'Produits' },
  { id: 'service', label: 'Services' },
];

const PRODUCT_CATEGORIES = [
  { id: 'alimentaire', label: 'Alimentaire' },
  { id: 'bio', label: 'Bio' },
  { id: 'electro', label: 'Électroménager' },
  { id: 'mode', label: 'Mode' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'tech', label: 'Technologie' },
  { id: 'maison', label: 'Maison & Décor' },
  { id: 'beaute', label: 'Beauté & Santé' },
  { id: 'sports', label: 'Sports & Loisirs' },
];

const SERVICE_CATEGORIES = [
  { id: 'livraison', label: 'Livraison' },
  { id: 'transport', label: 'Transport' },
  { id: 'reparation', label: 'Réparation' },
  { id: 'installation', label: 'Installation' },
  { id: 'menage', label: 'Ménage' },
  { id: 'formation', label: 'Formation' },
  { id: 'sante', label: 'Santé' },
  { id: 'event', label: 'Événementiel' },
];

const BUSINESS_ROLES: Array<{ id: NkampaBusinessRole; label: string; hint: string }> = [
  { id: 'retailer', label: 'Détaillant', hint: 'Vente au détail' },
  { id: 'wholesaler', label: 'Grossiste', hint: 'Vente en gros' },
  { id: 'producer', label: 'Producteur', hint: 'Fabrication / production' },
  { id: 'supplier', label: 'Fournisseur', hint: 'Approvisionnement' },
];

const BUSINESS_SUBROLES: Record<NkampaBusinessRole, Array<{ id: string; label: string }>> = {
  retailer: [
    { id: 'b2c', label: 'B2C' },
    { id: 'b2b', label: 'B2B' },
    { id: 'boutique-physique', label: 'Boutique physique' },
    { id: 'online', label: 'Vente en ligne' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'superette', label: 'Supérette / Alimentation' },
    { id: 'pharmacie', label: 'Pharmacie / Santé' },
    { id: 'mode', label: 'Mode / Vêtements' },
    { id: 'electro', label: 'Électronique' },
  ],
  wholesaler: [
    { id: 'import', label: 'Import' },
    { id: 'local', label: 'Local' },
    { id: 'semi-gros', label: 'Semi-gros' },
    { id: 'gros', label: 'Gros' },
    { id: 'lots', label: 'Lots / palettes' },
    { id: 'distribution', label: 'Distribution' },
    { id: 'prix-usine', label: 'Prix usine' },
  ],
  producer: [
    { id: 'agro', label: 'Agroalimentaire' },
    { id: 'artisanat', label: 'Artisanat' },
    { id: 'textile', label: 'Textile' },
    { id: 'cosmetique', label: 'Cosmétique' },
    { id: 'boisson', label: 'Boissons' },
    { id: 'industrie', label: 'Industrie' },
    { id: 'sur-commande', label: 'Fabrication sur commande' },
  ],
  supplier: [
    { id: 'distribution', label: 'Distribution' },
    { id: 'stock', label: 'Stock disponible' },
    { id: 'commande', label: 'Sur commande' },
    { id: 'logistique', label: 'Logistique' },
    { id: 'livraison', label: 'Livraison' },
    { id: 'multi-villes', label: 'Multi-villes' },
  ],
};

export default function NkampaCreateStorePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { store, hasChecked } = useNkampaStore(user?.uid);

  const [step, setStep] = useState<'choose' | 'details'>('choose');
  const [profileType, setProfileType] = useState<NkampaStoreProfileType>('individual');
  const [businessRoles, setBusinessRoles] = useState<NkampaBusinessRole[]>([]);
  const [businessSubroles, setBusinessSubroles] = useState<Partial<Record<NkampaBusinessRole, string[]>>>({});
  const [sellType, setSellType] = useState<NkampaStoreSellType>('product');
  const [category, setCategory] = useState<string>('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = useMemo(() => (sellType === 'product' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES), [sellType]);

  if (authLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Connectez-vous pour créer votre boutique.</p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Boutique déjà créée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà une boutique: <span className="font-semibold text-foreground">{store.storeName}</span>
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => router.push('/dashboard/nkampa/store/dashboard')}>
              Accéder à ma boutique
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/nkampa')}>
              Retour à Nkampa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleRole = (role: NkampaBusinessRole) => {
    setBusinessRoles((prev) => {
      const exists = prev.includes(role);
      const next = exists ? prev.filter((r) => r !== role) : [...prev, role];
      if (exists) {
        setBusinessSubroles((s) => {
          const copy = { ...s };
          delete copy[role];
          return copy;
        });
      }
      return next;
    });
  };

  const toggleSubrole = (role: NkampaBusinessRole, sub: string) => {
    setBusinessSubroles((prev) => {
      const current = prev[role] || [];
      const next = current.includes(sub) ? current.filter((x) => x !== sub) : [...current, sub];
      return { ...prev, [role]: next };
    });
  };

  const submit = async () => {
    if (!storeName.trim()) {
      toast({ variant: 'destructive', title: 'Nom requis', description: 'Entrez le nom de votre boutique.' });
      return;
    }

    if (!sellType) {
      toast({ variant: 'destructive', title: 'Type requis', description: 'Choisissez Produits ou Services.' });
      return;
    }

    if (!category) {
      toast({ variant: 'destructive', title: 'Catégorie requise', description: 'Choisissez une catégorie.' });
      return;
    }

    if (profileType === 'business' && businessRoles.length === 0) {
      toast({ variant: 'destructive', title: 'Rôle requis', description: 'Choisissez au moins un rôle entreprise.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createNkampaStore({
        ownerId: user.uid,
        profileType,
        businessRoles: profileType === 'business' ? businessRoles : [],
        businessSubroles: profileType === 'business' ? businessSubroles : {},
        sellType,
        category,
        storeName: storeName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        description: description.trim(),
      });

      toast({
        title: profileType === 'business' ? 'Demande envoyée' : 'Boutique créée',
        description:
          profileType === 'business'
            ? 'Votre boutique est en attente d’approbation.'
            : `Lien: /shop/${created.slug}`,
        className: profileType === 'business' ? '' : 'bg-primary text-white border-none',
      });
      router.push('/dashboard/nkampa/store/dashboard');
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message || 'Impossible de créer la boutique.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" onClick={() => (step === 'details' ? setStep('choose') : router.back())}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold truncate">Créer une boutique</h1>
            <p className="text-xs text-white/80 truncate">Nkampa • E-commerce</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-4 space-y-4">
        {step === 'choose' ? (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Quel type de boutique ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProfileType('individual');
                    setStep('details');
                  }}
                  className="text-left rounded-2xl border border-primary/15 bg-white p-4 hover:border-primary/30 hover:bg-primary/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 grid place-items-center">
                      <User2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">Individu</p>
                      <p className="text-xs text-muted-foreground">Exigences minimales</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileType('business');
                    setStep('details');
                  }}
                  className="text-left rounded-2xl border border-primary/15 bg-white p-4 hover:border-primary/30 hover:bg-primary/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 grid place-items-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">Entreprise</p>
                      <p className="text-xs text-muted-foreground">Rôles vendeur + dashboard</p>
                    </div>
                  </div>
                </button>
              </div>

                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Store className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Lien personnalisé</p>
                      <p className="text-xs text-muted-foreground">
                        Individu: lien public direct. Entreprise: lien activé après approbation.
                      </p>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Détails {profileType === 'business' ? 'entreprise' : 'individu'}
                <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/15">
                  {profileType === 'business' ? 'Entreprise' : 'Individu'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Nom de boutique *</label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Kasang Elektronique" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Téléphone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243..." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700">Localisation</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Kinshasa, Gombe" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[90px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Décrivez votre boutique (optionnel)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Type de vente *</p>
                <div className="flex flex-wrap gap-2">
                  {SELL_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSellType(opt.id);
                        setCategory('');
                      }}
                      className={[
                        'rounded-2xl border px-3 py-2 text-xs font-semibold transition',
                        sellType === opt.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-primary/15 bg-white hover:bg-primary/5 text-foreground/80',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {profileType === 'business' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Rôle entreprise *</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all = BUSINESS_ROLES.map((r) => r.id);
                        setBusinessRoles(all);
                      }}
                      className="rounded-2xl border border-primary/15 bg-white px-3 py-2 text-xs font-semibold hover:bg-primary/5"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBusinessRoles([]);
                        setBusinessSubroles({});
                      }}
                      className="rounded-2xl border border-primary/15 bg-white px-3 py-2 text-xs font-semibold hover:bg-primary/5"
                    >
                      Effacer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BUSINESS_ROLES.map((opt) => {
                      const selected = businessRoles.includes(opt.id);
                      return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleRole(opt.id)}
                        className={[
                          'rounded-2xl border p-3 text-left transition',
                          selected ? 'border-primary/40 bg-primary/10' : 'border-primary/15 bg-white hover:bg-primary/5',
                        ].join(' ')}
                      >
                        <p className="text-sm font-bold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.hint}</p>
                      </button>
                      );
                    })}
                  </div>

                  {businessRoles.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {businessRoles.map((role) => (
                        <div key={role} className="rounded-2xl border border-primary/10 bg-white p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Sous-rôles ({BUSINESS_ROLES.find((r) => r.id === role)?.label})</p>
                          <div className="flex flex-wrap gap-2">
                            {BUSINESS_SUBROLES[role].map((s) => {
                              const active = (businessSubroles[role] || []).includes(s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => toggleSubrole(role, s.id)}
                                  className={[
                                    'rounded-2xl border px-3 py-2 text-xs font-semibold transition',
                                    active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-primary/15 bg-white hover:bg-primary/5 text-foreground/80',
                                  ].join(' ')}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Catégorie *</p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={[
                        'rounded-2xl border px-3 py-2 text-xs font-semibold transition',
                        category === c.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-primary/15 bg-white hover:bg-primary/5 text-foreground/80',
                      ].join(' ')}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('choose')} disabled={isSubmitting}>
                  Retour
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={submit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Créer la boutique
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
