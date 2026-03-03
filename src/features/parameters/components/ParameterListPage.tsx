import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { useParameters } from '../hooks/useParameters';
import { useDeleteParameter } from '../hooks/useDeleteParameter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PARAMETER_TYPES, type ParameterType } from '../types/parameter';
import type { Parameter } from '../types/parameter';
import { ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import type { GridExportColumn } from '@/lib/grid-export';

export function ParameterListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type } = useParams<{ type: ParameterType }>();
  const pageKey = `parameters-${type ?? 'unknown'}-list`;
  const { setPageTitle } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);
  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'id', label: t('parameters.list.id', 'ID') },
      { key: 'allowLessQuantityBasedOnOrder', label: t('parameters.list.allowLessQuantity', 'Emre İstinaden Az Miktar') },
      { key: 'allowMoreQuantityBasedOnOrder', label: t('parameters.list.allowMoreQuantity', 'Emre İstinaden Fazla Miktar') },
      { key: 'requireApprovalBeforeErp', label: t('parameters.list.requireApproval', 'ERP Öncesi Onay') },
      { key: 'requireAllOrderItemsCollected', label: t('parameters.list.requireAllOrderItemsCollected', 'Emirdeki Tüm Kalemlere Toplama Yapılmış Olmalı') },
      { key: 'createdDate', label: t('parameters.list.createdDate', 'Oluşturulma Tarihi') },
      { key: 'updatedDate', label: t('parameters.list.updatedDate', 'Güncelleme Tarihi') },
      { key: 'actions', label: t('parameters.list.actions', 'İşlemler') },
    ],
    [t]
  );
  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    setColumnOrder,
    setVisibleColumns,
  } = useColumnPreferences({
    pageKey,
    columns,
    idColumnKey: 'id',
  });

  const parameterType = type as ParameterType;
  const parameterConfig = PARAMETER_TYPES[parameterType];

  const { data, isLoading, error } = useParameters(parameterType);
  const deleteMutation = useDeleteParameter(parameterType);

  useEffect(() => {
    if (parameterConfig) {
      setPageTitle(t(`parameters.${parameterType}.title`, parameterConfig.name));
    }
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle, parameterType, parameterConfig]);

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;
    const searchLower = searchTerm.toLowerCase();
    return data.filter((item) => {
      return (
        item.id.toString().includes(searchLower) ||
        item.createdByFullUser?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const exportColumns = useMemo<GridExportColumn[]>(
    () =>
      orderedVisibleColumns
        .filter((key) => key !== 'actions')
        .map((key) => ({
          key,
          label: columns.find((column) => column.key === key)?.label ?? key,
        })),
    [columns, orderedVisibleColumns]
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!filteredData.length) return [];
    return filteredData.map((item) => ({
      id: item.id,
      allowLessQuantityBasedOnOrder: item.allowLessQuantityBasedOnOrder ? t('common.yes') : t('common.no'),
      allowMoreQuantityBasedOnOrder: item.allowMoreQuantityBasedOnOrder ? t('common.yes') : t('common.no'),
      requireApprovalBeforeErp: item.requireApprovalBeforeErp ? t('common.yes') : t('common.no'),
      requireAllOrderItemsCollected: item.requireAllOrderItemsCollected ? t('common.yes') : t('common.no'),
      createdDate: formatDateTime(item.createdDate),
      updatedDate: formatDateTime(item.updatedDate),
    }));
  }, [filteredData, t]);

  const handleDelete = async (): Promise<void> => {
    if (!selectedParameter) return;

    try {
      await deleteMutation.mutateAsync(selectedParameter.id);
      toast.success(t('parameters.delete.success', 'Parametre başarıyla silindi'));
      setDeleteDialogOpen(false);
      setSelectedParameter(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('parameters.delete.error', 'Parametre silinirken bir hata oluştu')
      );
    }
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
        <p className="text-destructive">
          {error instanceof Error
            ? error.message
            : t('parameters.list.error', 'Veri yüklenirken bir hata oluştu')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t(`parameters.${parameterType}.title`, parameterConfig.name)}</CardTitle>
            <div className="flex items-center gap-2">
              <GridExportMenu
                fileName={pageKey}
                columns={exportColumns}
                rows={exportRows}
              />
              <ColumnPreferencesPopover
                pageKey={pageKey}
                userId={userId}
                columns={columns}
                visibleColumns={visibleColumns}
                columnOrder={columnOrder}
                lockedKeys={['id']}
                onVisibleColumnsChange={setVisibleColumns}
                onColumnOrderChange={setColumnOrder}
              />
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('parameters.list.searchPlaceholder', 'Ara...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-10 w-full md:w-64"
                />
              </div>
              <Button
                onClick={() => navigate(`/parameters/${parameterType}/create`)}
                className="gap-2"
              >
                <Plus className="size-4" />
                {t('parameters.list.addNew', 'Yeni Ekle')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/3">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedVisibleColumns.map((key) => {
                    if (key === 'id') return <TableHead key={key}>{t('parameters.list.id', 'ID')}</TableHead>;
                    if (key === 'allowLessQuantityBasedOnOrder') return <TableHead key={key}>{t('parameters.list.allowLessQuantity', 'Emre İstinaden Az Miktar')}</TableHead>;
                    if (key === 'allowMoreQuantityBasedOnOrder') return <TableHead key={key}>{t('parameters.list.allowMoreQuantity', 'Emre İstinaden Fazla Miktar')}</TableHead>;
                    if (key === 'requireApprovalBeforeErp') return <TableHead key={key}>{t('parameters.list.requireApproval', 'ERP Öncesi Onay')}</TableHead>;
                    if (key === 'requireAllOrderItemsCollected') return <TableHead key={key}>{t('parameters.list.requireAllOrderItemsCollected', 'Emirdeki Tüm Kalemlere Toplama Yapılmış Olmalı')}</TableHead>;
                    if (key === 'createdDate') return <TableHead key={key}>{t('parameters.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>;
                    if (key === 'updatedDate') return <TableHead key={key}>{t('parameters.list.updatedDate', 'Güncelleme Tarihi')}</TableHead>;
                    if (key === 'actions') return <TableHead key={key}>{t('parameters.list.actions', 'İşlemler')}</TableHead>;
                    return null;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      {orderedVisibleColumns.map((key) => {
                        if (key === 'id') return <TableCell key={key}>{item.id}</TableCell>;
                        if (key === 'allowLessQuantityBasedOnOrder') return <TableCell key={key}>{item.allowLessQuantityBasedOnOrder ? t('common.yes') : t('common.no')}</TableCell>;
                        if (key === 'allowMoreQuantityBasedOnOrder') return <TableCell key={key}>{item.allowMoreQuantityBasedOnOrder ? t('common.yes') : t('common.no')}</TableCell>;
                        if (key === 'requireApprovalBeforeErp') return <TableCell key={key}>{item.requireApprovalBeforeErp ? t('common.yes') : t('common.no')}</TableCell>;
                        if (key === 'requireAllOrderItemsCollected') return <TableCell key={key}>{item.requireAllOrderItemsCollected ? t('common.yes') : t('common.no')}</TableCell>;
                        if (key === 'createdDate') return <TableCell key={key}>{formatDateTime(item.createdDate)}</TableCell>;
                        if (key === 'updatedDate') return <TableCell key={key}>{formatDateTime(item.updatedDate)}</TableCell>;
                        if (key === 'actions') {
                          return (
                            <TableCell key={key}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/parameters/${parameterType}/edit/${item.id}`)}
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedParameter(item);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          );
                        }
                        return null;
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Math.max(orderedVisibleColumns.length, 1)} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('parameters.list.noData', 'Veri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4 pb-1">
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((item) => (
                <Card key={item.id} className="border border-slate-200/70 bg-white/85 dark:border-white/10 dark:bg-white/4">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('parameters.list.id', 'ID')}
                        </p>
                        <p className="text-base font-semibold">{item.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/parameters/${parameterType}/edit/${item.id}`)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedParameter(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('parameters.list.allowLessQuantity', 'Emre İstinaden Az Miktar')}
                        </p>
                        <p className="text-base">
                          {item.allowLessQuantityBasedOnOrder ? t('common.yes') : t('common.no')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('parameters.list.allowMoreQuantity', 'Emre İstinaden Fazla Miktar')}
                        </p>
                        <p className="text-base">
                          {item.allowMoreQuantityBasedOnOrder ? t('common.yes') : t('common.no')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('parameters.list.requireApproval', 'ERP Öncesi Onay')}
                        </p>
                        <p className="text-base">
                          {item.requireApprovalBeforeErp ? t('common.yes') : t('common.no')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('parameters.list.requireAllOrderItemsCollected', 'Emirdeki Tüm Kalemlere Toplama Yapılmış Olmalı')}
                        </p>
                        <p className="text-base">
                          {item.requireAllOrderItemsCollected ? t('common.yes') : t('common.no')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('parameters.list.createdDate', 'Oluşturulma Tarihi')}
                        </p>
                        <p className="text-base">{formatDateTime(item.createdDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('parameters.list.noData', 'Veri bulunamadı')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('parameters.delete.title', 'Parametre Sil')}</DialogTitle>
            <DialogDescription>
              {t(
                'parameters.delete.description',
                'Bu parametreyi silmek istediğinizden emin misiniz?'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
