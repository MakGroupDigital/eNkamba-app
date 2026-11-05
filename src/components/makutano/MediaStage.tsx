'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MakutanoAudioIcon, MakutanoPauseIcon, MakutanoPlayIcon } from '@/components/icons/service-icons';

export type MediaType = 'image' | 'video' | 'audio';

export type FullscreenMedia = {
  src: string;
  type: MediaType;
  label: string;
};

export type MediaPost = {
  text: string;
  author: { name: string };
  mediaUrl: string;
  mediaType: MediaType;
  mediaItems?: Array<{ url: string; type: MediaType }>;
};

// Media carousel shared by the Makutano feed and profile (ENK-011).
export function inferMediaType(mediaUrl: string): 'image' | 'video' | 'audio' {
  const lowerUrl = mediaUrl.toLowerCase();
  if (
    lowerUrl.includes('.mp3') ||
    lowerUrl.includes('.wav') ||
    lowerUrl.includes('.ogg') ||
    lowerUrl.includes('.m4a') ||
    lowerUrl.includes('/audio/')
  ) {
    return 'audio';
  }
  if (
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('.mov') ||
    lowerUrl.includes('.m3u8') ||
    lowerUrl.includes('/video/')
  ) {
    return 'video';
  }
  return 'image';
}

function formatMediaTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function MakutanoAudioPlayer({ src, isActive = false }: { src: string; isActive?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive) {
      audio.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, [isActive, src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const handleSeek = (value: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#073B9A] p-5 text-white">
      <div className="absolute inset-0 bg-[#073B9A]" />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Audio</p>
          <p className="mt-1 text-lg font-bold">Makutano</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white">
          <MakutanoAudioIcon size={24} />
        </div>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#073B9A] shadow-lg transition hover:scale-105"
        aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
      >
        {isPlaying ? <MakutanoPauseIcon size={40} /> : <MakutanoPlayIcon size={40} />}
      </button>

      <div className="relative z-10">
        <div className="mb-4 flex h-24 items-end justify-center gap-1.5">
          {Array.from({ length: 36 }).map((_, index) => (
            <span
              key={index}
              className={cn('w-1.5 rounded-full bg-white/75', isPlaying && 'animate-pulse')}
              style={{
                height: `${18 + ((index * 9) % 64)}px`,
                animationDelay: `${index * 28}ms`,
              }}
            />
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => handleSeek(event.target.value)}
          className="h-2 w-full accent-white"
          aria-label="Progression audio"
        />
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-white/75">
          <span>{formatMediaTime(currentTime)}</span>
          <span>{formatMediaTime(duration)}</span>
        </div>
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
}

function MakutanoVideoPlayer({ src, isActive = false }: { src: string; isActive?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  }, [isActive, src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const handleSeek = (value: string) => {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Number(value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="group relative h-full overflow-hidden bg-[#073B9A]">
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-cover"
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition hover:scale-105"
          aria-label="Lire la vidéo"
        >
          <MakutanoPlayIcon size={38} />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-4 py-3 text-white backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#073B9A] transition hover:bg-[#073B9A]"
            aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
          >
            {isPlaying ? <MakutanoPauseIcon size={24} /> : <MakutanoPlayIcon size={24} />}
          </button>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => handleSeek(event.target.value)}
            className="h-2 min-w-0 flex-1 accent-[#073B9A]"
            aria-label="Progression vidéo"
          />
          <span className="w-20 text-right text-xs font-medium">
            {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MakutanoMediaStage({
  post,
  isActive,
  onFullscreen,
}: {
  post: MediaPost;
  isActive: boolean;
  onFullscreen: (media: FullscreenMedia) => void;
}) {
  const mediaItems = post.mediaItems?.length
    ? post.mediaItems
    : post.mediaUrl
      ? [{ url: post.mediaUrl, type: post.mediaType }]
      : [];

  if (mediaItems.length === 0) {
    return (
      <div className="flex h-[min(56dvh,420px)] w-full items-center justify-center bg-primary/10">
        <p className="text-sm font-medium text-[#073B9A]">Média indisponible</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-950">
      <div className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mediaItems.map((media, index) => (
          <div key={`${media.url}-${index}`} className="relative h-[min(56dvh,430px)] w-full shrink-0 snap-center bg-slate-950 sm:h-[min(62dvh,520px)]">
            {media.type === 'audio' ? (
              <MakutanoAudioPlayer src={media.url} isActive={isActive && index === 0} />
            ) : media.type === 'video' ? (
              <MakutanoVideoPlayer src={media.url} isActive={isActive && index === 0} />
            ) : (
              <img
                src={media.url}
                alt={post.text || `Publication ${index + 1}`}
                className="h-full w-full object-contain"
                loading="lazy"
                draggable={false}
              />
            )}
            <button
              type="button"
              onClick={() => onFullscreen({ src: media.url, type: media.type, label: post.text || `Publication de ${post.author.name}` })}
              className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-black/70"
              aria-label="Afficher en plein écran"
            >
              Plein écran
            </button>
          </div>
        ))}
      </div>
      {mediaItems.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2 py-1.5 backdrop-blur">
          {mediaItems.map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-white/90" />
          ))}
        </div>
      )}
    </div>
  );
}
