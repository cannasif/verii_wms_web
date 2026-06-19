import { type ReactElement } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OPS_FIELD_CLASS } from './ops-field-styles';
import { OpsFieldShell } from './OpsFieldShell';

type OpsInputProps = React.ComponentProps<typeof Input>;

export function OpsInput({
  className,
  'aria-invalid': ariaInvalid,
  ...props
}: OpsInputProps): ReactElement {
  return (
    <OpsFieldShell aria-invalid={ariaInvalid}>
      <Input
        aria-invalid={ariaInvalid}
        className={cn(OPS_FIELD_CLASS, className)}
        {...props}
      />
    </OpsFieldShell>
  );
}
