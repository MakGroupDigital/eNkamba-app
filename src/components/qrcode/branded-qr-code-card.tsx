'use client';
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type BrandedQRCodeCardProps = {
  qrCode: string;
  title?: string;
  name: string;
  subtitle?: string;
  centerImageSrc?: string | null;
  centerIcon?: ReactNode;
  variant?: 'payment' | 'contact';
  qrAlt?: string;
  qrClassName?: string;
};

export function BrandedQRCodeCard({
  qrCode,
  title,
  name,
  subtitle,
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
          ? 'border-[#32BB78]/25 bg-[radial-gradient(circle_at_20%_12%,rgba(50,187,120,0.18),transparent_34%),linear-gradient(145deg,#ffffff,#effbf4)]'
          : 'border-[#0E5A59]/20 bg-[radial-gradient(circle_at_78%_16%,rgba(14,90,89,0.16),transparent_34%),linear-gradient(145deg,#ffffff,#f2fbf8)]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#32BB78] via-[#0E5A59] to-[#FF8C00]" />

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
                  isPayment ? 'bg-[#32BB78]' : 'bg-[#0E5A59]',
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
    </div>
  );
}
