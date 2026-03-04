'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Check, X, RotateCcw } from 'lucide-react';

interface AudioRecorderProps {
  onComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erreur micro:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handleConfirm = () => {
    if (recordedBlob) {
      onComplete(recordedBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex flex-col items-center justify-center p-8">
      {/* Close Button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30"
      >
        <X size={24} />
      </button>

      {/* Visualizer */}
      <div className="mb-8">
        <div className={`w-48 h-48 rounded-full bg-white/10 backdrop-blur flex items-center justify-center ${isRecording ? 'animate-pulse' : ''}`}>
          <Mic size={80} className="text-white" />
        </div>
      </div>

      {/* Timer */}
      <div className="text-white text-4xl font-mono font-bold mb-8">
        {formatTime(recordingTime)}
      </div>

      {/* Audio Player (hidden) */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Controls */}
      <div className="space-y-4 w-full max-w-xs">
        {!recordedBlob ? (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="lg"
            className={`w-full h-16 rounded-full text-lg font-semibold ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white text-purple-600 hover:bg-white/90'
            }`}
          >
            {isRecording ? (
              <>
                <Square size={24} className="mr-2 fill-white" />
                Arrêter
              </>
            ) : (
              <>
                <Mic size={24} className="mr-2" />
                Commencer
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={togglePlayback}
              size="lg"
              className="w-full h-16 rounded-full bg-white text-purple-600 hover:bg-white/90 text-lg font-semibold"
            >
              {isPlaying ? (
                <>
                  <Pause size={24} className="mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play size={24} className="mr-2" />
                  Écouter
                </>
              )}
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={handleRetake}
                size="lg"
                variant="outline"
                className="flex-1 rounded-full bg-white/10 border-white text-white hover:bg-white/20"
              >
                <RotateCcw size={20} className="mr-2" />
                Refaire
              </Button>
              <Button
                onClick={handleConfirm}
                size="lg"
                className="flex-1 rounded-full bg-white text-purple-600 hover:bg-white/90"
              >
                <Check size={20} className="mr-2" />
                Valider
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
