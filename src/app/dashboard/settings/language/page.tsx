'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { LanguageIcon } from '@/components/icons/service-icons';

const languages = [
  { code: 'fr', name: 'Français', native: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'swa', name: 'Kiswahili', native: 'Kiswahili', flag: '🇹🇿' },
  { code: 'ln', name: 'Lingala', native: 'Lingála', flag: '🇨🇩' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
];

const LANGUAGE_STORAGE_KEY = 'enkamba_language';

export default function LanguagePage() {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) {
      setSelectedLanguage(saved);
    }
  }, []);

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    const lang = languages.find(l => l.code === code);
    toast({
      title: "Langue mise à jour",
      description: `La langue a été changée en ${lang?.name}.`,
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
            <LanguageIcon size={28} />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold text-primary">Langue</h1>
            <p className="text-sm text-muted-foreground">Sélectionnez votre langue préférée</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Langue de l'application</CardTitle>
          <CardDescription>
            Choisissez la langue dans laquelle vous souhaitez utiliser eNkamba.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedLanguage === language.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <p className="font-semibold">{language.name}</p>
                    <p className="text-sm text-muted-foreground">{language.native}</p>
                  </div>
                </div>
                {selectedLanguage === language.code && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Les modifications prendront effet après rechargement de l'application.</p>
      </div>
    </div>
  );
}
