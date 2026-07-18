"use client";

import Image from "next/image";

type ResponsiveSplashBackgroundProps = {
  showOverlay?: boolean;
  overlayClassName?: string;
};

export function ResponsiveSplashBackground({
  showOverlay = true,
  overlayClassName = "bg-[#043d25]/25 md:bg-[#043d25]/10",
}: ResponsiveSplashBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A8B46]">
      <Image
        src="/splachone.jpeg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover md:hidden"
        priority
      />
      <Image
        src="/fondpc.png"
        alt=""
        fill
        sizes="100vw"
        className="hidden object-cover md:block"
        priority
      />
      {showOverlay && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  );
}
