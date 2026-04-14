import Image from 'next/image';

export interface LeopardCardProps {
  cardNumber: string;
  cardSuffix: string;
  expiryDate: string;
  cardHolderName: string;
  qrCodeUrl: string;
  backgroundImageUrl: string;
}

export default function LeopardCard({
  cardNumber,
  cardSuffix,
  expiryDate,
  cardHolderName,
  qrCodeUrl,
  backgroundImageUrl
}: LeopardCardProps) {
  return (
    <div 
      className="relative w-[500px] h-[315px] rounded-2xl overflow-hidden shadow-2xl text-white font-sans shrink-0 bg-[#1a6b35]"
      style={{
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)'
      }}
    >
      {/* Background Image with Green Tint */}
      <div className="absolute inset-0 z-0">
        {backgroundImageUrl && !backgroundImageUrl.startsWith('[') ? (
          <Image 
            src={backgroundImageUrl} 
            alt="Background" 
            fill 
            className="object-cover opacity-60 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/20">
            <span className="text-xs text-white/50">{backgroundImageUrl}</span>
          </div>
        )}
        {/* Green gradient overlays to match the card's specific lighting */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#125c26]/80 via-[#1a8b40]/40 to-[#0d4019]/90 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a3815] via-transparent to-[#1a6b35]/50" />
      </div>

      {/* Content Container (z-10 to stay above background) */}
      <div className="absolute inset-0 z-10">
        
        {/* Left Vertical Text */}
        <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[13px] font-medium tracking-[0.3em] text-white/90">
          LEOPARD CARTE
        </div>

        {/* Top Right Logo */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            {/* Custom eNkamba icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <span className="text-2xl font-semibold tracking-wide text-white">eNkamba</span>
        </div>

        {/* EMV Chip */}
        <div className="absolute top-[100px] left-[60px] w-[52px] h-[40px] rounded-md bg-gradient-to-br from-[#f6d365] to-[#fda085] border border-yellow-600/50 shadow-sm overflow-hidden flex flex-col justify-evenly p-1">
          {/* Chip lines */}
          <div className="w-full h-[1px] bg-yellow-800/30"></div>
          <div className="w-full h-[1px] bg-yellow-800/30"></div>
          <div className="w-full h-[1px] bg-yellow-800/30"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-yellow-800/30 -translate-x-1/2"></div>
          <div className="absolute left-[20%] top-1/2 bottom-0 w-[1px] bg-yellow-800/30 -translate-x-1/2"></div>
          <div className="absolute right-[20%] top-1/2 bottom-0 w-[1px] bg-yellow-800/30 translate-x-1/2"></div>
        </div>

        {/* Card Number */}
        <div className="absolute top-[170px] left-[60px] flex items-baseline gap-3 drop-shadow-md">
          <span className="text-[28px] tracking-[0.12em] font-mono text-white">
            {cardNumber}
          </span>
          <span className="text-[16px] tracking-widest font-mono text-white/90">
            {cardSuffix}
          </span>
        </div>

        {/* Expiry Date */}
        <div className="absolute top-[220px] left-[160px] flex items-center gap-2 drop-shadow-md">
          <div className="flex flex-col text-[8px] leading-[1.1] font-semibold tracking-wider text-white/80">
            <span>EXPIRE</span>
            <span>END</span>
          </div>
          <div className="text-[18px] font-mono tracking-widest text-white">
            {expiryDate}
          </div>
        </div>

        {/* Card Holder Name */}
        <div className="absolute bottom-8 left-[60px] text-[15px] font-medium tracking-[0.1em] uppercase drop-shadow-md">
          {cardHolderName}
        </div>

        {/* VISA Logo */}
        <div className="absolute bottom-8 right-[110px]">
          <svg viewBox="0 0 32 10" className="h-6 fill-white drop-shadow-md">
            <path d="M14.072 0l-1.36 8.65h2.186l1.355-8.65h-2.181zm9.42 8.41c-.015-.05-.235-.98-.235-.98-.38.195-1.07.31-1.78.31-1.93 0-3.29-1.01-3.3-2.45-.01-1.06.96-1.67 1.7-2.03.76-.37 1.01-.61 1.01-.94 0-.51-.62-.74-1.19-.74-.75 0-1.2.16-1.6.34l-.23.11.33-2.03c.43-.19 1.23-.36 2.08-.37 2.05 0 3.38.99 3.39 2.53.01 1.21-.71 1.83-1.63 2.27-.68.33-1.09.55-1.09.89 0 .32.36.66 1.24.66.64 0 1.1-.14 1.46-.3l.18-.08-.34 2.12c-.39.18-1.1.35-1.99.35zm8.508-8.41h-1.69c-.52 0-.91.15-1.14.7l-3.23 7.95h2.29s.38-1.05.46-1.28h2.8c.07.32.27 1.28.27 1.28h2.02l-1.78-8.65zm-2.28 5.56c.18-.48.86-2.35.86-2.35-.01.02.18-.49.28-.8l.14.69s.4 1.95.48 2.46h-1.76zm-17.76-5.56l-2.23 5.92-.25-1.23c-.43-1.44-1.78-3.02-3.3-3.83l2.14 7.79h2.3l3.44-8.65h-2.1z"/>
          </svg>
        </div>

        {/* QR Code */}
        <div className="absolute bottom-5 right-5 flex flex-col items-center bg-white p-1 rounded-sm shadow-md">
          <div className="w-[60px] h-[60px] bg-gray-100 flex items-center justify-center relative">
            {qrCodeUrl && !qrCodeUrl.startsWith('[') ? (
              <Image 
                src={qrCodeUrl} 
                alt="QR Code" 
                fill 
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-[2px] p-[2px]">
                {/* Fake QR code pattern for placeholder */}
                {[...Array(16)].map((_, i) => (
                  <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                ))}
              </div>
            )}
          </div>
          <span className="text-[6px] font-bold text-black mt-[2px]">For POS payment</span>
        </div>

      </div>
    </div>
  );
}
