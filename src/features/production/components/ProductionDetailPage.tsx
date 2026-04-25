import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { productionApi } from '../api/production-api';
import { productionTransferApi } from '@/features/production-transfer/api/production-transfer-api';

function InfoCallout({ title, body }: { title: string; body: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <div className="font-medium text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-1 leading-6">{body}</div>
    </div>
  );
}

export function ProductionDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const headerId = Number(id);
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const canUpdateProduction = permissionAccess.can('wms.production.update');
  const canDeleteProduction = permissionAccess.can('wms.production.delete');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle(t('production.detail.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const detailQuery = useQuery({
    queryKey: ['productionHeaderDetailView', headerId],
    queryFn: () => productionApi.getHeaderDetail(headerId),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  const transfersQuery = useQuery({
    queryKey: ['productionTransferLinks', headerId],
    queryFn: () =>
      productionTransferApi.getHeadersPaged({
        pageNumber: 0,
        pageSize: 50,
        sortBy: 'Id',
        sortDirection: 'desc',
        filters: [{ column: 'ProductionHeaderId', operator: 'eq', value: String(headerId) }],
      }),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  const orderTransferMap = useMemo(() => {
    const transfers = transfersQuery.data?.data ?? [];
    const grouped = new Map<number, typeof transfers>();

    for (const transfer of transfers) {
      if (!transfer.productionOrderId) {
        continue;
      }

      const current = grouped.get(transfer.productionOrderId) ?? [];
      current.push(transfer);
      grouped.set(transfer.productionOrderId, current);
    }

    return grouped;
  }, [transfersQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (idToDelete: number) => productionApi.softDeleteProductionPlan(idToDelete),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || t('production.list.deleteError'));
      }

      toast.success(t('production.list.deleteSuccess'));
      setDeleteDialogOpen(false);
      navigate('/production/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('production.list.deleteError'));
    },
  });

  const canDeleteCurrentPlan = canDeleteProduction && Boolean(detailQuery.data?.header.canDelete);

  return (
    <FormPageShell
      title={t('production.detail.title', { defaultValue: 'Missing translation' })}
      description={t('production.detail.subtitle', { defaultValue: 'Missing translation' })}
      actions={(
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/production/list')}>{t('common.back', { defaultValue: 'Missing translation' })}</Button>
          {canDeleteCurrentPlan ? (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              {t('common.delete', { defaultValue: 'Missing translation' })}
            </Button>
          ) : null}
          {headerId > 0 ? (
            <Button onClick={() => navigate(`/production/process/${headerId}`)}>{t('production.detail.openProcess', { defaultValue: 'Missing translation' })}</Button>
          ) : null}
        </div>
      )}
      isLoading={detailQuery.isLoading || transfersQuery.isLoading}
      isError={detailQuery.isError}
      errorTitle={t('common.error', { defaultValue: 'Missing translation' })}
      errorDescription={detailQuery.error instanceof Error ? detailQuery.error.message : t('production.detail.error', { defaultValue: 'Missing translation' })}
    >
      {detailQuery.data ? (
        <div className="space-y-6">
          <InfoCallout
            title={t('production.detail.statusInfoTitle', { defaultValue: 'Missing translation' })}
            body={
              !canUpdateProduction
                ? t('production.detail.statusInfoNoUpdate')
                : detailQuery.data.header.canDelete
                  ? t('production.detail.statusInfoDraft', { defaultValue: 'Missing translation' })
                : (detailQuery.data.header.deleteBlockedReason || t('production.detail.statusInfoLocked', { defaultValue: 'Missing translation' }))
            }
          />
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardDescription>{t('common.documentNo')}</CardDescription><CardTitle>{detailQuery.data.header.documentNo}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{t('common.status', { defaultValue: 'Missing translation' })}</CardDescription><CardTitle>{detailQuery.data.header.status || '-'}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{t('production.create.executionMode', { defaultValue: 'Missing translation' })}</CardDescription><CardTitle>{detailQuery.data.header.executionMode || '-'}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{t('production.create.mainStockCode', { defaultValue: 'Missing translation' })}</CardDescription><CardTitle>{detailQuery.data.header.mainStockCode || '-'}</CardTitle></CardHeader></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('production.detail.headerAssignments', { defaultValue: 'Missing translation' })}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {detailQuery.data.headerAssignments.length === 0 ? <span className="text-sm text-slate-500">-</span> : null}
              {detailQuery.data.headerAssignments.map((assignment) => (
                <Badge key={assignment.id} variant="secondary">
                  {assignment.assignmentType} / U:{assignment.assignedUserId ?? '-'} / R:{assignment.assignedRoleId ?? '-'}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('production.detail.orders', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.detail.ordersSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('production.detail.columns.order')}</TableHead>
                    <TableHead>{t('production.detail.columns.stock')}</TableHead>
                    <TableHead>{t('production.detail.columns.planned')}</TableHead>
                    <TableHead>{t('production.detail.columns.actual')}</TableHead>
                    <TableHead>{t('production.detail.columns.status')}</TableHead>
                    <TableHead>{t('production.detail.columns.assignment')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailQuery.data.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNo}</TableCell>
                      <TableCell>{order.producedStockCode}</TableCell>
                      <TableCell>{order.plannedQuantity}</TableCell>
                      <TableCell>{order.completedQuantity ?? 0}</TableCell>
                      <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {order.assignments.length === 0 ? <span>-</span> : null}
                          {order.assignments.map((assignment) => (
                            <Badge key={assignment.id} variant="outline">{assignment.assignmentType} / U:{assignment.assignedUserId ?? '-'}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('production.detail.orderVariance', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.detail.orderVarianceSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailQuery.data.orders.map((order) => {
                const outputGap = order.outputs.reduce((total, row) => total + (row.plannedQuantity - (row.producedQuantity ?? 0)), 0);
                const consumptionGap = order.consumptions.reduce((total, row) => total + (row.plannedQuantity - (row.consumedQuantity ?? 0)), 0);

                return (
                  <div key={order.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{order.status}</Badge>
                      <span className="font-medium">{order.orderNo}</span>
                      <span className="text-sm text-slate-500">{order.producedStockCode}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={outputGap > 0 ? 'secondary' : 'default'}>{t('production.detail.outputGap', { value: outputGap })}</Badge>
                      <Badge variant={consumptionGap > 0 ? 'secondary' : 'default'}>{t('production.detail.consumptionGap', { value: consumptionGap })}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('production.detail.orderTransferBreakdown', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.detail.orderTransferBreakdownSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailQuery.data.orders.map((order) => {
                const linkedTransfers = orderTransferMap.get(order.id) ?? [];

                return (
                  <div key={order.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{order.status}</Badge>
                      <span className="font-medium">{order.orderNo}</span>
                      <span className="text-sm text-slate-500">{order.producedStockCode}</span>
                    </div>
                    {linkedTransfers.length === 0 ? (
                      <div className="mt-3 text-sm text-slate-500">{t('production.detail.noOrderTransfer')}</div>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/10">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('production.detail.transferColumns.document')}</TableHead>
                              <TableHead>{t('production.detail.transferColumns.purpose')}</TableHead>
                              <TableHead>{t('production.detail.transferColumns.source')}</TableHead>
                              <TableHead>{t('production.detail.transferColumns.target')}</TableHead>
                              <TableHead>{t('production.detail.transferColumns.status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {linkedTransfers.map((transfer) => (
                              <TableRow key={transfer.id}>
                                <TableCell className="font-medium">{transfer.documentNo}</TableCell>
                                <TableCell>{transfer.transferPurpose || '-'}</TableCell>
                                <TableCell>{transfer.sourceWarehouse || '-'}</TableCell>
                                <TableCell>{transfer.targetWarehouse || '-'}</TableCell>
                                <TableCell><Badge variant="outline">{transfer.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open')}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('production.detail.dependencies', { defaultValue: 'Missing translation' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('production.detail.dependencyColumns.predecessor')}</TableHead>
                      <TableHead>{t('production.detail.dependencyColumns.successor')}</TableHead>
                      <TableHead>{t('production.detail.dependencyColumns.type')}</TableHead>
                      <TableHead>{t('production.detail.dependencyColumns.rules')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailQuery.data.dependencies.map((dependency) => (
                      <TableRow key={dependency.id}>
                        <TableCell>{dependency.predecessorOrderNo}</TableCell>
                        <TableCell>{dependency.successorOrderNo}</TableCell>
                        <TableCell>{dependency.dependencyType}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dependency.requiredTransferCompleted ? <Badge variant="outline">{t('production.detail.badges.transfer')}</Badge> : null}
                            {dependency.requiredOutputAvailable ? <Badge variant="outline">{t('production.detail.badges.output')}</Badge> : null}
                            {dependency.lagMinutes > 0 ? <Badge variant="outline">{t('production.detail.badges.lag', { minutes: dependency.lagMinutes })}</Badge> : null}
                            {!dependency.requiredTransferCompleted && !dependency.requiredOutputAvailable && dependency.lagMinutes <= 0 ? <span>-</span> : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('production.detail.transferLinks', { defaultValue: 'Missing translation' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('production.detail.transferColumns.document')}</TableHead>
                      <TableHead>{t('production.detail.transferColumns.purpose')}</TableHead>
                      <TableHead>{t('production.detail.transferColumns.source')}</TableHead>
                      <TableHead>{t('production.detail.transferColumns.target')}</TableHead>
                      <TableHead>{t('production.detail.transferColumns.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(transfersQuery.data?.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-slate-500">{t('production.detail.noPlanTransfer')}</TableCell>
                      </TableRow>
                    ) : (
                      (transfersQuery.data?.data ?? []).map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">{transfer.documentNo}</TableCell>
                          <TableCell>{transfer.transferPurpose || '-'}</TableCell>
                          <TableCell>{transfer.sourceWarehouse || '-'}</TableCell>
                          <TableCell>{transfer.targetWarehouse || '-'}</TableCell>
                          <TableCell><Badge variant="secondary">{transfer.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open')}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('production.list.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('production.list.deleteDescription', {
                documentNo: detailQuery.data?.header.documentNo ?? '-',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              {t('common.cancel', { defaultValue: 'Missing translation' })}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!detailQuery.data?.header.id) return;
                deleteMutation.mutate(detailQuery.data.header.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.loading', { defaultValue: 'Missing translation' }) : t('common.delete', { defaultValue: 'Missing translation' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageShell>
  );
}
