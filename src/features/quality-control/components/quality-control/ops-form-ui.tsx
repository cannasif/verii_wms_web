import { type ReactElement, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QcOpsFieldProps {
  label: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function QcOpsField({
  label,
  required = false,
  className,
  children,
}: QcOpsFieldProps): ReactElement {
  return (
    <div className={cn('wms-ops-form-item space-y-2', className)}>
      <Label>
        {label}
        {required ? <span className="wms-ops-required"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

interface QcOpsGuidanceProps {
  title: string;
  lines: string[];
}

export function QcOpsGuidance({ title, lines }: QcOpsGuidanceProps): ReactElement {
  return (
    <div className="wms-ops-hint-banner flex-col !items-start gap-2">
      <span className="font-semibold">{title}</span>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
