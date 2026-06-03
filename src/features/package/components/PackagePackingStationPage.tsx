import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Barcode, CheckCircle2, PackageOpen, Printer, ShieldCheck } from 'lucide-react';
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
      title: translate('package.station.quality.noMaterialTitle', { defaultValue: 'Ambalaj malzemesi seçilmedi' }),
      detail: translate('package.station.quality.noMaterialDetail', { defaultValue: 'Kapasite ve dimension kontrolleri için pakete material bağlayın.' }),
    });
    return warnings;
  }

  if (material.maxGrossWeight != null && pkg.grossWeight != null && pkg.grossWeight > material.maxGrossWeight) {
    warnings.push({
      severity: 'danger',
      title: translate('package.station.quality.overWeightTitle', { defaultValue: 'Ağırlık limiti aşıldı' }),
      detail: `${pkg.grossWeight} > ${material.maxGrossWeight}`,
    });
  }

  if (material.maxVolume != null && pkg.volume != null && pkg.volume > material.maxVolume) {
    warnings.push({
      severity: 'danger',
      title: translate('package.station.quality.overVolumeTitle', { defaultValue: 'Hacim limiti aşıldı' }),
      detail: `${pkg.volume} > ${material.maxVolume}`,
    });
  }

  if (material.maxProductQuantity != null && totalQuantity > material.maxProductQuantity) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.overQtyTitle', { defaultValue: 'Ürün adedi limiti aşıldı' }),
      detail: `${totalQuantity} > ${material.maxProductQuantity}`,
    });
  }

  if (!pkg.isMixed && uniqueStocks.size > 1) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.mixedStockTitle', { defaultValue: 'Mixed stock kontrolü' }),
      detail: translate('package.station.quality.mixedStockDetail', { defaultValue: 'Bu paket mixed değil ama birden fazla stok içeriyor.' }),
    });
  }

  if (!pkg.isMixed && uniqueYapKod.size > 1) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.mixedYapTitle', { defaultValue: 'Mixed yap kod kontrolü' }),
      detail: translate('package.station.quality.mixedYapDetail', { defaultValue: 'Bu paket mixed değil ama birden fazla yap kod içeriyor.' }),
    });
  }

  if (missingSerial) {
    warnings.push({
      severity: 'warning',
      title: translate('package.station.quality.missingSerialTitle', { defaultValue: 'Seri kontrolü' }),
      detail: translate('package.station.quality.missingSerialDetail', { defaultValue: 'Serili ürün gibi görünen okutmalarda seri alanı eksik olabilir.' }),
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      severity: 'info',
      title: translate('package.station.quality.cleanTitle', { defaultValue: 'Kalite kontrol temiz' }),
      detail: translate('package.station.quality.cleanDetail', { defaultValue: 'Seçili paket için kapasite/mixed/seri uyarısı bulunmadı.' }),
    });
  }

  return warnings;
}

