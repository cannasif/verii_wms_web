import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, type ReactElement } from 'react';

type OpsActionButtonVariant = 'primary' | 'secondary';

interface OpsActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OpsActionButtonVariant;
  asChild?: boolean;
}

export function OpsActionButton({
  variant = 'primary',
  className,
  asChild = false,
  type = 'button',
  ...props
}: OpsActionButtonProps): ReactElement {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        'wms-ops-action-btn',
        variant === 'primary' ? 'wms-ops-action-btn--primary' : 'wms-ops-action-btn--secondary',
        className,
      )}
      {...props}
    />
  );
}
