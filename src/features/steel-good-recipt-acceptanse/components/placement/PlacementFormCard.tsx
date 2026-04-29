import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import type { TFunction } from 'i18next';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import type { PagedResponse } from '@/types/api';
import type { ShelfDefinitionDto } from '@/features/shelf-management/types/shelf-management.types';
import type {
  SaveSteelGoodReciptAcceptansePlacementDto,
  SteelGoodReciptAcceptanseLineListItemDto,
  SteelGoodReciptAcceptanseLocationOccupancyItemDto,
} from '../../types/steel-good-recipt-acceptanse.types';

interface PlacementFormCardProps {
  t: TFunction<'common'>;
  selectedLine: SteelGoodReciptAcceptanseLineListItemDto | null;
  form: SaveSteelGoodReciptAcceptansePlacementDto | null;
  warehouseOpen: boolean;
  onWarehouseOpenChange: (open: boolean) => void;
  warehouse: WarehouseReferenceDto | null;
  onSelectWarehouse: (item: WarehouseReferenceDto) => void;
  shelfOpen: boolean;
  onShelfOpenChange: (open: boolean) => void;
  shelf: ShelfDefinitionDto | null;
  onSelectShelf: (item: ShelfDefinitionDto) => void;
  fetchShelves: (args: { pageNumber: number; pageSize: number; search: string }) => Promise<PagedResponse<ShelfDefinitionDto>>;
  sameLocationSummary: SteelGoodReciptAcceptanseLocationOccupancyItemDto[];
  onApplyPlacementPreset: (anchor: SteelGoodReciptAcceptanseLocationOccupancyItemDto, mode: 'beside' | 'behind' | 'above') => void;
  onUpdateForm: <K extends keyof SaveSteelGoodReciptAcceptansePlacementDto>(key: K, value: SaveSteelGoodReciptAcceptansePlacementDto[K]) => void;
  onSave: () => void;
  savePending: boolean;
  onOpenVisualization: (mode: '2d' | '3d') => void;
}

export function PlacementFormCard({
  t,
  selectedLine,
  form,
  warehouseOpen,
  onWarehouseOpenChange,
  warehouse,
  onSelectWarehouse,
  shelfOpen,
  onShelfOpenChange,
  shelf,
  onSelectShelf,
  fetchShelves,
  sameLocationSummary,
  onApplyPlacementPreset,
  onUpdateForm,
  onSave,
  savePending,
  onOpenVisualization,
}: PlacementFormCardProps): ReactElement {
  return (
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
                  onOpenChange={onWarehouseOpenChange}
                  title={t('steelGoodReceiptAcceptance.placement.whTitle')}
                  placeholder={t('steelGoodReceiptAcceptance.placement.whPh')}
                  value={warehouse ? `${warehouse.warehouseCode} - ${warehouse.warehouseName}` : ''}
                  queryKey={['sgra', 'placement', 'warehouses']}
                  fetchPage={({ pageNumber, pageSize, search: warehouseSearch }) =>
                    erpReferenceApi.getWarehouses({ pageNumber, pageSize, search: warehouseSearch })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.warehouseCode} - ${item.warehouseName}`}
                  onSelect={onSelectWarehouse}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('steelGoodReceiptAcceptance.placement.shelfTitle')}</Label>
                <PagedLookupDialog<ShelfDefinitionDto>
                  open={shelfOpen}
                  onOpenChange={onShelfOpenChange}
                  title={t('steelGoodReceiptAcceptance.placement.shelfTitle')}
                  placeholder={t('steelGoodReceiptAcceptance.placement.shelfPh')}
                  value={shelf ? `${shelf.code} - ${shelf.name}` : ''}
                  disabled={!warehouse}
                  queryKey={['sgra', 'placement', 'shelves', warehouse?.id ?? 0]}
                  fetchPage={fetchShelves}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.code} - ${item.name}`}
                  onSelect={onSelectShelf}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>{t('steelGoodReceiptAcceptance.placement.area')}</Label><Input value={form.areaCode ?? ''} onChange={(event) => onUpdateForm('areaCode', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.areaPh')} /></div>
              <div className="space-y-2">
                <Label>{t('steelGoodReceiptAcceptance.placement.placementType')}</Label>
                <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.placementType} onChange={(event) => onUpdateForm('placementType', event.target.value)}>
                  <option value="SideBySide">{t('steelGoodReceiptAcceptance.placement.sideBySide')}</option>
                  <option value="Stacked">{t('steelGoodReceiptAcceptance.placement.stacked')}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div><Label>{t('steelGoodReceiptAcceptance.placement.stackOrder')}</Label><Input type="number" value={form.stackOrderNo ?? ''} onChange={(event) => onUpdateForm('stackOrderNo', event.target.value ? Number(event.target.value) : null)} /></div>
              <div><Label>{t('steelGoodReceiptAcceptance.placement.row')}</Label><Input type="number" value={form.rowNo ?? ''} onChange={(event) => onUpdateForm('rowNo', event.target.value ? Number(event.target.value) : null)} /></div>
              <div><Label>{t('steelGoodReceiptAcceptance.placement.pos')}</Label><Input type="number" value={form.positionNo ?? ''} onChange={(event) => onUpdateForm('positionNo', event.target.value ? Number(event.target.value) : null)} /></div>
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
                        <Button type="button" variant="outline" onClick={() => onApplyPlacementPreset(item, 'beside')}>
                          {t('steelGoodReceiptAcceptance.placement.placeBeside')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => onApplyPlacementPreset(item, 'behind')}>
                          {t('steelGoodReceiptAcceptance.placement.placeBehind')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => onApplyPlacementPreset(item, 'above')}>
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
              <Textarea value={form.note ?? ''} onChange={(event) => onUpdateForm('note', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.notePh')} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Button type="button" className="md:col-span-3" disabled={savePending} onClick={onSave}>
                {savePending ? t('steelGoodReceiptAcceptance.placement.saving') : t('steelGoodReceiptAcceptance.placement.saveBtn')}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenVisualization('2d')}>
                {t('steelGoodReceiptAcceptance.placement.open2d')}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenVisualization('3d')}>
                {t('steelGoodReceiptAcceptance.placement.open3d')}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.pickPlate')}</div>
        )}
      </CardContent>
    </Card>
  );
}
