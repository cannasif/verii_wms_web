import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { useUIStore } from '@/stores/ui-store';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { shelfManagementApi } from '@/features/shelf-management/api/shelf-management.api';
import type { ShelfDefinitionDto } from '@/features/shelf-management/types/shelf-management.types';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type { SaveSteelGoodReciptAcceptansePlacementDto, SteelGoodReciptAcceptanseLineListItemDto } from '../types/steel-good-recipt-acceptanse.types';

export function SteelGoodReciptAcceptansePlacementPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLine, setSelectedLine] = useState<SteelGoodReciptAcceptanseLineListItemDto | null>(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [warehouse, setWarehouse] = useState<WarehouseReferenceDto | null>(null);
  const [shelf, setShelf] = useState<ShelfDefinitionDto | null>(null);
  const [form, setForm] = useState<SaveSteelGoodReciptAcceptansePlacementDto | null>(null);

  useEffect(() => {
    setPageTitle('Sac Mal Kabul Yerleştirme');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const candidatesQuery = useQuery({
    queryKey: ['sgra', 'placement', 'candidates', search],
    queryFn: () => steelGoodReciptAcceptanseApi.getPlacementCandidatesPaged({ pageNumber: 1, pageSize: 100, search }),
  });

  const occupancyQuery = useQuery({
    queryKey: ['sgra', 'placement', 'occupancy', warehouse?.id, shelf?.id, form?.areaCode],
    queryFn: () => steelGoodReciptAcceptanseApi.getLocationOccupancy(warehouse!.id, shelf?.id, form?.areaCode),
    enabled: Boolean(warehouse?.id && (shelf?.id || form?.areaCode?.trim())),
  });

  useEffect(() => {
    if (!selectedLine) {
      setForm(null);
      return;
    }

    setForm({
      lineId: selectedLine.id,
      warehouseId: warehouse?.id ?? 0,
      shelfId: shelf?.id ?? null,
      areaCode: '',
      placementType: 'SideBySide',
      stackOrderNo: null,
      rowNo: null,
      positionNo: null,
      note: '',
    });
  }, [selectedLine]);

  useEffect(() => {
    setForm((current) => current ? { ...current, warehouseId: warehouse?.id ?? 0 } : current);
  }, [warehouse]);

  useEffect(() => {
    setForm((current) => current ? { ...current, shelfId: shelf?.id ?? null } : current);
  }, [shelf]);

  const candidates = candidatesQuery.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form) throw new Error('Yerleştirme formu hazır değil');
      return steelGoodReciptAcceptanseApi.savePlacement(form);
    },
    onSuccess: () => {
      toast.success('Yerleştirme kaydedildi');
      setSelectedLine(null);
      setWarehouse(null);
      setShelf(null);
      void candidatesQuery.refetch();
      void occupancyQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sameLocationSummary = useMemo(() => occupancyQuery.data ?? [], [occupancyQuery.data]);

  function updateForm<K extends keyof SaveSteelGoodReciptAcceptansePlacementDto>(key: K, value: SaveSteelGoodReciptAcceptansePlacementDto[K]): void {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">Sac Mal Kabul</Badge>
      <FormPageShell
        title="Saha / Hücre Yerleştirme"
        description="İrsaliyeye aktarılmış levhaları saha veya hücreye yerleştirin. Üst üste istifte sıra numarası zorunludur."
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="space-y-4">
              <CardTitle>Yerleştirilecek Levhalar</CardTitle>
              <div className="flex gap-3">
                <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="D-KODU, stok veya seri ara" />
                <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>Ara</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedLine(row)}
                  className={`w-full rounded-2xl border p-4 text-left ${selectedLine?.id === row.id ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5'}`}
                >
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">{row.dCode}</Badge>
                    <Badge variant="secondary">{row.stockCode}</Badge>
                    <Badge variant="secondary">{row.status}</Badge>
                  </div>
                  <div className="mt-2 font-medium">{row.serialNo}</div>
                  <div className="text-sm text-slate-400">{row.supplierCode} - {row.supplierName}</div>
                  <div className="mt-1 text-sm">Onaylanan miktar: <span className="font-medium">{row.approvedQuantity}</span></div>
                </button>
              ))}
              {!candidatesQuery.isLoading && candidates.length === 0 ? (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">Yerleştirme bekleyen levha bulunmuyor.</div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Yerleştirme Formu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLine && form ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>D-KODU</Label><Input value={selectedLine.dCode} readOnly /></div>
                      <div><Label>Levha No</Label><Input value={selectedLine.serialNo} readOnly /></div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Depo</Label>
                        <PagedLookupDialog<WarehouseReferenceDto>
                          open={warehouseOpen}
                          onOpenChange={setWarehouseOpen}
                          title="Depo Seç"
                          placeholder="Depo seçin"
                          value={warehouse ? `${warehouse.warehouseCode} - ${warehouse.warehouseName}` : ''}
                          queryKey={['sgra', 'placement', 'warehouses']}
                          fetchPage={({ pageNumber, pageSize, search: warehouseSearch }: { pageNumber: number; pageSize: number; search: string }) =>
                            erpReferenceApi.getWarehouses({ pageNumber, pageSize, search: warehouseSearch })}
                          getKey={(item: WarehouseReferenceDto) => String(item.id)}
                          getLabel={(item: WarehouseReferenceDto) => `${item.warehouseCode} - ${item.warehouseName}`}
                          onSelect={(item: WarehouseReferenceDto) => {
                            setWarehouse(item);
                            setShelf(null);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hücre / Raf</Label>
                        <PagedLookupDialog<ShelfDefinitionDto>
                          open={shelfOpen}
                          onOpenChange={setShelfOpen}
                          title="Hücre / Raf Seç"
                          placeholder="Hücre seçin"
                          value={shelf ? `${shelf.code} - ${shelf.name}` : ''}
                          disabled={!warehouse}
                          queryKey={['sgra', 'placement', 'shelves', warehouse?.id ?? 0]}
                          fetchPage={async ({ search: shelfSearch }: { pageNumber: number; pageSize: number; search: string }) => {
                            if (!warehouse) {
                              return { data: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
                            }
                            const response = await shelfManagementApi.getLookup(warehouse.id);
                            const filtered = (response.data ?? []).filter((item) => !shelfSearch || `${item.code} ${item.name}`.toLowerCase().includes(shelfSearch.toLowerCase()));
                            return {
                              data: filtered,
                              totalCount: filtered.length,
                              pageNumber: 1,
                              pageSize: 20,
                              totalPages: 1,
                              hasNextPage: false,
                              hasPreviousPage: false,
                            };
                          }}
                          getKey={(item: ShelfDefinitionDto) => String(item.id)}
                          getLabel={(item: ShelfDefinitionDto) => `${item.code} - ${item.name}`}
                          onSelect={(item: ShelfDefinitionDto) => setShelf(item)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Saha Kodu</Label><Input value={form.areaCode ?? ''} onChange={(event) => updateForm('areaCode', event.target.value)} placeholder="Saha / alan kodu" /></div>
                      <div className="space-y-2">
                        <Label>Yerleşim Tipi</Label>
                        <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.placementType} onChange={(event) => updateForm('placementType', event.target.value)}>
                          <option value="SideBySide">Yan Yana</option>
                          <option value="Stacked">Üst Üste</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div><Label>İstif Sıra No</Label><Input type="number" value={form.stackOrderNo ?? ''} onChange={(event) => updateForm('stackOrderNo', event.target.value ? Number(event.target.value) : null)} /></div>
                      <div><Label>Sıra No</Label><Input type="number" value={form.rowNo ?? ''} onChange={(event) => updateForm('rowNo', event.target.value ? Number(event.target.value) : null)} /></div>
                      <div><Label>Pozisyon No</Label><Input type="number" value={form.positionNo ?? ''} onChange={(event) => updateForm('positionNo', event.target.value ? Number(event.target.value) : null)} /></div>
                    </div>

                    <div className="space-y-2">
                      <Label>Not</Label>
                      <Textarea value={form.note ?? ''} onChange={(event) => updateForm('note', event.target.value)} placeholder="Yerleşim notu" />
                    </div>

                    <Button type="button" className="w-full" disabled={saveMutation.isPending} onClick={() => void saveMutation.mutateAsync()}>
                      {saveMutation.isPending ? 'Kaydediliyor...' : 'Yerleşimi Kaydet'}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">Soldan bir levha seçin.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Aynı Lokasyondaki Mevcut Levhalar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sameLocationSummary.map((item) => (
                  <div key={`${item.lineId}-${item.dCode}`} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">{item.dCode}</Badge>
                      <Badge variant="secondary">{item.placementType}</Badge>
                      {item.stackOrderNo ? <Badge variant="secondary">İstif {item.stackOrderNo}</Badge> : null}
                    </div>
                    <div className="mt-2 font-medium">{item.serialNo}</div>
                    <div className="text-sm text-slate-400">{item.stockCode} • {item.supplierCode}</div>
                  </div>
                ))}
                {!occupancyQuery.isLoading && sameLocationSummary.length === 0 ? (
                  <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">Bu lokasyonda kayıtlı başka levha yok.</div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
