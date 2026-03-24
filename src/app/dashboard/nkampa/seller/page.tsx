'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Package, TrendingUp, Users, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addProduct } = useNkampaEcommerce();

  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CDF');
  const [category, setCategory] = useState<'B2B' | 'B2C'>('B2C');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [moq, setMoq] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    if (!productName || !price || !location) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = 'https://picsum.photos/seed/default/300/300';

      // Upload image vers Cloudinary si fournie
      if (imageFile) {
        const uploadResult = await uploadToCloudinary(imageFile, 'image');
        imageUrl = uploadResult.secureUrl;
      }

      // Ajouter le produit
      await addProduct({
        name: productName,
        price: parseFloat(price),
        currency,
        image: imageUrl,
        moq: moq || undefined,
        location,
        category,
        description: description || undefined,
        sellerName: user.displayName || user.email || 'Vendeur',
        sellerEmail: user.email || undefined,
      });

      toast({
        title: 'Succès',
        description: 'Votre produit a été ajouté avec succès',
        className: 'bg-green-600 text-white border-none',
      });

      // Rediriger vers la page principale
      router.push('/dashboard/nkampa');
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-800/5">
        {/* Header simple sans navigation */}
        <div className="bg-gradient-to-r from-primary to-green-800 p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-800/5">
      {/* Header simple sans navigation */}
      <div className="bg-gradient-to-r from-primary to-green-800 p-4">
        <div className="container mx-auto max-w-2xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep('intro')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Ajouter un produit</h1>
        </div>
      </div>

      {/* Formulaire */}
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Image */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Photo du produit *
              </label>
              <div className="flex flex-col items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-primary/20">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <label className="w-full h-64 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-12 h-12 text-primary/50 mb-2" />
                    <span className="text-sm text-gray-600">Cliquez pour ajouter une photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom du produit *
              </label>
              <Input
                placeholder="Ex: Sac de riz 25kg"
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
