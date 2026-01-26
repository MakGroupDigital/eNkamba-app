'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Copy, Share2, Loader2, Users, TrendingUp, Gift } from 'lucide-react';
import Link from 'next/link';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export default function InvitePage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const generateLinkFn = httpsCallable(functions, 'generateReferralLink');
      const result = await generateLinkFn({
        userId: user.uid,
      });

      const data = result.data as any;

      setReferralCode(data.referralCode);
      setReferralLink(data.referralLink);
      setStats(data.referralStats);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du chargement',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copié',
      description: 'Lien copié dans le presse-papiers',
    });
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
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Inviter des amis
            </h1>
            <p className="text-sm text-muted-foreground">Gagnez des bonus en parrainant</p>
          </div>
        </header>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#32BB78]" />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Referral Link Card */}
            {referralLink && (
              <Card className="border-[#32BB78]/20 bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5">
                <CardHeader>
                  <CardTitle>Votre lien de parrainage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-[#32BB78]/20 break-all font-mono text-sm">
                    {referralLink}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p>
                      ✓ Partagez ce lien avec vos amis<br />
                      ✓ Ils créeront un compte avec votre code de parrainage<br />
                      ✓ Vous gagnerez 0.1 CDF par ami (100 amis = 10 CDF)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(referralLink)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? 'Copié!' : 'Copier'}
                    </Button>
                    <Button
                      onClick={shareLink}
                      className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referral Code Card */}
            {referralCode && (
              <Card>
                <CardHeader>
                  <CardTitle>Votre code de parrainage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-[#32BB78] to-[#2a9d63] p-8 rounded-lg text-center">
                    <p className="text-white text-sm mb-2">Code</p>
                    <p className="text-white text-4xl font-bold font-mono tracking-widest">
                      {referralCode}
                    </p>
                  </div>

                  <Button
                    onClick={() => copyToClipboard(referralCode)}
                    className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier le code
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Parrainages</p>
                        <p className="text-3xl font-bold text-[#32BB78]">{stats.totalReferrals}</p>
                      </div>
                      <div className="p-3 rounded-full bg-[#32BB78]/20">
                        <Users className="w-6 h-6 text-[#32BB78]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Gains</p>
                        <p className="text-3xl font-bold text-[#32BB78]">
                          {stats.totalEarnings.toLocaleString('fr-FR')} CDF
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-[#32BB78]/20">
                        <Gift className="w-6 h-6 text-[#32BB78]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>Comment ça marche?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#32BB78] text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">Partagez votre lien</p>
                      <p className="text-sm text-muted-foreground">Envoyez le lien à vos amis</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#32BB78] text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">Ils créent un compte</p>
                      <p className="text-sm text-muted-foreground">Ils reçoivent votre code de parrainage</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#32BB78] text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">Vous gagnez des bonus</p>
                      <p className="text-sm text-muted-foreground">Recevez des récompenses pour chaque ami</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#32BB78]" />
                  Avantages du parrainage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-[#32BB78]">✓</span>
                    <span>Bonus de bienvenue pour chaque ami</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#32BB78]">✓</span>
                    <span>Commissions sur les transactions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#32BB78]">✓</span>
                    <span>Accès à des offres exclusives</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#32BB78]">✓</span>
                    <span>Pas de limite de parrainage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
