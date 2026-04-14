'use client';

export function VisaLogo({
  className,
  tone = 'default',
}: {
  className?: string;
  tone?: 'default' | 'onDark';
}) {
  const textFill = tone === 'onDark' ? '#FFFFFF' : '#1434CB';
  const containerFill = tone === 'onDark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0)';

  return (
    <svg viewBox="0 0 120 40" role="img" aria-label="Visa" className={className}>
      <rect width="120" height="40" rx="8" fill={containerFill} />
      <text
        x="60"
        y="26"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="2"
        fill={textFill}
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({
  className,
  tone = 'default',
}: {
  className?: string;
  tone?: 'default' | 'onDark';
}) {
  const textFill = tone === 'onDark' ? '#FFFFFF' : '#111827';
  const containerFill = tone === 'onDark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0)';

  return (
    <svg viewBox="0 0 120 40" role="img" aria-label="Mastercard" className={className}>
      <rect width="120" height="40" rx="8" fill={containerFill} />
      <circle cx="52" cy="20" r="10" fill="#EB001B" />
      <circle cx="68" cy="20" r="10" fill="#F79E1B" />
      <circle cx="60" cy="20" r="10" fill="#FF5F00" fillOpacity="0.9" />
      <text
        x="60"
        y="34"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
        fill={textFill}
      >
        MASTERCARD
      </text>
    </svg>
  );
}

