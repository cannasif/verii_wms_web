import { type ReactElement, type ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface OpsToggleFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function OpsToggleField({
  checked,
  onCheckedChange,
  title,
  description,
  disabled = false,
  className,
}: OpsToggleFieldProps): ReactElement {
  return (
    <div
      data-ops-toggle
      className={cn(
        'wms-ops-toggle-card flex flex-row items-start gap-4 rounded-lg border p-4 transition-colors',
        checked && 'wms-ops-toggle-card--active',
        className,
      )}
    >
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="wms-ops-switch mt-0.5 shrink-0"
      />
      <div className="min-w-0 space-y-1 leading-none">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
