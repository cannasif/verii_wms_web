import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { useUIStore } from '@/stores/ui-store';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { kkdApi } from '../api/kkd.api';
import { lookupApi } from '@/services/lookup-api';
import type {
  KkdDistributionHeaderDto,
  KkdEmployeeDto,
  KkdEntitlementCheckResultDto,
  KkdResolvedEmployeeDto,
  KkdResolvedStockDto,
} from '../types/kkd.types';
import type { WarehouseLookup } from '@/services/lookup-types';

export function KkdDistributionPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();

  const [employeeQr, setEmployeeQr] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseLookup | null>(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [resolvedEmployee, setResolvedEmployee] = useState<KkdResolvedEmployeeDto | null>(null);
  const [resolvedStock, setResolvedStock] = useState<KkdResolvedStockDto | null>(null);
  const [entitlementResult, setEntitlementResult] = useState<KkdEntitlementCheckResultDto | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [header, setHeader] = useState<KkdDistributionHeaderDto | null>(null);

  useEffect(() => {
    setPageTitle('KKD Dağıtım');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const resolveQrMutation = useMutation({
    mutationFn: kkdApi.resolveEmployeeQr,
    onSuccess: (data) => {
      setResolvedEmployee(data);
      setHeader(null);
      setResolvedStock(null);
      setEntitlementResult(null);
      toast.success('Çalışan bulundu');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const createDraftMutation = useMutation({
    mutationFn: kkdApi.createDraft,
    onSuccess: (data) => {
      setHeader(data);
      toast.success('KKD taslağı oluşturuldu');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const resolveStockMutation = useMutation({
    mutationFn: kkdApi.resolveStockBarcode,
    onSuccess: async (data) => {
      setResolvedStock(data);
      if (!resolvedEmployee) return;
      try {
        const entitlement = await kkdApi.checkEntitlement({
          employeeId: resolvedEmployee.employeeId,
          customerId: resolvedEmployee.customerId,
          groupCode: data.groupCode ?? '',
          stockId: data.stockId,
          quantity: Number(quantity) || 1,
        });
        setEntitlementResult(entitlement);
      } catch (error) {
        setEntitlementResult(null);
        toast.error(error instanceof Error ? error.message : t('common.generalError'));
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const addLineMutation = useMutation({
    mutationFn: async () => {
      if (!header || !resolvedStock) throw new Error('Taslak veya stok bilgisi yok.');
      await kkdApi.addDistributionLine(header.id, {
        barcode,
        stockId: resolvedStock.stockId,
        quantity: Number(quantity) || 1,
      });
      return kkdApi.getDistributionById(header.id);
    },
    onSuccess: (data) => {
      setHeader(data);
      setBarcode('');
      setResolvedStock(null);
      setEntitlementResult(null);
      setQuantity('1');
      toast.success('Satır eklendi');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!header) throw new Error('Tamamlanacak taslak yok.');
      await kkdApi.completeDistribution(header.id);
      return kkdApi.getDistributionById(header.id);
    },
    onSuccess: (data) => {
      setHeader(data);
      toast.success('KKD dağıtımı tamamlandı');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!header) throw new Error('İptal edilecek taslak yok.');
      await kkdApi.cancelDistribution(header.id);
      return kkdApi.getDistributionById(header.id);
    },
    onSuccess: (data) => {
      setHeader(data);
      toast.success('KKD dağıtımı iptal edildi');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: number) => {
      if (!header) throw new Error('Taslak bulunamadı.');
      await kkdApi.deleteDistributionLine(header.id, lineId);
      return kkdApi.getDistributionById(header.id);
    },
    onSuccess: (data) => {
      setHeader(data);
      toast.success('Satır silindi');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const canCreateDraft = Boolean(resolvedEmployee && selectedWarehouse && !header);
  const canResolveStock = Boolean(resolvedEmployee && selectedWarehouse && barcode.trim());
  const canAddLine = Boolean(header && resolvedStock && entitlementResult?.allowed);
  const totalLineQuantity = useMemo(
    () => header?.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) ?? 0,
    [header?.lines],
  );

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'KKD Dağıtım', isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Çalışan ve Depo Seçimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kkd-qr">QR Kodu</Label>
                  <div className="flex gap-2">
                    <Input id="kkd-qr" value={employeeQr} onChange={(e) => setEmployeeQr(e.target.value)} placeholder="Çalışan QR kodu okutun" />
                    <Button type="button" onClick={() => resolveQrMutation.mutate({ qrCode: employeeQr })} disabled={!employeeQr.trim() || resolveQrMutation.isPending}>
                      Çöz
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Depo</Label>
                  <PagedLookupDialog<WarehouseLookup>
                    open={warehouseDialogOpen}
                    onOpenChange={setWarehouseDialogOpen}
                    title="Depo Seç"
                    value={selectedWarehouse ? `${selectedWarehouse.depoKodu} - ${selectedWarehouse.depoIsmi}` : null}
                    placeholder="Depo seçiniz"
                    queryKey={['kkd', 'warehouses']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(item) => String(item.id)}
                    getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                    onSelect={setSelectedWarehouse}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alternatif Çalışan Seçimi</Label>
                <PagedLookupDialog<KkdEmployeeDto>
                  open={employeeDialogOpen}
                  onOpenChange={setEmployeeDialogOpen}
                  title="Çalışan Seç"
                  value={resolvedEmployee ? `${resolvedEmployee.employeeCode} - ${resolvedEmployee.fullName}` : null}
                  placeholder="QR yerine listeden çalışan seçiniz"
                  queryKey={['kkd', 'distribution', 'employees']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })
                  }
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
                  onSelect={(item) => {
                    setResolvedEmployee({
                      employeeId: item.id,
                      employeeCode: item.employeeCode,
                      fullName: `${item.firstName} ${item.lastName}`.trim(),
                      customerId: item.customerId,
                      customerCode: item.customerCode,
                      departmentCode: item.departmentCode ?? null,
                      departmentName: item.departmentName ?? null,
                      roleCode: item.roleCode ?? null,
                      roleName: item.roleName ?? null,
                      isActive: item.isActive,
                    });
                    setEmployeeQr(item.qrCode);
                    setHeader(null);
                    setResolvedStock(null);
                    setEntitlementResult(null);
                  }}
                />
              </div>

              {resolvedEmployee ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{resolvedEmployee.employeeCode}</Badge>
                    <Badge variant="secondary">{resolvedEmployee.customerCode}</Badge>
                    {resolvedEmployee.departmentName ? <Badge variant="outline">{resolvedEmployee.departmentName}</Badge> : null}
                    {resolvedEmployee.roleName ? <Badge variant="outline">{resolvedEmployee.roleName}</Badge> : null}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{resolvedEmployee.fullName}</p>
                </div>
              ) : null}

              {!header ? (
                <Button type="button" onClick={() => {
                  if (!resolvedEmployee || !selectedWarehouse) return;
                  createDraftMutation.mutate({
                    employeeId: resolvedEmployee.employeeId,
                    customerId: resolvedEmployee.customerId,
                    customerCode: resolvedEmployee.customerCode,
                    warehouseId: selectedWarehouse.id,
                    sourceChannel: 'WMS',
                  });
                }} disabled={!canCreateDraft || createDraftMutation.isPending}>
                  Taslak Oluştur
                </Button>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">Header #{header.id}</Badge>
                    <Badge>{header.status}</Badge>
                    <Badge variant="secondary">Depo #{header.warehouseId}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Belge No: {header.documentNo || '-'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ürün Okutma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="kkd-barcode">Barkod</Label>
                  <Input id="kkd-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ürün barkodu okutun" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kkd-qty">Miktar</Label>
                  <Input id="kkd-qty" type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={() => {
                    if (!selectedWarehouse) return;
                    resolveStockMutation.mutate({ barcode, warehouseId: selectedWarehouse.id });
                  }} disabled={!canResolveStock || resolveStockMutation.isPending}>
                    Barkodu Çöz
                  </Button>
                </div>
              </div>

              {resolvedStock ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{resolvedStock.stockCode}</Badge>
                    {resolvedStock.groupCode ? <Badge variant="secondary">{resolvedStock.groupCode}</Badge> : null}
                    <Badge variant="outline">Bakiye: {resolvedStock.availableQuantity}</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-slate-900 dark:text-white">{resolvedStock.stockName}</p>
                </div>
              ) : null}

              {entitlementResult ? (
                <div className={`rounded-2xl border p-4 ${entitlementResult.allowed ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/60 dark:border-rose-800/40 dark:bg-rose-950/20'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={entitlementResult.allowed ? 'default' : 'destructive'}>
                      {entitlementResult.allowed ? 'Hak Uygun' : 'Hak Yetersiz'}
                    </Badge>
                    <Badge variant="outline">Ana: {entitlementResult.remainingMainQuantity}</Badge>
                    <Badge variant="outline">Ek: {entitlementResult.remainingAdditionalQuantity}</Badge>
                    <Badge variant="secondary">Toplam: {entitlementResult.totalRemainingQuantity}</Badge>
                  </div>
                  {entitlementResult.message ? <p className="mt-2 text-sm">{entitlementResult.message}</p> : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => addLineMutation.mutate()} disabled={!canAddLine || addLineMutation.isPending}>
                  Satıra Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dağıtım Satırları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Satır: {header?.lines.length ?? 0}</Badge>
                <Badge variant="secondary">Toplam Miktar: {totalLineQuantity}</Badge>
              </div>

              <div className="space-y-3">
                {(header?.lines ?? []).map((line) => (
                  <div key={line.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{line.stockCode} {line.description ? `- ${line.description}` : ''}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Grup: {line.groupCode || '-'} | Miktar: {line.quantity}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteLineMutation.mutate(line.id)} disabled={deleteLineMutation.isPending}>
                        Satırı Sil
                      </Button>
                    </div>
                  </div>
                ))}
                {!header?.lines.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    Henüz satır eklenmedi.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => completeMutation.mutate()} disabled={!header?.lines.length || completeMutation.isPending}>
                  Tamamla
                </Button>
                <Button type="button" variant="outline" onClick={() => cancelMutation.mutate()} disabled={!header || cancelMutation.isPending}>
                  İptal Et
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
