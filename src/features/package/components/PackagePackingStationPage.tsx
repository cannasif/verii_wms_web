import { type ReactElement, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Barcode, CheckCircle2, PackageOpen, Printer, ShieldCheck } from 'lucide-react';
import {
  OpsActionButton,
  OpsFieldShell,
  OpsFormPageShell,
  OpsInput,
  PageState,
} from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { cn } from '@/lib/utils';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { PackagingMaterialDto, PLineDto, PPackageDto } from '../types/package';

interface QualityWarning {
  severity: 'info' | 'warning' | 'danger';
  title: string;
  detail: string;
}

function getPackageMaterial(pkg: PPackageDto | undefined, materials: PackagingMaterialDto[]): PackagingMaterialDto | undefined {
  if (!pkg?.packagingMaterialId) return undefined;
  return materials.find((item) => item.id === pkg.packagingMaterialId);
}

function buildQualityWarnings(
  pkg: PPackageDto | undefined,
  lines: PLineDto[],
  material: PackagingMaterialDto | undefined,
  translate: (key: string, options?: Record<string, unknown>) => string,
): QualityWarning[] {
  if (!pkg) return [];
  const warnings: QualityWarning[] = [];
  const packageLines = lines.filter((line) => line.packageId === pkg.id);
  const totalQuantity = packageLines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
  const uniqueStocks = new Set(packageLines.map((line) => line.stockId ?? line.stockCode).filter(Boolean));
  const uniqueYapKod = new Set(packageLines.map((line) => line.yapKodId ?? line.yapKod).filter(Boolean));
  const missingSerial = packageLines.some((line) => !line.serialNo && line.quantity === 1 && line.barcode);

  if (!material) {
    warnings.push({
      severity: 'info',
      title: translate('package.station.quality.noMaterialTitle'),
      detail: translate('package.station.quality.noMaterialDetail'),
    });
    return warnings;
  }

  if (material.maxGrossWeight != null && pkg.grossWeight != null && pkg.grossWeight > material.maxGrossWeight) {
    warnings.push({
      severity: 'danger',
      title: translate('package.station.quality.overWeightTitle'),
      detail: `${pkg.grossWeight} > ${material.maxGrossWeight}`,
    });
  }

  if (material.maxVolume != null && pkg.volume != null && pkg.volume > material.maxVolume) {
    warnings.push({
      severity: 'danger',
      title: translate('package.station.quality.overVolumeTitle'),
      detail: `${pkg.volume} > ${material.maxVolume}`,
    });
  }

  if (material.maxProductQuantity != null && totalQuantity > material.maxProductQuantity) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.overQtyTitle'),
      detail: `${totalQuantity} > ${material.maxProductQuantity}`,
    });
  }

  if (!pkg.isMixed && uniqueStocks.size > 1) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.mixedStockTitle'),
      detail: translate('package.station.quality.mixedStockDetail'),
    });
  }

  if (!pkg.isMixed && uniqueYapKod.size > 1) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.mixedYapTitle'),
      detail: translate('package.station.quality.mixedYapDetail'),
    });
  }

  if (missingSerial) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.missingSerialTitle'),
      detail: translate('package.station.quality.missingSerialDetail'),
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      severity: 'info',
      title: translate('package.station.quality.cleanTitle'),
      detail: translate('package.station.quality.cleanDetail'),
    });
  }

  return warnings;
}

function renderStationStatusToken(status: string | undefined, t: TFunction): ReactElement {
  const key = status?.toLowerCase() ?? '';
  const tokenClass =
    key === 'packed' || key === 'closed' || key === 'shipped'
      ? 'wms-ops-station__token--done'
      : key === 'packing' || key === 'open'
        ? 'wms-ops-station__token--active'
        : key === 'cancelled'
          ? 'wms-ops-station__token--danger'
          : 'wms-ops-station__token--idle';
  const label = status ? t(`package.packageStatus.${key}`, { defaultValue: status }) : '---';

  return <span className={cn('wms-ops-station__token', tokenClass)}>{label}</span>;
}

