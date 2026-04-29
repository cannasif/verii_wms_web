import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { KkdEntitlementCheckResultDto, KkdRemainingEntitlementDto, KkdResolvedStockDto } from '../../types/kkd.types';
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
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${dist}.scanTitle`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="kkd-barcode">{t(`${dist}.barcode`)}</Label>
            <Input id="kkd-barcode" value={barcode} onChange={(e) => onBarcodeChange(e.target.value)} placeholder={t(`${dist}.barcodePh`)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kkd-qty">{t(`${dist}.qty`)}</Label>
            <Input id="kkd-qty" type="number" min="1" step="1" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={onResolveStock} disabled={!canResolveStock || isResolvingStock}>
              {t(`${dist}.resolveBarcode`)}
            </Button>
          </div>
        </div>

        {resolvedStock ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{resolvedStock.stockCode}</Badge>
              {resolvedStock.groupCode ? <Badge variant="secondary">{formatGroupLabel(resolvedStock.groupCode, resolvedStock.groupName)}</Badge> : null}
              <Badge variant="outline">{t(`${dist}.stockBalance`)}: {resolvedStock.availableQuantity}</Badge>
            </div>
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">{resolvedStock.stockName}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t(`${dist}.stockSavedNote`, { code: resolvedStock.stockCode })}
            </p>
          </div>
        ) : null}

        {resolvedStock ? (
          <div className={`rounded-2xl border p-4 ${hasMatchingOpenOrder ? 'border-sky-200 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/20' : 'border-rose-200 bg-rose-50/60 dark:border-rose-800/40 dark:bg-rose-950/20'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={hasMatchingOpenOrder ? 'default' : 'destructive'}>
                {hasMatchingOpenOrder ? t(`${dist}.openOrderY`) : t(`${dist}.openOrderN`)}
              </Badge>
              <Badge variant="outline">{t(`${dist}.stockPrefix`)}: {resolvedStock.stockCode}</Badge>
              {resolvedStock.groupCode ? <Badge variant="secondary">{t(`${dist}.groupPrefix`)}: {formatGroupLabel(resolvedStock.groupCode, resolvedStock.groupName)}</Badge> : null}
              <Badge variant="outline">{t(`${dist}.pending`)}: {totalOpenOrderPendingQuantity}</Badge>
            </div>
            {openOrderDocumentNos ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t(`${dist}.orderDocs`)}: {openOrderDocumentNos}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {hasMatchingOpenOrder
                ? isWithinOpenOrderQuantity
                  ? t(`${dist}.matchOk`)
                  : t(`${dist}.matchQty`, { max: totalOpenOrderPendingQuantity })
                : hasOpenOrderOnDifferentWarehouse
                  ? t(`${dist}.matchWarehouse`)
                  : t(`${dist}.matchNo`)}
            </p>
          </div>
        ) : null}

        {entitlementResult ? (
          <div className={`rounded-2xl border p-4 ${(entitlementResult.allowed || canIssueByOpenOrderOnly) ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/60 dark:border-rose-800/40 dark:bg-rose-950/20'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={(entitlementResult.allowed || canIssueAsExcess || canIssueByOpenOrderOnly) ? 'default' : 'destructive'}>
                {entitlementResult.allowed
                  ? t(`${dist}.entOk`)
                  : canIssueByOpenOrderOnly
                    ? t(`${dist}.openOrderOverride`)
                    : canIssueAsExcess
                      ? t(`${dist}.entOk`)
                      : t(`${dist}.entNo`)}
              </Badge>
              {entitlementResult.activePhaseLabel ? <Badge variant="secondary">{t(`${dist}.activePhase`)}: {entitlementResult.activePhaseLabel}</Badge> : null}
              <Badge variant="outline">{t(`${dist}.firstEntry`)}: {entitlementResult.remainingInitialQuantity}</Badge>
              <Badge variant="outline">{t(`${dist}.month3`)}: {entitlementResult.remainingThreeMonthQuantity}</Badge>
              <Badge variant="outline">{t(`${dist}.routine`)}: {entitlementResult.remainingRecurringQuantity}</Badge>
              <Badge variant="outline">{t(`${dist}.extraH`)}: {entitlementResult.remainingAdditionalQuantity}</Badge>
              <Badge variant="secondary">{t(`${dist}.totalRem`)}: {entitlementResult.totalRemainingQuantity}</Badge>
              {excessQuantity > 0 ? <Badge variant="destructive">{t(`${dist}.excessIssue`)}: {excessQuantity}</Badge> : null}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/3">
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
                <p className="mt-2 text-slate-600 dark:text-slate-300">{entitlementResult.groupMatchMessage}</p>
              ) : null}
            </div>
            {entitlementResult.eligibilityExplanation ? <p className="mt-3 text-sm">{entitlementResult.eligibilityExplanation}</p> : null}
            {entitlementResult.message ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{entitlementResult.message}</p> : null}
            {(entitlementResult.allowed || canIssueAsExcess || canIssueByOpenOrderOnly) && resolvedStock ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/3">
                <p>{t(`${dist}.entQtyLine`)}: <span className="font-medium">{entitledQuantity}</span></p>
                <p className="mt-1">{t(`${dist}.entExcessLine`)}: <span className="font-medium">{excessQuantity}</span></p>
                {canIssueByOpenOrderOnly ? (
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{t(`${dist}.openOrderIssueSummary`)}</p>
                ) : null}
              </div>
            ) : null}
            {entitlementResult.phaseStatuses?.length ? (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {entitlementResult.phaseStatuses.map((phase) => (
                  <div key={phase.phaseType} className={`rounded-xl border p-3 ${phase.isCurrentPhase ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/3'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={phase.isCurrentPhase ? 'default' : 'outline'}>{phase.phaseLabel}</Badge>
                      {phase.isAllowed ? <Badge variant="secondary">{t(`${dist}.phaseUsable`)}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm">{t(`${dist}.defined`)}: {phase.definedQuantity}</p>
                    <p className="text-sm">{t(`${dist}.remain`)}: {phase.remainingQuantity}</p>
                    {phase.frequencyDays ? <p className="text-sm">{t(`${dist}.frequencyLine`, { days: phase.frequencyDays, qty: phase.quantityPerFrequency ?? 0 })}</p> : null}
                    {phase.message ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{phase.message}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedGroupEntitlement && !entitlementResult ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            {t(`${dist}.groupEntSummary`, {
              a: selectedGroupEntitlement.remainingInitialQuantity,
              b: selectedGroupEntitlement.remainingThreeMonthQuantity,
              c: selectedGroupEntitlement.remainingRecurringQuantity,
              total: selectedGroupEntitlement.totalRemainingQuantity,
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <div title={!canAddLine ? addLineDisabledReason : undefined}>
            <span className="inline-flex">
              <Button type="button" onClick={onAddLine} disabled={!canAddLine}>
                {t(`${dist}.addLine`)}
              </Button>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
