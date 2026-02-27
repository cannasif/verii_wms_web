import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useTransferHeaders } from '../hooks/useTransferHeaders';
import { useAssignedTransferOrderLines } from '../hooks/useAssignedTransferOrderLines';
import type { AssignedTransferLine, AssignedTransferLineSerial } from '../types/transfer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface TransferDetailDialogProps {
  headerId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function TransferDetailDialog({
  headerId,
  isOpen,
  onClose,
}: TransferDetailDialogProps): ReactElement {
  const { t } = useTranslation();
  const { data: headersData } = useTransferHeaders();
  const { data: assignedData, isLoading: isLoadingLines } = useAssignedTransferOrderLines(headerId);
  const [searchQuery, setSearchQuery] = useState('');

  const header = headersData?.data?.find((h) => h.id === headerId);

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

  const filteredLines = useMemo(() => {
    if (!assignedData?.data?.lines) return [];
    if (!searchQuery.trim()) return assignedData.data.lines;
    const query = searchQuery.toLowerCase();
    return assignedData.data.lines.filter((line) => {
      return (
        line.stockCode?.toLowerCase().includes(query) ||
        line.stockName?.toLowerCase().includes(query) ||
        line.yapKod?.toLowerCase().includes(query) ||
        line.description?.toLowerCase().includes(query)
      );
    });
  }, [assignedData?.data?.lines, searchQuery]);

  const serialsByLineId = useMemo(() => {
    const map: Record<number, AssignedTransferLineSerial[]> = {};
    if (!assignedData?.data?.lineSerials) {
      return map;
    }
    assignedData.data.lineSerials.forEach((serial) => {
      if (!map[serial.lineId]) {
        map[serial.lineId] = [];
      }
      map[serial.lineId].push(serial);
    });
    return map;
  }, [assignedData?.data?.lineSerials]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">
            {t('transfer.list.detailTitle', 'Transfer Emri Detayı')} - #{headerId}
          </DialogTitle>
          <DialogDescription>
            {t('transfer.list.detailDescription', 'Transfer emrinin detaylı bilgileri')}
          </DialogDescription>
        </DialogHeader>

        {header && (
          <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t('transfer.list.documentInfo', 'Belge Bilgileri')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.id', 'ID')}</span>
                      <span className="text-sm font-semibold">{header.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.documentNo', 'Belge No')}</span>
                      <span className="text-sm font-medium">{header.documentNo || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.documentDate', 'Belge Tarihi')}</span>
                      <span className="text-sm">{formatDate(header.documentDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.documentType', 'Belge Tipi')}</span>
                      <Badge variant="outline" className="text-xs">
                        {header.documentType || '-'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.createdDate', 'Oluşturulma Tarihi')}</span>
                      <span className="text-xs">{formatDateTime(header.createdDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t('transfer.list.customerInfo', 'Cari Bilgileri')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.customerCode', 'Cari Kodu')}</span>
                      <span className="text-sm font-medium">{header.customerCode || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.customerName', 'Cari Adı')}</span>
                      <span className="text-sm truncate max-w-[150px] text-right">{header.customerName || '-'}</span>
                    </div>
                  </div>
                  {header.description1 && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {t('transfer.step1.notes', 'Notlar')}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-3">{header.description1}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t('transfer.list.warehouseInfo', 'Depo Bilgileri')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.sourceWarehouse', 'Çıkış Deposu')}</span>
                      <span className="text-sm font-medium">{header.sourceWarehouse || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('transfer.list.targetWarehouse', 'Varış Deposu')}</span>
                      <span className="text-sm font-medium">{header.targetWarehouse || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="pb-2 space-y-2 border-b shrink-0 mb-2">
                <h3 className="text-sm font-semibold">
                  {t('transfer.list.lines', 'Kalemler')}
                </h3>
                <div className="relative flex items-center">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('transfer.step2.searchItems', 'Stok kodu veya adı ile ara...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-9 h-7 text-xs"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <VoiceSearchButton
                      onResult={(text) => setSearchQuery(text)}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto rounded-md border">
                {isLoadingLines ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('common.loading')}</p>
                  </div>
                ) : filteredLines.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {t('transfer.list.noData', 'Veri bulunamadı')}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t('transfer.list.stockCode', 'Stok Kodu')}</TableHead>
                        <TableHead>{t('transfer.list.stockName', 'Stok Adı')}</TableHead>
                        <TableHead className="w-[100px]">{t('transfer.details.configCode', 'Yapılandırma Kodu')}</TableHead>
                        <TableHead className="w-[120px]">{t('transfer.list.serialNo', 'Seri No')}</TableHead>
                        <TableHead className="w-[120px]">{t('transfer.details.lotNo', 'Parti No')}</TableHead>
                        <TableHead className="w-[120px]">{t('transfer.details.batchNo', 'Batch No')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.map((line: AssignedTransferLine) => (
                        <TransferLineRow
                          key={line.id}
                          line={line}
                          serials={serialsByLineId[line.id] || []}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TransferLineRowProps {
  line: AssignedTransferLine;
  serials: AssignedTransferLineSerial[];
}

function TransferLineRow({ line, serials }: TransferLineRowProps): ReactElement {
  const firstSerial = serials.length > 0 ? serials[0] : null;
  const serialNo = firstSerial?.serialNo || '-';
  const lotNo = firstSerial?.serialNo3 || '-';
  const batchNo = firstSerial?.serialNo4 || '-';

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className="font-mono text-xs">
          {line.stockCode}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">{line.stockName || '-'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{line.yapKod || '-'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{serialNo}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{lotNo}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{batchNo}</span>
      </TableCell>
    </TableRow>
  );
}

