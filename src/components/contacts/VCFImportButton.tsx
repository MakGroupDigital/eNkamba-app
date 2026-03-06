'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useContactsImport } from '@/hooks/useContactsImport';

interface VCFImportButtonProps {
  onImportComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function VCFImportButton({
  onImportComplete,
  variant = 'outline',
  size = 'default',
  className,
}: VCFImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isImporting, importVCFContacts } = useContactsImport();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un fichier VCF
    if (!file.name.endsWith('.vcf') && !file.type.includes('vcard')) {
      alert('Veuillez sélectionner un fichier VCF valide');
      return;
    }

    // Importer automatiquement tous les contacts
    const result = await importVCFContacts(file);
    
    // Réinitialiser l'input pour permettre de réimporter le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Callback après import
    if (onImportComplete) {
      onImportComplete();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Import en cours...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Importer VCF
          </>
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".vcf,text/vcard,text/x-vcard"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
