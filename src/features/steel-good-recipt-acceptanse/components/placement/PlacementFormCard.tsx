import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { OpsActionButton, OpsInput, OpsTextarea } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SelectItem } from '@/components/ui/select';
import type { TFunction } from 'i18next';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import {
  MasterDataOpsEmptyState,
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
  MasterDataOpsSelect,
} from '@/features/shared';
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
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.placement.formTitle')}>
      {selectedLine && form ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.dcode')}>
              <OpsInput value={selectedLine.dCode} readOnly />
            </MasterDataOpsFormField>
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.plate')}>
              <OpsInput value={selectedLine.serialNo} readOnly />
            </MasterDataOpsFormField>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.whTitle')}>
              <PagedLookupDialog<WarehouseReferenceDto>
                variant="ops"
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
            </MasterDataOpsFormField>
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.shelfTitle')}>
              <PagedLookupDialog<ShelfDefinitionDto>
                variant="ops"
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
            </MasterDataOpsFormField>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.area')}>
              <OpsInput value={form.areaCode ?? ''} onChange={(event) => onUpdateForm('areaCode', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.areaPh')} />
            </MasterDataOpsFormField>
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.placementType')}>
              <MasterDataOpsSelect value={form.placementType} onValueChange={(value) => onUpdateForm('placementType', value)}>
                <SelectItem value="SideBySide">{t('steelGoodReceiptAcceptance.placement.sideBySide')}</SelectItem>
                <SelectItem value="Stacked">{t('steelGoodReceiptAcceptance.placement.stacked')}</SelectItem>
              </MasterDataOpsSelect>
            </MasterDataOpsFormField>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.stackOrder')}>
              <OpsInput type="number" value={form.stackOrderNo ?? ''} onChange={(event) => onUpdateForm('stackOrderNo', event.target.value ? Number(event.target.value) : null)} />
            </MasterDataOpsFormField>
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.row')}>
              <OpsInput type="number" value={form.rowNo ?? ''} onChange={(event) => onUpdateForm('rowNo', event.target.value ? Number(event.target.value) : null)} />
            </MasterDataOpsFormField>
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.pos')}>
              <OpsInput type="number" value={form.positionNo ?? ''} onChange={(event) => onUpdateForm('positionNo', event.target.value ? Number(event.target.value) : null)} />
            </MasterDataOpsFormField>
          </div>

          <div className="mt-4 border border-[color-mix(in_oklab,var(--wms-ops-accent)_14%,var(--wms-ops-card-border))] p-4">
            <div className="mb-3 font-medium">{t('steelGoodReceiptAcceptance.placement.quickSuggestTitle')}</div>
            <p className="mb-3 text-sm opacity-70">{t('steelGoodReceiptAcceptance.placement.quickSuggestDesc')}</p>
            {sameLocationSummary.length > 0 ? (
              <div className="space-y-3">
                {sameLocationSummary.map((item) => (
                  <div key={item.lineId} className="border border-[color-mix(in_oklab,var(--wms-ops-accent)_12%,var(--wms-ops-card-border))] p-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <MasterDataOpsFlagChip>{item.dCode}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone="info">{item.stockCode}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip>R{item.rowNo ?? '-'}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip>P{item.positionNo ?? '-'}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip>S{item.stackOrderNo ?? 0}</MasterDataOpsFlagChip>
                    </div>
                    <div className="mt-2 font-medium">{item.serialNo}</div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <OpsActionButton type="button" variant="secondary" onClick={() => onApplyPlacementPreset(item, 'beside')}>
                        {t('steelGoodReceiptAcceptance.placement.placeBeside')}
                      </OpsActionButton>
                      <OpsActionButton type="button" variant="secondary" onClick={() => onApplyPlacementPreset(item, 'behind')}>
                        {t('steelGoodReceiptAcceptance.placement.placeBehind')}
                      </OpsActionButton>
                      <OpsActionButton type="button" variant="secondary" onClick={() => onApplyPlacementPreset(item, 'above')}>
                        {t('steelGoodReceiptAcceptance.placement.placeAbove')}
                      </OpsActionButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.placement.noOccupancyHelp')}</MasterDataOpsEmptyState>
            )}
          </div>

          <MasterDataOpsFormField label={t('common.description')} className="mt-4">
            <OpsTextarea value={form.note ?? ''} onChange={(event) => onUpdateForm('note', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.notePh')} />
          </MasterDataOpsFormField>

          <div className="wms-ops-actions mt-5 grid gap-3 md:grid-cols-3">
            <OpsActionButton type="button" variant="primary" className="md:col-span-3" disabled={savePending} onClick={onSave}>
              {savePending ? <Loader2 className="size-4 animate-spin" /> : null}
              {savePending ? t('steelGoodReceiptAcceptance.placement.saving') : t('steelGoodReceiptAcceptance.placement.saveBtn')}
            </OpsActionButton>
            <OpsActionButton type="button" variant="secondary" onClick={() => onOpenVisualization('2d')}>
              {t('steelGoodReceiptAcceptance.placement.open2d')}
            </OpsActionButton>
            <OpsActionButton type="button" variant="secondary" onClick={() => onOpenVisualization('3d')}>
              {t('steelGoodReceiptAcceptance.placement.open3d')}
            </OpsActionButton>
          </div>
        </>
      ) : (
        <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.placement.pickPlate')}</MasterDataOpsEmptyState>
      )}
    </MasterDataOpsSection>
  );
}
