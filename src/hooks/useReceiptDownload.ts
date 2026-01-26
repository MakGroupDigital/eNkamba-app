import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
      // Générer le PDF
      const generateReceiptPDFFn = httpsCallable(functions, 'generateReceiptPDF');
      const result = await generateReceiptPDFFn({
        userId: user.uid,
        transactionId,
      });

      const data = result.data as any;

      if (!data.success || !data.pdf) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      // Convertir base64 en blob
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });

      // Déterminer la plateforme et utiliser la méthode appropriée
      await downloadByPlatform(blob, filename);

      toast({
        title: 'Succès',
        description: 'Reçu téléchargé avec succès',
        className: 'bg-green-600 text-white border-none',
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
            const { Share } = await import('@capacitor/share');
            await Share.share({
              files: [result.uri],
              title: 'Reçu de transaction',
            });
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
          const { Share } = await import('@capacitor/share');
          await Share.share({
            files: [result.uri],
            title: 'Reçu de transaction',
          });
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
