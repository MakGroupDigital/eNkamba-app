
'use client';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Search, MapPin, Loader2, LocateFixed } from 'lucide-react';

type DetectedLocation = {
  quartier: string;
  ville: string;
  region: string;
  pays: string;
  label: string;
  latitude: number;
  longitude: number;
};

const LOCATION_STORAGE_KEY = 'enkamba-dashboard-location';

export default function DashboardHeader() {
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const [locationValue, setLocationValue] = useState('kinshasa');
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'ln', name: 'Lingala' },
    { code: 'tsh', name: 'Tshiluba' },
    { code: 'sw', name: 'Swahili' },
    { code: 'kg', name: 'Kikongo' },
    { code: 'ar', name: 'العربية' },
  ];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem('enkamba-dashboard-language');
    if (storedLanguage) {
      setSelectedLanguage(storedLanguage);
    }

    const storedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation) as DetectedLocation;
        setDetectedLocation(parsedLocation);
        setLocationValue('detected');
      } catch {
        window.localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    window.localStorage.setItem('enkamba-dashboard-language', langCode);
    window.dispatchEvent(new CustomEvent('enkamba-dashboard-language-change', {
      detail: { language: langCode },
    }));
  };

  const detectLocation = () => {
    if (isLocating) return;

    if (!('geolocation' in navigator)) {
      setLocationError('Localisation non disponible sur cet appareil');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/geo/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || 'Impossible de lire votre position');
          }

          const nextLocation = data as DetectedLocation;
          setDetectedLocation(nextLocation);
          setLocationValue('detected');
          window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLocation));
          window.dispatchEvent(new CustomEvent('enkamba-dashboard-location-change', {
            detail: nextLocation,
          }));
        } catch (error) {
          setLocationError(error instanceof Error ? error.message : 'Impossible de lire votre position');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Acces a la position refuse'
          : 'Impossible de recuperer votre position';
        setLocationError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000 * 60 * 5,
      }
    );
  };

  const handleLocationOpenChange = (open: boolean) => {
    setLocationOpen(open);
    if (open && !detectedLocation && !isLocating) {
      detectLocation();
    }
  };

  const handleLocationValueChange = (value: string) => {
    if (value === 'detect') {
      detectLocation();
      return;
    }

    setLocationValue(value);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center justify-between gap-4 bg-primary px-4 shadow-md text-primary-foreground">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <Select
          open={locationOpen}
          onOpenChange={handleLocationOpenChange}
          value={locationValue}
          onValueChange={handleLocationValueChange}
        >
          <SelectTrigger className="w-[150px] sm:w-[260px] bg-primary/50 border-primary-foreground/20 text-primary-foreground h-9">
            {locationValue === 'detected' && detectedLocation ? (
              <span className="truncate" title={detectedLocation.label}>
                {detectedLocation.label}
              </span>
            ) : (
              <SelectValue placeholder="Position" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="detect">
              <span className="flex items-center gap-2">
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Detecter ma position
              </span>
            </SelectItem>
            {detectedLocation && (
              <SelectItem value="detected">
                <span className="flex flex-col">
                  <span className="font-medium">{detectedLocation.quartier || detectedLocation.ville || 'Position detectee'}</span>
                  <span className="text-xs text-muted-foreground">
                    {[detectedLocation.ville, detectedLocation.region, detectedLocation.pays].filter(Boolean).join(', ')}
                  </span>
                </span>
              </SelectItem>
            )}
            {locationError && (
              <SelectItem value="location-error" disabled>
                {locationError}
              </SelectItem>
            )}
            <SelectItem value="kinshasa">Kinshasa</SelectItem>
            <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
            <SelectItem value="goma">Goma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/50" />
        <Input
          type="search"
          placeholder="Recherche..."
          className="bg-primary/50 border-primary-foreground/20 text-primary-foreground h-9 pl-10 placeholder:text-primary-foreground/50"
        />
      </div>

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Changer la langue">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem key={lang.code} onSelect={() => handleLanguageChange(lang.code)}>
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{lang.name}</span>
                  {selectedLanguage === lang.code && <span className="text-xs text-primary">✓</span>}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
