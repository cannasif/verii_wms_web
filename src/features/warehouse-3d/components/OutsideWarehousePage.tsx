import { Suspense, lazy, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Box, Compass, Footprints, Layers, Move3D, Package, RotateCcw, Warehouse } from 'lucide-react';
import { SelectItem } from '@/components/ui/select';
import { OpsListPageShell, OpsLoadingState, OpsSelect, PageState } from '@/components/shared';
import { getApiBaseUrl } from '@/lib/axios';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { warehouse3dApi } from '../api/warehouse-3d-api';
import type {
  SteelPlacementVisualizationItemDto,
  SteelPlacementVisualizationLocationDto,
} from '../types/warehouse-3d';
import type { CameraPreset } from './outside/OutsideScene';
import { useRouteScreenReady } from '@/routes/RouteRuntimeBoundary';
import {
  Warehouse3dOpsChip,
  Warehouse3dOpsDetailCard,
  Warehouse3dOpsDetailField,
  Warehouse3dOpsEmpty,
  Warehouse3dOpsEmptyIcon,
  Warehouse3dOpsField,
  Warehouse3dOpsHud,
  Warehouse3dOpsLegend,
  Warehouse3dOpsLegendItem,
  Warehouse3dOpsModeToggle,
  Warehouse3dOpsRackPanel,
  Warehouse3dOpsRackThumb,
  Warehouse3dOpsSectionHeader,
  Warehouse3dOpsStat,
  Warehouse3dOpsStatGrid,
  Warehouse3dOpsViewport,
  Warehouse3dOpsCameraBar,
  Warehouse3dOpsCameraButton,
} from './warehouse-3d-ops-ui';

type ViewMode = '2d' | '3d';

const OutsideScene = lazy(async () => {
  const module = await import('./outside/OutsideScene');
  return { default: module.OutsideScene };
});

function getFullImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = getApiBaseUrl();
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getLocationLabel(location: SteelPlacementVisualizationLocationDto): string {
  if (location.shelfCode && location.areaCode) {
    return `${location.shelfCode} / ${location.areaCode}`;
  }
  if (location.shelfCode) {
    return location.shelfCode;
  }
  if (location.areaCode) {
    return location.areaCode;
  }
  return location.locationKey;
}

function sortItems(items: SteelPlacementVisualizationItemDto[]): SteelPlacementVisualizationItemDto[] {
  return [...items].sort((a, b) => {
    const rowCompare = (a.rowNo ?? Number.MAX_SAFE_INTEGER) - (b.rowNo ?? Number.MAX_SAFE_INTEGER);
    if (rowCompare !== 0) return rowCompare;
    const positionCompare = (a.positionNo ?? Number.MAX_SAFE_INTEGER) - (b.positionNo ?? Number.MAX_SAFE_INTEGER);
    if (positionCompare !== 0) return positionCompare;
    const stackCompare = (a.stackOrderNo ?? Number.MAX_SAFE_INTEGER) - (b.stackOrderNo ?? Number.MAX_SAFE_INTEGER);
    if (stackCompare !== 0) return stackCompare;
    return a.serialNo.localeCompare(b.serialNo, 'tr');
  });
}

