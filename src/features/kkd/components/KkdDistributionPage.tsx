import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useUIStore } from '@/stores/ui-store';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getLocaleForFormatting } from '@/lib/i18n';
import { localizeStatus } from '@/lib/localize-status';
import { kkdApi } from '../api/kkd.api';
import { useNavigate } from 'react-router-dom';
import type {
  KkdDistributionContextDto,
  KkdDistributionHeaderDto,
  KkdEntitlementCheckResultDto,
  KkdResolvedEmployeeDto,
  KkdResolvedStockDto,
} from '../types/kkd.types';
import type { WarehouseLookup } from '@/services/lookup-types';
import { KkdDistributionCartSection } from './distribution/KkdDistributionCartSection';
import { KkdDistributionEmployeeSection } from './distribution/KkdDistributionEmployeeSection';
import { KkdDistributionEntitlementsSection } from './distribution/KkdDistributionEntitlementsSection';
import { KkdDistributionOpenOrdersSection } from './distribution/KkdDistributionOpenOrdersSection';
import { KkdDistributionScanSection } from './distribution/KkdDistributionScanSection';
import { KkdInitialOrderPromptDialog } from './distribution/KkdInitialOrderPromptDialog';
import { type LocalDistributionLine } from './distribution/shared';

const dist = 'kkd.operational.dist' as const;

