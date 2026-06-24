import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsFieldShell, PageState } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { useSubcontractingReceiptHeaders, useSubcontractingIssueHeaders } from '../hooks/useSubcontractingHeaders';
import { useSubcontractingLines } from '../hooks/useSubcontractingLines';
import type { SubcontractingHeader, SubcontractingLine } from '../types/subcontracting';
import { useSubcontractingLineSerials } from '../hooks/useSubcontractingLineSerials';
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
import { cn } from '@/lib/utils';

interface SubcontractingDetailDialogProps {
  headerId: number;
  documentType: string;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'default' | 'ops';
}

interface OpsDetailRowProps {
  label: string;
  children: ReactNode;
}

function OpsDetailRow({ label, children }: OpsDetailRowProps): ReactElement {
  return (
    <div className="wms-ops-detail-row">
      <span className="wms-ops-detail-row__label">{label}</span>
      <span className="wms-ops-detail-row__value">{children}</span>
    </div>
  );
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SubcontractingDetailDialog({
  headerId,
  documentType,
  isOpen,
  onClose,
  variant = 'ops',
}: SubcontractingDetailDialogProps): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const { data: receiptHeadersData } = useSubcontractingReceiptHeaders();
  const { data: issueHeadersData } = useSubcontractingIssueHeaders();
  const { data: linesData, isLoading: isLoadingLines } = useSubcontractingLines(headerId, documentType);
  const [searchQuery, setSearchQuery] = useState('');

  const headersData = documentType === 'SRT' ? receiptHeadersData : issueHeadersData;
  const header = headersData?.data?.find((h) => h.id === headerId);
  const isOps = variant === 'ops';

  const filteredLines = useMemo(() => {
    if (!linesData?.data) return [];
    if (!searchQuery.trim()) return linesData.data;
    const query = searchQuery.toLowerCase();
    return linesData.data.filter((line) => (
      line.stockCode?.toLowerCase().includes(query)
      || line.stockName?.toLowerCase().includes(query)
      || line.yapKod?.toLowerCase().includes(query)
      || line.description?.toLowerCase().includes(query)
    ));
  }, [linesData?.data, searchQuery]);

  const renderStatusBadge = (item: SubcontractingHeader): ReactElement => {
    if (item.isCompleted) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done">{t('subcontracting.list.completed')}</Badge>;
    }
    if (item.isPendingApproval) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending">{t('subcontracting.list.pendingApproval')}</Badge>;
    }
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active">{t('subcontracting.list.inProgress')}</Badge>;
  };

  const renderInfoPanels = (): ReactElement => {
    if (!header) return <></>;

    if (isOps) {
      return (
        <div className="mb-6 grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('subcontracting.list.documentInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('subcontracting.list.id')}>{header.id}</OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.documentNo')}>{header.documentNo || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.documentDate')}>{formatDate(header.documentDate)}</OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.documentType')}>
                <span className="wms-ops-code-badge">{header.documentType || '-'}</span>
              </OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.createdDate')}>{formatDateTime(header.createdDate)}</OpsDetailRow>
            </div>
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('subcontracting.list.customerInfo')}</h3>
            <div className="wms-ops-detail-panel--rows">
              <OpsDetailRow label={t('subcontracting.list.customerCode')}>{header.customerCode || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.customerName')}>{header.customerName || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.status')}>{renderStatusBadge(header)}</OpsDetailRow>
            </div>
            {header.description1 ? (
              <div className="wms-ops-detail-panel__body">
                <div className="wms-ops-detail-row__label mb-2">{t('subcontracting.step1.notes')}</div>
                <p className="text-sm leading-6 break-words opacity-90">{header.description1}</p>
              </div>
            ) : null}
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('subcontracting.list.warehouseInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('subcontracting.list.sourceWarehouse')}>{header.sourceWarehouse || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('subcontracting.list.targetWarehouse')}>{header.targetWarehouse || '-'}</OpsDetailRow>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('subcontracting.list.documentInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.id')}</span>
                <span className="text-sm font-semibold">{header.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.documentNo')}</span>
                <span className="text-sm font-medium">{header.documentNo || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.documentDate')}</span>
                <span className="text-sm">{formatDate(header.documentDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.documentType')}</span>
                <Badge variant="outline" className="text-xs">{header.documentType || '-'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.createdDate')}</span>
                <span className="text-xs">{formatDateTime(header.createdDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('subcontracting.list.customerInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.customerCode')}</span>
                <span className="text-sm font-medium">{header.customerCode || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.customerName')}</span>
                <span className="max-w-[150px] truncate text-right text-sm">{header.customerName || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.status')}</span>
                {renderStatusBadge(header)}
              </div>
            </div>
            {header.description1 ? (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('subcontracting.step1.notes')}
                  </p>
                  <p className="line-clamp-3 text-xs text-muted-foreground">{header.description1}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('subcontracting.list.warehouseInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.sourceWarehouse')}</span>
                <span className="text-sm font-medium">{header.sourceWarehouse || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('subcontracting.list.targetWarehouse')}</span>
                <span className="text-sm font-medium">{header.targetWarehouse || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLinesSection = (): ReactElement => (
    <div className={cn(
      'flex flex-col',
      'md:min-h-0 md:flex-1',
      isOps && 'wms-ops-detail-panel wms-ops-detail-lines-panel',
    )}>
      <div className={cn('shrink-0 space-y-3', !isOps && 'mb-2 space-y-2 border-b pb-2')}>
        <h3 className={cn('text-sm font-semibold', isOps && 'wms-ops-detail-section-title m-0 border-0 p-0')}>
          {t('subcontracting.list.lines')}
        </h3>
        {isOps ? (
          <OpsFieldShell className="wms-ops-detail-search">
            <Search className="wms-ops-detail-search__icon size-4" aria-hidden />
            <Input
              placeholder={t('subcontracting.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn(OPS_FIELD_CLASS, 'pl-9 pr-10')}
            />
            <div className="wms-ops-detail-search__voice">
              <VoiceSearchButton
                onResult={setSearchQuery}
                size="sm"
                variant="ghost"
                className="wms-ops-voice-btn"
              />
            </div>
          </OpsFieldShell>
        ) : (
          <div className="relative flex items-center">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('subcontracting.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-7 pr-9 pl-7 text-xs"
            />
            <div className="absolute top-1/2 right-1 -translate-y-1/2 transform">
              <VoiceSearchButton
                onResult={setSearchQuery}
                size="sm"
                variant="ghost"
                className="h-5 w-5"
              />
            </div>
          </div>
        )}
      </div>
      <div className={cn(
        'rounded-md border max-md:shrink-0 max-md:overflow-x-auto',
        'md:min-h-0 md:flex-1 md:overflow-y-auto',
        isOps && 'wms-ops-transfer-detail__table-wrap rounded-none border-0',
      )}>
        {isLoadingLines ? (
          <PageState tone="loading" title={t('common.loading')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />
        ) : filteredLines.length === 0 ? (
          <PageState tone="empty" title={t('subcontracting.list.noData')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />
        ) : isOps ? (
          <table className="wms-ops-transfer-detail__table">
            <colgroup>
              <col style={{ width: '7.5rem' }} />
              <col style={{ width: '16rem' }} />
              <col style={{ width: '5.5rem' }} />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '7rem' }} />
              <col style={{ width: '7rem' }} />
              <col style={{ width: '10rem' }} />
              <col style={{ width: '10rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th>{t('subcontracting.list.stockCode')}</th>
                <th>{t('subcontracting.list.stockName')}</th>
                <th className="wms-ops-transfer-detail__col--qty">
                  <span className="wms-ops-transfer-detail__th-stack">
                    <span>{t('subcontracting.list.orderQuantityLine1', { defaultValue: 'Sipariş' })}</span>
                    <span>{t('subcontracting.list.orderQuantityLine2', { defaultValue: 'Miktarı' })}</span>
                  </span>
                </th>
                <th>{t('subcontracting.details.configCode')}</th>
                <th>{t('subcontracting.list.serialNo')}</th>
                <th>{t('subcontracting.details.lotNo')}</th>
                <th>{t('subcontracting.details.batchNo')}</th>
                <th>{t('subcontracting.list.sourceWarehouse')}</th>
                <th>{t('subcontracting.list.targetWarehouse')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => (
                <SubcontractingLineRow key={line.id} line={line} documentType={documentType} variant={variant} />
              ))}
            </tbody>
          </table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('subcontracting.list.stockCode')}</TableHead>
                <TableHead>{t('subcontracting.list.stockName')}</TableHead>
                <TableHead className="w-[120px]">{t('subcontracting.list.orderQuantity', { defaultValue: t('goodsReceipt.orderDetails.orderQuantity') })}</TableHead>
                <TableHead className="w-[100px]">{t('subcontracting.details.configCode')}</TableHead>
                <TableHead className="w-[120px]">{t('subcontracting.list.serialNo')}</TableHead>
                <TableHead className="w-[120px]">{t('subcontracting.details.lotNo')}</TableHead>
                <TableHead className="w-[120px]">{t('subcontracting.details.batchNo')}</TableHead>
                <TableHead className="w-[120px]">{t('subcontracting.list.sourceWarehouse')}</TableHead>
                <TableHead className="w-[120px]">{t('subcontracting.list.targetWarehouse')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLines.map((line) => (
                <SubcontractingLineRow key={line.id} line={line} documentType={documentType} variant={variant} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        'flex h-[90vh] max-h-[90dvh] w-[95vw] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0',
        'sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl',
        isOps && 'wms-ops-form wms-ops-detail-dialog wms-ops-subcontracting-detail-dialog border-0 shadow-none',
      )}>
        <DialogHeader className={cn(
          'shrink-0 border-b px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6 sm:pr-14',
          isOps && 'wms-ops-detail-dialog__header',
        )}>
          <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : 'text-xl'}>
            {t('subcontracting.list.detailTitle')}
            {isOps ? <span className="wms-ops-detail-dialog__id"> #{headerId}</span> : ` - #${headerId}`}
          </DialogTitle>
          <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
            {t('subcontracting.list.detailDescription')}
          </DialogDescription>
        </DialogHeader>

        {header ? (
          <div className="wms-ops-subcontracting-detail__body flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:overflow-hidden">
            {renderInfoPanels()}
            {renderLinesSection()}
          </div>
        ) : (
          <div className={cn('flex-1 p-6', isOps && 'wms-ops-detail-state')}>
            <PageState tone="empty" title={t('subcontracting.list.noData')} compact />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SubcontractingLineRowProps {
  line: SubcontractingLine;
  documentType: string;
  variant: 'default' | 'ops';
}

function SubcontractingLineRow({ line, documentType, variant }: SubcontractingLineRowProps): ReactElement {
  const { data: lineSerialsData } = useSubcontractingLineSerials(line.id, documentType);
  const isOps = variant === 'ops';

  const firstSerial = lineSerialsData?.data && lineSerialsData.data.length > 0 ? lineSerialsData.data[0] : null;
  const serialNo = firstSerial?.serialNo ?? '-';
  const lotNo = firstSerial?.serialNo3 ?? '-';
  const batchNo = firstSerial?.serialNo4 ?? '-';
  const sourceWarehouse = firstSerial?.sourceWarehouseName || firstSerial?.sourceWarehouseId?.toString() || '-';
  const targetWarehouse = firstSerial?.targetWarehouseName || firstSerial?.targetWarehouseId?.toString() || '-';

  if (isOps) {
    return (
      <tr>
        <td>
          <span className="wms-ops-transfer-detail__stock-code">{line.stockCode}</span>
        </td>
        <td>
          <span className="wms-ops-transfer-detail__stock-name">{line.stockName || line.description || '-'}</span>
        </td>
        <td className="wms-ops-transfer-detail__col--qty">{line.siparisMiktar ?? line.quantity}</td>
        <td>{line.yapKod || '-'}</td>
        <td>{serialNo}</td>
        <td>{lotNo}</td>
        <td>{batchNo}</td>
        <td>{sourceWarehouse}</td>
        <td>{targetWarehouse}</td>
      </tr>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className="font-mono text-xs">{line.stockCode}</Badge>
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
