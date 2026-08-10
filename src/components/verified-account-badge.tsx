'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerifiedAccountBadge({
  verified,
  className,
  label = false,
}: {
  verified?: boolean;
  className?: string;
  label?: boolean;
}) {
  if (!verified) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary',
        className
      )}
      title="Compte vérifié"
      aria-label="Compte vérifié"
    >
      <CheckCircle2 className="h-3.5 w-3.5 fill-primary/10" />
      {label && <span className="text-[10px] font-black">Vérifié</span>}
    </span>
  );
}
