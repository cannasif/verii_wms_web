import type { ComponentProps, ReactElement } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export const NAVBAR_ICON_GRADIENT_ID = 'navbar-icon-gradient';

export const navbarIconButtonClassName = cn(
  'group shrink-0 rounded-xl border-0 bg-transparent p-2.5 outline-none',
  'transition-all duration-300',
  'hover:bg-[var(--wms-brand-soft)] hover:shadow-[0_0_18px_var(--wms-brand-shadow)]',
  'focus-visible:ring-2 focus-visible:ring-[var(--wms-brand-ring)] focus-visible:ring-offset-0',
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
          <stop offset="0%" stopColor="var(--wms-brand-primary)" />
          <stop offset="52%" stopColor="var(--wms-brand-secondary)" />
          <stop offset="100%" stopColor="var(--wms-brand-accent)" />
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
