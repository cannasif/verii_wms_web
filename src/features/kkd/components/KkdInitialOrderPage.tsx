import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getLocaleForFormatting } from '@/lib/i18n';
import { localizeStatus } from '@/lib/localize-status';
import { kkdApi } from '../api/kkd.api';
import type { CreateKkdOrderSubmissionLineDto, KkdEmployeeDto, KkdOrderContextDto, KkdOrderHeaderDto, KkdOrderStockOptionDto, KkdResolvedEmployeeDto } from '../types/kkd.types';
import { useLocation, useSearchParams } from 'react-router-dom';

type LocalOrderLine = CreateKkdOrderSubmissionLineDto & { clientId: string };

export function KkdInitialOrderPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const dateLocale = getLocaleForFormatting(i18n.language);
  const authUserId = useAuthStore((state) => state.user?.id ?? null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const prefilledEmployeeId = Number(searchParams.get('employeeId') || 0) || null;
  const routeState = location.state as { resolvedEmployee?: KkdResolvedEmployeeDto | null; employeeQr?: string | null } | null;

  const [employeeQr, setEmployeeQr] = useState('');
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [resolvedEmployee, setResolvedEmployee] = useState<KkdResolvedEmployeeDto | null>(null);
  const [selectedGroupCode, setSelectedGroupCode] = useState('');
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<KkdOrderStockOptionDto | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [cartLines, setCartLines] = useState<LocalOrderLine[]>([]);
  const [submittedHeader, setSubmittedHeader] = useState<KkdOrderHeaderDto | null>(null);

  useEffect(() => {
    setPageTitle(t('kkd.operational.initialOrder.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const contextQuery = useQuery<KkdOrderContextDto>({
    queryKey: ['kkd', 'order', 'context', resolvedEmployee?.employeeId],
    queryFn: () => kkdApi.getOrderContext(resolvedEmployee!.employeeId),
    enabled: Boolean(resolvedEmployee?.employeeId),
  });

  const currentEmployeeQuery = useQuery({
    queryKey: ['kkd', 'order', 'current-employee', authUserId],
    queryFn: async () => {
      const result = await kkdApi.getEmployees({
        pageNumber: 0,
        pageSize: 1,
        filters: [{ column: 'UserId', operator: 'eq', value: String(authUserId) }],
      });
      return result.data[0] ?? null;
    },
    enabled: Boolean(authUserId),
  });

  const prefilledEmployeeQuery = useQuery({
    queryKey: ['kkd', 'order', 'prefill-employee', prefilledEmployeeId],
    queryFn: async () => {
      const result = await kkdApi.getEmployees({
        pageNumber: 1,
        pageSize: 1,
        filters: [{ column: 'Id', operator: 'eq', value: String(prefilledEmployeeId) }],
      });
      return result.data[0] ?? null;
    },
    enabled: Boolean(prefilledEmployeeId && !routeState?.resolvedEmployee && !resolvedEmployee),
  });

  const resolveQrMutation = useMutation({
    mutationFn: kkdApi.resolveEmployeeQr,
    onSuccess: (data) => {
      setResolvedEmployee(data);
      setSelectedGroupCode('');
      setSelectedStock(null);
      setCartLines([]);
      setSubmittedHeader(null);
      toast.success(t('kkd.operational.initialOrder.toastEmployeeFound'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedEmployee || cartLines.length === 0) {
        throw new Error(t('kkd.operational.initialOrder.errNeedLines'));
      }

      return kkdApi.submitOrder({
        employeeId: resolvedEmployee.employeeId,
        sourceChannel: 'WMS',
        lines: cartLines.map(({ clientId: _clientId, ...line }) => line),
      });
    },
    onSuccess: (data) => {
      setSubmittedHeader(data);
      setCartLines([]);
      setSelectedGroupCode('');
      setSelectedStock(null);
      setQuantity('1');
      contextQuery.refetch();
      toast.success(t('kkd.operational.initialOrder.toastOrderCreated'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const selectedGroup = useMemo(
    () => contextQuery.data?.eligibleGroups.find((item) => item.groupCode === selectedGroupCode) ?? null,
    [contextQuery.data?.eligibleGroups, selectedGroupCode],
  );
  const requestedQuantity = Number(quantity) || 0;
  const alreadyRequestedForGroup = useMemo(
    () => cartLines.filter((item) => item.groupCode === selectedGroupCode).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [cartLines, selectedGroupCode],
  );
  const remainingAfterCart = Math.max(0, (selectedGroup?.remainingInitialQuantity ?? 0) - alreadyRequestedForGroup);
  const canAddLine = Boolean(selectedGroup && selectedStock && requestedQuantity > 0 && requestedQuantity <= remainingAfterCart);

  useEffect(() => {
    if (routeState?.resolvedEmployee && !resolvedEmployee) {
      setResolvedEmployee(routeState.resolvedEmployee);
      setEmployeeQr(routeState.employeeQr ?? '');
    }
  }, [resolvedEmployee, routeState]);

  useEffect(() => {
    if (!prefilledEmployeeQuery.data || resolvedEmployee) {
      return;
    }

    setResolvedEmployee(mapEmployee(prefilledEmployeeQuery.data));
    setEmployeeQr(prefilledEmployeeQuery.data.qrCode);
  }, [prefilledEmployeeQuery.data, resolvedEmployee]);

  function mapEmployee(item: KkdEmployeeDto): KkdResolvedEmployeeDto {
    return {
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
    };
  }

  function handleSelfSelect(): void {
    if (!currentEmployeeQuery.data) {
      toast.error(t('kkd.operational.initialOrder.errNoEmployee'));
      return;
    }

    setResolvedEmployee(mapEmployee(currentEmployeeQuery.data));
    setEmployeeQr(currentEmployeeQuery.data.qrCode);
    setSelectedGroupCode('');
    setSelectedStock(null);
    setCartLines([]);
    setSubmittedHeader(null);
  }

  function handleAddLine(): void {
    if (!selectedGroup || !selectedStock || !canAddLine) return;

    setCartLines((prev) => [
      ...prev,
      {
        clientId: `${selectedStock.stockId}-${Date.now()}`,
        groupCode: selectedGroup.groupCode,
        groupName: selectedGroup.groupName ?? undefined,
        stockId: selectedStock.stockId,
        stockCode: selectedStock.stockCode,
        stockName: selectedStock.stockName,
        unit: selectedStock.unit ?? undefined,
        quantity: requestedQuantity,
      },
    ]);

    setSelectedStock(null);
    setQuantity('1');
    toast.success(t('kkd.operational.initialOrder.toastLineAdded'));
  }

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.operationsGroup') },
          { label: t('kkd.operational.initialOrder.breadcrumb'), isActive: true },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('kkd.operational.initialOrder.cardEmployee')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <div className="space-y-2">
                  <Label htmlFor="kkd-order-qr">{t('kkd.operational.initialOrder.qrLabel')}</Label>
                  <Input
                    id="kkd-order-qr"
                    value={employeeQr}
                    onChange={(e) => setEmployeeQr(e.target.value)}
                    placeholder={t('kkd.operational.initialOrder.qrPlaceholder')}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={() => resolveQrMutation.mutate({ qrCode: employeeQr })} disabled={!employeeQr.trim() || resolveQrMutation.isPending}>
                    {t('kkd.operational.initialOrder.resolveQr')}
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={handleSelfSelect} disabled={!authUserId || currentEmployeeQuery.isLoading}>
                    {t('kkd.operational.initialOrder.selectMe')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('kkd.operational.initialOrder.altEmployee')}</Label>
                <PagedLookupDialog<KkdEmployeeDto>
                  open={employeeDialogOpen}
                  onOpenChange={setEmployeeDialogOpen}
                  title={t('kkd.operational.initialOrder.selectEmployeeDialog')}
                  value={resolvedEmployee ? `${resolvedEmployee.employeeCode} - ${resolvedEmployee.fullName}` : null}
                  placeholder={t('kkd.operational.initialOrder.selectEmployeePlaceholder')}
                  queryKey={['kkd', 'order', 'employees']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) => kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
                  onSelect={(item) => {
                    setResolvedEmployee(mapEmployee(item));
                    setEmployeeQr(item.qrCode);
                    setSelectedGroupCode('');
                    setSelectedStock(null);
                    setCartLines([]);
                    setSubmittedHeader(null);
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
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('kkd.operational.initialOrder.employmentStart')}:{' '}
                    {contextQuery.data?.employmentStartDate
                      ? new Date(contextQuery.data.employmentStartDate).toLocaleDateString(dateLocale)
                      : '-'}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('kkd.operational.initialOrder.cardStock')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('kkd.operational.initialOrder.entitlementGroup')}</Label>
                <Select value={selectedGroupCode} onValueChange={(value) => { setSelectedGroupCode(value); setSelectedStock(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('kkd.operational.initialOrder.groupPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(contextQuery.data?.eligibleGroups ?? []).map((group) => (
                      <SelectItem key={group.groupCode} value={group.groupCode}>
                        {group.groupCode} {group.groupName ? `- ${group.groupName}` : ''} ({group.remainingInitialQuantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGroup ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selectedGroup.groupCode}</Badge>
                    <Badge variant="secondary">
                      {t('kkd.operational.initialOrder.initialEntitlement')}: {selectedGroup.remainingInitialQuantity}
                    </Badge>
                    <Badge variant="outline">
                      {t('kkd.operational.initialOrder.remainingInCart')}: {remainingAfterCart}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.5fr_auto]">
                <div className="space-y-2">
                  <Label>{t('kkd.operational.initialOrder.stockLabel')}</Label>
                  <PagedLookupDialog<KkdOrderStockOptionDto>
                    open={stockDialogOpen}
                    onOpenChange={setStockDialogOpen}
                    title={t('kkd.operational.initialOrder.selectStock')}
                    value={selectedStock ? `${selectedStock.stockCode} - ${selectedStock.stockName}` : null}
                    placeholder={selectedGroupCode ? t('kkd.operational.initialOrder.groupStockPlaceholder') : t('kkd.operational.initialOrder.selectGroupFirst')}
                    searchPlaceholder={t('kkd.operational.initialOrder.stockSearchPlaceholder')}
                    queryKey={['kkd', 'order', 'stocks', selectedGroupCode]}
                    disabled={!selectedGroupCode}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      kkdApi.getOrderStocksByGroupPaged(selectedGroupCode, { pageNumber, pageSize, search }, { signal })
                    }
                    getKey={(item) => String(item.stockId)}
                    getLabel={(item) => `${item.stockCode} - ${item.stockName}`}
                    onSelect={(item) => setSelectedStock(item)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.quantity')}</Label>
                  <Input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddLine} disabled={!canAddLine}>
                    {t('kkd.operational.initialOrder.add')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('kkd.operational.initialOrder.cardOrder')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm dark:border-white/10">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {t('kkd.operational.initialOrder.lineCount')}: {cartLines.length}
                  </Badge>
                  <Badge variant="outline">
                    {t('kkd.operational.initialOrder.totalQty')}: {cartLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {cartLines.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {t('kkd.operational.initialOrder.noLines')}
                  </div>
                ) : cartLines.map((line) => (
                  <div key={line.clientId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{line.groupCode}</Badge>
                      <Badge variant="secondary">{line.stockCode}</Badge>
                      <Badge variant="outline">
                        {t('common.quantity')}: {line.quantity}
                      </Badge>
                    </div>
                    <p className="mt-2 font-medium text-slate-900 dark:text-white">{line.stockName}</p>
                    <div className="mt-3 flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCartLines((prev) => prev.filter((item) => item.clientId !== line.clientId))}>
                        {t('kkd.operational.initialOrder.remove')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={() => submitMutation.mutate()} disabled={!resolvedEmployee || cartLines.length === 0 || submitMutation.isPending}>
                  {t('kkd.operational.initialOrder.save')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setCartLines([])} disabled={cartLines.length === 0}>
                  {t('kkd.operational.initialOrder.clearCart')}
                </Button>
              </div>

              {submittedHeader ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-800/40 dark:bg-emerald-950/20">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {t('kkd.operational.initialOrder.headerPrefix')} #{submittedHeader.id}
                    </Badge>
                    <Badge>{localizeStatus(submittedHeader.status, t)}</Badge>
                  </div>
                  <p className="mt-2">
                    {t('kkd.operational.initialOrder.documentNo')}: {submittedHeader.documentNo || '-'}
                  </p>
                  <p className="mt-1">
                    {t('kkd.operational.initialOrder.lineCountN')}: {submittedHeader.lines.length}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
