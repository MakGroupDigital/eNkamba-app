import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const EnkambaLogo = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center', className)} {...props}>
    <div className="flex items-center gap-3">
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#073B9A] shadow-[0_12px_28px_rgba(7,59,154,0.2)]">
        <img src="/kenz-logo.png" alt="Kenz" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center">
        <span className="font-headline text-4xl font-black tracking-tight text-foreground">
          KENZ
        </span>
      </div>
    </div>
    <p className="mt-1 text-sm text-foreground/90">
      La vie simplifiée et meilleure.
    </p>
  </div>
);

export default EnkambaLogo;
