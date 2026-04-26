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
import type { SaveSteelGoodReciptAcceptanseInspectionDto, SteelGoodReciptAcceptanseLineListItemDto } from '../types/steel-good-recipt-acceptanse.types';
import { SteelGoodReciptAcceptansePhotoUpload } from './SteelGoodReciptAcceptansePhotoUpload';

export function SteelGoodReciptAcceptanseInspectionPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [serialNo, setSerialNo] = useState('');
  const [searchedSerialNo, setSearchedSerialNo] = useState('');
  const [selectedLine, setSelectedLine] = useState<SteelGoodReciptAcceptanseLineListItemDto | null>(null);
  const [form, setForm] = useState<SaveSteelGoodReciptAcceptanseInspectionDto | null>(null);

  useEffect(() => {
    setPageTitle('Sac Mal Kabul Kontrol');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const searchQuery = useQuery({
    queryKey: ['sgra', 'inspection', 'search', searchedSerialNo],
    queryFn: () => steelGoodReciptAcceptanseApi.searchBySerial(searchedSerialNo),
    enabled: searchedSerialNo.trim().length > 0,
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
      void searchQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const expectedQuantity = detailQuery.data?.expectedQuantity ?? 0;
  const remainingGap = useMemo(() => {
    if (!form) return 0;
    return Math.max(0, form.arrivedQuantity - (form.approvedQuantity + form.rejectedQuantity));
  }, [form]);

  function updateForm<K extends keyof SaveSteelGoodReciptAcceptanseInspectionDto>(key: K, value: SaveSteelGoodReciptAcceptanseInspectionDto[K]): void {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">Sac Mal Kabul</Badge>
      <FormPageShell
        title="Saha Kabul Kontrol"
        description="Levha no veya seri no ile arayın, geldi/onay/red ve kısmi kabul bilgisini işleyin."
      >
        <div className="space-y-6">
          <div className="flex gap-3">
            <Input value={serialNo} onChange={(event) => setSerialNo(event.target.value)} placeholder="Seri no / levha no ara" />
            <Button type="button" variant="outline" onClick={() => setSearchedSerialNo(serialNo.trim())}>Ara</Button>
          </div>

          {searchQuery.data?.length ? (
            <div className="grid gap-3">
              {searchQuery.data.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedLine(row)}
                  className={`rounded-2xl border p-4 text-left transition ${selectedLine?.id === row.id ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">{row.dCode}</Badge>
                    <Badge variant="secondary">{row.stockCode}</Badge>
                    <Badge variant="secondary">{row.status}</Badge>
                  </div>
                  <div className="mt-2 font-medium">{row.serialNo}</div>
                  <div className="text-sm text-slate-400">{row.description}</div>
                </button>
              ))}
            </div>
          ) : searchedSerialNo && !searchQuery.isLoading ? (
            <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">Aramaya uygun kayit bulunamadi.</div>
          ) : null}

          {detailQuery.data && form ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Kontrol Formu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label>D-KODU</Label><Input value={detailQuery.data.dCode} readOnly /></div>
                    <div><Label>Stok Kodu</Label><Input value={detailQuery.data.stockCode} readOnly /></div>
                    <div><Label>Levha No</Label><Input value={detailQuery.data.serialNo} readOnly /></div>
                    <div><Label>Beklenen Miktar</Label><Input value={String(expectedQuantity)} readOnly /></div>
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
          ) : null}
        </div>
      </FormPageShell>
    </div>
  );
}
