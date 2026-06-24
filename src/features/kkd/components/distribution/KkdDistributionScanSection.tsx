import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput } from '@/components/shared';
import type { KkdEntitlementCheckResultDto, KkdRemainingEntitlementDto, KkdResolvedStockDto } from '../../types/kkd.types';
import {
  KkdEmployeeSummaryPanel,
  KkdFlagChip,
  KkdOpsFormField,
  KkdOpsSection,
  KkdResultPanel,
  kkdOpsStatusBadge,
} from '../kkd-ops-ui';
import { formatGroupLabel } from './shared';

interface KkdDistributionScanSectionProps {
  barcode: string;
  onBarcodeChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  onResolveStock: () => void;
  canResolveStock: boolean;
  isResolvingStock: boolean;
  resolvedStock: KkdResolvedStockDto | null;
  hasMatchingOpenOrder: boolean;
  hasOpenOrderOnDifferentWarehouse: boolean;
  isWithinOpenOrderQuantity: boolean;
  totalOpenOrderPendingQuantity: number;
  openOrderDocumentNos: string;
  entitlementResult: KkdEntitlementCheckResultDto | null;
  canIssueByOpenOrderOnly: boolean;
  canIssueAsExcess: boolean;
  selectedGroupEntitlement: KkdRemainingEntitlementDto | null;
  entitledQuantity: number;
  excessQuantity: number;
  canAddLine: boolean;
  addLineDisabledReason: string;
  onAddLine: () => void;
}

const dist = 'kkd.operational.dist' as const;

