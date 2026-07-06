'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Video, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@/config/cloudinary.config';

interface BiometricCaptureProps {
  type: 'photo' | 'video';
  onCapture: (url: string) => void;
  capturedUrl?: string | null;
}

export function BiometricCapture({ type, onCapture, capturedUrl }: BiometricCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsVideoReady(false);
      
      console.log('Demande accès caméra...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: type === 'video'
      });
      
      console.log('Caméra accessible, tracks:', mediaStream.getTracks().length);
      console.log('Video tracks:', mediaStream.getVideoTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.getSettings()
      })));
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        console.log('Attribution du stream à la vidéo...');
        const video = videoRef.current;
        
        // Attacher le stream
        video.srcObject = mediaStream;
        
        // Configurer les attributs vidéo
        // Toujours muter l'élément <video> pour éviter le blocage autoplay (NotAllowedError),
        // tout en gardant l'audio capturé côté MediaRecorder quand type === 'video'.
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;
        video.autoplay = true;
        
        console.log('Video element:', {
          srcObject: !!video.srcObject,
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        
        // Écouter les événements
        video.onloadedmetadata = async () => {
          console.log('Métadonnées chargées:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });

          if (video.videoWidth && video.videoHeight) {
            setIsVideoReady(true);
          }

          try {
            await video.play();
            console.log('Play() réussi (metadata)');
          } catch (playError) {
            console.error('Erreur play (metadata):', playError);
          }
        };
        
        video.onloadeddata = () => {
          console.log('Données chargées');
        };
        
        video.oncanplay = () => {
          console.log('Peut jouer');
          setIsVideoReady(true);
        };
        
        video.onplay = () => {
          console.log('Lecture démarrée');
        };
        
        // Forcer le play
        try {
          await video.play();
          console.log('Play() réussi');
        } catch (playError) {
          console.error('Erreur play:', playError);
          // Réessayer après un court délai
          setTimeout(async () => {
            try {
              await video.play();
              console.log('Play() réussi au 2e essai');
            } catch (err2) {
              console.error('Erreur play 2e essai:', err2);
              setError('Erreur lors du démarrage de la vidéo');
            }
          }, 500);
        }
        
        // Fallback: marquer comme prêt après 2 secondes si le stream est actif
        setTimeout(() => {
          if (mediaStream.active && mediaStream.getVideoTracks()[0]?.readyState === 'live') {
            console.log('Fallback: forcer ready car stream actif');
            setIsVideoReady(true);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur accès caméra:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }, [type]);

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setIsVideoReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Upload vers Cloudinary
  const uploadToCloudinary = async (file: Blob, resourceType: 'image' | 'video'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'agent-relay/biometric');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Échec de l\'upload');
    }

    const data = await response.json();
    return data.secure_url;
  };

  // Capturer une photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) {
      setError('Élément vidéo non disponible');
      return;
    }

    const video = videoRef.current;
    
    // Vérifier que la vidéo a des dimensions valides
    if (!video.videoWidth || !video.videoHeight) {
      setError('La vidéo n\'est pas encore prête. Attendez quelques secondes.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      console.log('Capture photo:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });

      // Créer un canvas pour capturer l'image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte canvas');
      }

      // Dessiner l'image (miroir pour correspondre à la prévisualisation)
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

      // Convertir en blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
      });

      if (!blob) {
        throw new Error('Échec de la conversion en image');
      }

      console.log('Blob créé:', blob.size, 'bytes');

      // Upload vers Cloudinary
      const url = await uploadToCloudinary(blob, 'image');
      
      console.log('Upload réussi:', url);
      
      onCapture(url);
      stopCamera();
      setIsUploading(false);
    } catch (err) {
      console.error('Erreur capture photo:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la capture. Réessayez.');
      setIsUploading(false);
    }
  }, [onCapture, stopCamera]);

  // Démarrer l'enregistrement vidéo
  const startRecording = useCallback(() => {
    if (!stream) return;

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsUploading(true);
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          
          // Upload vers Cloudinary
          const url = await uploadToCloudinary(blob, 'video');
          
          onCapture(url);
          stopCamera();
          setIsUploading(false);
        } catch (err) {
          console.error('Erreur upload vidéo:', err);
          setError('Erreur lors de l\'upload. Réessayez.');
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Arrêter automatiquement après 10 secondes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
    } catch (err) {
      console.error('Erreur enregistrement:', err);
      setError('Erreur lors de l\'enregistrement. Réessayez.');
    }
  }, [stream, onCapture, stopCamera]);

  // Arrêter l'enregistrement vidéo
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const isRecording = mediaRecorderRef.current?.state === 'recording';

  return (
    <div className="p-6 rounded-2xl bg-[#0A8B46]/10 border border-[#0A8B46]/30">
      <div className="text-center">
        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-[#0A8B46]/20 flex items-center justify-center">
          {type === 'photo' ? (
            <Camera size={32} className="text-[#0A8B46]" />
          ) : (
            <Video size={32} className="text-[#0A8B46]" />
          )}
        </div>
        
        <h3 className="font-semibold mb-2 text-gray-800">
          {type === 'photo' ? 'Selfie en Direct' : 'Vidéo de Vérification'}
        </h3>
        
        {capturedUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle2 size={20} />
              <span className="text-sm font-medium">
                {type === 'photo' ? 'Photo capturée ✓' : 'Vidéo capturée ✓'}
              </span>
            </div>
            <Button
              onClick={() => onCapture('')}
              variant="outline"
              className="w-full"
            >
              Reprendre
            </Button>
          </div>
        ) : isCapturing ? (
          <div className="space-y-4">
            {/* Aperçu vidéo */}
            <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto min-h-[300px]"
                style={{ 
                  transform: 'scaleX(-1)',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              {!isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center text-white">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Initialisation de la caméra...</p>
                    <p className="text-xs mt-1 text-gray-300">Si l'écran reste noir, vérifiez les permissions</p>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  REC
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-[#0A8B46]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Upload en cours...</span>
              </div>
            ) : !isVideoReady ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Chargement de la caméra...</span>
              </div>
            ) : (
              <div className="flex gap-2">
                {type === 'photo' ? (
                  <Button
                    onClick={capturePhoto}
                    className="flex-1 bg-[#0A8B46] hover:bg-[#0A8B46]"
                  >
                    <Camera size={16} className="mr-2" />
                    Capturer
                  </Button>
                ) : isRecording ? (
                  <Button
                    onClick={stopRecording}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Arrêter
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    className="flex-1 bg-[#0A8B46] hover:bg-[#0A8B46]"
                  >
                    <Video size={16} className="mr-2" />
                    Enregistrer
                  </Button>
                )}
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="icon"
                >
                  <X size={20} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              {type === 'photo' 
                ? 'Prenez un selfie maintenant' 
                : 'Enregistrez une vidéo courte (max 10 secondes)'}
            </p>
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            
            <Button
              onClick={startCamera}
              className="bg-[#0A8B46] hover:bg-[#0A8B46]"
            >
              {type === 'photo' ? (
                <>
                  <Camera size={16} className="mr-2" />
                  Ouvrir la caméra
                </>
              ) : (
                <>
                  <Video size={16} className="mr-2" />
                  Ouvrir la caméra
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
