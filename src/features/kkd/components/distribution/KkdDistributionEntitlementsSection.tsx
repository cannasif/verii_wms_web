import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KkdDistributionContextDto, KkdRemainingEntitlementDto, KkdResolvedStockDto } from '../../types/kkd.types';
import { formatGroupLabel } from './shared';

interface KkdDistributionEntitlementsSectionProps {
  resolvedEmployeeExists: boolean;
  isLoading: boolean;
  distributionContext?: KkdDistributionContextDto;
  resolvedStock: KkdResolvedStockDto | null;
}

const dist = 'kkd.operational.dist' as const;

export function KkdDistributionEntitlementsSection({
  resolvedEmployeeExists,
  isLoading,
  distributionContext,
  resolvedStock,
}: KkdDistributionEntitlementsSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${dist}.entitlementsTitle`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!resolvedEmployeeExists ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noEmployeePick`)}</p>
        ) : isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.entitlementsLoading`)}</p>
        ) : !distributionContext?.remainingEntitlements?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noEntitlementGroup`)}</p>
        ) : (
          <div className="space-y-3">
            {distributionContext.remainingEntitlements.map((item: KkdRemainingEntitlementDto) => (
              <div
                key={item.groupCode}
                className={`rounded-2xl border p-4 ${
                  item.groupCode === resolvedStock?.groupCode
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{formatGroupLabel(item.groupCode, item.groupName) || '-'}</Badge>
                  {item.suggestedPhaseType ? <Badge variant="secondary">{item.suggestedPhaseType}</Badge> : null}
                  <Badge variant="outline">{t(`${dist}.firstEntry`)}: {item.remainingInitialQuantity}</Badge>
                  <Badge variant="outline">{t(`${dist}.month3`)}: {item.remainingThreeMonthQuantity}</Badge>
                  <Badge variant="outline">{t(`${dist}.routine`)}: {item.remainingRecurringQuantity}</Badge>
                  <Badge variant="secondary">{t(`${dist}.totalRem`)}: {item.totalRemainingQuantity}</Badge>
                </div>
                {item.message ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p> : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
