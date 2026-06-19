import { type ReactElement } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { OPS_FIELD_CLASS } from './ops-field-styles';
import { OpsFieldShell } from './OpsFieldShell';

type OpsTextareaProps = React.ComponentProps<typeof Textarea>;

export function OpsTextarea({ className, ...props }: OpsTextareaProps): ReactElement {
  return (
    <OpsFieldShell>
      <Textarea
        className={cn(
          OPS_FIELD_CLASS,
          'wms-ops-notes-textarea min-h-[4.75rem] max-h-40 resize-y overflow-y-auto [field-sizing:normal]',
          className,
        )}
        {...props}
      />
    </OpsFieldShell>
  );
}
