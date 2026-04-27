import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormPageShell } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SaveSteelGoodReciptAcceptanseInspectionDto,
  SteelGoodReciptAcceptanseInspectionBatchSearchDto,
  SteelGoodReciptAcceptanseLineListItemDto,
} from '../types/steel-good-recipt-acceptanse.types';
import { SteelGoodReciptAcceptansePhotoUpload } from './SteelGoodReciptAcceptansePhotoUpload';

function getStatusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('approved')) return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (normalized.includes('rejected')) return 'border-rose-400/20 bg-rose-500/10 text-rose-200';
  if (normalized.includes('arrived')) return 'border-sky-400/20 bg-sky-500/10 text-sky-200';
  return 'border-white/10 bg-white/5 text-slate-200';
}

export function SteelGoodReciptAcceptanseInspectionPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [uniqueValueInput, setUniqueValueInput] = useState('');
  const [uniqueValue, setUniqueValue] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<SteelGoodReciptAcceptanseInspectionBatchSearchDto | null>(null);
  const [selectedLine, setSelectedLine] = useState<SteelGoodReciptAcceptanseLineListItemDto | null>(null);
  const [form, setForm] = useState<SaveSteelGoodReciptAcceptanseInspectionDto | null>(null);

  useEffect(() => {
    setPageTitle('Sac Mal Kabul Kontrol');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const batchQuery = useQuery({
    queryKey: ['sgra', 'inspection', 'batches', uniqueValue],
    queryFn: () => steelGoodReciptAcceptanseApi.searchInspectionBatches(uniqueValue),
    enabled: uniqueValue.trim().length > 0,
  });

  const detailQuery = useQuery({
    queryKey: ['sgra', 'inspection', 'detail', selectedLine?.id],
    queryFn: () => steelGoodReciptAcceptanseApi.getLineDetail(selectedLine!.id),
    enabled: Boolean(selectedLine?.id),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm({
      lineId: detailQuery.data.id,
      isArrived: detailQuery.data.isArrived,
      isApproved: detailQuery.data.isApproved,
      arrivedQuantity: detailQuery.data.arrivedQuantity || detailQuery.data.expectedQuantity,
      approvedQuantity: detailQuery.data.approvedQuantity || 0,
      rejectedQuantity: detailQuery.data.rejectedQuantity || 0,
      rejectReason: detailQuery.data.rejectReason || '',
      note: '',
    });
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('Kontrol formu hazir degil');
      return steelGoodReciptAcceptanseApi.saveInspection(form);
    },
    onSuccess: () => {
      toast.success('Kontrol kaydedildi');
      void detailQuery.refetch();
      void batchQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const expectedQuantity = detailQuery.data?.expectedQuantity ?? 0;
  const remainingGap = useMemo(() => {
    if (!form) return 0;
    return Math.max(0, form.arrivedQuantity - (form.approvedQuantity + form.rejectedQuantity));
  }, [form]);

  const filteredLines = useMemo(() => {
    if (!selectedBatch) return [];
    const filter = serialFilter.trim().toLowerCase();
    if (!filter) return selectedBatch.lines;
    return selectedBatch.lines.filter((line) =>
      `${line.serialNo} ${line.serialNo2 ?? ''} ${line.stockCode} ${line.dCode}`.toLowerCase().includes(filter));
  }, [selectedBatch, serialFilter]);

  function updateForm<K extends keyof SaveSteelGoodReciptAcceptanseInspectionDto>(key: K, value: SaveSteelGoodReciptAcceptanseInspectionDto[K]): void {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function applyQuickDecision(type: 'approved' | 'missing' | 'rejected'): void {
    if (!detailQuery.data) return;
    if (type === 'approved') {
      setForm({
        lineId: detailQuery.data.id,
        isArrived: true,
        isApproved: true,
        arrivedQuantity: detailQuery.data.expectedQuantity,
        approvedQuantity: detailQuery.data.expectedQuantity,
        rejectedQuantity: 0,
        rejectReason: '',
        note: 'Hizli onay uygulandi',
      });
      return;
    }

    if (type === 'missing') {
      setForm({
        lineId: detailQuery.data.id,
        isArrived: false,
        isApproved: false,
        arrivedQuantity: 0,
        approvedQuantity: 0,
        rejectedQuantity: 0,
        rejectReason: '',
        note: 'Levha sahada bulunamadi',
      });
      return;
    }

    setForm({
      lineId: detailQuery.data.id,
      isArrived: true,
      isApproved: false,
      arrivedQuantity: detailQuery.data.expectedQuantity,
      approvedQuantity: 0,
      rejectedQuantity: detailQuery.data.expectedQuantity,
      rejectReason: detailQuery.data.rejectReason || 'Kalite red',
      note: 'Hizli red uygulandi',
    });
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">Sac Mal Kabul</Badge>
      <FormPageShell
        title="Saha Kabul Kontrol"
        description="Excel kayit no veya export ref no ile ilgili partiyi bulun, sonra o partiye ait levhalardan isleyeceginizi secin."
      >
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Kontrol Akışı Rehberi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
              <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4">
                <div className="font-medium text-sky-200">Onayla</div>
                <div>Levha sahaya geldiyse ve kalite / evrak açısından uygunsa onaylanır. Yalnızca onaylanan miktar sonraki adıma ilerler.</div>
              </div>
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4">
                <div className="font-medium text-rose-200">Reddet</div>
                <div>Levha geldi ama uygun değilse red verilir. Red miktarı varsa red nedeni girmek zorunludur.</div>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="font-medium text-amber-200">Gelmedi / Kısmi Kabul</div>
                <div>Levha hiç gelmediyse gelmedi olarak bırakılır. Kısmi geldiyse gelen, onaylanan ve red miktarlarını ayrı işleyebilirsin.</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>1. Excel Partisini Bul</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={uniqueValueInput}
                  onChange={(event) => setUniqueValueInput(event.target.value)}
                  placeholder="Excel kayit no veya export ref no girin"
                />
                <Button type="button" variant="outline" onClick={() => {
                  setUniqueValue(uniqueValueInput.trim());
                  setSelectedBatch(null);
                  setSelectedLine(null);
                  setSerialFilter('');
                }}>
                  Partiyi Bul
                </Button>
              </div>

              {batchQuery.data?.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {batchQuery.data.map((batch) => (
                    <button
                      key={batch.headerId}
                      type="button"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setSelectedLine(null);
                        setSerialFilter('');
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedBatch?.headerId === batch.headerId ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary">{batch.excelRecordNo}</Badge>
                        {batch.exportRefNo ? <Badge variant="secondary">{batch.exportRefNo}</Badge> : null}
                        <Badge variant="secondary">{batch.totalSeriesCount} seri</Badge>
                        <Badge variant="secondary">{batch.pendingSeriesCount} bekleyen</Badge>
                      </div>
                      <div className="mt-3 font-medium">{batch.supplierCode} - {batch.supplierName}</div>
                      <div className="text-sm text-slate-400">{batch.headerDocumentNo ?? 'Baslik belge no yok'}</div>
                    </button>
                  ))}
                </div>
              ) : uniqueValue && !batchQuery.isLoading ? (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">Bu unique degere ait sac mal kabul partisi bulunamadi.</div>
              ) : null}
            </CardContent>
          </Card>

          {selectedBatch ? (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="space-y-4">
                  <CardTitle>2. İşlem Yapılacak Seriyi Seç</CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">{selectedBatch.excelRecordNo}</Badge>
                    {selectedBatch.exportRefNo ? <Badge variant="secondary">{selectedBatch.exportRefNo}</Badge> : null}
                    <Badge variant="secondary">{selectedBatch.supplierCode}</Badge>
                  </div>
                  <Input
                    value={serialFilter}
                    onChange={(event) => setSerialFilter(event.target.value)}
                    placeholder="Seri no, stok kodu veya D-KODU ile filtrele"
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredLines.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedLine(row)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedLine?.id === row.id ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary">{row.dCode}</Badge>
                        <Badge variant="secondary">{row.stockCode}</Badge>
                        <Badge className={getStatusTone(row.status)}>{row.status}</Badge>
                      </div>
                      <div className="mt-2 font-medium">{row.serialNo}</div>
                      <div className="text-sm text-slate-400">{row.description}</div>
                      <div className="mt-2 text-sm text-slate-300">
                        Beklenen: <span className="font-medium">{row.expectedQuantity}</span>
                        {' · '}Onaylanan: <span className="font-medium">{row.approvedQuantity}</span>
                        {' · '}Red: <span className="font-medium">{row.rejectedQuantity}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {detailQuery.data && form ? (
                <div className="space-y-6">
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle>3. Kontrol Kararını Ver</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>D-KODU</Label><Input value={detailQuery.data.dCode} readOnly /></div>
                        <div><Label>Stok Kodu</Label><Input value={detailQuery.data.stockCode} readOnly /></div>
                        <div><Label>Levha No</Label><Input value={detailQuery.data.serialNo} readOnly /></div>
                        <div><Label>Beklenen Miktar</Label><Input value={String(expectedQuantity)} readOnly /></div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Button type="button" variant="outline" onClick={() => applyQuickDecision('approved')}>
                          Hızlı Onay
                        </Button>
                        <Button type="button" variant="outline" onClick={() => applyQuickDecision('missing')}>
                          Gelmedi İşaretle
                        </Button>
                        <Button type="button" variant="outline" onClick={() => applyQuickDecision('rejected')}>
                          Hızlı Red
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Geldi mi?</Label>
                          <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.isArrived ? 'yes' : 'no'} onChange={(event) => updateForm('isArrived', event.target.value === 'yes')}>
                            <option value="yes">Geldi</option>
                            <option value="no">Gelmedi</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Onaylandı mı?</Label>
                          <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.isApproved ? 'yes' : 'no'} onChange={(event) => updateForm('isApproved', event.target.value === 'yes')}>
                            <option value="yes">Onaylandı</option>
                            <option value="no">Onaylanmadı</option>
                          </select>
                        </div>
                        <div><Label>Gelen Miktar</Label><Input type="number" value={String(form.arrivedQuantity)} onChange={(event) => updateForm('arrivedQuantity', Number(event.target.value) || 0)} /></div>
                        <div><Label>Onaylanan Miktar</Label><Input type="number" value={String(form.approvedQuantity)} onChange={(event) => updateForm('approvedQuantity', Number(event.target.value) || 0)} /></div>
                        <div><Label>Red Miktarı</Label><Input type="number" value={String(form.rejectedQuantity)} onChange={(event) => updateForm('rejectedQuantity', Number(event.target.value) || 0)} /></div>
                        <div><Label>Durum Notu</Label><Input value={form.note ?? ''} onChange={(event) => updateForm('note', event.target.value)} placeholder="Kontrol notu" /></div>
                      </div>

                      <div><Label>Red Nedeni</Label><Input value={form.rejectReason ?? ''} onChange={(event) => updateForm('rejectReason', event.target.value)} placeholder="Red nedeni" /></div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary">Beklenen: {expectedQuantity}</Badge>
                        <Badge variant="secondary">Açık Fark: {remainingGap}</Badge>
                        <Badge variant="secondary">Durum: {detailQuery.data.status}</Badge>
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={() => void saveMutation.mutateAsync()} disabled={saveMutation.isPending}>
                          {saveMutation.isPending ? 'Kaydediliyor...' : 'Kontrolü Kaydet'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle>Kontrol Fotoğrafları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SteelGoodReciptAcceptansePhotoUpload lineId={detailQuery.data.id} onUploaded={async () => { await detailQuery.refetch(); }} />

                      <div className="space-y-3">
                        {detailQuery.data.photos.map((photo) => (
                          <div key={photo.id} className="flex items-start gap-3 rounded-xl border border-white/10 p-3">
                            <img src={photo.imageUrl} alt={photo.caption ?? photo.id.toString()} className="h-20 w-20 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">{photo.caption || 'Fotoğraf'}</div>
                              <div className="text-xs text-slate-400">{photo.createdDate ?? '-'}</div>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => void steelGoodReciptAcceptanseApi.deleteInspectionPhoto(photo.id).then(() => detailQuery.refetch())}>
                              Sil
                            </Button>
                          </div>
                        ))}
                        {detailQuery.data.photos.length === 0 ? (
                          <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">Henüz fotoğraf eklenmemiş.</div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>3. Kontrol Kararını Ver</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                      Önce ilgili Excel partisini seç, sonra içindeki serilerden kontrol yapacağın levhayı işaretle.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </FormPageShell>
    </div>
  );
}
