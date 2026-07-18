
'use client';
import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Search } from 'lucide-react';

type DashboardHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
};

export default function DashboardHeader({
  searchValue,
  onSearchChange,
  onSearchKeyDown,
  searchPlaceholder = 'Recherche...',
}: DashboardHeaderProps = {}) {
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

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
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    window.localStorage.setItem('enkamba-dashboard-language', langCode);
    window.dispatchEvent(new CustomEvent('enkamba-dashboard-language-change', {
      detail: { language: langCode },
    }));
  };

  return (
    <header className="fixed left-0 right-0 top-10 z-20 flex h-12 items-center justify-end gap-3 bg-primary px-4 shadow-md text-primary-foreground">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/50" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          onKeyDown={onSearchKeyDown}
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
