import { type ReactElement, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpsActionButton, OpsListPageShell } from '@/components/shared';
import { useCollectedBarcodes } from '../hooks/useCollectedBarcodes';
import { useDeleteRoute } from '../hooks/useDeleteRoute';
import { ArrowLeft, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function CollectedBarcodesPage(): ReactElement {
  const { headerId } = useParams<{ headerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['transfer', 'common']);

  const headerIdNum = headerId ? parseInt(headerId, 10) : 0;
  const { data: collectedData, isLoading } = useCollectedBarcodes(headerIdNum);
  const deleteRouteMutation = useDeleteRoute();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{ routeId: number; packageNo: string | null } | null>(null);

  const handleDeleteClick = (routeId: number, packageNo: string | null): void => {
    setSelectedRoute({ routeId, packageNo });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = (): void => {
    if (!selectedRoute) return;

    deleteRouteMutation.mutate(selectedRoute.routeId, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(t('transfer.collection.deleteSuccess'));
          setDeleteDialogOpen(false);
          setSelectedRoute(null);
        } else {
          toast.error(response.message || t('transfer.collection.deleteError'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('transfer.collection.deleteError'));
      },
    });
  };

  const allCollectedBarcodes = useMemo(() => {
    if (!collectedData?.data) return [];

    return collectedData.data.flatMap((item) =>
      item.routes.map((route) => ({
        routeId: route.id,
        barcode: route.scannedBarcode,
        stockCode: item.importLine.stockCode,
        stockName: item.importLine.stockName,
        yapKod: item.importLine.yapKod,
        yapAcik: item.importLine.yapAcik,
        quantity: route.quantity,
        serialNo: route.serialNo,
        serialNo2: route.serialNo2,
        serialNo3: route.serialNo3,
        serialNo4: route.serialNo4,
        sourceCellCode: route.sourceCellCode,
        targetCellCode: route.targetCellCode,
        createdDate: route.createdDate,
        packageLineId: route.packageLineId,
        packageNo: route.packageNo,
        packageHeaderId: route.packageHeaderId,
      }))
    );
  }, [collectedData?.data]);

  return (
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('transfer.assignedList.title')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>#{headerIdNum}</span>
          </>
        }
        title={t('transfer.collection.viewCollected')}
        description={`${t('transfer.collection.totalCollected')} ${allCollectedBarcodes.length} ${t('transfer.collection.itemsCollected')}`}
        actions={(
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => navigate(`/transfer/collection/${headerId}`)}
          >
            <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
            {t('common.back')}
          </OpsActionButton>
        )}
      >
        {isLoading ? (
          <div className="wms-ops-panel-empty wms-ops-panel-empty--detail">
            <Loader2 className="size-7 animate-spin" aria-hidden />
            <p>{t('common.loading')}</p>
          </div>
        ) : allCollectedBarcodes.length > 0 ? (
          <div className="wms-ops-prelabel-lines">
            <div className="wms-ops-prelabel-lines__head">
              <div className="wms-ops-prelabel-panel__title text-[0.68rem]">
                {t('transfer.collection.viewCollected')}
              </div>
              <span className="wms-ops-code-badge">
                {allCollectedBarcodes.length} {t('transfer.collection.itemsCollected')}
              </span>
            </div>
            <div className="wms-ops-prelabel-lines__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('transfer.collection.barcode')}</th>
                    <th>{t('transfer.collection.stockCode')}</th>
                    <th>{t('transfer.collection.stockName')}</th>
                    <th>{t('transfer.collection.yapKod')}</th>
                    <th>{t('transfer.collection.yapAcik')}</th>
                    <th>{t('transfer.collection.serialNo')}</th>
                    <th>{t('transfer.collection.packageNo')}</th>
                    <th>{t('transfer.collection.packageHeaderId')}</th>
                    <th className="text-right">{t('transfer.collection.quantity')}</th>
                    <th className="text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allCollectedBarcodes.map((item) => (
                    <tr key={item.routeId}>
                      <td>
                        <Badge variant="outline" className="wms-ops-code-badge font-mono text-xs">
                          {item.barcode}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="secondary" className="wms-ops-code-badge text-xs">{item.stockCode}</Badge>
                      </td>
                      <td className="max-w-xs truncate">{item.stockName}</td>
                      <td>
                        {item.yapKod ? (
                          <Badge variant="outline" className="wms-ops-code-badge text-xs">
                            {item.yapKod}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="max-w-xs">
                        {item.yapAcik ? (
                          <span className="truncate text-xs text-muted-foreground" title={item.yapAcik}>
                            {item.yapAcik}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td>
                        {item.serialNo ? (
                          <Badge variant="outline" className="wms-ops-code-badge font-mono text-xs">
                            {item.serialNo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td>
                        {item.packageNo ? (
                          <Badge variant="default" className="wms-ops-status-badge text-xs">
                            {item.packageNo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td>
                        {item.packageHeaderId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="wms-ops-table-id-value">{item.packageHeaderId}</span>
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="!min-h-7 !px-2"
                              onClick={() => navigate(`/package/detail/${item.packageHeaderId}`)}
                              title={t('transfer.collection.viewPackage')}
                            >
                              <ExternalLink className="size-3" aria-hidden />
                            </OpsActionButton>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-right font-semibold">{item.quantity}</td>
                      <td className="text-right">
                        <OpsActionButton
                          type="button"
                          variant="secondary"
                          className="!min-h-8 !border-destructive/30 !text-destructive hover:!bg-destructive/10"
                          onClick={() => handleDeleteClick(item.routeId, item.packageNo)}
                          disabled={deleteRouteMutation.isPending}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </OpsActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="wms-ops-panel-empty wms-ops-panel-empty--detail">
            <p className="wms-ops-panel-empty__title">{t('transfer.collection.noCollectedBarcodes')}</p>
          </div>
        )}
      </OpsListPageShell>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="wms-ops-form wms-ops-detail-dialog max-w-md gap-0 overflow-hidden border-0 p-0 shadow-none">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">
              {t('transfer.collection.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {selectedRoute?.packageNo && selectedRoute.packageNo !== '-'
                ? t('transfer.collection.deleteConfirmWithPackage')
                : t('transfer.collection.deleteConfirmWithoutPackage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t px-6 py-4 sm:gap-2">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              className="!border-destructive/40 !bg-destructive hover:!bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteRouteMutation.isPending}
            >
              {deleteRouteMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              {t('common.delete')}
            </OpsActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
