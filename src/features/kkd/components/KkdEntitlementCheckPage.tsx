import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdEmployeeDto, KkdEntitlementCheckResultDto, KkdStockGroupOption } from '../types/kkd.types';

export function KkdEntitlementCheckPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<KkdEmployeeDto | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<KkdEntitlementCheckResultDto | null>(null);

  useEffect(() => {
    setPageTitle('KKD Hak Sorgulama');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'entitlement-check', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
  });

  const selectedGroup = useMemo(
    () => stockGroupsQuery.data?.find((item) => item.groupCode === groupCode) ?? null,
    [groupCode, stockGroupsQuery.data],
  );

  const checkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error('Önce çalışan seçiniz.');
      if (!groupCode) throw new Error('Önce grup kodu seçiniz.');

      return kkdApi.checkEntitlement({
        employeeId: selectedEmployee.id,
        customerId: selectedEmployee.customerId,
        groupCode,
        quantity: Number(quantity) || 1,
        transactionDate: transactionDate || null,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.allowed ? 'Hak kontrolü uygun.' : 'Hak kontrolü tamamlandı.');
    },
    onError: (error) => {
      setResult(null);
      toast.error(error instanceof Error ? error.message : 'Hak kontrolü yapılamadı.');
    },
  });

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'KKD Hak Sorgulama', isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Hak Kontrol Girdileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Çalışan</Label>
              <PagedLookupDialog<KkdEmployeeDto>
                open={employeeDialogOpen}
                onOpenChange={setEmployeeDialogOpen}
                title="Çalışan Seç"
                value={selectedEmployee ? `${selectedEmployee.employeeCode} - ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : null}
                placeholder="Çalışan seçiniz"
                queryKey={['kkd', 'entitlement-check', 'employees']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
                onSelect={(item) => {
                  setSelectedEmployee(item);
                  setResult(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Grup Kodu</Label>
              <SearchableSelect<KkdStockGroupOption>
                value={groupCode}
                onValueChange={(value) => {
                  setGroupCode(value);
                  setResult(null);
                }}
                options={stockGroupsQuery.data ?? []}
                getOptionValue={(option) => option.groupCode}
                getOptionLabel={(option) => `${option.groupCode}${option.groupName ? ` - ${option.groupName}` : ''}`}
                placeholder="Grup kodu seçiniz"
                searchPlaceholder="Grup kodu veya grup adı ara"
                emptyText="Grup kodu bulunamadı"
                isLoading={stockGroupsQuery.isLoading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kkd-check-qty">Miktar</Label>
                <Input
                  id="kkd-check-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setResult(null);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kkd-check-date">İşlem Tarihi</Label>
                <Input
                  id="kkd-check-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => {
                    setTransactionDate(event.target.value);
                    setResult(null);
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
              Bu ekran QR veya barkod akışına girmeden önce kalan hakları görmek için tasarlandı. Dağıtım ekranındaki aynı
              entitlement API’sini kullanır; sonuçlar bu yüzden operasyonla birebir uyumludur.
            </div>

            <Button type="button" onClick={() => checkMutation.mutate()} disabled={!selectedEmployee || !groupCode || checkMutation.isPending}>
              Hakkı Sorgula
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hak Sonucu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedEmployee ? <Badge>{selectedEmployee.employeeCode}</Badge> : null}
              {selectedEmployee?.customerCode ? <Badge variant="secondary">{selectedEmployee.customerCode}</Badge> : null}
              {selectedGroup?.groupCode ? <Badge variant="outline">{selectedGroup.groupCode}</Badge> : null}
              {selectedGroup?.groupName ? <Badge variant="outline">{selectedGroup.groupName}</Badge> : null}
            </div>

            {result ? (
              <>
                <div className={`rounded-2xl border p-4 ${result.allowed ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/60 dark:border-rose-800/40 dark:bg-rose-950/20'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={result.allowed ? 'default' : 'destructive'}>
                      {result.allowed ? 'Kullanıma Uygun' : 'Kullanıma Kapalı'}
                    </Badge>
                    <Badge variant="outline">Ana Hak: {result.remainingMainQuantity}</Badge>
                    <Badge variant="outline">Ek Hak: {result.remainingAdditionalQuantity}</Badge>
                    <Badge variant="secondary">Toplam: {result.totalRemainingQuantity}</Badge>
                  </div>

                  {result.message ? <p className="mt-3 text-sm leading-6">{result.message}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Önerilen Kaynak</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{result.suggestedEntitlementType || '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Bir Sonraki Uygun Tarih</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{result.nextEligibleDate ? new Date(result.nextEligibleDate).toLocaleDateString('tr-TR') : '-'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Çalışan, grup ve miktar seçip sorgulama yapınca sonuç burada görünecek.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
