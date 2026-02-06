'use client';

import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// ==================== ICÔNES DE TRANSACTIONS MODERNES ====================

// Dépôt - Argent qui entre avec flèche descendante
export const DepositTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="depositGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Portefeuille/Coffre */}
    <rect x="8" y="24" width="32" height="18" rx="3" fill="url(#depositGrad)" />
    <rect x="12" y="28" width="24" height="10" rx="2" fill="#0E5A59" />
    {/* Symbole dollar */}
    <circle cx="24" cy="33" r="4" fill="#32BB78" />
    <text x="24" y="36" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">$</text>
    {/* Flèche descendante (argent qui entre) */}
    <path d="M24 4V20" stroke="#32BB78" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 14L24 20L30 14" stroke="#32BB78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Pièces qui tombent */}
    <circle cx="16" cy="8" r="3" fill="#FF8C00" />
    <text x="16" y="10" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    <circle cx="32" cy="12" r="3" fill="#FF8C00" />
    <text x="32" y="14" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    {/* Sparkles */}
    <circle cx="12" cy="20" r="1.5" fill="#32BB78" opacity="0.6" />
    <circle cx="36" cy="18" r="1.5" fill="#32BB78" opacity="0.6" />
  </svg>
);

// Retrait - Argent qui sort avec flèche montante
export const WithdrawalTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="withdrawalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E53935" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
    </defs>
    {/* Portefeuille/Coffre */}
    <rect x="8" y="22" width="32" height="18" rx="3" fill="url(#withdrawalGrad)" />
    <rect x="12" y="26" width="24" height="10" rx="2" fill="#C62828" />
    {/* Symbole dollar */}
    <circle cx="24" cy="31" r="4" fill="#E53935" />
    <text x="24" y="34" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">$</text>
    {/* Flèche montante (argent qui sort) */}
    <path d="M24 18V4" stroke="#E53935" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 10L24 4L30 10" stroke="#E53935" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Billets qui sortent */}
    <rect x="14" y="6" width="8" height="5" rx="1" fill="#FF8C00" />
    <rect x="26" y="8" width="8" height="5" rx="1" fill="#FF8C00" />
    {/* Lignes de mouvement */}
    <path d="M10 14L6 14" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M38 16L42 16" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// Envoi - Enveloppe avec flèche d'envoi
export const SendTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="sendTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Enveloppe */}
    <path d="M6 14H42V34C42 36.2 40.2 38 38 38H10C7.8 38 6 36.2 6 34V14Z" fill="url(#sendTxGrad)" />
    {/* Rabat */}
    <path d="M6 14L24 26L42 14" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 14L24 24L42 14" fill="#E67E00" />
    {/* Symbole dollar sur l'enveloppe */}
    <circle cx="24" cy="28" r="5" fill="#fff" opacity="0.9" />
    <text x="24" y="31" textAnchor="middle" fontSize="6" fill="#FF8C00" fontWeight="bold">$</text>
    {/* Flèche d'envoi rapide */}
    <path d="M34 8L42 12L34 16" stroke="#32BB78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M42 12H30" stroke="#32BB78" strokeWidth="2.5" strokeLinecap="round" />
    {/* Lignes de vitesse */}
    <path d="M28 6L32 6" stroke="#32BB78" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M26 10L30 10" stroke="#32BB78" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// Réception - Main qui reçoit de l'argent
export const ReceiveTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="receiveTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Main ouverte (paume) */}
    <path d="M8 28C8 28 8 20 12 18C14 17 16 18 16 20V28" stroke="url(#receiveTxGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M20 28V16C20 14 22 13 24 14C26 15 26 16 26 18V28" stroke="url(#receiveTxGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M30 28V18C30 16 32 15 34 16C36 17 36 18 36 20V28" stroke="url(#receiveTxGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Paume */}
    <path d="M8 28C8 32 12 36 20 38C28 36 36 32 36 28H8Z" fill="url(#receiveTxGrad)" />
    {/* Poignet */}
    <rect x="14" y="38" width="16" height="6" rx="2" fill="#0E5A59" />
    {/* Billets qui tombent dans la main */}
    <rect x="18" y="4" width="12" height="8" rx="1" fill="#FF8C00" />
    <circle cx="24" cy="8" r="3" fill="#E67E00" />
    <text x="24" y="10" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    {/* Flèche descendante */}
    <path d="M24 14V22" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 18L24 22L28 18" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Sparkles */}
    <circle cx="10" cy="24" r="1.5" fill="#32BB78" />
    <circle cx="38" cy="24" r="1.5" fill="#32BB78" />
  </svg>
);

