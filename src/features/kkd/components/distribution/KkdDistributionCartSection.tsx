import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton } from '@/components/shared';
import {
  KkdEmployeeSummaryPanel,
  KkdFlagChip,
  KkdOpsSection,
  KkdResultPanel,
} from '../kkd-ops-ui';
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
  const { t } = useTranslation(['kkd', 'common']);

  return (
    <KkdOpsSection title={t(`${dist}.cartTitle`)}>
      <div className="flex flex-wrap items-center gap-2">
        <KkdFlagChip>{t(`${dist}.lineN`)}: {cartLines.length}</KkdFlagChip>
        <KkdFlagChip tone="info">{t(`${dist}.totalQ`)}: {totalLineQuantity}</KkdFlagChip>
      </div>

      <div className="space-y-3">
        {cartLines.map((line) => (
          <KkdEmployeeSummaryPanel key={line.clientId}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{line.stockCode} - {line.stockName}</p>
                <p className="text-sm opacity-80">
                  {t(`${dist}.lineSummary`, {
                    g: formatGroupLabel(line.groupCode, line.groupName) || '-',
                    q: line.quantity,
                    p: line.entitlement.activePhaseLabel || (line.entitledQuantity <= 0 && line.excessQuantity > 0 ? t(`${dist}.openOrderOverride`) : '-'),
                  })}
                </p>
                <p className="text-sm opacity-80">
                  {t(`${dist}.lineOpen`, { d: line.openOrderDocumentNos || '-', p: line.openOrderPendingQuantity })}
                </p>
                {line.isExcessIssue ? (
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-300">
                    {t(`${dist}.lineExcess`, { e: line.entitledQuantity, x: line.excessQuantity })}
                  </p>
                ) : null}
                {line.entitledQuantity <= 0 && line.excessQuantity > 0 && line.openOrderPendingQuantity > 0 ? (
                  <p className="text-sm opacity-80">
                    {t(`${dist}.lineOpenOrderOnly`)}
                  </p>
                ) : null}
              </div>
              <OpsActionButton type="button" variant="secondary" onClick={() => onRemoveLine(line.clientId)}>
                {t(`${dist}.removeLine`)}
              </OpsActionButton>
            </div>
          </KkdEmployeeSummaryPanel>
        ))}
        {!cartLines.length ? (
          <KkdResultPanel tone="default">
            <p className="text-center text-sm opacity-70">{t(`${dist}.emptyCart`)}</p>
          </KkdResultPanel>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <OpsActionButton type="button" variant="primary" onClick={onSubmit} disabled={!cartLines.length || isSubmitting}>
          {t(`${dist}.saveSubmit`)}
        </OpsActionButton>
        <OpsActionButton type="button" variant="secondary" onClick={onClearCart} disabled={!cartLines.length}>
          {t(`${dist}.clearCart`)}
        </OpsActionButton>
      </div>
    </KkdOpsSection>
  );
}
