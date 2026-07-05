'use client';

import { Button } from '@/components/ui/button';
import { X, FileText } from 'lucide-react';
import { useState } from 'react';

interface AgentContractProps {
  agentType: string;
  onAccept: () => void;
  onClose: () => void;
}

const contracts = {
  'agent-relais': {
    title: 'Contrat Agent Relais eNkamba-Pay',
    sections: [
      {
        title: '1. Objet du Contrat',
        content: 'Le présent contrat définit les conditions dans lesquelles vous, en tant qu\'Agent Relais eNkamba-Pay, êtes autorisé à effectuer des transactions financières pour le compte de clients utilisant la plateforme eNkamba-Pay.'
      },
      {
        title: '2. Obligations de l\'Agent Relais',
        content: `Vous vous engagez à :
• Effectuer les transactions avec diligence et professionnalisme
• Vérifier l'identité des clients avant chaque transaction
• Maintenir un niveau de liquidité suffisant pour servir vos clients
• Respecter les procédures de sécurité et anti-fraude
• Tenir une comptabilité précise de toutes les transactions
• Protéger les données personnelles des clients`
      },
      {
        title: '3. Commissions et Rémunération',
        content: `Vous percevrez une commission sur chaque transaction effectuée selon le barème suivant :
• Dépôt : 1% du montant (min 100 FC)
• Retrait : 1.5% du montant (min 150 FC)
• Transfert : 0.5% du montant (min 50 FC)
Les commissions sont créditées instantanément sur votre compte agent.`
      },
      {
        title: '4. Responsabilités',
        content: `Vous êtes responsable de :
• La sécurité de votre code PIN et de vos identifiants
• Toute transaction effectuée depuis votre compte
• Les erreurs de manipulation lors des transactions
• Le respect des limites de transaction définies par eNkamba`
      },
      {
        title: '5. Durée et Résiliation',
        content: 'Ce contrat est conclu pour une durée indéterminée. Chaque partie peut y mettre fin moyennant un préavis de 30 jours. eNkamba se réserve le droit de suspendre ou résilier le contrat en cas de manquement grave aux obligations.'
      },
      {
        title: '6. Confidentialité',
        content: 'Vous vous engagez à maintenir la confidentialité de toutes les informations clients et des données de transaction auxquelles vous avez accès dans le cadre de votre activité d\'agent.'
      }
    ]
  },
  'cabinet': {
    title: 'Contrat Cabiniste eNkamba-Pay',
    sections: [
      {
        title: '1. Objet du Contrat',
        content: 'Le présent contrat définit les conditions dans lesquelles vous, en tant que Cabiniste eNkamba-Pay, êtes autorisé à gérer un point de vente fixe pour effectuer des transactions financières pour le compte de clients utilisant la plateforme eNkamba-Pay.'
      },
      {
        title: '2. Obligations du Cabiniste',
        content: `Vous vous engagez à :
• Maintenir un point de vente fixe et identifiable
• Afficher clairement votre statut de Cabiniste eNkamba-Pay
• Disposer d'un espace d'accueil approprié pour les clients
• Maintenir un niveau de liquidité élevé (minimum 500,000 FC)
• Former et superviser tout personnel assistant
• Respecter les horaires d'ouverture déclarés
• Tenir une comptabilité rigoureuse`
      },
      {
        title: '3. Commissions et Rémunération',
        content: `En tant que Cabiniste, vous bénéficiez de commissions préférentielles :
• Dépôt : 1.2% du montant (min 120 FC)
• Retrait : 1.8% du montant (min 180 FC)
• Transfert : 0.7% du montant (min 70 FC)
• Bonus mensuel selon le volume de transactions
Les commissions sont créditées instantanément sur votre compte cabinet.`
      },
      {
        title: '4. Infrastructure et Équipement',
        content: `Vous devez disposer de :
• Un local commercial approprié
• Une connexion internet stable
• Un système de sécurité adéquat
• Un coffre-fort pour la gestion des liquidités
• Une signalétique eNkamba-Pay visible`
      },
      {
        title: '5. Responsabilités',
        content: `Vous êtes responsable de :
• La sécurité du point de vente et des fonds
• La formation et les actions de votre personnel
• Le respect des normes de sécurité et d'hygiène
• La gestion des liquidités et de la trésorerie
• Toute transaction effectuée depuis votre cabinet`
      },
      {
        title: '6. Durée et Résiliation',
        content: 'Ce contrat est conclu pour une durée de 2 ans renouvelable. Résiliation possible avec préavis de 60 jours. eNkamba peut résilier immédiatement en cas de manquement grave.'
      }
    ]
  },
  'point-service': {
    title: 'Contrat Point de Service eNkamba-Pay',
    sections: [
      {
        title: '1. Objet du Contrat',
        content: 'Le présent contrat définit les conditions dans lesquelles vous, en tant que Point de Service eNkamba-Pay, êtes autorisé à offrir des services eNkamba dans votre commerce existant.'
      },
      {
        title: '2. Obligations du Point de Service',
        content: `Vous vous engagez à :
• Intégrer les services eNkamba dans votre commerce existant
• Afficher la signalétique eNkamba-Pay
• Former votre personnel aux procédures eNkamba
• Maintenir un niveau de liquidité minimum (200,000 FC)
• Respecter les procédures de sécurité
• Effectuer les transactions avec professionnalisme`
      },
      {
        title: '3. Commissions et Rémunération',
        content: `Vous percevrez une commission sur chaque transaction :
• Dépôt : 0.8% du montant (min 80 FC)
• Retrait : 1.2% du montant (min 120 FC)
• Transfert : 0.4% du montant (min 40 FC)
• Bonus trimestriel selon la fidélité des clients
Les commissions sont créditées instantanément.`
      },
      {
        title: '4. Intégration dans votre Commerce',
        content: `eNkamba-Pay s'intègre facilement dans votre activité :
• Pas besoin de local dédié
• Formation rapide de votre personnel
• Support technique disponible 24/7
• Matériel de signalétique fourni
• Application mobile simple d'utilisation`
      },
      {
        title: '5. Responsabilités',
        content: `Vous êtes responsable de :
• La sécurité de vos identifiants
• Les transactions effectuées depuis votre compte
• La formation de votre personnel
• Le respect des procédures eNkamba
• La gestion de votre trésorerie eNkamba`
      },
      {
        title: '6. Durée et Résiliation',
        content: 'Ce contrat est conclu pour une durée indéterminée. Résiliation possible avec préavis de 15 jours. Suspension possible en cas de non-respect des obligations.'
      }
    ]
  }
};

export function AgentContract({ agentType, onAccept, onClose }: AgentContractProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contract = contracts[agentType as keyof typeof contracts] || contracts['agent-relais'];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#479B67]/10 flex items-center justify-center">
              <FileText size={20} className="text-[#479B67]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{contract.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onScroll={handleScroll}
        >
          {contract.sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold text-gray-800">{section.title}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}

          {/* Scroll indicator */}
          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-white via-white to-transparent text-center">
              <p className="text-xs text-gray-500 animate-pulse">
                ↓ Faites défiler pour lire tout le contrat ↓
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#479B67]/10">
            <FileText size={16} className="text-[#479B67] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              En acceptant ce contrat, vous confirmez avoir lu et compris l'ensemble des termes et conditions.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={onAccept}
              disabled={!hasScrolledToBottom}
              className={`flex-1 h-12 rounded-xl ${
                hasScrolledToBottom
                  ? 'bg-[#479B67] hover:bg-[#479B67]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {hasScrolledToBottom ? 'J\'accepte' : 'Lisez le contrat'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
