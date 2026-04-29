import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { FormPageShell } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { shelfManagementApi } from '@/features/shelf-management/api/shelf-management.api';
import type { ShelfDefinitionDto } from '@/features/shelf-management/types/shelf-management.types';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SaveSteelGoodReciptAcceptansePlacementDto,
  SteelGoodReciptAcceptanseLineListItemDto,
  SteelGoodReciptAcceptanseLocationOccupancyItemDto,
} from '../types/steel-good-recipt-acceptanse.types';
import { PlacementCandidatesCard } from './placement/PlacementCandidatesCard';
import { PlacementGuideCard } from './placement/PlacementGuideCard';
import { PlacementFormCard } from './placement/PlacementFormCard';
import { PlacementOccupancyCard } from './placement/PlacementOccupancyCard';

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
          <PlacementCandidatesCard
            t={t}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={() => setSearch(searchInput.trim())}
            candidates={candidates}
            selectedLine={selectedLine}
            onSelectLine={setSelectedLine}
            isLoading={candidatesQuery.isLoading}
          />

          <div className="space-y-6">
            <PlacementGuideCard t={t} />

            <PlacementFormCard
              t={t}
              selectedLine={selectedLine}
              form={form}
              warehouseOpen={warehouseOpen}
              onWarehouseOpenChange={setWarehouseOpen}
              warehouse={warehouse}
              onSelectWarehouse={(item) => {
                setWarehouse(item);
                setShelf(null);
              }}
              shelfOpen={shelfOpen}
              onShelfOpenChange={setShelfOpen}
              shelf={shelf}
              onSelectShelf={setShelf}
              fetchShelves={async ({ search: shelfSearch }) => {
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
              sameLocationSummary={sameLocationSummary}
              onApplyPlacementPreset={applyPlacementPreset}
              onUpdateForm={updateForm}
              onSave={() => void saveMutation.mutateAsync()}
              savePending={saveMutation.isPending}
              onOpenVisualization={openVisualization}
            />

            <PlacementOccupancyCard
              t={t}
              items={sameLocationSummary}
              isLoading={occupancyQuery.isLoading}
            />
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