// Paiement - Carte de crédit avec validation
export const PaymentTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="paymentTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2196F3" />
        <stop offset="100%" stopColor="#1565C0" />
      </linearGradient>
    </defs>
    {/* Carte de crédit */}
    <rect x="4" y="14" width="36" height="22" rx="3" fill="url(#paymentTxGrad)" />
    {/* Bande magnétique */}
    <rect x="4" y="20" width="36" height="4" fill="#1565C0" />
    {/* Puce */}
    <rect x="8" y="28" width="8" height="6" rx="1" fill="#FFD700" />
    <rect x="9" y="29" width="6" height="4" rx="0.5" fill="#FFA000" />
    {/* Lignes de carte */}
    <rect x="20" y="28" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
    <rect x="20" y="32" width="8" height="2" rx="1" fill="#fff" opacity="0.6" />
    {/* Check de validation */}
    <circle cx="38" cy="10" r="8" fill="#32BB78" />
    <path d="M34 10L37 13L42 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Ondes de paiement sans contact */}
    <path d="M26 10C28 10 30 12 30 14" stroke="#32BB78" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
    <path d="M24 8C27 8 30 11 30 14" stroke="#32BB78" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

// Demande d'argent - Main avec point d'interrogation
export const RequestTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="requestTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="100%" stopColor="#7B1FA2" />
      </linearGradient>
    </defs>
    {/* Main tendue (demande) */}
    <path d="M10 26L10 14C10 12 12 10 14 10C16 10 18 12 18 14V24" stroke="url(#requestTxGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M22 26L22 12C22 10 24 8 26 8C28 8 30 10 30 12V24" stroke="url(#requestTxGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M34 26L34 14C34 12 36 10 38 10C40 10 42 12 42 14V24" stroke="url(#requestTxGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Paume */}
    <path d="M10 26C10 30 14 34 22 36C30 34 38 30 38 26H10Z" fill="url(#requestTxGrad)" />
    {/* Poignet */}
    <rect x="16" y="36" width="16" height="6" rx="2" fill="#7B1FA2" />
    {/* Bulle de demande avec point d'interrogation */}
    <circle cx="26" cy="40" r="6" fill="#FF8C00" />
    <text x="26" y="44" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">?</text>
    {/* Symbole dollar flottant */}
    <circle cx="8" cy="8" r="4" fill="#32BB78" />
    <text x="8" y="10" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">$</text>
    {/* Flèches pointillées */}
    <path d="M12 10L18 16" stroke="#32BB78" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// Épargne - Tirelire moderne
export const SavingsTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="savingsTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Corps de la tirelire */}
    <ellipse cx="24" cy="26" rx="16" ry="12" fill="url(#savingsTxGrad)" />
    {/* Fente pour pièces */}
    <rect x="18" y="16" width="12" height="3" rx="1.5" fill="#0E5A59" />
    {/* Pattes */}
    <rect x="12" y="34" width="4" height="6" rx="2" fill="#0E5A59" />
    <rect x="32" y="34" width="4" height="6" rx="2" fill="#0E5A59" />
    {/* Oreille */}
    <ellipse cx="36" cy="20" rx="4" ry="3" fill="#32BB78" stroke="#0E5A59" strokeWidth="1" />
    {/* Queue en tire-bouchon */}
    <path d="M38 28C40 28 40 30 38 30C36 30 36 32 38 32" stroke="#0E5A59" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Œil */}
    <circle cx="32" cy="24" r="2" fill="#fff" />
    <circle cx="32.5" cy="24" r="1" fill="#0E5A59" />
    {/* Pièce qui tombe */}
    <circle cx="24" cy="8" r="5" fill="#FF8C00" stroke="#E67E00" strokeWidth="1" />
    <text x="24" y="11" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">$</text>
    {/* Lignes de mouvement */}
    <path d="M20 10L22 12" stroke="#FF8C00" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    <path d="M28 10L26 12" stroke="#FF8C00" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    {/* Sparkles */}
    <path d="M40 12L41 14L43 13L42 15L44 16L42 16L41 18L40 16L38 16L40 15L39 13L41 14L40 12Z" fill="#FFE066" />
  </svg>
);

