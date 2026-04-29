import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KkdCariAcikSiparisDto, KkdDistributionContextDto, KkdResolvedEmployeeDto, KkdResolvedStockDto } from '../../types/kkd.types';
import { formatGroupLabel } from './shared';

interface KkdDistributionOpenOrdersSectionProps {
  resolvedEmployee: KkdResolvedEmployeeDto | null;
  isLoading: boolean;
  distributionContext?: KkdDistributionContextDto;
  resolvedStock: KkdResolvedStockDto | null;
  dateLocale: string;
}

const dist = 'kkd.operational.dist' as const;

export function KkdDistributionOpenOrdersSection({
  resolvedEmployee,
  isLoading,
  distributionContext,
  resolvedStock,
  dateLocale,
}: KkdDistributionOpenOrdersSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${dist}.openOrdersTitle`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!resolvedEmployee ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noOpenOrdersContext`)}</p>
        ) : isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.openOrdersLoading`)}</p>
        ) : !distributionContext?.cariAcikSiparis?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noOpenOrderForCustomer`)}</p>
        ) : (
          <div className="space-y-3">
            {distributionContext.cariAcikSiparis.map((item: KkdCariAcikSiparisDto, index) => (
              <div
                key={`${item.documentNo}-${item.stockCode}-${index}`}
                className={`rounded-2xl border p-4 ${
                  item.groupCode && item.groupCode === resolvedStock?.groupCode
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.stockCode}</Badge>
                  {item.groupCode ? <Badge variant="secondary">{formatGroupLabel(item.groupCode, item.groupName)}</Badge> : null}
                  <Badge variant="outline">{t(`${dist}.badgeFis`)}: {item.documentNo}</Badge>
                  <Badge variant="outline">{t(`${dist}.pending`)}: {item.pendingQuantity}</Badge>
                  {item.warehouseCode != null ? <Badge variant="outline">{t(`${dist}.whCode`)}: {item.warehouseCode}</Badge> : null}
                </div>
                {item.stockName ? <p className="mt-2 font-medium text-slate-900 dark:text-white">{item.stockName}</p> : null}
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t(`${dist}.orderMeta`, {
                    d: new Date(item.transactionDate).toLocaleDateString(dateLocale),
                    c: item.customerCode || resolvedEmployee.customerCode,
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
