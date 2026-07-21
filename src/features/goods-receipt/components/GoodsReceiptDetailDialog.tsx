import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { PageState } from '@/components/shared';
import { OpsActionButton } from '@/components/shared/OpsActionButton';
import { OpsFieldShell } from '@/components/shared/OpsFieldShell';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useGrHeaderDetail } from '../hooks/useGrHeaderDetail';
import { useGrLines } from '../hooks/useGrLines';
import { useGrImportLinesWithRoutes } from '../hooks/useGrImportLinesWithRoutes';
import type { GrLine, GrImportLine } from '../types/goods-receipt';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface GoodsReceiptDetailDialogProps {
  grHeaderId: number;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'default' | 'ops';
}

const ELECTRONIC_DISPATCH_DOCUMENT_TYPE = 'E-IRSALIYE';
const ELECTRONIC_DISPATCH_DOCUMENT_TYPE_ALTERNATE = 'E-INVOICE';

const normalizeDocumentType = (value: string | null | undefined): string =>
  (value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'I')
    .toUpperCase();

const isElectronicDispatchDocumentType = (documentType: string | null | undefined): boolean => {
  const normalized = normalizeDocumentType(documentType);
  return normalized === ELECTRONIC_DISPATCH_DOCUMENT_TYPE || normalized === ELECTRONIC_DISPATCH_DOCUMENT_TYPE_ALTERNATE;
};

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

interface OpsDetailFieldProps {
  label: string;
  children: ReactNode;
  wide?: boolean;
}