function parsePositiveId(value: string | null): number {
  const parsed = Number(value ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function VisualizationPlane({
  location,
  mode,
  selectedItemId,
  onSelectItem,
}: {
  location: SteelPlacementVisualizationLocationDto;
  mode: ViewMode;
  selectedItemId: number | null;
  onSelectItem: (item: SteelPlacementVisualizationItemDto) => void;
}): ReactElement {
  const items = sortItems(location.items);

  return (
    <div className={`wms-ops-warehouse-3d-plane ${mode === '3d' ? 'min-h-[15rem]' : 'min-h-[13.75rem]'}`}>
      <div className={`${mode === '3d' ? 'relative mx-auto mt-6 h-[190px] w-[92%] perspective-[1100px]' : 'relative mx-auto mt-4 h-[180px] w-[92%]'}`}>
        {items.map((item) => {
          const col = Math.max((item.positionNo ?? 1) - 1, 0);
          const row = Math.max((item.rowNo ?? 1) - 1, 0);
          const stack = Math.max((item.stackOrderNo ?? 1) - 1, 0);
          const left = 18 + col * 72 + (item.placementType === 'SideBySide' ? row * 10 : 0);
          const top = 88 + row * 24 - (mode === '3d' ? stack * 16 : stack * 6);
          const isSelected = selectedItemId === item.lineId;
          const imageUrl = getFullImageUrl(item.imageUrl);

          return (
            <button
              key={item.lineId}
              type="button"
              onClick={() => onSelectItem(item)}
              className={`absolute flex h-[74px] w-[118px] items-end overflow-hidden rounded-none border text-left shadow-xl transition ${
                isSelected
                  ? 'border-[color:var(--wms-ops-circuit-accent)] ring-2 ring-[color:color-mix(in_oklab,var(--wms-ops-circuit-accent)_45%,transparent)]'
                  : 'border-[color:color-mix(in_oklab,var(--wms-ops-field-border)_90%,transparent)] hover:border-[color:color-mix(in_oklab,var(--wms-ops-circuit-accent)_38%,transparent)]'
              }`}
              style={{
                left,
                top,
                zIndex: 10 + stack,
                transform:
                  mode === '3d'
                    ? `rotateX(58deg) rotateZ(-22deg) translateZ(${stack * 8}px)`
                    : undefined,
                transformOrigin: 'center center',
                background:
                  imageUrl
                    ? `linear-gradient(180deg, rgba(7,10,18,0.05), rgba(7,10,18,0.68)), url(${imageUrl}) center/cover`
                    : 'linear-gradient(180deg, color-mix(in oklab, var(--wms-ops-circuit-accent) 22%, transparent), color-mix(in oklab, var(--wms-ops-accent) 16%, transparent))',
              }}
            >
              <div className="w-full bg-black/55 px-2 py-1 text-[10px] leading-tight text-white backdrop-blur-sm">
                <div className="truncate font-semibold">{item.stockCode}</div>
                <div className="truncate">{item.serialNo}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OutsideWarehousePage(): ReactElement {
  const { t } = useTranslation();
  const { reportScreenReady } = useRouteScreenReady();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWarehouseId = parsePositiveId(searchParams.get('warehouseId'));
  const initialShelfId = parsePositiveId(searchParams.get('shelfId')) || undefined;
  const initialAreaCode = searchParams.get('areaCode') ?? '';
  const initialMode = (searchParams.get('mode')?.toLowerCase() === '2d' ? '2d' : '3d') as ViewMode;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(initialWarehouseId);
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [selectedLocationKey, setSelectedLocationKey] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [cameraPresetVersion, setCameraPresetVersion] = useState<number>(0);
  const [selectedRackKey, setSelectedRackKey] = useState<string | null>(null);
  const [selectedRackItems, setSelectedRackItems] = useState<SteelPlacementVisualizationItemDto[]>([]);
  const prevLocationKey = useRef<string>('');

  const triggerCameraPreset = useCallback((preset: CameraPreset): void => {
    setCameraPreset(preset);
    setCameraPresetVersion((value) => value + 1);
    setSelectedRackKey(null);
    setSelectedRackItems([]);
  }, []);

  const handleSelectRack = useCallback(
    (key: string | null, items: SteelPlacementVisualizationItemDto[]): void => {
      setSelectedRackKey(key);
      setSelectedRackItems((prev) => (key === null ? (prev.length > 0 ? [] : prev) : items));
    },
    [],
  );

  const resolveImageUrl = useCallback((url: string | null | undefined): string | null => getFullImageUrl(url), []);

  const warehousesQuery = useQuery({
    queryKey: ['outside-warehouse', 'warehouses'],
    queryFn: () => erpReferenceApi.getAllWarehouses(),
  });

  const visualizationQuery = useQuery({
    queryKey: ['outside-warehouse', 'visualization', selectedWarehouseId, initialShelfId ?? 0, initialAreaCode],
    queryFn: () => warehouse3dApi.getSteelPlacementVisualization(selectedWarehouseId, initialShelfId, initialAreaCode || undefined),
    enabled: selectedWarehouseId > 0,
  });

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
  const visualization = visualizationQuery.data;
  const locations = useMemo(() => visualization?.locations ?? [], [visualization]);

  useEffect(() => {
    const warehouseIdFromUrl = parsePositiveId(searchParams.get('warehouseId'));
    if (warehouseIdFromUrl > 0) {
      setSelectedWarehouseId((current) => (current === warehouseIdFromUrl ? current : warehouseIdFromUrl));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [selectedWarehouseId, warehouses]);

  useEffect(() => {
    if (locations.length === 0) {
      setSelectedLocationKey('');
      setSelectedItemId(null);
      setSelectedRackKey(null);
      setSelectedRackItems((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const focusedLocation = locations.find((location) => {
      if (initialShelfId && location.shelfId === initialShelfId) return true;
      if (initialAreaCode && location.areaCode?.toUpperCase() === initialAreaCode.toUpperCase()) return true;
      return false;
    }) ?? locations[0];

    const newKey = focusedLocation.locationKey;
    setSelectedLocationKey((current) => current || newKey);
    setSelectedItemId((current) => current ?? focusedLocation.items[0]?.lineId ?? null);

    if (prevLocationKey.current !== newKey) {
      prevLocationKey.current = newKey;
      setSelectedRackKey(null);
      setSelectedRackItems((prev) => (prev.length > 0 ? [] : prev));
    }
  }, [locations, initialAreaCode, initialShelfId]);

  useEffect(() => {
    if (!selectedWarehouseId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('warehouseId', String(selectedWarehouseId));
    if (initialShelfId) nextParams.set('shelfId', String(initialShelfId));
    else nextParams.delete('shelfId');
    if (initialAreaCode) nextParams.set('areaCode', initialAreaCode);
    else nextParams.delete('areaCode');
    nextParams.set('mode', mode);

    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current !== next) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [initialAreaCode, initialShelfId, mode, searchParams, selectedWarehouseId, setSearchParams]);

  useEffect(() => {
    if (!visualizationQuery.isLoading && visualization) {
      reportScreenReady(`outside-${mode}`);
    }
  }, [mode, reportScreenReady, visualization, visualizationQuery.isLoading]);

  const selectedLocation = useMemo(
    () => locations.find((location) => location.locationKey === selectedLocationKey) ?? locations[0] ?? null,
    [locations, selectedLocationKey],
  );

  const selectedItem = useMemo(
    () => selectedLocation?.items.find((item) => item.lineId === selectedItemId) ?? selectedLocation?.items[0] ?? null,
    [selectedItemId, selectedLocation],
  );

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;

  const toolbar = (
    <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-xl">
      <Warehouse3dOpsField label={t('inventory.outsideWarehouse.selectWarehousePrompt')}>
        <OpsSelect
          value={selectedWarehouseId ? String(selectedWarehouseId) : ''}
          onValueChange={(value) => setSelectedWarehouseId(Number(value))}
          placeholder={t('inventory.outsideWarehouse.selectWarehousePrompt')}
        >
          {warehouses.map((warehouse: WarehouseReferenceDto) => (
            <SelectItem key={warehouse.id} value={String(warehouse.id)}>
              {warehouse.warehouseCode} - {warehouse.warehouseName}
            </SelectItem>
          ))}
        </OpsSelect>
      </Warehouse3dOpsField>
      <Warehouse3dOpsField label={t('inventory.outsideWarehouse.title')}>
        <Warehouse3dOpsModeToggle
          value={mode}
          onChange={setMode}
          label2d={t('inventory.outsideWarehouse.mode2d')}
          label3d={t('inventory.outsideWarehouse.mode3d')}
        />
      </Warehouse3dOpsField>
    </div>
  );

  if (warehousesQuery.isLoading) {
    return <PageState tone="loading" title={t('common.loading')} />;
  }

  return (
    <OpsListPageShell
      className="wms-ops-erp-skin wms-ops-warehouse-3d-page"
      eyebrow={t('sidebar.warehouse3dOutside')}
      title={t('inventory.outsideWarehouse.title')}
      description={t('inventory.outsideWarehouse.realSubtitle')}
      actions={toolbar}
    >
      <div className="wms-ops-warehouse-3d-content">
        <Warehouse3dOpsStatGrid columns={3}>
          <Warehouse3dOpsStat label={t('inventory.outsideWarehouse.totalLocations')} value={visualization?.totalLocationCount ?? 0} />
          <Warehouse3dOpsStat label={t('inventory.outsideWarehouse.totalPlates')} value={visualization?.totalPlateCount ?? 0} />
          <Warehouse3dOpsStat
            label={t('inventory.outsideWarehouse.selectedLocation')}
            value={selectedLocation ? getLocationLabel(selectedLocation) : '-'}
          />
        </Warehouse3dOpsStatGrid>

        {!selectedWarehouseId ? (
          <Warehouse3dOpsViewport centered>
            <Warehouse3dOpsEmpty
              icon={(
                <Warehouse3dOpsEmptyIcon>
                  <Warehouse />
                </Warehouse3dOpsEmptyIcon>
              )}
              title={t('inventory.outsideWarehouse.selectWarehousePrompt')}
            />
          </Warehouse3dOpsViewport>
        ) : visualizationQuery.isLoading ? (
          <Warehouse3dOpsViewport centered>
            <div className="flex w-full min-h-[20rem] flex-1 items-center justify-center p-6">
              <OpsLoadingState message={t('common.loading')} code="LOAD" />
            </div>
          </Warehouse3dOpsViewport>
        ) : locations.length === 0 ? (
          <Warehouse3dOpsViewport centered>
            <Warehouse3dOpsEmpty
              icon={(
                <Warehouse3dOpsEmptyIcon>
                  <Layers />
                </Warehouse3dOpsEmptyIcon>
              )}
              title={t('inventory.outsideWarehouse.noPlacementData')}
            />
          </Warehouse3dOpsViewport>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <Warehouse3dOpsChip
                    key={location.locationKey}
                    active={selectedLocation?.locationKey === location.locationKey}
                    onClick={() => {
                      setSelectedLocationKey(location.locationKey);
                      setSelectedItemId(location.items[0]?.lineId ?? null);
                    }}
                  >
                    {getLocationLabel(location)}
                  </Warehouse3dOpsChip>
                ))}
              </div>

              <div className="space-y-3 border border-[color:var(--wms-ops-card-border)] p-4">
                <Warehouse3dOpsSectionHeader
                  title={selectedWarehouse?.warehouseName ?? visualization?.warehouseName ?? t('inventory.outsideWarehouse.title')}
                  description={mode === '3d' ? t('inventory.outsideWarehouse.mode3dHint') : t('inventory.outsideWarehouse.mode2dHint')}
                />

                {selectedLocation ? (
                  mode === '3d' ? (
                    <Warehouse3dOpsViewport scene className="wms-ops-warehouse-3d-viewport--tall">
                      <div className="wms-ops-warehouse-3d-viewport__canvas">
                        <Suspense
                          fallback={(
                            <div className="flex h-full items-center justify-center p-6">
                              <OpsLoadingState message={t('common.loading')} code="SCENE" />
                            </div>
                          )}
                        >
                          <OutsideScene
                            location={selectedLocation}
                            selectedItemId={selectedItemId}
                            onSelectItem={(item) => setSelectedItemId(item.lineId)}
                            resolveImageUrl={resolveImageUrl}
                            cameraPreset={cameraPreset}
                            cameraPresetVersion={cameraPresetVersion}
                            selectedRackKey={selectedRackKey}
                            onSelectRack={handleSelectRack}
                          />
                        </Suspense>
                      </div>

                      <Warehouse3dOpsHud position="top-left">
                        <div className="wms-ops-warehouse-3d-hud-pill">
                          {selectedRackKey ? (
                            <>
                              <span className="mr-2 inline-block size-1.5 rounded-full bg-[color:var(--wms-ops-circuit-accent)]" />
                              {t('inventory.outsideWarehouse.rackSelected')}
                            </>
                          ) : (
                            `${selectedLocation.plateCount} ${t('inventory.outsideWarehouse.totalPlates')}`
                          )}
                        </div>
                      </Warehouse3dOpsHud>

                      <Warehouse3dOpsHud position="top-right">
                        <Warehouse3dOpsCameraBar>
                          <Warehouse3dOpsCameraButton
                            active={cameraPreset === 'iso' && !selectedRackKey}
                            title={t('inventory.outsideWarehouse.cameraIso')}
                            onClick={() => triggerCameraPreset('iso')}
                          >
                            <Move3D className="size-4" />
                          </Warehouse3dOpsCameraButton>
                          <Warehouse3dOpsCameraButton
                            active={cameraPreset === 'top' && !selectedRackKey}
                            title={t('inventory.outsideWarehouse.cameraTop')}
                            onClick={() => triggerCameraPreset('top')}
                          >
                            <Compass className="size-4" />
                          </Warehouse3dOpsCameraButton>
                          <Warehouse3dOpsCameraButton
                            active={cameraPreset === 'front' && !selectedRackKey}
                            title={t('inventory.outsideWarehouse.cameraFront')}
                            onClick={() => triggerCameraPreset('front')}
                          >
                            <Box className="size-4" />
                          </Warehouse3dOpsCameraButton>
                          <Warehouse3dOpsCameraButton
                            active={cameraPreset === 'eye' && !selectedRackKey}
                            title={t('inventory.outsideWarehouse.cameraEye')}
                            onClick={() => triggerCameraPreset('eye')}
                          >
                            <Footprints className="size-4" />
                          </Warehouse3dOpsCameraButton>
                          <Warehouse3dOpsCameraButton
                            title={t('inventory.outsideWarehouse.cameraReset')}
                            onClick={() => triggerCameraPreset('reset')}
                          >
                            <RotateCcw className="size-4" />
                          </Warehouse3dOpsCameraButton>
                        </Warehouse3dOpsCameraBar>
                      </Warehouse3dOpsHud>

                      {!selectedRackKey ? (
                        <Warehouse3dOpsHud position="bottom">
                          <div className="wms-ops-warehouse-3d-hud-pill">
                            {t('inventory.outsideWarehouse.interactionHint')}
                          </div>
                          <Warehouse3dOpsLegend>
                            <Warehouse3dOpsLegendItem color="#22d3ee" label={t('inventory.outsideWarehouse.legendSelected')} />
                            <Warehouse3dOpsLegendItem color="#3b82f6" label={t('inventory.outsideWarehouse.legendHover')} />
                          </Warehouse3dOpsLegend>
                        </Warehouse3dOpsHud>
                      ) : null}

                      {selectedRackKey && selectedRackItems.length > 0 ? (
                        <Warehouse3dOpsRackPanel
                          slotLabel={
                            selectedRackItems.length > 0
                              ? `R${selectedRackItems[0].rowNo ?? 1}/P${selectedRackItems[0].positionNo ?? 1}`
                              : ''
                          }
                          count={selectedRackItems.length}
                          onClose={() => handleSelectRack(null, [])}
                        >
                          {sortItems(selectedRackItems).map((item) => (
                            <Warehouse3dOpsRackThumb
                              key={item.lineId}
                              active={selectedItemId === item.lineId}
                              imageUrl={resolveImageUrl(item.imageUrl)}
                              stockCode={item.stockCode}
                              serialNo={item.serialNo}
                              stackOrder={item.stackOrderNo ?? 1}
                              onClick={() => setSelectedItemId(item.lineId)}
                            />
                          ))}
                        </Warehouse3dOpsRackPanel>
                      ) : null}
                    </Warehouse3dOpsViewport>
                  ) : (
                    <VisualizationPlane
                      location={selectedLocation}
                      mode={mode}
                      selectedItemId={selectedItemId}
                      onSelectItem={(item) => setSelectedItemId(item.lineId)}
                    />
                  )
                ) : null}
              </div>
            </div>

            <Warehouse3dOpsDetailCard
              title={t('inventory.outsideWarehouse.detailTitle')}
              subtitle={selectedLocation ? getLocationLabel(selectedLocation) : '-'}
            >
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="wms-ops-warehouse-3d-detail-image">
                    {getFullImageUrl(selectedItem.imageUrl) ? (
                      <img
                        src={getFullImageUrl(selectedItem.imageUrl) ?? undefined}
                        alt={selectedItem.stockName ?? selectedItem.stockCode}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm opacity-60">
                        <Package className="mr-2 size-4" />
                        {t('inventory.outsideWarehouse.noImage')}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Warehouse3dOpsDetailField
                      label={t('inventory.outsideWarehouse.product')}
                      value={selectedItem.stockName ?? selectedItem.stockCode}
                      hint={selectedItem.stockCode}
                    />
                    <Warehouse3dOpsDetailField label={t('inventory.outsideWarehouse.serialNo')} value={selectedItem.serialNo} />
                    <Warehouse3dOpsDetailField label={t('inventory.outsideWarehouse.dCode')} value={selectedItem.dCode} />
                    <Warehouse3dOpsDetailField label={t('inventory.outsideWarehouse.qty')} value={selectedItem.quantity} />
                    <Warehouse3dOpsDetailField label={t('inventory.outsideWarehouse.supplier')} value={selectedItem.supplierCode} />
                    <Warehouse3dOpsDetailField label={t('inventory.outsideWarehouse.placementType')} value={selectedItem.placementType} />
                    <Warehouse3dOpsDetailField label={t('inventory.outsideWarehouse.stackOrder')} value={selectedItem.stackOrderNo ?? '-'} />
                  </div>
                </div>
              ) : (
                <Warehouse3dOpsEmpty
                  icon={(
                    <Warehouse3dOpsEmptyIcon>
                      <Layers />
                    </Warehouse3dOpsEmptyIcon>
                  )}
                  title={t('inventory.outsideWarehouse.noPlacementData')}
                />
              )}
            </Warehouse3dOpsDetailCard>
          </div>
        )}
      </div>
    </OpsListPageShell>
  );
}
