import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PageActionBar, PageState } from '@/components/shared';
import { useShipmentHeaders } from '../hooks/useShipmentHeaders';
import { useShipmentLines } from '../hooks/useShipmentLines';
import { useShipmentLineSerials } from '../hooks/useShipmentLineSerials';
import type { ShipmentLine } from '../types/shipment';
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

interface ShipmentDetailDialogProps {
  headerId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ShipmentDetailDialog({
  headerId,
  isOpen,
  onClose,
}: ShipmentDetailDialogProps): ReactElement {
  const { t } = useTranslation();
  const { data: headersData } = useShipmentHeaders();
  const { data: linesData, isLoading: isLoadingLines } = useShipmentLines(headerId);
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
    if (!linesData?.data) return [];
    if (!searchQuery.trim()) return linesData.data;
    const query = searchQuery.toLowerCase();
    return linesData.data.filter((line) => {
      return (
        line.stockCode?.toLowerCase().includes(query) ||
        line.stockName?.toLowerCase().includes(query) ||
        line.yapKod?.toLowerCase().includes(query) ||
        line.description?.toLowerCase().includes(query) ||
        line.erpOrderNo?.toLowerCase().includes(query)
      );
    });
  }, [linesData?.data, searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">
            {t('shipment.list.detailTitle')} - #{headerId}
          </DialogTitle>
          <DialogDescription>
            {t('shipment.list.detailDescription')}
          </DialogDescription>
        </DialogHeader>

        {header && (
          <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t('shipment.list.documentInfo')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.id')}</span>
                      <span className="text-sm font-semibold">{header.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.documentNo')}</span>
                      <span className="text-sm font-medium">{header.documentNo || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.documentDate')}</span>
                      <span className="text-sm">{formatDate(header.documentDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.documentType')}</span>
                      <Badge variant="outline" className="text-xs">
                        {header.documentType || '-'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.createdDate')}</span>
                      <span className="text-xs">{formatDateTime(header.createdDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t('shipment.list.customerInfo')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.customerCode')}</span>
                      <span className="text-sm font-medium">{header.customerCode || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.customerName')}</span>
                      <span className="text-sm truncate max-w-[150px] text-right">{header.customerName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.status')}</span>
                      <div>
                        {header.isCompleted ? (
                          <Badge variant="default" className="text-xs">
                            {t('shipment.list.completed')}
                          </Badge>
                        ) : header.isPendingApproval ? (
                          <Badge variant="secondary" className="text-xs">
                            {t('shipment.list.pendingApproval')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {t('shipment.list.inProgress')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {header.description1 && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {t('shipment.step1.notes')}
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
                    {t('shipment.list.warehouseInfo')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.sourceWarehouse')}</span>
                      <span className="text-sm font-medium">{header.sourceWarehouse || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('shipment.list.targetWarehouse')}</span>
                      <span className="text-sm font-medium">{header.targetWarehouse || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="pb-2 space-y-2 border-b shrink-0 mb-2">
                <PageActionBar title={<span className="text-sm">{t('shipment.list.lines')}</span>} contentClassName="space-y-0" />
                <div className="relative flex items-center">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('shipment.step2.searchItems')}
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
                  <PageState tone="loading" title={t('common.loading')} compact className="m-3" />
                ) : filteredLines.length === 0 ? (
                  <PageState tone="empty" title={t('shipment.list.noData')} compact className="m-3" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">{t('shipment.list.orderNo')}</TableHead>
                        <TableHead className="w-[100px]">{t('shipment.list.stockCode')}</TableHead>
                        <TableHead>{t('shipment.list.stockName')}</TableHead>
                        <TableHead className="w-[120px]">{t('goodsReceipt.orderDetails.orderQuantity')}</TableHead>
                        <TableHead className="w-[100px]">{t('shipment.details.configCode')}</TableHead>
                        <TableHead className="w-[120px]">{t('shipment.list.serialNo')}</TableHead>
                        <TableHead className="w-[120px]">{t('shipment.details.lotNo')}</TableHead>
                        <TableHead className="w-[120px]">{t('shipment.details.batchNo')}</TableHead>
                        <TableHead className="w-[120px]">{t('shipment.list.sourceWarehouse')}</TableHead>
                        <TableHead className="w-[120px]">{t('shipment.list.targetWarehouse')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.map((line: ShipmentLine) => (
                        <ShipmentLineRow key={line.id} line={line} />
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

interface ShipmentLineRowProps {
  line: ShipmentLine;
}

function ShipmentLineRow({ line }: ShipmentLineRowProps): ReactElement {
  const { data: lineSerialsData } = useShipmentLineSerials(line.id);

  const firstSerial = lineSerialsData?.data && lineSerialsData.data.length > 0 ? lineSerialsData.data[0] : null;
  const serialNo = firstSerial?.serialNo || '-';
  const lotNo = firstSerial?.serialNo3 || '-';
  const batchNo = firstSerial?.serialNo4 || '-';
  const sourceWarehouse = firstSerial?.sourceWarehouseName || firstSerial?.sourceWarehouseId?.toString() || '-';
  const targetWarehouse = firstSerial?.targetWarehouseName || firstSerial?.targetWarehouseId?.toString() || '-';

  return (
    <TableRow>
      <TableCell>
        <Badge variant="secondary" className="font-mono text-xs">
          {line.erpOrderNo || '-'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono text-xs">
          {line.stockCode}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">{line.stockName || line.description || '-'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{line.siparisMiktar ?? line.quantity}</span>
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
      <TableCell>
        <span className="text-sm">{sourceWarehouse}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{targetWarehouse}</span>
      </TableCell>
    </TableRow>
  );
}