// Paiement en masse - Plusieurs personnes recevant
export const BulkPaymentTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="bulkPayTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="100%" stopColor="#7B1FA2" />
      </linearGradient>
    </defs>
    {/* Personne 1 */}
    <circle cx="12" cy="12" r="4" fill="#32BB78" />
    <path d="M8 18C8 16 10 16 12 16C14 16 16 16 16 18V24H8V18Z" fill="#32BB78" />
    {/* Personne 2 (centrale) */}
    <circle cx="24" cy="10" r="5" fill="url(#bulkPayTxGrad)" />
    <path d="M18 18C18 15 21 15 24 15C27 15 30 15 30 18V26H18V18Z" fill="url(#bulkPayTxGrad)" />
    {/* Personne 3 */}
    <circle cx="36" cy="12" r="4" fill="#FF8C00" />
    <path d="M32 18C32 16 34 16 36 16C38 16 40 16 40 18V24H32V18Z" fill="#FF8C00" />
    {/* Billets distribués */}
    <rect x="10" y="30" width="8" height="6" rx="1" fill="#32BB78" />
    <text x="14" y="35" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    <rect x="20" y="32" width="8" height="6" rx="1" fill="#9C27B0" />
    <text x="24" y="37" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    <rect x="30" y="30" width="8" height="6" rx="1" fill="#FF8C00" />
    <text x="34" y="35" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    {/* Flèches de distribution */}
    <path d="M14 26L14 30" stroke="#32BB78" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 28L24 32" stroke="#9C27B0" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M34 26L34 30" stroke="#FF8C00" strokeWidth="1.5" strokeLinecap="round" />
    {/* Source centrale */}
    <circle cx="24" cy="42" r="4" fill="#0E5A59" />
    <text x="24" y="45" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">$</text>
  </svg>
);

// Transfert - Échange entre deux portefeuilles
export const TransferTransactionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="transferTxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Portefeuille gauche */}
    <rect x="4" y="16" width="16" height="16" rx="2" fill="url(#transferTxGrad)" />
    <rect x="6" y="18" width="12" height="10" rx="1" fill="#E67E00" />
    <circle cx="12" cy="23" r="3" fill="#FF8C00" />
    <text x="12" y="25" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    {/* Portefeuille droit */}
    <rect x="28" y="16" width="16" height="16" rx="2" fill="#32BB78" />
    <rect x="30" y="18" width="12" height="10" rx="1" fill="#0E5A59" />
    <circle cx="36" cy="23" r="3" fill="#32BB78" />
    <text x="36" y="25" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    {/* Flèches d'échange */}
    <path d="M20 20L28 20" stroke="#32BB78" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M25 17L28 20L25 23" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M28 28L20 28" stroke="#E67E00" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M23 25L20 28L23 31" stroke="#E67E00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Billet en transit */}
    <rect x="20" y="6" width="8" height="5" rx="1" fill="#FFD700" />
    <text x="24" y="10" textAnchor="middle" fontSize="3" fill="#E67E00" fontWeight="bold">$</text>
  </svg>
);

// Export des icônes
export const TransactionIcons = {
  deposit: DepositTransactionIcon,
  withdrawal: WithdrawalTransactionIcon,
  send: SendTransactionIcon,
  receive: ReceiveTransactionIcon,
  payment: PaymentTransactionIcon,
  request: RequestTransactionIcon,
  savings: SavingsTransactionIcon,
  bulkPayment: BulkPaymentTransactionIcon,
  transfer: TransferTransactionIcon,
};
