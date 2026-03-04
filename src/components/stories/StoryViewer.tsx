'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';
import { Story } from '@/types/story.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, MapPin, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onReply: (storyId: string, message: string) => void;
  onMarkViewed: (storyId: string) => void;
}

export function StoryViewer({ 
  stories, 
  initialIndex = 0, 
  onClose, 
  onReply,
  onMarkViewed 
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const currentStory = stories[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  useEffect(() => {
    if (!currentStory) return;

    // Marquer comme vue
    onMarkViewed(currentStory.id);

    // Progress bar
    const duration = currentStory.duration * 1000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, currentStory, handleNext, onMarkViewed]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(currentStory.id, replyText);
      setReplyText('');
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={currentStory.userAvatar} />
              <AvatarFallback className="bg-primary text-white">
                {currentStory.userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold">{currentStory.userName}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(currentStory.createdAt.toDate(), { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentStory.type === 'audio' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div 
        className="flex-1 flex items-center justify-center relative"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            handlePrevious();
          } else {
            handleNext();
          }
        }}
      >
        {currentStory.type === 'photo' && currentStory.mediaUrl && (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        )}
        
        {currentStory.type === 'video' && currentStory.mediaUrl && (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            loop
            muted={isMuted}
            className="max-w-full max-h-full object-contain"
          />
        )}
        
        {currentStory.type === 'audio' && (
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 mx-auto animate-pulse">
              <Volume2 size={64} className="text-white" />
            </div>
            {currentStory.mediaUrl && (
              <audio src={currentStory.mediaUrl} autoPlay loop muted={isMuted} />
            )}
          </div>
        )}
        
        {currentStory.type === 'location' && currentStory.location && (
          <div className="text-center text-white p-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 mx-auto">
              <MapPin size={64} className="text-white" />
            </div>
            <p className="text-2xl font-bold mb-2">Localisation partagée</p>
            {currentStory.location.address && (
              <p className="text-white/80">{currentStory.location.address}</p>
            )}
          </div>
        )}

        {currentStory.caption && (
          <div className="absolute bottom-24 left-0 right-0 px-6">
            <p className="text-white text-center text-lg font-medium bg-black/30 backdrop-blur rounded-2xl p-4">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Reply Input */}
      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex gap-2">
          <Input
            placeholder="Répondre à la story..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full"
          />
          <Button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
