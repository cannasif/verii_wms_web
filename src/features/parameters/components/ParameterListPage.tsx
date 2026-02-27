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

export function ParameterListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type } = useParams<{ type: ParameterType }>();
  const { setPageTitle } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);

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
          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('parameters.list.id', 'ID')}</TableHead>
                  <TableHead>
                    {t('parameters.list.allowLessQuantity', 'Emre İstinaden Az Miktar')}
                  </TableHead>
                  <TableHead>
                    {t('parameters.list.allowMoreQuantity', 'Emre İstinaden Fazla Miktar')}
                  </TableHead>
                  <TableHead>
                    {t('parameters.list.requireApproval', 'ERP Öncesi Onay')}
                  </TableHead>
                  <TableHead>
                    {t('parameters.list.requireAllOrderItemsCollected', 'Emirdeki Tüm Kalemlere Toplama Yapılmış Olmalı')}
                  </TableHead>
                  <TableHead>{t('parameters.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                  <TableHead>{t('parameters.list.updatedDate', 'Güncelleme Tarihi')}</TableHead>
                  <TableHead>{t('parameters.list.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.allowLessQuantityBasedOnOrder ? t('common.yes') : t('common.no')}</TableCell>
                      <TableCell>{item.allowMoreQuantityBasedOnOrder ? t('common.yes') : t('common.no')}</TableCell>
                      <TableCell>{item.requireApprovalBeforeErp ? t('common.yes') : t('common.no')}</TableCell>
                      <TableCell>{item.requireAllOrderItemsCollected ? t('common.yes') : t('common.no')}</TableCell>
                      <TableCell>{formatDateTime(item.createdDate)}</TableCell>
                      <TableCell>{formatDateTime(item.updatedDate)}</TableCell>
                      <TableCell>
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
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
                <Card key={item.id} className="border">
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
                    <div className="grid grid-cols-2 gap-3">
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

