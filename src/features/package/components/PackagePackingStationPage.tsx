import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Barcode, CheckCircle2, PackageOpen, Printer, ShieldCheck } from 'lucide-react';
import { OpsActionButton, OpsFieldShell, OpsFormPageShell } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { PackagingMaterialDto, PLineDto, PPackageDto } from '../types/package';

interface QualityWarning {
  severity: 'info' | 'warning' | 'danger';
  title: string;
  detail: string;
}

const STATION_SEARCH_PANEL_CLASS =
  'grid gap-3 rounded-xl border border-[color-mix(in_oklab,var(--wms-ops-accent)_18%,var(--wms-ops-card-border))] bg-[color-mix(in_oklab,var(--wms-ops-card)_92%,transparent)] p-4 md:grid-cols-[1fr_auto]';

function getPackageMaterial(pkg: PPackageDto | undefined, materials: PackagingMaterialDto[]): PackagingMaterialDto | undefined {
  if (!pkg?.packagingMaterialId) return undefined;
  return materials.find((item) => item.id === pkg.packagingMaterialId);
}

function buildQualityWarnings(pkg: PPackageDto | undefined, lines: PLineDto[], material: PackagingMaterialDto | undefined, translate: (key: string, options?: Record<string, unknown>) => string): QualityWarning[] {
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
      <div className="wms-ops-form space-y-6">
          <div className={STATION_SEARCH_PANEL_CLASS}>
              <div className="space-y-1">
              <Label>{t('package.station.headerId')}</Label>
              <OpsFieldShell>
              <Input
                value={packingHeaderIdText}
                onChange={(event) => setPackingHeaderIdText(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') loadHeader(); }}
                placeholder={t('package.station.headerIdPlaceholder')}
                className={OPS_FIELD_CLASS}
              />
              </OpsFieldShell>
            </div>
            <OpsActionButton type="button" variant="primary" className="self-end" onClick={loadHeader}>{t('common.search')}</OpsActionButton>
          </div>

          {activeHeaderId ? (
            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{headerQuery.data?.packingNo ?? `#${activeHeaderId}`}</CardTitle>
                  <CardDescription>{headerQuery.data?.customerName ?? headerQuery.data?.customerCode ?? '-'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>{t('package.station.package')}</Label>
                    <Select value={selectedPackage ? String(selectedPackage.id) : ''} onValueChange={(value) => setSelectedPackageId(Number(value))}>
                      <SelectTrigger><SelectValue placeholder={t('package.station.selectPackage')} /></SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.packageNo} - {pkg.packageType}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 rounded-lg border p-3 text-sm">
                    <div className="flex justify-between"><span>{t('package.station.status')}</span><Badge>{selectedPackage?.status ?? '-'}</Badge></div>
                    <div className="flex justify-between"><span>{t('package.station.material')}</span><span>{selectedMaterial?.materialCode ?? '-'}</span></div>
                    <div className="flex justify-between"><span>{t('package.station.lines')}</span><span>{selectedLines.length}</span></div>
                    <div className="flex justify-between"><span>{t('package.station.qty')}</span><span>{selectedLines.reduce((sum, line) => sum + line.quantity, 0)}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('package.station.scanBarcode')}</Label>
                    <div className="flex gap-2">
                      <Input value={barcode} disabled={!canOperate} onChange={(event) => setBarcode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && barcode.trim()) addLineMutation.mutate(); }} />
                      <Input className="w-24" type="number" value={quantity} disabled={!canOperate} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} />
                    </div>
                    <Button className="w-full" disabled={!canOperate || !barcode.trim() || addLineMutation.isPending} onClick={() => addLineMutation.mutate()}>
                      <Barcode className="mr-2 size-4" />
                      {t('package.station.addToPackage')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" disabled={!canOperate || !selectedPackage} onClick={() => closePackageMutation.mutate()}>
                      <CheckCircle2 className="mr-2 size-4" />
                      {t('package.station.closePackage')}
                    </Button>
                    <Button variant="outline" disabled={!selectedPackage}>
                      <Printer className="mr-2 size-4" />
                      {t('package.station.printPrepared')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />{t('package.station.qualityTitle')}</CardTitle>
                    <CardDescription>{t('package.station.qualityDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {warnings.map((warning, index) => (
                      <div key={`${warning.title}-${index}`} className="flex gap-3 rounded-lg border p-3">
                        <AlertTriangle className={warning.severity === 'danger' ? 'size-5 text-red-600' : warning.severity === 'warning' ? 'size-5 text-amber-600' : 'size-5 text-sky-600'} />
                        <div><div className="font-medium">{warning.title}</div><div className="text-sm text-muted-foreground">{warning.detail}</div></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('package.station.cartonizationTitle')}</CardTitle>
                    <CardDescription>{t('package.station.cartonizationDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {suggestion ? (
                      <div className="rounded-lg border bg-cyan-50 p-4 text-sm text-cyan-950">
                        <div className="font-semibold">{suggestion.stock} / {suggestion.quantity}</div>
                        <div>{suggestion.message}</div>
                      </div>
                    ) : (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        {t('package.station.noCartonization')}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>{t('package.station.lines')}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('package.station.stockCode')}</TableHead>
                          <TableHead>{t('package.station.barcode')}</TableHead>
                          <TableHead>{t('package.station.serialNo')}</TableHead>
                          <TableHead className="text-right">{t('package.station.qty')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell><div className="font-medium">{line.stockCode}</div><div className="text-xs text-muted-foreground">{line.stockName ?? '-'}</div></TableCell>
                            <TableCell>{line.barcode ?? '-'}</TableCell>
                            <TableCell>{line.serialNo ?? '-'}</TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
      </div>
    </OpsFormPageShell>
  );
}
