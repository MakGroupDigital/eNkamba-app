'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, Square, RotateCcw, Check, X } from 'lucide-react';

interface VideoRecorderProps {
  onComplete: (videoBlob: Blob) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onComplete, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      alert('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
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

  const handleRetake = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    startCamera();
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
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Video Preview */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!recordedBlob}
          src={previewUrl || undefined}
          className="w-full h-full object-cover"
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full">
            <Circle size={12} className="fill-white animate-pulse" />
            <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
        >
          <X size={24} />
        </button>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
        {!recordedBlob ? (
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                isRecording
                  ? 'border-red-500 bg-red-500'
                  : 'border-white bg-transparent hover:bg-white/10'
              }`}
            >
              {isRecording ? (
                <Square size={32} className="text-white fill-white" />
              ) : (
                <Circle size={40} className="text-white fill-red-500" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleRetake}
              size="lg"
              variant="outline"
              className="rounded-full bg-white/10 border-white text-white hover:bg-white/20"
            >
              <RotateCcw size={20} className="mr-2" />
              Refaire
            </Button>
            <Button
              onClick={handleConfirm}
              size="lg"
              className="rounded-full bg-primary text-white"
            >
              <Check size={20} className="mr-2" />
              Continuer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
