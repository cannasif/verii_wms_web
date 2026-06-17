import type { ComponentProps, ReactElement } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export const NAVBAR_ICON_GRADIENT_ID = 'navbar-icon-gradient';

export const navbarIconButtonClassName = cn(
  'group shrink-0 rounded-xl border-0 bg-transparent p-2.5 outline-none',
  'transition-all duration-300',
  'hover:bg-sky-400/[0.06] hover:shadow-[0_0_14px_rgba(56,189,248,0.2),0_0_22px_rgba(251,146,60,0.12)]',
  'dark:hover:bg-cyan-400/[0.08]',
  'dark:hover:shadow-[0_0_16px_rgba(56,189,248,0.18),0_0_26px_rgba(251,146,60,0.1)]',
  'focus-visible:ring-2 focus-visible:ring-cyan-400/20 focus-visible:ring-offset-0',
);

const gradientStrokeClassName = 'navbar-icon-gradient';

interface NavbarGradientIconProps {
  icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function NavbarIconGradientDefs(): ReactElement {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden" focusable="false">
      <defs>
        <linearGradient id={NAVBAR_ICON_GRADIENT_ID} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="48%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function NavbarGradientIcon({
  icon,
  size = 24,
  strokeWidth = 1.75,
  className,
}: NavbarGradientIconProps): ReactElement {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={cn(
        'text-slate-500 transition-all duration-300 dark:text-slate-400',
        gradientStrokeClassName,
        className,
      )}
    />
  );
}
