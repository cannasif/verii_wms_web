import { type ReactElement, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { productionTransferApi } from '../api/production-transfer-api';

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
      return t?.('productionTransfer.create.guide.materialSupply', { defaultValue: 'Malzeme Besleme' }) ?? 'Malzeme Besleme';
    case 'SemiFinishedMove':
      return t?.('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Yari Mamul Tasima' }) ?? 'Yari Mamul Tasima';
    case 'FinishedGoodsPutaway':
      return t?.('productionTransfer.create.guide.outputMove', { defaultValue: 'Mamul Depoya Cikis' }) ?? 'Mamul Depoya Cikis';
    case 'ScrapMove':
      return t?.('productionTransfer.create.guide.scrapMove', { defaultValue: 'Fire Tasima' }) ?? 'Fire Tasima';
    case 'ReturnToStock':
      return t?.('productionTransfer.create.guide.returnToStock', { defaultValue: 'Stoga Iade' }) ?? 'Stoga Iade';
    default:
      return value || '-';
  }
}

function lineRoleLabel(value?: string | null, t?: (key: string, options?: Record<string, unknown>) => string): string {
  switch (value) {
    case 'ConsumptionSupply':
      return t?.('productionTransfer.create.lineRoleConsumption', { defaultValue: 'Tuketimi Besle' }) ?? 'Tuketimi Besle';
    case 'SemiFinishedMove':
      return t?.('productionTransfer.create.lineRoleSemiFinished', { defaultValue: 'Ara Mamul Tasi' }) ?? 'Ara Mamul Tasi';
    case 'OutputMove':
      return t?.('productionTransfer.create.lineRoleOutput', { defaultValue: 'Ciktiyi Tasi' }) ?? 'Ciktiyi Tasi';
    default:
      return value || '-';
  }
}

function InfoCallout({ title, body }: { title: string; body: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <div className="font-medium text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-1 leading-6">{body}</div>
    </div>
  );
}

