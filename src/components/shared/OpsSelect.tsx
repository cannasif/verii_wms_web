import { type ReactElement, type ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { OpsFieldShell } from './OpsFieldShell';
import { OPS_SELECT_CONTENT_CLASS, OPS_SELECT_TRIGGER_CLASS } from './ops-field-styles';

interface OpsSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function OpsSelect({
  value,
  onValueChange,
  placeholder,
  children,
  disabled,
  className,
  triggerClassName,
}: OpsSelectProps): ReactElement {
  return (
    <OpsFieldShell className={className}>
      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(OPS_SELECT_TRIGGER_CLASS, triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
          {children}
        </SelectContent>
      </Select>
    </OpsFieldShell>
  );
}

export { SelectItem as OpsSelectItem };
