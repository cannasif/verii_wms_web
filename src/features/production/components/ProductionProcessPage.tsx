import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
import { productionApi } from '../api/production-api';
import type { AddProductionOperationLineRequest, ProductionOperation, ProductionOrderDetail, ProductionOperationEventRequest } from '../types/production';

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
  const navigate = useNavigate();
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
  const consumptionCellOptions = useMemo<ComboboxOption[]>(
    () =>
      Array.from(
        new Set(
          (selectedOrder?.consumptions ?? [])
            .map((row) => row.sourceCellCode?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).map((value) => ({ value, label: value })),
    [selectedOrder],
  );
  const outputCellOptions = useMemo<ComboboxOption[]>(
    () =>
      Array.from(
        new Set(
          (selectedOrder?.outputs ?? [])
            .map((row) => row.targetCellCode?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).map((value) => ({ value, label: value })),
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

  return (
    <FormPageShell
      title={t('production.process.title')}
      description={t('production.process.subtitle')}
      actions={(
        <div className="flex gap-2">
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
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardDescription>{t('common.documentNo')}</CardDescription><CardTitle>{detailQuery.data.header.documentNo}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{t('common.status')}</CardDescription><CardTitle>{detailQuery.data.header.status ? orderStatusLabel(detailQuery.data.header.status) : t('production.process.defaultDraft')}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{t('production.process.orders')}</CardDescription><CardTitle>{detailQuery.data.orders.length}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{t('production.process.operation')}</CardDescription><CardTitle>{activeOperation?.status ? orderStatusLabel(activeOperation.status) : t('production.process.operationNone')}</CardTitle></CardHeader></Card>
          </div>

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
                        <Badge variant="secondary">{operationEventTypeLabel(event.eventType)}</Badge>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{new Date(event.eventAt).toLocaleString()}</span>
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
                  <Label>{t('production.process.assignmentScope', { defaultValue: 'Asama gorunumu' })}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant={onlyAssignedOrders ? 'default' : 'outline'} onClick={() => setOnlyAssignedOrders(true)}>
                      {t('production.process.onlyAssignedOrders', { defaultValue: 'Sadece bana atanmis asamalar' })}
                    </Button>
                    <Button type="button" size="sm" variant={!onlyAssignedOrders ? 'default' : 'outline'} onClick={() => setOnlyAssignedOrders(false)}>
                      {t('production.process.allOrders', { defaultValue: 'Tum asamalar' })}
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
                            {dependency.requiredTransferCompleted ? <Badge variant="outline">{t('production.process.badgeTransferRequired')}</Badge> : null}
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
                        <Badge variant={selectedOrder?.id === order.id ? 'default' : 'secondary'}>{orderStatusLabel(order.status)}</Badge>
                        <span className="font-semibold">{order.orderNo}</span>
                        <span>{order.producedStockCode}</span>
                        <span>{order.completedQuantity ?? 0} / {order.plannedQuantity}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={selectedOrder?.id === order.id ? 'default' : 'outline'} onClick={() => setSelectedOrder(order)}>
                          {t('production.process.selectOrder')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(detailQuery.data.header.documentNo || '')}&productionOrderNo=${encodeURIComponent(order.orderNo)}`)}
                          disabled={!canCreateTransfer}
                        >
                          {t('production.process.openTransfer', { defaultValue: 'Bu Asama Icin Transfer Ac' })}
                        </Button>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                          <CardHeader><CardTitle>{t('production.process.outputs')}</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>{t('production.create.producedStockCode')}</TableHead><TableHead>{t('production.create.plannedQuantity')}</TableHead><TableHead>{t('production.list.completedQuantity')}</TableHead></TableRow></TableHeader>
                              <TableBody>{order.outputs.map((row) => {
                                const gap = row.plannedQuantity - (row.producedQuantity ?? 0);
                                return <TableRow key={row.id}><TableCell>{row.stockCode}</TableCell><TableCell>{row.plannedQuantity}</TableCell><TableCell><div className="flex flex-wrap items-center gap-2">{row.producedQuantity ?? 0}{gap > 0 ? <Badge variant="secondary">{t('production.process.gapBadge', { value: gap })}</Badge> : <Badge variant="default">{t('production.process.completeBadge')}</Badge>}<Button type="button" variant="ghost" size="sm" onClick={() => prefillOutputFromPlan(String(row.id))}>{t('production.process.prefillFromPlan')}</Button></div></TableCell></TableRow>;
                              })}</TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader><CardTitle>{t('production.process.consumptions')}</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>{t('production.create.sourceStock')}</TableHead><TableHead>{t('production.create.plannedQuantity')}</TableHead><TableHead>{t('production.list.completedQuantity')}</TableHead></TableRow></TableHeader>
                              <TableBody>{order.consumptions.map((row) => {
                                const gap = row.plannedQuantity - (row.consumedQuantity ?? 0);
                                return <TableRow key={row.id}><TableCell>{row.stockCode}</TableCell><TableCell>{row.plannedQuantity}</TableCell><TableCell><div className="flex flex-wrap items-center gap-2">{row.consumedQuantity ?? 0}{gap > 0 ? <Badge variant="secondary">{t('production.process.gapBadge', { value: gap })}</Badge> : <Badge variant="default">{t('production.process.completeBadge')}</Badge>}<Button type="button" variant="ghost" size="sm" onClick={() => prefillConsumptionFromPlan(String(row.id))}>{t('production.process.prefillFromPlan')}</Button></div></TableCell></TableRow>;
                              })}</TableBody>
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
                          {t('production.process.quickTransferTitle', { defaultValue: 'Bu asama icin hizli transfer' })}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {t('production.process.quickTransferDescription', {
                            defaultValue: '{{orderNo}} asamasinin malzeme besleme, yari mamul veya cikti tasima transferini tek tikla baslat.',
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
                        {t('production.process.openTransfer', { defaultValue: 'Transfer Ac' })}
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
                <div className="grid gap-3 md:grid-cols-2">
                  {canShowStart ? (
                    <Button
                      type="button"
                      className="h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left"
                      variant={hasDependencyBlocker ? 'destructive' : 'default'}
                      onClick={() => selectedOrder && startMutation.mutate(selectedOrder.id)}
                      disabled={!canUpdateProduction || !readyToRun || hasDependencyBlocker || startMutation.isPending}
                    >
                      <span className="text-base font-semibold">{t('production.process.start')}</span>
                      <span className="text-xs opacity-80">
                        {hasDependencyBlocker
                          ? t('production.process.startBlocked', { orders: selectedOrderDependencies.waitingFor.join(', ') })
                          : t('production.process.startCardHint', { defaultValue: 'Secili asamayi operasyona alir.' })}
                      </span>
                    </Button>
                  ) : null}
                  {canShowPause ? (
                    <Button type="button" variant="outline" className="h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left" onClick={() => pauseMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || pauseMutation.isPending}>
                      <span className="text-base font-semibold">{t('production.process.pause')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.pauseCardHint', { defaultValue: 'Makine durusu, ara veya bekleme icin kullanin.' })}</span>
                    </Button>
                  ) : null}
                  {canShowResume ? (
                    <Button type="button" variant="outline" className="h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left" onClick={() => resumeMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || resumeMutation.isPending}>
                      <span className="text-base font-semibold">{t('production.process.resume')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('production.process.resumeCardHint', { defaultValue: 'Duraklayan asamayi kaldigi yerden devam ettirir.' })}</span>
                    </Button>
                  ) : null}
                  {canShowComplete ? (
                    <Button type="button" variant="destructive" className="h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left" onClick={() => completeMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || completeMutation.isPending}>
                      <span className="text-base font-semibold">{t('production.process.complete')}</span>
                      <span className="text-xs opacity-80">{t('production.process.completeCardHint', { defaultValue: 'Bu asamadaki operasyonu kapatir ve durumu gunceller.' })}</span>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
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
                            <TableCell>{new Date(line.createdDate).toLocaleString()}</TableCell>
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

              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.addConsumption')}</CardTitle>
                  <CardDescription>{t('production.process.consumptionSimpleHint', { defaultValue: '1. Tuketim kalemini secin. 2. Miktari kontrol edin. 3. Gerekirse seri girip kaydedin.' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {!selectedOrder ? (
                    <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.pickAssignedOrderFirst', { defaultValue: 'Once size atanmis bir asama secin. Tuketim kalemleri secilen asamadan otomatik gelir.' })}
                    </div>
                  ) : null}
                  <Combobox
                    options={consumptionStockOptions}
                    value={selectedConsumptionPlan ? String(selectedConsumptionPlan.id) : ''}
                    onValueChange={(value) => prefillConsumptionFromPlan(value)}
                    placeholder={t('production.process.pickConsumptionLine', { defaultValue: 'Atanmis tuketim kalemini secin' })}
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
                  <Combobox
                    options={consumptionCellOptions}
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
                          defaultValue: 'Secili kalem: {{stock}} / plan {{planned}} / kalan {{remaining}}',
                          stock: selectedConsumptionPlan.stockCode,
                          planned: selectedConsumptionPlan.plannedQuantity,
                          remaining: Math.max(selectedConsumptionPlan.plannedQuantity - (selectedConsumptionPlan.consumedQuantity ?? 0), 0),
                        })}
                      </div>
                    ) : null}
                    <Button type="button" onClick={() => consumptionMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || !consumptionLine.stockCode || consumptionMutation.isPending}>
                      {t('production.process.recordConsumption')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('production.process.addOutput')}</CardTitle>
                  <CardDescription>{t('production.process.outputSimpleHint', { defaultValue: '1. Uretilecek cikti kalemini secin. 2. Miktari kontrol edin. 3. Gerekirse seri girip kaydedin.' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {!selectedOrder ? (
                    <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('production.process.pickAssignedOrderFirstOutput', { defaultValue: 'Once size atanmis bir asama secin. Uretilecek cikti kalemleri secilen asamadan otomatik gelir.' })}
                    </div>
                  ) : null}
                  <Combobox
                    options={outputStockOptions}
                    value={selectedOutputPlan ? String(selectedOutputPlan.id) : ''}
                    onValueChange={(value) => prefillOutputFromPlan(value)}
                    placeholder={t('production.process.pickOutputLine', { defaultValue: 'Atanmis cikti kalemini secin' })}
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
                  <Combobox
                    options={outputCellOptions}
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
                          defaultValue: 'Secili kalem: {{stock}} / plan {{planned}} / kalan {{remaining}}',
                          stock: selectedOutputPlan.stockCode,
                          planned: selectedOutputPlan.plannedQuantity,
                          remaining: Math.max(selectedOutputPlan.plannedQuantity - (selectedOutputPlan.producedQuantity ?? 0), 0),
                        })}
                      </div>
                    ) : null}
                    <Button type="button" onClick={() => outputMutation.mutate()} disabled={!canUpdateProduction || !activeOperation || !outputLine.stockCode || outputMutation.isPending}>
                      {t('production.process.recordOutput')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </FormPageShell>
  );
}
