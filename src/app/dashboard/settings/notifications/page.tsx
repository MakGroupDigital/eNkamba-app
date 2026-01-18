'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { NotificationIcon } from '@/components/icons/service-icons';
import { Separator } from '@/components/ui/separator';

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  transactions: boolean;
  promotions: boolean;
  security: boolean;
  updates: boolean;
}

const NOTIFICATION_STORAGE_KEY = 'enkamba_notifications';

const defaultSettings: NotificationSettings = {
  push: true,
  email: true,
  sms: false,
  transactions: true,
  promotions: true,
  security: true,
  updates: true,
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur lecture notifications:', e);
      }
    }
  }, []);

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings));
    toast({
      title: "Préférences mises à jour",
      description: "Vos paramètres de notifications ont été sauvegardés.",
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
            <NotificationIcon size={28} />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold text-primary">Notifications</h1>
            <p className="text-sm text-muted-foreground">Gérez les alertes que vous recevez</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Canaux de notification</CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez recevoir vos notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Notifications push</p>
              <p className="text-sm text-muted-foreground">Recevoir des notifications sur votre appareil</p>
            </div>
            <Switch
              checked={settings.push}
              onCheckedChange={(checked) => updateSetting('push', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Notifications par email</p>
              <p className="text-sm text-muted-foreground">Recevoir des notifications par email</p>
            </div>
            <Switch
              checked={settings.email}
              onCheckedChange={(checked) => updateSetting('email', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Notifications SMS</p>
              <p className="text-sm text-muted-foreground">Recevoir des notifications par SMS</p>
            </div>
            <Switch
              checked={settings.sms}
              onCheckedChange={(checked) => updateSetting('sms', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Types de notifications</CardTitle>
          <CardDescription>
            Sélectionnez les types de notifications que vous souhaitez recevoir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Transactions</p>
              <p className="text-sm text-muted-foreground">Alertes pour vos transactions financières</p>
            </div>
            <Switch
              checked={settings.transactions}
              onCheckedChange={(checked) => updateSetting('transactions', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Promotions</p>
              <p className="text-sm text-muted-foreground">Offres spéciales et promotions</p>
            </div>
            <Switch
              checked={settings.promotions}
              onCheckedChange={(checked) => updateSetting('promotions', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Sécurité</p>
              <p className="text-sm text-muted-foreground">Alertes de sécurité importantes</p>
            </div>
            <Switch
              checked={settings.security}
              onCheckedChange={(checked) => updateSetting('security', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all">
            <div>
              <p className="font-semibold">Mises à jour</p>
              <p className="text-sm text-muted-foreground">Nouvelles fonctionnalités et mises à jour</p>
            </div>
            <Switch
              checked={settings.updates}
              onCheckedChange={(checked) => updateSetting('updates', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
