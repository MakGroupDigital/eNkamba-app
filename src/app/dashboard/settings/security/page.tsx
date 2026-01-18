'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { SecurityIcon } from '@/components/icons/service-icons';
import { Separator } from '@/components/ui/separator';

export default function SecurityPage() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUpdating(false);
    setShowPasswordDialog(false);

    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été modifié avec succès.",
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: enabled ? "2FA activé" : "2FA désactivé",
      description: enabled
        ? "L'authentification à deux facteurs a été activée."
        : "L'authentification à deux facteurs a été désactivée.",
    });
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <SecurityIcon size={28} />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold text-primary">Sécurité & Mot de passe</h1>
            <p className="text-sm text-muted-foreground">Protégez votre compte</p>
          </div>
        </div>
      </header>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Modifier le mot de passe</CardTitle>
          <CardDescription>
            Changez votre mot de passe régulièrement pour sécuriser votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => setShowPasswordDialog(true)}
          >
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Two Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Authentification à deux facteurs (2FA)</CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Authentification à deux facteurs</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled ? "Activé" : "Désactivé"}
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Votre compte est protégé par l'authentification à deux facteurs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Conseils de sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Utilisez un mot de passe unique et complexe.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Activez l'authentification à deux facteurs pour plus de sécurité.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Ne partagez jamais votre mot de passe avec personne.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Déconnectez-vous après avoir utilisé un appareil partagé.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et votre nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 caractères avec lettres et chiffres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button onClick={handlePasswordChange} disabled={isUpdating} className="bg-gradient-to-r from-primary to-green-800">
              {isUpdating ? "Mise à jour..." : "Changer le mot de passe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
