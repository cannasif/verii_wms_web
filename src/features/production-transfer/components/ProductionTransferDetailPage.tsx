import { type ReactElement, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { OpsActionButton, OpsFormPageShell, PageState } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { productionTransferApi } from '../api/production-transfer-api';
import {
  PtDetailField,
  PtInfoCallout,
  PtSection,
  PtStatGrid,
} from './production-transfer-ops-ui';

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function transferPurposeLabel(value?: string | null, t?: (key: string, options?: Record<string, unknown>) => string): string {
  switch (value) {
    case 'MaterialSupply':
      return t?.('productionTransfer.create.guide.materialSupply', { defaultValue: 'Missing translation' }) ?? 'Malzeme Besleme';
    case 'SemiFinishedMove':
      return t?.('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Missing translation' }) ?? 'Yari Mamul Tasima';
    case 'FinishedGoodsPutaway':
      return t?.('productionTransfer.create.guide.outputMove', { defaultValue: 'Missing translation' }) ?? 'Mamul Depoya Cikis';
    case 'ScrapMove':
      return t?.('productionTransfer.create.guide.scrapMove', { defaultValue: 'Missing translation' }) ?? 'Fire Tasima';
    case 'ReturnToStock':
      return t?.('productionTransfer.create.guide.returnToStock', { defaultValue: 'Missing translation' }) ?? 'Stoga Iade';
    default:
      return value || '-';
  }
}

function lineRoleLabel(value?: string | null, t?: (key: string, options?: Record<string, unknown>) => string): string {
  switch (value) {
    case 'ConsumptionSupply':
      return t?.('productionTransfer.create.lineRoleConsumption', { defaultValue: 'Missing translation' }) ?? 'Tuketimi Besle';
    case 'SemiFinishedMove':
      return t?.('productionTransfer.create.lineRoleSemiFinished', { defaultValue: 'Missing translation' }) ?? 'Ara Mamul Tasi';
    case 'OutputMove':
      return t?.('productionTransfer.create.lineRoleOutput', { defaultValue: 'Missing translation' }) ?? 'Ciktiyi Tasi';
    default:
      return value || '-';
  }
}

