import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useAssignedTransferHeaders } from '../hooks/useAssignedTransferHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TransferDetailDialog } from './TransferDetailDialog';
import { Eye, Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import type { TransferHeader } from '../types/transfer';
import { ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import type { GridExportColumn } from '@/lib/grid-export';

export function AssignedTransferListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'id', label: t('transfer.list.id', 'ID') },
      { key: 'documentNo', label: t('transfer.list.documentNo', 'Belge No') },
      { key: 'documentDate', label: t('transfer.list.documentDate', 'Belge Tarihi') },
      { key: 'customerCode', label: t('transfer.list.customerCode', 'Cari Kodu') },
      { key: 'customerName', label: t('transfer.list.customerName', 'Cari Adı') },
      { key: 'sourceWarehouse', label: t('transfer.list.sourceWarehouse', 'Çıkış Deposu') },
      { key: 'targetWarehouse', label: t('transfer.list.targetWarehouse', 'Varış Deposu') },
      { key: 'documentType', label: t('transfer.list.documentType', 'Belge Tipi') },
      { key: 'createdDate', label: t('transfer.list.createdDate', 'Oluşturulma Tarihi') },
      { key: 'actions', label: t('goodsReceipt.report.actions', 'İşlemler') },
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
    pageKey: 'transfer-assigned-list',
    columns,
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useAssignedTransferHeaders();

  useEffect(() => {
    setPageTitle(t('transfer.assignedList.title', 'Atanmış Transfer Emirleri'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!searchTerm) return data.data;
    const searchLower = searchTerm.toLowerCase();
    return data.data.filter((item) => {
      return (
        item.documentNo?.toLowerCase().includes(searchLower) ||
        item.customerCode?.toLowerCase().includes(searchLower) ||
        item.customerName?.toLowerCase().includes(searchLower) ||
        item.sourceWarehouse?.toLowerCase().includes(searchLower) ||
        item.targetWarehouse?.toLowerCase().includes(searchLower) ||
        item.description1?.toLowerCase().includes(searchLower)
      );
    });
  }, [data?.data, searchTerm]);

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
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [filteredData]);

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
          {t('transfer.assignedList.error', 'Veri yüklenirken bir hata oluştu')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t('transfer.assignedList.title', 'Atanmış Transfer Emirleri')}</CardTitle>
            <div className="flex items-center gap-2">
              <GridExportMenu
                fileName="transfer-assigned-list"
                columns={exportColumns}
                rows={exportRows}
              />
              <ColumnPreferencesPopover
                pageKey="transfer-assigned-list"
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
                  placeholder={t(
                    'transfer.assignedList.searchPlaceholder',
                    'Belge No, Cari Kodu, Depo...'
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-10 w-full md:w-64"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <VoiceSearchButton
                    onResult={(text) => setSearchTerm(text)}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/3">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedVisibleColumns.map((key) => {
                    if (key === 'id') return <TableHead key={key}>{t('transfer.list.id', 'ID')}</TableHead>;
                    if (key === 'documentNo') return <TableHead key={key}>{t('transfer.list.documentNo', 'Belge No')}</TableHead>;
                    if (key === 'documentDate') return <TableHead key={key}>{t('transfer.list.documentDate', 'Belge Tarihi')}</TableHead>;
                    if (key === 'customerCode') return <TableHead key={key}>{t('transfer.list.customerCode', 'Cari Kodu')}</TableHead>;
                    if (key === 'customerName') return <TableHead key={key}>{t('transfer.list.customerName', 'Cari Adı')}</TableHead>;
                    if (key === 'sourceWarehouse') return <TableHead key={key}>{t('transfer.list.sourceWarehouse', 'Çıkış Deposu')}</TableHead>;
                    if (key === 'targetWarehouse') return <TableHead key={key}>{t('transfer.list.targetWarehouse', 'Varış Deposu')}</TableHead>;
                    if (key === 'documentType') return <TableHead key={key}>{t('transfer.list.documentType', 'Belge Tipi')}</TableHead>;
                    if (key === 'createdDate') return <TableHead key={key}>{t('transfer.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>;
                    if (key === 'actions') return <TableHead key={key}>{t('goodsReceipt.report.actions', 'İşlemler')}</TableHead>;
                    return null;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item: TransferHeader) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedHeaderId(item.id)}
                    >
                      {orderedVisibleColumns.map((key) => {
                        if (key === 'id') return <TableCell key={key}>{item.id}</TableCell>;
                        if (key === 'documentNo') return <TableCell key={key} className="font-medium">{item.documentNo || '-'}</TableCell>;
                        if (key === 'documentDate') return <TableCell key={key}>{formatDate(item.documentDate)}</TableCell>;
                        if (key === 'customerCode') return <TableCell key={key}>{item.customerCode || '-'}</TableCell>;
                        if (key === 'customerName') return <TableCell key={key}>{item.customerName || '-'}</TableCell>;
                        if (key === 'sourceWarehouse') return <TableCell key={key}>{item.sourceWarehouse || '-'}</TableCell>;
                        if (key === 'targetWarehouse') return <TableCell key={key}>{item.targetWarehouse || '-'}</TableCell>;
                        if (key === 'documentType') return <TableCell key={key}><Badge variant="outline">{item.documentType || '-'}</Badge></TableCell>;
                        if (key === 'createdDate') return <TableCell key={key}>{formatDateTime(item.createdDate)}</TableCell>;
                        if (key === 'actions') return <TableCell key={key} onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(item.id)}><Eye className="size-4" /><span className="ml-2">{t('transfer.list.viewDetails', 'Detay')}</span></Button><Button variant="default" size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => navigate(`/transfer/collection/${item.id}`)}>{t('common.start', 'Başla')}</Button></div></TableCell>;
                        return null;
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Math.max(orderedVisibleColumns.length, 1)} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('transfer.assignedList.noData', 'Atanmış transfer emri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4 pb-1">
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((item: TransferHeader) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.id', 'ID')}
                        </p>
                        <p className="text-base font-semibold">{item.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.documentNo', 'Belge No')}
                        </p>
                        <p className="text-base">{item.documentNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.documentDate', 'Belge Tarihi')}
                        </p>
                        <p className="text-base">{formatDate(item.documentDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.customerCode', 'Cari Kodu')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.customerName', 'Cari Adı')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.sourceWarehouse', 'Çıkış Deposu')}
                        </p>
                        <p className="text-base">{item.sourceWarehouse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('transfer.list.targetWarehouse', 'Varış Deposu')}
                        </p>
                        <p className="text-base">{item.targetWarehouse || '-'}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedHeaderId(item.id)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('transfer.list.viewDetails', 'Detay')}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => navigate(`/transfer/collection/${item.id}`)}
                      >
                        {t('common.start', 'Başla')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('transfer.assignedList.noData', 'Atanmış transfer emri bulunamadı')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedHeaderId && (
        <TransferDetailDialog
          headerId={selectedHeaderId}
          isOpen={!!selectedHeaderId}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
    </div>
  );
}


