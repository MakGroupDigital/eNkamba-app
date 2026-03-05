'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, Mic, MapPin, X, Check, Clock, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStories } from '@/hooks/useStories';
import { StoryType, StoryDuration } from '@/types/story.types';
import { LocationStoryCreator } from '@/components/stories/LocationStoryCreator';

export default function CreateStoryPage() {
  const router = useRouter();
  const { createStory } = useStories();
  const [mode, setMode] = useState<StoryType | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60); // 1h par défaut
  const [caption, setCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
    }
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
        }
      }, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handlePublish = async () => {
    if (!mode) return;
    
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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur">
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
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!mode ? (
          /* Mode Selection */
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Que voulez-vous partager?</h2>
              <p className="text-white/80">Choisissez un type de contenu</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setMode('photo'); startCamera(); }}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Camera size={48} className="text-white" />
                <span className="text-white font-semibold">Photo</span>
              </button>

              <button
                onClick={() => setMode('video')}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Video size={48} className="text-white" />
                <span className="text-white font-semibold">Vidéo</span>
              </button>

              <button
                onClick={() => setMode('audio')}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Mic size={48} className="text-white" />
                <span className="text-white font-semibold">Audio</span>
              </button>

              <button
                onClick={() => setMode('location')}
                className="aspect-square rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <MapPin size={48} className="text-white" />
                <span className="text-white font-semibold">Localisation</span>
              </button>
            </div>
          </div>
        ) : mode === 'photo' && !previewUrl ? (
          /* Camera View */
          <div className="relative w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/50 hover:scale-110 transition-transform"
              />
            </div>
          </div>
        ) : mode === 'location' && !selectedLocation ? (
          <div className="w-full max-w-md h-[70vh] rounded-3xl overflow-hidden">
            <LocationStoryCreator
              onComplete={(location) => setSelectedLocation(location)}
              onCancel={() => setMode(null)}
            />
          </div>
        ) : (
          /* Preview & Settings */
          <div className="w-full max-w-md space-y-4">
            {previewUrl && (
              <div className="aspect-[9/16] rounded-3xl overflow-hidden bg-black">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
          </div>
        )}
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
