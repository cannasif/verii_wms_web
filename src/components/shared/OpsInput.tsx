import { type ChangeEvent, type FocusEvent, type ReactElement, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OPS_FIELD_CLASS } from './ops-field-styles';
import { OpsFieldShell } from './OpsFieldShell';

type OpsInputProps = React.ComponentProps<typeof Input> & {
  showSpinButtons?: boolean;
};

function getStepPrecision(step: OpsInputProps['step']): number {
  if (step == null || step === 'any') return 0;
  const stepText = String(step);
  const dotIndex = stepText.indexOf('.');
  return dotIndex >= 0 ? stepText.length - dotIndex - 1 : 0;
}

export function OpsInput({
  className,
  'aria-invalid': ariaInvalid,
  type,
  onFocus,
  onChange,
  value,
  step,
  min,
  max,
  disabled,
  readOnly,
  showSpinButtons,
  ...props
}: OpsInputProps): ReactElement {
  const isNumber = type === 'number';
  const spinEnabled = isNumber && showSpinButtons !== false && !disabled && !readOnly;

  const handleFocus = (event: FocusEvent<HTMLInputElement>): void => {
    if (isNumber) {
      event.currentTarget.select();
    }
    onFocus?.(event);
  };

  const adjustValue = useCallback((direction: 'up' | 'down'): void => {
    if (!onChange) return;

    const stepNum = step != null && step !== 'any' ? Number(step) : 1;
    const minNum = min != null && min !== '' ? Number(min) : null;
    const maxNum = max != null && max !== '' ? Number(max) : null;
    const raw = value === '' || value == null ? 0 : Number(value);
    const current = Number.isFinite(raw) ? raw : 0;
    let next = direction === 'up' ? current + stepNum : current - stepNum;

    if (minNum != null && Number.isFinite(minNum)) {
      next = Math.max(minNum, next);
    }
    if (maxNum != null && Number.isFinite(maxNum)) {
      next = Math.min(maxNum, next);
    }

    const precision = getStepPrecision(step);
    if (precision > 0) {
      next = Number(next.toFixed(precision));
    }

    onChange({
      target: { value: String(next) },
      currentTarget: { value: String(next) },
    } as ChangeEvent<HTMLInputElement>);
  }, [max, min, onChange, step, value]);

  const inputElement = (
    <Input
      aria-invalid={ariaInvalid}
      type={type}
      value={value}
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
      className={cn(
        OPS_FIELD_CLASS,
        spinEnabled && 'wms-ops-field--with-spin',
        readOnly && 'wms-ops-field--locked',
        className,
      )}
      onFocus={handleFocus}
      onChange={onChange}
      {...props}
    />
  );

  return (
    <OpsFieldShell aria-invalid={ariaInvalid}>
      {spinEnabled ? (
        <div className="wms-ops-number-field">
          {inputElement}
          <div className="wms-ops-number-field__spin">
            <button
              type="button"
              className="wms-ops-number-field__spin-btn"
              aria-label="Artır"
              tabIndex={-1}
              onClick={() => adjustValue('up')}
            >
              <ChevronUp className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className="wms-ops-number-field__spin-btn"
              aria-label="Azalt"
              tabIndex={-1}
              onClick={() => adjustValue('down')}
            >
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        inputElement
      )}
    </OpsFieldShell>
  );
}
