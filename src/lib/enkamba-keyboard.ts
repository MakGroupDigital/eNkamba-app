export type EnkambaKeyboardCategory = 'stickers' | 'icons' | 'enbimoji';

export type EnkambaKeyboardItem = {
  id: string;
  category: EnkambaKeyboardCategory;
  symbol: string;
  label: string;
  tone: 'green' | 'orange' | 'gold' | 'blue' | 'violet' | 'rose';
  text: string;
};

const stickerLabels = [
  ['safe-pay', 'Paiement securise', 'Paiement confirme avec eNkamba'],
  ['fast-ugavi', 'Ugavi rapide', 'Livraison lancee'],
  ['makutano-love', 'Makutano love', 'Je valide ton post'],
  ['market-deal', 'Bon marche', 'Bonne affaire trouvee'],
  ['business-ok', 'Business OK', 'Compte business actif'],
  ['cash-in', 'Depot recu', 'Depot confirme'],
  ['cash-out', 'Retrait pret', 'Retrait disponible'],
  ['qr-scan', 'Scan propre', 'QR scanne avec succes'],
  ['support-live', 'Support present', 'Support client disponible'],
  ['verified', 'Verifie', 'Profil verifie eNkamba'],
  ['premium', 'Premium', 'Service premium'],
  ['local-deal', 'Proche de vous', 'Offre proche de vous'],
  ['track-on', 'Tracking actif', 'Suivi active'],
  ['parcel-ok', 'Colis OK', 'Colis bien enregistre'],
  ['agency-ready', 'Agence prete', 'Agence disponible'],
  ['wallet-rich', 'Wallet actif', 'Portefeuille operationnel'],
  ['team-work', 'Equipe solide', 'On avance ensemble'],
  ['thank-you', 'Merci', 'Merci beaucoup'],
  ['welcome', 'Bienvenue', 'Bienvenue sur eNkamba'],
  ['done', 'C est fait', 'Operation terminee'],
  ['in-progress', 'En cours', 'Traitement en cours'],
  ['urgent', 'Urgent', 'Priorite urgente'],
  ['meeting', 'Rendez-vous', 'Rendez-vous confirme'],
  ['invoice', 'Facture', 'Facture disponible'],
  ['receipt', 'Recu', 'Recu genere'],
  ['delivery', 'Livre', 'Livraison terminee'],
  ['hotel', 'Hotel', 'Reservation hotel'],
  ['restaurant', 'Restaurant', 'Commande restaurant'],
  ['flight', 'Vol', 'Billet confirme'],
  ['health', 'Sante', 'Service sante pret'],
  ['school', 'Ecole', 'Paiement scolaire'],
  ['tax', 'Fiscalite', 'Declaration suivie'],
  ['security', 'Securite', 'Action securisee'],
  ['admin', 'Admin', 'Controle admin'],
  ['ai', 'Assistant IA', 'Assistant IA pret'],
  ['community', 'Communaute', 'Communaute connectee'],
  ['promo', 'Promo', 'Promotion active'],
  ['stock', 'Stock', 'Stock disponible'],
  ['client-ok', 'Client OK', 'Client confirme'],
  ['mission', 'Mission', 'Mission acceptee'],
];

const iconLabels = [
  ['pay', 'Payer', 'Paiement eNkamba'],
  ['send', 'Envoyer', 'Envoyer maintenant'],
  ['receive', 'Recevoir', 'Reception ouverte'],
  ['wallet', 'Wallet', 'Portefeuille'],
  ['card', 'Carte', 'Carte eNkamba'],
  ['scan', 'Scanner', 'Scanner QR'],
  ['chat', 'Chat', 'Discussion'],
  ['call', 'Appel', 'Appel rapide'],
  ['map', 'Carte', 'Voir sur carte'],
  ['route', 'Itineraire', 'Itineraire ouvert'],
  ['truck', 'Logistique', 'Transport'],
  ['box', 'Colis', 'Colis'],
  ['ship', 'Bateau', 'Transport maritime'],
  ['plane', 'Avion', 'Transport aerien'],
  ['train', 'Train', 'Transport train'],
  ['bike', 'Moto', 'Livreur moto'],
  ['shop', 'Marche', 'Marche eNkamba'],
  ['store', 'Boutique', 'Boutique'],
  ['supplier', 'Fournisseur', 'Fournisseur'],
  ['factory', 'Entreprise', 'Entreprise'],
  ['hotel', 'Hotel', 'Hotel'],
  ['food', 'Restaurant', 'Restaurant'],
  ['school', 'Ecole', 'Ecole'],
  ['health', 'Sante', 'Sante'],
  ['shield', 'Securite', 'Securite'],
  ['lock', 'Bloque', 'Acces protege'],
  ['bell', 'Alerte', 'Notification'],
  ['star', 'Favori', 'Favori'],
  ['heart', 'Aimer', 'J aime'],
  ['user', 'Contact', 'Contact'],
  ['group', 'Groupe', 'Groupe'],
  ['camera', 'Photo', 'Photo'],
  ['video', 'Video', 'Video'],
  ['mic', 'Vocal', 'Vocal'],
  ['file', 'Fichier', 'Fichier'],
  ['pin', 'Position', 'Position'],
  ['calendar', 'Date', 'Date'],
  ['clock', 'Heure', 'Heure'],
  ['gift', 'Cadeau', 'Cadeau'],
  ['spark', 'Nouveau', 'Nouveaute'],
];