export function PackagePackingStationPage(): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.package');
  const canOperate = permission.canCreate || permission.canUpdate;
  const [packingHeaderIdText, setPackingHeaderIdText] = useState('');
  const [activeHeaderId, setActiveHeaderId] = useState<number | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>(undefined);
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState(1);

  const headerQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.HEADER, activeHeaderId],
    queryFn: () => activeHeaderId ? packageApi.getPHeaderById(activeHeaderId) : Promise.reject(new Error('Header required')),
    enabled: Boolean(activeHeaderId),
  });

  const packagesQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.PACKAGES, 'header', activeHeaderId],
    queryFn: () => activeHeaderId ? packageApi.getPPackagesByHeader(activeHeaderId) : Promise.reject(new Error('Header required')),
    enabled: Boolean(activeHeaderId),
  });

  const linesQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.LINES, 'header', activeHeaderId],
    queryFn: () => activeHeaderId ? packageApi.getPLinesByHeader(activeHeaderId) : Promise.reject(new Error('Header required')),
    enabled: Boolean(activeHeaderId),
  });

  const materialsQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.MATERIALS, 'station'],
    queryFn: () => packageApi.getPackagingMaterials(),
  });

  const packages = packagesQuery.data ?? [];
  const lines = linesQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const selectedPackage = packages.find((item) => item.id === selectedPackageId) ?? packages[0];
  const selectedMaterial = getPackageMaterial(selectedPackage, materials);
  const selectedLines = selectedPackage ? lines.filter((line) => line.packageId === selectedPackage.id) : [];
  const totalLineQty = selectedLines.reduce((sum, line) => sum + line.quantity, 0);
  const headerLabel = headerQuery.data?.packingNo ?? (activeHeaderId ? `#${activeHeaderId}` : '---');

  const qualityQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.PACKAGE, 'quality', selectedPackage?.id],
    queryFn: () => selectedPackage ? packageApi.getPackageQualitySummary(selectedPackage.id) : Promise.reject(new Error('Package required')),
    enabled: Boolean(selectedPackage?.id),
  });

  const warnings = useMemo(() => {
    if (qualityQuery.data?.warnings?.length) {
      return qualityQuery.data.warnings.map((warning) => ({
        severity: warning.severity.toLowerCase() === 'danger' ? 'danger' : warning.severity.toLowerCase() === 'warning' ? 'warning' : 'info',
        title: warning.title,
        detail: warning.detail,
      } satisfies QualityWarning));
    }

    return buildQualityWarnings(selectedPackage, lines, selectedMaterial, t);
  }, [qualityQuery.data?.warnings, selectedPackage, lines, selectedMaterial, t]);

  const suggestion = useMemo(() => {
    if (!selectedLines.length) return null;
    const firstLine = selectedLines[0];
    const sameStockQuantity = selectedLines
      .filter((line) => (line.stockId ?? line.stockCode) === (firstLine.stockId ?? firstLine.stockCode))
      .reduce((sum, line) => sum + line.quantity, 0);
    return {
      stock: firstLine.stockName || firstLine.stockCode,
      quantity: sameStockQuantity,
      message: selectedMaterial
        ? t('package.station.cartonization.materialMessage', {
          material: selectedMaterial.materialCode,
          qty: selectedMaterial.maxProductQuantity ?? '-',
          kg: selectedMaterial.maxGrossWeight ?? '-',
        })
        : t('package.station.cartonization.noMaterialMessage'),
    };
  }, [selectedLines, selectedMaterial, t]);

  const refreshStation = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.PACKAGES, 'header', activeHeaderId] }),
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINES, 'header', activeHeaderId] }),
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.HEADER, activeHeaderId] }),
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.PACKAGE, 'quality'] }),
    ]);
  };

  const addLineMutation = useMutation({
    mutationFn: async () => {
      if (!activeHeaderId || !selectedPackage) throw new Error(t('package.station.selectPackage'));
      const result = await packageApi.getStokBarcode(barcode);
      const stock = result.data?.[0];
      if (!result.success || !stock?.stokKodu) {
        throw new Error(result.message || t('package.station.stockNotFound'));
      }

      return packageApi.createPLine({
        packingHeaderId: activeHeaderId,
        packageId: selectedPackage.id,
        barcode,
        stockCode: stock.stokKodu,
        quantity,
        serialNo: stock.seriBarkodMu ? barcode : undefined,
      });
    },
    onSuccess: async () => {
      toast.success(t('package.station.lineAdded'));
      setBarcode('');
      setQuantity(1);
      await refreshStation();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const closePackageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackage) throw new Error(t('package.station.selectPackage'));
      return packageApi.updatePPackage(selectedPackage.id, { status: 'Closed' });
    },
    onSuccess: async () => {
      toast.success(t('package.station.packageClosed'));
      await refreshStation();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const loadHeader = (): void => {
    const parsed = Number(packingHeaderIdText);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(t('package.station.invalidHeader'));
      return;
    }
    setActiveHeaderId(parsed);
    setSelectedPackageId(undefined);
  };

  return (
    <OpsFormPageShell
      eyebrow={
        <>
          <span>{t('package.create.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('package.create.breadcrumb.module')}</span>
        </>
      }
      title={t('package.station.title')}
      description={t('package.station.description')}
      actions={<PackageOpen className="size-5 opacity-80" aria-hidden />}
    >
      {!permission.canMutate ? <PermissionNotice /> : null}
      <div className="wms-ops-form wms-ops-station space-y-6">
        <div className="wms-ops-station__lookup">
          <div className="space-y-1">
            <span className="wms-ops-station__field-label">{t('package.station.headerId')}</span>
            <OpsFieldShell>
              <OpsInput
                value={packingHeaderIdText}
                onChange={(event) => setPackingHeaderIdText(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') loadHeader(); }}
                placeholder={t('package.station.headerIdPlaceholder')}
              />
            </OpsFieldShell>
          </div>
          <OpsActionButton type="button" variant="primary" onClick={loadHeader}>
            {t('common.search')}
          </OpsActionButton>
        </div>

        {activeHeaderId ? (
          <div className="wms-ops-station__layout">
            <aside className="wms-ops-station__sidebar">
              <div className="wms-ops-station__hero">
                <span className="wms-ops-station__header-id">{headerLabel}</span>
                <p className="wms-ops-station__header-meta">
                  {headerQuery.data?.customerName ?? headerQuery.data?.customerCode ?? '---'}
                </p>
              </div>

              <div className="wms-ops-station__block">
                <span className="wms-ops-station__field-label">{t('package.station.package')}</span>
                <OpsFieldShell>
                  <Select
                    value={selectedPackage ? String(selectedPackage.id) : ''}
                    onValueChange={(value) => setSelectedPackageId(Number(value))}
                  >
                    <SelectTrigger className={OPS_FIELD_CLASS}>
                      <SelectValue placeholder={t('package.station.selectPackage')} />
                    </SelectTrigger>
                    <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                          {pkg.packageNo} - {pkg.packageType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </OpsFieldShell>
              </div>

              <div className="wms-ops-station__block">
                <div className="wms-ops-station__metrics">
                  <div className="wms-ops-station__metric">
                    <span className="wms-ops-station__metric-label">{t('package.station.status')}</span>
                    {renderStationStatusToken(selectedPackage?.status, t)}
                  </div>
                  <div className="wms-ops-station__metric">
                    <span className="wms-ops-station__metric-label">{t('package.station.material')}</span>
                    <span className="wms-ops-station__metric-value">{selectedMaterial?.materialCode ?? '---'}</span>
                  </div>
                  <div className="wms-ops-station__metric">
                    <span className="wms-ops-station__metric-label">{t('package.station.lines')}</span>
                    <span className="wms-ops-station__metric-value">{selectedLines.length}</span>
                  </div>
                  <div className="wms-ops-station__metric">
                    <span className="wms-ops-station__metric-label">{t('package.station.qty')}</span>
                    <span className="wms-ops-station__metric-value">{totalLineQty}</span>
                  </div>
                </div>
              </div>

              <div className="wms-ops-station__scan">
                <div className="wms-ops-station__scan-grid">
                  <span className="wms-ops-station__field-label wms-ops-station__scan-label--barcode">
                    {t('package.station.scanBarcode')}
                  </span>
                  <span className="wms-ops-station__field-label wms-ops-station__scan-label--qty">
                    {t('package.station.qty')}
                  </span>
                  <OpsFieldShell className="wms-ops-station__barcode-field">
                    <Barcode className="wms-ops-station__barcode-icon" aria-hidden />
                    <OpsInput
                      value={barcode}
                      disabled={!canOperate}
                      placeholder={t('package.station.scanBarcode')}
                      onChange={(event) => setBarcode(event.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter' && barcode.trim()) addLineMutation.mutate(); }}
                      className="wms-ops-station__barcode-input"
                    />
                  </OpsFieldShell>
                  <OpsFieldShell className="wms-ops-station__qty-field">
                    <OpsInput
                      type="number"
                      min={1}
                      value={quantity}
                      disabled={!canOperate}
                      onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                      className="wms-ops-station__qty-input"
                      aria-label={t('package.station.qty')}
                    />
                  </OpsFieldShell>
                </div>
                <OpsActionButton
                  type="button"
                  variant="primary"
                  className="wms-ops-station__scan-submit"
                  disabled={!canOperate || !barcode.trim() || addLineMutation.isPending}
                  onClick={() => addLineMutation.mutate()}
                >
                  <Barcode className="size-3.5" aria-hidden />
                  {t('package.station.addToPackage')}
                </OpsActionButton>
              </div>

              <div className="wms-ops-station__actions">
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  disabled={!canOperate || !selectedPackage}
                  onClick={() => closePackageMutation.mutate()}
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {t('package.station.closePackage')}
                </OpsActionButton>
                <OpsActionButton type="button" variant="secondary" disabled={!selectedPackage}>
                  <Printer className="size-3.5" aria-hidden />
                  {t('package.station.printPrepared')}
                </OpsActionButton>
              </div>
            </aside>

            <div className="wms-ops-station__main">
              <section className="wms-ops-station__panel" aria-labelledby="station-quality-title">
                <div className="wms-ops-station__panel-head">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden />
                  <h3 id="station-quality-title" className="wms-ops-station__panel-title">
                    {t('package.station.qualityTitle')}
                  </h3>
                </div>
                <p className="wms-ops-station__panel-desc">{t('package.station.qualityDescription')}</p>
                <div className="wms-ops-station__panel-body">
                  <div className="wms-ops-station__alerts">
                    {warnings.map((warning, index) => (
                      <div
                        key={`${warning.title}-${index}`}
                        className={cn(
                          'wms-ops-station__alert',
                          warning.severity === 'danger' && 'wms-ops-station__alert--danger',
                          warning.severity === 'warning' && 'wms-ops-station__alert--warning',
                          warning.severity === 'info' && 'wms-ops-station__alert--info',
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            'size-4 shrink-0 self-start',
                            warning.severity === 'danger' ? 'text-red-400' : warning.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400',
                          )}
                          aria-hidden
                        />
                        <div>
                          <div className="wms-ops-station__alert-title">{warning.title}</div>
                          <div className="wms-ops-station__alert-detail">{warning.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="wms-ops-station__panel" aria-labelledby="station-cartonization-title">
                <div className="wms-ops-station__panel-head">
                  <PackageOpen className="size-4 shrink-0" aria-hidden />
                  <h3 id="station-cartonization-title" className="wms-ops-station__panel-title">
                    {t('package.station.cartonizationTitle')}
                  </h3>
                </div>
                <p className="wms-ops-station__panel-desc">{t('package.station.cartonizationDescription')}</p>
                <div className="wms-ops-station__panel-body">
                  {suggestion ? (
                    <div className="wms-ops-station__feed">
                      <div className="wms-ops-station__feed-head">
                        <span className="wms-ops-station__feed-stock">{suggestion.stock}</span>
                        <span className="wms-ops-station__feed-qty">×{suggestion.quantity}</span>
                      </div>
                      <p className="wms-ops-station__feed-message">{suggestion.message}</p>
                    </div>
                  ) : (
                    <PageState tone="empty" title={t('package.station.noCartonization')} compact className="wms-ops-panel-empty wms-ops-panel-empty--inline" />
                  )}
                </div>
              </section>

              <section className="wms-ops-station__panel wms-ops-station__lines-panel" aria-labelledby="station-lines-title">
                <div className="wms-ops-station__panel-head">
                  <Barcode className="size-4 shrink-0" aria-hidden />
                  <h3 id="station-lines-title" className="wms-ops-station__panel-title">
                    {t('package.station.lines')}
                  </h3>
                </div>
                <div className="wms-ops-station__panel-body">
                  <div className="wms-ops-transfer-detail__table-wrap">
                    {selectedLines.length === 0 ? (
                      <PageState tone="empty" title={t('package.detail.noLines')} compact className="wms-ops-panel-empty wms-ops-panel-empty--inline" />
                    ) : (
                      <table className="wms-ops-transfer-detail__table">
                        <thead>
                          <tr>
                            <th>{t('package.station.stockCode')}</th>
                            <th>{t('package.station.barcode')}</th>
                            <th>{t('package.station.serialNo')}</th>
                            <th className="wms-ops-transfer-detail__col--qty">{t('package.station.qty')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLines.map((line) => (
                            <tr key={line.id}>
                              <td>
                                <div className="wms-ops-transfer-detail__stock-code">{line.stockCode}</div>
                                <div className="mt-0.5 text-[0.625rem] opacity-70">{line.stockName ?? '-'}</div>
                              </td>
                              <td>{line.barcode ?? '-'}</td>
                              <td>{line.serialNo ?? '-'}</td>
                              <td className="wms-ops-transfer-detail__col--qty">{line.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </OpsFormPageShell>
  );
}
