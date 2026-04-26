import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { useUIStore } from '@/stores/ui-store';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getLocaleForFormatting } from '@/lib/i18n';
import { kkdApi } from '../api/kkd.api';
import { lookupApi } from '@/services/lookup-api';
import { useNavigate } from 'react-router-dom';
import type {
  CreateKkdDistributionSubmissionLineDto,
  KkdCariAcikSiparisDto,
  KkdDistributionContextDto,
  KkdDistributionHeaderDto,
  KkdEmployeeDto,
  KkdEntitlementCheckResultDto,
  KkdRemainingEntitlementDto,
  KkdResolvedEmployeeDto,
  KkdResolvedStockDto,
} from '../types/kkd.types';
import type { WarehouseLookup } from '@/services/lookup-types';

type LocalDistributionLine = CreateKkdDistributionSubmissionLineDto & {
  clientId: string;
  stockCode: string;
  stockName: string;
  groupCode?: string | null;
  groupName?: string | null;
  entitlement: KkdEntitlementCheckResultDto;
  openOrderPendingQuantity: number;
  openOrderDocumentNos: string;
  entitledQuantity: number;
  excessQuantity: number;
  isExcessIssue: boolean;
};

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
      <Dialog
        open={initialOrderPromptOpen}
        onOpenChange={(open) => {
          if (!open) {
            setInitialOrderPromptHandledEmployeeId(resolvedEmployee?.employeeId ?? null);
          }
          setInitialOrderPromptOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(`${dist}.initialPromptTitle`)}</DialogTitle>
            <DialogDescription>{t(`${dist}.initialPromptDesc`)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleInitialOrderAnswer(false)}>
              {t(`${dist}.initialPromptNo`)}
            </Button>
            <Button type="button" onClick={() => handleInitialOrderAnswer(true)}>
              {t(`${dist}.initialPromptYes`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Breadcrumb
        items={[
          { label: t('common.operationsGroup') },
          { label: t(`${dist}.breadcrumb`), isActive: true },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(`${dist}.titleEmployeeWarehouse`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kkd-qr">{t(`${dist}.qrLabel`)}</Label>
                  <div className="flex gap-2">
                    <Input id="kkd-qr" value={employeeQr} onChange={(e) => setEmployeeQr(e.target.value)} placeholder={t(`${dist}.qrPh`)} />
                    <Button type="button" onClick={() => resolveQrMutation.mutate({ qrCode: employeeQr })} disabled={!employeeQr.trim() || resolveQrMutation.isPending}>
                      {t(`${dist}.resolveQr`)}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t(`${dist}.warehouse`)}</Label>
                  <PagedLookupDialog<WarehouseLookup>
                    open={warehouseDialogOpen}
                    onOpenChange={setWarehouseDialogOpen}
                    title={t(`${dist}.whDialogTitle`)}
                    value={selectedWarehouse ? `${selectedWarehouse.depoKodu} - ${selectedWarehouse.depoIsmi}` : null}
                    placeholder={t(`${dist}.whPh`)}
                    queryKey={['kkd', 'warehouses']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(item) => String(item.id)}
                    getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                    onSelect={setSelectedWarehouse}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t(`${dist}.altEmployee`)}</Label>
                <PagedLookupDialog<KkdEmployeeDto>
                  open={employeeDialogOpen}
                  onOpenChange={setEmployeeDialogOpen}
                  title={t(`${dist}.empDialogTitle`)}
                  value={resolvedEmployee ? `${resolvedEmployee.employeeCode} - ${resolvedEmployee.fullName}` : null}
                  placeholder={t(`${dist}.empPh`)}
                  queryKey={['kkd', 'distribution', 'employees']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })
                  }
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
                  onSelect={(item) => {
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
                />
              </div>

              {resolvedEmployee ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{resolvedEmployee.employeeCode}</Badge>
                    <Badge variant="secondary">{resolvedEmployee.customerCode}</Badge>
                    {resolvedEmployee.departmentName ? <Badge variant="outline">{resolvedEmployee.departmentName}</Badge> : null}
                    {resolvedEmployee.roleName ? <Badge variant="outline">{resolvedEmployee.roleName}</Badge> : null}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{resolvedEmployee.fullName}</p>
                </div>
              ) : null}

              {submittedHeader ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">{t(`${dist}.headerIdBadge`, { id: submittedHeader.id })}</Badge>
                    <Badge>{submittedHeader.status}</Badge>
                    <Badge variant="secondary">{t(`${dist}.warehouseIdBadge`, { id: submittedHeader.warehouseId })}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t(`${dist}.docNo`)}: {submittedHeader.documentNo || '-'}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(`${dist}.entitlementsTitle`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!resolvedEmployee ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noEmployeePick`)}</p>
              ) : distributionContextQuery.isLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.entitlementsLoading`)}</p>
              ) : !distributionContextQuery.data?.remainingEntitlements?.length ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noEntitlementGroup`)}</p>
              ) : (
                <div className="space-y-3">
                  {distributionContextQuery.data.remainingEntitlements.map((item: KkdRemainingEntitlementDto) => (
                    <div key={item.groupCode} className={`rounded-2xl border p-4 ${item.groupCode === resolvedStock?.groupCode ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{item.groupCode}</Badge>
                        {item.suggestedPhaseType ? <Badge variant="secondary">{item.suggestedPhaseType}</Badge> : null}
                        <Badge variant="outline">{t(`${dist}.firstEntry`)}: {item.remainingInitialQuantity}</Badge>
                        <Badge variant="outline">{t(`${dist}.month3`)}: {item.remainingThreeMonthQuantity}</Badge>
                        <Badge variant="outline">{t(`${dist}.routine`)}: {item.remainingRecurringQuantity}</Badge>
                        <Badge variant="secondary">{t(`${dist}.totalRem`)}: {item.totalRemainingQuantity}</Badge>
                      </div>
                      {item.groupName ? <p className="mt-2 font-medium text-slate-900 dark:text-white">{item.groupName}</p> : null}
                      {item.message ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(`${dist}.openOrdersTitle`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!resolvedEmployee ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noOpenOrdersContext`)}</p>
              ) : distributionContextQuery.isLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.openOrdersLoading`)}</p>
              ) : !distributionContextQuery.data?.cariAcikSiparis?.length ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${dist}.noOpenOrderForCustomer`)}</p>
              ) : (
                <div className="space-y-3">
                  {distributionContextQuery.data.cariAcikSiparis.map((item: KkdCariAcikSiparisDto, index) => (
                    <div key={`${item.documentNo}-${item.stockCode}-${index}`} className={`rounded-2xl border p-4 ${item.groupCode && item.groupCode === resolvedStock?.groupCode ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{item.stockCode}</Badge>
                        {item.groupCode ? <Badge variant="secondary">{item.groupCode}</Badge> : null}
                        <Badge variant="outline">{t(`${dist}.badgeFis`)}: {item.documentNo}</Badge>
                        <Badge variant="outline">{t(`${dist}.pending`)}: {item.pendingQuantity}</Badge>
                        {item.warehouseCode != null ? <Badge variant="outline">{t(`${dist}.whCode`)}: {item.warehouseCode}</Badge> : null}
                      </div>
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

          <Card>
            <CardHeader>
              <CardTitle>{t(`${dist}.scanTitle`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="kkd-barcode">{t(`${dist}.barcode`)}</Label>
                  <Input id="kkd-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder={t(`${dist}.barcodePh`)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kkd-qty">{t(`${dist}.qty`)}</Label>
                  <Input id="kkd-qty" type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={() => {
                    if (!selectedWarehouse) return;
                    resolveStockMutation.mutate({ barcode, warehouseId: selectedWarehouse.id });
                  }} disabled={!canResolveStock || resolveStockMutation.isPending}>
                    {t(`${dist}.resolveBarcode`)}
                  </Button>
                </div>
              </div>

              {resolvedStock ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{resolvedStock.stockCode}</Badge>
                    {resolvedStock.groupCode ? <Badge variant="secondary">{resolvedStock.groupCode}</Badge> : null}
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
                    {resolvedStock.groupCode ? <Badge variant="secondary">{t(`${dist}.groupPrefix`)}: {resolvedStock.groupCode}</Badge> : null}
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
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                    <p>
                      {t(`${dist}.readStock`)}: <span className="font-medium">{entitlementResult.resolvedStockCode || resolvedStock?.stockCode || '-'}</span>
                      {entitlementResult.resolvedStockName ? ` - ${entitlementResult.resolvedStockName}` : ''}
                    </p>
                    <p className="mt-1">
                      {t(`${dist}.readGroup`)}: <span className="font-medium">{entitlementResult.requestedGroupCode || resolvedStock?.groupCode || '-'}</span>
                      {' | '}
                      {t(`${dist}.entGroup`)}: <span className="font-medium">{entitlementResult.matchedGroupCode || '-'}</span>
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
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
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
                        <div key={phase.phaseType} className={`rounded-xl border p-3 ${phase.isCurrentPhase ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'}`}>
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
                <Button type="button" onClick={handleAddLine} disabled={!canAddLine}>
                  {t(`${dist}.addLine`)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(`${dist}.cartTitle`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{t(`${dist}.lineN`)}: {cartLines.length}</Badge>
                <Badge variant="secondary">{t(`${dist}.totalQ`)}: {totalLineQuantity}</Badge>
              </div>

              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.clientId} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{line.stockCode} - {line.stockName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {t(`${dist}.lineSummary`, {
                            g: line.groupCode || '-',
                            q: line.quantity,
                            p: line.entitlement.activePhaseLabel || (line.entitledQuantity <= 0 && line.excessQuantity > 0 ? t(`${dist}.openOrderOverride`) : '-'),
                          })}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {t(`${dist}.lineOpen`, { d: line.openOrderDocumentNos || '-', p: line.openOrderPendingQuantity })}
                        </p>
                        {line.isExcessIssue ? (
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-300">
                            {t(`${dist}.lineExcess`, { e: line.entitledQuantity, x: line.excessQuantity })}
                          </p>
                        ) : null}
                        {line.entitledQuantity <= 0 && line.excessQuantity > 0 && line.openOrderPendingQuantity > 0 ? (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {t(`${dist}.lineOpenOrderOnly`)}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCartLines((prev) => prev.filter((item) => item.clientId !== line.clientId))}
                      >
                        {t(`${dist}.removeLine`)}
                      </Button>
                    </div>
                  </div>
                ))}
                {!cartLines.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {t(`${dist}.emptyCart`)}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => submitMutation.mutate()} disabled={!cartLines.length || submitMutation.isPending}>
                  {t(`${dist}.saveSubmit`)}
                </Button>
                <Button type="button" variant="outline" onClick={() => setCartLines([])} disabled={!cartLines.length}>
                  {t(`${dist}.clearCart`)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
