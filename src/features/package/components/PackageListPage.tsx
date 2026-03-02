import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { usePHeaders } from '../hooks/usePHeaders';
import { useDeletePHeader } from '../hooks/useDeletePHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { toast } from 'sonner';
import type { PHeaderDto } from '../types/package';
import type { PagedFilter } from '@/types/api';


const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200';
    case 'Packing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-200';
    case 'Packed':
      return 'bg-green-100 text-green-800 dark:bg-green-500/25 dark:text-green-200';
    case 'Shipped':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-500/25 dark:text-red-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200';
  }
};

export function PackageListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('Id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<PHeaderDto | null>(null);

  const filters: PagedFilter[] = useMemo(() => {
    const result: PagedFilter[] = [];
    if (searchTerm) {
      result.push({ column: 'packingNo', operator: 'contains', value: searchTerm });
    }
    return result;
  }, [searchTerm]);

  const { data, isLoading, error } = usePHeaders({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  });

  const deleteMutation = useDeletePHeader();

  useEffect(() => {
    setPageTitle(t('package.list.title', 'Paketleme Listesi'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const handleSort = (column: string): void => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handlePreviousPage = (): void => {
    if (data?.hasPreviousPage) {
      setPageNumber((prev) => prev - 1);
    }
  };

  const handleNextPage = (): void => {
    if (data?.hasNextPage) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedHeader) return;

    try {
      await deleteMutation.mutateAsync(selectedHeader.id);
      toast.success(t('package.list.deleteSuccess', 'Paketleme başarıyla silindi'));
      setDeleteDialogOpen(false);
      setSelectedHeader(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.list.deleteError', 'Paketleme silinirken bir hata oluştu')
      );
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{t('package.list.error', 'Veri yüklenirken bir hata oluştu')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t('package.list.title', 'Paketleme Listesi')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('package.list.searchPlaceholder', 'Paketleme No, Cari Kodu...')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageNumber(1);
                  }}
                  className="pl-8 pr-10 w-full md:w-64"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <VoiceSearchButton
                    onResult={(text) => {
                      setSearchTerm(text);
                      setPageNumber(1);
                    }}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
              <Button onClick={() => navigate('/package/create')}>
                <Plus className="size-4 mr-2" />
                {t('package.list.createNew', 'Yeni Paketleme')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('Id')}
                  >
                    {t('package.list.id', 'Kayıt No')}
                    {sortBy === 'Id' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('packingNo')}
                  >
                    {t('package.list.packingNo', 'Paketleme No')}
                    {sortBy === 'packingNo' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('packingDate')}
                  >
                    {t('package.list.packingDate', 'Paketleme Tarihi')}
                    {sortBy === 'packingDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead>{t('package.list.warehouseCode', 'Depo Kodu')}</TableHead>
                  <TableHead>{t('package.list.sourceType', 'Kaynak Tipi')}</TableHead>
                  <TableHead>{t('package.list.matchedSource', 'Eşleşen Kaynak')}</TableHead>
                  <TableHead>{t('package.list.customerCode', 'Cari Kodu')}</TableHead>
                  <TableHead>{t('package.list.customerName', 'Cari Adı')}</TableHead>
                  <TableHead>{t('package.list.status', 'Durum')}</TableHead>
                  <TableHead>{t('package.list.totalPackageCount', 'Toplam Paket')}</TableHead>
                  <TableHead>{t('package.list.totalQuantity', 'Toplam Miktar')}</TableHead>
                  <TableHead>{t('package.list.totalGrossWeight', 'Toplam Brüt Ağırlık')}</TableHead>
                  <TableHead>{t('package.list.trackingNo', 'Takip No')}</TableHead>
                  <TableHead>{t('package.list.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item: PHeaderDto) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">#{item.id}</TableCell>
                      <TableCell className="font-medium">{item.packingNo || '-'}</TableCell>
                      <TableCell>{formatDate(item.packingDate)}</TableCell>
                      <TableCell>{item.warehouseCode || '-'}</TableCell>
                      <TableCell>
                        {item.sourceType ? (
                          <Badge variant="outline">
                            {t(`package.sourceType.${item.sourceType.toUpperCase()}`, item.sourceType.toUpperCase())}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.sourceHeaderId ? (
                          <span className="font-medium">#{item.sourceHeaderId}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{item.customerCode || '-'}</TableCell>
                      <TableCell>{item.customerName || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(item.status)}>
                          {t(`package.status.${item.status.toLowerCase()}`, item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.totalPackageCount || 0}</TableCell>
                      <TableCell>{item.totalQuantity || 0}</TableCell>
                      <TableCell>{item.totalGrossWeight || 0}</TableCell>
                      <TableCell>{item.trackingNo || '-'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/package/detail/${item.id}`)}
                          >
                            <Eye className="size-4 mr-2" />
                            {t('package.list.detail', 'Detay')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedHeader(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('package.list.noData', 'Veri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4 pb-1">
            {data?.data && data.data.length > 0 ? (
              data.data.map((item: PHeaderDto) => (
                <Card key={item.id} className="border border-slate-200/70 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">#{item.id} - {item.packingNo || '-'}</p>
                        <Badge className={getStatusBadgeColor(item.status)}>
                          {t(`package.status.${item.status.toLowerCase()}`, item.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.packingDate', 'Paketleme Tarihi')}
                        </p>
                        <p className="text-base">{formatDate(item.packingDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.warehouseCode', 'Depo Kodu')}
                        </p>
                        <p className="text-base">{item.warehouseCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.sourceType', 'Kaynak Tipi')}
                        </p>
                        <p className="text-base">
                          {item.sourceType ? (
                            <Badge variant="outline" className="text-xs">
                              {t(`package.sourceType.${item.sourceType.toUpperCase()}`, item.sourceType)}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.matchedSource', 'Eşleşen Kaynak')}
                        </p>
                        <p className="text-base">
                          {item.sourceHeaderId ? `#${item.sourceHeaderId}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.customerCode', 'Cari Kodu')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.customerName', 'Cari Adı')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.totalPackageCount', 'Toplam Paket')}
                        </p>
                        <p className="text-base">{item.totalPackageCount || 0}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/package/detail/${item.id}`)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('package.list.detail', 'Detay')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedHeader(item);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('package.list.noData', 'Veri bulunamadı')}
                </p>
              </div>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div className="text-sm text-muted-foreground">
                {t('package.list.pageInfo', 'Sayfa {{current}} / {{total}}', {
                  current: data.pageNumber,
                  total: data.totalPages,
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!data.hasPreviousPage}
                >
                  <ChevronLeft className="size-4" />
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!data.hasNextPage}
                >
                  {t('common.next')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('package.list.deleteConfirm', 'Paketlemeyi Sil')}</DialogTitle>
            <DialogDescription>
              {t('package.list.deleteConfirmMessage', 'Bu paketlemeyi silmek istediğinizden emin misiniz?')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
