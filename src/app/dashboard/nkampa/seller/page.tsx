'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Package, TrendingUp, Users, CheckCircle, Upload, Loader2, X, Images, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useNkampaStore } from '@/hooks/useNkampaStore';

const SUBCATEGORIES_BY_CATEGORY: Record<string, Array<{ id: string; label: string }>> = {
  tech: [
    { id: 'smartphones', label: 'Smartphones' },
    { id: 'ordinateurs', label: 'Ordinateurs' },
    { id: 'accessoires', label: 'Accessoires' },
    { id: 'audio', label: 'Audio' },
    { id: 'tv', label: 'TV & Vidéo' },
  ],
  mode: [
    { id: 'vetements', label: 'Vêtements' },
    { id: 'chaussures', label: 'Chaussures' },
    { id: 'sacs', label: 'Sacs' },
    { id: 'montres', label: 'Montres' },
    { id: 'bijoux', label: 'Bijoux' },
  ],
  alimentaire: [
    { id: 'cereales', label: 'Céréales' },
    { id: 'boissons', label: 'Boissons' },
    { id: 'epices', label: 'Épices' },
    { id: 'snacks', label: 'Snacks' },
    { id: 'frais', label: 'Produits frais' },
  ],
  bio: [
    { id: 'legumes', label: 'Légumes' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'miel', label: 'Miel' },
    { id: 'tisanes', label: 'Tisanes' },
    { id: 'graines', label: 'Graines' },
  ],
  electro: [
    { id: 'cuisine', label: 'Cuisine' },
    { id: 'entretien', label: 'Entretien' },
    { id: 'clim', label: 'Climatisation' },
    { id: 'energie', label: 'Énergie' },
  ],
  maison: [
    { id: 'decor', label: 'Décor' },
    { id: 'meubles', label: 'Meubles' },
    { id: 'linge', label: 'Linge de maison' },
    { id: 'cuisine', label: 'Cuisine' },
  ],
  beaute: [
    { id: 'soins', label: 'Soins' },
    { id: 'parfums', label: 'Parfums' },
    { id: 'makeup', label: 'Maquillage' },
    { id: 'cheveux', label: 'Cheveux' },
  ],
  sports: [
    { id: 'fitness', label: 'Fitness' },
    { id: 'ballons', label: 'Ballons' },
    { id: 'equipements', label: 'Équipements' },
    { id: 'tenues', label: 'Tenues' },
  ],
  accessoires: [
    { id: 'telephones', label: 'Téléphones' },
    { id: 'mode', label: 'Mode' },
    { id: 'auto', label: 'Auto' },
    { id: 'maison', label: 'Maison' },
  ],
};

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addProduct } = useNkampaEcommerce();
  const { store, hasChecked } = useNkampaStore(user?.uid);

  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CDF');
  const [category, setCategory] = useState<'B2B' | 'B2C'>('B2C');
  const [subcategory, setSubcategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [moq, setMoq] = useState('');
  const [stock, setStock] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const storeCategory = store?.category || '';
  const subcategoryOptions = useMemo(() => SUBCATEGORIES_BY_CATEGORY[storeCategory] || [], [storeCategory]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nextFiles = [...imageFiles, ...files].slice(0, 8);
    setImageFiles(nextFiles);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string].slice(0, 8));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImageAt = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous devez être connecté',
      });
      return;
    }

    if (!hasChecked) {
      toast({ variant: 'destructive', title: 'Patientez', description: 'Chargement de votre boutique…' });
      return;
    }

    if (!store) {
      toast({ variant: 'destructive', title: 'Boutique requise', description: 'Créez d’abord une boutique Nkampa.' });
      router.push('/dashboard/nkampa/store');
      return;
    }

    if (!productName || !price || !location) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    if (store.sellType === 'product' && (!stock || Number(stock) < 0)) {
      toast({
        variant: 'destructive',
        title: 'Stock requis',
        description: 'Indiquez le stock disponible pour ce produit.',
      });
      return;
    }

    if (store.sellType === 'product' && subcategoryOptions.length > 0 && !subcategory) {
      toast({ variant: 'destructive', title: 'Sous-catégorie requise', description: 'Choisissez une sous-catégorie.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      for (const f of imageFiles) {
        const r = await uploadToCloudinary(f, 'image');
        uploadedUrls.push(r.secureUrl);
      }
      const imageUrl = uploadedUrls[0] || 'https://picsum.photos/seed/default/300/300';

      // Ajouter le produit
      await addProduct({
        name: productName,
        price: parseFloat(price),
        currency,
        image: imageUrl,
        images: uploadedUrls,
        moq: moq || undefined,
        location: location || store.location || '',
        category,
        description: description || undefined,
        stock: store.sellType === 'product' ? Math.max(0, Math.floor(Number(stock || 0))) : undefined,
        quantityAvailable: store.sellType === 'product' ? Math.max(0, Math.floor(Number(stock || 0))) : undefined,
        availableStock: store.sellType === 'product' ? Math.max(0, Math.floor(Number(stock || 0))) : undefined,
        sold: 0,
        sellerName: store.storeName || user.displayName || user.email || 'Vendeur',
        sellerEmail: user.email || undefined,
        storeId: store.id,
        storeSlug: store.slug,
        storeCategory: store.category,
        storeSubcategory: subcategory || '',
        listingType: store.sellType,
      });

      toast({
        title: 'Succès',
        description: 'Votre produit a été ajouté avec succès',
        className: 'bg-primary text-white border-none',
      });

      // Rediriger vers la page principale
      router.push('/dashboard/nkampa/store/dashboard');
    } catch (error: any) {
      console.error('Erreur ajout produit:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout du produit',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5">
        {/* Header simple sans navigation */}
        <div className="bg-gradient-to-r from-primary to-primary p-4">
          <div className="container mx-auto max-w-4xl flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Devenir Vendeur</h1>
          </div>
        </div>

        {/* Contenu */}
        <div className="container mx-auto max-w-4xl p-6 space-y-8">
          {/* Hero Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-white to-primary/5">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Store className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Vendez vos produits sur eNkamba
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Rejoignez notre marketplace et développez votre business en ligne.
                Des milliers d'acheteurs potentiels vous attendent!
              </p>
            </CardContent>
          </Card>

          {/* Avantages */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Facile à utiliser</h3>
                <p className="text-sm text-gray-600">
                  Ajoutez vos produits en quelques clics et commencez à vendre immédiatement
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Paiements sécurisés</h3>
                <p className="text-sm text-gray-600">
                  Recevez vos paiements directement dans votre portefeuille eNkamba
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Large audience</h3>
                <p className="text-sm text-gray-600">
                  Accédez à des milliers d'acheteurs actifs sur la plateforme
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comment ça marche */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Comment ça marche?</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Ajoutez vos produits</h4>
                    <p className="text-sm text-gray-600">
                      Remplissez les informations de votre produit avec photos et description
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Recevez des commandes</h4>
                    <p className="text-sm text-gray-600">
                      Les acheteurs découvrent vos produits et passent commande
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Livrez et recevez le paiement</h4>
                    <p className="text-sm text-gray-600">
                      Livrez le produit et recevez le paiement dans votre portefeuille
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8"
              onClick={() => setStep('form')}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Commencer à vendre
            </Button>
            <p className="text-sm text-gray-600">
              Gratuit et sans engagement
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5">
      {/* Header simple sans navigation */}
      <div className="bg-gradient-to-r from-primary to-primary p-4">
        <div className="container mx-auto max-w-2xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep('intro')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">
              {store?.sellType === 'service' ? 'Ajouter un service' : 'Ajouter un produit'}
            </h1>
            {store ? (
              <p className="text-xs text-white/80 truncate">
                {store.storeName} • {store.sellType === 'service' ? 'Services' : 'Produits'} • {store.category}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Photos {store?.sellType === 'service' ? 'du service' : 'du produit'}
              </label>
              <div className="space-y-3">
                <label className="w-full border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors p-6 bg-white">
                  <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center">
                      <Images className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-sm font-semibold text-gray-800">Ajouter des photos</div>
                    <div className="text-xs text-gray-600">Jusqu’à 8 images (Cloudinary)</div>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                </label>

                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={`${idx}-${src.slice(0, 20)}`} className="relative rounded-2xl overflow-hidden border border-primary/10 bg-gray-100 aspect-square">
                        <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/70"
                          aria-label="Supprimer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom {store?.sellType === 'service' ? 'du service' : 'du produit'} *
              </label>
              <Input
                placeholder={store?.sellType === 'service' ? "Ex: Réparation smartphone" : "Ex: Sac de riz 25kg"}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* Prix et Devise */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Prix *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Devise
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {store?.sellType === 'product' && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Stock disponible *
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex: 50"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ce stock sera diminué automatiquement à chaque commande confirmée.
                </p>
              </div>
            )}

            {/* Catégorie boutique (fixe) + Sous-catégorie */}
            {store ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Catégorie boutique</label>
                  <div className="h-10 px-3 rounded-md border border-input bg-background flex items-center text-sm">
                    {store.category}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Sous-catégorie {store.sellType === 'service' ? '(optionnel)' : '*'}
                  </label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    disabled={subcategoryOptions.length === 0}
                  >
                    <option value="">{subcategoryOptions.length ? 'Choisir…' : '—'}</option>
                    {subcategoryOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-amber-700 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Boutique requise</p>
                    <p className="text-xs text-amber-800 mt-1">Créez votre boutique Nkampa pour personnaliser l’ajout de produits.</p>
                    <Button size="sm" className="mt-3 bg-primary hover:bg-primary/90" onClick={() => router.push('/dashboard/nkampa/store')}>
                      Créer une boutique
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'B2B' | 'B2C')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="B2C">B2C (Particuliers)</option>
                <option value="B2B">B2B (Entreprises)</option>
              </select>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Localisation *
              </label>
              <Input
                placeholder="Ex: Kinshasa, Gombe"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* MOQ */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Quantité minimum (optionnel)
              </label>
              <Input
                placeholder="Ex: 10 unités"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Description (optionnel)
              </label>
              <textarea
                placeholder="Décrivez votre produit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('intro')}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter le produit'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
