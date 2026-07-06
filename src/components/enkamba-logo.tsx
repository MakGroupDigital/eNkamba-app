import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const EnkambaLogo = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center', className)} {...props}>
    <div className="flex items-center gap-3">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#0A8B46_0%,#089961_58%,#18A96E_100%)] shadow-[0_12px_28px_rgba(10,139,70,0.24)]">
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
        <span className="absolute left-2.5 top-2.5 h-4 w-4 rounded-full border-2 border-white bg-[#FFA500] shadow-[0_0_16px_rgba(255,165,0,0.65)]" />
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