export function ProductionTransferDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const detailId = Number(id ?? '');
  const permission = useCrudPermission('wms.production-transfer');
  const canUpdateTransfer = permission.canUpdate;
  const canCreateTransfer = permission.canCreate;
  const canDeleteTransfer = permission.canDelete;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle(t('productionTransfer.detail.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const detailQuery = useQuery({
    queryKey: ['production-transfer-detail-page', detailId],
    queryFn: () => productionTransferApi.getProductionTransferDetail(detailId),
    enabled: Number.isFinite(detailId) && detailId > 0,
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete: number) => productionTransferApi.softDeleteProductionTransfer(idToDelete),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || t('productionTransfer.list.deleteError'));
      }

      toast.success(t('productionTransfer.list.deleteSuccess'));
      setDeleteDialogOpen(false);
      navigate('/production-transfer/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('productionTransfer.list.deleteError'));
    },
  });

  const canDeleteCurrentTransfer = canDeleteTransfer && Boolean(detailQuery.data?.canDelete);
  const pageTitle = t('productionTransfer.detail.title', { defaultValue: 'Missing translation' });
  const pageDescription = t('productionTransfer.detail.subtitle', { defaultValue: 'Missing translation' });

  return (
    <>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('productionTransfer.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('productionTransfer.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('productionTransfer.list.openDetail', { defaultValue: 'Missing translation' })}</span>
          </>
        }
        title={pageTitle}
        description={pageDescription}
        actions={
          Number.isFinite(detailId) && detailId > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="wms-ops-code-badge">#{detailId}</span>
              {detailQuery.data?.documentNo ? (
                <span className="wms-ops-code-badge">{detailQuery.data.documentNo}</span>
              ) : null}
            </div>
          ) : null
        }
      >
        {detailQuery.isLoading ? (
          <PageState tone="loading" title={t('common.loading')} compact />
        ) : null}

        {detailQuery.isError ? (
          <PageState
            tone="error"
            title={t('common.error')}
            description={detailQuery.error instanceof Error ? detailQuery.error.message : t('productionTransfer.detail.error', { defaultValue: 'Missing translation' })}
            compact
          />
        ) : null}

        {detailQuery.data ? (
          <div className="space-y-6">
            {!permission.canMutate ? <PermissionNotice /> : null}
            <PtInfoCallout
              title={t('productionTransfer.detail.statusInfoTitle', { defaultValue: 'Missing translation' })}
              body={
                !canUpdateTransfer
                  ? t('productionTransfer.detail.statusInfoNoUpdate')
                  : !detailQuery.data.canDelete
                    ? (detailQuery.data.deleteBlockedReason || t('productionTransfer.detail.statusInfoLocked', { defaultValue: 'Missing translation' }))
                    : t('productionTransfer.detail.statusInfoOpen', { defaultValue: 'Missing translation' })
              }
            />

            <PtStatGrid
              className="sm:grid-cols-2 xl:grid-cols-4"
              items={[
                {
                  label: t('common.documentNo'),
                  value: detailQuery.data.documentNo || '-',
                },
                {
                  label: t('common.documentDate'),
                  value: formatDate(detailQuery.data.documentDate),
                },
                {
                  label: t('productionTransfer.create.purpose', { defaultValue: 'Missing translation' }),
                  value: transferPurposeLabel(detailQuery.data.transferPurpose, t),
                },
                {
                  label: t('common.status'),
                  value: (
                    <span className={`wms-ops-status-badge ${detailQuery.data.isCompleted ? 'wms-ops-status-badge--done' : 'wms-ops-status-badge--active'}`}>
                      {detailQuery.data.isCompleted
                        ? t('productionTransfer.detail.completed', { defaultValue: 'Missing translation' })
                        : t('productionTransfer.detail.open', { defaultValue: 'Missing translation' })}
                    </span>
                  ),
                },
              ]}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <PtSection
                title={t('productionTransfer.detail.linkTitle', { defaultValue: 'Missing translation' })}
                subtitle={t('productionTransfer.detail.linkSubtitle', { defaultValue: 'Missing translation' })}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <PtDetailField
                    label={t('productionTransfer.create.productionDocument', { defaultValue: 'Missing translation' })}
                    value={detailQuery.data.productionDocumentNo || '-'}
                  />
                  <PtDetailField
                    label={t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}
                    value={detailQuery.data.productionOrderNo || '-'}
                  />
                  <PtDetailField
                    label={t('production.create.sourceWarehouse', { defaultValue: 'Missing translation' })}
                    value={detailQuery.data.sourceWarehouseCode || '-'}
                  />
                  <PtDetailField
                    label={t('production.create.targetWarehouse', { defaultValue: 'Missing translation' })}
                    value={detailQuery.data.targetWarehouseCode || '-'}
                  />
                </div>
              </PtSection>

              <PtSection
                title={t('productionTransfer.detail.descriptionTitle', { defaultValue: 'Missing translation' })}
                subtitle={t('productionTransfer.detail.descriptionSubtitle', { defaultValue: 'Missing translation' })}
              >
                <div className="wms-ops-panel-empty wms-ops-panel-empty--inline wms-ops-panel-empty--callout border p-4 text-sm">
                  {detailQuery.data.description?.trim() || t('productionTransfer.detail.noDescription', { defaultValue: 'Missing translation' })}
                </div>
              </PtSection>
            </div>

            <PtSection
              title={t('productionTransfer.detail.linesTitle', { defaultValue: 'Missing translation' })}
              subtitle={t('productionTransfer.detail.linesSubtitle', { defaultValue: 'Missing translation' })}
            >
              {detailQuery.data.lines.length === 0 ? (
                <div className="wms-ops-panel-empty rounded-none border border-dashed p-6 text-sm">
                  {t('productionTransfer.detail.noLines', { defaultValue: 'Missing translation' })}
                </div>
              ) : (
                <div className="wms-ops-table-wrap overflow-hidden border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}</TableHead>
                        <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('production.create.producedStockCode', { defaultValue: 'Missing translation' })}</TableHead>
                        <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.lineRole', { defaultValue: 'Missing translation' })}</TableHead>
                        <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('production.create.plannedQuantity', { defaultValue: 'Missing translation' })}</TableHead>
                        <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.sourceCell', { defaultValue: 'Missing translation' })}</TableHead>
                        <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.targetCell', { defaultValue: 'Missing translation' })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailQuery.data.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.productionOrderNo || '-'}</TableCell>
                          <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.stockCode}{line.yapKod ? ` / ${line.yapKod}` : ''}</TableCell>
                          <TableCell className="wms-ops-table-center-col">
                            <span className="wms-ops-status-badge wms-ops-status-badge--active">{lineRoleLabel(line.lineRole, t)}</span>
                          </TableCell>
                          <TableCell className="wms-ops-table-center-col">{line.quantity}</TableCell>
                          <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.sourceCellCode || '-'}</TableCell>
                          <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.targetCellCode || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </PtSection>

            <div className="wms-ops-actions flex flex-wrap justify-between gap-4 border-t pt-6">
              <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/production-transfer/list')}>
                <ChevronLeft className="size-3.5" aria-hidden />
                {t('common.back')}
              </OpsActionButton>
              <div className="flex flex-wrap gap-2">
                {canDeleteCurrentTransfer ? (
                  <OpsActionButton
                    type="button"
                    variant="secondary"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteMutation.isPending}
                  >
                    {t('common.delete', { defaultValue: 'Missing translation' })}
                  </OpsActionButton>
                ) : null}
                {canCreateTransfer ? (
                  <OpsActionButton
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/production-transfer/create?cloneId=${detailQuery.data.id}`)}
                  >
                    {t('productionTransfer.list.cloneTransfer', { defaultValue: 'Missing translation' })}
                  </OpsActionButton>
                ) : null}
                {canUpdateTransfer ? (
                  <OpsActionButton
                    type="button"
                    variant="primary"
                    onClick={() => navigate(`/production-transfer/edit/${detailQuery.data.id}`)}
                    disabled={detailQuery.data.isCompleted}
                  >
                    {t('productionTransfer.list.editTransfer', { defaultValue: 'Missing translation' })}
                  </OpsActionButton>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </OpsFormPageShell>

      <DeleteConfirmDialog
        variant="ops"
        open={deleteDialogOpen}
        title={t('productionTransfer.list.deleteTitle')}
        description={t('productionTransfer.list.deleteDescription', {
          documentNo: detailQuery.data?.documentNo ?? '-',
        })}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (!detailQuery.data?.id) return;
          deleteMutation.mutate(detailQuery.data.id);
        }}
      />
    </>
  );
}
