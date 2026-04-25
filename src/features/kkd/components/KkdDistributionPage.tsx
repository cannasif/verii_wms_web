import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  CreateKkdDistributionSubmissionLineDto,
  KkdDistributionHeaderDto,
  KkdEmployeeDto,
  KkdEntitlementCheckResultDto,
  KkdRemainingEntitlementDto,
  KkdResolvedEmployeeDto,
  KkdResolvedStockDto,
} from '../types/kkd.types';
import type { WarehouseLookup } from '@/services/lookup-types';

type LocalDistributionLine = CreateKkdDistributionSubmissionLineDto & {
  clientId: string;
  stockCode: string;
  stockName: string;
  groupCode?: string | null;
  groupName?: string | null;
  entitlement: KkdEntitlementCheckResultDto;
};

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
  const [submittedHeader, setSubmittedHeader] = useState<KkdDistributionHeaderDto | null>(null);
  const [cartLines, setCartLines] = useState<LocalDistributionLine[]>([]);

  useEffect(() => {
    setPageTitle('KKD Dağıtım');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const remainingEntitlementsQuery = useQuery({
    queryKey: ['kkd', 'distribution', 'remaining-entitlements', resolvedEmployee?.employeeId],
    queryFn: () => kkdApi.getRemainingEntitlements(resolvedEmployee!.employeeId),
    enabled: Boolean(resolvedEmployee?.employeeId),
  });

  const resolveQrMutation = useMutation({
    mutationFn: kkdApi.resolveEmployeeQr,
    onSuccess: (data) => {
      setResolvedEmployee(data);
      setSubmittedHeader(null);
      setResolvedStock(null);
      setEntitlementResult(null);
      setCartLines([]);
      toast.success('Çalışan bulundu');
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedEmployee || !selectedWarehouse || cartLines.length === 0) {
        throw new Error('Çalışan, depo ve satır bilgisi gereklidir.');
      }

      return kkdApi.submitDistribution({
        employeeId: resolvedEmployee.employeeId,
        warehouseId: selectedWarehouse.id,
        sourceChannel: 'WMS',
        lines: cartLines.map(({ clientId: _clientId, stockCode: _stockCode, stockName: _stockName, groupCode: _groupCode, groupName: _groupName, entitlement: _entitlement, ...line }) => line),
      });
    },
    onSuccess: (data) => {
      setSubmittedHeader(data);
      setCartLines([]);
      setBarcode('');
      setResolvedStock(null);
      setEntitlementResult(null);
      setQuantity('1');
      remainingEntitlementsQuery.refetch();
      toast.success('KKD dağıtımı tamamlandı');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const canResolveStock = Boolean(resolvedEmployee && selectedWarehouse && barcode.trim());
  const canAddLine = Boolean(resolvedStock && entitlementResult?.allowed);
  const totalLineQuantity = useMemo(
    () => cartLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [cartLines],
  );

  const selectedGroupEntitlement = useMemo(() => {
    if (!resolvedStock?.groupCode || !remainingEntitlementsQuery.data) return null;
    return remainingEntitlementsQuery.data.find((item) => item.groupCode === resolvedStock.groupCode) ?? null;
  }, [remainingEntitlementsQuery.data, resolvedStock?.groupCode]);

  function handleAddLine(): void {
    if (!resolvedStock || !entitlementResult?.allowed) return;

    setCartLines((prev) => [
      ...prev,
      {
        clientId: `${resolvedStock.stockId}-${Date.now()}`,
        barcode,
        stockId: resolvedStock.stockId,
        quantity: Number(quantity) || 1,
        stockCode: resolvedStock.stockCode,
        stockName: resolvedStock.stockName,
        groupCode: resolvedStock.groupCode,
        groupName: resolvedStock.groupName,
        entitlement: entitlementResult,
      },
    ]);

    setBarcode('');
    setResolvedStock(null);
    setEntitlementResult(null);
    setQuantity('1');
    toast.success('Satır sepete eklendi');
  }

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
                    setSubmittedHeader(null);
                    setResolvedStock(null);
                    setEntitlementResult(null);
                    setCartLines([]);
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

              {submittedHeader ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">Header #{submittedHeader.id}</Badge>
                    <Badge>{submittedHeader.status}</Badge>
                    <Badge variant="secondary">Depo #{submittedHeader.warehouseId}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Belge No: {submittedHeader.documentNo || '-'}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kişinin Alabilir Hakları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!resolvedEmployee ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Önce çalışan seçildiğinde görev tanımına bağlı grup hakları burada görünür.</p>
              ) : remainingEntitlementsQuery.isLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Haklar yükleniyor...</p>
              ) : !remainingEntitlementsQuery.data?.length ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Bu kişi için tanımlı aktif grup hakkı bulunamadı.</p>
              ) : (
                <div className="space-y-3">
                  {remainingEntitlementsQuery.data.map((item: KkdRemainingEntitlementDto) => (
                    <div key={item.groupCode} className={`rounded-2xl border p-4 ${item.groupCode === resolvedStock?.groupCode ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{item.groupCode}</Badge>
                        {item.suggestedPhaseType ? <Badge variant="secondary">{item.suggestedPhaseType}</Badge> : null}
                        <Badge variant="outline">İlk Giriş: {item.remainingInitialQuantity}</Badge>
                        <Badge variant="outline">3 Ay: {item.remainingThreeMonthQuantity}</Badge>
                        <Badge variant="outline">Rutin: {item.remainingRecurringQuantity}</Badge>
                        <Badge variant="secondary">Toplam: {item.totalRemainingQuantity}</Badge>
                      </div>
                      {item.groupName ? <p className="mt-2 font-medium text-slate-900 dark:text-white">{item.groupName}</p> : null}
                      {item.message ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p> : null}
                    </div>
                  ))}
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
                    {entitlementResult.activePhaseLabel ? <Badge variant="secondary">Aktif Faz: {entitlementResult.activePhaseLabel}</Badge> : null}
                    <Badge variant="outline">İlk Giriş: {entitlementResult.remainingInitialQuantity}</Badge>
                    <Badge variant="outline">3 Ay: {entitlementResult.remainingThreeMonthQuantity}</Badge>
                    <Badge variant="outline">Rutin: {entitlementResult.remainingRecurringQuantity}</Badge>
                    <Badge variant="outline">Ek: {entitlementResult.remainingAdditionalQuantity}</Badge>
                    <Badge variant="secondary">Toplam: {entitlementResult.totalRemainingQuantity}</Badge>
                  </div>
                  {entitlementResult.eligibilityExplanation ? <p className="mt-3 text-sm">{entitlementResult.eligibilityExplanation}</p> : null}
                  {entitlementResult.message ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{entitlementResult.message}</p> : null}
                  {entitlementResult.phaseStatuses?.length ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {entitlementResult.phaseStatuses.map((phase) => (
                        <div key={phase.phaseType} className={`rounded-xl border p-3 ${phase.isCurrentPhase ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={phase.isCurrentPhase ? 'default' : 'outline'}>{phase.phaseLabel}</Badge>
                            {phase.isAllowed ? <Badge variant="secondary">Kullanılabilir</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm">Tanımlı: {phase.definedQuantity}</p>
                          <p className="text-sm">Kalan: {phase.remainingQuantity}</p>
                          {phase.frequencyDays ? <p className="text-sm">Frekans: {phase.frequencyDays} gün / {phase.quantityPerFrequency ?? 0}</p> : null}
                          {phase.message ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{phase.message}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {selectedGroupEntitlement && !entitlementResult ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  Bu grupta mevcut hak: İlk Giriş {selectedGroupEntitlement.remainingInitialQuantity}, 3 Ay {selectedGroupEntitlement.remainingThreeMonthQuantity}, Rutin {selectedGroupEntitlement.remainingRecurringQuantity}, Toplam {selectedGroupEntitlement.totalRemainingQuantity}.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleAddLine} disabled={!canAddLine}>
                  Satıra Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dağıtım Sepeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Satır: {cartLines.length}</Badge>
                <Badge variant="secondary">Toplam Miktar: {totalLineQuantity}</Badge>
              </div>

              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.clientId} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{line.stockCode} - {line.stockName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Grup: {line.groupCode || '-'} | Miktar: {line.quantity} | Faz: {line.entitlement.activePhaseLabel || '-'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCartLines((prev) => prev.filter((item) => item.clientId !== line.clientId))}
                      >
                        Satırı Sil
                      </Button>
                    </div>
                  </div>
                ))}
                {!cartLines.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    Henüz satır eklenmedi.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => submitMutation.mutate()} disabled={!cartLines.length || submitMutation.isPending}>
                  Kaydet ve Tamamla
                </Button>
                <Button type="button" variant="outline" onClick={() => setCartLines([])} disabled={!cartLines.length}>
                  Sepeti Temizle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
