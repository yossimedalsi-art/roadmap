interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  coachName?: string;
}

export default function HeartCompassLogo({ size = 48, className = "", showText = false, coachName }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.6" fill="none" />

        {/* Inner decorative ring */}
        <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.45" />

        {/* North spike */}
        <path d="M50,6 L54,28 L50,50 L46,28 Z" fill="currentColor" />
        {/* South spike */}
        <path d="M50,94 L54,72 L50,50 L46,72 Z" fill="currentColor" />
        {/* East spike */}
        <path d="M94,50 L72,54 L50,50 L72,46 Z" fill="currentColor" />
        {/* West spike */}
        <path d="M6,50 L28,54 L50,50 L28,46 Z" fill="currentColor" />

        {/* NE diagonal spike */}
        <path d="M76,24 L64.8,38.8 L50,50 L61.2,35.2 Z" fill="currentColor" opacity="0.85" />
        {/* SE diagonal spike */}
        <path d="M76,76 L61.2,64.8 L50,50 L64.8,61.2 Z" fill="currentColor" opacity="0.85" />
        {/* NW diagonal spike */}
        <path d="M24,24 L35.2,38.8 L50,50 L38.8,35.2 Z" fill="currentColor" opacity="0.85" />
        {/* SW diagonal spike */}
        <path d="M24,76 L38.8,64.8 L50,50 L35.2,61.2 Z" fill="currentColor" opacity="0.85" />

        {/* Center white circle (heart background) */}
        <circle cx="50" cy="50" r="11.5" fill="white" />

        {/* Heart */}
        <path
          d="M50,57 C43,56 41,52 41,46.5 C41,41 44,39 47,39.5 C48.5,40 49.5,42.5 50,44.5 C50.5,42.5 51.5,40 53,39.5 C56,39 59,41 59,46.5 C59,52 57,56 50,57 Z"
          fill="#c2714f"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight" dir="rtl">
          {coachName && (
            <span className="text-xs text-neutral-400 font-medium">{coachName}</span>
          )}
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500">
            מצפן הלב
          </span>
        </div>
      )}
    </div>
  );
}