export function PackagePackingStationPage(): ReactElement {
  const { t } = useTranslation();
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
          defaultValue: '{{material}} seçili; max qty {{qty}}, max kg {{kg}}.',
          material: selectedMaterial.materialCode,
          qty: selectedMaterial.maxProductQuantity ?? '-',
          kg: selectedMaterial.maxGrossWeight ?? '-',
        })
        : t('package.station.cartonization.noMaterialMessage', { defaultValue: 'Bu paket için material seçilmediği için otomatik kapasite açıklaması sınırlı.' }),
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
      if (!activeHeaderId || !selectedPackage) throw new Error(t('package.station.selectPackage', { defaultValue: 'Önce paket seçin' }));
      const result = await packageApi.getStokBarcode(barcode);
      const stock = result.data?.[0];
      if (!result.success || !stock?.stokKodu) {
        throw new Error(result.message || t('package.station.stockNotFound', { defaultValue: 'Barkod stok bilgisi çözülemedi' }));
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
      toast.success(t('package.station.lineAdded', { defaultValue: 'Ürün pakete eklendi' }));
      setBarcode('');
      setQuantity(1);
      await refreshStation();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const closePackageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackage) throw new Error(t('package.station.selectPackage', { defaultValue: 'Önce paket seçin' }));
      return packageApi.updatePPackage(selectedPackage.id, { status: 'Closed' });
    },
    onSuccess: async () => {
      toast.success(t('package.station.packageClosed', { defaultValue: 'Paket kapatıldı' }));
      await refreshStation();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const loadHeader = (): void => {
    const parsed = Number(packingHeaderIdText);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(t('package.station.invalidHeader', { defaultValue: 'Geçerli bir Packing Header ID girin' }));
      return;
    }
    setActiveHeaderId(parsed);
    setSelectedPackageId(undefined);
  };

  return (
    <div className="crm-page space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-900 text-white">
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="size-7" />
            {t('package.station.title', { defaultValue: 'Packing Station' })}
          </CardTitle>
          <CardDescription className="text-emerald-50">
            {t('package.station.description', { defaultValue: 'Barkod okut, paket seç, ürün ekle, kalite uyarılarını gör ve paketi kapat.' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <Label>{t('package.station.headerId', { defaultValue: 'Packing Header ID' })}</Label>
              <Input value={packingHeaderIdText} onChange={(event) => setPackingHeaderIdText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') loadHeader(); }} placeholder="Örn. 12" />
            </div>
            <Button className="self-end" onClick={loadHeader}>{t('common.search', { defaultValue: 'Ara' })}</Button>
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
                    <Label>{t('package.station.package', { defaultValue: 'Paket' })}</Label>
                    <Select value={selectedPackage ? String(selectedPackage.id) : ''} onValueChange={(value) => setSelectedPackageId(Number(value))}>
                      <SelectTrigger><SelectValue placeholder={t('package.station.selectPackage', { defaultValue: 'Paket seçin' })} /></SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.packageNo} - {pkg.packageType}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 rounded-lg border p-3 text-sm">
                    <div className="flex justify-between"><span>Status</span><Badge>{selectedPackage?.status ?? '-'}</Badge></div>
                    <div className="flex justify-between"><span>Material</span><span>{selectedMaterial?.materialCode ?? '-'}</span></div>
                    <div className="flex justify-between"><span>Lines</span><span>{selectedLines.length}</span></div>
                    <div className="flex justify-between"><span>Qty</span><span>{selectedLines.reduce((sum, line) => sum + line.quantity, 0)}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('package.station.scanBarcode', { defaultValue: 'Barkod' })}</Label>
                    <div className="flex gap-2">
                      <Input value={barcode} disabled={!canOperate} onChange={(event) => setBarcode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && barcode.trim()) addLineMutation.mutate(); }} />
                      <Input className="w-24" type="number" value={quantity} disabled={!canOperate} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} />
                    </div>
                    <Button className="w-full" disabled={!canOperate || !barcode.trim() || addLineMutation.isPending} onClick={() => addLineMutation.mutate()}>
                      <Barcode className="mr-2 size-4" />
                      {t('package.station.addToPackage', { defaultValue: 'Pakete Ekle' })}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" disabled={!canOperate || !selectedPackage} onClick={() => closePackageMutation.mutate()}>
                      <CheckCircle2 className="mr-2 size-4" />
                      {t('package.station.closePackage', { defaultValue: 'Paketi Kapat' })}
                    </Button>
                    <Button variant="outline" disabled={!selectedPackage}>
                      <Printer className="mr-2 size-4" />
                      {t('package.station.printPrepared', { defaultValue: 'Etiket Hazır' })}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />{t('package.station.qualityTitle', { defaultValue: 'Paket Kalite Kontrol' })}</CardTitle>
                    <CardDescription>{t('package.station.qualityDescription', { defaultValue: 'Kapasite, mixed policy, seri ve paket material kontrolleri.' })}</CardDescription>
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
                    <CardTitle>{t('package.station.cartonizationTitle', { defaultValue: 'Cartonization Açıklaması' })}</CardTitle>
                    <CardDescription>{t('package.station.cartonizationDescription', { defaultValue: 'Sistem neden bu koli/palet ve kapasiteyle ilerliyor?' })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {suggestion ? (
                      <div className="rounded-lg border bg-cyan-50 p-4 text-sm text-cyan-950">
                        <div className="font-semibold">{suggestion.stock} / {suggestion.quantity}</div>
                        <div>{suggestion.message}</div>
                      </div>
                    ) : (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        {t('package.station.noCartonization', { defaultValue: 'Seçili pakette ürün yok. Ürün eklenince cartonization açıklaması burada görünecek.' })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>{t('package.station.lines', { defaultValue: 'Paket Kalemleri' })}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Stok</TableHead><TableHead>Barkod</TableHead><TableHead>Seri</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
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
        </CardContent>
      </Card>
    </div>
  );
}
