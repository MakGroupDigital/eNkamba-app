import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const EnkambaLogo = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center', className)} {...props}>
    <div className="flex items-center">
      <div className="relative flex items-center justify-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M39.6923 24C39.6923 32.6751 32.6751 39.6923 24 39.6923C15.3249 39.6923 8.30769 32.6751 8.30769 24C8.30769 15.3249 15.3249 8.30769 24 8.30769C28.9383 8.30769 33.323 10.3692 36.4615 13.5"
            stroke="#0E5A59"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-accent">
          <span className="font-headline text-2xl font-bold text-white">e</span>
        </div>
      </div>
      <div className="-ml-2 flex items-center">
        <span className="font-headline text-4xl font-bold text-primary">
          Nkamba
        </span>
      </div>
    </div>
    <p className="mt-1 text-sm text-foreground/90">
      La vie simplifiée et meilleure.
    </p>
  </div>
);

export default EnkambaLogo;
