import { doc, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Dépôt', withdrawal: 'Retrait', transfer_sent: 'Transfert envoyé', transfer_received: 'Transfert reçu',
  payment_sent: 'Paiement effectué', payment_received: 'Paiement reçu', payment: 'Paiement', refund: 'Remboursement',
  nkampa_purchase: 'Achat Nkampa', nkampa_sale: 'Vente Nkampa', currency_conversion: 'Conversion de devises',
};

function asDate(value: any): Date {
  if (value?.toDate) return value.toDate();
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** Reçu PDF d'une transaction du wallet, à partir des données enregistrées. */
export function buildReceiptPdf(transactionId: string, tx: Record<string, any>): Blob {
  const amount = Number(tx.amount || 0);
  const currency = typeof tx.currency === 'string' && tx.currency ? tx.currency : 'CDF';
  const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} ${currency}`;
  const pdf = new jsPDF();
  pdf.setFillColor(7, 59, 154);
  pdf.rect(0, 0, 210, 32, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.text('Kenz Pay', 15, 17);
  pdf.setFontSize(10);
  pdf.text('Reçu de transaction', 15, 24);
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(16);
  pdf.text(TYPE_LABELS[tx.type] || 'Transaction', 15, 48);
  pdf.setFontSize(22);
  pdf.text(money(amount), 15, 62);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const counterpart = tx.recipientName || tx.senderName || tx.recipientId || tx.senderId;
  const lines = [
    `Référence : ${tx.reference || transactionId}`,
    `Date : ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(asDate(tx.timestamp || tx.createdAt))}`,
    `Statut : ${tx.status === 'completed' ? 'Confirmé' : tx.status === 'pending' ? 'En cours' : tx.status || '—'}`,
    ...(counterpart ? [`${tx.type?.includes('received') ? 'De' : 'À'} : ${counterpart}`] : []),
    ...(tx.description ? [`Description : ${tx.description}`] : []),
    ...(tx.paymentMethod || tx.withdrawalMethod ? [`Moyen : ${tx.paymentMethod || tx.withdrawalMethod}`] : []),
    ...(typeof tx.previousBalance === 'number' && typeof tx.newBalance === 'number'
      ? [`Solde avant : ${money(tx.previousBalance)}`, `Solde après : ${money(tx.newBalance)}`] : []),
  ];
  pdf.text(lines, 15, 78, { maxWidth: 180, lineHeightFactor: 1.8 });
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Reçu électronique Kenz Pay. Vérifiable à partir de sa référence auprès du support Kenz.', 15, 287, { maxWidth: 180 });
  return pdf.output('blob');
}

export function useReceiptDownload() {
  const { user } = useAuth();
  const { toast } = useToast();

  const downloadReceipt = async (transactionId: string, filename: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Utilisateur non authentifié',
      });
      return;
    }

    try {
      // Reçu généré dans l'app à partir de la transaction (la Cloud Function generateReceiptPDF n'est plus disponible).
      const snapshot = await getDoc(doc(db, 'users', user.uid, 'transactions', transactionId));
      if (!snapshot.exists()) {
        throw new Error('Transaction introuvable');
      }
      const blob = buildReceiptPdf(transactionId, snapshot.data());

      // Déterminer la plateforme et utiliser la méthode appropriée
      await downloadByPlatform(blob, filename);

      toast({
        title: 'Succès',
        description: 'Reçu téléchargé avec succès',
        className: 'bg-primary text-white border-none',
      });
    } catch (error: any) {
      console.error('Erreur téléchargement reçu:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du téléchargement',
      });
    }
  };

  return { downloadReceipt };
}

/**
 * Télécharger le fichier selon la plateforme
 */
async function downloadByPlatform(blob: Blob, filename: string) {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMac = /macintosh|mac os x/.test(userAgent);
  const isWindows = /windows|win32/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  // iOS - Utiliser la méthode native iOS
  if (isIOS) {
    await downloadIOS(blob, filename);
  }
  // macOS - Utiliser la méthode native macOS
  else if (isMac && !isIOS) {
    await downloadMacOS(blob, filename);
  }
  // Windows - Utiliser la méthode native Windows
  else if (isWindows) {
    await downloadWindows(blob, filename);
  }
  // Android - Utiliser la méthode native Android
  else if (isAndroid) {
    await downloadAndroid(blob, filename);
  }
  // Fallback - Méthode standard pour tous les navigateurs
  else {
    downloadStandard(blob, filename);
  }
}

/**
 * Téléchargement standard (fonctionne sur tous les navigateurs)
 */
function downloadStandard(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Téléchargement iOS natif
 */
async function downloadIOS(blob: Blob, filename: string) {
  try {
    // Vérifier si on est dans une WebView (Capacitor)
    if ((window as any).Capacitor) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        try {
          const result = await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents,
          });

          // Ouvrir le fichier
          if ((window as any).Capacitor?.isNativePlatform?.()) {
            await tryShareFile(result.uri);
          }
        } catch (error) {
          console.error('Erreur iOS:', error);
          downloadStandard(blob, filename);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Fallback pour Safari
      downloadStandard(blob, filename);
    }
  } catch (error) {
    console.error('Erreur iOS:', error);
    downloadStandard(blob, filename);
  }
}

/**
 * Téléchargement macOS natif
 */
async function downloadMacOS(blob: Blob, filename: string) {
  try {
    // Vérifier si on est dans une WebView (Capacitor)
    if ((window as any).Capacitor) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        try {
          await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents,
          });
        } catch (error) {
          console.error('Erreur macOS:', error);
          downloadStandard(blob, filename);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Fallback pour Safari
      downloadStandard(blob, filename);
    }
  } catch (error) {
    console.error('Erreur macOS:', error);
    downloadStandard(blob, filename);
  }
}

/**
 * Téléchargement Windows natif
 */
async function downloadWindows(blob: Blob, filename: string) {
  try {
    // Vérifier si on est dans une WebView (Capacitor)
    if ((window as any).Capacitor) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        try {
          await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents,
          });
        } catch (error) {
          console.error('Erreur Windows:', error);
          downloadStandard(blob, filename);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Fallback pour Edge/Chrome
      downloadStandard(blob, filename);
    }
  } catch (error) {
    console.error('Erreur Windows:', error);
    downloadStandard(blob, filename);
  }
}

/**
 * Téléchargement Android natif
 */
async function downloadAndroid(blob: Blob, filename: string) {
  try {
    // Vérifier si on est dans une WebView (Capacitor)
    if ((window as any).Capacitor) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        try {
          const result = await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents,
          });

          // Partager le fichier
          await tryShareFile(result.uri);
        } catch (error) {
          console.error('Erreur Android:', error);
          downloadStandard(blob, filename);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Fallback pour Chrome
      downloadStandard(blob, filename);
    }
  } catch (error) {
    console.error('Erreur Android:', error);
    downloadStandard(blob, filename);
  }
}

/**
 * Partage un fichier via Capacitor si disponible, sinon via Web Share API.
 */
async function tryShareFile(fileUri: string) {
  const sharePlugin = (window as any).Capacitor?.Plugins?.Share;

  if (sharePlugin?.share) {
    await sharePlugin.share({
      files: [fileUri],
      title: 'Reçu de transaction',
    });
    return;
  }

  if (navigator.share) {
    await navigator.share({
      title: 'Reçu de transaction',
      url: fileUri,
    });
  }
}
