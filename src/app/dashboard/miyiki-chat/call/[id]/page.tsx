'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const conversationsData: { [key: string]: any } = {
  "1": {
    name: "Service Client Mbongo",
    avatar: "https://picsum.photos/seed/makuta/100/100",
  },
  "2": {
    name: "Groupe Tontine 'Les Amis'",
    avatar: "https://picsum.photos/seed/tontine/100/100",
  }
};

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const contact = conversationsData[chatId] || { name: "Inconnu", avatar: '' };
  
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);


  useEffect(() => {
    const getMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setHasPermission(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // In a real WebRTC app, you would add this stream to a peer connection.
        // For now, we just display it locally.
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Média Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra et au microphone.',
        });
      }
    };

    getMediaPermissions();
    
    // Clean up media stream on component unmount
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicMuted;
      });
    }
  }, [isMicMuted]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff]);
  
  const handleEndCall = () => {
    router.back();
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-black text-white">
      {/* Remote Video (Placeholder) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Avatar className="h-32 w-32 border-4 border-white/50">
                <AvatarImage src={contact.avatar} />
                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="mt-4 font-headline text-2xl">{contact.name}</p>
            <p className="text-white/70">Appel en cours...</p>
        </div>
      </div>

      {/* Local Video */}
      <div className="absolute top-4 right-4 h-48 w-36 overflow-hidden rounded-lg border-2 border-white/50 shadow-lg">
        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
         {hasPermission === false && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-2 text-center">
                <Alert variant="destructive" className="bg-transparent border-none text-white">
                    <Camera className="h-4 w-4" />
                    <AlertTitle className="text-xs">Caméra/Micro requis</AlertTitle>
                </Alert>
             </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/50 p-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
          onClick={() => setIsMicMuted(prev => !prev)}
        >
          {isMicMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
          onClick={() => setIsCameraOff(prev => !prev)}
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </Button>
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-110"
          onClick={handleEndCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
