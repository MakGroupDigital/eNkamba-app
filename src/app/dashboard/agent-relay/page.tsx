'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Handshake, 
  Store, 
  MapPin, 
  Shield, 
  Fingerprint, 
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AgentRelayMainPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const agentTypes = [
    {
      id: 'agent-relais',
      title: 'Agent Relais',
      icon: Handshake,
      color: 'bg-[#32BB78] hover:bg-[#32BB78]',
      description: 'Effectuez des transactions pour vos clients'
    },
    {
      id: 'cabinet',
      title: 'Cabiniste',
      icon: Store,
      color: 'bg-[#32BB78] hover:bg-[#2BA169]',
      description: 'Gérez un point de vente fixe'
    },
    {
      id: 'point-service',
      title: 'Point de Service',
      icon: MapPin,
      color: 'bg-[#32BB78] hover:bg-[#2BA169]',
      description: 'Offrez des services eNkamba dans votre commerce'
    }
  ];

  const handleContinue = () => {
    if (selectedType) {
      router.push(`/dashboard/agent-relay/signup?type=${selectedType}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#32BB78] via-[#32BB78] to-[#32BB78]">
      {/* Header avec logo */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-xl">
              <Image 
                src="/enkamba-logo.png" 
                alt="eNkamba Logo" 
                width={64} 
                height={64}
                className="object-contain rounded-full"
              />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">eNkamba-Pay</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-sm font-medium">FR | EN</span>
          </div>
        </div>
      </div>

      {/* Contenu principal sur fond blanc */}
      <div className="bg-white rounded-t-[40px] min-h-screen pt-8 px-6">
        {/* Titre de bienvenue */}
        <div className="text-center mb-8">
          <h1 className="text-[#32BB78] text-2xl font-bold mb-2">
            Bienvenue
          </h1>
          <p className="text-[#32BB78] text-lg font-semibold">
            Agents Relais eNKAMBA Pay
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Choisissez le type d'agent que vous souhaitez devenir
          </p>
        </div>

        {/* Boutons des types d'agents */}
        <div className="space-y-4 mb-8 max-w-md mx-auto">
          {agentTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full p-5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#32BB78] bg-[#32BB78]/10 shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-[#32BB78]/50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-xl ${
                    isSelected ? 'bg-[#32BB78]' : 'bg-gray-100'
                  } flex items-center justify-center transition-colors`}>
                    <Icon size={28} className={isSelected ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">
                      {type.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {type.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={24} className="text-[#32BB78]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Section sécurité */}
        <div className="text-center mb-8 max-w-md mx-auto">
          <h3 className="text-gray-800 text-base font-semibold mb-6">
            Inscription Sécurisée & Anti-Fraude
          </h3>
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-xl bg-[#32BB78]/10 flex items-center justify-center mb-2">
                <Shield size={32} className="text-[#32BB78]" />
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-xl bg-[#32BB78]/10 flex items-center justify-center mb-2">
                <Fingerprint size={32} className="text-[#32BB78]" />
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-xl bg-[#32BB78]/10 flex items-center justify-center mb-2">
                <CheckCircle2 size={32} className="text-[#32BB78]" />
              </div>
            </div>
          </div>
        </div>

        {/* Vagues décoratives */}
        <div className="relative h-24 mb-8">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0C240 40 480 40 720 20C960 0 1200 0 1440 20V120H0V0Z" fill="#32BB78" fillOpacity="0.3"/>
            <path d="M0 20C240 60 480 60 720 40C960 20 1200 20 1440 40V120H0V20Z" fill="#32BB78" fillOpacity="0.2"/>
          </svg>
        </div>

        {/* Bouton Commencer */}
        <div className="max-w-md mx-auto pb-8">
          <Button 
            size="lg" 
            disabled={!selectedType}
            onClick={handleContinue}
            className={`w-full h-14 rounded-xl text-lg font-semibold shadow-lg transition-all ${
              selectedType
                ? 'bg-[#32BB78] hover:bg-[#32BB78] text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedType ? 'Commencer l\'inscription' : 'Sélectionnez un type d\'agent'}
          </Button>
          
          {!selectedType && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Veuillez choisir un type d'agent ci-dessus
            </p>
          )}
        </div>
      </div>
    </div>
  );
}