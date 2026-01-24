"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "CD", name: "Congo (RDC)", dialCode: "+243", flag: "🇨🇩" },
  { code: "CG", name: "Congo (Brazzaville)", dialCode: "+242", flag: "🇨🇬" },
  { code: "CM", name: "Cameroun", dialCode: "+237", flag: "🇨🇲" },
  { code: "GA", name: "Gabon", dialCode: "+241", flag: "🇬🇦" },
  { code: "GQ", name: "Guinée Équatoriale", dialCode: "+240", flag: "🇬🇶" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮" },
  { code: "BJ", name: "Bénin", dialCode: "+229", flag: "🇧🇯" },
  { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬" },
  { code: "NE", name: "Niger", dialCode: "+227", flag: "🇳🇪" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫" },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "TZ", name: "Tanzanie", dialCode: "+255", flag: "🇹🇿" },
  { code: "UG", name: "Ouganda", dialCode: "+256", flag: "🇺🇬" },
  { code: "RW", name: "Rwanda", dialCode: "+250", flag: "🇷🇼" },
  { code: "BW", name: "Botswana", dialCode: "+267", flag: "🇧🇼" },
  { code: "ZA", name: "Afrique du Sud", dialCode: "+27", flag: "🇿🇦" },
  { code: "EG", name: "Égypte", dialCode: "+20", flag: "🇪🇬" },
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦" },
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
];

interface PhoneCountrySelectorProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  selectedCountry: Country | null;
  onCountrySelect: (country: Country) => void;
  isLoading?: boolean;
}

export function PhoneCountrySelector({
  phone,
  onPhoneChange,
  selectedCountry,
  onCountrySelect,
  isLoading = false,
}: PhoneCountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setIsOpen(false);
    setSearchQuery("");
    // Réinitialiser le numéro avec juste l'indicatif
    onPhoneChange(country.dialCode + " ");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Empêcher de supprimer l'indicatif
    if (selectedCountry && !value.startsWith(selectedCountry.dialCode)) {
      value = selectedCountry.dialCode + " " + value.replace(selectedCountry.dialCode, "").trim();
    }
    
    onPhoneChange(value);
  };

  return (
    <div className="space-y-2">
      {!selectedCountry ? (
        // Étape 1: Sélection du pays
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Sélectionnez votre pays</label>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={isLoading}
              className="w-full bg-white/90 border-0 text-black rounded-lg p-3 flex items-center justify-between hover:bg-white transition-colors disabled:opacity-50"
            >
              <span className="text-gray-600">Choisir un pays...</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 border border-gray-200"
                >
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un pays..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#32BB78]"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => handleCountrySelect(country)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{country.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900">{country.name}</p>
                              <p className="text-xs text-gray-500">{country.dialCode}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        Aucun pays trouvé
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        // Étape 2: Saisie du numéro avec indicatif
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Numéro de téléphone</label>
          <div className="flex items-center gap-2 bg-white/90 rounded-lg p-3 border-0">
            <button
              onClick={() => {
                onCountrySelect(null);
                onPhoneChange("");
                setSearchQuery("");
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm font-medium text-gray-700"
            >
              <span className="text-xl">{selectedCountry.flag}</span>
              <span>{selectedCountry.dialCode}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <input
              type="tel"
              placeholder="99 123 45 67"
              value={phone.replace(selectedCountry.dialCode, "").trim()}
              onChange={handlePhoneChange}
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 text-lg"
            />
          </div>
          <p className="text-xs text-white/70">
            Numéro complet: <span className="font-mono font-bold">{phone}</span>
          </p>
        </div>
      )}
    </div>
  );
}
