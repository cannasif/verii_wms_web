import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { localizeStatus } from '@/lib/localize-status';
import { useUIStore } from '@/stores/ui-store';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { shelfManagementApi } from '@/features/shelf-management/api/shelf-management.api';
import type { ShelfDefinitionDto } from '@/features/shelf-management/types/shelf-management.types';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SaveSteelGoodReciptAcceptansePlacementDto,
  SteelGoodReciptAcceptanseLineListItemDto,
  SteelGoodReciptAcceptanseLocationOccupancyItemDto,
} from '../types/steel-good-recipt-acceptanse.types';

export function SteelGoodReciptAcceptansePlacementPage(): ReactElement {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
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
    setPageTitle(t('steelGoodReceiptAcceptance.placement.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

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
      if (!form) throw new Error(t('steelGoodReceiptAcceptance.placement.errForm'));
      return steelGoodReciptAcceptanseApi.savePlacement(form);
    },
    onSuccess: () => {
      toast.success(t('steelGoodReceiptAcceptance.placement.saveOk'));
      setSelectedLine(null);
      setWarehouse(null);
      setShelf(null);
      void candidatesQuery.refetch();
      void occupancyQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sameLocationSummary = useMemo(() => occupancyQuery.data ?? [], [occupancyQuery.data]);

  function applyPlacementPreset(anchor: SteelGoodReciptAcceptanseLocationOccupancyItemDto, mode: 'beside' | 'behind' | 'above'): void {
    if (!form) return;

    if (mode === 'above') {
      setForm((current) => current ? ({
        ...current,
        placementType: 'Stacked',
        rowNo: anchor.rowNo ?? current.rowNo ?? 1,
        positionNo: anchor.positionNo ?? current.positionNo ?? 1,
        stackOrderNo: (anchor.stackOrderNo ?? 0) + 1,
      }) : current);
      return;
    }

    if (mode === 'beside') {
      setForm((current) => current ? ({
        ...current,
        placementType: 'SideBySide',
        rowNo: anchor.rowNo ?? current.rowNo ?? 1,
        positionNo: (anchor.positionNo ?? 0) + 1,
        stackOrderNo: null,
      }) : current);
      return;
    }

    setForm((current) => current ? ({
      ...current,
      placementType: 'SideBySide',
      rowNo: (anchor.rowNo ?? 0) + 1,
      positionNo: anchor.positionNo ?? current.positionNo ?? 1,
      stackOrderNo: null,
    }) : current);
  }

  function updateForm<K extends keyof SaveSteelGoodReciptAcceptansePlacementDto>(key: K, value: SaveSteelGoodReciptAcceptansePlacementDto[K]): void {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function openVisualization(mode: '2d' | '3d'): void {
    if (!warehouse?.id || (!shelf?.id && !form?.areaCode?.trim())) {
      toast.error(t('steelGoodReceiptAcceptance.placement.errView'));
      return;
    }

    const params = new URLSearchParams({
      warehouseId: String(warehouse.id),
      mode,
    });

    if (shelf?.id) {
      params.set('shelfId', String(shelf.id));
    }

    if (form?.areaCode?.trim()) {
      params.set('areaCode', form.areaCode.trim());
    }

    navigate(`/inventory/3d-outside-warehouse?${params.toString()}`);
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('steelGoodReceiptAcceptance.badge')}</Badge>
      <FormPageShell
        title={t('steelGoodReceiptAcceptance.placement.title')}
        description={t('steelGoodReceiptAcceptance.placement.description')}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="space-y-4">
              <CardTitle>{t('steelGoodReceiptAcceptance.placement.title')}</CardTitle>
              <div className="flex gap-3">
                <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.searchPh')} />
                <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>{t('common.search')}</Button>
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
                    <Badge variant="secondary">{localizeStatus(row.status, t)}</Badge>
                  </div>
                  <div className="mt-2 font-medium">{row.serialNo}</div>
                  <div className="text-sm text-slate-400">{row.supplierCode} - {row.supplierName}</div>
                  <div className="mt-1 text-sm">{t('steelGoodReceiptAcceptance.placement.approvedQty')}: <span className="font-medium">{row.approvedQuantity}</span></div>
                </button>
              ))}
              {!candidatesQuery.isLoading && candidates.length === 0 ? (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.noPending')}</div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{t('steelGoodReceiptAcceptance.placement.guideTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                  <div className="font-medium text-emerald-200">{t('steelGoodReceiptAcceptance.placement.presetBesideTitle')}</div>
                  <div>{t('steelGoodReceiptAcceptance.placement.presetBesideDesc')}</div>
                </div>
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3">
                  <div className="font-medium text-sky-200">{t('steelGoodReceiptAcceptance.placement.presetBehindTitle')}</div>
                  <div>{t('steelGoodReceiptAcceptance.placement.presetBehindDesc')}</div>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                  <div className="font-medium text-amber-200">{t('steelGoodReceiptAcceptance.placement.presetAboveTitle')}</div>
                  <div>{t('steelGoodReceiptAcceptance.placement.presetAboveDesc')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{t('steelGoodReceiptAcceptance.placement.formTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLine && form ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>{t('steelGoodReceiptAcceptance.inspection.dcode')}</Label><Input value={selectedLine.dCode} readOnly /></div>
                      <div><Label>{t('steelGoodReceiptAcceptance.inspection.plate')}</Label><Input value={selectedLine.serialNo} readOnly /></div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('steelGoodReceiptAcceptance.placement.whTitle')}</Label>
                        <PagedLookupDialog<WarehouseReferenceDto>
                          open={warehouseOpen}
                          onOpenChange={setWarehouseOpen}
                          title={t('steelGoodReceiptAcceptance.placement.whTitle')}
                          placeholder={t('steelGoodReceiptAcceptance.placement.whPh')}
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
                        <Label>{t('steelGoodReceiptAcceptance.placement.shelfTitle')}</Label>
                        <PagedLookupDialog<ShelfDefinitionDto>
                          open={shelfOpen}
                          onOpenChange={setShelfOpen}
                          title={t('steelGoodReceiptAcceptance.placement.shelfTitle')}
                          placeholder={t('steelGoodReceiptAcceptance.placement.shelfPh')}
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
                      <div><Label>{t('steelGoodReceiptAcceptance.placement.area')}</Label><Input value={form.areaCode ?? ''} onChange={(event) => updateForm('areaCode', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.areaPh')} /></div>
                      <div className="space-y-2">
                        <Label>{t('steelGoodReceiptAcceptance.placement.placementType')}</Label>
                        <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.placementType} onChange={(event) => updateForm('placementType', event.target.value)}>
                          <option value="SideBySide">{t('steelGoodReceiptAcceptance.placement.sideBySide')}</option>
                          <option value="Stacked">{t('steelGoodReceiptAcceptance.placement.stacked')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div><Label>{t('steelGoodReceiptAcceptance.placement.stackOrder')}</Label><Input type="number" value={form.stackOrderNo ?? ''} onChange={(event) => updateForm('stackOrderNo', event.target.value ? Number(event.target.value) : null)} /></div>
                      <div><Label>{t('steelGoodReceiptAcceptance.placement.row')}</Label><Input type="number" value={form.rowNo ?? ''} onChange={(event) => updateForm('rowNo', event.target.value ? Number(event.target.value) : null)} /></div>
                      <div><Label>{t('steelGoodReceiptAcceptance.placement.pos')}</Label><Input type="number" value={form.positionNo ?? ''} onChange={(event) => updateForm('positionNo', event.target.value ? Number(event.target.value) : null)} /></div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t('steelGoodReceiptAcceptance.placement.quickSuggestTitle')}</div>
                          <div className="text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.quickSuggestDesc')}</div>
                        </div>
                      </div>

                      {sameLocationSummary.length > 0 ? (
                        <div className="space-y-3">
                          {sameLocationSummary.map((item) => (
                            <div key={item.lineId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Badge variant="secondary">{item.dCode}</Badge>
                                <Badge variant="secondary">{item.stockCode}</Badge>
                                <Badge variant="secondary">R{item.rowNo ?? '-'}</Badge>
                                <Badge variant="secondary">P{item.positionNo ?? '-'}</Badge>
                                <Badge variant="secondary">S{item.stackOrderNo ?? 0}</Badge>
                              </div>
                              <div className="mt-2 font-medium">{item.serialNo}</div>
                              <div className="mt-3 grid gap-2 md:grid-cols-3">
                                <Button type="button" variant="outline" onClick={() => applyPlacementPreset(item, 'beside')}>
                                  {t('steelGoodReceiptAcceptance.placement.placeBeside')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => applyPlacementPreset(item, 'behind')}>
                                  {t('steelGoodReceiptAcceptance.placement.placeBehind')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => applyPlacementPreset(item, 'above')}>
                                  {t('steelGoodReceiptAcceptance.placement.placeAbove')}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                          {t('steelGoodReceiptAcceptance.placement.noOccupancyHelp')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('common.description')}</Label>
                      <Textarea value={form.note ?? ''} onChange={(event) => updateForm('note', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.notePh')} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <Button type="button" className="md:col-span-3" disabled={saveMutation.isPending} onClick={() => void saveMutation.mutateAsync()}>
                        {saveMutation.isPending ? t('steelGoodReceiptAcceptance.placement.saving') : t('steelGoodReceiptAcceptance.placement.saveBtn')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => openVisualization('2d')}>
                        {t('steelGoodReceiptAcceptance.placement.open2d')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => openVisualization('3d')}>
                        {t('steelGoodReceiptAcceptance.placement.open3d')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.pickPlate')}</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{t('steelGoodReceiptAcceptance.placement.sameLocationTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sameLocationSummary.map((item) => (
                  <div key={`${item.lineId}-${item.dCode}`} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">{item.dCode}</Badge>
                      <Badge variant="secondary">{item.placementType}</Badge>
                      {item.stackOrderNo ? <Badge variant="secondary">{t('steelGoodReceiptAcceptance.placement.stackBadge', { n: item.stackOrderNo })}</Badge> : null}
                    </div>
                    <div className="mt-2 font-medium">{item.serialNo}</div>
                    <div className="text-sm text-slate-400">{item.stockCode} • {item.supplierCode}</div>
                  </div>
                ))}
                {!occupancyQuery.isLoading && sameLocationSummary.length === 0 ? (
                  <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.noOther')}</div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
