'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MastercardLogo, VisaLogo } from '@/components/payment/card-brand-logos';

export interface EnkambaCardProps {
  cardNumber: string;
  cardHolderName: string;
  accountNumber: string;
  balance: string;
  currency: string;
  photoUrl: string;
  brand?: 'visa' | 'mastercard';
}

export default function EnkambaCard({
  cardNumber,
  cardHolderName,
  accountNumber,
  balance,
  currency,
  photoUrl,
  brand = 'visa',
}: EnkambaCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code from account number and cardholder name
    const generateQR = async () => {
      try {
        // Format: ENK:accountNumber:cardHolderName (Enkamba payment format)
        const qrData = `ENK:${accountNumber}:${cardHolderName}`;
        const url = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 0,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [accountNumber, cardHolderName]);

  // Extract card suffix (last 4 digits)
  const cardSuffix = cardNumber.split(' ').pop() || '0000';
  
  // Generate expiry date (current year + 5 years)
  const currentDate = new Date();
  const expiryYear = (currentDate.getFullYear() + 5) % 100;
  const expiryMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const expiryDate = `${expiryMonth}/${String(expiryYear).padStart(2, '0')}`;

  // Leopard background image from public folder
  const leopardBackgroundUrl = '/majestic-big-cat-staring-wilderness-generated-by-ai.jpg';

  return (
    <div 
      className="relative w-[500px] h-[315px] rounded-2xl overflow-hidden shadow-2xl text-white font-sans shrink-0 bg-[#25543A]"
      style={{
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)'
      }}
    >
      {/* Background Image with Green Tint */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={leopardBackgroundUrl} 
          alt="Leopard Background" 
          fill 
          className="object-cover opacity-70 mix-blend-luminosity"
          referrerPolicy="no-referrer"
          priority
        />
        {/* Green gradient overlays to match the card's specific lighting */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#25543A]/80 via-[#25543A]/40 to-[#25543A]/90 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#25543A] via-transparent to-[#25543A]/50" />
      </div>

      {/* Content Container (z-10 to stay above background) */}
      <div className="absolute inset-0 z-10">
        
        {/* Left Vertical Text */}
        <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[13px] font-medium tracking-[0.3em] text-white/90">
          LEOPARD CARTE
        </div>

        {/* Top Right Logo */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded">
            <Image 
              src="/enkamba-logo.png" 
              alt="eNkamba" 
              width={32} 
              height={32} 
              className="w-full h-full object-cover object-center"
            />
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

        {/* Card Number - Single Line */}
        <div className="absolute top-[155px] left-[60px] drop-shadow-md">
          <span className="text-[20px] tracking-[0.08em] font-mono text-white whitespace-nowrap">
            {cardNumber}
          </span>
        </div>

        {/* Enkamba Account Number */}
        <div className="absolute top-[185px] left-[60px] drop-shadow-md">
          <div className="text-[8px] leading-[1.1] font-semibold tracking-wider text-white/80 mb-0.5">
            ACCOUNT
          </div>
          <span className="text-[14px] tracking-[0.06em] font-mono text-white/95">
            {accountNumber}
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

        {/* QR Code with VISA Logo */}
        <div className="absolute bottom-4 right-4 flex items-end gap-3">
          {brand === 'visa' ? (
            <VisaLogo className="h-6 w-20 drop-shadow-lg" tone="onDark" />
          ) : (
            <MastercardLogo className="h-6 w-20 drop-shadow-lg" tone="onDark" />
          )}
          
          {/* QR Code with Beautiful Frame */}
          <div className="relative">
            {/* Outer glow effect */}
            <div className="absolute inset-0 bg-white/20 rounded-lg blur-md scale-110"></div>
            
            {/* Main QR container with border */}
            <div className="relative w-[60px] h-[60px] bg-white rounded-lg p-1.5 shadow-lg border-2 border-white/80 backdrop-blur-sm">
              {/* Inner frame accent */}
              <div className="absolute inset-1.5 border border-white/40 rounded-md pointer-events-none"></div>
              
              {/* QR Code */}
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-md bg-white">
                {qrCodeUrl ? (
                  <Image 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    fill 
                    className="object-contain p-0.5"
                  />
                ) : (
                  <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-[1px] p-1">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
