import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TFunction } from 'i18next';
import { localizeStatus } from '@/lib/localize-status';
import type { KkdOrderHeaderDto } from '../../types/kkd.types';
import type { LocalOrderLine } from './shared';

interface KkdInitialOrderCartSectionProps {
  t: TFunction<'common'>;
  cartLines: LocalOrderLine[];
  onRemoveLine: (clientId: string) => void;
  onSubmit: () => void;
  onClearCart: () => void;
  submitDisabled: boolean;
  clearDisabled: boolean;
  submittedHeader: KkdOrderHeaderDto | null;
}

export function KkdInitialOrderCartSection({
  t,
  cartLines,
  onRemoveLine,
  onSubmit,
  onClearCart,
  submitDisabled,
  clearDisabled,
  submittedHeader,
}: KkdInitialOrderCartSectionProps): ReactElement {
  return (
    <Card>
      <CardHeader><CardTitle>{t('kkd.operational.initialOrder.cardOrder')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {t('kkd.operational.initialOrder.lineCount')}: {cartLines.length}
            </Badge>
            <Badge variant="outline">
              {t('kkd.operational.initialOrder.totalQty')}: {cartLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {cartLines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t('kkd.operational.initialOrder.noLines')}
            </div>
          ) : cartLines.map((line) => (
            <div key={line.clientId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap gap-2">
                <Badge>{line.groupCode}</Badge>
                <Badge variant="secondary">{line.stockCode}</Badge>
                <Badge variant="outline">
                  {t('common.quantity')}: {line.quantity}
                </Badge>
              </div>
              <p className="mt-2 font-medium text-slate-900 dark:text-white">{line.stockName}</p>
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveLine(line.clientId)}>
                  {t('kkd.operational.initialOrder.remove')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={onSubmit} disabled={submitDisabled}>
            {t('kkd.operational.initialOrder.save')}
          </Button>
          <Button type="button" variant="outline" onClick={onClearCart} disabled={clearDisabled}>
            {t('kkd.operational.initialOrder.clearCart')}
          </Button>
        </div>

        {submittedHeader ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-800/40 dark:bg-emerald-950/20">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {t('kkd.operational.initialOrder.headerPrefix')} #{submittedHeader.id}
              </Badge>
              <Badge>{localizeStatus(submittedHeader.status, t)}</Badge>
            </div>
            <p className="mt-2">
              {t('kkd.operational.initialOrder.documentNo')}: {submittedHeader.documentNo || '-'}
            </p>
            <p className="mt-1">
              {t('kkd.operational.initialOrder.lineCountN')}: {submittedHeader.lines.length}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
