import { type ReactElement } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OpsActionButton } from './OpsActionButton';

interface OpsPanelPaginationProps {
  pageNumber: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'ops';
}

export function OpsPanelPagination({
  pageNumber,
  totalPages,
  onPrevious,
  onNext,
  className,
  disabled = false,
  variant = 'ops',
}: OpsPanelPaginationProps): ReactElement {
  const { t } = useTranslation('common');
  const isOps = variant === 'ops';
  const canGoPrevious = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;
  const label = t('paged.pageIndicator', { page: pageNumber, totalPages });

  if (isOps) {
    return (
      <div className={cn('wms-ops-panel-pagination', className)}>
        <OpsActionButton
          type="button"
          variant="secondary"
          className="wms-ops-panel-pagination__btn"
          onClick={onPrevious}
          disabled={disabled || !canGoPrevious}
          aria-label={t('previous')}
        >
          <ChevronLeft className="size-3.5" aria-hidden />
        </OpsActionButton>
        <span className="wms-ops-panel-pagination__label">{label}</span>
        <OpsActionButton
          type="button"
          variant="secondary"
          className="wms-ops-panel-pagination__btn"
          onClick={onNext}
          disabled={disabled || !canGoNext}
          aria-label={t('next')}
        >
          <ChevronRight className="size-3.5" aria-hidden />
        </OpsActionButton>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 px-2 py-2', className)}>
      <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={disabled || !canGoPrevious}>
        <ChevronLeft className="size-4" aria-hidden />
        {t('previous')}
      </Button>
      <span className="text-xs text-muted-foreground">{label}</span>
      <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={disabled || !canGoNext}>
        {t('next')}
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
