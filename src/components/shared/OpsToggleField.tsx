import { type ReactElement, type ReactNode } from 'react';
import { OpsCircuitToggleField } from './OpsCircuitToggle';

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
    <OpsCircuitToggleField
      checked={checked}
      onCheckedChange={onCheckedChange}
      title={title}
      description={description}
      disabled={disabled}
      className={className}
    />
  );
}
