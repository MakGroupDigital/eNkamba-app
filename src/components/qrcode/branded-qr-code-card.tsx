'use client';
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type BrandedQRCodeCardProps = {
  qrCode: string;
  title?: string;
  name: string;
  subtitle?: string;
  details?: Array<{ label: string; value?: string | null }>;
  centerImageSrc?: string | null;
  centerIcon?: ReactNode;
  variant?: 'payment' | 'contact';
  qrAlt?: string;
  qrClassName?: string;
};

type ExportBrandedQRCodeOptions = {
  qrCode: string;
  name: string;
  title?: string;
  subtitle?: string;
  details?: Array<{ label: string; value?: string | null }>;
  centerImageSrc?: string | null;
  centerLabel?: string;
  variant?: 'payment' | 'contact';
  outputType?: 'image/png' | 'image/jpeg';
  quality?: number;
};

const loadCanvasImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const drawRoundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) => {
  const sourceRatio = image.width / image.height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > 1) {
    sourceWidth = image.height;
    sourceX = (image.width - sourceWidth) / 2;
  } else if (sourceRatio < 1) {
    sourceHeight = image.width;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, size, size);
};

export async function createBrandedQRCodeDataUrl({
  qrCode,
  name,
  title,
  subtitle,
  details,
  centerImageSrc,
  centerLabel,
  variant = 'payment',
  outputType = 'image/png',
  quality,
}: ExportBrandedQRCodeOptions) {
  const isPayment = variant === 'payment';
  const canvas = document.createElement('canvas');
  const scale = 3;
  const visibleDetails = (details || []).filter((detail) => detail.value);
  const width = 520;
  const height = visibleDetails.length ? 760 : 680;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  if (!context) return qrCode;

  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#ffffff');
  background.addColorStop(1, isPayment ? '#effbf4' : '#f2fbf8');
  context.fillStyle = background;
  drawRoundRect(context, 18, 18, width - 36, height - 36, 20);
  context.fill();

  const glow = context.createRadialGradient(isPayment ? 110 : 400, 90, 10, isPayment ? 110 : 400, 90, 260);
  glow.addColorStop(0, isPayment ? 'rgba(50,187,120,0.26)' : 'rgba(14,90,89,0.24)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(18, 18, width - 36, height - 36);

  const topLine = context.createLinearGradient(40, 34, width - 40, 34);
  topLine.addColorStop(0, '#009058');
  topLine.addColorStop(0.55, '#009058');
  topLine.addColorStop(1, '#FFA500');
  context.fillStyle = topLine;
  drawRoundRect(context, 40, 34, width - 80, 8, 4);
  context.fill();

  if (title) {
    context.fillStyle = '#334155';
    context.font = '700 17px Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText(title.toUpperCase(), width / 2, 92);
  }

  const qrImage = await loadCanvasImage(qrCode);
  const qrBoxSize = 360;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = title ? 122 : 98;

  context.save();
  context.shadowColor = 'rgba(15,23,42,0.16)';
  context.shadowBlur = 34;
  context.shadowOffsetY = 18;
  context.fillStyle = '#ffffff';
  drawRoundRect(context, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 18);
  context.fill();
  context.restore();

  context.strokeStyle = 'rgba(15,23,42,0.10)';
  context.lineWidth = 1;
  drawRoundRect(context, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 18);
  context.stroke();
  context.drawImage(qrImage, qrBoxX + 22, qrBoxY + 22, qrBoxSize - 44, qrBoxSize - 44);

  const centerSize = 88;
  const centerX = width / 2;
  const centerY = qrBoxY + qrBoxSize / 2;

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, centerSize / 2 + 7, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.shadowColor = 'rgba(15,23,42,0.24)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, centerSize / 2, 0, Math.PI * 2);
  context.clip();

  let centerImageDrawn = false;
  if (centerImageSrc) {
    try {
      const centerImage = await loadCanvasImage(centerImageSrc);
      drawCoverImage(context, centerImage, centerX - centerSize / 2, centerY - centerSize / 2, centerSize);
      centerImageDrawn = true;
    } catch {
      centerImageDrawn = false;
    }
  }

  if (!centerImageDrawn) {
    context.fillStyle = isPayment ? '#009058' : '#009058';
    context.fillRect(centerX - centerSize / 2, centerY - centerSize / 2, centerSize, centerSize);
    context.fillStyle = '#ffffff';
    context.font = '800 26px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText((centerLabel || name.charAt(0)).slice(0, 3).toUpperCase(), centerX, centerY);
  }
  context.restore();

  context.fillStyle = '#020617';
  context.font = '900 24px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText(name, width / 2, qrBoxY + qrBoxSize + 72);

  if (subtitle) {
    context.fillStyle = '#64748b';
    context.font = '600 15px Arial, sans-serif';
    context.fillText(subtitle, width / 2, qrBoxY + qrBoxSize + 102);
  }

  if (visibleDetails.length) {
    const detailsY = qrBoxY + qrBoxSize + 130;
    const detailsHeight = 26 + visibleDetails.length * 26;

    context.fillStyle = 'rgba(255,255,255,0.78)';
    drawRoundRect(context, 62, detailsY, width - 124, detailsHeight, 14);
    context.fill();

    visibleDetails.forEach((detail, index) => {
      const lineY = detailsY + 30 + index * 26;
      context.fillStyle = '#64748b';
      context.font = '700 13px Arial, sans-serif';
      context.textAlign = 'right';
      context.fillText(`${detail.label}:`, 170, lineY);

      context.fillStyle = '#0f172a';
      context.font = '700 13px Arial, sans-serif';
      context.textAlign = 'left';
      const value = String(detail.value || '');
      const text = value.length > 38 ? `${value.slice(0, 35)}...` : value;
      context.fillText(text, 184, lineY);
    });
  }

  context.fillStyle = isPayment ? '#009058' : '#009058';
  context.font = '700 14px Arial, sans-serif';
  context.textAlign = 'center';
  context.fillText('eNkamba', width / 2, height - 52);

  return canvas.toDataURL(outputType, quality);
}

export function BrandedQRCodeCard({
  qrCode,
  title,
  name,
  subtitle,
  details,
  centerImageSrc,
  centerIcon,
  variant = 'payment',
  qrAlt = 'QR Code eNkamba',
  qrClassName,
}: BrandedQRCodeCardProps) {
  const isPayment = variant === 'payment';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[8px] border p-5 text-center shadow-sm',
        isPayment
          ? 'border-[#009058]/25 bg-[radial-gradient(circle_at_20%_12%,rgba(0,144,88,0.18),transparent_34%),linear-gradient(145deg,#ffffff,#effbf4)]'
          : 'border-[#009058]/20 bg-[radial-gradient(circle_at_78%_16%,rgba(0,144,88,0.16),transparent_34%),linear-gradient(145deg,#ffffff,#f2fbf8)]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#009058] via-[#009058] to-[#FFA500]" />

      {title && (
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
          {title}
        </p>
      )}

      <div className="mx-auto w-fit rounded-[8px] bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/10">
        <div className="relative">
          <img
            src={qrCode}
            alt={qrAlt}
            className={cn('h-44 w-44 rounded-[6px] object-contain sm:h-52 sm:w-52', qrClassName)}
          />

          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white bg-white shadow-lg">
            {centerImageSrc ? (
              <img
                src={centerImageSrc}
                alt={name}
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center rounded-full text-white',
                  isPayment ? 'bg-[#009058]' : 'bg-[#009058]',
                )}
              >
                {centerIcon || <span className="text-lg font-black">{name.charAt(0).toUpperCase()}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-base font-black text-slate-950">{name}</p>
        {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>

      {details?.some((detail) => detail.value) && (
        <div className="mt-4 rounded-[8px] bg-white/75 p-3 text-left ring-1 ring-slate-900/5">
          {details
            .filter((detail) => detail.value)
            .map((detail) => (
              <p key={detail.label} className="break-words text-xs leading-5 text-slate-700">
                <span className="font-bold text-slate-950">{detail.label}:</span> {detail.value}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
