'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Copy, Gift, Loader2, Share2, Users } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { functions } from '@/lib/firebase';

type ReferralStats = {
  totalReferrals: number;
  totalEarnings: number;
};

export default function AgentOpsReferralPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  const loadReferralData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const generateLinkFn = httpsCallable(functions, 'generateReferralLink');
      const result = await generateLinkFn({ userId: user.uid });
      const data = result.data as any;
      setReferralCode(data.referralCode || null);
      setReferralLink(data.referralLink || null);
      setStats(data.referralStats || null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || 'Erreur lors du chargement',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      void loadReferralData();
    }
  }, [user, loadReferralData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Copié', description: 'Copié dans le presse‑papiers.' });
  };

  const shareLink = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoignez eNkamba',
          text: 'Rejoignez eNkamba et recevez des bonus de parrainage!',
          url: referralLink,
        });
      } catch {
        // ignore
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  const earningsText = useMemo(() => {
    if (!stats) return '--';
    return `${stats.totalEarnings.toLocaleString('fr-FR')} CDF`;
  }, [stats]);

  if (!user) return null;

  return (
    <AgentOpsShell title="Parrainage" subtitle="Inviter des amis et gagner des bonus.">
      <div className="space-y-4">
        {isLoading ? (
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-10 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#32BB78] mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Chargement...</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="rounded-2xl border border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Parrainages</div>
                      <div className="text-3xl font-bold text-gray-900 tabular-nums">
                        {stats?.totalReferrals ?? 0}
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#32BB78]/10 flex items-center justify-center">
                      <Users className="text-[#32BB78]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Gains</div>
                      <div className="text-3xl font-bold text-gray-900 tabular-nums">{earningsText}</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#32BB78]/10 flex items-center justify-center">
                      <Gift className="text-[#32BB78]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {referralLink && (
              <Card className="rounded-2xl border border-[#32BB78]/20 bg-gradient-to-br from-[#32BB78]/10 to-[#32BB78]/5">
                <CardHeader>
                  <CardTitle>Votre lien de parrainage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-[#32BB78]/20 break-all font-mono text-sm">
                    {referralLink}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => copyToClipboard(referralLink)}
                      variant="outline"
                      className="h-12 rounded-xl"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? 'Copié!' : 'Copier'}
                    </Button>
                    <Button
                      onClick={shareLink}
                      className="h-12 rounded-xl bg-[#32BB78] hover:bg-[#32BB78] text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {referralCode && (
              <Card className="rounded-2xl border border-gray-200">
                <CardHeader>
                  <CardTitle>Votre code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-[#32BB78] to-[#32BB78] p-8 rounded-2xl text-center">
                    <div className="text-white/90 text-sm mb-2">Code</div>
                    <div className="text-white text-4xl font-bold font-mono tracking-widest">{referralCode}</div>
                  </div>

                  <Button
                    onClick={() => copyToClipboard(referralCode)}
                    className="w-full h-12 rounded-xl bg-[#32BB78] hover:bg-[#32BB78] text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier le code
                  </Button>
                </CardContent>
              </Card>
            )}

            {!referralLink && !referralCode && (
              <Card className="rounded-2xl border border-gray-200">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-600">
                    Données de parrainage indisponibles. Réessaie.
                  </div>
                  <Button
                    onClick={() => void loadReferralData()}
                    className="mt-4 h-12 rounded-xl bg-[#32BB78] hover:bg-[#32BB78] text-white"
                  >
                    Recharger
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AgentOpsShell>
  );
}