function OpsDetailField({ label, children, wide = false }: OpsDetailFieldProps): ReactElement {
  return (
    <div className={cn('wms-ops-detail-field', wide && 'wms-ops-detail-field--wide')}>
      <span className="wms-ops-detail-field__label">{label}</span>
      <span className="wms-ops-detail-field__value">{children}</span>
    </div>
  );
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

interface OpsFlagBadgeProps {
  value: boolean;
  tone?: 'default' | 'warn';
}

function OpsFlagBadge({ value, tone = 'default' }: OpsFlagBadgeProps): ReactElement {
  const { t } = useTranslation('common');
  return (
    <span
      className={cn(
        'wms-ops-flag-badge',
        value
          ? tone === 'warn'
            ? 'wms-ops-flag-badge--warn'
            : 'wms-ops-flag-badge--on'
          : 'wms-ops-flag-badge--off',
      )}
    >
      {value ? t('common.yes') : t('common.no')}
    </span>
  );
}

interface ImportLineDetailDialogProps {
  importLine: GrImportLine | null;
  orderLine: GrLine | null;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'default' | 'ops';
}

function ImportLineDetailDialog({
  importLine,
  orderLine,
  isOpen,
  onClose,
  variant = 'ops',
}: ImportLineDetailDialogProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const isOps = variant === 'ops';

  if (!importLine) return <></>;

  const totalImportQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
  const warehouses = Array.from(
    new Set(importLine.routes.map((route) => route.targetWarehouse).filter((wh): wh is number => wh !== null)),
  );
  const stockName = importLine.routes.find((route) => route.stockName)?.stockName
    || importLine.stockName
    || importLine.description1
    || importLine.stockCode;
  const joinRouteValues = (selector: (route: GrImportLine['routes'][number]) => string | number | null | undefined): string => {
    const values = importLine.routes
      .map(selector)
      .filter((value): value is string | number => value !== null && value !== undefined && String(value).trim() !== '')
      .map(String);
    return Array.from(new Set(values)).join(', ') || '-';
  };

  const orderRows = orderLine
    ? [
        { label: t('goodsReceipt.report.stockCode'), value: orderLine.stockCode },
        { label: t('goodsReceipt.report.description'), value: orderLine.description },
        { label: t('goodsReceipt.report.quantity'), value: `${orderLine.quantity} ${orderLine.unit}` },
        {
          label: t('goodsReceipt.orderDetails.orderQuantity'),
          value: `${orderLine.siparisMiktar ?? orderLine.quantity} ${orderLine.unit}`,
        },
        { label: t('goodsReceipt.report.unit'), value: orderLine.unit },
        { label: t('goodsReceipt.report.erpOrderNo'), value: orderLine.erpOrderNo },
        { label: t('goodsReceipt.report.erpOrderId'), value: orderLine.erpOrderId },
        { label: t('goodsReceipt.report.createdDate'), value: formatDateTime(orderLine.createdDate) },
        { label: t('goodsReceipt.report.createdBy'), value: orderLine.createdByFullUser || '-' },
      ]
    : [];

  const importRows = [
    { label: t('goodsReceipt.report.stockCode'), value: importLine.stockCode },
    { label: t('goodsReceipt.report.stockName'), value: stockName || '-' },
    { label: t('goodsReceipt.report.description2'), value: importLine.description2 || '-' },
    {
      label: t('goodsReceipt.report.totalImportQuantity'),
      value: warehouses.length > 0
        ? `${totalImportQuantity} (${t('goodsReceipt.report.targetWarehouse')}: ${warehouses.join(', ')})`
        : String(totalImportQuantity),
      strong: true,
    },
    { label: t('barcodeManagement.barcode'), value: joinRouteValues((route) => route.scannedBarcode) },
    { label: t('goodsReceipt.details.serialNo'), value: joinRouteValues((route) => route.serialNo) },
    { label: t('goodsReceipt.details.lotNo'), value: joinRouteValues((route) => route.serialNo2) },
    { label: t('goodsReceipt.details.batchNo'), value: joinRouteValues((route) => route.serialNo3) },
    { label: t('goodsReceipt.details.configCode'), value: joinRouteValues((route) => route.serialNo4) },
    { label: t('warehouse.details.targetCellCode'), value: joinRouteValues((route) => route.targetCellCode) },
    { label: t('goodsReceipt.report.createdDate'), value: formatDateTime(importLine.createdDate) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          isOps
            ? 'wms-ops-form wms-ops-detail-dialog max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-none'
            : 'max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0',
        )}
      >
        <DialogHeader
          className={cn(
            'px-6 pt-5 pb-4 border-b shrink-0',
            isOps && 'wms-ops-detail-dialog__header',
          )}
        >
          <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : 'text-xl'}>
            {t('goodsReceipt.report.importLineDetail')}
          </DialogTitle>
          <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
            {stockName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
          <Tabs defaultValue="order" className="w-full">
            <TabsList className={cn('w-full justify-start', isOps && 'wms-ops-detail-main-tabs')}>
              <TabsTrigger value="order" className={isOps ? 'wms-ops-detail-main-tab' : undefined}>
                {t('goodsReceipt.report.orderInfo')}
              </TabsTrigger>
              <TabsTrigger value="import" className={isOps ? 'wms-ops-detail-main-tab' : undefined}>
                {t('goodsReceipt.report.importInfo')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="mt-4">
              {isOps ? (
                orderLine ? (
                  <div className="wms-ops-detail-panel wms-ops-detail-panel--rows">
                    {orderRows.map((row) => (
                      <OpsDetailRow key={row.label} label={row.label}>
                        {row.value}
                      </OpsDetailRow>
                    ))}
                  </div>
                ) : (
                  <div className="wms-ops-detail-empty">{t('goodsReceipt.report.noOrderInfo')}</div>
                )
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    {orderLine ? (
                      <Table>
                        <TableBody>
                          {orderRows.map((row) => (
                            <TableRow key={row.label}>
                              <TableHead className="w-1/3">{row.label}</TableHead>
                              <TableCell>{row.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <PageState tone="empty" title={t('goodsReceipt.report.noOrderInfo')} compact />
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="import" className="mt-4">
              {isOps ? (
                <div className="wms-ops-detail-panel wms-ops-detail-panel--rows">
                  {importRows.map((row) => (
                    <OpsDetailRow key={row.label} label={row.label}>
                      {row.strong ? <span className="font-semibold">{row.value}</span> : row.value}
                    </OpsDetailRow>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableBody>
                        {importRows.map((row) => (
                          <TableRow key={row.label}>
                            <TableHead className="w-1/3">{row.label}</TableHead>
                            <TableCell className={row.strong ? 'font-semibold' : undefined}>{row.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GoodsReceiptDetailDialog({
  grHeaderId,
  isOpen,
  onClose,
  variant = 'ops',
}: GoodsReceiptDetailDialogProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const isOps = variant === 'ops';
  const { data, isLoading, error } = useGrHeaderDetail(grHeaderId);
  const { data: grLines } = useGrLines(grHeaderId);
  const { data: grImportLines } = useGrImportLinesWithRoutes(grHeaderId);
  const [selectedImportLine, setSelectedImportLine] = useState<GrImportLine | null>(null);
  const [isImportLineDialogOpen, setIsImportLineDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImportLineClick = (importLine: GrImportLine): void => {
    setSelectedImportLine(importLine);
    setIsImportLineDialogOpen(true);
  };

  const getOrderLineForImportLine = (importLine: GrImportLine): GrLine | null => {
    if (!grLines) return null;
    return grLines.find((line) => line.id === importLine.lineId) || null;
  };

  const getImportLineStockName = (importLine: GrImportLine): string => {
    const routeWithStockName = importLine.routes.find((route) => route.stockName);
    return routeWithStockName?.stockName || importLine.stockName || importLine.description1 || importLine.stockCode;
  };

  const getImportLineMessage = (importLine: GrImportLine, orderLine: GrLine | null): string => {
    if (!orderLine) {
      const totalQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
      return t('detail.missingOrderInfo', { quantity: totalQuantity, stockCode: importLine.stockCode });
    }
    const totalImportQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
    return t('detail.quantitySummary', {
      orderQuantity: orderLine.quantity,
      importQuantity: totalImportQuantity,
      unit: orderLine.unit,
    });
  };

  const filteredImportLines = useMemo(() => {
    if (!grImportLines) return [];
    if (!searchQuery.trim()) return grImportLines;

    const query = searchQuery.toLowerCase();
    return grImportLines.filter((importLine) => {
      const stockCode = importLine.stockCode.toLowerCase();
      const routeWithStockName = importLine.routes.find((route) => route.stockName);
      const stockName = (routeWithStockName?.stockName || importLine.stockName || importLine.description1 || importLine.stockCode).toLowerCase();
      return stockCode.includes(query) || stockName.includes(query);
    });
  }, [grImportLines, searchQuery]);

  const filteredOrderLines = useMemo(() => {
    if (!grLines) return [];
    if (!searchQuery.trim()) return grLines;

    const query = searchQuery.toLowerCase();
    return grLines.filter((line) => {
      const stockCode = (line.stockCode || '').toLowerCase();
      const description = (line.description || '').toLowerCase();
      const erpOrderNo = (line.erpOrderNo || '').toLowerCase();
      return stockCode.includes(query) || description.includes(query) || erpOrderNo.includes(query);
    });
  }, [grLines, searchQuery]);

  const renderHeaderInfoOps = (): ReactElement => (
    <div className="wms-ops-detail-panel">
      <div className="wms-ops-detail-grid">
        <OpsDetailField label={t('goodsReceipt.report.orderId')}>{data?.orderId || '-'}</OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.documentNo')}>{data?.documentNo || '-'}</OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.customerCode')}>
          {data?.customerName && data?.customerCode ? `${data.customerName} (${data.customerCode})` : data?.customerName || data?.customerCode || '-'}
        </OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.projectCode')}>{data?.projectCode || '-'}</OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.documentType')}>
          <Badge
            variant="outline"
            className={cn(
              'wms-ops-code-badge',
              isElectronicDispatchDocumentType(data?.documentType) && 'opacity-90',
            )}
          >
            {data?.documentType || '-'}
          </Badge>
        </OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.plannedDate')}>{formatDate(data?.plannedDate ?? null)}</OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.branchCode')}>{data?.branchCode || '-'}</OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.yearCode')}>{data?.yearCode || '-'}</OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.isPlanned')}>
          <OpsFlagBadge value={Boolean(data?.isPlanned)} />
        </OpsDetailField>
        <OpsDetailField label={t('goodsReceipt.report.priorityLevel')}>{data?.priorityLevel ?? '-'}</OpsDetailField>
        {data?.description1 ? (
          <OpsDetailField label={t('goodsReceipt.report.description1')} wide>
            {data.description1}
          </OpsDetailField>
        ) : null}
        {data?.description2 ? (
          <OpsDetailField label={t('goodsReceipt.report.description2')} wide>
            {data.description2}
          </OpsDetailField>
        ) : null}
      </div>
    </div>
  );

  const renderHeaderInfoDefault = (): ReactElement => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.orderId')}: </span>
            <span className="font-semibold">{data?.orderId || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.customerCode')}: </span>
            <span className="font-semibold">
              {data?.customerName && data?.customerCode ? `${data.customerName} (${data.customerCode})` : data?.customerName || data?.customerCode || '-'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.documentNo')}: </span>
            <span className="font-semibold">{data?.documentNo || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.projectCode')}: </span>
            <span className="font-semibold">{data?.projectCode || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.documentType')}: </span>
            <Badge
              variant={isElectronicDispatchDocumentType(data?.documentType) ? 'secondary' : 'default'}
              className="ml-1"
            >
              {data?.documentType || '-'}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.plannedDate')}: </span>
            <span className="font-semibold">{formatDate(data?.plannedDate ?? null)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.branchCode')}: </span>
            <span className="font-semibold">{data?.branchCode || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.yearCode')}: </span>
            <span className="font-semibold">{data?.yearCode || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.isPlanned')}: </span>
            <Badge variant={data?.isPlanned ? 'default' : 'outline'} className="ml-1">
              {data?.isPlanned ? t('common.yes') : t('common.no')}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">{t('goodsReceipt.report.priorityLevel')}: </span>
            <span className="font-semibold">{data?.priorityLevel}</span>
          </div>
          {data?.description1 ? (
            <div className="col-span-3">
              <span className="text-muted-foreground">{t('goodsReceipt.report.description1')}: </span>
              <span>{data.description1}</span>
            </div>
          ) : null}
          {data?.description2 ? (
            <div className="col-span-3">
              <span className="text-muted-foreground">{t('goodsReceipt.report.description2')}: </span>
              <span>{data.description2}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  const renderStatusPanelOps = (): ReactElement => (
    <div className="wms-ops-detail-panel wms-ops-detail-panel--rows">
      <OpsDetailRow label={t('goodsReceipt.report.isCompleted')}>
        <OpsFlagBadge value={Boolean(data?.isCompleted)} />
      </OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.completionDate')}>
        {formatDate(data?.completionDate ?? null)}
      </OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.isPendingApproval')}>
        <OpsFlagBadge value={Boolean(data?.isPendingApproval)} tone="warn" />
      </OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.approvalStatus')}>
        {data?.approvalStatus !== null && data?.approvalStatus !== undefined ? (
          <span className={cn('wms-ops-flag-badge', data.approvalStatus ? 'wms-ops-flag-badge--on' : 'wms-ops-flag-badge--danger')}>
            {data.approvalStatus ? t('goodsReceipt.report.approved') : t('goodsReceipt.report.rejected')}
          </span>
        ) : (
          '-'
        )}
      </OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.approvedBy')}>{data?.approvedByUserId || '-'}</OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.approvalDate')}>{formatDateTime(data?.approvalDate ?? null)}</OpsDetailRow>
    </div>
  );

  const renderErpPanelOps = (): ReactElement => (
    <div className="wms-ops-detail-panel wms-ops-detail-panel--rows">
      <OpsDetailRow label={t('goodsReceipt.report.isERPIntegrated')}>
        <OpsFlagBadge value={Boolean(data?.isERPIntegrated)} />
      </OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.erpReferenceNumber')}>{data?.erpReferenceNumber || '-'}</OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.erpIntegrationDate')}>{formatDateTime(data?.erpIntegrationDate ?? null)}</OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.erpIntegrationStatus')}>{data?.erpIntegrationStatus || '-'}</OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.erpErrorMessage')}>
        {data?.erpErrorMessage ? (
          <span className="text-destructive">{data.erpErrorMessage}</span>
        ) : (
          '-'
        )}
      </OpsDetailRow>
    </div>
  );

  const renderAdditionalPanelOps = (): ReactElement => (
    <div className="wms-ops-detail-panel wms-ops-detail-panel--rows">
      <OpsDetailRow label={t('goodsReceipt.report.returnCode')}>
        <OpsFlagBadge value={Boolean(data?.returnCode)} />
      </OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.ocrSource')}>
        <OpsFlagBadge value={Boolean(data?.ocrSource)} />
      </OpsDetailRow>
      {data?.description3 ? (
        <OpsDetailRow label={t('goodsReceipt.report.description3')}>{data.description3}</OpsDetailRow>
      ) : null}
      {data?.description4 ? (
        <OpsDetailRow label={t('goodsReceipt.report.description4')}>{data.description4}</OpsDetailRow>
      ) : null}
      {data?.description5 ? (
        <OpsDetailRow label={t('goodsReceipt.report.description5')}>{data.description5}</OpsDetailRow>
      ) : null}
    </div>
  );

  const renderAuditPanelOps = (): ReactElement => (
    <div className="wms-ops-detail-panel wms-ops-detail-panel--rows">
      <OpsDetailRow label={t('goodsReceipt.report.createdBy')}>{data?.createdByFullUser || '-'}</OpsDetailRow>
      <OpsDetailRow label={t('goodsReceipt.report.createdDate')}>{formatDateTime(data?.createdDate ?? null)}</OpsDetailRow>
      {data?.updatedByFullUser ? (
        <OpsDetailRow label={t('goodsReceipt.report.updatedBy')}>{data.updatedByFullUser}</OpsDetailRow>
      ) : null}
      {data?.updatedDate ? (
        <OpsDetailRow label={t('goodsReceipt.report.updatedDate')}>{formatDateTime(data.updatedDate)}</OpsDetailRow>
      ) : null}
    </div>
  );

  const renderSubTabs = (): ReactElement => (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className={cn('w-full', isOps ? 'wms-ops-detail-subtabs' : undefined)}>
        <TabsTrigger value="status" className={isOps ? 'wms-ops-detail-subtab' : undefined}>
          {t('goodsReceipt.report.statusInfo')}
        </TabsTrigger>
        <TabsTrigger value="erp" className={isOps ? 'wms-ops-detail-subtab' : undefined}>
          {t('goodsReceipt.report.erpInfo')}
        </TabsTrigger>
        <TabsTrigger value="additional" className={isOps ? 'wms-ops-detail-subtab' : undefined}>
          {t('goodsReceipt.report.additionalInfo')}
        </TabsTrigger>
        <TabsTrigger value="audit" className={isOps ? 'wms-ops-detail-subtab' : undefined}>
          {t('goodsReceipt.report.auditInfo')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="mt-4">
        {isOps ? renderStatusPanelOps() : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="w-1/3 md:w-1/4">{t('goodsReceipt.report.isCompleted')}</TableHead>
                    <TableCell>
                      <Badge variant={data?.isCompleted ? 'default' : 'outline'}>
                        {data?.isCompleted ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.completionDate')}</TableHead>
                    <TableCell>{formatDate(data?.completionDate ?? null)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.isPendingApproval')}</TableHead>
                    <TableCell>
                      <Badge variant={data?.isPendingApproval ? 'secondary' : 'outline'}>
                        {data?.isPendingApproval ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.approvalStatus')}</TableHead>
                    <TableCell>
                      {data?.approvalStatus !== null && data?.approvalStatus !== undefined ? (
                        <Badge variant={data.approvalStatus ? 'default' : 'destructive'}>
                          {data.approvalStatus ? t('goodsReceipt.report.approved') : t('goodsReceipt.report.rejected')}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.approvedBy')}</TableHead>
                    <TableCell>{data?.approvedByUserId || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.approvalDate')}</TableHead>
                    <TableCell>{formatDateTime(data?.approvalDate ?? null)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="erp" className="mt-4">
        {isOps ? renderErpPanelOps() : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="w-1/3 md:w-1/4">{t('goodsReceipt.report.isERPIntegrated')}</TableHead>
                    <TableCell>
                      <Badge variant={data?.isERPIntegrated ? 'default' : 'outline'}>
                        {data?.isERPIntegrated ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.erpReferenceNumber')}</TableHead>
                    <TableCell>{data?.erpReferenceNumber || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.erpIntegrationDate')}</TableHead>
                    <TableCell>{formatDateTime(data?.erpIntegrationDate ?? null)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.erpIntegrationStatus')}</TableHead>
                    <TableCell>{data?.erpIntegrationStatus || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.erpErrorMessage')}</TableHead>
                    <TableCell>
                      {data?.erpErrorMessage ? (
                        <span className="text-destructive text-sm">{data.erpErrorMessage}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="additional" className="mt-4">
        {isOps ? renderAdditionalPanelOps() : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="w-1/3 md:w-1/4">{t('goodsReceipt.report.returnCode')}</TableHead>
                    <TableCell>
                      <Badge variant={data?.returnCode ? 'secondary' : 'outline'}>
                        {data?.returnCode ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.ocrSource')}</TableHead>
                    <TableCell>
                      <Badge variant={data?.ocrSource ? 'secondary' : 'outline'}>
                        {data?.ocrSource ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {data?.description3 ? (
                    <TableRow>
                      <TableHead>{t('goodsReceipt.report.description3')}</TableHead>
                      <TableCell>{data.description3}</TableCell>
                    </TableRow>
                  ) : null}
                  {data?.description4 ? (
                    <TableRow>
                      <TableHead>{t('goodsReceipt.report.description4')}</TableHead>
                      <TableCell>{data.description4}</TableCell>
                    </TableRow>
                  ) : null}
                  {data?.description5 ? (
                    <TableRow>
                      <TableHead>{t('goodsReceipt.report.description5')}</TableHead>
                      <TableCell>{data.description5}</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="audit" className="mt-4">
        {isOps ? renderAuditPanelOps() : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="w-1/3 md:w-1/4">{t('goodsReceipt.report.createdBy')}</TableHead>
                    <TableCell>{data?.createdByFullUser || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>{t('goodsReceipt.report.createdDate')}</TableHead>
                    <TableCell>{formatDateTime(data?.createdDate ?? null)}</TableCell>
                  </TableRow>
                  {data?.updatedByFullUser ? (
                    <TableRow>
                      <TableHead>{t('goodsReceipt.report.updatedBy')}</TableHead>
                      <TableCell>{data.updatedByFullUser}</TableCell>
                    </TableRow>
                  ) : null}
                  {data?.updatedDate ? (
                    <TableRow>
                      <TableHead>{t('goodsReceipt.report.updatedDate')}</TableHead>
                      <TableCell>{formatDateTime(data.updatedDate)}</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );

  const renderContentTab = (): ReactElement => (
    <div className="space-y-4">
      {isOps ? (
        <OpsFieldShell className="wms-ops-detail-search">
          <Search className="wms-ops-detail-search__icon size-4" aria-hidden />
          <Input
            placeholder={t('goodsReceipt.report.searchContent')}
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
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('goodsReceipt.report.searchContent')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-8 pr-10"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <VoiceSearchButton onResult={setSearchQuery} size="sm" variant="ghost" />
          </div>
        </div>
      )}

      {filteredImportLines.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          className={cn('w-full', isOps && 'wms-ops-detail-accordion')}
        >
          {filteredImportLines.map((importLine) => {
            const orderLine = getOrderLineForImportLine(importLine);
            const message = getImportLineMessage(importLine, orderLine);
            const totalQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
            const warehouses = Array.from(
              new Set(importLine.routes.map((route) => route.targetWarehouse).filter((wh): wh is number => wh !== null)),
            );

            return (
              <AccordionItem key={importLine.id} value={`item-${importLine.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  {isOps ? (
                    <div className="wms-ops-detail-accordion__head">
                      <span className="wms-ops-code-badge">{importLine.stockCode}</span>
                      <span className="wms-ops-detail-accordion__title">{getImportLineStockName(importLine)}</span>
                      {orderLine ? (
                        <span className="wms-ops-code-badge">
                          {orderLine.quantity} {orderLine.unit}
                        </span>
                      ) : null}
                      <span className="wms-ops-code-badge">
                        {totalQuantity} {orderLine?.unit || ''}
                      </span>
                      {warehouses.length > 0 ? (
                        <span className="wms-ops-detail-accordion__meta">
                          {t('goodsReceipt.report.warehouse')}: {warehouses.join(', ')}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <Badge>{importLine.stockCode}</Badge>
                        <span className="font-medium">{getImportLineStockName(importLine)}</span>
                        {orderLine ? (
                          <Badge variant="secondary" className="text-xs">
                            {orderLine.quantity} {orderLine.unit}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="text-xs">
                          {totalQuantity} {orderLine?.unit || ''}
                        </Badge>
                        {warehouses.length > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {t('goodsReceipt.report.warehouse')}: {warehouses.join(', ')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 space-y-3">
                    <p className={cn('text-sm', isOps ? 'wms-ops-detail-accordion__meta' : 'text-muted-foreground')}>
                      {message}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {orderLine ? (
                        <>
                          <div>
                            <span className={isOps ? 'wms-ops-detail-field__label' : 'text-muted-foreground'}>
                              {t('goodsReceipt.report.erpOrderNo')}:{' '}
                            </span>
                            <span className={isOps ? 'font-mono text-xs' : undefined}>{orderLine.erpOrderNo}</span>
                          </div>
                          <div>
                            <span className={isOps ? 'wms-ops-detail-field__label' : 'text-muted-foreground'}>
                              {t('goodsReceipt.report.description')}:{' '}
                            </span>
                            <span>{orderLine.description}</span>
                          </div>
                        </>
                      ) : null}
                      <div>
                        <span className={isOps ? 'wms-ops-detail-field__label' : 'text-muted-foreground'}>
                          {t('goodsReceipt.report.totalImportQuantity')}:{' '}
                        </span>
                        <span className="font-semibold">{totalQuantity}</span>
                      </div>
                      {warehouses.length > 0 ? (
                        <div>
                          <span className={isOps ? 'wms-ops-detail-field__label' : 'text-muted-foreground'}>
                            {t('goodsReceipt.report.targetWarehouse')}:{' '}
                          </span>
                          <span>{warehouses.join(', ')}</span>
                        </div>
                      ) : null}
                    </div>
                    {isOps ? (
                      <OpsActionButton
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => handleImportLineClick(importLine)}
                      >
                        {t('common.details')}
                      </OpsActionButton>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImportLineClick(importLine)}
                        className="w-full"
                      >
                        {t('common.details')}
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        filteredOrderLines.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            className={cn('w-full', isOps && 'wms-ops-detail-accordion')}
          >
            {filteredOrderLines.map((line) => (
              <AccordionItem key={line.id} value={`line-${line.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  {isOps ? (
                    <div className="wms-ops-detail-accordion__head">
                      <span className="wms-ops-code-badge">{line.stockCode || '-'}</span>
                      <span className="wms-ops-detail-accordion__title">{line.description || '-'}</span>
                      <span className="wms-ops-code-badge">{line.quantity} {line.unit || ''}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-left">
                      <Badge>{line.stockCode || '-'}</Badge>
                      <span className="font-medium">{line.description || '-'}</span>
                      <Badge variant="outline" className="text-xs">{line.quantity} {line.unit || ''}</Badge>
                    </div>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className={cn('grid gap-3 text-sm', isOps ? 'wms-ops-detail-panel wms-ops-detail-panel--rows' : 'grid-cols-2')}>
                    {isOps ? (
                      <>
                        <OpsDetailRow label={t('goodsReceipt.report.stockCode')}>{line.stockCode || '-'}</OpsDetailRow>
                        <OpsDetailRow label={t('goodsReceipt.report.description')}>{line.description || '-'}</OpsDetailRow>
                        <OpsDetailRow label={t('goodsReceipt.report.quantity')}>{line.quantity} {line.unit || ''}</OpsDetailRow>
                        <OpsDetailRow label={t('goodsReceipt.report.erpOrderNo')}>{line.erpOrderNo || '-'}</OpsDetailRow>
                        <OpsDetailRow label={t('goodsReceipt.report.erpOrderId')}>{line.erpOrderId || '-'}</OpsDetailRow>
                      </>
                    ) : (
                      <>
                        <div>{t('goodsReceipt.report.stockCode')}: {line.stockCode || '-'}</div>
                        <div>{t('goodsReceipt.report.quantity')}: {line.quantity} {line.unit || ''}</div>
                        <div>{t('goodsReceipt.report.erpOrderNo')}: {line.erpOrderNo || '-'}</div>
                        <div>{t('goodsReceipt.report.erpOrderId')}: {line.erpOrderId || '-'}</div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className={isOps ? 'wms-ops-detail-empty' : 'flex items-center justify-center py-12'}>
            <p className={isOps ? undefined : 'text-muted-foreground'}>
              {searchQuery ? t('goodsReceipt.report.noSearchResults') : t('goodsReceipt.report.noImportLines')}
            </p>
          </div>
        )
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            isOps
              ? 'wms-ops-form wms-ops-detail-dialog max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-none'
              : 'max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0',
          )}
        >
          <DialogHeader
            className={cn(
              'px-6 pt-5 pb-4 border-b shrink-0',
              isOps && 'wms-ops-detail-dialog__header',
            )}
          >
            <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : 'text-xl'}>
              {t('goodsReceipt.report.detailTitle')}
              {isOps ? (
                <span className="wms-ops-detail-dialog__id"> #{grHeaderId}</span>
              ) : (
                <> - #{grHeaderId}</>
              )}
            </DialogTitle>
            <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
              {t('goodsReceipt.report.detailDescription')}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className={cn('flex-1 p-6', isOps && 'wms-ops-detail-state')}>
              <PageState tone="loading" title={t('common.loading')} compact className="h-full" />
            </div>
          ) : null}

          {error ? (
            <div className={cn('flex-1 p-6', isOps && 'wms-ops-detail-state')}>
              <PageState tone="error" title={t('goodsReceipt.report.detailError')} compact className="h-full" />
            </div>
          ) : null}

          {data ? (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Tabs defaultValue="info" className="flex h-full min-h-0 w-full flex-col gap-0">
                <div className="shrink-0 px-6 pt-4">
                  <TabsList className={cn('w-full', isOps && 'wms-ops-detail-main-tabs')}>
                    <TabsTrigger value="info" className={isOps ? 'wms-ops-detail-main-tab' : undefined}>
                      {t('goodsReceipt.report.info')}
                    </TabsTrigger>
                    <TabsTrigger value="content" className={isOps ? 'wms-ops-detail-main-tab' : undefined}>
                      {t('goodsReceipt.report.content')}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="info"
                  className="flex-1 overflow-y-auto px-6 py-4 mt-0 min-h-0 custom-scrollbar"
                >
                  <div className="space-y-4">
                    {isOps ? renderHeaderInfoOps() : renderHeaderInfoDefault()}
                    {renderSubTabs()}
                  </div>
                </TabsContent>

                <TabsContent
                  value="content"
                  className="flex-1 overflow-y-auto px-6 py-4 mt-0 min-h-0 custom-scrollbar"
                >
                  {renderContentTab()}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ImportLineDetailDialog
        importLine={selectedImportLine}
        orderLine={selectedImportLine ? getOrderLineForImportLine(selectedImportLine) : null}
        isOpen={isImportLineDialogOpen}
        onClose={() => {
          setIsImportLineDialogOpen(false);
          setSelectedImportLine(null);
        }}
        variant={variant}
      />
    </>
  );
}
