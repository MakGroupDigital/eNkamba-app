'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function getUserDisplayName(userData: any): string {
  return (
    userData?.fullName ||
    userData?.displayName ||
    userData?.name ||
    userData?.email ||
    userData?.phoneNumber ||
    'Contact'
  );
}

export default function MiyikiChatNewConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { createConversation } = useFirestoreConversations();

  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const target = useMemo(() => {
    const userId = (searchParams?.get('userId') || '').trim();
    const contact = (searchParams?.get('contact') || '').trim();
    return { userId, contact };
  }, [searchParams]);

  useEffect(() => {
    if (!user || authLoading) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        setError(null);

        if (!target.userId && !target.contact) {
          router.replace('/dashboard/miyiki-chat');
          return;
        }

        let conversationId = '';

        if (target.userId) {
          const uSnap = await getDoc(doc(db, 'users', target.userId));
          if (!uSnap.exists()) {
            throw new Error('Utilisateur introuvable');
          }
          const otherName = getUserDisplayName(uSnap.data());
          conversationId = await createConversation(target.userId, otherName, 'uid');
        } else {
          // contact = téléphone (contacts-list filtre déjà "sur Kenz")
          conversationId = await createConversation(target.contact, '', 'phone');
        }

        router.replace(`/dashboard/miyiki-chat/${conversationId}`);
      } catch (e: any) {
        const message = e?.message || 'Impossible de démarrer la discussion';
        setError(message);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: message,
        });
      }
    };

    void run();
  }, [authLoading, createConversation, router, target.contact, target.userId, toast, user]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Connectez-vous pour démarrer une discussion.</p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Démarrage de la discussion…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Création de la conversation</span>
          </div>
          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/miyiki-chat">Retour au chat</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

