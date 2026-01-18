'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Phone, Video, User, Bot, Loader2, Mic, Paperclip, StopCircle, Play, Pause, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


// Mock data - in a real app, this would come from an API
const conversationsData: {[key: string]: any} = {
    "1": {
        name: "Service Client Mbongo",
        avatar: "https://picsum.photos/seed/makuta/100/100",
        messages: [
            { text: "Bonjour, comment puis-je vous aider avec votre compte Mbongo aujourd'hui ?", isUser: false, time: "10:45" },
        ]
    },
    "2": {
        name: "Groupe Tontine 'Les Amis'",
        avatar: "https://picsum.photos/seed/tontine/100/100",
        messages: [
            { text: "Bonjour à tous !", isUser: false, sender: "Jean", time: "09:30" },
            { text: "N'oubliez pas la cotisation de demain !", isUser: true, time: "09:31" },
        ]
    }
};

interface Message {
  text?: string;
  isUser: boolean;
  time: string;
  sender?: string;
  audioSrc?: string;
}

interface AudioPlayerProps {
    src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const setAudioData = () => {
                setDuration(audio.duration);
                setCurrentTime(audio.currentTime);
            }

            const setAudioTime = () => setCurrentTime(audio.currentTime);

            audio.addEventListener('loadeddata', setAudioData);
            audio.addEventListener('timeupdate', setAudioTime);
            audio.addEventListener('ended', () => setIsPlaying(false));

            return () => {
                audio.removeEventListener('loadeddata', setAudioData);
                audio.removeEventListener('timeupdate', setAudioTime);
                audio.removeEventListener('ended', () => setIsPlaying(false));
            }
        }
    }, []);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <audio ref={audioRef} src={src} preload="metadata"></audio>
            <Button size="icon" variant="ghost" onClick={togglePlayPause} className="h-8 w-8 rounded-full">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
            </div>
        </div>
    );
};


export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const chatId = params.id as string;
    const conversation = conversationsData[chatId] || { name: "Inconnu", avatar: '', messages: [] };
    const { toast } = useToast();

    const [messages, setMessages] = useState<Message[]>(conversation.messages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioPreview(audioUrl);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          variant: "destructive",
          title: "Permission Requise",
          description: "Veuillez autoriser l'accès au microphone pour enregistrer un message.",
        });
      }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleMicButtonClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }


    const handleSendMessage = () => {
        if (inputValue.trim()) {
            const userMessage: Message = { text: inputValue, isUser: true, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, userMessage]);
            setInputValue('');
            setIsLoading(true);

            // Simulate AI/bot response
            setTimeout(() => {
                const botMessage: Message = { text: "Merci pour votre message. Un agent vous répondra bientôt.", isUser: false, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
                setMessages(prev => [...prev, botMessage]);
                setIsLoading(false);
            }, 1500);
        }
    };

    const sendAudioMessage = () => {
        if (audioPreview) {
            const newMessage: Message = {
                isUser: true,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                audioSrc: audioPreview,
            };
            setMessages(prev => [...prev, newMessage]);
            setAudioPreview(null);
        }
    }

    const cancelAudioPreview = () => {
        if(audioPreview) {
            URL.revokeObjectURL(audioPreview);
        }
        setAudioPreview(null);
    }
    
    const handleCall = (type: 'audio' | 'video') => {
        if (type === 'video') {
            router.push(`/dashboard/miyiki-chat/call/${chatId}`);
        } else {
             router.push(`/dashboard/miyiki-chat/audiocall/${chatId}`);
        }
    }
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast({
                title: "Fichier sélectionné !",
                description: `"${file.name}" prêt à être envoyé. (Fonctionnalité en cours de développement)`,
            });
        }
        // Reset file input to allow selecting the same file again
        e.target.value = '';
    };

  return (
    <div className="flex flex-col h-screen bg-muted/20">
      {/* Header */}
      <header className="p-3 border-b bg-card flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/miyiki-chat">
                    <ArrowLeft />
                </Link>
            </Button>
            <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="font-headline text-lg font-bold text-primary">{conversation.name}</h1>
                <p className="text-sm text-muted-foreground">En ligne</p>
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => handleCall('audio')}>
                <Phone className='text-primary'/>
            </Button>
             <Button variant="ghost" size="icon" onClick={() => handleCall('video')}>
                <Video className='text-primary'/>
            </Button>
        </div>
      </header>

      {/* Messages Area */}
       <div className="relative flex-1">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dy73hzkpm/image/upload/v1761165822/IMG_6538_oqqbsn.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <ScrollArea className="relative h-full p-4">
          <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-end gap-3",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              {!message.isUser && (
                 <Avatar className="h-8 w-8 border-2 border-primary/50">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg rounded-2xl text-sm shadow",
                   message.audioSrc ? "p-2" : "px-4 py-3",
                  message.isUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card text-card-foreground rounded-bl-none"
                )}
              >
                {message.sender && <p className="text-xs font-bold text-primary mb-1">{message.sender}</p>}
                {message.text && <p>{message.text}</p>}
                {message.audioSrc && <AudioPlayer src={message.audioSrc} />}
                <p className={cn("text-xs mt-2", message.isUser ? "text-primary-foreground/70" : "text-muted-foreground", message.audioSrc ? "text-right" : "")}>{message.time}</p>
              </div>
               {message.isUser && (
                <Avatar className="h-8 w-8">
                  <div className="bg-accent h-full w-full flex items-center justify-center rounded-full">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8 border-2 border-primary/50">
                 <AvatarImage src={conversation.avatar} />
                 <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 text-sm shadow bg-card text-card-foreground rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        </ScrollArea>
      </div>


      {/* Input Area */}
      <div className="p-3 bg-card border-t">
        {audioPreview && (
            <div className="flex items-center gap-2 p-2 mb-2 bg-muted rounded-lg">
                <AudioPlayer src={audioPreview} />
                <Button size="icon" variant="ghost" onClick={cancelAudioPreview}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
                <Button size="icon" className="bg-accent hover:bg-accent/90" onClick={sendAudioMessage}>
                    <Send className="h-5 w-5"/>
                </Button>
            </div>
        )}
        <div className="relative flex items-center gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
            />
           <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Écrivez votre message..."
            className="h-12 flex-1 rounded-full pr-12 bg-muted"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading || isRecording || !!audioPreview}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90"
            onClick={inputValue.trim() ? handleSendMessage : handleMicButtonClick}
            disabled={isLoading || !!audioPreview}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <StopCircle className="h-5 w-5 text-red-500 animate-pulse" />
            ) : inputValue.trim() ? (
              <Send className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
