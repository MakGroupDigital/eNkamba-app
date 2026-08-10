'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Move, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

type ProfilePhotoCropperProps = {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (croppedImage: string) => void;
};

const CROP_SIZE = 260;
const OUTPUT_SIZE = 640;

export function ProfilePhotoCropper({
  open,
  imageSrc,
  onOpenChange,
  onConfirm,
}: ProfilePhotoCropperProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [open, imageSrc]);

  const coverScale = useMemo(() => {
    return Math.max(CROP_SIZE / imageSize.width, CROP_SIZE / imageSize.height);
  }, [imageSize.height, imageSize.width]);

  const previewSize = useMemo(() => {
    return {
      width: imageSize.width * coverScale,
      height: imageSize.height * coverScale,
    };
  }, [coverScale, imageSize.height, imageSize.width]);

  const clampPosition = (next: { x: number; y: number }) => {
    const maxX = Math.max(0, (previewSize.width * zoom - CROP_SIZE) / 2);
    const maxY = Math.max(0, (previewSize.height * zoom - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  };

  useEffect(() => {
    setPosition(prev => clampPosition(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, previewSize.width, previewSize.height]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setPosition(prev => clampPosition({ x: prev.x + dx, y: prev.y + dy }));
  };

  const stopDragging = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleConfirm = () => {
    const image = imageRef.current;
    if (!image || !imageSrc) return;

    const effectiveScale = coverScale * zoom;
    const sourceSize = CROP_SIZE / effectiveScale;
    const sourceX = image.naturalWidth / 2 - position.x / effectiveScale - sourceSize / 2;
    const sourceY = image.naturalHeight / 2 - position.y / effectiveScale - sourceSize / 2;
    const safeX = Math.min(Math.max(0, sourceX), Math.max(0, image.naturalWidth - sourceSize));
    const safeY = Math.min(Math.max(0, sourceY), Math.max(0, image.naturalHeight - sourceSize));

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.imageSmoothingQuality = 'high';
    context.drawImage(image, safeX, safeY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    onConfirm(canvas.toDataURL('image/jpeg', 0.92));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] rounded-[28px] border-primary/10 p-5 shadow-2xl sm:max-w-md">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </span>
            Ajuster la photo
          </DialogTitle>
          <DialogDescription>
            Déplacez l’image et ajustez le zoom avant de confirmer votre photo de profil.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5">
          <div
            className={`relative h-[260px] w-[260px] touch-none overflow-hidden rounded-full border-[6px] border-white bg-slate-100 shadow-[0_18px_50px_rgba(10,139,70,0.22)] ring-2 ring-primary/20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            role="presentation"
          >
            {imageSrc ? (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Photo à recadrer"
                draggable={false}
                onLoad={(event) => {
                  setImageSize({
                    width: event.currentTarget.naturalWidth || 1,
                    height: event.currentTarget.naturalHeight || 1,
                  });
                }}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${previewSize.width}px`,
                  height: `${previewSize.height}px`,
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                  transformOrigin: 'center',
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/80" />
          </div>

          <div className="flex w-full items-center gap-4 rounded-3xl bg-primary/5 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-1 ring-primary/20">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Aperçu profil"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: `${previewSize.width * (80 / CROP_SIZE)}px`,
                    height: `${previewSize.height * (80 / CROP_SIZE)}px`,
                    transform: `translate(calc(-50% + ${position.x * (80 / CROP_SIZE)}px), calc(-50% + ${position.y * (80 / CROP_SIZE)}px)) scale(${zoom})`,
                    transformOrigin: 'center',
                  }}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                <span className="flex items-center gap-2">
                  <Move className="h-4 w-4 text-primary" />
                  Aperçu rond
                </span>
                <span className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4 text-primary" />
                  Zoom
                </span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={2.6}
                step={0.01}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleConfirm} className="font-black">
            Confirmer la photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
