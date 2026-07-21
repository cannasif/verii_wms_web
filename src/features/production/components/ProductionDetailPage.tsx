import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell, PageState } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { productionApi } from '../api/production-api';
import { productionTransferApi } from '@/features/production-transfer/api/production-transfer-api';
import {
  ProductionOpsBadge,
  ProductionOpsCallout,
  ProductionOpsSummaryStat,
} from './production-ops-ui';

const opsPanelCardClass = 'wms-ops-surface-card';

const opsCardTitleClass = 'wms-ops-surface-label';

function InfoCallout({ title, body }: { title: string; body: string }): ReactElement {
  return <ProductionOpsCallout title={title} body={body} />;
}

export function ProductionDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const headerId = Number(id);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.production');
  const canUpdateProduction = permission.canUpdate;
  const canDeleteProduction = permission.canDelete;
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
        pageNumber: 1,
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

  const isPageLoading = detailQuery.isLoading || transfersQuery.isLoading;
  const isPageError = detailQuery.isError;

  return (
    <>
      <OpsFormPageShell
        className="wms-ops-erp-skin wms-ops-production-page"
        eyebrow={
          <>
            <span>{t('production.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('production.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('production.detail.title', { defaultValue: 'Missing translation' })}</span>
          </>
        }
        title={t('production.detail.title', { defaultValue: 'Missing translation' })}
        description={t('production.detail.subtitle', { defaultValue: 'Missing translation' })}
        actions={(
          <div className="wms-ops-actions flex flex-wrap gap-2">
            <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/production/list')}>{t('common.back', { defaultValue: 'Missing translation' })}</OpsActionButton>
            {canDeleteCurrentPlan ? (
              <Button
                variant="destructive"
                className="wms-ops-surface-danger-btn"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
              >
                {t('common.delete', { defaultValue: 'Missing translation' })}
              </Button>
            ) : null}
            {headerId > 0 ? (
              <OpsActionButton type="button" onClick={() => navigate(`/production/process/${headerId}`)}>{t('production.detail.openProcess', { defaultValue: 'Missing translation' })}</OpsActionButton>
            ) : null}
          </div>
        )}
      >
        {isPageLoading ? (
          <PageState tone="loading" title={t('common.loading')} compact />
        ) : null}

        {isPageError ? (
          <PageState
            tone="error"
            title={t('common.error', { defaultValue: 'Missing translation' })}
            description={detailQuery.error instanceof Error ? detailQuery.error.message : t('production.detail.error', { defaultValue: 'Missing translation' })}
            compact
          />
        ) : null}

        {detailQuery.data && !isPageLoading && !isPageError ? (
        <div className="wms-ops-production-content space-y-6">
          {!permission.canMutate ? <PermissionNotice /> : null}
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
          <div className="wms-ops-stat-grid grid gap-2 md:grid-cols-4">
            <ProductionOpsSummaryStat label={t('common.documentNo')} value={detailQuery.data.header.documentNo} />
            <ProductionOpsSummaryStat label={t('common.status', { defaultValue: 'Missing translation' })} value={detailQuery.data.header.status || '-'} />
            <ProductionOpsSummaryStat label={t('production.create.executionMode', { defaultValue: 'Missing translation' })} value={detailQuery.data.header.executionMode || '-'} />
            <ProductionOpsSummaryStat label={t('production.create.mainStockCode', { defaultValue: 'Missing translation' })} value={detailQuery.data.header.mainStockCode || '-'} />
          </div>

          <Card className={opsPanelCardClass}>
            <CardHeader>
              <CardTitle className={opsCardTitleClass}>{t('production.detail.headerAssignments', { defaultValue: 'Missing translation' })}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {detailQuery.data.headerAssignments.length === 0 ? <span className="text-muted-foreground">-</span> : null}
              {detailQuery.data.headerAssignments.map((assignment) => (
                <ProductionOpsBadge key={assignment.id}>
                  {assignment.assignmentType} / U:{assignment.assignedUserId ?? '-'} / R:{assignment.assignedRoleId ?? '-'}
                </ProductionOpsBadge>
              ))}
            </CardContent>
          </Card>

          <Card className={opsPanelCardClass}>
            <CardHeader>
              <CardTitle className={opsCardTitleClass}>{t('production.detail.orders', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.detail.ordersSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="wms-ops-production-line-table wms-ops-production-line-table--compact">
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
                      <TableCell><ProductionOpsBadge>{order.status}</ProductionOpsBadge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {order.assignments.length === 0 ? <span>-</span> : null}
                          {order.assignments.map((assignment) => (
                            <ProductionOpsBadge key={assignment.id} tone="info">{assignment.assignmentType} / U:{assignment.assignedUserId ?? '-'}</ProductionOpsBadge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className={opsPanelCardClass}>
            <CardHeader>
              <CardTitle className={opsCardTitleClass}>{t('production.detail.orderVariance', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.detail.orderVarianceSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailQuery.data.orders.map((order) => {
                const outputGap = order.outputs.reduce((total, row) => total + (row.plannedQuantity - (row.producedQuantity ?? 0)), 0);
                const consumptionGap = order.consumptions.reduce((total, row) => total + (row.plannedQuantity - (row.consumedQuantity ?? 0)), 0);

                return (
                  <div key={order.id} className="wms-ops-production-panel p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductionOpsBadge>{order.status}</ProductionOpsBadge>
                      <span className="wms-ops-production-panel__title">{order.orderNo}</span>
                      <span className="text-muted-foreground">{order.producedStockCode}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ProductionOpsBadge tone={outputGap > 0 ? 'default' : 'active'}>{t('production.detail.outputGap', { value: outputGap })}</ProductionOpsBadge>
                      <ProductionOpsBadge tone={consumptionGap > 0 ? 'default' : 'active'}>{t('production.detail.consumptionGap', { value: consumptionGap })}</ProductionOpsBadge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className={opsPanelCardClass}>
            <CardHeader>
              <CardTitle className={opsCardTitleClass}>{t('production.detail.orderTransferBreakdown', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('production.detail.orderTransferBreakdownSubtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailQuery.data.orders.map((order) => {
                const linkedTransfers = orderTransferMap.get(order.id) ?? [];

                return (
                  <div key={order.id} className="wms-ops-production-panel p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductionOpsBadge>{order.status}</ProductionOpsBadge>
                      <span className="wms-ops-production-panel__title">{order.orderNo}</span>
                      <span className="text-muted-foreground">{order.producedStockCode}</span>
                    </div>
                    {linkedTransfers.length === 0 ? (
                      <div className="mt-3 text-muted-foreground">{t('production.detail.noOrderTransfer')}</div>
                    ) : (
                      <div className="mt-3 overflow-hidden wms-ops-production-panel">
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
                                <TableCell><ProductionOpsBadge tone="info">{transfer.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open')}</ProductionOpsBadge></TableCell>
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
            <Card className={opsPanelCardClass}>
              <CardHeader>
                <CardTitle className={opsCardTitleClass}>{t('production.detail.dependencies', { defaultValue: 'Missing translation' })}</CardTitle>
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
                            {dependency.requiredTransferCompleted ? <ProductionOpsBadge tone="info">{t('production.detail.badges.transfer')}</ProductionOpsBadge> : null}
                            {dependency.requiredOutputAvailable ? <ProductionOpsBadge tone="info">{t('production.detail.badges.output')}</ProductionOpsBadge> : null}
                            {dependency.lagMinutes > 0 ? <ProductionOpsBadge tone="info">{t('production.detail.badges.lag', { minutes: dependency.lagMinutes })}</ProductionOpsBadge> : null}
                            {!dependency.requiredTransferCompleted && !dependency.requiredOutputAvailable && dependency.lagMinutes <= 0 ? <span>-</span> : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className={opsPanelCardClass}>
              <CardHeader>
                <CardTitle className={opsCardTitleClass}>{t('production.detail.transferLinks', { defaultValue: 'Missing translation' })}</CardTitle>
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
                        <TableCell colSpan={5} className="text-muted-foreground">{t('production.detail.noPlanTransfer')}</TableCell>
                      </TableRow>
                    ) : (
                      (transfersQuery.data?.data ?? []).map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">{transfer.documentNo}</TableCell>
                          <TableCell>{transfer.transferPurpose || '-'}</TableCell>
                          <TableCell>{transfer.sourceWarehouse || '-'}</TableCell>
                          <TableCell>{transfer.targetWarehouse || '-'}</TableCell>
                          <TableCell><ProductionOpsBadge>{transfer.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open')}</ProductionOpsBadge></TableCell>
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
      </OpsFormPageShell>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        itemLabel={detailQuery.data?.header.documentNo || (headerId > 0 ? `#${headerId}` : undefined)}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (!detailQuery.data?.header.id) return;
          deleteMutation.mutate(detailQuery.data.header.id);
        }}
      />
    </>
  );
}
