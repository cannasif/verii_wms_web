import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureNamespaces } from '@/lib/i18n';
import { PackagePlus, Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsActionButton, OpsFieldShell, PageState } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { useShipmentHeaders } from '../hooks/useShipmentHeaders';
import { useShipmentLines } from '../hooks/useShipmentLines';
import { useShipmentLineSerials } from '../hooks/useShipmentLineSerials';
import type { ShipmentHeader, ShipmentLine } from '../types/shipment';
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
import { Button } from '@/components/ui/button';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PackageMoveToSourceDialog } from '@/features/package/components/PackageMoveToSourceDialog';
import { cn } from '@/lib/utils';

interface ShipmentDetailDialogProps {
  headerId: number;
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

export function ShipmentDetailDialog({
  headerId,
  isOpen,
  onClose,
  variant = 'ops',
}: ShipmentDetailDialogProps): ReactElement {
  const { t, i18n } = useTranslation(['shipment', 'package', 'common']);
  const packagePermission = useCrudPermission('wms.package');
  const { data: headersData } = useShipmentHeaders();
  const { data: linesData, isLoading: isLoadingLines } = useShipmentLines(headerId);
  const [searchQuery, setSearchQuery] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const isOps = variant === 'ops';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void ensureNamespaces(['package'], i18n.resolvedLanguage ?? i18n.language);
  }, [isOpen, i18n.language, i18n.resolvedLanguage]);

  const header = headersData?.data?.find((item) => item.id === headerId);

  const filteredLines = useMemo(() => {
    if (!linesData?.data) return [];
    if (!searchQuery.trim()) return linesData.data;
    const query = searchQuery.toLowerCase();
    return linesData.data.filter((line) => (
      line.stockCode?.toLowerCase().includes(query)
      || line.stockName?.toLowerCase().includes(query)
      || line.yapKod?.toLowerCase().includes(query)
      || line.description?.toLowerCase().includes(query)
      || line.erpOrderNo?.toLowerCase().includes(query)
    ));
  }, [linesData?.data, searchQuery]);

  const renderStatusBadge = (item: ShipmentHeader): ReactElement => {
    if (item.isCompleted) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done">{t('shipment.list.completed')}</Badge>;
    }
    if (item.isPendingApproval) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending">{t('shipment.list.pendingApproval')}</Badge>;
    }
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active">{t('shipment.list.inProgress')}</Badge>;
  };

  const renderInfoPanels = (): ReactElement => {
    if (!header) return <></>;

    if (isOps) {
      return (
        <div className="mb-6 grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('shipment.list.documentInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('shipment.list.id')}>{header.id}</OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.documentNo')}>{header.documentNo || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.documentDate')}>{formatDate(header.documentDate)}</OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.documentType')}>
                <span className="wms-ops-code-badge">{header.documentType || '-'}</span>
              </OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.createdDate')}>{formatDateTime(header.createdDate)}</OpsDetailRow>
            </div>
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('shipment.list.customerInfo')}</h3>
            <div className="wms-ops-detail-panel--rows">
              <OpsDetailRow label={t('shipment.list.customerCode')}>{header.customerCode || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.customerName')}>{header.customerName || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.status')}>{renderStatusBadge(header)}</OpsDetailRow>
            </div>
            {header.description1 ? (
              <div className="wms-ops-detail-panel__body">
                <div className="wms-ops-detail-row__label mb-2">{t('shipment.step1.notes')}</div>
                <p className="text-sm leading-6 break-words opacity-90">{header.description1}</p>
              </div>
            ) : null}
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('shipment.list.warehouseInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('shipment.list.sourceWarehouse')}>{header.sourceWarehouse || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('shipment.list.targetWarehouse')}>{header.targetWarehouse || '-'}</OpsDetailRow>
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
                <Badge variant="outline" className="text-xs">{header.documentType || '-'}</Badge>
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
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('shipment.list.customerInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('shipment.list.customerCode')}</span>
                <span className="text-sm font-medium">{header.customerCode || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('shipment.list.customerName')}</span>
                <span className="max-w-[150px] truncate text-right text-sm">{header.customerName || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('shipment.list.status')}</span>
                {header.isCompleted ? (
                  <Badge variant="default" className="text-xs">{t('shipment.list.completed')}</Badge>
                ) : header.isPendingApproval ? (
                  <Badge variant="secondary" className="text-xs">{t('shipment.list.pendingApproval')}</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">{t('shipment.list.inProgress')}</Badge>
                )}
              </div>
            </div>
            {header.description1 ? (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('shipment.step1.notes')}
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
          {t('shipment.list.lines')}
        </h3>
        {isOps ? (
          <OpsFieldShell className="wms-ops-detail-search">
            <Search className="wms-ops-detail-search__icon size-4" aria-hidden />
            <Input
              placeholder={t('shipment.step2.searchItems')}
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
              placeholder={t('shipment.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-7 pr-9 pl-7 text-xs"
            />
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <VoiceSearchButton onResult={setSearchQuery} size="sm" variant="ghost" className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>
      <div className={cn(
        'max-md:shrink-0 max-md:overflow-x-auto rounded-md border',
        'md:min-h-0 md:flex-1 md:overflow-y-auto',
        isOps && 'wms-ops-transfer-detail__table-wrap rounded-none border-0',
      )}>
        {isLoadingLines ? (
          <PageState tone="loading" title={t('common.loading')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />
        ) : filteredLines.length === 0 ? (
          <PageState tone="empty" title={t('shipment.list.noData')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />
        ) : isOps ? (
          <table className="wms-ops-transfer-detail__table wms-ops-transfer-detail__table--shipment">
            <colgroup>
              <col style={{ width: '11.5rem' }} />
              <col style={{ width: '8.5rem' }} />
              <col style={{ width: '14rem' }} />
              <col style={{ width: '5.5rem' }} />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '7rem' }} />
              <col style={{ width: '7rem' }} />
              <col style={{ width: '9rem' }} />
              <col style={{ width: '9rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th>{t('shipment.list.orderNo')}</th>
                <th>{t('shipment.list.stockCode')}</th>
                <th>{t('shipment.list.stockName')}</th>
                <th className="wms-ops-transfer-detail__col--qty">
                  <span className="wms-ops-transfer-detail__th-stack">
                    <span>{t('shipment.list.orderQuantityLine1', { defaultValue: 'Sipariş' })}</span>
                    <span>{t('shipment.list.orderQuantityLine2', { defaultValue: 'Miktarı' })}</span>
                  </span>
                </th>
                <th>{t('shipment.details.configCode')}</th>
                <th>{t('shipment.list.serialNo')}</th>
                <th>{t('shipment.details.lotNo')}</th>
                <th>{t('shipment.details.batchNo')}</th>
                <th>{t('shipment.list.sourceWarehouse')}</th>
                <th>{t('shipment.list.targetWarehouse')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => (
                <ShipmentLineRow key={line.id} line={line} variant={variant} />
              ))}
            </tbody>
          </table>
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
              {filteredLines.map((line) => (
                <ShipmentLineRow key={line.id} line={line} variant={variant} />
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
        isOps && 'wms-ops-form wms-ops-detail-dialog border-0 shadow-none',
      )}>
        <DialogHeader className={cn(
          'shrink-0 border-b px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6 sm:pr-14',
          isOps && 'wms-ops-detail-dialog__header',
        )}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : 'text-xl'}>
                {t('shipment.list.detailTitle')}
                {isOps ? <span className="wms-ops-detail-dialog__id"> #{headerId}</span> : ` - #${headerId}`}
              </DialogTitle>
              <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
                {t('shipment.list.detailDescription')}
              </DialogDescription>
            </div>
            {isOps ? (
              <OpsActionButton
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => setMoveDialogOpen(true)}
                disabled={!packagePermission.canUpdate}
              >
                <PackagePlus className="size-3.5" aria-hidden />
                {t('shipment.detail.loadPallet')}
              </OpsActionButton>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveDialogOpen(true)}
                disabled={!packagePermission.canUpdate}
              >
                <PackagePlus className="mr-2 size-4" />
                {t('shipment.detail.loadPallet')}
              </Button>
            )}
          </div>
        </DialogHeader>

        {header ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:overflow-hidden">
            {renderInfoPanels()}
            {renderLinesSection()}
          </div>
        ) : (
          <div className={cn('flex-1 p-6', isOps && 'wms-ops-detail-state')}>
            <PageState tone="empty" title={t('shipment.list.noData')} compact />
          </div>
        )}
      </DialogContent>

      <PackageMoveToSourceDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        targetSourceType="SH"
        targetSourceHeaderId={headerId}
        targetLabel={t('shipment.detail.targetLabel', { number: headerId })}
        targetPackageStatus="Loaded"
        variant={isOps ? 'ops' : 'default'}
      />
    </Dialog>
  );
}

interface ShipmentLineRowProps {
  line: ShipmentLine;
  variant: 'default' | 'ops';
}

function ShipmentLineRow({ line, variant }: ShipmentLineRowProps): ReactElement {
  const { data: lineSerialsData } = useShipmentLineSerials(line.id);
  const isOps = variant === 'ops';

  const firstSerial = lineSerialsData?.data && lineSerialsData.data.length > 0 ? lineSerialsData.data[0] : null;
  const serialNo = firstSerial?.serialNo || '-';
  const lotNo = firstSerial?.serialNo3 || '-';
  const batchNo = firstSerial?.serialNo4 || '-';
  const sourceWarehouse = firstSerial?.sourceWarehouseName || firstSerial?.sourceWarehouseId?.toString() || '-';
  const targetWarehouse = firstSerial?.targetWarehouseName || firstSerial?.targetWarehouseId?.toString() || '-';

  if (isOps) {
    return (
      <tr>
        <td className="wms-ops-transfer-detail__col--order">
          <span className="wms-ops-transfer-detail__order-no">{line.erpOrderNo || '-'}</span>
        </td>
        <td className="wms-ops-transfer-detail__col--code">
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
        <Badge variant="secondary" className="font-mono text-xs">{line.erpOrderNo || '-'}</Badge>
      </TableCell>
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
