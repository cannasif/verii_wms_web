import { type ReactElement } from 'react';
import { AlertTriangle, CheckCircle2, Link2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransferChainReadinessQuery } from '../hooks/useTransferChainQueries';
import type { TransferChainReadinessDto } from '../types/transfer-chain.types';

interface TransferChainReadinessCardProps {
  sourceType: string;
  sourceHeaderId: number | null;
  compact?: boolean;
}

export function TransferChainReadinessCard({ sourceType, sourceHeaderId, compact = false }: TransferChainReadinessCardProps): ReactElement | null {
  const { t } = useTranslation('transfer-chain');
  const query = useTransferChainReadinessQuery(sourceType, sourceHeaderId);

  if (!sourceHeaderId || query.isLoading) {
    return (
      <Card className="border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
        <CardContent className={compact ? 'flex items-center gap-3 p-3' : 'flex items-center gap-3 p-4'}>
          <Loader2 className="size-4 animate-spin text-slate-500" />
          <span className="text-sm text-muted-foreground">{t('readiness.loading')}</span>
        </CardContent>
      </Card>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10">
        <CardContent className={compact ? 'flex items-center justify-between gap-3 p-3' : 'flex items-center justify-between gap-3 p-4'}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">{t('readiness.error')}</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>{t('readiness.retry')}</Button>
        </CardContent>
      </Card>
    );
  }

  return <ReadinessContent readiness={query.data} compact={compact} />;
}

export function isTransferChainBlocked(readiness?: TransferChainReadinessDto | null): boolean {
  return Boolean(readiness?.isChained && !readiness.canStart);
}

function ReadinessContent({ readiness, compact }: { readiness: TransferChainReadinessDto; compact: boolean }): ReactElement | null {
  const { t } = useTranslation('transfer-chain');

  if (!readiness.isChained) {
    return null;
  }

  const blocked = !readiness.canStart;
  const statusTone = blocked
    ? 'border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10'
    : 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/10';
  const icon = blocked
    ? <AlertTriangle className="size-5 text-amber-600" />
    : <CheckCircle2 className="size-5 text-emerald-600" />;

  return (
    <Card className={statusTone}>
      <CardContent className={compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <div className="text-sm font-semibold">
                {blocked ? t('readiness.blockedTitle') : t('readiness.readyTitle')}
              </div>
              <div className="text-xs text-muted-foreground">
                {readiness.transferChainCode
                  ? t('readiness.chainCode', { code: readiness.transferChainCode })
                  : t('readiness.chained')}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {readiness.sequenceNo ? <Badge variant="outline">{t('readiness.step', { step: readiness.sequenceNo })}</Badge> : null}
            {readiness.status ? <Badge variant={blocked ? 'secondary' : 'default'}>{t(`stepStatus.${readiness.status}`, { defaultValue: readiness.status })}</Badge> : null}
          </div>
        </div>

        {blocked ? (
          <div className="rounded-lg border border-amber-200/80 bg-white/70 p-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-black/10 dark:text-amber-50">
            <div className="font-medium">{readiness.blockedReason ?? t('readiness.defaultBlockedReason')}</div>
            {readiness.blockingSteps.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {readiness.blockingSteps.map((step) => (
                  <Badge key={`${step.sourceType}-${step.sourceHeaderId}-${step.stepId}`} variant="outline" className="bg-white/70">
                    <Link2 className="mr-1 size-3" />
                    {t('readiness.blockingStep', {
                      source: t(`sourceType.${step.sourceType}`, { defaultValue: step.sourceType }),
                      id: step.sourceHeaderId,
                      step: step.sequenceNo,
                    })}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-emerald-900 dark:text-emerald-50">{t('readiness.readyDescription')}</p>
        )}
      </CardContent>
    </Card>
  );
}