const enbimojiLabels = [
  ['smile', 'Sourire', 'Heureux avec eNkamba'],
  ['respect', 'Respect', 'Respect'],
  ['force', 'Force', 'On avance'],
  ['deal', 'Deal', 'Deal conclu'],
  ['peace', 'Paix', 'Paix'],
  ['clap', 'Bravo', 'Bravo'],
  ['think', 'Reflexion', 'Je reflechis'],
  ['ok', 'OK', 'C est bon'],
  ['sad', 'Triste', 'Pas content'],
  ['wow', 'Wow', 'Incroyable'],
  ['fire', 'Fort', 'Tres fort'],
  ['money', 'Mbongo', 'Mbongo'],
  ['boss', 'Boss', 'Mode boss'],
  ['student', 'Etudiant', 'Apprentissage'],
  ['creator', 'Createur', 'Creation'],
  ['farmer', 'Producteur', 'Producteur'],
  ['driver', 'Chauffeur', 'Chauffeur'],
  ['agent', 'Agent', 'Agent eNkamba'],
  ['client', 'Client', 'Client heureux'],
  ['family', 'Famille', 'Famille'],
  ['diaspora', 'Diaspora', 'Diaspora connectee'],
  ['kin', 'Kinshasa', 'Kin vibes'],
  ['lshi', 'Lubumbashi', 'Lushi vibes'],
  ['goma', 'Goma', 'Goma vibes'],
  ['matadi', 'Matadi', 'Matadi vibes'],
  ['africa', 'Afrique', 'Afrique connectee'],
  ['secure', 'Secure', 'Je suis protege'],
  ['fast', 'Rapide', 'Tres rapide'],
  ['verified', 'Verifie', 'Confiance'],
  ['premium', 'Premium', 'Premium'],
  ['smart', 'Smart', 'Intelligent'],
  ['ai', 'IA', 'Assistant pret'],
  ['live', 'Live', 'En direct'],
  ['focus', 'Focus', 'Concentre'],
  ['win', 'Victoire', 'Victoire'],
  ['thank', 'Merci', 'Merci'],
  ['hello', 'Salut', 'Salut'],
  ['bye', 'A plus', 'A plus'],
  ['wait', 'Patience', 'Un instant'],
  ['launch', 'Lance', 'On lance'],
];

const stickerSymbols = ['🟢', '📦', '💳', '🚚', '✅', '🔐', '📍', '🧾', '💬', '⚡'];
const iconSymbols = ['◉', '◆', '⬢', '▣', '◎', '◇', '✦', '●', '▰', '⬡'];
const enbimojiSymbols = ['😊', '🤝', '💪', '👌', '🕊️', '👏', '🤔', '👍', '😔', '😮', '🔥', '💵'];
const tones: EnkambaKeyboardItem['tone'][] = ['green', 'orange', 'gold', 'blue', 'violet', 'rose'];

const makeItems = (
  source: string[][],
  category: EnkambaKeyboardCategory,
  symbols: string[],
): EnkambaKeyboardItem[] =>
  source.map(([key, label, text], index) => ({
    id: `${category}-${key}`,
    category,
    symbol: symbols[index % symbols.length],
    label,
    tone: tones[index % tones.length],
    text,
  }));

export const ENKAMBA_KEYBOARD_ITEMS: EnkambaKeyboardItem[] = [
  ...makeItems(stickerLabels, 'stickers', stickerSymbols),
  ...makeItems(iconLabels, 'icons', iconSymbols),
  ...makeItems(enbimojiLabels, 'enbimoji', enbimojiSymbols),
];

export const ENKAMBA_KEYBOARD_TOTAL = ENKAMBA_KEYBOARD_ITEMS.length;
