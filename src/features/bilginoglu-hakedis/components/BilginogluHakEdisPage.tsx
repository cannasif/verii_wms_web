import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Boxes, FileClock, GitBranch, Loader2, PackageCheck, Play, RefreshCw, Search, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisBatch, BilginogluHakEdisOrderActivity, BilginogluHakEdisOrderHeader, BilginogluHakEdisPlan } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisBatchesQuery,
  useBilginogluHakEdisOrderActivitiesQuery,
  useBilginogluHakEdisOrderPlansQuery,
  useBilginogluHakEdisOrdersQuery,
  useBilginogluHakEdisStepsQuery,
  useBilginogluHakEdisBatchActionMutation,
  useBilginogluHakEdisOrderPolicyMutation,
  useEvaluateBilginogluHakEdisMutation,
} from '../hooks/useBilginogluHakEdisQueries';

function formatQty(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function statusBadge(status: string, label: string): ReactElement {
  const tone = status === 'ReadyForShipment'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'InHakEdisFlow'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Blocked'
        ? 'bg-rose-100 text-rose-700'
        : status === 'WaitingStock'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-700';

  return <Badge className={`rounded-xl border-0 ${tone}`}>{label}</Badge>;
}

export function BilginogluHakEdisPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<BilginogluHakEdisOrderHeader | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BilginogluHakEdisPlan | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BilginogluHakEdisBatch | null>(null);
  const [allocationPolicy, setAllocationPolicy] = useState('StockBalanceAuto');
  const [shipmentPolicy, setShipmentPolicy] = useState('ManualShipment');

  useEffect(() => {
    setPageTitle(t('title'));
  }, [setPageTitle, t]);

  useEffect(() => {
    if (selectedOrder) {
      setAllocationPolicy(selectedOrder.allocationPolicy);
      setShipmentPolicy(selectedOrder.shipmentPolicy);
    }
  }, [selectedOrder]);

  const params = useMemo(() => ({ pageNumber: 1, pageSize: 50, search, sortBy: 'LastEvaluationDate', sortDirection: 'desc' }), [search]);
  const ordersQuery = useBilginogluHakEdisOrdersQuery(params);
  const plansQuery = useBilginogluHakEdisOrderPlansQuery(selectedOrder?.id ?? null);
  const activitiesQuery = useBilginogluHakEdisOrderActivitiesQuery(selectedOrder?.id ?? null);
  const batchesQuery = useBilginogluHakEdisBatchesQuery(selectedPlan?.id ?? null);
  const stepsQuery = useBilginogluHakEdisStepsQuery(selectedBatch?.id ?? null);
  const evaluateMutation = useEvaluateBilginogluHakEdisMutation();
  const batchActionMutation = useBilginogluHakEdisBatchActionMutation();
  const policyMutation = useBilginogluHakEdisOrderPolicyMutation();
  const statusLabel = (status: string): string => t(`status.${status}`, { defaultValue: status });

  const orders = ordersQuery.data?.data ?? [];
  const plans = plansQuery.data ?? [];
  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.remaining += order.totalRemainingQty;
        acc.available += order.totalWarehouseAvailableQty;
        acc.allocated += order.totalAllocatedQty;
        acc.ready += order.totalReadyForShipmentQty;
        acc.missing += order.totalMissingQty;
        acc.waiting += order.totalWaitingQty;
        return acc;
      },
      { remaining: 0, available: 0, allocated: 0, ready: 0, missing: 0, waiting: 0 },
    );
  }, [orders]);
  const selectedOrderNeed = useMemo(() => {
    const required = plans.reduce((sum, plan) => sum + Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty), 0);
    const available = plans.reduce((sum, plan) => sum + Math.max(0, plan.warehouseAvailableQty), 0);
    const canCreate = plans.reduce((sum, plan) => {
      const lineNeed = Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty);
      return sum + Math.min(lineNeed, Math.max(0, plan.warehouseAvailableQty));
    }, 0);

    return {
      required,
      available,
      canCreate,
      missing: Math.max(0, required - canCreate),
    };
  }, [plans]);
  const activities = activitiesQuery.data ?? [];
  const activitySummary = useMemo(() => {
    const datHeaders = new Set<number>();
    const shipmentHeaders = new Set<number>();
    let completed = 0;

    activities.forEach((activity) => {
      if (activity.sourceType === 'WT' && activity.sourceHeaderId) datHeaders.add(activity.sourceHeaderId);
      if (activity.sourceType === 'SH' && activity.sourceHeaderId) shipmentHeaders.add(activity.sourceHeaderId);
      if (activity.status === 'Completed' || activity.isCompleted) completed += 1;
    });

    return {
      datCount: datHeaders.size,
      shipmentCount: shipmentHeaders.size,
      completedCount: completed,
    };
  }, [activities]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t('breadcrumb.operations') }, { label: t('title') }]} />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
              <GitBranch className="size-4" />
              {t('hero.eyebrow')}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{t('title')}</h1>
            <p className="text-sm leading-6 text-slate-200 md:text-base">
              {t('hero.description')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => evaluateMutation.mutate(undefined)}
              disabled={!permission.canUpdate || evaluateMutation.isPending}
            >
              {evaluateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
              {t('actions.evaluate')}
            </Button>
            <Button type="button" variant="secondary" className="rounded-2xl" onClick={() => void ordersQuery.refetch()}>
              <RefreshCw className="mr-2 size-4" />
              {t('actions.refresh')}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<Boxes className="size-5" />} label={t('metrics.remaining')} value={formatQty(totals.remaining)} />
        <MetricCard icon={<GitBranch className="size-5" />} label={t('metrics.available')} value={formatQty(totals.available)} />
        <MetricCard icon={<PackageCheck className="size-5" />} label={t('metrics.ready')} value={formatQty(totals.ready)} />
        <MetricCard icon={<Truck className="size-5" />} label={t('metrics.missing')} value={formatQty(totals.missing)} />
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>{t('table.title')}</CardTitle>
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-2xl pl-9" placeholder={t('table.search')} />
          </div>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              {t('loading')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.order')}</TableHead>
                    <TableHead>{t('table.customer')}</TableHead>
                    <TableHead>{t('table.transferAll')}</TableHead>
                    <TableHead>{t('table.orderDetail')}</TableHead>
                    <TableHead>{t('table.allocation')}</TableHead>
                    <TableHead>{t('table.shipmentPolicy')}</TableHead>
                    <TableHead className="text-right">{t('table.remaining')}</TableHead>
                    <TableHead className="text-right">{t('table.stock')}</TableHead>
                    <TableHead className="text-right">{t('table.allocated')}</TableHead>
                    <TableHead className="text-right">{t('table.ready')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.evaluatedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => { setSelectedOrder(order); setSelectedPlan(null); setSelectedBatch(null); }}>
                      <TableCell className="font-semibold">{order.siparisNo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customerCode ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{order.customerName ?? '-'}</div>
                      </TableCell>
                      <TableCell>{order.transferAllFlag === 'E' ? t('common:common.yes', { defaultValue: 'Evet' }) : t('common:common.no', { defaultValue: 'Hayır' })}</TableCell>
                      <TableCell>{order.orderDetail ?? '-'}</TableCell>
                      <TableCell>{order.allocationPolicy}</TableCell>
                      <TableCell>{order.shipmentPolicy}</TableCell>
                      <TableCell className="text-right">{formatQty(order.totalRemainingQty)}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{formatQty(order.totalWarehouseAvailableQty)}</div>
                        <div className="text-xs text-muted-foreground">{t('table.canCreate')}: {formatQty(order.canCreateNewBatchQty)}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatQty(order.totalAllocatedQty)}</TableCell>
                      <TableCell className="text-right">{formatQty(order.totalReadyForShipmentQty)}</TableCell>
                      <TableCell>{statusBadge(order.status, statusLabel(order.status))}</TableCell>
                      <TableCell>{formatDate(order.lastEvaluationDate)}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">{t('empty')}</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedOrder != null} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setSelectedPlan(null); setSelectedBatch(null); } }}>
        <DialogContent className="max-w-5xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t('detail.title', { order: selectedOrder?.siparisNo })}</DialogTitle>
            <DialogDescription>{t('detail.description')}</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-5">
                <NeedCard label={t('need.required')} value={formatQty(selectedOrderNeed.required || selectedOrder.totalRequiredQty)} tone="slate" />
                <NeedCard label={t('need.available')} value={formatQty(selectedOrderNeed.available || selectedOrder.totalWarehouseAvailableQty)} tone="cyan" />
                <NeedCard label={t('need.canCreate')} value={formatQty(selectedOrderNeed.canCreate || selectedOrder.canCreateNewBatchQty)} tone="emerald" />
                <NeedCard label={t('need.allocated')} value={formatQty(selectedOrder.totalAllocatedQty)} tone="blue" />
                <NeedCard label={t('need.missing')} value={formatQty(selectedOrderNeed.missing || selectedOrder.totalMissingQty)} tone="amber" />
              </div>
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border p-3">
                <div className="min-w-40 rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">{t('table.transferAll')}</div>
                  <div className="text-sm font-bold">{selectedOrder.transferAllFlag === 'E' ? t('common:common.yes', { defaultValue: 'Evet' }) : t('common:common.no', { defaultValue: 'Hayır' })}</div>
                </div>
                <div className="min-w-48 rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">{t('table.orderDetail')}</div>
                  <div className="text-sm font-bold">{selectedOrder.orderDetail ?? '-'}</div>
                </div>
                <div className="min-w-48 space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">{t('policy.allocation')}</div>
                  <Select value={allocationPolicy} onValueChange={setAllocationPolicy} disabled={!permission.canUpdate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="StockBalanceAuto">{t('policy.StockBalanceAuto')}</SelectItem>
                      <SelectItem value="FullOrderOnly">{t('policy.FullOrderOnly')}</SelectItem>
                      <SelectItem value="ManualOnly">{t('policy.ManualOnly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-48 space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">{t('policy.shipment')}</div>
                  <Select value={shipmentPolicy} onValueChange={setShipmentPolicy} disabled={!permission.canUpdate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ManualShipment">{t('policy.ManualShipment')}</SelectItem>
                      <SelectItem value="AutoPartialShipment">{t('policy.AutoPartialShipment')}</SelectItem>
                      <SelectItem value="AutoFullShipment">{t('policy.AutoFullShipment')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" size="sm" disabled={!permission.canUpdate || policyMutation.isPending} onClick={() => policyMutation.mutate({ orderHeaderId: selectedOrder.id, input: { allocationPolicy, shipmentPolicy } })}>
                  {t('actions.savePolicy')}
                </Button>
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl border p-3">
            <h3 className="mb-2 text-sm font-semibold">{t('detail.lines')}</h3>
            <div className="flex flex-wrap gap-2">
              {plans.map((plan) => (
                <Button key={plan.id} type="button" size="sm" variant={selectedPlan?.id === plan.id ? 'default' : 'outline'} onClick={() => { setSelectedPlan(plan); setSelectedBatch(null); }}>
                  {plan.stockCode ?? t('detail.stock')} / {t('need.required')}: {formatQty(Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty))} / {t('need.available')}: {formatQty(plan.warehouseAvailableQty)}
                </Button>
              ))}
              {!plansQuery.isLoading && plans.length === 0 ? <span className="text-sm text-muted-foreground">{t('detail.noLines')}</span> : null}
            </div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t('activity.title')}</h3>
                <p className="text-xs text-muted-foreground">{t('activity.description')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-xl">{t('activity.datCount', { count: activitySummary.datCount })}</Badge>
                <Badge variant="secondary" className="rounded-xl">{t('activity.shipmentCount', { count: activitySummary.shipmentCount })}</Badge>
                <Badge variant="secondary" className="rounded-xl">{t('activity.completedCount', { count: activitySummary.completedCount })}</Badge>
              </div>
            </div>
            {activitiesQuery.isLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t('loading')}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground">
                <FileClock className="size-4" />
                {t('activity.empty')}
              </div>
            ) : (
              <div className="max-h-72 overflow-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('activity.step')}</TableHead>
                      <TableHead>{t('activity.document')}</TableHead>
                      <TableHead>{t('activity.erp')}</TableHead>
                      <TableHead>{t('activity.actor')}</TableHead>
                      <TableHead>{t('activity.collectors')}</TableHead>
                      <TableHead className="text-right">{t('detail.quantity')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <ActivityRow key={`${activity.batchId}-${activity.sequenceNo}-${activity.sourceHeaderId ?? 0}`} activity={activity} statusLabel={statusLabel} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.batch')}</TableHead>
                    <TableHead className="text-right">{t('detail.quantity')}</TableHead>
                    <TableHead>{t('detail.stage')}</TableHead>
                    <TableHead>WT/SH</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(batchesQuery.data ?? []).map((batch) => (
                    <TableRow key={batch.id} className="cursor-pointer" onClick={() => setSelectedBatch(batch)}>
                      <TableCell className="font-semibold">{batch.batchNo}</TableCell>
                      <TableCell className="text-right">{formatQty(batch.quantity)}</TableCell>
                      <TableCell>{statusBadge(batch.currentStage, statusLabel(batch.currentStage))}</TableCell>
                      <TableCell className="text-xs">
                        DAT1 #{batch.transferToHakEdisHeaderId ?? '-'} / DAT2 #{batch.returnFromHakEdisHeaderId ?? '-'} / SH #{batch.shipmentHeaderId ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(batchesQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t('detail.noBatches')}</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold">{t('detail.steps')}</h3>
                {selectedBatch ? (
                  <div className="flex flex-wrap gap-2">
                    <BatchActionButton batch={selectedBatch} action="create-transfer-to-hakedis" label={t('actions.createDat')} pending={batchActionMutation.isPending} allowed={permission.canUpdate} run={(action) => batchActionMutation.mutate({ batchId: selectedBatch.id, action })} />
                    <BatchActionButton batch={selectedBatch} action="mark-at-hakedis" label={t('actions.atHakEdis')} pending={batchActionMutation.isPending} allowed={permission.canUpdate} run={(action) => batchActionMutation.mutate({ batchId: selectedBatch.id, action })} />
                    <BatchActionButton batch={selectedBatch} action="create-return-transfer" label={t('actions.createReturnDat')} pending={batchActionMutation.isPending} allowed={permission.canUpdate} run={(action) => batchActionMutation.mutate({ batchId: selectedBatch.id, action })} />
                    <BatchActionButton batch={selectedBatch} action="mark-ready-for-shipment" label={t('actions.markReady')} pending={batchActionMutation.isPending} allowed={permission.canUpdate} run={(action) => batchActionMutation.mutate({ batchId: selectedBatch.id, action })} />
                    <BatchActionButton batch={selectedBatch} action="create-shipment" label={t('actions.createShipment')} pending={batchActionMutation.isPending} allowed={permission.canUpdate} run={(action) => batchActionMutation.mutate({ batchId: selectedBatch.id, action })} />
                  </div>
                ) : null}
              </div>
              {selectedBatch == null ? (
                <p className="text-sm text-muted-foreground">{t('detail.chooseBatch')}</p>
              ) : stepsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t('loading')}</div>
              ) : (
                <div className="space-y-3">
                  {(stepsQuery.data ?? []).map((step) => (
                    <div key={step.id} className="rounded-2xl border bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{step.sequenceNo}. {step.stepType}</span>
                        {statusBadge(step.status, statusLabel(step.status))}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatQty(step.quantity)} {t('common:common.unit', { defaultValue: 'Stk.' })} / {step.sourceType ?? '-'} #{step.sourceHeaderId ?? '-'}
                      </div>
                      {step.note ? <div className="mt-2 text-xs">{step.note}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BatchActionButton({ batch, action, label, pending, allowed, run }: { batch: BilginogluHakEdisBatch; action: string; label: string; pending: boolean; allowed: boolean; run: (action: string) => void }): ReactElement {
  const disabled = !allowed || pending
    || (action === 'create-transfer-to-hakedis' && Boolean(batch.transferToHakEdisHeaderId))
    || (action === 'create-return-transfer' && (!batch.transferToHakEdisHeaderId || Boolean(batch.returnFromHakEdisHeaderId)))
    || (action === 'create-shipment' && (batch.currentStage !== 'ReadyForShipment' || Boolean(batch.shipmentHeaderId)));

  return (
    <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={disabled} onClick={() => run(action)}>
      {label}
    </Button>
  );
}

function ActivityRow({ activity, statusLabel }: { activity: BilginogluHakEdisOrderActivity; statusLabel: (status: string) => string }): ReactElement {
  const { t } = useTranslation('bilginoglu-hakedis');
  const documentText = activity.documentNo
    ? `${activity.sourceType ?? '-'} #${activity.sourceHeaderId ?? '-'} / ${activity.documentNo}`
    : `${activity.sourceType ?? '-'} #${activity.sourceHeaderId ?? '-'}`;
  const erpText = activity.erpReferenceNumber
    ? `${activity.erpIntegrationStatus ?? '-'} / ${activity.erpReferenceNumber}`
    : activity.erpIntegrationStatus ?? (activity.isErpIntegrated ? t('activity.erpIntegrated') : '-');

  return (
    <TableRow>
      <TableCell>
        <div className="font-semibold">{activity.sequenceNo}. {statusLabel(activity.stepType)}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{activity.batchNo}</span>
          {statusBadge(activity.status, statusLabel(activity.status))}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{documentText}</div>
        <div className="text-xs text-muted-foreground">
          {t('activity.series')}: {activity.documentSeries ?? '-'} / {t('activity.type')}: {activity.documentType ?? '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{erpText}</div>
        <div className="text-xs text-muted-foreground">{formatDate(activity.erpIntegrationDate)}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{activity.actionByUserName ?? '-'}</div>
        <div className="text-xs text-muted-foreground">{formatDate(activity.actionDate ?? activity.completionDate)}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{activity.collectedByUsers ?? '-'}</div>
        <div className="text-xs text-muted-foreground">{t('activity.collectorCount', { count: activity.collectedUserCount })}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className="font-semibold">{formatQty(activity.quantity)}</div>
        <div className="text-xs text-muted-foreground">{activity.stockCode ?? '-'}</div>
      </TableCell>
    </TableRow>
  );
}

function NeedCard({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'cyan' | 'emerald' | 'blue' | 'amber' }): ReactElement {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-800',
    cyan: 'bg-cyan-50 text-cyan-800',
    emerald: 'bg-emerald-50 text-emerald-800',
    blue: 'bg-blue-50 text-blue-800',
    amber: 'bg-amber-50 text-amber-800',
  }[tone];

  return (
    <div className={`rounded-2xl border border-white/70 p-3 shadow-sm ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactElement; label: string; value: string }): ReactElement {
  return (
    <Card className="rounded-3xl border-slate-200">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">{icon}</div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-black">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