export function ProductionTransferDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const detailId = Number(id ?? '');
  const permissionAccess = usePermissionAccess();
  const canUpdateTransfer = permissionAccess.can('wms.production-transfer.update');
  const canCreateTransfer = permissionAccess.can('wms.production-transfer.create');
  const canDeleteTransfer = permissionAccess.can('wms.production-transfer.delete');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle(t('productionTransfer.detail.title', { defaultValue: 'Uretim Transfer Detayi' }));
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

  return (
    <FormPageShell
      title={t('productionTransfer.detail.title', { defaultValue: 'Uretim Transfer Detayi' })}
      description={t('productionTransfer.detail.subtitle', { defaultValue: 'Transferin baglandigi uretim plani, amaci ve kalemlerini tek ekranda izleyin.' })}
      isLoading={detailQuery.isLoading}
      isError={detailQuery.isError}
      errorTitle={t('common.error')}
      errorDescription={detailQuery.error instanceof Error ? detailQuery.error.message : t('productionTransfer.detail.error', { defaultValue: 'Uretim transfer detayi yuklenemedi' })}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/production-transfer/list')}>
            {t('common.back')}
          </Button>
          {detailQuery.data ? (
            <>
              {canDeleteCurrentTransfer ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  {t('common.delete', { defaultValue: 'Sil' })}
                </Button>
              ) : null}
              {canCreateTransfer ? (
                <Button type="button" variant="outline" onClick={() => navigate(`/production-transfer/create?cloneId=${detailQuery.data.id}`)}>
                  {t('productionTransfer.list.cloneTransfer', { defaultValue: 'Kopyala' })}
                </Button>
              ) : null}
              {canUpdateTransfer ? (
                <Button type="button" onClick={() => navigate(`/production-transfer/create?editId=${detailQuery.data.id}`)} disabled={detailQuery.data.isCompleted}>
                  {t('productionTransfer.list.editTransfer', { defaultValue: 'Duzenle' })}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    >
      {detailQuery.data ? (
        <div className="space-y-6">
          <InfoCallout
            title={t('productionTransfer.detail.statusInfoTitle', { defaultValue: 'Durum ve izin bilgisi' })}
            body={
              !canUpdateTransfer
                ? t('productionTransfer.detail.statusInfoNoUpdate')
                : !detailQuery.data.canDelete
                  ? (detailQuery.data.deleteBlockedReason || t('productionTransfer.detail.statusInfoLocked', { defaultValue: 'Bu transfer tamamlanmış durumda. Güvenlik için yalnızca izlenebilir; değişiklik yapmak yerine kopyalayıp yeni transfer açabilirsiniz.' }))
                  : t('productionTransfer.detail.statusInfoOpen', { defaultValue: 'Bu transfer henüz açık durumda. Sahada işlem görmediyse düzenleme ekranına geçip güncelleyebilirsiniz.' })
            }
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>{t('common.documentNo')}</CardDescription>
                <CardTitle className="text-xl">{detailQuery.data.documentNo || '-'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('common.documentDate')}</CardDescription>
                <CardTitle className="text-xl">{formatDate(detailQuery.data.documentDate)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('productionTransfer.create.purpose', { defaultValue: 'Transfer Amaci' })}</CardDescription>
                <CardTitle className="text-xl">{transferPurposeLabel(detailQuery.data.transferPurpose, t)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('common.status')}</CardDescription>
                <CardTitle className="text-xl">
                  <Badge variant="secondary">
                    {detailQuery.data.isCompleted
                      ? t('productionTransfer.detail.completed', { defaultValue: 'Tamamlandi' })
                      : t('productionTransfer.detail.open', { defaultValue: 'Acik' })}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{t('productionTransfer.detail.linkTitle', { defaultValue: 'Uretim Baglantisi' })}</CardTitle>
                <CardDescription>{t('productionTransfer.detail.linkSubtitle', { defaultValue: 'Bu transferin hangi plan veya emir ihtiyacina bagli oldugunu gorun.' })}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('productionTransfer.create.productionDocument', { defaultValue: 'Uretim Plani No' })}</div>
                  <div className="mt-1 text-sm font-medium">{detailQuery.data.productionDocumentNo || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('productionTransfer.create.productionOrder', { defaultValue: 'Uretim Emri No' })}</div>
                  <div className="mt-1 text-sm font-medium">{detailQuery.data.productionOrderNo || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.sourceWarehouse', { defaultValue: 'Kaynak Depo' })}</div>
                  <div className="mt-1 text-sm font-medium">{detailQuery.data.sourceWarehouseCode || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('production.create.targetWarehouse', { defaultValue: 'Hedef Depo' })}</div>
                  <div className="mt-1 text-sm font-medium">{detailQuery.data.targetWarehouseCode || '-'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('productionTransfer.detail.descriptionTitle', { defaultValue: 'Aciklama' })}</CardTitle>
                <CardDescription>{t('productionTransfer.detail.descriptionSubtitle', { defaultValue: 'Transferi acan ekibin notu veya is aciklamasi.' })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {detailQuery.data.description?.trim() || t('productionTransfer.detail.noDescription', { defaultValue: 'Aciklama girilmemis.' })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('productionTransfer.detail.linesTitle', { defaultValue: 'Transfer Kalemleri' })}</CardTitle>
              <CardDescription>{t('productionTransfer.detail.linesSubtitle', { defaultValue: 'Hangi stoklarin hangi amacla tasindigini satir bazinda inceleyin.' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {detailQuery.data.lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200/70 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {t('productionTransfer.detail.noLines', { defaultValue: 'Bu transfer icin kayitli kalem bulunmuyor.' })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('productionTransfer.create.productionOrder', { defaultValue: 'Uretim Emri' })}</TableHead>
                      <TableHead>{t('production.create.producedStockCode', { defaultValue: 'Stok' })}</TableHead>
                      <TableHead>{t('productionTransfer.create.lineRole', { defaultValue: 'Kalem Rolu' })}</TableHead>
                      <TableHead>{t('production.create.plannedQuantity', { defaultValue: 'Miktar' })}</TableHead>
                      <TableHead>{t('productionTransfer.create.sourceCell', { defaultValue: 'Kaynak Hucre' })}</TableHead>
                      <TableHead>{t('productionTransfer.create.targetCell', { defaultValue: 'Hedef Hucre' })}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailQuery.data.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.productionOrderNo || '-'}</TableCell>
                        <TableCell>{line.stockCode}{line.yapKod ? ` / ${line.yapKod}` : ''}</TableCell>
                        <TableCell>{lineRoleLabel(line.lineRole, t)}</TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>{line.sourceCellCode || '-'}</TableCell>
                        <TableCell>{line.targetCellCode || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('productionTransfer.list.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('productionTransfer.list.deleteDescription', {
                documentNo: detailQuery.data?.documentNo ?? '-',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              {t('common.cancel', { defaultValue: 'Vazgec' })}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!detailQuery.data?.id) return;
                deleteMutation.mutate(detailQuery.data.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.loading', { defaultValue: 'Yukleniyor...' }) : t('common.delete', { defaultValue: 'Sil' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageShell>
  );
}
