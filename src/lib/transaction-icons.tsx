import { 
  DepositTransactionIcon,
  WithdrawalTransactionIcon,
  SendTransactionIcon,
  ReceiveTransactionIcon,
  PaymentTransactionIcon,
  RequestTransactionIcon,
  SavingsTransactionIcon,
  BulkPaymentTransactionIcon,
  TransferTransactionIcon
} from '@/components/icons/transaction-icons';
import { Wallet } from 'lucide-react';

export type TransactionType = 
  | 'deposit' 
  | 'transfer_sent' 
  | 'transfer_received' 
  | 'withdrawal' 
  | 'payment_link' 
  | 'contact_payment' 
  | 'money_request_sent' 
  | 'money_request_received'
  | 'payment'
  | 'savings_deposit'
  | 'savings_withdrawal';

interface TransactionIconConfig {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  bgColor: string;
  iconColor: string;
  label: string;
}

/**
 * Retourne la configuration d'icône pour un type de transaction donné
 * Utilise les icônes modernes personnalisées eNkamba
 */
export function getTransactionIconConfig(type: TransactionType): TransactionIconConfig {
  const configs: Record<TransactionType, TransactionIconConfig> = {
    // Dépôt - Icône personnalisée de dépôt (argent qui entre)
    deposit: {
      icon: DepositTransactionIcon,
      bgColor: 'bg-[#32BB78]/20',
      iconColor: 'text-[#32BB78]',
      label: 'Dépôt'
    },
    
    // Envoi - Icône personnalisée d'envoi (enveloppe avec flèche)
    transfer_sent: {
      icon: SendTransactionIcon,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'Envoi'
    },
    
    // Réception - Icône personnalisée de réception (main qui reçoit)
    transfer_received: {
      icon: ReceiveTransactionIcon,
      bgColor: 'bg-[#32BB78]/20',
      iconColor: 'text-[#32BB78]',
      label: 'Réception'
    },
    
    // Retrait - Icône de retrait (argent qui sort)
    withdrawal: {
      icon: WithdrawalTransactionIcon,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      label: 'Retrait'
    },
    
    // Paiement par lien - Carte avec validation
    payment_link: {
      icon: PaymentTransactionIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Lien de paiement'
    },
    
    // Paiement contact - Carte avec validation
    contact_payment: {
      icon: PaymentTransactionIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Paiement contact'
    },
    
    // Paiement générique - Carte avec validation
    payment: {
      icon: PaymentTransactionIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Paiement'
    },
    
    // Demande d'argent envoyée - Main avec point d'interrogation
    money_request_sent: {
      icon: RequestTransactionIcon,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      label: 'Demande envoyée'
    },
    
    // Demande d'argent reçue - Main avec point d'interrogation
    money_request_received: {
      icon: RequestTransactionIcon,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      label: 'Demande reçue'
    },
    
    // Dépôt épargne - Tirelire avec pièce
    savings_deposit: {
      icon: SavingsTransactionIcon,
      bgColor: 'bg-[#32BB78]/20',
      iconColor: 'text-[#32BB78]',
      label: 'Épargne'
    },
    
    // Retrait épargne - Tirelire
    savings_withdrawal: {
      icon: SavingsTransactionIcon,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'Retrait épargne'
    }
  };

  return configs[type] || {
    icon: ({ className, size }) => <Wallet className={className} size={size} />,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    label: 'Transaction'
  };
}

/**
 * Composant d'icône de transaction avec style unifié
 */
interface TransactionIconProps {
  type: TransactionType;
  size?: number;
  className?: string;
}

export function TransactionIcon({ type, size = 24, className = '' }: TransactionIconProps) {
  const config = getTransactionIconConfig(type);
  const Icon = config.icon;
  
  return (
    <div className={`p-3 rounded-full flex-shrink-0 ${config.bgColor} ${className}`}>
      <Icon className={`${config.iconColor}`} size={size} />
    </div>
  );
}
