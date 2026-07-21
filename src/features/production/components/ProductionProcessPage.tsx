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
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsSelect, OpsSelectItem, OpsTextarea, PageState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
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

const opsBadgeClass = 'wms-ops-surface-chip';
const opsHeadingClass = 'wms-ops-surface-label';
const opsLabelClass = 'wms-ops-surface-label text-muted-foreground';
const opsValueClass = 'font-semibold text-foreground tabular-nums';
const opsCardClass = 'wms-ops-surface-card';

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
  const permission = useCrudPermission('wms.production');
  const transferPermission = useCrudPermission('wms.production-transfer');
  const canUpdateProduction = permission.canUpdate;
  const canCreateTransfer = transferPermission.canCreate;
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
      <Badge variant="outline" className={`${opsBadgeClass} ${className}`}>
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
      <Badge variant="outline" className={`${opsBadgeClass} ${className}`}>
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
      <Badge variant="outline" className={`${opsBadgeClass} ${className}`}>
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
      <Badge variant="outline" className={`${opsBadgeClass} ${className}`}>
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
    <OpsFormPageShell
      className="wms-ops-erp-skin wms-ops-production-page"
      eyebrow={
        <>
          <span>{t('production.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('production.breadcrumb.module')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('production.process.title')}</span>
        </>
      }
      title={t('production.process.title')}
      description={t('production.process.subtitle')}
      actions={(
        <div className="wms-ops-actions flex flex-wrap gap-2">
          <OpsActionButton type="button" variant={isKioskMode ? 'secondary' : 'primary'} onClick={() => switchDisplayMode('web')}>
            {t('production.process.webMode', { defaultValue: 'Missing translation' })}
          </OpsActionButton>
          <OpsActionButton type="button" variant={isKioskMode ? 'primary' : 'secondary'} onClick={() => switchDisplayMode('kiosk')}>
            {t('production.process.kioskMode', { defaultValue: 'Missing translation' })}
          </OpsActionButton>
          {headerId > 0 ? (
            <OpsActionButton type="button" variant="secondary" onClick={() => navigate(`/production/detail/${headerId}`)}>
              {t('production.process.openDetail')}
            </OpsActionButton>
          ) : null}
          <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/production/list')}>{t('common.back')}</OpsActionButton>
        </div>
      )}
    >
      {detailQuery.isLoading ? (
        <PageState tone="loading" title={t('common.loading')} compact />
      ) : null}

      {detailQuery.isError ? (
        <PageState
          tone="error"
          title={t('common.error')}
          description={detailQuery.error instanceof Error ? detailQuery.error.message : t('production.process.error')}
          compact
        />
      ) : null}

      {detailQuery.data && !detailQuery.isLoading && !detailQuery.isError ? (
        <div className={isKioskMode ? 'wms-ops-production-content space-y-6 pb-32' : 'wms-ops-production-content space-y-6'}>
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className={`${opsCardClass} overflow-hidden shadow-[0_0_18px_color-mix(in_oklab,var(--wms-ops-accent)_8%,transparent)]`}>
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardDescription>{t('production.process.title')}</CardDescription>
                    <div className="font-mono text-2xl font-semibold tracking-tight text-foreground">{detailQuery.data.header.documentNo}</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{t('production.process.orders')}: {detailQuery.data.orders.length}</span>
                      <span className="opacity-60">•</span>
                      <span>{t('common.status')}: {detailQuery.data.header.status ? orderStatusLabel(detailQuery.data.header.status) : t('production.process.defaultDraft')}</span>
                    </div>
                  </div>
                  <div className="wms-ops-production-panel px-4 py-3">
                    <div className={opsLabelClass}>{t('production.process.operation')}</div>
                    <div className={`mt-2 text-lg ${opsValueClass}`}>
                      {activeOperation?.status ? orderStatusLabel(activeOperation.status) : t('production.process.operationNone')}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {recentEvent
                        ? `${operationEventTypeLabel(recentEvent.eventType)} • ${formatDateTime(recentEvent.eventAt)}`
                        : t('production.process.timelineEmpty')}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="wms-ops-production-panel p-4">
                    <div className={opsLabelClass}>{t('production.process.orders')}</div>
                    <div className={`mt-2 text-3xl ${opsValueClass}`}>{detailQuery.data.orders.length}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t('production.process.pickOrder')}</div>
                  </div>
                  <div className="wms-ops-production-panel p-4">
                    <div className={opsLabelClass}>{t('production.process.lineHistory')}</div>
                    <div className={`mt-2 text-3xl ${opsValueClass}`}>{movementSummary.total}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t('production.process.lineRoleConsumption')}: {movementSummary.consumptionCount} / {t('production.process.lineRoleOutput')}: {movementSummary.outputCount}
                    </div>
                  </div>
                  <div className="wms-ops-production-panel p-4">
                    <div className={opsLabelClass}>{t('production.process.operation')}</div>
                    <div className={`mt-2 text-3xl ${opsValueClass}`}>{activeOperation?.actualDurationMinutes ?? 0}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t('production.process.minutesShort', { count: activeOperation?.actualDurationMinutes ?? 0 })}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Card className={opsCardClass}>
                <CardHeader className="pb-3">
                  <CardDescription>{t('production.process.selectedOrder', { defaultValue: 'Missing translation' })}</CardDescription>
                  <CardTitle className={`flex items-center gap-2 ${opsHeadingClass}`}>
                    <Factory className="size-4 text-[color:var(--wms-ops-accent)] opacity-80" />
                    {selectedOrder?.orderNo ?? '-'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOrder ? renderStatusBadge(selectedOrder.status) : <Badge variant="outline" className={opsBadgeClass}>-</Badge>}
                    {hasDependencyBlocker ? (
                      <Badge variant="outline" className={`${opsBadgeClass} border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200`}>
                        <AlertTriangle className="mr-1 size-3" />
                        {t('production.process.dependencyBlocked')}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedOrder?.producedStockCode || t('production.process.pickOrder')}</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('production.process.outputProgress', { defaultValue: 'Missing translation' })}</span>
                      <span>{formatQuantity(selectedOrder?.completedQuantity)} / {formatQuantity(selectedOrder?.plannedQuantity)}</span>
                    </div>
                    <div className="h-2 rounded-none bg-[color-mix(in_oklab,var(--wms-ops-accent)_14%,transparent)]">
                      <div className="h-2 rounded-none bg-[var(--wms-ops-accent)]" style={{ width: `${selectedOrderProgress}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={opsCardClass}>
                <CardHeader className="pb-3">
                  <CardDescription>{t('production.process.lastOperation', { defaultValue: 'Missing translation' })}</CardDescription>
                  <CardTitle className={`flex items-center gap-2 ${opsHeadingClass}`}>
                    <TimerReset className="size-4 text-[color:var(--wms-ops-accent)] opacity-80" />
                    {recentEvent ? operationEventTypeLabel(recentEvent.eventType) : t('production.process.operationNone')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>{formatDateTime(recentEvent?.eventAt)}</div>
                  <div>{recentEvent?.eventNote || t('production.process.timelineEmpty')}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {selectedOrder ? (
            <Card className={`${opsCardClass} overflow-hidden`}>
              <CardContent className="grid gap-4 p-6 md:grid-cols-4">
                <div className="space-y-1">
                  <div className={opsLabelClass}>{t('production.process.selectedOrder', { defaultValue: 'Missing translation' })}</div>
                  <div className={`text-lg ${opsValueClass}`}>{selectedOrder.orderNo}</div>
                  <div className="text-sm text-muted-foreground">{selectedOrder.producedStockCode}</div>
                </div>
                <div className="space-y-1">
                  <div className={opsLabelClass}>{t('production.process.outputProgress', { defaultValue: 'Missing translation' })}</div>
                  <div className={`text-lg ${opsValueClass}`}>{formatQuantity(selectedOrder.completedQuantity)} / {formatQuantity(selectedOrder.plannedQuantity)}</div>
                  <div className="text-sm text-muted-foreground">{t('production.process.gap.output', { value: selectedOrderGaps.outputGap })}</div>
                </div>
                <div className="space-y-1">
                  <div className={opsLabelClass}>{t('production.process.materialProgress', { defaultValue: 'Missing translation' })}</div>
                  <div className={`text-lg ${opsValueClass}`}>{t('production.process.gap.consumption', { value: selectedOrderGaps.consumptionGap })}</div>
                  <div className="text-sm text-muted-foreground">{selectedOrder.consumptions.length} {t('production.process.consumptions').toLowerCase()}</div>
                </div>
                <div className="flex items-center justify-start md:justify-end">
                  <div className="flex flex-wrap gap-2">
                    {renderStatusBadge(selectedOrder.status)}
                    {hasDependencyBlocker ? (
                      <Badge variant="outline" className={`${opsBadgeClass} border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200`}>
                        {t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`${opsBadgeClass} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200`}>
                        <CheckCircle2 className="mr-1 size-3" />
                        {t('production.process.dependenciesReady')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className={opsCardClass}>
            <CardHeader>
              <CardTitle className={opsHeadingClass}>{t('production.process.operatorFlow', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.process.operatorFlowSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-4">
              <div className="wms-ops-production-panel p-4">
                <div className={opsLabelClass}>01</div>
                <div className={`mt-2 text-base ${opsValueClass}`}>{t('production.process.selectedOrder', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm text-muted-foreground">{selectedOrder?.orderNo || t('production.process.pickOrder')}</div>
              </div>
              <div className="wms-ops-production-panel p-4">
                <div className={opsLabelClass}>02</div>
                <div className={`mt-2 text-base ${opsValueClass}`}>{t('production.process.dependencies', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {hasDependencyBlocker
                    ? t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })
                    : t('production.process.dependenciesReady')}
                </div>
              </div>
              <div className="wms-ops-production-panel p-4">
                <div className={opsLabelClass}>03</div>
                <div className={`mt-2 text-base ${opsValueClass}`}>{t('production.process.currentAction', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm font-medium text-foreground">{currentActionSummary.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{currentActionSummary.description}</div>
              </div>
              <div className="wms-ops-production-panel p-4">
                <div className={opsLabelClass}>04</div>
                <div className={`mt-2 text-base ${opsValueClass}`}>{t('production.process.lineHistory', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {t('production.process.lineRoleConsumption')}: {movementSummary.consumptionCount} / {t('production.process.lineRoleOutput')}: {movementSummary.outputCount}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={opsCardClass}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${opsHeadingClass}`}>
                <ScanLine className="size-4 text-[color:var(--wms-ops-accent)] opacity-80" />
                {t('production.process.quickEntryTitle', { defaultValue: 'Missing translation' })}
              </CardTitle>
              <CardDescription>{t('production.process.quickEntrySubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <OpsActionButton type="button" variant={quickEntryMode === 'Consumption' ? 'primary' : 'secondary'} onClick={() => setQuickEntryMode('Consumption')}>
                  {t('production.process.lineRoleConsumption')}
                </OpsActionButton>
                <OpsActionButton type="button" variant={quickEntryMode === 'Output' ? 'primary' : 'secondary'} onClick={() => setQuickEntryMode('Output')}>
                  {t('production.process.lineRoleOutput')}
                </OpsActionButton>
              </div>

              <div className={isKioskMode ? 'grid gap-3 xl:grid-cols-[1fr_auto]' : 'grid gap-3 md:grid-cols-[1fr_auto]'}>
                <OpsInput
                  value={quickEntryValue}
                  onChange={(e) => setQuickEntryValue(e.target.value)}
                  placeholder={t('production.process.quickEntryPlaceholder', { defaultValue: 'Missing translation' })}
                  className={isKioskMode ? 'h-14 text-lg' : undefined}
                />
                <OpsActionButton type="button" onClick={applyQuickEntryMatch} disabled={!quickEntryPrimaryMatch}>
                  <ScanLine className="mr-2 size-4" />
                  {t('production.process.quickEntryApply', { defaultValue: 'Missing translation' })}
                </OpsActionButton>
              </div>

              {quickEntryPrimaryMatch ? (
                <div className="wms-ops-production-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className={`text-sm ${opsValueClass}`}>{quickEntryPrimaryMatch.stockCode}</div>
                      <div className="text-sm text-muted-foreground">{quickEntryPrimaryMatch.yapKod || '-'} • {quickEntryMode === 'Consumption' ? ('sourceWarehouseCode' in quickEntryPrimaryMatch ? quickEntryPrimaryMatch.sourceWarehouseCode : '-') : ('targetWarehouseCode' in quickEntryPrimaryMatch ? quickEntryPrimaryMatch.targetWarehouseCode : '-')}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderTrackingBadge(quickEntryPrimaryMatch.trackingMode)}
                      {renderSerialModeBadge(quickEntryPrimaryMatch.serialEntryMode)}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="wms-ops-production-panel px-3 py-2">
                      <div className={opsLabelClass}>{t('production.create.plannedQuantity')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(quickEntryPrimaryMatch.plannedQuantity)} {quickEntryPrimaryMatch.unit || ''}</div>
                    </div>
                    <div className="wms-ops-production-panel px-3 py-2">
                      <div className={opsLabelClass}>{t('production.list.completedQuantity')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>
                        {formatQuantity(getQuickEntryCompletedQuantity(quickEntryPrimaryMatch))}
                      </div>
                    </div>
                    <div className="rounded-none border border-sky-200/70 bg-sky-50/70 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-500/10">
                      <div className={`${opsLabelClass} text-sky-700 dark:text-sky-200`}>{t('production.process.remainingQuantity', { defaultValue: 'Missing translation' })}</div>
                      <div className="mt-1 font-semibold tabular-nums text-sky-900 dark:text-sky-100">
                        {formatQuantity(getQuickEntryRemainingQuantity(quickEntryPrimaryMatch))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="wms-ops-production-empty">
                  {t('production.process.quickEntryNoMatch', { defaultValue: 'Missing translation' })}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedOrder ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className={opsCardClass}>
                <CardHeader>
                  <CardTitle className={opsHeadingClass}>{t('production.process.requiredConsumptions', { defaultValue: 'Missing translation' })}</CardTitle>
                  <CardDescription>{t('production.process.requiredConsumptionsSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.consumptions.length === 0 ? (
                    <div className="wms-ops-production-empty">
                      {t('production.process.lookupEmpty')}
                    </div>
                  ) : selectedOrder.consumptions.map((row) => {
                    const remaining = Math.max(row.plannedQuantity - (row.consumedQuantity ?? 0), 0);
                    return (
                      <div key={row.id} className="wms-ops-production-panel p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className={`text-base ${opsValueClass}`}>{row.stockCode}</div>
                            <div className="text-sm text-muted-foreground">{row.yapKod || '-'} • {row.sourceWarehouseCode || '-'} / {row.sourceCellCode || '-'}</div>
                          </div>
                          <OpsActionButton type="button" variant="secondary" onClick={() => prefillConsumptionFromPlan(String(row.id))}>
                            {t('production.process.prefillFromPlan')}
                          </OpsActionButton>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {renderTrackingBadge(row.trackingMode)}
                          {renderSerialModeBadge(row.serialEntryMode)}
                          {row.isMandatory ? (
                            <Badge variant="outline" className={`${opsBadgeClass} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200`}>
                              {t('production.process.materialMandatory', { defaultValue: 'Missing translation' })}
                            </Badge>
                          ) : null}
                          {row.isBackflush ? (
                            <Badge variant="outline" className={`${opsBadgeClass} border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200`}>
                              {t('production.process.materialBackflush', { defaultValue: 'Missing translation' })}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="wms-ops-production-panel px-3 py-2">
                            <div className={opsLabelClass}>{t('production.create.plannedQuantity')}</div>
                            <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(row.plannedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="wms-ops-production-panel px-3 py-2">
                            <div className={opsLabelClass}>{t('production.list.completedQuantity')}</div>
                            <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(row.consumedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="rounded-none border border-sky-200/70 bg-sky-50/70 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-500/10">
                            <div className={`${opsLabelClass} text-sky-700 dark:text-sky-200`}>{t('production.process.remainingQuantity', { defaultValue: 'Missing translation' })}</div>
                            <div className="mt-1 font-semibold tabular-nums text-sky-900 dark:text-sky-100">{formatQuantity(remaining)} {row.unit || ''}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className={opsCardClass}>
                <CardHeader>
                  <CardTitle className={opsHeadingClass}>{t('production.process.expectedOutputs', { defaultValue: 'Missing translation' })}</CardTitle>
                  <CardDescription>{t('production.process.expectedOutputsSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.outputs.length === 0 ? (
                    <div className="wms-ops-production-empty">
                      {t('production.process.lookupEmpty')}
                    </div>
                  ) : selectedOrder.outputs.map((row) => {
                    const remaining = Math.max(row.plannedQuantity - (row.producedQuantity ?? 0), 0);
                    return (
                      <div key={row.id} className="wms-ops-production-panel p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className={`text-base ${opsValueClass}`}>{row.stockCode}</div>
                            <div className="text-sm text-muted-foreground">{row.yapKod || '-'} • {row.targetWarehouseCode || '-'} / {row.targetCellCode || '-'}</div>
                          </div>
                          <OpsActionButton type="button" variant="secondary" onClick={() => prefillOutputFromPlan(String(row.id))}>
                            {t('production.process.prefillFromPlan')}
                          </OpsActionButton>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {renderTrackingBadge(row.trackingMode)}
                          {renderSerialModeBadge(row.serialEntryMode)}
                          <Badge variant="outline" className={`${opsBadgeClass} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200`}>
                            {t('production.process.outputReadyTarget', { defaultValue: 'Missing translation' })}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="wms-ops-production-panel px-3 py-2">
                            <div className={opsLabelClass}>{t('production.create.plannedQuantity')}</div>
                            <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(row.plannedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="wms-ops-production-panel px-3 py-2">
                            <div className={opsLabelClass}>{t('production.list.completedQuantity')}</div>
                            <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(row.producedQuantity)} {row.unit || ''}</div>
                          </div>
                          <div className="rounded-none border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                            <div className={`${opsLabelClass} text-emerald-700 dark:text-emerald-200`}>{t('production.process.remainingQuantity', { defaultValue: 'Missing translation' })}</div>
                            <div className="mt-1 font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">{formatQuantity(remaining)} {row.unit || ''}</div>
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
          <Card className={opsCardClass}>
            <CardHeader>
              <CardTitle className={opsHeadingClass}>{t('production.process.timeline')}</CardTitle>
              <CardDescription>{t('production.process.timelineSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeOperation || activeOperation.events.length === 0 ? (
                <div className="wms-ops-production-empty">
                  {t('production.process.timelineEmpty')}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOperation.events.map((event) => (
                    <div key={event.id} className="wms-ops-production-panel p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderEventBadge(event.eventType)}
                        <span className="text-sm font-medium text-foreground">{formatDateTime(event.eventAt)}</span>
                        {event.durationMinutes ? <span className="text-xs text-muted-foreground">{t('production.process.minutesShort', { count: event.durationMinutes })}</span> : null}
                      </div>
                      {(event.eventReasonCode || event.eventNote) ? (
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
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
          <Card className={opsCardClass}>
            <CardHeader>
              <CardTitle className={opsHeadingClass}>{t('production.process.planDetail')}</CardTitle>
              <CardDescription>{t('production.process.planDetailSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label className={opsLabelClass}>{t('common.status')}</Label>
                  <OpsSelect value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <OpsSelectItem value="all">{t('production.process.filterAllOrders')}</OpsSelectItem>
                    <OpsSelectItem value="Draft">{orderStatusLabel('Draft')}</OpsSelectItem>
                    <OpsSelectItem value="Ready">{orderStatusLabel('Ready')}</OpsSelectItem>
                    <OpsSelectItem value="InProgress">{orderStatusLabel('InProgress')}</OpsSelectItem>
                    <OpsSelectItem value="Paused">{orderStatusLabel('Paused')}</OpsSelectItem>
                    <OpsSelectItem value="Completed">{orderStatusLabel('Completed')}</OpsSelectItem>
                  </OpsSelect>
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label className={opsLabelClass}>{t('production.process.orderSearchLabel')}</Label>
                  <OpsInput value={orderStockFilter} onChange={(e) => setOrderStockFilter(e.target.value)} placeholder={t('production.process.orderSearchPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label className={opsLabelClass}>{t('production.process.assignmentScope', { defaultValue: 'Missing translation' })}</Label>
                  <div className="flex flex-wrap gap-2">
                    <OpsActionButton type="button" variant={onlyAssignedOrders ? 'primary' : 'secondary'} onClick={() => setOnlyAssignedOrders(true)}>
                      {t('production.process.onlyAssignedOrders', { defaultValue: 'Missing translation' })}
                    </OpsActionButton>
                    <OpsActionButton type="button" variant={!onlyAssignedOrders ? 'primary' : 'secondary'} onClick={() => setOnlyAssignedOrders(false)}>
                      {t('production.process.allOrders', { defaultValue: 'Missing translation' })}
                    </OpsActionButton>
                  </div>
                </div>
                <Card className="gap-2 rounded-none border-amber-200/80 bg-amber-50/60 shadow-none dark:border-amber-500/20 dark:bg-amber-500/10">
                  <CardHeader className="pb-2">
                    <CardDescription>{t('production.process.gap.summary')}</CardDescription>
                    <CardTitle className={opsHeadingClass}>{selectedOrder ? selectedOrder.orderNo : '-'}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-sm">
                    <Badge className={opsBadgeClass} variant={selectedOrderGaps.outputGap > 0 ? 'secondary' : 'default'}>{t('production.process.gap.output', { value: selectedOrderGaps.outputGap })}</Badge>
                    <Badge className={opsBadgeClass} variant={selectedOrderGaps.consumptionGap > 0 ? 'secondary' : 'default'}>{t('production.process.gap.consumption', { value: selectedOrderGaps.consumptionGap })}</Badge>
                  </CardContent>
                </Card>
              </div>

              {selectedOrder ? (
                <Card className={opsCardClass}>
                  <CardHeader>
                    <CardTitle className={opsHeadingClass}>{t('production.process.dependencies')}</CardTitle>
                    <CardDescription>
                      {selectedOrderDependencies.waitingFor.length > 0
                        ? t('production.process.dependenciesBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })
                        : t('production.process.dependenciesReady')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrderDependencies.blockers.length === 0 ? (
                      <div className="wms-ops-production-empty">
                        {t('production.process.dependenciesEmpty')}
                      </div>
                    ) : (
                      selectedOrderDependencies.blockers.map((dependency) => (
                        <div key={dependency.id} className="wms-ops-production-panel p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={opsBadgeClass} variant={dependency.isBlocking ? 'secondary' : 'default'}>
                              {dependency.isBlocking ? t('production.process.dependencyBlocked') : t('production.process.dependencyReady')}
                            </Badge>
                            <span className="font-medium">{dependency.predecessorOrderNo}</span>
                            <span className="text-sm text-muted-foreground">{dependencyTypeLabel(dependency.dependencyType)}</span>
                            <span className="text-sm text-muted-foreground">{t('production.process.predecessorStatus', { status: orderStatusLabel(dependency.predecessorStatus) })}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {dependency.requiredTransferCompleted ? (
                              <Badge variant="outline" className={opsBadgeClass}>
                                <ArrowRightLeft className="mr-1 size-3" />
                                {t('production.process.badgeTransferRequired')}
                              </Badge>
                            ) : null}
                            {dependency.requiredOutputAvailable ? <Badge variant="outline" className={opsBadgeClass}>{t('production.process.badgeOutputRequired')}</Badge> : null}
                            {dependency.lagMinutes > 0 ? <Badge variant="outline" className={opsBadgeClass}>{t('production.process.lagMinutes', { minutes: dependency.lagMinutes })}</Badge> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {detailQuery.data.headerAssignments.map((assignment) => (
                  <Badge key={assignment.id} variant="secondary" className={opsBadgeClass}>
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
                  <AccordionItem key={order.id} value={`order-${order.id}`} className="wms-ops-surface-inset px-4">
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
                        <OpsActionButton type="button" variant={selectedOrder?.id === order.id ? 'primary' : 'secondary'} onClick={() => setSelectedOrder(order)}>
                          {t('production.process.selectOrder')}
                        </OpsActionButton>
                        <OpsActionButton
                          type="button"
                          variant="secondary"
                          onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(detailQuery.data.header.documentNo || '')}&productionOrderNo=${encodeURIComponent(order.orderNo)}`)}
                          disabled={!canCreateTransfer}
                        >
                          {t('production.process.openTransfer', { defaultValue: 'Missing translation' })}
                        </OpsActionButton>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="wms-ops-production-panel p-3">
                          <div className={opsLabelClass}>{t('production.process.outputProgress', { defaultValue: 'Missing translation' })}</div>
                          <div className={`mt-1 text-lg ${opsValueClass}`}>{formatQuantity(order.completedQuantity)} / {formatQuantity(order.plannedQuantity)}</div>
                        </div>
                        <div className="wms-ops-production-panel p-3">
                          <div className={opsLabelClass}>{t('production.process.consumptions')}</div>
                          <div className={`mt-1 text-lg ${opsValueClass}`}>{order.consumptions.length}</div>
                        </div>
                        <div className="wms-ops-production-panel p-3">
                          <div className={opsLabelClass}>{t('production.process.outputs')}</div>
                          <div className={`mt-1 text-lg ${opsValueClass}`}>{order.outputs.length}</div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <Card className={opsCardClass}>
                          <CardHeader><CardTitle className={opsHeadingClass}>{t('production.process.outputs')}</CardTitle></CardHeader>
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
                                          {gap > 0 ? <Badge className={opsBadgeClass} variant="secondary">{t('production.process.gapBadge', { value: gap })}</Badge> : <Badge className={opsBadgeClass} variant="default">{t('production.process.completeBadge')}</Badge>}
                                          <OpsActionButton type="button" variant="secondary" onClick={() => prefillOutputFromPlan(String(row.id))}>
                                            {t('production.process.prefillFromPlan')}
                                          </OpsActionButton>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        <Card className={opsCardClass}>
                          <CardHeader><CardTitle className={opsHeadingClass}>{t('production.process.consumptions')}</CardTitle></CardHeader>
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
                                          {gap > 0 ? <Badge className={opsBadgeClass} variant="secondary">{t('production.process.gapBadge', { value: gap })}</Badge> : <Badge className={opsBadgeClass} variant="default">{t('production.process.completeBadge')}</Badge>}
                                          <OpsActionButton type="button" variant="secondary" onClick={() => prefillConsumptionFromPlan(String(row.id))}>
                                            {t('production.process.prefillFromPlan')}
                                          </OpsActionButton>
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
            <Card className={opsCardClass}>
              <CardHeader>
                <CardTitle className={opsHeadingClass}>{t('production.process.controls')}</CardTitle>
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
                  <div className="wms-ops-production-panel p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {t('production.process.quickTransferTitle', { defaultValue: 'Missing translation' })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('production.process.quickTransferDescription', {
                            defaultValue: 'Missing translation',
                            orderNo: selectedOrder.orderNo,
                          })}
                        </div>
                      </div>
                      <OpsActionButton
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(detailQuery.data.header.documentNo || '')}&productionOrderNo=${encodeURIComponent(selectedOrder.orderNo)}`)}
                        disabled={!canCreateTransfer}
                      >
                        {t('production.process.openTransfer', { defaultValue: 'Missing translation' })}
                      </OpsActionButton>
                    </div>
                  </div>
                ) : null}

                {hasDependencyBlocker ? (
                  <div className="rounded-none border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })}
                  </div>
                ) : null}

                {!permission.canMutate ? <PermissionNotice /> : null}
                {!canUpdateProduction ? (
                  <div className="rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    {t('production.process.permissionInfo')}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={opsLabelClass}>{t('production.process.reasonCode')}</Label>
                    <OpsInput value={eventPayload.reasonCode ?? ''} onChange={(e) => setEventPayload((prev) => ({ ...prev, reasonCode: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className={opsLabelClass}>{t('production.process.duration')}</Label>
                    <OpsInput type="number" value={eventPayload.durationMinutes ?? ''} onChange={(e) => setEventPayload((prev) => ({ ...prev, durationMinutes: e.target.value === '' ? undefined : Number(e.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={opsLabelClass}>{t('common.description')}</Label>
                  <OpsTextarea rows={3} value={eventPayload.note ?? ''} onChange={(e) => setEventPayload((prev) => ({ ...prev, note: e.target.value }))} />
                </div>

                <div className={isKioskMode ? 'grid gap-4 md:grid-cols-2' : 'grid gap-3 md:grid-cols-2'}>
                  {canShowStart ? (
                    <Button
                      type="button"
                      className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 rounded-none p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-none p-4 text-left'}
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
                    <Button type="button" variant="outline" className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 rounded-none p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-none p-4 text-left'} onClick={() => pauseMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || pauseMutation.isPending}>
                      <span className="flex items-center gap-2 text-base font-semibold"><PauseCircle className="size-4" />{t('production.process.pause')}</span>
                      <span className="text-xs text-muted-foreground">{t('production.process.pauseCardHint', { defaultValue: 'Missing translation' })}</span>
                    </Button>
                  ) : null}

                  {canShowResume ? (
                    <Button type="button" variant="outline" className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 rounded-none p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-none p-4 text-left'} onClick={() => resumeMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || resumeMutation.isPending}>
                      <span className="flex items-center gap-2 text-base font-semibold"><TimerReset className="size-4" />{t('production.process.resume')}</span>
                      <span className="text-xs text-muted-foreground">{t('production.process.resumeCardHint', { defaultValue: 'Missing translation' })}</span>
                    </Button>
                  ) : null}

                  {canShowComplete ? (
                    <Button type="button" variant="destructive" className={isKioskMode ? 'h-auto min-h-32 flex-col items-start justify-start gap-3 rounded-none p-6 text-left text-lg' : 'h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-none p-4 text-left'} onClick={() => completeMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || completeMutation.isPending}>
                      <span className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="size-4" />{t('production.process.complete')}</span>
                      <span className="text-xs opacity-80">{t('production.process.completeCardHint', { defaultValue: 'Missing translation' })}</span>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {!isKioskMode ? (
              <Card className={opsCardClass}>
                <CardHeader>
                  <CardTitle className={opsHeadingClass}>{t('production.process.lineHistory')}</CardTitle>
                  <CardDescription>{t('production.process.lineHistorySubtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className={opsLabelClass}>{t('production.process.lineHistoryRole')}</Label>
                      <OpsSelect value={historyRoleFilter} onValueChange={setHistoryRoleFilter}>
                        <OpsSelectItem value="all">{t('production.process.lineHistoryFilterAll')}</OpsSelectItem>
                        <OpsSelectItem value="Consumption">{t('production.process.lineRoleConsumption')}</OpsSelectItem>
                        <OpsSelectItem value="Output">{t('production.process.lineRoleOutput')}</OpsSelectItem>
                      </OpsSelect>
                    </div>
                    <div className="space-y-2">
                      <Label className={opsLabelClass}>{t('production.process.lineHistoryStock')}</Label>
                      <OpsInput value={historyStockFilter} onChange={(e) => setHistoryStockFilter(e.target.value)} placeholder={t('production.process.lineHistoryStockPlaceholder')} />
                    </div>
                  </div>

                  {!activeOperation || filteredOperationLines.length === 0 ? (
                    <div className="wms-ops-production-empty">
                      {t('production.process.lineHistoryEmpty')}
                    </div>
                  ) : (
                    <Table className="wms-ops-production-line-table wms-ops-production-line-table--compact">
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
                            <TableCell><Badge variant="secondary" className={opsBadgeClass}>{lineRoleLabel(line.lineRole)}</Badge></TableCell>
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

              <Card className={opsCardClass}>
                <CardHeader>
                  <CardTitle className={opsHeadingClass}>{t('production.process.addConsumption')}</CardTitle>
                  <CardDescription>{t('production.process.consumptionSimpleHint', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                    <div className="wms-ops-production-panel px-3 py-2 text-sm">
                      <div className={opsLabelClass}>{t('production.process.lineRoleConsumption')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{selectedConsumptionPlan?.stockCode || '-'}</div>
                    </div>
                    <div className="wms-ops-production-panel px-3 py-2 text-sm">
                      <div className={opsLabelClass}>{t('production.create.plannedQuantity')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(selectedConsumptionPlan?.plannedQuantity)}</div>
                    </div>
                    <div className="wms-ops-production-panel px-3 py-2 text-sm">
                      <div className={opsLabelClass}>{t('production.process.gap.summary')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{selectedConsumptionPlan ? formatQuantity(Math.max(selectedConsumptionPlan.plannedQuantity - (selectedConsumptionPlan.consumedQuantity ?? 0), 0)) : '-'}</div>
                    </div>
                  </div>
                  {selectedConsumptionPlan ? (
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      {renderTrackingBadge(selectedConsumptionPlan.trackingMode)}
                      {renderSerialModeBadge(selectedConsumptionPlan.serialEntryMode)}
                      {selectedConsumptionPlan.isMandatory ? (
                        <Badge variant="outline" className={`${opsBadgeClass} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200`}>
                          {t('production.process.materialMandatory', { defaultValue: 'Missing translation' })}
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}
                  {consumptionGuardMessage ? (
                    <div className="md:col-span-2 rounded-none border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      {consumptionGuardMessage}
                    </div>
                  ) : null}

                  {!selectedOrder ? (
                    <div className="md:col-span-2 wms-ops-production-empty">
                      {t('production.process.pickAssignedOrderFirst', { defaultValue: 'Missing translation' })}
                    </div>
                  ) : null}

                  <Combobox
                    variant="ops"
                    options={consumptionStockOptions}
                    value={selectedConsumptionPlan ? String(selectedConsumptionPlan.id) : ''}
                    onValueChange={(value) => prefillConsumptionFromPlan(value)}
                    placeholder={t('production.process.pickConsumptionLine', { defaultValue: 'Missing translation' })}
                    searchPlaceholder={t('production.process.lookupSearch')}
                    emptyText={t('production.process.lookupEmpty')}
                    disabled={!selectedOrder}
                  />
                  <OpsInput type="number" placeholder={t('production.create.plannedQuantity')} value={consumptionLine.quantity} onChange={(e) => setConsumptionLine((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))} disabled={!selectedOrder} />
                  <OpsInput placeholder={t('production.process.serial')} value={consumptionLine.serialNo1 ?? ''} onChange={(e) => setConsumptionLine((prev) => ({ ...prev, serialNo1: e.target.value }))} disabled={!selectedOrder} />

                  <div className="wms-ops-production-panel px-3 py-2 text-sm">
                    <div className={opsLabelClass}>{t('production.create.sourceWarehouse')}</div>
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
                      <div className="mb-3 rounded-none border border-sky-200/70 bg-sky-50/70 p-3 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
                        {t('production.process.selectedConsumptionInfo', {
                          defaultValue: 'Missing translation',
                          stock: selectedConsumptionPlan.stockCode,
                          planned: selectedConsumptionPlan.plannedQuantity,
                          remaining: Math.max(selectedConsumptionPlan.plannedQuantity - (selectedConsumptionPlan.consumedQuantity ?? 0), 0),
                        })}
                      </div>
                    ) : null}
                    <OpsActionButton type="button" onClick={handleRecordConsumption} disabled={!canRecordConsumption || consumptionMutation.isPending}>
                      {t('production.process.recordConsumption')}
                    </OpsActionButton>
                  </div>
                </CardContent>
              </Card>

              <Card className={opsCardClass}>
                <CardHeader>
                  <CardTitle className={opsHeadingClass}>{t('production.process.addOutput')}</CardTitle>
                  <CardDescription>{t('production.process.outputSimpleHint', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                    <div className="wms-ops-production-panel px-3 py-2 text-sm">
                      <div className={opsLabelClass}>{t('production.process.lineRoleOutput')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{selectedOutputPlan?.stockCode || '-'}</div>
                    </div>
                    <div className="wms-ops-production-panel px-3 py-2 text-sm">
                      <div className={opsLabelClass}>{t('production.create.plannedQuantity')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{formatQuantity(selectedOutputPlan?.plannedQuantity)}</div>
                    </div>
                    <div className="wms-ops-production-panel px-3 py-2 text-sm">
                      <div className={opsLabelClass}>{t('production.process.gap.summary')}</div>
                      <div className={`mt-1 ${opsValueClass}`}>{selectedOutputPlan ? formatQuantity(Math.max(selectedOutputPlan.plannedQuantity - (selectedOutputPlan.producedQuantity ?? 0), 0)) : '-'}</div>
                    </div>
                  </div>
                  {selectedOutputPlan ? (
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      {renderTrackingBadge(selectedOutputPlan.trackingMode)}
                      {renderSerialModeBadge(selectedOutputPlan.serialEntryMode)}
                    </div>
                  ) : null}
                  {outputGuardMessage ? (
                    <div className="md:col-span-2 rounded-none border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      {outputGuardMessage}
                    </div>
                  ) : null}

                  {!selectedOrder ? (
                    <div className="md:col-span-2 wms-ops-production-empty">
                      {t('production.process.pickAssignedOrderFirstOutput', { defaultValue: 'Missing translation' })}
                    </div>
                  ) : null}

                  <Combobox
                    variant="ops"
                    options={outputStockOptions}
                    value={selectedOutputPlan ? String(selectedOutputPlan.id) : ''}
                    onValueChange={(value) => prefillOutputFromPlan(value)}
                    placeholder={t('production.process.pickOutputLine', { defaultValue: 'Missing translation' })}
                    searchPlaceholder={t('production.process.lookupSearch')}
                    emptyText={t('production.process.lookupEmpty')}
                    disabled={!selectedOrder}
                  />
                  <OpsInput type="number" placeholder={t('production.create.plannedQuantity')} value={outputLine.quantity} onChange={(e) => setOutputLine((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))} disabled={!selectedOrder} />
                  <OpsInput placeholder={t('production.process.serial')} value={outputLine.serialNo1 ?? ''} onChange={(e) => setOutputLine((prev) => ({ ...prev, serialNo1: e.target.value }))} disabled={!selectedOrder} />

                  <div className="wms-ops-production-panel px-3 py-2 text-sm">
                    <div className={opsLabelClass}>{t('production.create.targetWarehouse')}</div>
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
                      <div className="mb-3 rounded-none border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {t('production.process.selectedOutputInfo', {
                          defaultValue: 'Missing translation',
                          stock: selectedOutputPlan.stockCode,
                          planned: selectedOutputPlan.plannedQuantity,
                          remaining: Math.max(selectedOutputPlan.plannedQuantity - (selectedOutputPlan.producedQuantity ?? 0), 0),
                        })}
                      </div>
                    ) : null}
                    <OpsActionButton type="button" onClick={handleRecordOutput} disabled={!canRecordOutput || outputMutation.isPending}>
                      {t('production.process.recordOutput')}
                    </OpsActionButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className={isKioskMode
            ? 'wms-ops-surface-card sticky bottom-0 z-20 -mx-2 bg-[color-mix(in_oklab,var(--wms-ops-card-bg)_96%,transparent)] px-4 py-5 backdrop-blur sm:mx-0'
            : 'wms-ops-surface-card sticky bottom-0 z-20 -mx-2 bg-[color-mix(in_oklab,var(--wms-ops-card-bg)_94%,transparent)] px-4 py-4 backdrop-blur sm:mx-0'}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <div className={`${opsLabelClass} tracking-[0.2em]`}>{t('production.process.currentAction', { defaultValue: 'Missing translation' })}</div>
                <div className={`text-lg ${opsValueClass}`}>{currentActionSummary.title}</div>
                <div className="text-sm text-muted-foreground">{currentActionSummary.description}</div>
              </div>

              <div className={isKioskMode ? 'grid gap-3 sm:grid-cols-2 xl:flex' : 'grid gap-3 sm:grid-cols-2 xl:flex'}>
                {canShowStart ? (
                  <Button
                    type="button"
                    size="lg"
                    className={isKioskMode ? 'min-h-16 min-w-48 rounded-none text-lg' : 'min-h-14 min-w-40 rounded-none text-base'}
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
                    className={isKioskMode ? 'min-h-16 min-w-48 rounded-none text-lg' : 'min-h-14 min-w-40 rounded-none text-base'}
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
                    className={isKioskMode ? 'min-h-16 min-w-48 rounded-none text-lg' : 'min-h-14 min-w-40 rounded-none text-base'}
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
                    className={isKioskMode ? 'min-h-16 min-w-48 rounded-none text-lg' : 'min-h-14 min-w-40 rounded-none text-base'}
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
      ) : null}
    </OpsFormPageShell>
  );
}
