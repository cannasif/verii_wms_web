import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { KkdDistributionContextDto, KkdRemainingEntitlementDto, KkdResolvedStockDto } from '../../types/kkd.types';
import {
  KkdFlagChip,
  KkdOpsSection,
  KkdResultPanel,
} from '../kkd-ops-ui';
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
  const { t } = useTranslation(['kkd', 'common']);

  return (
    <KkdOpsSection title={t(`${dist}.entitlementsTitle`)}>
      {!resolvedEmployeeExists ? (
        <p className="text-sm opacity-70">{t(`${dist}.noEmployeePick`)}</p>
      ) : isLoading ? (
        <p className="text-sm opacity-70">{t(`${dist}.entitlementsLoading`)}</p>
      ) : !distributionContext?.remainingEntitlements?.length ? (
        <p className="text-sm opacity-70">{t(`${dist}.noEntitlementGroup`)}</p>
      ) : (
        <div className="space-y-3">
          {distributionContext.remainingEntitlements.map((item: KkdRemainingEntitlementDto) => (
            <KkdResultPanel
              key={item.groupCode}
              tone={item.groupCode === resolvedStock?.groupCode ? 'success' : 'default'}
            >
              <div className="flex flex-wrap items-center gap-2">
                <KkdFlagChip>{formatGroupLabel(item.groupCode, item.groupName) || '-'}</KkdFlagChip>
                {item.suggestedPhaseType ? <KkdFlagChip tone="info">{item.suggestedPhaseType}</KkdFlagChip> : null}
                <KkdFlagChip>{t(`${dist}.firstEntry`)}: {item.remainingInitialQuantity}</KkdFlagChip>
                <KkdFlagChip>{t(`${dist}.month3`)}: {item.remainingThreeMonthQuantity}</KkdFlagChip>
                <KkdFlagChip>{t(`${dist}.routine`)}: {item.remainingRecurringQuantity}</KkdFlagChip>
                <KkdFlagChip tone="info">{t(`${dist}.totalRem`)}: {item.totalRemainingQuantity}</KkdFlagChip>
              </div>
              {item.message ? <p className="mt-2 text-sm opacity-80">{item.message}</p> : null}
            </KkdResultPanel>
          ))}
        </div>
      )}
    </KkdOpsSection>
  );
}