export function KkdDistributionScanSection({
  barcode,
  onBarcodeChange,
  quantity,
  onQuantityChange,
  onResolveStock,
  canResolveStock,
  isResolvingStock,
  resolvedStock,
  hasMatchingOpenOrder,
  hasOpenOrderOnDifferentWarehouse,
  isWithinOpenOrderQuantity,
  totalOpenOrderPendingQuantity,
  openOrderDocumentNos,
  entitlementResult,
  canIssueByOpenOrderOnly,
  canIssueAsExcess,
  selectedGroupEntitlement,
  entitledQuantity,
  excessQuantity,
  canAddLine,
  addLineDisabledReason,
  onAddLine,
}: KkdDistributionScanSectionProps): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);

  return (
    <KkdOpsSection title={t(`${dist}.scanTitle`)}>
      <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr] md:gap-5">
        <KkdOpsFormField label={t(`${dist}.barcode`)} htmlFor="kkd-barcode">
          <OpsInput
            id="kkd-barcode"
            value={barcode}
            onChange={(e) => onBarcodeChange(e.target.value)}
            placeholder={t(`${dist}.barcodePh`)}
          />
        </KkdOpsFormField>
        <KkdOpsFormField label={t(`${dist}.qty`)} htmlFor="kkd-qty">
          <OpsInput
            id="kkd-qty"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
          />
        </KkdOpsFormField>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <OpsActionButton type="button" variant="primary" onClick={onResolveStock} disabled={!canResolveStock || isResolvingStock}>
          {t(`${dist}.resolveBarcode`)}
        </OpsActionButton>
      </div>

      {resolvedStock ? (
        <KkdEmployeeSummaryPanel>
          <div className="flex flex-wrap items-center gap-2">
            <KkdFlagChip>{resolvedStock.stockCode}</KkdFlagChip>
            {resolvedStock.groupCode ? (
              <KkdFlagChip tone="info">{formatGroupLabel(resolvedStock.groupCode, resolvedStock.groupName)}</KkdFlagChip>
            ) : null}
            <KkdFlagChip>{t(`${dist}.stockBalance`)}: {resolvedStock.availableQuantity}</KkdFlagChip>
          </div>
          <p className="mt-3 font-semibold">{resolvedStock.stockName}</p>
          <p className="mt-2 text-sm opacity-80">
            {t(`${dist}.stockSavedNote`, { code: resolvedStock.stockCode })}
          </p>
        </KkdEmployeeSummaryPanel>
      ) : null}

      {resolvedStock ? (
        <KkdResultPanel tone={hasMatchingOpenOrder ? 'success' : 'danger'}>
          <div className="flex flex-wrap items-center gap-2">
            {kkdOpsStatusBadge(
              hasMatchingOpenOrder ? t(`${dist}.openOrderY`) : t(`${dist}.openOrderN`),
              hasMatchingOpenOrder ? 'active' : 'danger',
            )}
            <KkdFlagChip>{t(`${dist}.stockPrefix`)}: {resolvedStock.stockCode}</KkdFlagChip>
            {resolvedStock.groupCode ? (
              <KkdFlagChip tone="info">{t(`${dist}.groupPrefix`)}: {formatGroupLabel(resolvedStock.groupCode, resolvedStock.groupName)}</KkdFlagChip>
            ) : null}
            <KkdFlagChip>{t(`${dist}.pending`)}: {totalOpenOrderPendingQuantity}</KkdFlagChip>
          </div>
          {openOrderDocumentNos ? (
            <p className="mt-2 text-sm opacity-80">
              {t(`${dist}.orderDocs`)}: {openOrderDocumentNos}
            </p>
          ) : null}
          <p className="mt-2 text-sm opacity-80">
            {hasMatchingOpenOrder
              ? isWithinOpenOrderQuantity
                ? t(`${dist}.matchOk`)
                : t(`${dist}.matchQty`, { max: totalOpenOrderPendingQuantity })
              : hasOpenOrderOnDifferentWarehouse
                ? t(`${dist}.matchWarehouse`)
                : t(`${dist}.matchNo`)}
          </p>
        </KkdResultPanel>
      ) : null}

      {entitlementResult ? (
        <KkdResultPanel tone={(entitlementResult.allowed || canIssueByOpenOrderOnly) ? 'success' : 'danger'}>
          <div className="flex flex-wrap items-center gap-2">
            {kkdOpsStatusBadge(
              entitlementResult.allowed
                ? t(`${dist}.entOk`)
                : canIssueByOpenOrderOnly
                  ? t(`${dist}.openOrderOverride`)
                  : canIssueAsExcess
                    ? t(`${dist}.entOk`)
                    : t(`${dist}.entNo`),
              (entitlementResult.allowed || canIssueAsExcess || canIssueByOpenOrderOnly) ? 'active' : 'danger',
            )}
            {entitlementResult.activePhaseLabel ? (
              <KkdFlagChip tone="info">{t(`${dist}.activePhase`)}: {entitlementResult.activePhaseLabel}</KkdFlagChip>
            ) : null}
            <KkdFlagChip>{t(`${dist}.firstEntry`)}: {entitlementResult.remainingInitialQuantity}</KkdFlagChip>
            <KkdFlagChip>{t(`${dist}.month3`)}: {entitlementResult.remainingThreeMonthQuantity}</KkdFlagChip>
            <KkdFlagChip>{t(`${dist}.routine`)}: {entitlementResult.remainingRecurringQuantity}</KkdFlagChip>
            <KkdFlagChip>{t(`${dist}.extraH`)}: {entitlementResult.remainingAdditionalQuantity}</KkdFlagChip>
            <KkdFlagChip tone="info">{t(`${dist}.totalRem`)}: {entitlementResult.totalRemainingQuantity}</KkdFlagChip>
            {excessQuantity > 0 ? kkdOpsStatusBadge(`${t(`${dist}.excessIssue`)}: ${excessQuantity}`, 'danger') : null}
          </div>
          <KkdEmployeeSummaryPanel>
            <p>
              {t(`${dist}.readStock`)}: <span className="font-medium">{entitlementResult.resolvedStockCode || resolvedStock?.stockCode || '-'}</span>
              {entitlementResult.resolvedStockName ? ` - ${entitlementResult.resolvedStockName}` : ''}
            </p>
            <p className="mt-1">
              {t(`${dist}.readGroup`)}: <span className="font-medium">{formatGroupLabel(entitlementResult.requestedGroupCode || resolvedStock?.groupCode, resolvedStock?.groupName) || '-'}</span>
              {' | '}
              {t(`${dist}.entGroup`)}: <span className="font-medium">{formatGroupLabel(entitlementResult.matchedGroupCode, selectedGroupEntitlement?.groupName) || '-'}</span>
              {' | '}
              {t(`${dist}.stateLabel`)}: <span className={`font-medium ${entitlementResult.isGroupCodeMatched ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {entitlementResult.isGroupCodeMatched ? t(`${dist}.matchY`) : t(`${dist}.matchN`)}
              </span>
            </p>
            {entitlementResult.groupMatchMessage ? (
              <p className="mt-2 opacity-80">{entitlementResult.groupMatchMessage}</p>
            ) : null}
          </KkdEmployeeSummaryPanel>
          {entitlementResult.eligibilityExplanation ? <p className="mt-3 text-sm">{entitlementResult.eligibilityExplanation}</p> : null}
          {entitlementResult.message ? <p className="mt-2 text-sm opacity-80">{entitlementResult.message}</p> : null}
          {(entitlementResult.allowed || canIssueAsExcess || canIssueByOpenOrderOnly) && resolvedStock ? (
            <KkdEmployeeSummaryPanel>
              <p>{t(`${dist}.entQtyLine`)}: <span className="font-medium">{entitledQuantity}</span></p>
              <p className="mt-1">{t(`${dist}.entExcessLine`)}: <span className="font-medium">{excessQuantity}</span></p>
              {canIssueByOpenOrderOnly ? (
                <p className="mt-1 opacity-80">{t(`${dist}.openOrderIssueSummary`)}</p>
              ) : null}
            </KkdEmployeeSummaryPanel>
          ) : null}
          {entitlementResult.phaseStatuses?.length ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {entitlementResult.phaseStatuses.map((phase) => (
                <KkdResultPanel key={phase.phaseType} tone={phase.isCurrentPhase ? 'success' : 'default'}>
                  <div className="flex flex-wrap items-center gap-2">
                    {kkdOpsStatusBadge(phase.phaseLabel, phase.isCurrentPhase ? 'active' : 'pending')}
                    {phase.isAllowed ? <KkdFlagChip tone="success">{t(`${dist}.phaseUsable`)}</KkdFlagChip> : null}
                  </div>
                  <p className="mt-2 text-sm">{t(`${dist}.defined`)}: {phase.definedQuantity}</p>
                  <p className="text-sm">{t(`${dist}.remain`)}: {phase.remainingQuantity}</p>
                  {phase.frequencyDays ? <p className="text-sm">{t(`${dist}.frequencyLine`, { days: phase.frequencyDays, qty: phase.quantityPerFrequency ?? 0 })}</p> : null}
                  {phase.message ? <p className="mt-2 text-xs opacity-80">{phase.message}</p> : null}
                </KkdResultPanel>
              ))}
            </div>
          ) : null}
        </KkdResultPanel>
      ) : null}

      {selectedGroupEntitlement && !entitlementResult ? (
        <KkdEmployeeSummaryPanel>
          <p className="text-sm">
            {t(`${dist}.groupEntSummary`, {
              a: selectedGroupEntitlement.remainingInitialQuantity,
              b: selectedGroupEntitlement.remainingThreeMonthQuantity,
              c: selectedGroupEntitlement.remainingRecurringQuantity,
              total: selectedGroupEntitlement.totalRemainingQuantity,
            })}
          </p>
        </KkdEmployeeSummaryPanel>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <div title={!canAddLine ? addLineDisabledReason : undefined}>
          <span className="inline-flex">
            <OpsActionButton type="button" variant="primary" onClick={onAddLine} disabled={!canAddLine}>
              {t(`${dist}.addLine`)}
            </OpsActionButton>
          </span>
        </div>
      </div>
    </KkdOpsSection>
  );
}
