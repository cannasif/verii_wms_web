import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Factory,
  PauseCircle,
  PlayCircle,
  ScanLine,
  TimerReset,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import { productionApi } from '../api/production-api';
import type {
  AddProductionOperationLineRequest,
  ProductionOperation,
  ProductionOrderDetail,
  ProductionOrderConsumptionItem,
  ProductionOrderOutputItem,
  ProductionOperationEventRequest,
} from '../types/production';

function buildEmptyLine(): AddProductionOperationLineRequest {
  return {
    stockCode: '',
    quantity: 1,
    unit: 'ADET',
    serialNo1: '',
    sourceWarehouseCode: '',
    targetWarehouseCode: '',
    sourceCellCode: '',
    targetCellCode: '',
    scannedBarcode: '',
  };
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function formatQuantity(value?: number | null): string {
  if (value == null) return '0';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value);
}

type QuickEntryRow = ProductionOrderConsumptionItem | ProductionOrderOutputItem;

function isConsumptionQuickEntryRow(row: QuickEntryRow): row is ProductionOrderConsumptionItem {
  return 'consumedQuantity' in row;
}

function getQuickEntryCompletedQuantity(row: QuickEntryRow): number {
  return isConsumptionQuickEntryRow(row) ? (row.consumedQuantity ?? 0) : (row.producedQuantity ?? 0);
}

function getQuickEntryRemainingQuantity(row: QuickEntryRow): number {
  return Math.max(row.plannedQuantity - getQuickEntryCompletedQuantity(row), 0);
}

