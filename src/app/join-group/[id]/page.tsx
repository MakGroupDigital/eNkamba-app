'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users, Check, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuth();

  const [groupData, setGroupData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Charger les infos du groupe
  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId || !user) return;

      try {
        const convRef = doc(db, 'conversations', groupId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) {
          setError('Ce groupe n\'existe pas ou a été supprimé');
          setIsLoading(false);
          return;
        }

        const data = convSnap.data();
        
        // Vérifier si c'est bien un groupe
        if (!data.isGroup && data.participants.length <= 2) {
          setError('Ce lien ne correspond pas à un groupe');
          setIsLoading(false);
          return;
        }

        // Vérifier si l'utilisateur est déjà membre
        if (data.participants.includes(user.uid)) {
          setAlreadyMember(true);
        }

        setGroupData({
          id: groupId,
          name: data.name || 'Groupe',
          participants: data.participants || [],
          participantNames: data.participantNames || [],
          createdAt: data.createdAt,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur chargement groupe:', err);
        setError('Impossible de charger les informations du groupe');
        setIsLoading(false);
      }
    };

    loadGroupData();
  }, [groupId, user]);

  // Rejoindre le groupe
  const handleJoinGroup = async () => {
    if (!user || !groupData) return;

    setIsJoining(true);
    try {
      const convRef = doc(db, 'conversations', groupId);
      
      // Ajouter l'utilisateur aux participants
      await updateDoc(convRef, {
        participants: arrayUnion(user.uid),
        participantNames: arrayUnion(user.displayName || user.email || 'Utilisateur'),
        updatedAt: new Date(),
      });

      // Rediriger vers la conversation
      router.push(`/dashboard/miyiki-chat/${groupId}`);
    } catch (err) {
      console.error('Erreur rejoindre groupe:', err);
      setError('Impossible de rejoindre le groupe. Veuillez réessayer.');
      setIsJoining(false);
    }
  };

  // Redirection si non authentifié
  useEffect(() => {
    if (!user && !isLoading) {
      router.push(`/login?redirect=/join-group/${groupId}`);
    }
  }, [user, isLoading, router, groupId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#32BB78] mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du groupe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Erreur</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Link href="/dashboard/miyiki-chat">
            <Button className="w-full gap-2 bg-[#32BB78] hover:bg-[#2a9d63]">
              <ArrowLeft className="h-4 w-4" />
              Retour aux conversations
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-[#32BB78]/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-[#32BB78]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Déjà membre</h1>
            <p className="text-muted-foreground">
              Vous êtes déjà membre de ce groupe
            </p>
          </div>
          <Link href={`/dashboard/miyiki-chat/${groupId}`}>
            <Button className="w-full gap-2 bg-[#32BB78] hover:bg-[#2a9d63]">
              Ouvrir la conversation
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5 p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto bg-[#32BB78]/20">
            <AvatarFallback className="bg-[#32BB78]/20 text-[#32BB78]">
              <Users className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold mb-2">Rejoindre le groupe</h1>
            <p className="text-xl font-semibold text-[#32BB78]">
              {groupData?.name}
            </p>
          </div>
        </div>

        {/* Infos du groupe */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Membres</span>
            <span className="font-semibold">{groupData?.participants?.length || 0}</span>
          </div>
          {groupData?.createdAt && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Créé le</span>
              <span className="font-semibold">
                {new Date(groupData.createdAt.toDate()).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleJoinGroup}
            disabled={isJoining}
            className="w-full gap-2 bg-[#32BB78] hover:bg-[#2a9d63]"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejoindre...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Rejoindre le groupe
              </>
            )}
          </Button>
          <Link href="/dashboard/miyiki-chat">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Annuler
            </Button>
          </Link>
        </div>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          En rejoignant ce groupe, vous pourrez voir tous les messages et participer aux conversations.
        </p>
      </Card>
    </div>
  );
}
