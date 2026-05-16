'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, Mic, MapPin, X, Check, Clock, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStories } from '@/hooks/useStories';
import { StoryType } from '@/types/story.types';
import { LocationStoryCreator } from '@/components/stories/LocationStoryCreator';

export default function CreateStoryPage() {
  const router = useRouter();
  const { createStory } = useStories();
  const [mode, setMode] = useState<StoryType | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60); // 1h par défaut
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Durée: 30 min à 3 jours (4320 minutes)
  const minDuration = 30; // 30 minutes
  const maxDuration = 4320; // 3 jours en minutes

  // Formater la durée pour l'affichage
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
    }
  };

  useEffect(() => {
    // Démarrer la caméra automatiquement pour photo (désactivé - on utilise maintenant le menu d'options)
    // if (mode === 'photo' && !previewUrl && !streamRef.current) {
    //   startCamera();
    // }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [mode, previewUrl]);

  // Connecter le stream au videoRef quand la caméra est active
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error('Erreur lecture vidéo:', err));
    }
  }, [isCameraActive]);

  const startCamera = async (cameraFacingMode = facingMode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: mode === 'video'
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (error) {
      console.error('Erreur caméra:', error);
      alert('Impossible d\'accéder à la caméra');
      setIsCameraActive(false);
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setIsCameraActive(false);
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacingMode);
    await startCamera(nextFacingMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setMediaFile(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
          setShowMediaOptions(false);
        }
      }, 'image/jpeg');
    }
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], 'video.webm', { type: 'video/webm' });
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
      setShowMediaOptions(false);
      setIsRecording(false);
    };
    
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
        setMediaFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
        setShowMediaOptions(false);
        setIsRecording(false);
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur micro:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const resetMediaState = () => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setPreviewUrl(null);
    setSelectedLocation(null);
  };

  const getAcceptForMode = (storyMode: StoryType): string => {
    if (storyMode === 'video') return 'video/*';
    if (storyMode === 'audio') return 'audio/*';
    return 'image/*';
  };

  const handleMediaFileSelected = (file: File) => {
    if (!mode) return;
    if (mode === 'video' && !file.type.startsWith('video/')) {
      alert('Veuillez sélectionner un fichier vidéo valide.');
      return;
    }
    if (mode === 'audio' && !file.type.startsWith('audio/')) {
      alert('Veuillez sélectionner un fichier audio valide.');
      return;
    }
    if (mode === 'photo' && !file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    stopCamera();
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowMediaOptions(false);
  };

  const handlePickFile = () => {
    if (!mode || mode === 'location') return;
    stopCamera();
    mediaInputRef.current?.click();
  };

  const handlePublish = async () => {
    if (!mode) return;
    if (mode === 'location' && !selectedLocation) {
      alert('Veuillez d’abord sélectionner votre position.');
      return;
    }
    if (mode !== 'location' && !mediaFile) {
      alert('Veuillez sélectionner un média avant publication.');
      return;
    }
    
    setLoading(true);
    try {
      await createStory(
        mode,
        durationMinutes,
        mediaFile || undefined,
        mode === 'location' ? selectedLocation || undefined : undefined,
        caption
      );
      router.push('/dashboard/miyiki-chat?tab=stories');
    } catch (error: any) {
      console.error('Erreur publication:', error);
      alert(error?.message || 'Erreur lors de la publication de la story');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPublish = () => {
    setShowConfirmation(false);
    handlePublish();
  };

  const locationPreviewSrc = selectedLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.longitude - 0.01}%2C${selectedLocation.latitude - 0.01}%2C${selectedLocation.longitude + 0.01}%2C${selectedLocation.latitude + 0.01}&layer=mapnik&marker=${selectedLocation.latitude}%2C${selectedLocation.longitude}`
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <input
        ref={mediaInputRef}
        type="file"
        accept={mode ? getAcceptForMode(mode) : '*/*'}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleMediaFileSelected(file);
          e.currentTarget.value = '';
        }}
      />

      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between bg-black/20 p-4 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          <X size={24} />
        </Button>
        <h1 className="text-white font-bold text-lg">Créer une Story</h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-28">
        <div className="mx-auto w-full max-w-md space-y-4 py-4">
        {!mode ? (
          /* Mode Selection */
          <div className="w-full space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Que voulez-vous partager?</h2>
              <p className="text-white/80">Choisissez un type de contenu</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { resetMediaState(); setMode('photo'); setShowMediaOptions(true); }}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Camera size={48} className="text-white" />
                <span className="text-white font-semibold">Photo</span>
              </button>

              <button
                onClick={() => { resetMediaState(); setMode('video'); setShowMediaOptions(true); }}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Video size={48} className="text-white" />
                <span className="text-white font-semibold">Vidéo</span>
              </button>

              <button
                onClick={() => { resetMediaState(); setMode('audio'); setShowMediaOptions(true); }}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Mic size={48} className="text-white" />
                <span className="text-white font-semibold">Audio</span>
              </button>

              <button
                onClick={() => { resetMediaState(); setMode('location'); }}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <MapPin size={48} className="text-white" />
                <span className="text-white font-semibold">Localisation</span>
              </button>
            </div>
          </div>
        ) : showMediaOptions && mode === 'photo' && !previewUrl ? (
          /* Photo Options Menu */
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Photo Story</h2>
              <p className="text-white/80">Choisissez une option</p>
            </div>
            
            <button
              onClick={() => { setShowMediaOptions(false); startCamera(); }}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Prendre une photo</p>
                <p className="text-white/70 text-sm">Utiliser la caméra maintenant</p>
              </div>
            </button>
            
            <button
              onClick={handlePickFile}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Upload size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Importer une photo</p>
                <p className="text-white/70 text-sm">Choisir depuis la galerie</p>
              </div>
            </button>
            
            <button
              onClick={() => { setShowMediaOptions(false); setMode(null); }}
              className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all text-white font-semibold"
            >
              Annuler
            </button>
          </div>
        ) : mode === 'photo' && !previewUrl && !isCameraActive ? (
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Ajouter une photo</h2>
              <p className="text-white/80">Prenez une photo ou importez une image</p>
            </div>
            <button
              onClick={() => startCamera()}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Prendre une photo</p>
                <p className="text-white/70 text-sm">Ouvrir la caméra</p>
              </div>
            </button>
            <button
              onClick={handlePickFile}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Upload size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Importer une photo</p>
                <p className="text-white/70 text-sm">Choisir une image sur l’appareil</p>
              </div>
            </button>
            <button
              onClick={() => setMode(null)}
              className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all text-white font-semibold"
            >
              Retour
            </button>
          </div>
        ) : mode === 'photo' && !previewUrl && isCameraActive ? (
          /* Camera View */
          <div className="relative w-full aspect-[9/16] max-h-[calc(100dvh-8rem)] rounded-3xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Bouton changer de caméra */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <Camera size={20} className="text-white" />
            </button>
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
              <button
              onClick={() => { stopCamera(); setShowMediaOptions(true); }}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <X size={24} className="text-white" />
              </button>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/50 hover:scale-110 transition-transform"
              />
              <button
                onClick={handlePickFile}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <Upload size={24} className="text-white" />
              </button>
            </div>
          </div>
        ) : showMediaOptions && mode === 'video' && !previewUrl ? (
          /* Video Options Menu */
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Vidéo Story</h2>
              <p className="text-white/80">Choisissez une option</p>
            </div>
            
            <button
              onClick={() => { setShowMediaOptions(false); startCamera(); }}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <Video size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Filmer maintenant</p>
                <p className="text-white/70 text-sm">Enregistrer une vidéo en direct</p>
              </div>
            </button>
            
            <button
              onClick={handlePickFile}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Upload size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Importer une vidéo</p>
                <p className="text-white/70 text-sm">Choisir depuis la galerie</p>
              </div>
            </button>
            
            <button
              onClick={() => { setShowMediaOptions(false); setMode(null); }}
              className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all text-white font-semibold"
            >
              Annuler
            </button>
          </div>
        ) : showMediaOptions && mode === 'audio' && !previewUrl ? (
          /* Audio Options Menu */
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Audio Story</h2>
              <p className="text-white/80">Choisissez une option</p>
            </div>
            
            <button
              onClick={() => { setShowMediaOptions(false); startAudioRecording(); }}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Mic size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Enregistrer maintenant</p>
                <p className="text-white/70 text-sm">Enregistrer un message audio</p>
              </div>
            </button>
            
            <button
              onClick={() => { setShowMediaOptions(false); handlePickFile(); }}
              className="w-full p-6 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Upload size={32} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-lg">Importer un audio</p>
                <p className="text-white/70 text-sm">Choisir depuis les fichiers</p>
              </div>
            </button>
            
            <button
              onClick={() => { setShowMediaOptions(false); setMode(null); }}
              className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all text-white font-semibold"
            >
              Annuler
            </button>
          </div>
        ) : mode === 'video' && !previewUrl && isCameraActive ? (
          /* Video Recording View */
          <div className="relative w-full aspect-[9/16] max-h-[calc(100dvh-8rem)] rounded-3xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Bouton changer de caméra */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <Camera size={20} className="text-white" />
            </button>
            
            {/* Timer si en enregistrement */}
            {isRecording && (
              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-red-500 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <span className="text-white font-bold text-sm">REC</span>
              </div>
            )}
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={() => { stopCamera(); setMode(null); }}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <X size={24} className="text-white" />
              </button>
              <button
                onClick={isRecording ? stopVideoRecording : startVideoRecording}
                className={`w-20 h-20 rounded-full border-4 border-white/50 hover:scale-110 transition-transform ${
                  isRecording ? 'bg-red-500' : 'bg-white'
                }`}
              >
                {isRecording && <div className="w-8 h-8 bg-white rounded-sm" />}
              </button>
              <button
                onClick={handlePickFile}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <Upload size={24} className="text-white" />
              </button>
            </div>
          </div>
        ) : mode === 'audio' && !previewUrl && isRecording ? (
          /* Audio Recording View */
          <div className="w-full rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 p-8">
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center animate-pulse">
                <Mic size={64} className="text-white" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white font-bold text-xl">Enregistrement...</span>
                </div>
                <p className="text-white/80 text-sm">Parlez maintenant</p>
              </div>
              
              {/* Visualisation audio */}
              <div className="flex items-center justify-center gap-1 h-16">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/60 rounded-full animate-pulse"
                    style={{
                      height: `${18 + ((i * 11) % 52)}px`,
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                ))}
              </div>
              
              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={() => { stopAudioRecording(); stopCamera(); setMode(null); }}
                  className="px-6 py-3 rounded-full bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={stopAudioRecording}
                  className="px-8 py-3 rounded-full bg-white text-purple-600 font-bold hover:bg-white/90 transition-all"
                >
                  Terminer
                </button>
              </div>
            </div>
          </div>
        ) : (mode === 'video' || mode === 'audio') && !previewUrl ? (
          <div className="w-full rounded-3xl border-2 border-dashed border-white/30 bg-white/10 p-8 text-center">
            <p className="mb-4 text-white/90">
              {mode === 'video' ? 'Sélectionnez une vidéo à publier' : 'Sélectionnez un audio à publier'}
            </p>
            <Button onClick={handlePickFile} className="gap-2 bg-white text-purple-700 hover:bg-white/90">
              <Upload size={18} />
              Choisir un fichier
            </Button>
          </div>
        ) : mode === 'location' && !selectedLocation ? (
          <div className="w-full h-[70vh] rounded-3xl overflow-hidden">
            <LocationStoryCreator
              onComplete={(location) => setSelectedLocation(location)}
              onCancel={() => setMode(null)}
            />
          </div>
        ) : (
          /* Preview & Settings */
          <div className="w-full space-y-4 pb-8">
            {previewUrl && (
              <div className="max-h-[42dvh] rounded-3xl overflow-hidden bg-white/10">
                {mode === 'audio' ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-700 to-pink-700 p-6">
                    <Mic size={56} className="text-white" />
                    <audio src={previewUrl} controls className="w-full" />
                  </div>
                ) : mode === 'video' ? (
                  <video src={previewUrl} controls className="max-h-[42dvh] w-full object-cover" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-h-[42dvh] min-h-[220px] w-full object-cover" />
                )}
              </div>
            )}
            {mode === 'location' && locationPreviewSrc && (
              <div className="aspect-[9/16] rounded-3xl overflow-hidden bg-black relative">
                <iframe
                  title="Aperçu position story"
                  src={locationPreviewSrc}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 p-2 text-xs text-white">
                  {selectedLocation?.address || `${selectedLocation?.latitude.toFixed(6)}, ${selectedLocation?.longitude.toFixed(6)}`}
                </div>
              </div>
            )}

            {/* Duration Slider */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-white" />
                  <span className="text-white font-semibold">Durée de visibilité</span>
                </div>
                <span className="text-white font-bold text-lg">{formatDuration(durationMinutes)}</span>
              </div>
              
              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={minDuration}
                  max={maxDuration}
                  step={30}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${((durationMinutes - minDuration) / (maxDuration - minDuration)) * 100}%, rgba(255,255,255,0.2) ${((durationMinutes - minDuration) / (maxDuration - minDuration)) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <style jsx>{`
                  .slider-thumb::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  }
                  .slider-thumb::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  }
                `}</style>
              </div>
              
              {/* Quick presets */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setDurationMinutes(60)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    durationMinutes === 60 ? 'bg-white text-purple-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  1h
                </button>
                <button
                  onClick={() => setDurationMinutes(180)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    durationMinutes === 180 ? 'bg-white text-purple-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  3h
                </button>
                <button
                  onClick={() => setDurationMinutes(1440)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    durationMinutes === 1440 ? 'bg-white text-purple-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  24h
                </button>
                <button
                  onClick={() => setDurationMinutes(4320)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    durationMinutes === 4320 ? 'bg-white text-purple-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  3j
                </button>
              </div>
            </div>

            {/* Caption */}
            <input
              type="text"
              placeholder="Ajouter une légende..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40"
            />

            {/* Publish Button */}
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-white text-purple-600 hover:bg-white/90 font-bold text-lg"
            >
              {loading ? 'Publication...' : 'Publier la Story'}
            </Button>
            {mode !== 'location' && (
              <Button
                variant="outline"
                onClick={handlePickFile}
                className="w-full gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Upload size={16} />
                {mode === 'photo' ? 'Changer la photo' : 'Changer le fichier'}
              </Button>
            )}
            {mode === 'photo' && (
              <Button
                variant="outline"
                onClick={() => {
                  resetMediaState();
                  setShowMediaOptions(true);
                }}
                className="w-full gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Camera size={16} />
                Reprendre une photo
              </Button>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Confirmer la publication</h3>
            
            {/* Preview miniature */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              {previewUrl && mode === 'photo' && (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
              {previewUrl && mode === 'video' && (
                <video src={previewUrl} controls className="w-full h-full object-cover" />
              )}
              {previewUrl && mode === 'audio' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 to-pink-700 p-4 gap-3">
                  <Mic size={34} className="text-white" />
                  <audio src={previewUrl} controls className="w-full" />
                </div>
              )}
              {mode === 'location' && locationPreviewSrc && (
                <iframe
                  title="Aperçu"
                  src={locationPreviewSrc}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              )}
              {!previewUrl && mode !== 'location' && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  {mode === 'audio' ? '🎵 Audio' : mode === 'video' ? '🎥 Vidéo' : '📷 Photo'}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Type:</strong> {mode}</p>
              <p><strong>Durée:</strong> {formatDuration(durationMinutes)}</p>
              {caption && <p><strong>Légende:</strong> {caption}</p>}
            </div>

            <p className="text-sm text-gray-500">
              Votre story sera visible par vos contacts pendant {formatDuration(durationMinutes)}.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmPublish}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {loading ? 'Publication...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
