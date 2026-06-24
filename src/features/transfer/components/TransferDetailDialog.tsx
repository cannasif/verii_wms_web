import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus, Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsActionButton, OpsFieldShell, PageState } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
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
import { Button } from '@/components/ui/button';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PackageMoveToSourceDialog } from '@/features/package/components/PackageMoveToSourceDialog';
import { cn } from '@/lib/utils';

interface TransferDetailDialogProps {
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

export function TransferDetailDialog({
  headerId,
  isOpen,
  onClose,
  variant = 'ops',
}: TransferDetailDialogProps): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const packagePermission = useCrudPermission('wms.package');
  const { data: headersData } = useTransferHeaders();
  const { data: assignedData, isLoading: isLoadingLines } = useAssignedTransferOrderLines(headerId);
  const [searchQuery, setSearchQuery] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const isOps = variant === 'ops';

  const header = headersData?.data?.find((h) => h.id === headerId);

  const filteredLines = useMemo(() => {
    if (!assignedData?.data?.lines) return [];
    if (!searchQuery.trim()) return assignedData.data.lines;
    const query = searchQuery.toLowerCase();
    return assignedData.data.lines.filter((line) => (
      line.stockCode?.toLowerCase().includes(query)
      || line.stockName?.toLowerCase().includes(query)
      || line.yapKod?.toLowerCase().includes(query)
      || line.description?.toLowerCase().includes(query)
    ));
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

  const businessContextBadge = header?.businessContext === 'BilginogluHakEdis' ? (
    <span className="wms-ops-flag-badge wms-ops-flag-badge--warn">
      {t(`transfer.businessContext.${header.businessContextStep || 'BilginogluHakEdis'}`, {
        defaultValue: t('transfer.businessContext.BilginogluHakEdis'),
      })}
    </span>
  ) : null;

  const renderInfoPanels = (): ReactElement => {
    if (!header) return <></>;

    if (isOps) {
      return (
        <div className="mb-6 grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('transfer.list.documentInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('transfer.list.id')}>{header.id}</OpsDetailRow>
              <OpsDetailRow label={t('transfer.list.documentNo')}>{header.documentNo || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('transfer.list.documentDate')}>{formatDate(header.documentDate)}</OpsDetailRow>
              <OpsDetailRow label={t('transfer.list.documentType')}>
                <span className="wms-ops-code-badge">{header.documentType || '-'}</span>
              </OpsDetailRow>
              {businessContextBadge ? (
                <OpsDetailRow label={t('transfer.businessContext.label')}>{businessContextBadge}</OpsDetailRow>
              ) : null}
              <OpsDetailRow label={t('transfer.list.createdDate')}>{formatDateTime(header.createdDate)}</OpsDetailRow>
            </div>
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('transfer.list.customerInfo')}</h3>
            <div className="wms-ops-detail-panel--rows">
              <OpsDetailRow label={t('transfer.list.customerCode')}>{header.customerCode || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('transfer.list.customerName')}>{header.customerName || '-'}</OpsDetailRow>
            </div>
            {header.description1 ? (
              <div className="wms-ops-detail-panel__body">
                <div className="wms-ops-detail-row__label mb-2">{t('transfer.step1.notes')}</div>
                <p className="text-sm leading-6 break-words opacity-90">{header.description1}</p>
              </div>
            ) : null}
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('transfer.list.warehouseInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('transfer.list.sourceWarehouse')}>{header.sourceWarehouse || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('transfer.list.targetWarehouse')}>{header.targetWarehouse || '-'}</OpsDetailRow>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('transfer.list.documentInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.id')}</span>
                <span className="text-sm font-semibold">{header.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.documentNo')}</span>
                <span className="text-sm font-medium">{header.documentNo || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.documentDate')}</span>
                <span className="text-sm">{formatDate(header.documentDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.documentType')}</span>
                <Badge variant="outline" className="text-xs">
                  {header.documentType || '-'}
                </Badge>
              </div>
              {businessContextBadge ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{t('transfer.businessContext.label')}</span>
                  {businessContextBadge}
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.createdDate')}</span>
                <span className="text-xs">{formatDateTime(header.createdDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('transfer.list.customerInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.customerCode')}</span>
                <span className="text-sm font-medium">{header.customerCode || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.customerName')}</span>
                <span className="text-sm truncate max-w-[150px] text-right">{header.customerName || '-'}</span>
              </div>
            </div>
            {header.description1 ? (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {t('transfer.step1.notes')}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{header.description1}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('transfer.list.warehouseInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.sourceWarehouse')}</span>
                <span className="text-sm font-medium">{header.sourceWarehouse || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('transfer.list.targetWarehouse')}</span>
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
          {t('transfer.list.lines')}
        </h3>
        {isOps ? (
          <OpsFieldShell className="wms-ops-detail-search">
            <Search className="wms-ops-detail-search__icon size-4" aria-hidden />
            <Input
              placeholder={t('transfer.step2.searchItems')}
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
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('transfer.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-7 pr-9 h-7 text-xs"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
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
          <PageState tone="empty" title={t('transfer.list.noData')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />
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
                <th>{t('transfer.list.stockCode')}</th>
                <th>{t('transfer.list.stockName')}</th>
                <th className="wms-ops-transfer-detail__col--qty">
                  <span className="wms-ops-transfer-detail__th-stack">
                    <span>{t('transfer.orderDetails.orderQuantityLine1')}</span>
                    <span>{t('transfer.orderDetails.orderQuantityLine2')}</span>
                  </span>
                </th>
                <th>{t('transfer.details.configCode')}</th>
                <th>{t('transfer.list.serialNo')}</th>
                <th>{t('transfer.details.lotNo')}</th>
                <th>{t('transfer.details.batchNo')}</th>
                <th>{t('transfer.list.sourceWarehouse')}</th>
                <th>{t('transfer.list.targetWarehouse')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line: AssignedTransferLine) => (
                <TransferLineRow
                  key={line.id}
                  line={line}
                  serials={serialsByLineId[line.id] || []}
                  variant={variant}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('transfer.list.stockCode')}</TableHead>
                <TableHead>{t('transfer.list.stockName')}</TableHead>
                <TableHead className="w-[120px]">{t('transfer.orderDetails.orderQuantity')}</TableHead>
                <TableHead className="w-[100px]">{t('transfer.details.configCode')}</TableHead>
                <TableHead className="w-[120px]">{t('transfer.list.serialNo')}</TableHead>
                <TableHead className="w-[120px]">{t('transfer.details.lotNo')}</TableHead>
                <TableHead className="w-[120px]">{t('transfer.details.batchNo')}</TableHead>
                <TableHead className="w-[120px]">{t('transfer.list.sourceWarehouse')}</TableHead>
                <TableHead className="w-[120px]">{t('transfer.list.targetWarehouse')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLines.map((line: AssignedTransferLine) => (
                <TransferLineRow
                  key={line.id}
                  line={line}
                  serials={serialsByLineId[line.id] || []}
                  variant={variant}
                />
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
        isOps && 'wms-ops-form wms-ops-detail-dialog wms-ops-transfer-detail-dialog border-0 shadow-none',
      )}>
        <DialogHeader className={cn(
          'shrink-0 border-b px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6 sm:pr-14',
          isOps && 'wms-ops-detail-dialog__header',
        )}>
          <div className="flex w-full flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : 'text-xl'}>
                {t('transfer.list.detailTitle')}
                {isOps ? <span className="wms-ops-detail-dialog__id"> #{headerId}</span> : ` - #${headerId}`}
              </DialogTitle>
              <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
                {t('transfer.list.detailDescription')}
              </DialogDescription>
            </div>
            {isOps ? (
              <div className="wms-ops-detail-dialog__header-actions shrink-0">
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setMoveDialogOpen(true)}
                  disabled={!packagePermission.canUpdate}
                >
                  <PackagePlus className="size-3.5" aria-hidden />
                  {t('transfer:detail.movePackage')}
                </OpsActionButton>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveDialogOpen(true)}
                disabled={!packagePermission.canUpdate}
              >
                <PackagePlus className="mr-2 size-4" />
                {t('transfer:detail.movePackage')}
              </Button>
            )}
          </div>
        </DialogHeader>

        {header ? (
          <div className="wms-ops-transfer-detail__body flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:overflow-hidden">
            {renderInfoPanels()}
            {renderLinesSection()}
          </div>
        ) : (
          <div className={cn('flex-1 p-6', isOps && 'wms-ops-detail-state')}>
            <PageState tone="empty" title={t('transfer.list.noData')} compact />
          </div>
        )}
      </DialogContent>

      <PackageMoveToSourceDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        targetSourceType="WT"
        targetSourceHeaderId={headerId}
        targetLabel={t('transfer.detail.targetLabel', { number: headerId })}
        targetPackageStatus="Transferred"
      />
    </Dialog>
  );
}

interface TransferLineRowProps {
  line: AssignedTransferLine;
  serials: AssignedTransferLineSerial[];
  variant: 'default' | 'ops';
}

function TransferLineRow({ line, serials, variant }: TransferLineRowProps): ReactElement {
  const firstSerial = serials.length > 0 ? serials[0] : null;
  const serialNo = firstSerial?.serialNo || '-';
  const lotNo = firstSerial?.serialNo3 || '-';
  const batchNo = firstSerial?.serialNo4 || '-';
  const sourceWarehouse = firstSerial?.sourceWarehouseName || firstSerial?.sourceWarehouseId?.toString() || '-';
  const targetWarehouse = firstSerial?.targetWarehouseName || firstSerial?.targetWarehouseId?.toString() || '-';
  const isOps = variant === 'ops';

  if (isOps) {
    return (
      <tr>
        <td>
          <span className="wms-ops-transfer-detail__stock-code">{line.stockCode}</span>
        </td>
        <td>
          <span className="wms-ops-transfer-detail__stock-name">{line.stockName || '-'}</span>
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
        <Badge variant="outline" className="font-mono text-xs">
          {line.stockCode}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">{line.stockName || '-'}</span>
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
