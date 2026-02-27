import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useSubcontractingReceiptHeaders } from '../hooks/useSubcontractingHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import { Eye, Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import type { SubcontractingHeader } from '../types/subcontracting';

export function SubcontractingReceiptListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useSubcontractingReceiptHeaders();

  useEffect(() => {
    setPageTitle(t('subcontracting.receipt.list.title', 'Fason Giriş Emri Listesi'));
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

  const handleRowClick = (header: SubcontractingHeader): void => {
    setSelectedHeaderId(header.id);
    setSelectedDocumentType(header.documentType);
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
        <p className="text-destructive">{t('subcontracting.receipt.list.error', 'Veri yüklenirken bir hata oluştu')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{t('subcontracting.receipt.list.title', 'Fason Giriş Emri Listesi')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('subcontracting.receipt.list.searchPlaceholder', 'Belge No, Cari Kodu, Depo...')}
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
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('subcontracting.receipt.list.documentNo', 'Belge No')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.documentDate', 'Belge Tarihi')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.customerCode', 'Cari Kodu')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.customerName', 'Cari Adı')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.sourceWarehouse', 'Çıkış Deposu')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.targetWarehouse', 'Varış Deposu')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.documentType', 'Belge Tipi')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.status', 'Durum')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                  <TableHead>{t('subcontracting.receipt.list.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item: SubcontractingHeader) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => handleRowClick(item)}>
                      <TableCell className="font-medium">{item.documentNo || '-'}</TableCell>
                      <TableCell>{formatDate(item.documentDate)}</TableCell>
                      <TableCell>{item.customerCode || '-'}</TableCell>
                      <TableCell>{item.customerName || '-'}</TableCell>
                      <TableCell>{item.sourceWarehouse || '-'}</TableCell>
                      <TableCell>{item.targetWarehouse || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.documentType || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.isCompleted ? (
                            <Badge variant="default" className="w-fit">
                              {t('subcontracting.receipt.list.completed', 'Tamamlandı')}
                            </Badge>
                          ) : item.isPendingApproval ? (
                            <Badge variant="secondary" className="w-fit">
                              {t('subcontracting.receipt.list.pendingApproval', 'Onay Bekliyor')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit">
                              {t('subcontracting.receipt.list.inProgress', 'Devam Ediyor')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdDate)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRowClick(item)}
                        >
                          <Eye className="size-4" />
                          <span className="ml-2">{t('subcontracting.receipt.list.viewDetails', 'Detay')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('subcontracting.receipt.list.noData', 'Veri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4">
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((item: SubcontractingHeader) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        {item.isCompleted ? (
                          <Badge variant="default" className="w-fit">
                            {t('subcontracting.receipt.list.completed', 'Tamamlandı')}
                          </Badge>
                        ) : item.isPendingApproval ? (
                          <Badge variant="secondary" className="w-fit">
                            {t('subcontracting.receipt.list.pendingApproval', 'Onay Bekliyor')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            {t('subcontracting.receipt.list.inProgress', 'Devam Ediyor')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('subcontracting.receipt.list.documentNo', 'Belge No')}
                        </p>
                        <p className="text-base">{item.documentNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('subcontracting.receipt.list.documentDate', 'Belge Tarihi')}
                        </p>
                        <p className="text-base">{formatDate(item.documentDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('subcontracting.receipt.list.customerCode', 'Cari Kodu')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('subcontracting.receipt.list.customerName', 'Cari Adı')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('subcontracting.receipt.list.sourceWarehouse', 'Çıkış Deposu')}
                        </p>
                        <p className="text-base">{item.sourceWarehouse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('subcontracting.receipt.list.targetWarehouse', 'Varış Deposu')}
                        </p>
                        <p className="text-base">{item.targetWarehouse || '-'}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleRowClick(item)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('subcontracting.receipt.list.viewDetails', 'Detay')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('subcontracting.receipt.list.noData', 'Veri bulunamadı')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedHeaderId && selectedDocumentType && (
        <SubcontractingDetailDialog
          headerId={selectedHeaderId}
          documentType={selectedDocumentType}
          isOpen={!!selectedHeaderId}
          onClose={() => {
            setSelectedHeaderId(null);
            setSelectedDocumentType(null);
          }}
        />
      )}
    </div>
  );
}