export function KkdDistributionPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const dateLocale = getLocaleForFormatting(i18n.language);
  const navigate = useNavigate();

  const [employeeQr, setEmployeeQr] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseLookup | null>(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [resolvedEmployee, setResolvedEmployee] = useState<KkdResolvedEmployeeDto | null>(null);
  const [resolvedStock, setResolvedStock] = useState<KkdResolvedStockDto | null>(null);
  const [entitlementResult, setEntitlementResult] = useState<KkdEntitlementCheckResultDto | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [submittedHeader, setSubmittedHeader] = useState<KkdDistributionHeaderDto | null>(null);
  const [cartLines, setCartLines] = useState<LocalDistributionLine[]>([]);
  const [initialOrderPromptOpen, setInitialOrderPromptOpen] = useState(false);
  const [initialOrderPromptHandledEmployeeId, setInitialOrderPromptHandledEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    setPageTitle(t(`${dist}.pageTitle`));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const distributionContextQuery = useQuery<KkdDistributionContextDto>({
    queryKey: ['kkd', 'distribution', 'context', resolvedEmployee?.employeeId],
    queryFn: () => kkdApi.getDistributionContext(resolvedEmployee!.employeeId),
    enabled: Boolean(resolvedEmployee?.employeeId),
  });

  const resolveQrMutation = useMutation({
    mutationFn: kkdApi.resolveEmployeeQr,
    onSuccess: (data) => {
      setResolvedEmployee(data);
      setSubmittedHeader(null);
      setResolvedStock(null);
      setEntitlementResult(null);
      setCartLines([]);
      toast.success(t(`${dist}.toastFound`));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const resolveStockMutation = useMutation({
    mutationFn: kkdApi.resolveStockBarcode,
    onSuccess: async (data) => {
      setResolvedStock(data);
      if (!resolvedEmployee) return;
      try {
        const entitlement = await kkdApi.checkEntitlement({
          employeeId: resolvedEmployee.employeeId,
          customerId: resolvedEmployee.customerId,
          groupCode: data.groupCode ?? '',
          stockId: data.stockId,
          stockCode: data.stockCode,
          stockName: data.stockName,
          quantity: Number(quantity) || 1,
        });
        setEntitlementResult(entitlement);
      } catch (error) {
        setEntitlementResult(null);
        toast.error(error instanceof Error ? error.message : t('common.generalError'));
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedEmployee || !selectedWarehouse || cartLines.length === 0) {
        throw new Error(t(`${dist}.errNeedAll`));
      }

      return kkdApi.submitDistribution({
        employeeId: resolvedEmployee.employeeId,
        warehouseId: selectedWarehouse.id,
        sourceChannel: 'WMS',
        lines: cartLines.map(({
          clientId: _clientId,
          stockCode: _stockCode,
          stockName: _stockName,
          groupCode: _groupCode,
          groupName: _groupName,
          entitlement: _entitlement,
          openOrderPendingQuantity: _openOrderPendingQuantity,
          openOrderDocumentNos: _openOrderDocumentNos,
          entitledQuantity: _entitledQuantity,
          excessQuantity: _excessQuantity,
          isExcessIssue: _isExcessIssue,
          ...line
        }) => line),
      });
    },
    onSuccess: (data) => {
      setSubmittedHeader(data);
      setCartLines([]);
      setBarcode('');
      setResolvedStock(null);
      setEntitlementResult(null);
      setQuantity('1');
      distributionContextQuery.refetch();
      toast.success(t(`${dist}.toastComplete`));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const canResolveStock = Boolean(resolvedEmployee && selectedWarehouse && barcode.trim());
  const totalLineQuantity = useMemo(
    () => cartLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [cartLines],
  );

  const selectedGroupEntitlement = useMemo(() => {
    if (!resolvedStock?.groupCode || !distributionContextQuery.data) return null;
    return distributionContextQuery.data.remainingEntitlements.find((item) => item.groupCode === resolvedStock.groupCode) ?? null;
  }, [distributionContextQuery.data, resolvedStock?.groupCode]);

  const matchingOpenOrders = useMemo(() => {
    if (!resolvedStock?.stockCode || !distributionContextQuery.data?.cariAcikSiparis?.length || !selectedWarehouse) return [];
    return distributionContextQuery.data.cariAcikSiparis.filter(
      (item) =>
        item.stockCode.trim().toUpperCase() === resolvedStock.stockCode.trim().toUpperCase()
        && item.warehouseCode != null
        && Number(item.warehouseCode) === Number(selectedWarehouse.depoKodu),
    );
  }, [distributionContextQuery.data, resolvedStock?.stockCode, selectedWarehouse]);

  const stockOpenOrdersAnyWarehouse = useMemo(() => {
    if (!resolvedStock?.stockCode || !distributionContextQuery.data?.cariAcikSiparis?.length) return [];
    return distributionContextQuery.data.cariAcikSiparis.filter(
      (item) => item.stockCode.trim().toUpperCase() === resolvedStock.stockCode.trim().toUpperCase(),
    );
  }, [distributionContextQuery.data, resolvedStock?.stockCode]);

  const totalOpenOrderPendingQuantity = useMemo(
    () => matchingOpenOrders.reduce((sum, item) => sum + (Number(item.pendingQuantity) || 0), 0),
    [matchingOpenOrders],
  );

  const openOrderDocumentNos = useMemo(
    () => Array.from(new Set(matchingOpenOrders.map((item) => item.documentNo).filter(Boolean))).join(', '),
    [matchingOpenOrders],
  );

  const requestedQuantity = Number(quantity) || 1;
  const hasMatchingOpenOrder = matchingOpenOrders.length > 0;
  const hasOpenOrderOnDifferentWarehouse = stockOpenOrdersAnyWarehouse.length > 0 && !hasMatchingOpenOrder;
  const isWithinOpenOrderQuantity = hasMatchingOpenOrder && requestedQuantity <= totalOpenOrderPendingQuantity;
  const canIssueByOpenOrderOnly = Boolean(
    resolvedStock
      && entitlementResult
      && !entitlementResult.allowed
      && isWithinOpenOrderQuantity,
  );
  const canIssueAsExcess = Boolean(
    resolvedStock
      && entitlementResult
      && !entitlementResult.allowed
      && entitlementResult.isGroupCodeMatched
      && entitlementResult.entitlementMatrixLineId
      && entitlementResult.remainingMainQuantity > 0
      && isWithinOpenOrderQuantity,
  );
  const canAddLine = Boolean(
    resolvedStock
      && isWithinOpenOrderQuantity
      && (entitlementResult?.allowed || canIssueAsExcess || canIssueByOpenOrderOnly),
  );
  const addLineDisabledReason = useMemo(() => {
    if (!resolvedEmployee) return t(`${dist}.reasonPickEmployee`);
    if (!selectedWarehouse) return t(`${dist}.reasonPickWarehouse`);
    if (!barcode.trim() && !resolvedStock) return t(`${dist}.reasonResolveBarcode`);
    if (!resolvedStock) return t(`${dist}.reasonResolveBarcode`);
    if (hasOpenOrderOnDifferentWarehouse) return t(`${dist}.reasonWarehouseMismatch`);
    if (!hasMatchingOpenOrder) return t(`${dist}.reasonMissingOpenOrder`);
    if (!isWithinOpenOrderQuantity) return t(`${dist}.reasonExceedsOpenOrder`, { max: totalOpenOrderPendingQuantity });
    if (!entitlementResult && !canIssueByOpenOrderOnly) return t(`${dist}.reasonWaitEntitlement`);
    if (!canAddLine) return t(`${dist}.reasonLineNotAllowed`);
    return '';
  }, [
    barcode,
    canAddLine,
    canIssueByOpenOrderOnly,
    entitlementResult,
    hasMatchingOpenOrder,
    hasOpenOrderOnDifferentWarehouse,
    isWithinOpenOrderQuantity,
    resolvedEmployee,
    resolvedStock,
    selectedWarehouse,
    t,
    totalOpenOrderPendingQuantity,
  ]);
  const entitledQuantity = entitlementResult?.allowed
    ? requestedQuantity
    : canIssueAsExcess
      ? Math.min(requestedQuantity, entitlementResult?.remainingMainQuantity ?? 0)
      : canIssueByOpenOrderOnly
        ? 0
      : 0;
  const excessQuantity = Math.max(0, requestedQuantity - entitledQuantity);
  const shouldPromptInitialOrder = Boolean(
    resolvedEmployee?.employeeId
      && distributionContextQuery.data?.remainingEntitlements?.some((item) =>
        String(item.suggestedPhaseType ?? '').toLowerCase() === 'initial' && (item.remainingInitialQuantity ?? 0) > 0)
      && !submittedHeader
      && cartLines.length === 0,
  );

  useEffect(() => {
    if (!resolvedEmployee?.employeeId) {
      setInitialOrderPromptOpen(false);
      setInitialOrderPromptHandledEmployeeId(null);
      return;
    }

    if (!shouldPromptInitialOrder) {
      setInitialOrderPromptOpen(false);
      return;
    }

    if (initialOrderPromptHandledEmployeeId === resolvedEmployee.employeeId) {
      return;
    }

    setInitialOrderPromptOpen(true);
  }, [cartLines.length, initialOrderPromptHandledEmployeeId, resolvedEmployee?.employeeId, shouldPromptInitialOrder, submittedHeader]);

  function handleAddLine(): void {
    if (!resolvedStock || !entitlementResult || !canAddLine) return;

    setCartLines((prev) => [
      ...prev,
      {
        clientId: `${resolvedStock.stockId}-${Date.now()}`,
        barcode,
        stockId: resolvedStock.stockId,
        quantity: Number(quantity) || 1,
        stockCode: resolvedStock.stockCode,
        stockName: resolvedStock.stockName,
        groupCode: resolvedStock.groupCode,
        groupName: resolvedStock.groupName,
        entitlement: entitlementResult,
        openOrderPendingQuantity: totalOpenOrderPendingQuantity,
        openOrderDocumentNos,
        entitledQuantity,
        excessQuantity,
        isExcessIssue: excessQuantity > 0,
      },
    ]);

    setBarcode('');
    setResolvedStock(null);
    setEntitlementResult(null);
    setQuantity('1');
    toast.success(t(`${dist}.toastLineCart`));
  }

  function handleInitialOrderAnswer(opened: boolean): void {
    if (!resolvedEmployee) {
      setInitialOrderPromptOpen(false);
      return;
    }

    setInitialOrderPromptHandledEmployeeId(resolvedEmployee.employeeId);
    setInitialOrderPromptOpen(false);

    if (opened) {
      return;
    }

    navigate(`/kkd/initial-order?employeeId=${resolvedEmployee.employeeId}`, {
      state: {
        resolvedEmployee,
        employeeQr,
      },
    });
  }

  return (
    <div className="crm-page space-y-6">
      <KkdInitialOrderPromptDialog
        open={initialOrderPromptOpen}
        onOpenChange={(open) => {
          if (!open) {
            setInitialOrderPromptHandledEmployeeId(resolvedEmployee?.employeeId ?? null);
          }
          setInitialOrderPromptOpen(open);
        }}
        onAnswer={handleInitialOrderAnswer}
      />

      <Breadcrumb
        items={[
          { label: t('sidebar.kkdOperationsGroup') },
          { label: t(`${dist}.breadcrumb`), isActive: true },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <KkdDistributionEmployeeSection
            employeeQr={employeeQr}
            onEmployeeQrChange={setEmployeeQr}
            onResolveQr={() => resolveQrMutation.mutate({ qrCode: employeeQr })}
            isResolvingQr={resolveQrMutation.isPending}
            selectedWarehouse={selectedWarehouse}
            warehouseDialogOpen={warehouseDialogOpen}
            onWarehouseDialogOpenChange={setWarehouseDialogOpen}
            onWarehouseSelect={setSelectedWarehouse}
            employeeDialogOpen={employeeDialogOpen}
            onEmployeeDialogOpenChange={setEmployeeDialogOpen}
            onEmployeeSelect={(item) => {
              setResolvedEmployee({
                employeeId: item.id,
                employeeCode: item.employeeCode,
                fullName: `${item.firstName} ${item.lastName}`.trim(),
                customerId: item.customerId,
                customerCode: item.customerCode,
                departmentCode: item.departmentCode ?? null,
                departmentName: item.departmentName ?? null,
                roleCode: item.roleCode ?? null,
                roleName: item.roleName ?? null,
                isActive: item.isActive,
              });
              setEmployeeQr(item.qrCode);
              setSubmittedHeader(null);
              setResolvedStock(null);
              setEntitlementResult(null);
              setCartLines([]);
            }}
            resolvedEmployee={resolvedEmployee}
            submittedHeader={submittedHeader}
            localizeStatusLabel={(status) => localizeStatus(status, t)}
          />

          <KkdDistributionEntitlementsSection
            resolvedEmployeeExists={Boolean(resolvedEmployee)}
            isLoading={distributionContextQuery.isLoading}
            distributionContext={distributionContextQuery.data}
            resolvedStock={resolvedStock}
          />

          <KkdDistributionOpenOrdersSection
            resolvedEmployee={resolvedEmployee}
            isLoading={distributionContextQuery.isLoading}
            distributionContext={distributionContextQuery.data}
            resolvedStock={resolvedStock}
            dateLocale={dateLocale}
          />

          <KkdDistributionScanSection
            barcode={barcode}
            onBarcodeChange={setBarcode}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onResolveStock={() => {
              if (!selectedWarehouse) return;
              resolveStockMutation.mutate({ barcode, warehouseId: selectedWarehouse.id });
            }}
            canResolveStock={canResolveStock}
            isResolvingStock={resolveStockMutation.isPending}
            resolvedStock={resolvedStock}
            hasMatchingOpenOrder={hasMatchingOpenOrder}
            hasOpenOrderOnDifferentWarehouse={hasOpenOrderOnDifferentWarehouse}
            isWithinOpenOrderQuantity={isWithinOpenOrderQuantity}
            totalOpenOrderPendingQuantity={totalOpenOrderPendingQuantity}
            openOrderDocumentNos={openOrderDocumentNos}
            entitlementResult={entitlementResult}
            canIssueByOpenOrderOnly={canIssueByOpenOrderOnly}
            canIssueAsExcess={canIssueAsExcess}
            selectedGroupEntitlement={selectedGroupEntitlement}
            entitledQuantity={entitledQuantity}
            excessQuantity={excessQuantity}
            canAddLine={canAddLine}
            addLineDisabledReason={addLineDisabledReason}
            onAddLine={handleAddLine}
          />
        </div>

        <div className="space-y-6">
          <KkdDistributionCartSection
            cartLines={cartLines}
            totalLineQuantity={totalLineQuantity}
            onRemoveLine={(clientId) => setCartLines((prev) => prev.filter((item) => item.clientId !== clientId))}
            onSubmit={() => submitMutation.mutate()}
            isSubmitting={submitMutation.isPending}
            onClearCart={() => setCartLines([])}
          />
        </div>
      </div>
    </div>
  );
}
