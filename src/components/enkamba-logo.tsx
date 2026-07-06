import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const EnkambaLogo = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center', className)} {...props}>
    <div className="flex items-center gap-3">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-md bg-[linear-gradient(135deg,#009058_0%,#009058_50%,#009058_100%)] shadow-[0_12px_28px_rgba(0,144,88,0.18)]">
        <svg
          width="42"
          height="42"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M126 348C126 230 216 140 334 140"
            stroke="white"
            strokeWidth="64"
            strokeLinecap="square"
          />
          <path
            d="M334 140H400V248"
            stroke="white"
            strokeWidth="64"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M280 346V228"
            stroke="white"
            strokeWidth="64"
            strokeLinecap="square"
          />
        </svg>
      </div>
      <div className="flex items-center">
        <span className="font-headline text-4xl font-black tracking-tight text-foreground">
          eNKAMBA
        </span>
      </div>
    </div>
    <p className="mt-1 text-sm text-foreground/90">
      La vie simplifiée et meilleure.
    </p>
  </div>
);

export default EnkambaLogo;
