import { type ReactElement, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCollectedBarcodes } from '../hooks/useCollectedBarcodes';
import { useDeleteRoute } from '../hooks/useDeleteRoute';
import { ArrowLeft, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function CollectedBarcodesPage(): ReactElement {
  const { headerId } = useParams<{ headerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const headerIdNum = headerId ? parseInt(headerId, 10) : 0;
  const { data: collectedData, isLoading } = useCollectedBarcodes(headerIdNum);
  const deleteRouteMutation = useDeleteRoute();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{ routeId: number; packageNo: string | null } | null>(null);

  const handleDeleteClick = (routeId: number, packageNo: string | null) => {
    setSelectedRoute({ routeId, packageNo });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRoute) return;

    deleteRouteMutation.mutate(selectedRoute.routeId, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(t('transfer.collection.deleteSuccess', 'Barkod başarıyla silindi'));
          setDeleteDialogOpen(false);
          setSelectedRoute(null);
        } else {
          toast.error(response.message || t('transfer.collection.deleteError', 'Barkod silinemedi'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('transfer.collection.deleteError', 'Barkod silinemedi'));
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
    <div className="flex flex-col h-[calc(100vh-10rem)] overflow-hidden">
      <div className="shrink-0 p-4 space-y-4 border-b bg-background">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/transfer/collection/${headerId}`)}>
            <ArrowLeft className="size-4 mr-2" />
            {t('common.back', 'Geri')}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t('transfer.collection.totalCollected', 'Toplam')} {allCollectedBarcodes.length} {t('transfer.collection.itemsCollected', 'adet ürün toplandı')}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : allCollectedBarcodes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('transfer.collection.barcode', 'Barkod')}</TableHead>
                      <TableHead>{t('transfer.collection.stockCode', 'Stok Kodu')}</TableHead>
                      <TableHead>{t('transfer.collection.stockName', 'Stok Adı')}</TableHead>
                      <TableHead>{t('transfer.collection.yapKod', 'Yapı Kodu')}</TableHead>
                      <TableHead>{t('transfer.collection.yapAcik', 'Yapı Açıklaması')}</TableHead>
                      <TableHead>{t('transfer.collection.serialNo', 'Seri No')}</TableHead>
                      <TableHead>{t('transfer.collection.packageNo', 'Paket No')}</TableHead>
                      <TableHead>{t('transfer.collection.packageHeaderId', 'Paket Kayıt No')}</TableHead>
                      <TableHead className="text-right">{t('transfer.collection.quantity', 'Miktar')}</TableHead>
                      <TableHead className="text-right">{t('common.actions', 'İşlemler')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCollectedBarcodes.map((item) => (
                      <TableRow key={item.routeId}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.barcode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{item.stockCode}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{item.stockName}</TableCell>
                        <TableCell>
                          {item.yapKod ? (
                            <Badge variant="outline" className="text-xs">
                              {item.yapKod}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {item.yapAcik ? (
                            <p className="text-xs text-muted-foreground truncate" title={item.yapAcik}>
                              {item.yapAcik}
                            </p>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.serialNo ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.serialNo}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.packageNo ? (
                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs">
                              {item.packageNo}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.packageHeaderId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-foreground">{item.packageHeaderId}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-accent"
                                onClick={() => navigate(`/package/detail/${item.packageHeaderId}`)}
                                title={t('transfer.collection.viewPackage', 'Paket detayını görüntüle')}
                              >
                                <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(item.routeId, item.packageNo)}
                            disabled={deleteRouteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {t('transfer.collection.noCollectedBarcodes', 'Henüz toplanan barkod bulunmuyor')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('transfer.collection.deleteConfirmTitle', 'Ürünü Sil')}</DialogTitle>
            <DialogDescription>
              {selectedRoute?.packageNo && selectedRoute.packageNo !== '-'
                ? t(
                    'transfer.collection.deleteConfirmWithPackage',
                    'Seçili ürün paketten de işlemden de kaldırılacaktır. Bu işlemi yapmak istediğinizden emin misiniz?'
                  )
                : t(
                    'transfer.collection.deleteConfirmWithoutPackage',
                    'Ürün toplamadan kaldırılacaktır. Bu işlemi yapmak istediğinizden emin misiniz?'
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel', 'İptal')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteRouteMutation.isPending}
            >
              {deleteRouteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('common.loading', 'Yükleniyor...')}
                </>
              ) : (
                t('common.delete', 'Sil')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
