"use client";

import Image from "next/image";

type ResponsiveSplashBackgroundProps = {
  showOverlay?: boolean;
  overlayClassName?: string;
  showBrand?: boolean;
};

export function ResponsiveSplashBackground({
  showOverlay = true,
  overlayClassName = "bg-transparent",
  showBrand = true,
}: ResponsiveSplashBackgroundProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#073B9A] px-6">
      {showBrand && (
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center text-white">
          <div className="relative mb-1 grid h-52 w-52 place-items-center sm:h-60 sm:w-60">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-white/25"
            />
            <span
              aria-hidden="true"
              className="absolute inset-1 rounded-full border-2 border-transparent border-r-[#F51B2B] border-t-[#F51B2B] motion-safe:animate-[spin_4.8s_linear_infinite]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-4 rounded-full border border-white/30 border-l-[#F51B2B] border-t-transparent motion-safe:animate-[spin_7.2s_linear_infinite_reverse]"
            />
            <span
              aria-hidden="true"
              className="absolute right-4 top-8 h-2.5 w-2.5 rounded-full bg-[#F51B2B] shadow-[0_0_18px_rgba(245,27,43,0.95)] motion-safe:animate-pulse sm:right-5 sm:top-10"
            />
            <div className="relative z-10 h-36 w-36 overflow-hidden rounded-full bg-white/10 p-1.5 shadow-[0_0_0_8px_rgba(255,255,255,0.08),0_20px_42px_rgba(0,0,0,0.2)] sm:h-44 sm:w-44">
              <Image
                src="/kenz-logo.png"
                alt="Kenz"
                width={176}
                height={176}
                className="h-full w-full rounded-full object-cover [clip-path:circle(50%_at_50%_50%)]"
                priority
              />
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-[0.08em]">KENZ</h1>
          <p className="mt-2 text-sm font-medium text-white/82">La vie simplifiée et meilleure.</p>
        </div>
      )}
      {showOverlay && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  );
}
