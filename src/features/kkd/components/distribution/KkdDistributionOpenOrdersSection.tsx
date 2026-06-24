import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { KkdCariAcikSiparisDto, KkdDistributionContextDto, KkdResolvedEmployeeDto, KkdResolvedStockDto } from '../../types/kkd.types';
import {
  KkdFlagChip,
  KkdOpsSection,
  KkdResultPanel,
} from '../kkd-ops-ui';
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
  const { t } = useTranslation(['kkd', 'common']);

  return (
    <KkdOpsSection title={t(`${dist}.openOrdersTitle`)}>
      {!resolvedEmployee ? (
        <p className="text-sm opacity-70">{t(`${dist}.noOpenOrdersContext`)}</p>
      ) : isLoading ? (
        <p className="text-sm opacity-70">{t(`${dist}.openOrdersLoading`)}</p>
      ) : !distributionContext?.cariAcikSiparis?.length ? (
        <p className="text-sm opacity-70">{t(`${dist}.noOpenOrderForCustomer`)}</p>
      ) : (
        <div className="space-y-3">
          {distributionContext.cariAcikSiparis.map((item: KkdCariAcikSiparisDto, index) => (
            <KkdResultPanel
              key={`${item.documentNo}-${item.stockCode}-${index}`}
              tone={item.groupCode && item.groupCode === resolvedStock?.groupCode ? 'success' : 'default'}
            >
              <div className="flex flex-wrap items-center gap-2">
                <KkdFlagChip>{item.stockCode}</KkdFlagChip>
                {item.groupCode ? <KkdFlagChip tone="info">{formatGroupLabel(item.groupCode, item.groupName)}</KkdFlagChip> : null}
                <KkdFlagChip>{t(`${dist}.badgeFis`)}: {item.documentNo}</KkdFlagChip>
                <KkdFlagChip>{t(`${dist}.pending`)}: {item.pendingQuantity}</KkdFlagChip>
                {item.warehouseCode != null ? <KkdFlagChip>{t(`${dist}.whCode`)}: {item.warehouseCode}</KkdFlagChip> : null}
              </div>
              {item.stockName ? <p className="mt-2 font-medium">{item.stockName}</p> : null}
              <p className="mt-2 text-sm opacity-80">
                {t(`${dist}.orderMeta`, {
                  d: new Date(item.transactionDate).toLocaleDateString(dateLocale),
                  c: item.customerCode || resolvedEmployee.customerCode,
                })}
              </p>
            </KkdResultPanel>
          ))}
        </div>
      )}
    </KkdOpsSection>
  );
}
