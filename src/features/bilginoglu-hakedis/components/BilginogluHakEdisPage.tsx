import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Boxes, GitBranch, Loader2, PackageCheck, Play, RefreshCw, Search, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisBatch, BilginogluHakEdisPlan } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisBatchesQuery,
  useBilginogluHakEdisPlansQuery,
  useBilginogluHakEdisStepsQuery,
  useEvaluateBilginogluHakEdisMutation,
} from '../hooks/useBilginogluHakEdisQueries';

function formatQty(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function statusBadge(status: string): ReactElement {
  const tone = status === 'ReadyForShipment'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'InHakEdisFlow'
      ? 'bg-blue-100 text-blue-700'
      : status === 'Blocked'
        ? 'bg-rose-100 text-rose-700'
        : status === 'WaitingStock'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-700';

  return <Badge className={`rounded-xl border-0 ${tone}`}>{status}</Badge>;
}

export function BilginogluHakEdisPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<BilginogluHakEdisPlan | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BilginogluHakEdisBatch | null>(null);

  useEffect(() => {
    setPageTitle('Bilginoğlu Hakediş');
  }, [setPageTitle]);

  const params = useMemo(() => ({ pageNumber: 1, pageSize: 50, search, sortBy: 'LastEvaluationDate', sortDirection: 'desc' }), [search]);
  const plansQuery = useBilginogluHakEdisPlansQuery(params);
  const batchesQuery = useBilginogluHakEdisBatchesQuery(selectedPlan?.id ?? null);
  const stepsQuery = useBilginogluHakEdisStepsQuery(selectedBatch?.id ?? null);
  const evaluateMutation = useEvaluateBilginogluHakEdisMutation();

  const plans = plansQuery.data?.data ?? [];
  const totals = useMemo(() => {
    return plans.reduce(
      (acc, plan) => {
        acc.remaining += plan.remainingOrderQty;
        acc.allocated += plan.allocatedToHakEdisQty;
        acc.ready += plan.readyForShipmentQty;
        acc.waiting += plan.waitingQty;
        return acc;
      },
      { remaining: 0, allocated: 0, ready: 0, waiting: 0 },
    );
  }, [plans]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'Bilginoğlu Hakediş' }]} />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
              <GitBranch className="size-4" />
              Hakediş planlama havuzu
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Bilginoğlu Hakediş</h1>
            <p className="text-sm leading-6 text-slate-200 md:text-base">
              Netsis sevk siparişlerini ilk anda SH emrine çevirmeden, depo bakiyesi kadar hakediş batch'i planlar.
              Hazır olan parçalar DAT/geri dönüş/sevk zincirine bağlanabilir ve sipariş bazında izlenebilir.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => evaluateMutation.mutate(undefined)}
              disabled={evaluateMutation.isPending}
            >
              {evaluateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
              Değerlendir
            </Button>
            <Button type="button" variant="secondary" className="rounded-2xl" onClick={() => void plansQuery.refetch()}>
              <RefreshCw className="mr-2 size-4" />
              Yenile
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<Boxes className="size-5" />} label="Sipariş Kalan" value={formatQty(totals.remaining)} />
        <MetricCard icon={<GitBranch className="size-5" />} label="Hakedişe Ayrılan" value={formatQty(totals.allocated)} />
        <MetricCard icon={<PackageCheck className="size-5" />} label="Sevke Hazır" value={formatQty(totals.ready)} />
        <MetricCard icon={<Truck className="size-5" />} label="Bekleyen" value={formatQty(totals.waiting)} />
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Hakediş Planları</CardTitle>
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-2xl pl-9" placeholder="Sipariş, cari veya stok ara..." />
          </div>
        </CardHeader>
        <CardContent>
          {plansQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Planlar yükleniyor...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sipariş</TableHead>
                    <TableHead>Cari</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Depo</TableHead>
                    <TableHead className="text-right">Kalan</TableHead>
                    <TableHead className="text-right">Bakiye</TableHead>
                    <TableHead className="text-right">Hakedişe Ayrılan</TableHead>
                    <TableHead className="text-right">Sevke Hazır</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Son Değerlendirme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} className="cursor-pointer" onClick={() => { setSelectedPlan(plan); setSelectedBatch(null); }}>
                      <TableCell className="font-semibold">{plan.siparisNo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{plan.customerCode ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{plan.customerName ?? '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{plan.stockCode ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{plan.stockName ?? '-'}</div>
                      </TableCell>
                      <TableCell>{plan.sourceWarehouseCode ?? '-'} {'->'} {plan.hakEdisWarehouseCode ?? '-'}</TableCell>
                      <TableCell className="text-right">{formatQty(plan.remainingOrderQty)}</TableCell>
                      <TableCell className="text-right">{formatQty(plan.warehouseAvailableQty)}</TableCell>
                      <TableCell className="text-right">{formatQty(plan.allocatedToHakEdisQty)}</TableCell>
                      <TableCell className="text-right">{formatQty(plan.readyForShipmentQty)}</TableCell>
                      <TableCell>{statusBadge(plan.status)}</TableCell>
                      <TableCell>{formatDate(plan.lastEvaluationDate)}</TableCell>
                    </TableRow>
                  ))}
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Kayıt bulunamadı.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedPlan != null} onOpenChange={(open) => { if (!open) { setSelectedPlan(null); setSelectedBatch(null); } }}>
        <DialogContent className="max-w-5xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.siparisNo} hakediş batch'leri</DialogTitle>
            <DialogDescription>Bu sipariş satırı için planlanan ara operasyon parçaları ve adımları.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead>Aşama</TableHead>
                    <TableHead>WT/SH</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(batchesQuery.data ?? []).map((batch) => (
                    <TableRow key={batch.id} className="cursor-pointer" onClick={() => setSelectedBatch(batch)}>
                      <TableCell className="font-semibold">{batch.batchNo}</TableCell>
                      <TableCell className="text-right">{formatQty(batch.quantity)}</TableCell>
                      <TableCell>{statusBadge(batch.currentStage)}</TableCell>
                      <TableCell className="text-xs">
                        DAT1 #{batch.transferToHakEdisHeaderId ?? '-'} / DAT2 #{batch.returnFromHakEdisHeaderId ?? '-'} / SH #{batch.shipmentHeaderId ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(batchesQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Henüz batch yok.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div className="rounded-2xl border p-4">
              <h3 className="mb-3 font-semibold">Batch adımları</h3>
              {selectedBatch == null ? (
                <p className="text-sm text-muted-foreground">Adımları görmek için bir batch seçin.</p>
              ) : stepsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Yükleniyor...</div>
              ) : (
                <div className="space-y-3">
                  {(stepsQuery.data ?? []).map((step) => (
                    <div key={step.id} className="rounded-2xl border bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{step.sequenceNo}. {step.stepType}</span>
                        {statusBadge(step.status)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatQty(step.quantity)} adet / {step.sourceType ?? '-'} #{step.sourceHeaderId ?? '-'}
                      </div>
                      {step.note ? <div className="mt-2 text-xs">{step.note}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactElement; label: string; value: string }): ReactElement {
  return (
    <Card className="rounded-3xl border-slate-200">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">{icon}</div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-black">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
