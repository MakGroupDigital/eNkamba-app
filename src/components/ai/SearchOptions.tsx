'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Brain, Code2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export interface SearchOptionsState {
  searchWeb: boolean;
  analysis: boolean;
  reflection: boolean;
  code: boolean;
}

interface SearchOptionsProps {
  onOptionsChange: (options: SearchOptionsState) => void;
  isLoading?: boolean;
}

export function SearchOptions({ onOptionsChange, isLoading }: SearchOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [options, setOptions] = useState<SearchOptionsState>({
    searchWeb: false,
    analysis: false,
    reflection: false,
    code: false,
  });

  const handleOptionChange = (key: keyof SearchOptionsState) => {
    const newOptions = { ...options, [key]: !options[key] };
    setOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const optionsList = [
    {
      key: 'searchWeb' as const,
      label: 'Recherche Web',
      description: 'Rechercher les informations les plus récentes',
      icon: Search,
      color: 'text-blue-600',
    },
    {
      key: 'analysis' as const,
      label: 'Analyse Approfondie',
      description: 'Analyser en détail le sujet',
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      key: 'reflection' as const,
      label: 'Réflexion',
      description: 'Montrer le processus de réflexion',
      icon: Brain,
      color: 'text-purple-600',
    },
    {
      key: 'code' as const,
      label: 'Générer du Code',
      description: 'Inclure des exemples de code',
      icon: Code2,
      color: 'text-orange-600',
    },
  ];

  return (
    <Card className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-white/50 p-2 rounded transition-colors"
        disabled={isLoading}
      >
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Options de Recherche</span>
          {Object.values(options).some((v) => v) && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {Object.values(options).filter((v) => v).length} actif{Object.values(options).filter((v) => v).length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {optionsList.map(({ key, label, description, icon: Icon, color }) => (
            <div key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Checkbox
                id={key}
                checked={options[key]}
                onCheckedChange={() => handleOptionChange(key)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={key}
                  className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer"
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                  {label}
                </Label>
                <p className="text-xs text-gray-600 mt-1">{description}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOptions({
                  searchWeb: false,
                  analysis: false,
                  reflection: false,
                  code: false,
                });
                onOptionsChange({
                  searchWeb: false,
                  analysis: false,
                  reflection: false,
                  code: false,
                });
              }}
              disabled={isLoading}
            >
              Réinitialiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allEnabled = {
                  searchWeb: true,
                  analysis: true,
                  reflection: true,
                  code: true,
                };
                setOptions(allEnabled);
                onOptionsChange(allEnabled);
              }}
              disabled={isLoading}
            >
              Tout Activer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
