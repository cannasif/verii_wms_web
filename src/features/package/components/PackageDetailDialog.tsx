import { type ReactElement, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageState } from '@/components/shared';
import { usePHeader } from '../hooks/usePHeader';
import { usePPackagesByHeader } from '../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../hooks/usePLinesByHeader';
import type { PHeaderDto, PPackageDto } from '../types/package';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface PackageDetailDialogProps {
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

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-800';
    case 'Packing':
      return 'bg-blue-100 text-blue-800';
    case 'Open':
      return 'bg-yellow-100 text-yellow-800';
    case 'Packed':
      return 'bg-emerald-100 text-emerald-800';
    case 'Sealed':
      return 'bg-cyan-100 text-cyan-800';
    case 'Loaded':
      return 'bg-blue-100 text-blue-800';
    case 'Transferred':
      return 'bg-amber-100 text-amber-800';
    case 'Shipped':
      return 'bg-violet-100 text-violet-800';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800';
    case 'Closed':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function getOpsStatusBadgeClass(status: string | undefined): string {
  const key = status?.toLowerCase() ?? '';
  if (key === 'packed' || key === 'shipped' || key === 'closed' || key === 'sealed' || key === 'loaded') {
    return 'wms-ops-status-badge--done';
  }
  if (key === 'packing' || key === 'open') {
    return 'wms-ops-status-badge--active';
  }
  if (key === 'cancelled') {
    return 'wms-ops-status-badge--danger';
  }
  return 'wms-ops-status-badge--pending';
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function PackageDetailDialog({
  headerId,
  isOpen,
  onClose,
  variant = 'ops',
}: PackageDetailDialogProps): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const { data: header, isLoading: isLoadingHeader } = usePHeader(headerId);
  const { data: packages, isLoading: isLoadingPackages } = usePPackagesByHeader(headerId);
  const { data: lines, isLoading: isLoadingLines } = usePLinesByHeader(headerId);
  const [activeTab, setActiveTab] = useState('packages');
  const isOps = variant === 'ops';

  const renderStatusBadge = (status: string, label: string): ReactElement => {
    if (isOps) {
      return (
        <Badge variant="outline" className={cn('wms-ops-status-badge', getOpsStatusBadgeClass(status))}>
          {label}
        </Badge>
      );
    }
    return <Badge className={getStatusBadgeColor(status)}>{label}</Badge>;
  };

  const renderInfoPanels = (headerData: PHeaderDto): ReactElement => {
    if (isOps) {
      return (
        <div className="mb-6 grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('package.detail.basicInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('package.form.packingNo')}>{headerData.packingNo}</OpsDetailRow>
              <OpsDetailRow label={t('package.form.packingDate')}>{formatDate(headerData.packingDate)}</OpsDetailRow>
              <OpsDetailRow label={t('package.form.warehouseCode')}>{headerData.warehouseCode || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('package.form.customerCode')}>
                {headerData.customerCode || '-'}
                {headerData.customerName ? ` (${headerData.customerName})` : ''}
              </OpsDetailRow>
              <OpsDetailRow label={t('package.form.status')}>
                {renderStatusBadge(
                  headerData.status,
                  t(`package.status.${headerData.status.toLowerCase()}`, headerData.status),
                )}
              </OpsDetailRow>
            </div>
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('package.detail.summary')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('package.detail.totalPackageCount')}>{headerData.totalPackageCount || 0}</OpsDetailRow>
              <OpsDetailRow label={t('package.detail.totalQuantity')}>{headerData.totalQuantity || 0}</OpsDetailRow>
              <OpsDetailRow label={t('package.detail.totalGrossWeight')}>{headerData.totalGrossWeight || 0}</OpsDetailRow>
              <OpsDetailRow label={t('package.detail.totalVolume')}>{headerData.totalVolume || 0}</OpsDetailRow>
            </div>
          </div>

          <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
            <h3 className="wms-ops-detail-section-title">{t('package.detail.shippingInfo')}</h3>
            <div className="wms-ops-detail-panel--rows flex-1">
              <OpsDetailRow label={t('package.form.trackingNo')}>{headerData.trackingNo || '-'}</OpsDetailRow>
              <OpsDetailRow label={t('package.form.carrierServiceType')}>{headerData.carrierServiceType || '-'}</OpsDetailRow>
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
              {t('package.detail.basicInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.packingNo')}</span>
                <span className="text-sm font-semibold">{headerData.packingNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.packingDate')}</span>
                <span className="text-sm">{formatDate(headerData.packingDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.warehouseCode')}</span>
                <span className="text-sm">{headerData.warehouseCode || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.customerCode')}</span>
                <span className="text-sm">
                  {headerData.customerCode || '-'}
                  {headerData.customerName && ` (${headerData.customerName})`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.status')}</span>
                {renderStatusBadge(
                  headerData.status,
                  t(`package.status.${headerData.status.toLowerCase()}`, headerData.status),
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('package.detail.summary')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.detail.totalPackageCount')}</span>
                <span className="text-sm font-semibold">{headerData.totalPackageCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.detail.totalQuantity')}</span>
                <span className="text-sm font-semibold">{headerData.totalQuantity || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.detail.totalGrossWeight')}</span>
                <span className="text-sm font-semibold">{headerData.totalGrossWeight || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.detail.totalVolume')}</span>
                <span className="text-sm font-semibold">{headerData.totalVolume || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('package.detail.shippingInfo')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.trackingNo')}</span>
                <span className="text-sm">{headerData.trackingNo || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('package.form.carrierServiceType')}</span>
                <span className="text-sm">{headerData.carrierServiceType || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPackagesTable = (): ReactElement => {
    if (isLoadingPackages) {
      return <PageState tone="loading" title={t('common.loading')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />;
    }
    if (!packages || packages.length === 0) {
      return <PageState tone="empty" title={t('package.detail.noPackages')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />;
    }

    if (isOps) {
      return (
        <div className="wms-ops-transfer-detail__table-wrap rounded-none border-0">
          <table className="wms-ops-transfer-detail__table">
            <thead>
              <tr>
                <th>{t('package.detail.packageNo')}</th>
                <th>{t('package.detail.packageType')}</th>
                <th>{t('package.detail.barcode')}</th>
                <th>{t('package.detail.status')}</th>
                <th>{t('package.detail.netWeight')}</th>
                <th>{t('package.detail.grossWeight')}</th>
                <th>{t('package.detail.volume')}</th>
                <th>{t('package.detail.isMixed')}</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg: PPackageDto) => (
                <tr key={pkg.id}>
                  <td><span className="wms-ops-transfer-detail__stock-code">{pkg.packageNo}</span></td>
                  <td><span className="wms-ops-code-badge">{pkg.packageType}</span></td>
                  <td>{pkg.barcode || '-'}</td>
                  <td>
                    {renderStatusBadge(
                      pkg.status,
                      String(t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)),
                    )}
                  </td>
                  <td>{pkg.netWeight ?? '-'}</td>
                  <td>{pkg.grossWeight ?? '-'}</td>
                  <td>{pkg.volume ?? '-'}</td>
                  <td>{pkg.isMixed ? t('common.yes') : t('common.no')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('package.detail.packageNo')}</TableHead>
            <TableHead>{t('package.detail.packageType')}</TableHead>
            <TableHead>{t('package.detail.barcode')}</TableHead>
            <TableHead>{t('package.detail.status')}</TableHead>
            <TableHead>{t('package.detail.netWeight')}</TableHead>
            <TableHead>{t('package.detail.grossWeight')}</TableHead>
            <TableHead>{t('package.detail.volume')}</TableHead>
            <TableHead>{t('package.detail.isMixed')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell>{pkg.packageNo}</TableCell>
              <TableCell>
                <Badge variant="outline">{pkg.packageType}</Badge>
              </TableCell>
              <TableCell>{pkg.barcode || '-'}</TableCell>
              <TableCell>
                {renderStatusBadge(
                  pkg.status,
                  String(t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)),
                )}
              </TableCell>
              <TableCell>{pkg.netWeight || '-'}</TableCell>
              <TableCell>{pkg.grossWeight || '-'}</TableCell>
              <TableCell>{pkg.volume || '-'}</TableCell>
              <TableCell>{pkg.isMixed ? t('common.yes') : t('common.no')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderLinesTable = (): ReactElement => {
    if (isLoadingLines) {
      return <PageState tone="loading" title={t('common.loading')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />;
    }
    if (!lines || lines.length === 0) {
      return <PageState tone="empty" title={t('package.detail.noLines')} compact className={isOps ? 'wms-ops-detail-empty' : 'm-3'} />;
    }

    if (isOps) {
      return (
        <div className="wms-ops-transfer-detail__table-wrap rounded-none border-0">
          <table className="wms-ops-transfer-detail__table">
            <thead>
              <tr>
                <th>{t('package.detail.barcode')}</th>
                <th>{t('package.detail.stockCode')}</th>
                <th>{t('package.detail.stockName')}</th>
                <th>{t('package.detail.yapKod')}</th>
                <th>{t('package.detail.yapAcik')}</th>
                <th>{t('package.detail.quantity')}</th>
                <th>{t('package.detail.serialNo')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const packageBarcode = packages?.find((p) => p.id === line.packageId)?.barcode || '-';
                return (
                  <tr key={line.id}>
                    <td>{packageBarcode}</td>
                    <td><span className="wms-ops-transfer-detail__stock-code">{line.stockCode}</span></td>
                    <td><span className="wms-ops-transfer-detail__stock-name">{line.stockName || '-'}</span></td>
                    <td>{line.yapKod}</td>
                    <td>{line.yapAcik || '-'}</td>
                    <td className="wms-ops-transfer-detail__col--qty">{line.quantity}</td>
                    <td>
                      {[line.serialNo, line.serialNo2, line.serialNo3, line.serialNo4]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('package.detail.barcode')}</TableHead>
            <TableHead>{t('package.detail.stockCode')}</TableHead>
            <TableHead>{t('package.detail.stockName')}</TableHead>
            <TableHead>{t('package.detail.yapKod')}</TableHead>
            <TableHead>{t('package.detail.yapAcik')}</TableHead>
            <TableHead>{t('package.detail.quantity')}</TableHead>
            <TableHead>{t('package.detail.serialNo')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const packageBarcode = packages?.find((p) => p.id === line.packageId)?.barcode || '-';
            return (
              <TableRow key={line.id}>
                <TableCell>{packageBarcode}</TableCell>
                <TableCell>{line.stockCode}</TableCell>
                <TableCell>{line.stockName || '-'}</TableCell>
                <TableCell>{line.yapKod}</TableCell>
                <TableCell>{line.yapAcik || '-'}</TableCell>
                <TableCell>{line.quantity}</TableCell>
                <TableCell>
                  {[line.serialNo, line.serialNo2, line.serialNo3, line.serialNo4]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const dialogContentClass = cn(
    'flex h-[90vh] max-h-[90dvh] w-[95vw] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0',
    'sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl',
    isOps && 'wms-ops-form wms-ops-detail-dialog border-0 shadow-none',
  );

  if (isLoadingHeader) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(dialogContentClass, !isOps && 'max-w-4xl')}>
          <DialogHeader className={cn('shrink-0 border-b px-6 pt-6 pb-4', isOps && 'wms-ops-detail-dialog__header')}>
            <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : undefined}>
              {t('package.list.detailTitle')}
            </DialogTitle>
          </DialogHeader>
          <PageState tone="loading" title={t('common.loading')} compact className={isOps ? 'wms-ops-detail-state' : 'm-6'} />
        </DialogContent>
      </Dialog>
    );
  }

  if (!header) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(dialogContentClass, !isOps && 'max-w-4xl')}>
          <DialogHeader className={cn('shrink-0 border-b px-6 pt-6 pb-4', isOps && 'wms-ops-detail-dialog__header')}>
            <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : undefined}>
              {t('package.list.detailTitle')}
            </DialogTitle>
          </DialogHeader>
          <PageState tone="empty" title={t('package.detail.notFound')} compact className={isOps ? 'wms-ops-detail-state' : 'm-6'} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={cn(
          'shrink-0 border-b px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6 sm:pr-14',
          isOps && 'wms-ops-detail-dialog__header',
        )}>
          <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : 'text-xl'}>
            {t('package.list.detailTitle')}
            {isOps ? (
              <>
                <span className="wms-ops-detail-dialog__id"> {header.packingNo}</span>
              </>
            ) : (
              ` - ${header.packingNo}`
            )}
          </DialogTitle>
          <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
            {t('package.list.detailDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:overflow-hidden">
          {renderInfoPanels(header)}

          <Tabs
            value={isOps ? activeTab : undefined}
            defaultValue={isOps ? undefined : 'packages'}
            onValueChange={isOps ? setActiveTab : undefined}
            className={cn('flex flex-1 flex-col overflow-hidden', isOps && 'min-h-0')}
          >
            <TabsList className={cn(
              'shrink-0',
              isOps && 'wms-ops-tabs wms-ops-step-tabs grid w-full grid-cols-2 sm:w-auto',
              isOps && (activeTab === 'packages' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock'),
            )}>
              {isOps ? <span className="wms-ops-tab-indicator" aria-hidden /> : null}
              <TabsTrigger value="packages" className={isOps ? 'wms-ops-tab' : undefined}>
                {t('package.detail.packages')} ({packages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="lines" className={isOps ? 'wms-ops-tab' : undefined}>
                {t('package.detail.lines')} ({lines?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="packages"
              className={cn(
                'mt-4 flex-1 overflow-auto',
                isOps && 'wms-ops-detail-panel wms-ops-detail-lines-panel mt-3 min-h-0 flex flex-col overflow-hidden',
              )}
            >
              {renderPackagesTable()}
            </TabsContent>

            <TabsContent
              value="lines"
              className={cn(
                'mt-4 flex-1 overflow-auto',
                isOps && 'wms-ops-detail-panel wms-ops-detail-lines-panel mt-3 min-h-0 flex flex-col overflow-hidden',
              )}
            >
              {renderLinesTable()}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
