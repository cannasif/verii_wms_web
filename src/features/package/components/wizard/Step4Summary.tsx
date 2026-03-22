import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePPackagesByHeader } from '../../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../../hooks/usePLinesByHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit } from 'lucide-react';
import type { PHeaderDto } from '../../types/package';

interface Step4SummaryProps {
  headerData: PHeaderDto;
  onEditHeader: () => void;
  onEditPackages: () => void;
  onEditLines: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200';
    case 'Packing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-200';
    case 'Packed':
      return 'bg-green-100 text-green-800 dark:bg-green-500/25 dark:text-green-200';
    case 'Shipped':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-500/25 dark:text-red-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200';
  }
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export function Step4Summary({
  headerData,
  onEditHeader,
  onEditPackages,
  onEditLines,
  onPrevious,
  onComplete,
  onCancel,
  isLoading = false,
}: Step4SummaryProps): ReactElement {
  const { t } = useTranslation();

  const { data: packagesData, isLoading: isLoadingPackages } = usePPackagesByHeader(headerData.id);
  const { data: linesData, isLoading: isLoadingLines } = usePLinesByHeader(headerData.id);

  const packages = useMemo(() => packagesData ?? [], [packagesData]);
  const lines = useMemo(() => linesData ?? [], [linesData]);

  const summaryTotals = useMemo(() => {
    const totalQuantity = lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    const totalNetWeight = packages.reduce((sum, pkg) => sum + (pkg.netWeight || 0), 0);
    const totalGrossWeight = packages.reduce((sum, pkg) => sum + (pkg.grossWeight || 0), 0);
    const totalVolume = packages.reduce((sum, pkg) => sum + (pkg.volume || 0), 0);

    return {
      totalPackageCount: packages.length,
      totalQuantity,
      totalNetWeight,
      totalGrossWeight,
      totalVolume,
    };
  }, [packages, lines]);

  const getPackageBarcode = (packageId: number): string => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg?.barcode || '-';
  };

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex items-center justify-between">
            <CardTitle>{t('package.wizard.step4.title')}</CardTitle>
            <Button variant="outline" size="sm" onClick={onEditHeader}>
              <Edit className="size-4 mr-2" />
              {t('package.wizard.step4.editHeader')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 crm-page">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t('package.wizard.step4.headerInfo')}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.form.packingNo')}:</span>
                  <span className="font-medium">{headerData.packingNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.form.packingDate')}:</span>
                  <span>{formatDate(headerData.packingDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.form.warehouseCode')}:</span>
                  <span>{headerData.warehouseCode || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.form.customerCode')}:</span>
                  <span>
                    {headerData.customerCode || '-'}
                    {headerData.customerName && ` (${headerData.customerName})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.form.status')}:</span>
                  <Badge className={getStatusBadgeColor(headerData.status)}>
                    {t(`package.status.${headerData.status.toLowerCase()}`, headerData.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t('package.wizard.step4.summaryTotals')}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('package.detail.totalPackageCount')}:
                  </span>
                  <span className="font-medium">{summaryTotals.totalPackageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.detail.totalQuantity')}:</span>
                  <span className="font-medium">{summaryTotals.totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('package.detail.totalNetWeight')}:
                  </span>
                  <span className="font-medium">{summaryTotals.totalNetWeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('package.detail.totalGrossWeight')}:
                  </span>
                  <span className="font-medium">{summaryTotals.totalGrossWeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('package.detail.totalVolume')}:</span>
                  <span className="font-medium">{summaryTotals.totalVolume}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">
                {t('package.wizard.step4.packages')} ({packages.length})
              </h4>
              <Button variant="outline" size="sm" onClick={onEditPackages}>
                <Edit className="size-4 mr-2" />
                {t('package.wizard.step4.editPackages')}
              </Button>
            </div>
            {isLoadingPackages ? (
              <p className="text-muted-foreground text-center py-4">{t('common.loading')}</p>
            ) : packages.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('package.detail.packageNo')}</TableHead>
                      <TableHead>{t('package.detail.packageType')}</TableHead>
                      <TableHead>{t('package.detail.status')}</TableHead>
                      <TableHead>{t('package.detail.netWeight')}</TableHead>
                      <TableHead>{t('package.detail.grossWeight')}</TableHead>
                      <TableHead>{t('package.detail.volume')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.packageNo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.packageType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.status}</Badge>
                        </TableCell>
                        <TableCell>{pkg.netWeight || '-'}</TableCell>
                        <TableCell>{pkg.grossWeight || '-'}</TableCell>
                        <TableCell>{pkg.volume || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t('package.wizard.step4.noPackages')}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">
                {t('package.wizard.step4.lines')} ({lines.length})
              </h4>
              <Button variant="outline" size="sm" onClick={onEditLines}>
                <Edit className="size-4 mr-2" />
                {t('package.wizard.step4.editLines')}
              </Button>
            </div>
            {isLoadingLines ? (
              <p className="text-muted-foreground text-center py-4">{t('common.loading')}</p>
            ) : lines.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
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
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{getPackageBarcode(line.packageId)}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t('package.wizard.step4.noLines')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrevious}>
          {t('package.wizard.previousStep')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onComplete} disabled={isLoading}>
            {isLoading
              ? t('common.saving')
              : t('package.wizard.step4.complete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
