'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useKycStatus } from '@/hooks/useKycStatus';
import {
  SettingsPageIcon,
  UserProfileIcon,
  SecurityIcon,
  NotificationIcon,
  ThemeIcon,
  LanguageIcon,
  HelpIcon,
  LogoutIcon,
} from '@/components/icons/service-icons';

// Document Icon
const DocumentIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    <path d="M12 4H28L36 12V44H12V4Z" fill="url(#docGrad)" />
    <path d="M28 4V12H36" fill="#0E5A59" />
    <rect x="16" y="18" width="16" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
    <rect x="16" y="24" width="12" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
    <rect x="16" y="30" width="14" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
    <rect x="16" y="36" width="10" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
  </svg>
);

const SettingsItem = ({
  icon: IconComponent,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) => {
  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all group">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconComponent size={28} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div>{action}</div>
      </div>
      <Separator />
    </>
  );
};

interface UserData {
  name: string;
  email: string;
  phone?: string;
}

const USER_STORAGE_KEY = 'enkamba_user';

const getDefaultUser = (): UserData => ({
  name: 'Utilisateur eNkamba',
  email: 'user@enkamba.io',
});

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isKycCompleted } = useKycStatus();
  const [isMounted, setIsMounted] = useState(false);
  const [userData, setUserData] = useState<UserData>(getDefaultUser());

  useEffect(() => {
    setIsMounted(true);
    
    // Récupérer les données utilisateur depuis localStorage
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.email) {
          setUserData(parsed);
        }
      }
    } catch (e) {
      console.error('Erreur lecture données utilisateur:', e);
    }
  }, []);


  const renderThemeSwitcher = () => {
    if (!isMounted) {
      return null;
    }
    
    return (
        <div className='flex items-center gap-2'>
            <Sun className='h-5 w-5' />
            <Switch 
            id="dark-mode" 
            checked={theme === 'dark'}
            onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <Moon className='h-5 w-5' />
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header Card */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-r from-primary via-primary to-green-800 p-6">
          <CardTitle className="flex items-center gap-3 font-headline text-white">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <SettingsPageIcon size={32} />
            </div>
            <div>
              <span className="text-2xl">Paramètres</span>
              <p className="text-sm font-normal text-white/70 mt-1">
                Gérez votre compte et vos préférences
              </p>
            </div>
          </CardTitle>
        </div>
      </Card>

      {/* Profile Section */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-green-800 text-white text-lg font-bold">
                  {userData.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-white" />
            </div>
            <div>
              <p className="text-xl font-bold font-headline">{userData.name}</p>
              <p className="text-muted-foreground">{userData.email}</p>
              {userData.phone && (
                <p className="text-sm text-muted-foreground mt-1">{userData.phone}</p>
              )}
              {isKycCompleted ? (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Profil vérifié
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Profil non vérifié - Veuillez vérifier le KYC
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {!isKycCompleted ? (
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700" asChild>
              <Link href="/kyc">
                <AlertCircle size={18} />
                Vérifier le KYC
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="gap-2">
              <UserProfileIcon size={18} />
              Modifier le Profil
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Preferences & Security */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Préférences & Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ThemeIcon size={28} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Thème</p>
                <p className="text-sm text-muted-foreground">
                  Personnalisez l&apos;apparence de l&apos;application.
                </p>
              </div>
            </div>
            {renderThemeSwitcher()}
          </div>
          <Separator />
          <SettingsItem
            icon={LanguageIcon}
            title="Langue"
            description="Français (FR)"
            action={
              <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                <Link href="/dashboard/settings/language">
                  <ChevronRight />
                </Link>
              </Button>
            }
          />
          <SettingsItem
            icon={NotificationIcon}
            title="Notifications"
            description="Gérez les alertes que vous recevez."
            action={
              <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                <Link href="/dashboard/settings/notifications">
                  <ChevronRight />
                </Link>
              </Button>
            }
          />
          <SettingsItem
            icon={SecurityIcon}
            title="Sécurité & Mot de passe"
            description="Changer de mot de passe, 2FA"
            action={
              <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                <Link href="/dashboard/settings/security">
                  <ChevronRight />
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Support & Legal */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Assistance & Légal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SettingsItem
            icon={HelpIcon}
            title="Centre d'aide"
            description="Trouvez des réponses à vos questions."
            action={
              <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                <Link href="/dashboard/settings/help">
                  <ChevronRight />
                </Link>
              </Button>
            }
          />
          <SettingsItem
            icon={DocumentIcon}
            title="Documents Légaux"
            description="Consultez nos termes et politiques."
            action={
              <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                <Link href="/dashboard/settings/legal">
                  <ChevronRight />
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="pt-4">
        <Button variant="destructive" className="w-full h-14 rounded-xl text-base gap-3 shadow-lg" asChild>
          <Link href="/login">
            <LogoutIcon size={24} />
            Se déconnecter
          </Link>
        </Button>
      </div>
    </div>
  );
}