export function ProductionProcessPage(): ReactElement {
  const { t } = useTranslation();
  const orderStatusLabel = (status: string): string => t(`production.process.orderStatus.${status}`, { defaultValue: status });
  const dependencyTypeLabel = (type: string): string => t(`production.create.enums.dependencyType.${type}`, { defaultValue: type });
  const lineRoleLabel = (role: string): string => {
    if (role === 'Consumption') return t('production.process.lineRoleConsumption');
    if (role === 'Output') return t('production.process.lineRoleOutput');
    return role;
  };
  const operationEventTypeLabel = (type: string): string => t(`production.process.operationEventType.${type}`, { defaultValue: type });
  const trackingModeLabel = (mode?: string | null): string => t(`production.create.enums.trackingMode.${mode ?? 'None'}`, { defaultValue: mode ?? 'None' });
  const serialModeLabel = (mode?: string | null): string => t(`production.create.enums.serialMode.${mode ?? 'Optional'}`, { defaultValue: mode ?? 'Optional' });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const headerId = Number(id);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const canUpdateProduction = permissionAccess.can('wms.production.update');
  const canCreateTransfer = permissionAccess.can('wms.production-transfer.create');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderDetail | null>(null);
  const [activeOperation, setActiveOperation] = useState<ProductionOperation | null>(null);
  const [consumptionLine, setConsumptionLine] = useState<AddProductionOperationLineRequest>(() => buildEmptyLine());
  const [outputLine, setOutputLine] = useState<AddProductionOperationLineRequest>(() => buildEmptyLine());
  const [eventPayload, setEventPayload] = useState<ProductionOperationEventRequest>({ reasonCode: '', note: '', durationMinutes: undefined });
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderStockFilter, setOrderStockFilter] = useState('');
  const [onlyAssignedOrders, setOnlyAssignedOrders] = useState(true);
  const [historyRoleFilter, setHistoryRoleFilter] = useState<string>('all');
  const [historyStockFilter, setHistoryStockFilter] = useState('');
  const displayMode = searchParams.get('mode') === 'kiosk' ? 'kiosk' : 'web';
  const isKioskMode = displayMode === 'kiosk';
  const [quickEntryMode, setQuickEntryMode] = useState<'Consumption' | 'Output'>('Consumption');
  const [quickEntryValue, setQuickEntryValue] = useState('');

  useEffect(() => {
    setPageTitle(t('production.process.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const detailQuery = useQuery({
    queryKey: ['productionHeaderDetail', headerId],
    queryFn: () => productionApi.getHeaderDetail(headerId),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  useEffect(() => {
    if (!selectedOrder && detailQuery.data?.orders?.length) {
      setSelectedOrder(detailQuery.data.orders[0]);
    }
  }, [detailQuery.data, selectedOrder]);

  const startMutation = useMutation({
    mutationFn: (orderId: number) => productionApi.startOperation({ orderId, operationType: 'ProductionRun' }),
    onSuccess: (operation) => {
      setActiveOperation(operation);
      toast.success(t('production.process.startSuccess'));
      detailQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || t('production.process.startError')),
  });

  const pauseMutation = useMutation({
    mutationFn: () => productionApi.pauseOperation(activeOperation!.id, eventPayload),
    onSuccess: (operation) => {
      setActiveOperation(operation);
      toast.success(t('production.process.pauseSuccess'));
      detailQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || t('production.process.pauseError')),
  });

  const resumeMutation = useMutation({
    mutationFn: () => productionApi.resumeOperation(activeOperation!.id, eventPayload),
    onSuccess: (operation) => {
      setActiveOperation(operation);
      toast.success(t('production.process.resumeSuccess'));
      detailQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || t('production.process.resumeError')),
  });

  const completeMutation = useMutation({
    mutationFn: () => productionApi.completeOperation(activeOperation!.id, eventPayload),
    onSuccess: (operation) => {
      setActiveOperation(operation);
      toast.success(t('production.process.completeSuccess'));
      detailQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || t('production.process.completeError')),
  });

  const consumptionMutation = useMutation({
    mutationFn: () => productionApi.addConsumption(activeOperation!.id, consumptionLine),
    onSuccess: (operation) => {
      setActiveOperation(operation);
      setConsumptionLine(buildEmptyLine());
      toast.success(t('production.process.consumptionSuccess'));
      detailQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || t('production.process.consumptionError')),
  });

  const outputMutation = useMutation({
    mutationFn: () => productionApi.addOutput(activeOperation!.id, outputLine),
    onSuccess: (operation) => {
      setActiveOperation(operation);
      setOutputLine(buildEmptyLine());
      toast.success(t('production.process.outputSuccess'));
      detailQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || t('production.process.outputError')),
  });

  const readyToRun = useMemo(() => !!selectedOrder, [selectedOrder]);
  const scopedOrders = useMemo(() => {
    const orders = detailQuery.data?.orders ?? [];
    if (!onlyAssignedOrders || !currentUserId) {
      return orders;
    }

    const assignedOrders = orders.filter((order) =>
      order.assignments.some((assignment) => assignment.assignedUserId === currentUserId && assignment.isActive),
    );

    return assignedOrders.length > 0 ? assignedOrders : orders;
  }, [currentUserId, detailQuery.data?.orders, onlyAssignedOrders]);

  const filteredOrders = useMemo(
    () =>
      scopedOrders.filter((order) => {
        const statusMatches = orderStatusFilter === 'all' || order.status === orderStatusFilter;
        const stockMatches = orderStockFilter.trim() === ''
          || order.producedStockCode.toLowerCase().includes(orderStockFilter.trim().toLowerCase())
          || order.orderNo.toLowerCase().includes(orderStockFilter.trim().toLowerCase());
        return statusMatches && stockMatches;
      }),
    [orderStatusFilter, orderStockFilter, scopedOrders],
  );

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setSelectedOrder(null);
      return;
    }

    if (!selectedOrder || !filteredOrders.some((order) => order.id === selectedOrder.id)) {
      setSelectedOrder(filteredOrders[0]);
    }
  }, [filteredOrders, selectedOrder]);

  const selectedOrderGaps = useMemo(() => {
    if (!selectedOrder) {
      return { outputGap: 0, consumptionGap: 0 };
    }

    const outputGap = selectedOrder.outputs.reduce((total, row) => total + (row.plannedQuantity - (row.producedQuantity ?? 0)), 0);
    const consumptionGap = selectedOrder.consumptions.reduce((total, row) => total + (row.plannedQuantity - (row.consumedQuantity ?? 0)), 0);

    return { outputGap, consumptionGap };
  }, [selectedOrder]);

  const selectedOrderProgress = useMemo(() => {
    if (!selectedOrder || selectedOrder.plannedQuantity <= 0) {
      return 0;
    }

    const ratio = ((selectedOrder.completedQuantity ?? 0) / selectedOrder.plannedQuantity) * 100;
    return Math.max(0, Math.min(100, ratio));
  }, [selectedOrder]);

  const selectedOrderDependencies = useMemo(() => {
    if (!selectedOrder || !detailQuery.data) {
      return { blockers: [], waitingFor: [] as string[] };
    }

    const blockers = detailQuery.data.dependencies
      .filter((dependency) => dependency.successorOrderId === selectedOrder.id)
      .map((dependency) => {
        const predecessor = detailQuery.data.orders.find((order) => order.id === dependency.predecessorOrderId);
        return {
          ...dependency,
          predecessorStatus: predecessor?.status ?? 'Unknown',
          isBlocking: predecessor?.status !== 'Completed',
        };
      });

    return {
      blockers,
      waitingFor: blockers.filter((item) => item.isBlocking).map((item) => item.predecessorOrderNo),
    };
  }, [detailQuery.data, selectedOrder]);

  const hasDependencyBlocker = selectedOrderDependencies.waitingFor.length > 0;
  const canShowStart = !activeOperation || activeOperation.status === 'Completed' || activeOperation.status === 'Cancelled';
  const canShowPause = !!activeOperation && activeOperation.status === 'InProgress';
  const canShowResume = !!activeOperation && activeOperation.status === 'Paused';
  const canShowComplete = !!activeOperation && activeOperation.status !== 'Completed' && activeOperation.status !== 'Cancelled';
  const recentEvent = activeOperation?.events[0] ?? null;

  const movementSummary = useMemo(() => {
    const lines = activeOperation?.lines ?? [];
    return {
      total: lines.length,
      consumptionCount: lines.filter((line) => line.lineRole === 'Consumption').length,
      outputCount: lines.filter((line) => line.lineRole === 'Output').length,
    };
  }, [activeOperation?.lines]);
  const currentActionSummary = useMemo(() => {
    if (!selectedOrder) {
      return {
        title: t('production.process.pickOrder'),
        description: t('production.process.pickAssignedOrderFirst', { defaultValue: 'Missing translation' }),
      };
    }

    if (hasDependencyBlocker) {
      return {
        title: t('production.process.dependencyBlocked'),
        description: t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') }),
      };
    }

    if (canShowStart) {
      return {
        title: t('production.process.start'),
        description: t('production.process.startCardHint', { defaultValue: 'Missing translation' }),
      };
    }

    if (canShowPause) {
      return {
        title: t('production.process.pause'),
        description: t('production.process.pauseCardHint', { defaultValue: 'Missing translation' }),
      };
    }

    if (canShowResume) {
      return {
        title: t('production.process.resume'),
        description: t('production.process.resumeCardHint', { defaultValue: 'Missing translation' }),
      };
    }

    if (canShowComplete) {
      return {
        title: t('production.process.complete'),
        description: t('production.process.completeCardHint', { defaultValue: 'Missing translation' }),
      };
    }

    return {
      title: t('production.process.operationNone'),
      description: t('production.process.timelineEmpty'),
    };
  }, [
    canShowComplete,
    canShowPause,
    canShowResume,
    canShowStart,
    hasDependencyBlocker,
    selectedOrder,
    selectedOrderDependencies.waitingFor,
    t,
  ]);

  const consumptionStockOptions = useMemo<ComboboxOption[]>(
    () =>
      (selectedOrder?.consumptions ?? []).map((row) => ({
        value: String(row.id),
        label: `${row.stockCode}${row.yapKod ? ` / ${row.yapKod}` : ''} • kalan ${Math.max(row.plannedQuantity - (row.consumedQuantity ?? 0), 0)}`,
      })),
    [selectedOrder],
  );

  const outputStockOptions = useMemo<ComboboxOption[]>(
    () =>
      (selectedOrder?.outputs ?? []).map((row) => ({
        value: String(row.id),
        label: `${row.stockCode}${row.yapKod ? ` / ${row.yapKod}` : ''} • kalan ${Math.max(row.plannedQuantity - (row.producedQuantity ?? 0), 0)}`,
      })),
    [selectedOrder],
  );

  const filteredOperationLines = useMemo(
    () =>
      (activeOperation?.lines ?? []).filter((line) => {
        const roleMatches = historyRoleFilter === 'all' || line.lineRole === historyRoleFilter;
        const stockMatches = historyStockFilter.trim() === ''
          || line.stockCode.toLowerCase().includes(historyStockFilter.trim().toLowerCase());
        return roleMatches && stockMatches;
      }),
    [activeOperation?.lines, historyRoleFilter, historyStockFilter],
  );

  const selectedConsumptionPlan = useMemo(
    () => selectedOrder?.consumptions.find((row) => row.stockCode === consumptionLine.stockCode && (row.yapKod ?? '') === (consumptionLine.yapKod ?? '')) ?? null,
    [consumptionLine.stockCode, consumptionLine.yapKod, selectedOrder],
  );

  const selectedOutputPlan = useMemo(
    () => selectedOrder?.outputs.find((row) => row.stockCode === outputLine.stockCode && (row.yapKod ?? '') === (outputLine.yapKod ?? '')) ?? null,
    [outputLine.stockCode, outputLine.yapKod, selectedOrder],
  );
  const consumptionRequiresSerial = selectedConsumptionPlan?.serialEntryMode === 'Required' || selectedConsumptionPlan?.trackingMode === 'Serial';
  const outputRequiresSerial = selectedOutputPlan?.serialEntryMode === 'Required' || selectedOutputPlan?.trackingMode === 'Serial';
  const canRecordConsumption = Boolean(
    canUpdateProduction
    && activeOperation
    && consumptionLine.stockCode
    && consumptionLine.quantity > 0
    && (!consumptionRequiresSerial || consumptionLine.serialNo1?.trim()),
  );
  const canRecordOutput = Boolean(
    canUpdateProduction
    && activeOperation
    && outputLine.stockCode
    && outputLine.quantity > 0
    && (!outputRequiresSerial || outputLine.serialNo1?.trim()),
  );

  const consumptionGuardMessage = useMemo(() => {
    if (!selectedOrder) return t('production.process.pickAssignedOrderFirst', { defaultValue: 'Missing translation' });
    if (!activeOperation) return t('production.process.startCardHint', { defaultValue: 'Missing translation' });
    if (!consumptionLine.stockCode) return t('production.process.pickConsumptionLine', { defaultValue: 'Missing translation' });
    if (consumptionLine.quantity <= 0) return t('production.process.quantityMustBePositive', { defaultValue: 'Missing translation' });
    if (consumptionRequiresSerial && !consumptionLine.serialNo1?.trim()) {
      return t('production.process.serialRequiredGuard', { defaultValue: 'Missing translation' });
    }
    return null;
  }, [activeOperation, consumptionLine.quantity, consumptionLine.serialNo1, consumptionLine.stockCode, consumptionRequiresSerial, selectedOrder, t]);

  const outputGuardMessage = useMemo(() => {
    if (!selectedOrder) return t('production.process.pickAssignedOrderFirstOutput', { defaultValue: 'Missing translation' });
    if (!activeOperation) return t('production.process.startCardHint', { defaultValue: 'Missing translation' });
    if (!outputLine.stockCode) return t('production.process.pickOutputLine', { defaultValue: 'Missing translation' });
    if (outputLine.quantity <= 0) return t('production.process.quantityMustBePositive', { defaultValue: 'Missing translation' });
    if (outputRequiresSerial && !outputLine.serialNo1?.trim()) {
      return t('production.process.serialRequiredGuard', { defaultValue: 'Missing translation' });
    }
    return null;
  }, [activeOperation, outputLine.quantity, outputLine.serialNo1, outputLine.stockCode, outputRequiresSerial, selectedOrder, t]);

  const renderStatusBadge = (status?: string | null): ReactElement => {
    const normalized = status ?? 'Unknown';
    const className = normalized === 'Completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
      : normalized === 'InProgress'
        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200'
        : normalized === 'Paused'
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'
          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';

    return (
      <Badge variant="outline" className={className}>
        {orderStatusLabel(normalized)}
      </Badge>
    );
  };

  const renderEventBadge = (type: string): ReactElement => {
    const className = type === 'Completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
      : type === 'Started' || type === 'Resumed'
        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200'
        : type === 'Paused'
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'
          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';

    return (
      <Badge variant="outline" className={className}>
        {operationEventTypeLabel(type)}
      </Badge>
    );
  };

  const renderTrackingBadge = (mode?: string | null): ReactElement => {
    const normalized = mode ?? 'None';
    const className = normalized === 'Serial'
      ? 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-200'
      : normalized === 'Lot'
        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200'
        : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';

    return (
      <Badge variant="outline" className={className}>
        {trackingModeLabel(normalized)}
      </Badge>
    );
  };

  const renderSerialModeBadge = (mode?: string | null): ReactElement => {
    const normalized = mode ?? 'Optional';
    const className = normalized === 'Required'
      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';

    return (
      <Badge variant="outline" className={className}>
        {serialModeLabel(normalized)}
      </Badge>
    );
  };

  const prefillConsumptionFromPlan = (plannedRowId: string): void => {
    const planned = selectedOrder?.consumptions.find((row) => String(row.id) === plannedRowId);
    if (!planned) {
      return;
    }

    setConsumptionLine((prev) => ({
      ...prev,
      stockCode: planned.stockCode,
      yapKod: planned.yapKod ?? '',
      quantity: Math.max(planned.plannedQuantity - (planned.consumedQuantity ?? 0), 0) || planned.plannedQuantity,
      unit: planned.unit ?? 'ADET',
      sourceWarehouseCode: planned.sourceWarehouseCode ?? '',
      sourceCellCode: planned.sourceCellCode ?? '',
    }));
  };

  const prefillOutputFromPlan = (plannedRowId: string): void => {
    const planned = selectedOrder?.outputs.find((row) => String(row.id) === plannedRowId);
    if (!planned) {
      return;
    }

    setOutputLine((prev) => ({
      ...prev,
      stockCode: planned.stockCode,
      yapKod: planned.yapKod ?? '',
      quantity: Math.max(planned.plannedQuantity - (planned.producedQuantity ?? 0), 0) || planned.plannedQuantity,
      unit: planned.unit ?? 'ADET',
      targetWarehouseCode: planned.targetWarehouseCode ?? '',
      targetCellCode: planned.targetCellCode ?? '',
    }));
  };

  const handleRecordConsumption = (): void => {
    if (!canRecordConsumption) {
      toast.error(consumptionGuardMessage || t('common.error'));
      return;
    }

    consumptionMutation.mutate();
  };

  const handleRecordOutput = (): void => {
    if (!canRecordOutput) {
      toast.error(outputGuardMessage || t('common.error'));
      return;
    }

    outputMutation.mutate();
  };

  const switchDisplayMode = (mode: 'web' | 'kiosk'): void => {
    const next = new URLSearchParams(searchParams);
    if (mode === 'kiosk') {
      next.set('mode', 'kiosk');
    } else {
      next.delete('mode');
    }
    setSearchParams(next, { replace: true });
  };

  const quickEntryCandidates = useMemo(() => {
    if (!selectedOrder) {
      return [];
    }

    return quickEntryMode === 'Consumption' ? selectedOrder.consumptions : selectedOrder.outputs;
  }, [quickEntryMode, selectedOrder]);

  const quickEntryMatches = useMemo(() => {
    const needle = quickEntryValue.trim().toLowerCase();
    if (!needle) {
      return quickEntryCandidates;
    }

    return quickEntryCandidates.filter((row) =>
      row.stockCode.toLowerCase().includes(needle)
      || (row.yapKod ?? '').toLowerCase().includes(needle),
    );
  }, [quickEntryCandidates, quickEntryValue]);

  const quickEntryPrimaryMatch = quickEntryMatches.find((row) => {
    return getQuickEntryRemainingQuantity(row) > 0;
  }) ?? quickEntryMatches[0];

  const applyQuickEntryMatch = (): void => {
    if (!quickEntryPrimaryMatch) {
      toast.error(t('production.process.quickEntryNoMatch', { defaultValue: 'Missing translation' }));
      return;
    }

    if (quickEntryMode === 'Consumption') {
      prefillConsumptionFromPlan(String(quickEntryPrimaryMatch.id));
      setConsumptionLine((prev) => ({
        ...prev,
        scannedBarcode: quickEntryValue.trim(),
      }));
    } else {
      prefillOutputFromPlan(String(quickEntryPrimaryMatch.id));
      setOutputLine((prev) => ({
        ...prev,
        scannedBarcode: quickEntryValue.trim(),
      }));
    }

    toast.success(t('production.process.quickEntryApplied', { defaultValue: 'Missing translation' }));
  };

  return (
    <FormPageShell
      title={t('production.process.title')}
      description={t('production.process.subtitle')}
      actions={(
        <div className="flex gap-2">
          <Button variant={isKioskMode ? 'outline' : 'default'} onClick={() => switchDisplayMode('web')}>
            {t('production.process.webMode', { defaultValue: 'Missing translation' })}
          </Button>
          <Button variant={isKioskMode ? 'default' : 'outline'} onClick={() => switchDisplayMode('kiosk')}>
            {t('production.process.kioskMode', { defaultValue: 'Missing translation' })}
          </Button>
          {headerId > 0 ? (
            <Button variant="outline" onClick={() => navigate(`/production/detail/${headerId}`)}>
              {t('production.process.openDetail')}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate('/production/list')}>{t('common.back')}</Button>
        </div>
      )}
      isLoading={detailQuery.isLoading}
      isError={detailQuery.isError}
      errorTitle={t('common.error')}
      errorDescription={detailQuery.error instanceof Error ? detailQuery.error.message : t('production.process.error')}
    >
      {detailQuery.data && (
        <div className={isKioskMode ? 'space-y-6 pb-32' : 'space-y-6'}>
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="overflow-hidden border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_36%),linear-gradient(135deg,_#0f172a,_#1e293b_58%,_#334155)] text-white dark:border-white/10">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardDescription className="text-slate-200">{t('production.process.title')}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tracking-tight">{detailQuery.data.header.documentNo}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                      <span>{t('production.process.orders')}: {detailQuery.data.orders.length}</span>
                      <span className="text-slate-400">•</span>
                      <span>{t('common.status')}: {detailQuery.data.header.status ? orderStatusLabel(detailQuery.data.header.status) : t('production.process.defaultDraft')}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('production.process.operation')}</div>
                    <div className="mt-2 text-lg font-semibold">
                      {activeOperation?.status ? orderStatusLabel(activeOperation.status) : t('production.process.operationNone')}
                    </div>
                    <div className="mt-2 text-xs text-slate-300">
                      {recentEvent
                        ? `${operationEventTypeLabel(recentEvent.eventType)} • ${formatDateTime(recentEvent.eventAt)}`
                        : t('production.process.timelineEmpty')}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-300">{t('production.process.orders')}</div>
                    <div className="mt-2 text-3xl font-semibold">{detailQuery.data.orders.length}</div>
                    <div className="mt-1 text-xs text-slate-300">{t('production.process.pickOrder')}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-300">{t('production.process.lineHistory')}</div>
                    <div className="mt-2 text-3xl font-semibold">{movementSummary.total}</div>
                    <div className="mt-1 text-xs text-slate-300">
                      {t('production.process.lineRoleConsumption')}: {movementSummary.consumptionCount} / {t('production.process.lineRoleOutput')}: {movementSummary.outputCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-300">{t('production.process.operation')}</div>
                    <div className="mt-2 text-3xl font-semibold">{activeOperation?.actualDurationMinutes ?? 0}</div>
                    <div className="mt-1 text-xs text-slate-300">{t('production.process.minutesShort', { count: activeOperation?.actualDurationMinutes ?? 0 })}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>{t('production.process.selectedOrder', { defaultValue: 'Missing translation' })}</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Factory className="size-4 text-slate-500" />
                    {selectedOrder?.orderNo ?? '-'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOrder ? renderStatusBadge(selectedOrder.status) : <Badge variant="outline">-</Badge>}
                    {hasDependencyBlocker ? (
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                        <AlertTriangle className="mr-1 size-3" />
                        {t('production.process.dependencyBlocked')}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{selectedOrder?.producedStockCode || t('production.process.pickOrder')}</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{t('production.process.outputProgress', { defaultValue: 'Missing translation' })}</span>
                      <span>{formatQuantity(selectedOrder?.completedQuantity)} / {formatQuantity(selectedOrder?.plannedQuantity)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${selectedOrderProgress}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>{t('production.process.lastOperation', { defaultValue: 'Missing translation' })}</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TimerReset className="size-4 text-slate-500" />
                    {recentEvent ? operationEventTypeLabel(recentEvent.eventType) : t('production.process.operationNone')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>{formatDateTime(recentEvent?.eventAt)}</div>
                  <div>{recentEvent?.eventNote || t('production.process.timelineEmpty')}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {selectedOrder ? (
            <Card className="overflow-hidden border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-sky-50/70 dark:border-white/10 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/20">
              <CardContent className="grid gap-4 p-6 md:grid-cols-4">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('production.process.selectedOrder', { defaultValue: 'Missing translation' })}</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedOrder.orderNo}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{selectedOrder.producedStockCode}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('production.process.outputProgress', { defaultValue: 'Missing translation' })}</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(selectedOrder.completedQuantity)} / {formatQuantity(selectedOrder.plannedQuantity)}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{t('production.process.gap.output', { value: selectedOrderGaps.outputGap })}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('production.process.materialProgress', { defaultValue: 'Missing translation' })}</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('production.process.gap.consumption', { value: selectedOrderGaps.consumptionGap })}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{selectedOrder.consumptions.length} {t('production.process.consumptions').toLowerCase()}</div>
                </div>
                <div className="flex items-center justify-start md:justify-end">
                  <div className="flex flex-wrap gap-2">
                    {renderStatusBadge(selectedOrder.status)}
                    {hasDependencyBlocker ? (
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                        {t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <CheckCircle2 className="mr-1 size-3" />
                        {t('production.process.dependenciesReady')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>{t('production.process.operatorFlow', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.process.operatorFlowSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">01</div>
                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{t('production.process.selectedOrder', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedOrder?.orderNo || t('production.process.pickOrder')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">02</div>
                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{t('production.process.dependencies', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {hasDependencyBlocker
                    ? t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })
                    : t('production.process.dependenciesReady')}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">03</div>
                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{t('production.process.currentAction', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{currentActionSummary.title}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{currentActionSummary.description}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">04</div>
                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{t('production.process.lineHistory', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t('production.process.lineRoleConsumption')}: {movementSummary.consumptionCount} / {t('production.process.lineRoleOutput')}: {movementSummary.outputCount}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isKioskMode ? 'border-slate-200/80 bg-gradient-to-r from-white to-amber-50/70 dark:border-white/10 dark:from-slate-950 dark:to-amber-950/10' : 'border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-950/70'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="size-4 text-slate-500" />
                {t('production.process.quickEntryTitle', { defaultValue: 'Missing translation' })}
              </CardTitle>
              <CardDescription>{t('production.process.quickEntrySubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={quickEntryMode === 'Consumption' ? 'default' : 'outline'} onClick={() => setQuickEntryMode('Consumption')}>
                  {t('production.process.lineRoleConsumption')}
                </Button>
                <Button type="button" variant={quickEntryMode === 'Output' ? 'default' : 'outline'} onClick={() => setQuickEntryMode('Output')}>
                  {t('production.process.lineRoleOutput')}
                </Button>
              </div>

              <div className={isKioskMode ? 'grid gap-3 xl:grid-cols-[1fr_auto]' : 'grid gap-3 md:grid-cols-[1fr_auto]'}>
                <Input
                  value={quickEntryValue}
                  onChange={(e) => setQuickEntryValue(e.target.value)}
                  placeholder={t('production.process.quickEntryPlaceholder', { defaultValue: 'Missing translation' })}
                  className={isKioskMode ? 'h-14 text-lg' : undefined}
                />
                <Button type="button" size="lg" onClick={applyQuickEntryMatch} disabled={!quickEntryPrimaryMatch}>
                  <ScanLine className="mr-2 size-4" />
                  {t('production.process.quickEntryApply', { defaultValue: 'Missing translation' })}
                </Button>
              </div>

              {quickEntryPrimaryMatch ? (
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{quickEntryPrimaryMatch.stockCode}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{quickEntryPrimaryMatch.yapKod || '-'} • {quickEntryMode === 'Consumption' ? ('sourceWarehouseCode' in quickEntryPrimaryMatch ? quickEntryPrimaryMatch.sourceWarehouseCode : '-') : ('targetWarehouseCode' in quickEntryPrimaryMatch ? quickEntryPrimaryMatch.targetWarehouseCode : '-')}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderTrackingBadge(quickEntryPrimaryMatch.trackingMode)}
                      {renderSerialModeBadge(quickEntryPrimaryMatch.serialEntryMode)}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.plannedQuantity')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(quickEntryPrimaryMatch.plannedQuantity)} {quickEntryPrimaryMatch.unit || ''}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.list.completedQuantity')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {formatQuantity(getQuickEntryCompletedQuantity(quickEntryPrimaryMatch))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-sky-200/70 bg-sky-50/70 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-500/10">
                      <div className="text-xs text-sky-700 dark:text-sky-200">{t('production.process.remainingQuantity', { defaultValue: 'Missing translation' })}</div>
                      <div className="mt-1 font-semibold text-sky-900 dark:text-sky-100">
                        {formatQuantity(getQuickEntryRemainingQuantity(quickEntryPrimaryMatch))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {t('production.process.quickEntryNoMatch', { defaultValue: 'Missing translation' })}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedOrder ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.requiredConsumptions', { defaultValue: 'Missing translation' })}</CardTitle>
                  <CardDescription>{t('production.process.requiredConsumptionsSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.consumptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.lookupEmpty')}
                    </div>
                  ) : selectedOrder.consumptions.map((row) => {
                    const remaining = Math.max(row.plannedQuantity - (row.consumedQuantity ?? 0), 0);
                    return (
                      <div key={row.id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{row.stockCode}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{row.yapKod || '-'} • {row.sourceWarehouseCode || '-'} / {row.sourceCellCode || '-'}</div>
                          </div>
                          <Button type="button" size="sm" variant="outline" onClick={() => prefillConsumptionFromPlan(String(row.id))}>
                            {t('production.process.prefillFromPlan')}
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {renderTrackingBadge(row.trackingMode)}
                          {renderSerialModeBadge(row.serialEntryMode)}
                          {row.isMandatory ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                              {t('production.process.materialMandatory', { defaultValue: 'Missing translation' })}
                            </Badge>
                          ) : null}
                          {row.isBackflush ? (
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                              {t('production.process.materialBackflush', { defaultValue: 'Missing translation' })}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.plannedQuantity')}</div>
                            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(row.plannedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.list.completedQuantity')}</div>
                            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(row.consumedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="rounded-xl border border-sky-200/70 bg-sky-50/70 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-500/10">
                            <div className="text-xs text-sky-700 dark:text-sky-200">{t('production.process.remainingQuantity', { defaultValue: 'Missing translation' })}</div>
                            <div className="mt-1 font-semibold text-sky-900 dark:text-sky-100">{formatQuantity(remaining)} {row.unit || ''}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.expectedOutputs', { defaultValue: 'Missing translation' })}</CardTitle>
                  <CardDescription>{t('production.process.expectedOutputsSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.outputs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.lookupEmpty')}
                    </div>
                  ) : selectedOrder.outputs.map((row) => {
                    const remaining = Math.max(row.plannedQuantity - (row.producedQuantity ?? 0), 0);
                    return (
                      <div key={row.id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{row.stockCode}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{row.yapKod || '-'} • {row.targetWarehouseCode || '-'} / {row.targetCellCode || '-'}</div>
                          </div>
                          <Button type="button" size="sm" variant="outline" onClick={() => prefillOutputFromPlan(String(row.id))}>
                            {t('production.process.prefillFromPlan')}
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {renderTrackingBadge(row.trackingMode)}
                          {renderSerialModeBadge(row.serialEntryMode)}
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                            {t('production.process.outputReadyTarget', { defaultValue: 'Missing translation' })}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.plannedQuantity')}</div>
                            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(row.plannedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.list.completedQuantity')}</div>
                            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(row.producedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                            <div className="text-xs text-emerald-700 dark:text-emerald-200">{t('production.process.remainingQuantity', { defaultValue: 'Missing translation' })}</div>
                            <div className="mt-1 font-semibold text-emerald-900 dark:text-emerald-100">{formatQuantity(remaining)} {row.unit || ''}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {!isKioskMode ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('production.process.timeline')}</CardTitle>
              <CardDescription>{t('production.process.timelineSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeOperation || activeOperation.events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {t('production.process.timelineEmpty')}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOperation.events.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderEventBadge(event.eventType)}
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatDateTime(event.eventAt)}</span>
                        {event.durationMinutes ? <span className="text-xs text-slate-500">{t('production.process.minutesShort', { count: event.durationMinutes })}</span> : null}
                      </div>
                      {(event.eventReasonCode || event.eventNote) ? (
                        <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                          {event.eventReasonCode ? <div>{t('production.process.reasonCode')}: {event.eventReasonCode}</div> : null}
                          {event.eventNote ? <div>{event.eventNote}</div> : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          ) : null}

          {!isKioskMode ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('production.process.planDetail')}</CardTitle>
              <CardDescription>{t('production.process.planDetailSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('production.process.filterAllOrders')}</SelectItem>
                      <SelectItem value="Draft">{orderStatusLabel('Draft')}</SelectItem>
                      <SelectItem value="Ready">{orderStatusLabel('Ready')}</SelectItem>
                      <SelectItem value="InProgress">{orderStatusLabel('InProgress')}</SelectItem>
                      <SelectItem value="Paused">{orderStatusLabel('Paused')}</SelectItem>
                      <SelectItem value="Completed">{orderStatusLabel('Completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label>{t('production.process.orderSearchLabel')}</Label>
                  <Input value={orderStockFilter} onChange={(e) => setOrderStockFilter(e.target.value)} placeholder={t('production.process.orderSearchPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('production.process.assignmentScope', { defaultValue: 'Missing translation' })}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant={onlyAssignedOrders ? 'default' : 'outline'} onClick={() => setOnlyAssignedOrders(true)}>
                      {t('production.process.onlyAssignedOrders', { defaultValue: 'Missing translation' })}
                    </Button>
                    <Button type="button" size="sm" variant={!onlyAssignedOrders ? 'default' : 'outline'} onClick={() => setOnlyAssignedOrders(false)}>
                      {t('production.process.allOrders', { defaultValue: 'Missing translation' })}
                    </Button>
                  </div>
                </div>
                <Card className="gap-2 border-amber-200/80 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <CardHeader className="pb-2">
                    <CardDescription>{t('production.process.gap.summary')}</CardDescription>
                    <CardTitle className="text-base">{selectedOrder ? selectedOrder.orderNo : '-'}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-sm">
                    <Badge variant={selectedOrderGaps.outputGap > 0 ? 'secondary' : 'default'}>{t('production.process.gap.output', { value: selectedOrderGaps.outputGap })}</Badge>
                    <Badge variant={selectedOrderGaps.consumptionGap > 0 ? 'secondary' : 'default'}>{t('production.process.gap.consumption', { value: selectedOrderGaps.consumptionGap })}</Badge>
                  </CardContent>
                </Card>
              </div>

              {selectedOrder ? (
                <Card className="border-slate-200/70 dark:border-white/10">
                  <CardHeader>
                    <CardTitle>{t('production.process.dependencies')}</CardTitle>
                    <CardDescription>
                      {selectedOrderDependencies.waitingFor.length > 0
                        ? t('production.process.dependenciesBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })
                        : t('production.process.dependenciesReady')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrderDependencies.blockers.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                        {t('production.process.dependenciesEmpty')}
                      </div>
                    ) : (
                      selectedOrderDependencies.blockers.map((dependency) => (
                        <div key={dependency.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={dependency.isBlocking ? 'secondary' : 'default'}>
                              {dependency.isBlocking ? t('production.process.dependencyBlocked') : t('production.process.dependencyReady')}
                            </Badge>
                            <span className="font-medium">{dependency.predecessorOrderNo}</span>
                            <span className="text-sm text-slate-500">{dependencyTypeLabel(dependency.dependencyType)}</span>
                            <span className="text-sm text-slate-500">{t('production.process.predecessorStatus', { status: orderStatusLabel(dependency.predecessorStatus) })}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {dependency.requiredTransferCompleted ? (
                              <Badge variant="outline">
                                <ArrowRightLeft className="mr-1 size-3" />
                                {t('production.process.badgeTransferRequired')}
                              </Badge>
                            ) : null}
                            {dependency.requiredOutputAvailable ? <Badge variant="outline">{t('production.process.badgeOutputRequired')}</Badge> : null}
                            {dependency.lagMinutes > 0 ? <Badge variant="outline">{t('production.process.lagMinutes', { minutes: dependency.lagMinutes })}</Badge> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {detailQuery.data.headerAssignments.map((assignment) => (
                  <Badge key={assignment.id} variant="secondary">
                    {t('production.process.assignmentBadge', {
                      type: assignment.assignmentType,
                      user: String(assignment.assignedUserId ?? '-'),
                      role: String(assignment.assignedRoleId ?? '-'),
                    })}
                  </Badge>
                ))}
              </div>

              <Accordion type="multiple" className="space-y-4">
                {filteredOrders.map((order) => (
                  <AccordionItem key={order.id} value={`order-${order.id}`} className="rounded-2xl border border-slate-200/70 px-4 dark:border-white/10">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 flex-wrap items-center gap-3 text-left">
                        {renderStatusBadge(order.status)}
                        <span className="font-semibold">{order.orderNo}</span>
                        <span>{order.producedStockCode}</span>
                        <span>{formatQuantity(order.completedQuantity)} / {formatQuantity(order.plannedQuantity)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant={selectedOrder?.id === order.id ? 'default' : 'outline'} onClick={() => setSelectedOrder(order)}>
                          {t('production.process.selectOrder')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(detailQuery.data.header.documentNo || '')}&productionOrderNo=${encodeURIComponent(order.orderNo)}`)}
                          disabled={!canCreateTransfer}
                        >
                          {t('production.process.openTransfer', { defaultValue: 'Missing translation' })}
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.outputProgress', { defaultValue: 'Missing translation' })}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(order.completedQuantity)} / {formatQuantity(order.plannedQuantity)}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.consumptions')}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{order.consumptions.length}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.outputs')}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{order.outputs.length}</div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                          <CardHeader><CardTitle>{t('production.process.outputs')}</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('production.create.producedStockCode')}</TableHead>
                                  <TableHead>{t('production.create.plannedQuantity')}</TableHead>
                                  <TableHead>{t('production.list.completedQuantity')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.outputs.map((row) => {
                                  const gap = row.plannedQuantity - (row.producedQuantity ?? 0);
                                  return (
                                    <TableRow key={row.id}>
                                      <TableCell>{row.stockCode}</TableCell>
                                      <TableCell>{row.plannedQuantity}</TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap items-center gap-2">
                                          {row.producedQuantity ?? 0}
                                          {gap > 0 ? <Badge variant="secondary">{t('production.process.gapBadge', { value: gap })}</Badge> : <Badge variant="default">{t('production.process.completeBadge')}</Badge>}
                                          <Button type="button" variant="ghost" size="sm" onClick={() => prefillOutputFromPlan(String(row.id))}>
                                            {t('production.process.prefillFromPlan')}
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle>{t('production.process.consumptions')}</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('production.create.sourceStock')}</TableHead>
                                  <TableHead>{t('production.create.plannedQuantity')}</TableHead>
                                  <TableHead>{t('production.list.completedQuantity')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.consumptions.map((row) => {
                                  const gap = row.plannedQuantity - (row.consumedQuantity ?? 0);
                                  return (
                                    <TableRow key={row.id}>
                                      <TableCell>{row.stockCode}</TableCell>
                                      <TableCell>{row.plannedQuantity}</TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap items-center gap-2">
                                          {row.consumedQuantity ?? 0}
                                          {gap > 0 ? <Badge variant="secondary">{t('production.process.gapBadge', { value: gap })}</Badge> : <Badge variant="default">{t('production.process.completeBadge')}</Badge>}
                                          <Button type="button" variant="ghost" size="sm" onClick={() => prefillConsumptionFromPlan(String(row.id))}>
                                            {t('production.process.prefillFromPlan')}
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{t('production.process.controls')}</CardTitle>
                <CardDescription>
                  {selectedOrder
                    ? hasDependencyBlocker
                      ? t('production.process.controlsDescriptionBlocked', { orderNo: selectedOrder.orderNo, stock: selectedOrder.producedStockCode })
                      : t('production.process.controlsDescription', { orderNo: selectedOrder.orderNo, stock: selectedOrder.producedStockCode })
                    : t('production.process.pickOrder')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrder ? (
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {t('production.process.quickTransferTitle', { defaultValue: 'Missing translation' })}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {t('production.process.quickTransferDescription', {
                            defaultValue: 'Missing translation',
                            orderNo: selectedOrder.orderNo,
                          })}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(detailQuery.data.header.documentNo || '')}&productionOrderNo=${encodeURIComponent(selectedOrder.orderNo)}`)}
                        disabled={!canCreateTransfer}
                      >
                        {t('production.process.openTransfer', { defaultValue: 'Missing translation' })}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {hasDependencyBlocker ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })}
                  </div>
                ) : null}

                {!canUpdateProduction ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    {t('production.process.permissionInfo')}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('production.process.reasonCode')}</Label>
                    <Input value={eventPayload.reasonCode ?? ''} onChange={(e) => setEventPayload((prev) => ({ ...prev, reasonCode: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('production.process.duration')}</Label>
                    <Input type="number" value={eventPayload.durationMinutes ?? ''} onChange={(e) => setEventPayload((prev) => ({ ...prev, durationMinutes: e.target.value === '' ? undefined : Number(e.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('common.description')}</Label>
                  <Textarea rows={3} value={eventPayload.note ?? ''} onChange={(e) => setEventPayload((prev) => ({ ...prev, note: e.target.value }))} />
                </div>

                <div className={isKioskMode ? 'grid gap-4 md:grid-cols-2' : 'grid gap-3 md:grid-cols-2'}>
                  {canShowStart ? (
                    <Button
                      type="button"
                      className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left'}
                      variant={hasDependencyBlocker ? 'destructive' : 'default'}
                      onClick={() => selectedOrder && startMutation.mutate(selectedOrder.id)}
                      disabled={!canUpdateProduction || !readyToRun || hasDependencyBlocker || startMutation.isPending}
                    >
                      <span className="flex items-center gap-2 text-base font-semibold"><PlayCircle className="size-4" />{t('production.process.start')}</span>
                      <span className="text-xs opacity-80">
                        {hasDependencyBlocker
                          ? t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })
                          : t('production.process.startCardHint', { defaultValue: 'Missing translation' })}
                      </span>
                    </Button>
                  ) : null}

                  {canShowPause ? (
                    <Button type="button" variant="outline" className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left'} onClick={() => pauseMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || pauseMutation.isPending}>
                      <span className="flex items-center gap-2 text-base font-semibold"><PauseCircle className="size-4" />{t('production.process.pause')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.pauseCardHint', { defaultValue: 'Missing translation' })}</span>
                    </Button>
                  ) : null}

                  {canShowResume ? (
                    <Button type="button" variant="outline" className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left'} onClick={() => resumeMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || resumeMutation.isPending}>
                      <span className="flex items-center gap-2 text-base font-semibold"><TimerReset className="size-4" />{t('production.process.resume')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.resumeCardHint', { defaultValue: 'Missing translation' })}</span>
                    </Button>
                  ) : null}

                  {canShowComplete ? (
                    <Button type="button" variant="destructive" className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left'} onClick={() => completeMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || completeMutation.isPending}>
                      <span className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="size-4" />{t('production.process.complete')}</span>
                      <span className="text-xs opacity-80">{t('production.process.completeCardHint', { defaultValue: 'Missing translation' })}</span>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {!isKioskMode ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.lineHistory')}</CardTitle>
                  <CardDescription>{t('production.process.lineHistorySubtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('production.process.lineHistoryRole')}</Label>
                      <Select value={historyRoleFilter} onValueChange={setHistoryRoleFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('production.process.lineHistoryFilterAll')}</SelectItem>
                          <SelectItem value="Consumption">{t('production.process.lineRoleConsumption')}</SelectItem>
                          <SelectItem value="Output">{t('production.process.lineRoleOutput')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('production.process.lineHistoryStock')}</Label>
                      <Input value={historyStockFilter} onChange={(e) => setHistoryStockFilter(e.target.value)} placeholder={t('production.process.lineHistoryStockPlaceholder')} />
                    </div>
                  </div>

                  {!activeOperation || filteredOperationLines.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.lineHistoryEmpty')}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('production.process.lineHistoryColTime')}</TableHead>
                          <TableHead>{t('production.process.lineHistoryColRole')}</TableHead>
                          <TableHead>{t('production.process.lineHistoryColStock')}</TableHead>
                          <TableHead>{t('production.process.lineHistoryColQty')}</TableHead>
                          <TableHead>{t('production.process.lineHistoryColSerial')}</TableHead>
                          <TableHead>{t('production.process.lineHistoryColLocation')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOperationLines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>{formatDateTime(line.createdDate)}</TableCell>
                            <TableCell><Badge variant="secondary">{lineRoleLabel(line.lineRole)}</Badge></TableCell>
                            <TableCell>{line.stockCode}</TableCell>
                            <TableCell>{line.quantity} {line.unit || ''}</TableCell>
                            <TableCell>{line.serialNo1 || line.lotNo || line.batchNo || '-'}</TableCell>
                            <TableCell>{[line.sourceWarehouseCode || line.sourceCellCode, line.targetWarehouseCode || line.targetCellCode].filter(Boolean).join(t('production.process.warehouseCellSeparator')) || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.addConsumption')}</CardTitle>
                  <CardDescription>{t('production.process.consumptionSimpleHint', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.lineRoleConsumption')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectedConsumptionPlan?.stockCode || '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.plannedQuantity')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(selectedConsumptionPlan?.plannedQuantity)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.gap.summary')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectedConsumptionPlan ? formatQuantity(Math.max(selectedConsumptionPlan.plannedQuantity - (selectedConsumptionPlan.consumedQuantity ?? 0), 0)) : '-'}</div>
                    </div>
                  </div>
                  {selectedConsumptionPlan ? (
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      {renderTrackingBadge(selectedConsumptionPlan.trackingMode)}
                      {renderSerialModeBadge(selectedConsumptionPlan.serialEntryMode)}
                      {selectedConsumptionPlan.isMandatory ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                          {t('production.process.materialMandatory', { defaultValue: 'Missing translation' })}
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}
                  {consumptionGuardMessage ? (
                    <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      {consumptionGuardMessage}
                    </div>
                  ) : null}

                  {!selectedOrder ? (
                    <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.pickAssignedOrderFirst', { defaultValue: 'Missing translation' })}
                    </div>
                  ) : null}

                  <Combobox
                    options={consumptionStockOptions}
                    value={selectedConsumptionPlan ? String(selectedConsumptionPlan.id) : ''}
                    onValueChange={(value) => prefillConsumptionFromPlan(value)}
                    placeholder={t('production.process.pickConsumptionLine', { defaultValue: 'Missing translation' })}
                    searchPlaceholder={t('production.process.lookupSearch')}
                    emptyText={t('production.process.lookupEmpty')}
                    disabled={!selectedOrder}
                  />
                  <Input type="number" placeholder={t('production.create.plannedQuantity')} value={consumptionLine.quantity} onChange={(e) => setConsumptionLine((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))} disabled={!selectedOrder} />
                  <Input placeholder={t('production.process.serial')} value={consumptionLine.serialNo1 ?? ''} onChange={(e) => setConsumptionLine((prev) => ({ ...prev, serialNo1: e.target.value }))} disabled={!selectedOrder} />

                  <div className="rounded-xl border border-slate-200/70 px-3 py-2 text-sm dark:border-white/10">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.sourceWarehouse')}</div>
                    <div className="font-medium">{consumptionLine.sourceWarehouseCode || '-'}</div>
                  </div>

                  <ShelfLookupCombobox
                    warehouseCode={consumptionLine.sourceWarehouseCode}
                    value={consumptionLine.sourceCellCode ?? ''}
                    onValueChange={(value) => setConsumptionLine((prev) => ({ ...prev, sourceCellCode: value }))}
                    placeholder={t('production.process.sourceCellSelect')}
                    searchPlaceholder={t('production.process.cellSearch')}
                    emptyText={t('production.process.cellEmpty')}
                    disabled={!selectedOrder}
                  />

                  <div className="md:col-span-2">
                    {selectedConsumptionPlan ? (
                      <div className="mb-3 rounded-xl border border-sky-200/70 bg-sky-50/70 p-3 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
                        {t('production.process.selectedConsumptionInfo', {
                          defaultValue: 'Missing translation',
                          stock: selectedConsumptionPlan.stockCode,
                          planned: selectedConsumptionPlan.plannedQuantity,
                          remaining: Math.max(selectedConsumptionPlan.plannedQuantity - (selectedConsumptionPlan.consumedQuantity ?? 0), 0),
                        })}
                      </div>
                    ) : null}
                    <Button type="button" onClick={handleRecordConsumption} disabled={!canRecordConsumption || consumptionMutation.isPending}>
                      {t('production.process.recordConsumption')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.addOutput')}</CardTitle>
                  <CardDescription>{t('production.process.outputSimpleHint', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.lineRoleOutput')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectedOutputPlan?.stockCode || '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.plannedQuantity')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatQuantity(selectedOutputPlan?.plannedQuantity)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.gap.summary')}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectedOutputPlan ? formatQuantity(Math.max(selectedOutputPlan.plannedQuantity - (selectedOutputPlan.producedQuantity ?? 0), 0)) : '-'}</div>
                    </div>
                  </div>
                  {selectedOutputPlan ? (
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      {renderTrackingBadge(selectedOutputPlan.trackingMode)}
                      {renderSerialModeBadge(selectedOutputPlan.serialEntryMode)}
                    </div>
                  ) : null}
                  {outputGuardMessage ? (
                    <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      {outputGuardMessage}
                    </div>
                  ) : null}

                  {!selectedOrder ? (
                    <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.pickAssignedOrderFirstOutput', { defaultValue: 'Missing translation' })}
                    </div>
                  ) : null}

                  <Combobox
                    options={outputStockOptions}
                    value={selectedOutputPlan ? String(selectedOutputPlan.id) : ''}
                    onValueChange={(value) => prefillOutputFromPlan(value)}
                    placeholder={t('production.process.pickOutputLine', { defaultValue: 'Missing translation' })}
                    searchPlaceholder={t('production.process.lookupSearch')}
                    emptyText={t('production.process.lookupEmpty')}
                    disabled={!selectedOrder}
                  />
                  <Input type="number" placeholder={t('production.create.plannedQuantity')} value={outputLine.quantity} onChange={(e) => setOutputLine((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))} disabled={!selectedOrder} />
                  <Input placeholder={t('production.process.serial')} value={outputLine.serialNo1 ?? ''} onChange={(e) => setOutputLine((prev) => ({ ...prev, serialNo1: e.target.value }))} disabled={!selectedOrder} />

                  <div className="rounded-xl border border-slate-200/70 px-3 py-2 text-sm dark:border-white/10">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.targetWarehouse')}</div>
                    <div className="font-medium">{outputLine.targetWarehouseCode || '-'}</div>
                  </div>

                  <ShelfLookupCombobox
                    warehouseCode={outputLine.targetWarehouseCode}
                    value={outputLine.targetCellCode ?? ''}
                    onValueChange={(value) => setOutputLine((prev) => ({ ...prev, targetCellCode: value }))}
                    placeholder={t('production.process.targetCellSelect')}
                    searchPlaceholder={t('production.process.cellSearch')}
                    emptyText={t('production.process.cellEmptyTarget')}
                    disabled={!selectedOrder}
                  />

                  <div className="md:col-span-2">
                    {selectedOutputPlan ? (
                      <div className="mb-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {t('production.process.selectedOutputInfo', {
                          defaultValue: 'Missing translation',
                          stock: selectedOutputPlan.stockCode,
                          planned: selectedOutputPlan.plannedQuantity,
                          remaining: Math.max(selectedOutputPlan.plannedQuantity - (selectedOutputPlan.producedQuantity ?? 0), 0),
                        })}
                      </div>
                    ) : null}
                    <Button type="button" onClick={handleRecordOutput} disabled={!canRecordOutput || outputMutation.isPending}>
                      {t('production.process.recordOutput')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className={isKioskMode
            ? 'sticky bottom-0 z-20 -mx-2 rounded-t-3xl border border-slate-200/80 bg-white/98 px-4 py-5 shadow-[0_-16px_48px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-slate-950/98 sm:mx-0'
            : 'sticky bottom-0 z-20 -mx-2 rounded-t-3xl border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:mx-0'}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('production.process.currentAction', { defaultValue: 'Missing translation' })}</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentActionSummary.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{currentActionSummary.description}</div>
              </div>

              <div className={isKioskMode ? 'grid gap-3 sm:grid-cols-2 xl:flex' : 'grid gap-3 sm:grid-cols-2 xl:flex'}>
                {canShowStart ? (
                  <Button
                    type="button"
                    size="lg"
                    className={isKioskMode ? 'min-h-16 min-w-48 text-lg' : 'min-h-14 min-w-40 text-base'}
                    variant={hasDependencyBlocker ? 'destructive' : 'default'}
                    onClick={() => selectedOrder && startMutation.mutate(selectedOrder.id)}
                    disabled={!canUpdateProduction || !readyToRun || hasDependencyBlocker || startMutation.isPending}
                  >
                    <PlayCircle className="mr-2 size-5" />
                    {t('production.process.start')}
                  </Button>
                ) : null}

                {canShowPause ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className={isKioskMode ? 'min-h-16 min-w-48 text-lg' : 'min-h-14 min-w-40 text-base'}
                    onClick={() => pauseMutation.mutate()}
                    disabled={!canUpdateProduction || !activeOperation || pauseMutation.isPending}
                  >
                    <PauseCircle className="mr-2 size-5" />
                    {t('production.process.pause')}
                  </Button>
                ) : null}

                {canShowResume ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className={isKioskMode ? 'min-h-16 min-w-48 text-lg' : 'min-h-14 min-w-40 text-base'}
                    onClick={() => resumeMutation.mutate()}
                    disabled={!canUpdateProduction || !activeOperation || resumeMutation.isPending}
                  >
                    <TimerReset className="mr-2 size-5" />
                    {t('production.process.resume')}
                  </Button>
                ) : null}

                {canShowComplete ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    className={isKioskMode ? 'min-h-16 min-w-48 text-lg' : 'min-h-14 min-w-40 text-base'}
                    onClick={() => completeMutation.mutate()}
                    disabled={!canUpdateProduction || !activeOperation || completeMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 size-5" />
                    {t('production.process.complete')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </FormPageShell>
  );
}
