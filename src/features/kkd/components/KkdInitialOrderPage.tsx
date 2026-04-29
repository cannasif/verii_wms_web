import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getLocaleForFormatting } from '@/lib/i18n';
import { kkdApi } from '../api/kkd.api';
import type { KkdOrderContextDto, KkdOrderHeaderDto, KkdOrderStockOptionDto, KkdResolvedEmployeeDto } from '../types/kkd.types';
import { useLocation, useSearchParams } from 'react-router-dom';
import { KkdInitialOrderEmployeeSection } from './initial-order/KkdInitialOrderEmployeeSection';
import { KkdInitialOrderStockSection } from './initial-order/KkdInitialOrderStockSection';
import { KkdInitialOrderCartSection } from './initial-order/KkdInitialOrderCartSection';
import { type LocalOrderLine, mapEmployee } from './initial-order/shared';

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
          <KkdInitialOrderEmployeeSection
            t={t}
            dateLocale={dateLocale}
            employeeQr={employeeQr}
            onEmployeeQrChange={setEmployeeQr}
            employeeDialogOpen={employeeDialogOpen}
            onEmployeeDialogOpenChange={setEmployeeDialogOpen}
            resolvedEmployee={resolvedEmployee}
            employmentStartDate={contextQuery.data?.employmentStartDate}
            authUserId={authUserId}
            currentEmployeeLoading={currentEmployeeQuery.isLoading}
            onResolveQr={() => resolveQrMutation.mutate({ qrCode: employeeQr })}
            resolveQrDisabled={!employeeQr.trim() || resolveQrMutation.isPending}
            onSelectMe={handleSelfSelect}
            fetchEmployees={({ pageNumber, pageSize, search, signal }) => kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })}
            onSelectEmployee={(item) => {
              setResolvedEmployee(mapEmployee(item));
              setEmployeeQr(item.qrCode);
              setSelectedGroupCode('');
              setSelectedStock(null);
              setCartLines([]);
              setSubmittedHeader(null);
            }}
          />

          <KkdInitialOrderStockSection
            t={t}
            eligibleGroups={contextQuery.data?.eligibleGroups ?? []}
            selectedGroupCode={selectedGroupCode}
            onSelectedGroupCodeChange={(value) => {
              setSelectedGroupCode(value);
              setSelectedStock(null);
            }}
            selectedGroup={selectedGroup}
            remainingAfterCart={remainingAfterCart}
            stockDialogOpen={stockDialogOpen}
            onStockDialogOpenChange={setStockDialogOpen}
            selectedStock={selectedStock}
            onSelectStock={setSelectedStock}
            quantity={quantity}
            onQuantityChange={setQuantity}
            canAddLine={canAddLine}
            onAddLine={handleAddLine}
            fetchStocks={({ pageNumber, pageSize, search, signal }) =>
              kkdApi.getOrderStocksByGroupPaged(selectedGroupCode, { pageNumber, pageSize, search }, { signal })
            }
          />
        </div>

        <div className="space-y-6">
          <KkdInitialOrderCartSection
            t={t}
            cartLines={cartLines}
            onRemoveLine={(clientId) => setCartLines((prev) => prev.filter((item) => item.clientId !== clientId))}
            onSubmit={() => submitMutation.mutate()}
            onClearCart={() => setCartLines([])}
            submitDisabled={!resolvedEmployee || cartLines.length === 0 || submitMutation.isPending}
            clearDisabled={cartLines.length === 0}
            submittedHeader={submittedHeader}
          />
        </div>
      </div>
    </div>
  );
}
