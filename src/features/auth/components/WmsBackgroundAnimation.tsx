interface WmsBackgroundAnimationProps {
  isPaused?: boolean;
}

export function WmsBackgroundAnimation({ isPaused = false }: WmsBackgroundAnimationProps) {
  return (
    <div
      aria-hidden="true"
      className={`wms-micro-wrap pointer-events-none select-none ${isPaused ? 'wms-micro-paused' : ''}`}
    >
      <svg viewBox="0 0 240 160" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="wmsMicroStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.85)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.75)" />
          </linearGradient>
          <linearGradient id="wmsMicroScan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.22)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>

        <rect x="24" y="24" width="176" height="112" rx="12" className="wms-rack-frame" />
        <line x1="24" y1="60" x2="200" y2="60" className="wms-rack-line" />
        <line x1="24" y1="92" x2="200" y2="92" className="wms-rack-line" />
        <line x1="24" y1="124" x2="200" y2="124" className="wms-rack-line" />

        <rect x="40" y="36" width="28" height="18" rx="4" className="wms-rack-box" />
        <rect x="110" y="68" width="34" height="20" rx="4" className="wms-rack-box" />
        <rect x="154" y="100" width="30" height="20" rx="4" className="wms-rack-box" />

        <rect x="24" y="26" width="176" height="18" rx="8" className="wms-scan-line" />
        <rect x="20" y="20" width="184" height="120" rx="14" className="wms-glow-frame" />
      </svg>
    </div>
  );
}

