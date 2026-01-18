
'use client';
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
import { Globe, Search, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const router = useRouter();

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'lin', name: 'Lingala' },
    { code: 'tsh', name: 'Tshiluba' },
    { code: 'swa', name: 'Swahili' },
    { code: 'kg', name: 'Kikongo' },
    { code: 'ar', name: 'العربية' },
  ];

  const handleLanguageChange = (langCode: string) => {
    // La traduction est maintenant activée, mais limitée aux clés disponibles.
    // Pour une traduction complète, il faudra ajouter les textes dans les fichiers /messages/*.json
    // router.replace(pathname, { locale: langCode });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center justify-between gap-4 bg-primary px-4 shadow-md text-primary-foreground">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <Select defaultValue="kinshasa">
          <SelectTrigger className="w-[110px] bg-primary/50 border-primary-foreground/20 text-primary-foreground h-9">
            <SelectValue placeholder="Région" />
          </SelectTrigger>
          <SelectContent>
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
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem key={lang.code} onSelect={() => handleLanguageChange(lang.code)}>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
