'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QrCode, X, MessageSquare, UserPlus, Loader2, Upload, Camera } from 'lucide-react';
import { useContactQRScanner } from '@/hooks/useContactQRScanner';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';

interface ContactQRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactFound?: (userId: string, displayName: string) => void;
}

export function ContactQRScanner({ open, onOpenChange, onContactFound }: ContactQRScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'image'>('camera');
  const { isScanning, matchedUser, processScannedQR, reset } = useContactQRScanner();

  // Démarrer la caméra
  useEffect(() => {
    if (!open) {
      stopCamera();
      reset();
      setScanMode('camera');
      return;
    }

    if (scanMode === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, scanMode, reset]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.play();
        
        // Attendre que la vidéo soit prête
        videoRef.current.onloadedmetadata = () => {
          setIsInitializing(false);
          startScanning();
        };
      }
    } catch (err: any) {
      console.error('Erreur accès caméra:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || !open) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      // Ajuster la taille du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessiner la frame vidéo
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Obtenir les données d'image
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Décoder le QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && !isScanning) {
        // QR code détecté
        processScannedQR(code.data);
        return; // Arrêter le scan
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    scan();
  };

  const handleStartChat = () => {
    if (matchedUser?.userId) {
      onOpenChange(false);
      router.push(`/dashboard/miyiki-chat/new?userId=${matchedUser.userId}`);
      if (onContactFound) {
        onContactFound(matchedUser.userId, matchedUser.displayName || 'Contact');
      }
    }
  };

  const handleAddContact = () => {
    // TODO: Implémenter l'ajout de contact
    onOpenChange(false);
  };

  const handleClose = () => {
    stopCamera();
    reset();
    setScanMode('camera');
    onOpenChange(false);
  };

  // Scanner une image importée
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 Image sélectionnée:', file.name, file.type, file.size);
    setIsInitializing(true);
    setError(null);

    try {
      // Créer une image à partir du fichier
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log('📖 Fichier lu, création de l\'image...');
        
        img.onload = async () => {
          console.log('🖼️ Image chargée:', img.width, 'x', img.height);
          
          // Créer un canvas pour extraire les données de l'image
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { willReadFrequently: true });
          
          if (!context) {
            console.error('❌ Impossible d\'obtenir le contexte canvas');
            setError('Impossible de traiter l\'image');
            setIsInitializing(false);
            return;
          }

          // Utiliser la taille originale de l'image
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          console.log('🎨 Image dessinée sur canvas');

          // Obtenir les données d'image
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          console.log('📊 Données image extraites:', imageData.width, 'x', imageData.height);

          // Essayer plusieurs méthodes de décodage
          console.log('🔍 Tentative 1: Décodage normal...');
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          // Si échec, essayer avec une image agrandie
          if (!code && (img.width < 500 || img.height < 500)) {
            console.log('🔍 Tentative 2: Agrandissement de l\'image...');
            const scale = Math.max(800 / img.width, 800 / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const scaledImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height, {
              inversionAttempts: 'attemptBoth',
            });
          }

          // Si échec, essayer avec contraste augmenté
          if (!code) {
            console.log('🔍 Tentative 3: Augmentation du contraste...');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            
            const contrastImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = contrastImageData.data;
            
            // Augmenter le contraste
            const factor = 1.5;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, ((data[i] - 128) * factor) + 128);     // R
              data[i + 1] = Math.min(255, ((data[i + 1] - 128) * factor) + 128); // G
              data[i + 2] = Math.min(255, ((data[i + 2] - 128) * factor) + 128); // B
            }
            
            code = jsQR(data, contrastImageData.width, contrastImageData.height, {
              inversionAttempts: 'attemptBoth',
            });
          }

          // Si échec, essayer en niveaux de gris
          if (!code) {
            console.log('🔍 Tentative 4: Conversion en niveaux de gris...');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            
            const grayImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = grayImageData.data;
            
            // Convertir en niveaux de gris
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
            
            code = jsQR(data, grayImageData.width, grayImageData.height, {
              inversionAttempts: 'attemptBoth',
            });
          }

          if (code && code.data) {
            console.log('✅ QR code détecté:', code.data);
            setIsInitializing(false);
            await processScannedQR(code.data);
          } else {
            console.warn('⚠️ Aucun QR code trouvé dans l\'image après toutes les tentatives');
            setError('Aucun QR code trouvé dans l\'image. Assurez-vous que l\'image est claire et bien cadrée.');
            setIsInitializing(false);
          }
        };

        img.onerror = () => {
          console.error('❌ Erreur chargement image');
          setError('Impossible de charger l\'image');
          setIsInitializing(false);
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        console.error('❌ Erreur lecture fichier');
        setError('Erreur lors de la lecture du fichier');
        setIsInitializing(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('❌ Erreur scan image:', err);
      setError(err.message || 'Erreur lors du scan de l\'image');
      setIsInitializing(false);
    }

    // Réinitialiser l'input pour permettre de sélectionner la même image
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Scanner un QR Code de Contact
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Boutons de mode */}
          {!matchedUser && (
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setScanMode('camera');
                  setError(null);
                }}
                className="flex-1 gap-2"
                disabled={isInitializing || isScanning}
              >
                <Camera className="h-4 w-4" />
                Caméra
              </Button>
              <Button
                variant={scanMode === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  stopCamera();
                  setScanMode('image');
                  setError(null);
                }}
                className="flex-1 gap-2"
                disabled={isInitializing || isScanning}
              >
                <Upload className="h-4 w-4" />
                Image
              </Button>
            </div>
          )}

          {/* Input caché pour l'image */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          {/* Zone de scan */}
          {!matchedUser && scanMode === 'camera' && (
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay de scan */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                </div>
              </div>

              {/* État de chargement */}
              {(isInitializing || isScanning) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">
                      {isInitializing ? 'Initialisation...' : 'Scan en cours...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                  <div className="text-center text-white">
                    <X className="h-12 w-12 mx-auto mb-2 text-red-500" />
                    <p className="text-sm">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      className="mt-4"
                    >
                      Réessayer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Résultat du scan */}
          {matchedUser && (
            <div className="space-y-4">
              {matchedUser.found ? (
                <>
                  {/* Contact trouvé */}
                  <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary to-primary rounded-lg border border-primary/20">
                    <Avatar className="h-20 w-20 border-4 border-primary">
                      <AvatarImage src={matchedUser.profileImage} />
                      <AvatarFallback className="bg-primary text-white text-xl font-bold">
                        {matchedUser.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {matchedUser.displayName}
                      </p>
                      {matchedUser.email && (
                        <p className="text-sm text-primary">{matchedUser.email}</p>
                      )}
                      {matchedUser.phone && (
                        <p className="text-sm text-primary">{matchedUser.phone}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-primary">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-medium">Sur eNkamba</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartChat}
                      className="flex-1 gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Discuter
                    </Button>
                    <Button
                      onClick={handleAddContact}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Contact non trouvé */}
                  <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                    <div className="h-20 w-20 rounded-full bg-amber-500 flex items-center justify-center">
                      <UserPlus className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-900">
                        Contact non trouvé
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Ce contact n'est pas encore sur eNkamba
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full"
                  >
                    Fermer
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Mode image - Message d'attente ou traitement */}
          {!matchedUser && scanMode === 'image' && (
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
              {isInitializing ? (
                <div className="text-center p-6">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-lg font-semibold mb-2">Traitement en cours...</p>
                  <p className="text-sm text-muted-foreground">
                    Analyse de l'image et recherche du QR code
                  </p>
                </div>
              ) : error ? (
                <div className="text-center p-6">
                  <X className="h-16 w-16 mx-auto mb-4 text-red-500" />
                  <p className="text-lg font-semibold mb-2 text-red-600">{error}</p>
                  <Button
                    onClick={() => {
                      setError(null);
                      imageInputRef.current?.click();
                    }}
                    variant="outline"
                    className="mt-4 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Réessayer
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6">
                  <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold mb-2">Importer une image</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sélectionnez une image contenant un QR code
                  </p>
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choisir une image
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!matchedUser && !error && scanMode === 'camera' && (
            <p className="text-xs text-center text-muted-foreground">
              Pointez la caméra vers le QR code du contact
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
