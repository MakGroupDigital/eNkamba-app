'use client';

import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

interface CurrencyBubbleProps {
  balance: number;
  code: string;
  symbol: string;
  label: string;
}

export function CurrencyBubble({ balance, code, symbol, label }: CurrencyBubbleProps) {
  const { conversions, isLoading } = useCurrencyConversion(balance);

  return (
    <div className="group relative flex flex-col items-center gap-1 cursor-pointer">
      <div className="relative">
        <div className="absolute inset-0 -m-1 rounded-full bg-[#FFA500]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg"></div>
        
        <div className="relative bg-gradient-to-br from-[#FFA500] to-[#FF8C00] rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 border border-[#FFA500]/60 group-hover:border-[#FFA500]/100 w-14 h-14 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-sm leading-none">{symbol}</span>
          
          <div className="mt-0.5 text-center">
            {isLoading ? (
              <div className="h-2 w-8 bg-white/20 rounded animate-pulse"></div>
            ) : (
              <p className="text-white font-bold text-[10px] leading-tight">
                {(conversions[code as keyof typeof conversions] || 0).toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <span className="text-[10px] font-semibold text-foreground group-hover:text-[#32BB78] transition-colors duration-300">
        {code}
      </span>
    </div>
  );
}
