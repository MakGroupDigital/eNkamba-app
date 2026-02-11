'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Square, RotateCcw, Send, Settings, Zap, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDevicePermission } from '@/hooks/useDevicePermission';

interface ProCameraRecorderProps {
  onClose: () => void;
  onPublish: (videoBlob: Blob, title: string) => Promise<void>;
  isPublishing?: boolean;
}

export const ProCameraRecorder = ({ onClose, onPublish, isPublishing = false }: ProCameraRecorderProps) => {
  const { toast } = useToast();
  const cameraPermission = useDevicePermission('camera');
  const microphonePermission = useDevicePermission('microphone');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [zoom, setZoom] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser la caméra
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Vérifier les permissions
        if (!cameraPermission.isGranted && cameraPermission.shouldPrompt) {
          const granted = await cameraPermission.requestPermission();
          if (!granted) {
            toast({
              variant: 'destructive',
              title: 'Permission refusée',
              description: 'Accès à la caméra requis pour enregistrer',
            });
            onClose();
            return;
          }
        }

        if (!microphonePermission.isGranted && microphonePermission.shouldPrompt) {
          const granted = await microphonePermission.requestPermission();
          if (!granted) {
            toast({
              variant: 'destructive',
              title: 'Permission refusée',
              description: 'Accès au microphone requis pour enregistrer',
            });
            onClose();
            return;
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);

        // Initialiser MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordedBlob(blob);
          chunksRef.current = [];
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible d\'accéder à la caméra',
        });
        onClose();
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [facingMode, onClose, toast, cameraPermission, microphonePermission]);

  // Gérer le minuteur
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = () => {
    if (mediaRecorderRef.current && cameraActive) {
      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setVideoTitle('');
    setVideoDescription('');
    setRecordingTime(0);
    // Retourner au mode enregistrement sans fermer le composant
  };

  const switchCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePublish = async () => {
    if (!recordedBlob || !videoTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un titre pour la vidéo',
      });
      return;
    }

    try {
      await onPublish(recordedBlob, videoTitle);
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de publier la vidéo',
      });
    }
  };

  // Mode aperçu de la vidéo enregistrée
  if (recordedBlob) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-white font-bold">Aperçu de la vidéo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center bg-black p-4">
          <video
            src={URL.createObjectURL(recordedBlob)}
            controls
            className="max-w-full max-h-full rounded-lg"
          />
        </div>

        {/* Title & Description Input */}
        <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-3 max-h-48 overflow-y-auto">
          <input
            type="text"
            placeholder="Titre de la vidéo..."
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[#32BB78] text-sm"
          />

          <textarea
            placeholder="Description (optionnel)..."
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[#32BB78] text-sm resize-none h-20"
          />

          <div className="flex gap-2">
            <button
              onClick={resetRecording}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw size={16} />
              Recommencer
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !videoTitle.trim()}
              className="flex-1 bg-gradient-to-r from-[#32BB78] to-green-700 hover:from-[#2a9d63] hover:to-green-800 disabled:opacity-50 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <Send size={16} />
              {isPublishing ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode enregistrement
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <h2 className="text-white font-bold">Caméra Pro</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Camera View */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
          style={{
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
            transform: `scale(${zoom})`,
          }}
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 px-3 py-2 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-semibold text-sm">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Zoom Indicator */}
        {zoom !== 1 && (
          <div className="absolute top-4 right-4 bg-gray-900/80 px-3 py-2 rounded-lg">
            <span className="text-white text-sm font-semibold">{(zoom * 100).toFixed(0)}%</span>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-gray-800">
              <h3 className="text-white font-bold text-lg">Réglages</h3>

              {/* Brightness */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-semibold">Luminosité</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-semibold">Contraste</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-semibold">Saturation</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Zoom */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-semibold">Zoom</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-[#32BB78] hover:bg-[#2a9d63] text-white py-2 rounded-lg transition-all font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg hover:shadow-red-600/50"
            >
              <div className="w-6 h-6 bg-white rounded-full" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg hover:shadow-red-600/50"
            >
              <Square size={24} className="text-white" />
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between">
          {/* Audio Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Camera Switch */}
          <button
            onClick={switchCamera}
            disabled={isRecording}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-all text-sm font-semibold"
          >
            Changer caméra
          </button>

          {/* Recording Status */}
          <div className="text-gray-400 text-sm">
            {isRecording ? (
              <span className="text-red-500 font-semibold">{formatTime(recordingTime)}</span>
            ) : recordedBlob ? (
              <span className="text-green-500 font-semibold">Prêt à publier</span>
            ) : (
              <span>Appuyez pour enregistrer</span>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
