import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiBaseUrl } from '@/lib/axios';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { warehouse3dApi } from '../api/warehouse-3d-api';
import type {
  SteelPlacementVisualizationItemDto,
  SteelPlacementVisualizationLocationDto,
} from '../types/warehouse-3d';
import { useRouteScreenReady } from '@/routes/RouteRuntimeBoundary';

type ViewMode = '2d' | '3d';

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
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 ${
        mode === '3d'
          ? 'min-h-[240px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_35%),linear-gradient(180deg,rgba(14,20,35,0.98),rgba(8,12,22,0.98))]'
          : 'min-h-[220px] bg-[linear-gradient(180deg,rgba(14,20,35,0.95),rgba(9,15,27,0.96))]'
      }`}
      style={{
        backgroundImage:
          mode === '3d'
            ? 'radial-gradient(circle at top, rgba(34,211,238,0.16), transparent 35%), linear-gradient(180deg, rgba(14,20,35,0.98), rgba(8,12,22,0.98))'
            : 'linear-gradient(180deg, rgba(14,20,35,0.95), rgba(9,15,27,0.96))',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(96,165,250,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.12) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.55))]" />
      <div className={`${mode === '3d' ? 'relative mx-auto mt-6 h-[190px] w-[92%] [perspective:1100px]' : 'relative mx-auto mt-4 h-[180px] w-[92%]'}`}>
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
              className={`absolute flex h-[74px] w-[118px] items-end overflow-hidden rounded-xl border text-left shadow-xl transition ${
                isSelected ? 'border-cyan-300 ring-2 ring-cyan-400/50' : 'border-sky-400/20 hover:border-sky-300/60'
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
                    : 'linear-gradient(180deg, rgba(34,211,238,0.22), rgba(14,165,233,0.16))',
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
  const initialWarehouseId = Number(searchParams.get('warehouseId') ?? '0') || 0;
  const initialShelfId = Number(searchParams.get('shelfId') ?? '0') || undefined;
  const initialAreaCode = searchParams.get('areaCode') ?? '';
  const initialMode = (searchParams.get('mode')?.toLowerCase() === '2d' ? '2d' : '3d') as ViewMode;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(initialWarehouseId);
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [selectedLocationKey, setSelectedLocationKey] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const warehousesQuery = useQuery({
    queryKey: ['outside-warehouse', 'warehouses'],
    queryFn: () => erpReferenceApi.getWarehouses({ pageNumber: 1, pageSize: 500 }),
  });

  const visualizationQuery = useQuery({
    queryKey: ['outside-warehouse', 'visualization', selectedWarehouseId, initialShelfId ?? 0, initialAreaCode],
    queryFn: () => warehouse3dApi.getSteelPlacementVisualization(selectedWarehouseId, initialShelfId, initialAreaCode || undefined),
    enabled: selectedWarehouseId > 0,
  });

  const warehouses = warehousesQuery.data?.data ?? [];
  const visualization = visualizationQuery.data;
  const locations = visualization?.locations ?? [];

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [selectedWarehouseId, warehouses]);

  useEffect(() => {
    if (locations.length === 0) {
      setSelectedLocationKey('');
      setSelectedItemId(null);
      return;
    }

    const focusedLocation = locations.find((location) => {
      if (initialShelfId && location.shelfId === initialShelfId) return true;
      if (initialAreaCode && location.areaCode?.toUpperCase() === initialAreaCode.toUpperCase()) return true;
      return false;
    }) ?? locations[0];

    setSelectedLocationKey((current) => current || focusedLocation.locationKey);
    setSelectedItemId((current) => current ?? focusedLocation.items[0]?.lineId ?? null);
  }, [locations, initialAreaCode, initialShelfId]);

  useEffect(() => {
    if (!selectedWarehouseId) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('warehouseId', String(selectedWarehouseId));
    if (initialShelfId) params.set('shelfId', String(initialShelfId));
    if (initialAreaCode) params.set('areaCode', initialAreaCode);
    params.set('mode', mode);
    setSearchParams(params, { replace: true });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Badge variant="secondary">{t('inventory.outsideWarehouse.title')}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t('inventory.outsideWarehouse.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">{t('inventory.outsideWarehouse.realSubtitle')}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
          <Select value={selectedWarehouseId ? String(selectedWarehouseId) : ''} onValueChange={(value) => setSelectedWarehouseId(Number(value))}>
            <SelectTrigger className="border-white/10 bg-white/5">
              <SelectValue placeholder={t('inventory.outsideWarehouse.selectWarehousePrompt')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse: WarehouseReferenceDto) => (
                <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                  {warehouse.warehouseCode} - {warehouse.warehouseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <Button type="button" variant={mode === '2d' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setMode('2d')}>
              {t('inventory.outsideWarehouse.mode2d')}
            </Button>
            <Button type="button" variant={mode === '3d' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setMode('3d')}>
              {t('inventory.outsideWarehouse.mode3d')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardDescription>{t('inventory.outsideWarehouse.totalLocations')}</CardDescription>
            <CardTitle>{visualization?.totalLocationCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardDescription>{t('inventory.outsideWarehouse.totalPlates')}</CardDescription>
            <CardTitle>{visualization?.totalPlateCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardDescription>{t('inventory.outsideWarehouse.selectedLocation')}</CardDescription>
            <CardTitle>{selectedLocation ? getLocationLabel(selectedLocation) : '-'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {!selectedWarehouseId ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-10 text-center text-slate-400">{t('inventory.outsideWarehouse.selectWarehousePrompt')}</CardContent>
        </Card>
      ) : visualizationQuery.isLoading ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-10 text-center text-slate-400">{t('common.loading')}</CardContent>
        </Card>
      ) : locations.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-10 text-center text-slate-400">{t('inventory.outsideWarehouse.noPlacementData')}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <Button
                  key={location.locationKey}
                  type="button"
                  variant={selectedLocation?.locationKey === location.locationKey ? 'secondary' : 'outline'}
                  className="rounded-full"
                  onClick={() => {
                    setSelectedLocationKey(location.locationKey);
                    setSelectedItemId(location.items[0]?.lineId ?? null);
                  }}
                >
                  {getLocationLabel(location)}
                </Button>
              ))}
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{selectedWarehouse?.warehouseName ?? visualization?.warehouseName}</CardTitle>
                <CardDescription>
                  {mode === '3d' ? t('inventory.outsideWarehouse.mode3dHint') : t('inventory.outsideWarehouse.mode2dHint')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLocation ? (
                  <VisualizationPlane
                    location={selectedLocation}
                    mode={mode}
                    selectedItemId={selectedItemId}
                    onSelectItem={(item) => setSelectedItemId(item.lineId)}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>{t('inventory.outsideWarehouse.detailTitle')}</CardTitle>
              <CardDescription>{selectedLocation ? getLocationLabel(selectedLocation) : '-'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItem ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {getFullImageUrl(selectedItem.imageUrl) ? (
                      <img
                        src={getFullImageUrl(selectedItem.imageUrl) ?? undefined}
                        alt={selectedItem.stockName ?? selectedItem.stockCode}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-slate-400">{t('inventory.outsideWarehouse.noImage')}</div>
                    )}
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-xl border border-white/10 p-3">
                      <div className="text-slate-400">{t('inventory.outsideWarehouse.product')}</div>
                      <div className="mt-1 font-medium text-white">{selectedItem.stockName ?? selectedItem.stockCode}</div>
                      <div className="text-slate-400">{selectedItem.stockCode}</div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="text-slate-400">{t('inventory.outsideWarehouse.serialNo')}</div>
                        <div className="mt-1 font-medium text-white">{selectedItem.serialNo}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="text-slate-400">{t('inventory.outsideWarehouse.dCode')}</div>
                        <div className="mt-1 font-medium text-white">{selectedItem.dCode}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="text-slate-400">{t('inventory.outsideWarehouse.qty')}</div>
                        <div className="mt-1 font-medium text-white">{selectedItem.quantity}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="text-slate-400">{t('inventory.outsideWarehouse.supplier')}</div>
                        <div className="mt-1 font-medium text-white">{selectedItem.supplierCode}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="text-slate-400">{t('inventory.outsideWarehouse.placementType')}</div>
                        <div className="mt-1 font-medium text-white">{selectedItem.placementType}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="text-slate-400">{t('inventory.outsideWarehouse.stackOrder')}</div>
                        <div className="mt-1 font-medium text-white">{selectedItem.stackOrderNo ?? '-'}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('inventory.outsideWarehouse.noPlacementData')}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
