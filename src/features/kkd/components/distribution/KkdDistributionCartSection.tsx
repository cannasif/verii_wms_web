import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type LocalDistributionLine, formatGroupLabel } from './shared';

interface KkdDistributionCartSectionProps {
  cartLines: LocalDistributionLine[];
  totalLineQuantity: number;
  onRemoveLine: (clientId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onClearCart: () => void;
}

const dist = 'kkd.operational.dist' as const;

export function KkdDistributionCartSection({
  cartLines,
  totalLineQuantity,
  onRemoveLine,
  onSubmit,
  isSubmitting,
  onClearCart,
}: KkdDistributionCartSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${dist}.cartTitle`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(`${dist}.lineN`)}: {cartLines.length}</Badge>
          <Badge variant="secondary">{t(`${dist}.totalQ`)}: {totalLineQuantity}</Badge>
        </div>

        <div className="space-y-3">
          {cartLines.map((line) => (
            <div key={line.clientId} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{line.stockCode} - {line.stockName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t(`${dist}.lineSummary`, {
                      g: formatGroupLabel(line.groupCode, line.groupName) || '-',
                      q: line.quantity,
                      p: line.entitlement.activePhaseLabel || (line.entitledQuantity <= 0 && line.excessQuantity > 0 ? t(`${dist}.openOrderOverride`) : '-'),
                    })}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t(`${dist}.lineOpen`, { d: line.openOrderDocumentNos || '-', p: line.openOrderPendingQuantity })}
                  </p>
                  {line.isExcessIssue ? (
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-300">
                      {t(`${dist}.lineExcess`, { e: line.entitledQuantity, x: line.excessQuantity })}
                    </p>
                  ) : null}
                  {line.entitledQuantity <= 0 && line.excessQuantity > 0 && line.openOrderPendingQuantity > 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {t(`${dist}.lineOpenOrderOnly`)}
                    </p>
                  ) : null}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveLine(line.clientId)}>
                  {t(`${dist}.removeLine`)}
                </Button>
              </div>
            </div>
          ))}
          {!cartLines.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t(`${dist}.emptyCart`)}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onSubmit} disabled={!cartLines.length || isSubmitting}>
            {t(`${dist}.saveSubmit`)}
          </Button>
          <Button type="button" variant="outline" onClick={onClearCart} disabled={!cartLines.length}>
            {t(`${dist}.clearCart`)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
