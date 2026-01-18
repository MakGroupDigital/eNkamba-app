import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const Logo = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-3", className)} {...props}>
    <div className="flex items-center">
      <div className="size-8 bg-primary rounded-full shadow-inner" />
      <div className="size-6 -ml-3 bg-accent rounded-full ring-2 ring-background" />
    </div>
    <span className="font-headline text-2xl font-bold tracking-tighter text-foreground">
      Mbongo.io
    </span>
  </div>
);

export default Logo;
