import Image from 'next/image';
import { Eye } from 'lucide-react';

export interface EnkambaCardProps {
  cardNumber: string;
  cardHolderName: string;
  accountNumber: string;
  balance: string;
  currency: string;
  photoUrl: string;
}

export default function EnkambaCard({
  cardNumber,
  cardHolderName,
  accountNumber,
  balance,
  currency,
  photoUrl
}: EnkambaCardProps) {
  return (
    <div
      className="relative w-[500px] h-[315px] rounded-2xl overflow-hidden shadow-2xl text-white font-sans shrink-0"
      style={{
        // Using inline style for the complex flag gradient to ensure it renders perfectly
        background: 'linear-gradient(160deg, #1e88e5 35%, #fdd835 35% 38%, #e53935 38% 58%, #fdd835 58% 61%, #1e88e5 61%)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255,255,255,0.2)'
      }}
    >
      {/* Subtle lighting overlay to give it a plastic card feel */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />

      {/* Top Left Star */}
      <div className="absolute top-6 left-6">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="#fdd835" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* Top Right Logo */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner border border-white/30 backdrop-blur-sm">
          <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} className="w-8 h-8 object-contain" />
        </div>
        <span className="text-2xl font-bold tracking-widest text-white drop-shadow-md">eNKAMBA</span>
      </div>

      {/* EMV Chip */}
      <div className="absolute top-[100px] left-8 w-14 h-11 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 border border-yellow-600/50 shadow-sm overflow-hidden flex flex-col justify-evenly p-1">
        <div className="w-full h-[1px] bg-yellow-700/40"></div>
        <div className="w-full h-[1px] bg-yellow-700/40"></div>
        <div className="w-full h-[1px] bg-yellow-700/40"></div>
      </div>

      {/* Card Number */}
      <div className="absolute top-[155px] left-8 text-[18px] tracking-[0.10em] font-mono text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        {cardNumber}
      </div>

      {/* Card Holder Name */}
      <div className="absolute top-[200px] left-8 text-lg font-medium tracking-wide drop-shadow-md">
        {cardHolderName}
      </div>

      {/* ENKAMBAPAY Label */}
      <div className="absolute top-[230px] left-8 text-sm font-bold tracking-widest text-yellow-300 drop-shadow-md">
        ENKAMBAPAY
      </div>

      {/* Account Information */}
      <div className="absolute bottom-6 left-8">
        <div className="text-[10px] tracking-widest opacity-80 mb-1">COMPTE</div>
        <div className="text-sm font-mono tracking-wider text-yellow-300 drop-shadow-md">
          {accountNumber}
        </div>
      </div>

      {/* User Photo */}
      <div className="absolute top-[90px] right-8 w-[110px] h-[140px] rounded-lg overflow-hidden border-2 border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.4)] bg-black/20 flex items-center justify-center text-center p-2">
        {photoUrl.startsWith('http') || photoUrl.startsWith('/') ? (
          <Image
            src={photoUrl}
            alt={cardHolderName}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs text-white/80 font-medium">{photoUrl}</span>
        )}
      </div>

      {/* Balance Information */}
      <div className="absolute bottom-6 right-8 text-right">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-[10px] tracking-widest opacity-80">SOLDE</span>
          <Eye size={14} className="opacity-80" />
        </div>
        <div className="text-xl font-bold text-yellow-300 drop-shadow-md">
          {balance} <span className="text-sm ml-1">{currency}</span>
        </div>
      </div>
    </div>
  );
}
