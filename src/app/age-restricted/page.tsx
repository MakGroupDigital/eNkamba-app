'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ENKAMBA_MINIMUM_AGE, calculateAgeFromDateOfBirth } from '@/lib/age-policy';

export default function AgeRestrictedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const age = useMemo(() => calculateAgeFromDateOfBirth(profile?.dateOfBirth), [profile?.dateOfBirth]);

  const submitAppeal = async () => {
    if (!user?.uid || isSubmitting) return;
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Message requis',
        description: 'Expliquez brièvement pourquoi vous contestez cette restriction.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'ageRestrictionAppeals'), {
        userId: user.uid,
        userEmail: profile?.email || user.email || '',
        userPhone: profile?.phone || profile?.phoneNumber || user.phoneNumber || '',
        fullName: profile?.fullName || profile?.name || user.displayName || '',
        dateOfBirth: profile?.dateOfBirth || null,
        calculatedAge: age,
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'users', user.uid), {
        ageRestrictionStatus: 'appeal_pending',
        ageRestrictionAppealAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Contestation envoyée',
        description: 'Notre équipe vérifiera votre demande.',
        className: 'bg-primary text-white border-none',
      });
      setMessage('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || 'Impossible d’envoyer la contestation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-primary px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full bg-primary shadow-2xl ring-2 ring-white/40">
            <Image src="/enkamba-logo.png" alt="eNkamba" width={96} height={96} className="h-full w-full scale-[1.42] rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-black">Accès limité</h1>
          <p className="mt-2 text-sm font-medium text-white/75">
            eNkamba est réservé aux utilisateurs de {ENKAMBA_MINIMUM_AGE} ans ou plus.
          </p>
        </div>

        <Card className="rounded-[28px] border-white/15 bg-white text-slate-950 shadow-2xl">
          <CardContent className="space-y-5 p-5">
            <div className="rounded-2xl bg-[#FFA500]/10 p-4">
              <AlertTriangle className="mb-3 h-7 w-7 text-[#FFA500]" />
              <p className="text-sm font-bold">
                Votre date de naissance indique {age !== null ? `${age} ans` : 'un âge non valide'}.
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Revenez lorsque vous aurez au moins {ENKAMBA_MINIMUM_AGE} ans. Si cette information est incorrecte, vous pouvez contester.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black">Contester la restriction</label>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Expliquez l’erreur ou la raison de votre demande..."
                className="min-h-28 resize-none"
              />
            </div>

            <Button onClick={submitAppeal} disabled={isSubmitting} className="h-11 w-full bg-primary text-white hover:bg-primary">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Envoyer la contestation</span>}
            </Button>

            <Button variant="outline" onClick={() => router.push('/login')} className="h-11 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
