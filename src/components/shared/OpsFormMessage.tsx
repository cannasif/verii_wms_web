import { type ReactElement } from 'react';
import { FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface OpsFormMessageProps {
  className?: string;
}

export function OpsFormMessage({ className }: OpsFormMessageProps): ReactElement {
  return (
    <div className="wms-ops-form-message-slot" aria-live="polite">
      <FormMessage className={cn('wms-ops-form-message', className)} />
    </div>
  );
}
