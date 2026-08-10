'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowRight, Loader2, LocateFixed, Mail, Phone, Upload, UserRound } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfilePhotoCropper } from '@/components/profile/profile-photo-cropper';
import { auth } from '@/lib/firebase';
import { getDashboardLocationOrDefault } from '@/lib/dashboard-location';
import { ENKAMBA_MINIMUM_AGE, calculateAgeFromDateOfBirth } from '@/lib/age-policy';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileImage, setProfileImage] = useState('');
  const [photoToCrop, setPhotoToCrop] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    age: '',
    locationLabel: '',
    country: '',
  });
  const calculatedAge = calculateAgeFromDateOfBirth(form.dateOfBirth);

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;
      if (!user?.uid) {
        router.replace('/login');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        const location = getDashboardLocationOrDefault();
        const fullName = data.fullName || user.displayName || '';
        const username = data.username || data.name || '';

        if (data.profileCompleted && fullName && username) {
          router.replace('/dashboard/miyiki-chat');
          return;
        }

        setForm({
          fullName,
          username,
          email: data.email || user.email || '',
          phone: data.phoneNumber || data.phone || user.phoneNumber || '',
          dateOfBirth: data.dateOfBirth || '',
          age: data.dateOfBirth
            ? String(calculateAgeFromDateOfBirth(data.dateOfBirth) ?? '')
            : data.age ? String(data.age) : '',
          locationLabel: data.locationLabel || data.location || location.label,
          country: data.country || location.pays || '',
        });
        setProfileImage(data.profileImage || data.photoURL || user.photoURL || '');
      } catch (error) {
        console.error('Erreur chargement profil incomplet:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [authLoading, router, user]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'dateOfBirth' ? { age: String(calculateAgeFromDateOfBirth(value) ?? '') } : {}),
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Photo trop lourde',
        description: 'La photo doit faire moins de 5MB.',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Format invalide',
        description: 'Veuillez choisir une image.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setPhotoToCrop(String(readerEvent.target?.result || ''));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const useCurrentLocation = () => {
    const location = getDashboardLocationOrDefault();
    setForm(prev => ({
      ...prev,
      locationLabel: location.label,
      country: prev.country || location.pays || '',
    }));
  };

  const uploadProfilePhoto = async (imageDataUrl: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      throw new Error('Utilisateur non authentifié');
    }

    const idToken = await currentUser.getIdToken();
    const response = await fetch('/api/profile/upload-photo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: currentUser.uid,
        imageDataUrl,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.secureUrl) {
      const details = payload?.details?.error?.message || payload?.error || 'Erreur upload photo profil';
      throw new Error(String(details));
    }

    return String(payload.secureUrl);
  };

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid || isSaving) return;

    if (!form.fullName.trim() || !form.username.trim()) {
      toast({
        variant: 'destructive',
        title: 'Profil incomplet',
        description: 'Le nom complet et le nom utilisateur sont requis.',
      });
      return;
    }

    setIsSaving(true);
    try {
      let nextProfileImage = profileImage;
      const nextAge = calculateAgeFromDateOfBirth(form.dateOfBirth);
      if (nextAge === null) {
        toast({
          variant: 'destructive',
          title: 'Date de naissance requise',
          description: 'Ajoutez votre date de naissance pour continuer.',
        });
        return;
      }

      if (nextProfileImage.startsWith('data:image/')) {
        nextProfileImage = await uploadProfilePhoto(nextProfileImage);
      }

      if (nextAge < ENKAMBA_MINIMUM_AGE) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: form.fullName.trim(),
          name: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          phoneNumber: form.phone.trim(),
          dateOfBirth: form.dateOfBirth,
          age: nextAge,
          ageRestrictionStatus: 'blocked_under_16',
          ageRestrictionReason: 'date_of_birth_under_minimum',
          ageRestrictionUpdatedAt: serverTimestamp(),
          ...(nextProfileImage ? { profileImage: nextProfileImage, photoURL: nextProfileImage } : {}),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        router.replace('/age-restricted');
        return;
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: form.fullName.trim(),
        name: form.fullName.trim(),
        displayName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        contactEmail: form.email.trim(),
        phone: form.phone.trim(),
        phoneNumber: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        age: nextAge,
        locationLabel: form.locationLabel.trim(),
        location: form.locationLabel.trim(),
        country: form.country.trim(),
        ...(nextProfileImage ? { profileImage: nextProfileImage, photoURL: nextProfileImage } : {}),
        profileCompleted: true,
        profileCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const storedUser = localStorage.getItem('enkamba_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem('enkamba_user', JSON.stringify({
          ...parsed,
          name: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          ...(nextProfileImage ? { profileImage: nextProfileImage, photoURL: nextProfileImage } : {}),
        }));
      }

      toast({
        title: 'Profil complété',
        description: 'Votre espace eNkamba est prêt.',
        className: 'bg-primary text-white border-none',
      });
      router.replace('/dashboard/miyiki-chat');
    } catch (error: any) {
      console.error('Erreur complétion profil:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || 'Impossible d’enregistrer vos informations.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-primary px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-primary shadow-2xl ring-2 ring-white/40">
            <Image src="/enkamba-logo.png" alt="eNkamba" width={96} height={96} className="h-full w-full scale-[1.42] rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-black">Complétez votre profil</h1>
          <p className="mt-2 text-sm font-medium text-white/75">
            Ajoutez vos informations de base pour personnaliser votre compte.
          </p>
        </div>

        <form onSubmit={submitProfile} className="rounded-[28px] border border-white/15 bg-white/12 p-5 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white/25">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="bg-white text-lg font-black text-primary">
                    {form.fullName
                      .split(' ')
                      .map(part => part[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white">Photo de profil</p>
                  <p className="mt-1 text-xs font-medium text-white/70">Ajoutez une image claire et recadrez-la avant validation.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 h-9 rounded-full px-4 text-xs font-black"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choisir une photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">Nom complet</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input id="fullName" value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} className="border-white/20 bg-white/90 pl-10 text-slate-950" placeholder="Votre nom complet" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Nom utilisateur</Label>
              <Input id="username" value={form.username} onChange={(event) => setField('username', event.target.value)} className="border-white/20 bg-white/90 text-slate-950" placeholder="ex: charmant" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input id="email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className="border-white/20 bg-white/90 pl-10 text-slate-950" placeholder="nom@exemple.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input id="phone" value={form.phone} onChange={(event) => setField('phone', event.target.value)} className="border-white/20 bg-white/90 pl-10 text-slate-950" placeholder="+243..." />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-white">Date de naissance</Label>
                <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)} className="border-white/20 bg-white/90 text-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="text-white">Âge</Label>
                <Input id="age" type="number" value={calculatedAge ?? ''} readOnly className="border-white/20 bg-white/75 text-slate-950" placeholder="Auto" />
              </div>
            </div>

            {calculatedAge !== null && calculatedAge < ENKAMBA_MINIMUM_AGE && (
              <p className="rounded-2xl bg-[#FFA500]/15 px-3 py-2 text-xs font-bold text-white">
                eNkamba est réservé aux utilisateurs de {ENKAMBA_MINIMUM_AGE} ans ou plus.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="location" className="text-white">Localisation</Label>
              <div className="flex gap-2">
                <Input id="location" value={form.locationLabel} onChange={(event) => setField('locationLabel', event.target.value)} className="border-white/20 bg-white/90 text-slate-950" placeholder="Ville, pays" />
                <Button type="button" variant="secondary" onClick={useCurrentLocation} className="shrink-0 px-3">
                  <LocateFixed className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSaving} className="mt-6 h-12 w-full bg-white font-black text-primary hover:bg-white/90">
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Continuer <ArrowRight className="h-4 w-4" /></span>}
          </Button>
        </form>

        <ProfilePhotoCropper
          open={Boolean(photoToCrop)}
          imageSrc={photoToCrop}
          onOpenChange={(open) => {
            if (!open) setPhotoToCrop(null);
          }}
          onConfirm={(croppedImage) => setProfileImage(croppedImage)}
        />
      </div>
    </main>
  );
}
