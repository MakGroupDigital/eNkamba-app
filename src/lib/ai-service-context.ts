export type EnkambaServiceContext = {
  name: string;
  app: string;
  route: string;
  capabilities: string[];
  keywords: string[];
};

const ENKAMBA_SERVICE_CONTEXT: EnkambaServiceContext[] = [
  {
    name: 'Marché',
    app: 'marketplace',
    route: '/dashboard/nkampa',
    keywords: ['marche', 'marketplace', 'produit', 'commande', 'boutique', 'vendeur', 'stock', 'facture', 'remboursement', 'fournisseur'],
    capabilities: [
      'rechercher des produits et fournisseurs',
      'ouvrir une boutique',
      'suivre les commandes',
      'gérer le stock vendeur',
      'consulter les factures et demandes de remboursement',
    ],
  },
  {
    name: 'Paiement',
    app: 'wallet',
    route: '/dashboard/wallet',
    keywords: ['paiement', 'wallet', 'portefeuille', 'solde', 'maxicash', 'mobile money', 'retrait', 'qr paiement', 'transaction'],
    capabilities: [
      'consulter le portefeuille',
      'payer avec Kenz Pay ou MaxiCash selon configuration',
      'consulter l’historique des transactions',
      'utiliser le QR code de paiement',
    ],
  },
  {
    name: 'Logistique',
    app: 'ugavi',
    route: '/dashboard/ugavi',
    keywords: ['logistique', 'livraison', 'colis', 'tracking', 'suivi', 'agence', 'ugavi', 'transport', 'itineraire'],
    capabilities: [
      'créer une demande de livraison',
      'choisir un mode de transport',
      'suivre un colis avec numéro, QR code ou code-barres',
      'ouvrir l’itinéraire interne Ugavi pour une commande Marché',
    ],
  },
  {
    name: 'Chat',
    app: 'miyiki-chat',
    route: '/dashboard/miyiki-chat',
    keywords: ['chat', 'message', 'conversation', 'groupe', 'appel', 'qrcode contact', 'traduction'],
    capabilities: [
      'démarrer une conversation',
      'créer ou rejoindre un groupe',
      'appeler un contact',
      'traduire un message reçu',
      'signaler, restreindre ou bloquer une discussion',
    ],
  },
  {
    name: 'Réseau social',
    app: 'makutano',
    route: '/dashboard/makutano',
    keywords: ['reseau social', 'makutano', 'publication', 'story', 'profil', 'amis', 'suivre', 'bloquer'],
    capabilities: [
      'publier une photo, vidéo ou audio',
      'ouvrir un profil public',
      'suivre ou écrire à une personne',
      'restreindre, bloquer ou signaler un contenu',
    ],
  },
  {
    name: 'Administration',
    app: 'admin',
    route: '/admin',
    keywords: ['admin', 'infrastructure', 'logs', 'cyber', 'rapport', 'erreur', 'attaque', 'utilisateur actif'],
    capabilities: [
      'consulter les tableaux de surveillance',
      'ouvrir les logs et erreurs',
      'suivre les activités et alertes cyber',
      'gérer les demandes business et rapports',
    ],
  },
];

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getRelevantEnkambaServices(message: string, limit = 4) {
  const normalizedMessage = normalizeSearchText(message);
  const scored = ENKAMBA_SERVICE_CONTEXT.map((service) => {
    const score = service.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeSearchText(keyword);
      return normalizedMessage.includes(normalizedKeyword) ? total + 1 : total;
    }, 0);
    return { service, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.service);

  return scored.length ? scored : ENKAMBA_SERVICE_CONTEXT.slice(0, limit);
}

export function buildAiPlatformContext(message: string) {
  const services = getRelevantEnkambaServices(message);

  return [
    '=== CONTEXTE DES SERVICES RÉELS KENZ ===',
    ...services.map((service, index) => {
      const capabilities = service.capabilities.map((capability) => `- ${capability}`).join('\n');
      return `${index + 1}. ${service.name} (${service.route})\n${capabilities}`;
    }),
    'Règle: si une action nécessite une interface, oriente l’utilisateur vers la route indiquée au lieu de prétendre exécuter l’action toi-même.',
    '=== FIN CONTEXTE SERVICES ===',
  ].join('\n');
}
