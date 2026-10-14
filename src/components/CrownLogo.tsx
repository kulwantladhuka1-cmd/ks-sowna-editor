import React from 'react';

interface CrownLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export const CrownLogo: React.FC<CrownLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'light',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 42 : 30;
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Crown Badge */}
      <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-pink-500 shadow-md">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          className="text-white drop-shadow-sm"
        >
          <path
            d="M2 19h20v2H2v-2zm1-2l2.5-9 4.5 4.5L12 4l2 8.5 4.5-4.5L21 17H3z"
            fill="url(#goldCrownGrad)"
          />
          <circle cx="12" cy="4" r="1.5" fill="#FFFFFF" />
          <circle cx="5" cy="8" r="1.3" fill="#FFFFFF" />
          <circle cx="19" cy="8" r="1.3" fill="#FFFFFF" />
          <defs>
            <linearGradient id="goldCrownGrad" x1="2" y1="4" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF9D2" />
              <stop offset="0.4" stopColor="#FDE047" />
              <stop offset="0.8" stopColor="#EAB308" />
              <stop offset="1" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight ${titleSize} font-['Cinzel',serif] ${
              isLight ? 'text-slate-900' : 'text-amber-100'
            }`}
          >
            KS SOWNA
          </span>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold font-sans shadow-sm">
            PRO
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] font-medium tracking-wide ${
              isLight ? 'text-slate-500' : 'text-amber-200/70'
            }`}
          >
            Photo &amp; Logo Editor • ਫੋਟੋ ਅਤੇ ਲੋਗੋ
          </span>
        )}
      </div>
    </div>
  );
};

