import { Suspense, lazy, startTransition, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Boxes, Hand, MousePointerClick, Monitor, Move3d, Scroll, Warehouse } from 'lucide-react';
import { SelectItem } from '@/components/ui/select';
import { OpsActionButton, OpsListPageShell, OpsLoadingState, OpsSelect, PageState } from '@/components/shared';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import { useRouteScreenReady } from '@/routes/RouteRuntimeBoundary';
import { useWarehouse3d } from '../hooks/useWarehouse3d';
import type { WarehouseSlot } from '../types/warehouse-3d';
import {
  Warehouse3dOpsControlPanel,
  Warehouse3dOpsControlRow,
  Warehouse3dOpsDetailCard,
  Warehouse3dOpsEmpty,
  Warehouse3dOpsEmptyIcon,
  Warehouse3dOpsField,
  Warehouse3dOpsLegend,
  Warehouse3dOpsLegendItem,
  Warehouse3dOpsStockRow,
  Warehouse3dOpsViewport,
} from './warehouse-3d-ops-ui';

const WarehouseScene = lazy(async () => {
  const module = await import('./WarehouseScene');
  return { default: module.WarehouseScene };
});

const STOCK_COLORS = {
  empty: '#49546d',
  low: '#f7ba3e',
  medium: '#3c9dff',
  high: '#10b981',
} as const;

function getStockColor(totalBakiye: number): string {
  if (totalBakiye === 0) return STOCK_COLORS.empty;
  if (totalBakiye < 10) return STOCK_COLORS.low;
  if (totalBakiye < 50) return STOCK_COLORS.medium;
  return STOCK_COLORS.high;
}

export function Warehouse3dPage(): ReactElement {
  const { t } = useTranslation();
  const { reportScreenReady } = useRouteScreenReady();
  const [selectedDepoKodu, setSelectedDepoKodu] = useState<string>('');
  const [sceneActivated, setSceneActivated] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<WarehouseSlot | null>(null);
  const [clickedSlot, setClickedSlot] = useState<WarehouseSlot | null>(null);
  const screenReadyReportedRef = useRef(false);

  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: warehouseData, isLoading, error, isFetching } = useWarehouse3d(
    selectedDepoKodu,
    Boolean(selectedDepoKodu) && sceneActivated,
  );

  const displaySlot = clickedSlot || hoveredSlot;
  const selectedWarehouse = useMemo(
    () => warehouses?.find((warehouse) => warehouse.depoKodu.toString() === selectedDepoKodu) ?? null,
    [warehouses, selectedDepoKodu],
  );

  const isSceneReady = Boolean(selectedDepoKodu && sceneActivated && warehouseData && !isLoading && !error);

  function handleWarehouseChange(value: string): void {
    setSelectedDepoKodu(value);
    setSceneActivated(false);
    setHoveredSlot(null);
    setClickedSlot(null);
  }

  useEffect(() => {
    if (screenReadyReportedRef.current || isLoadingWarehouses || selectedDepoKodu) {
      return;
    }

    screenReadyReportedRef.current = true;
    reportScreenReady('initial-screen');
  }, [isLoadingWarehouses, reportScreenReady, selectedDepoKodu]);

  const legend = (
    <Warehouse3dOpsLegend>
      <Warehouse3dOpsLegendItem color={STOCK_COLORS.empty} label={t('inventory.warehouse3d.empty')} />
      <Warehouse3dOpsLegendItem color={STOCK_COLORS.low} label={t('inventory.warehouse3d.lowStock')} />
      <Warehouse3dOpsLegendItem color={STOCK_COLORS.medium} label={t('inventory.warehouse3d.mediumStock')} />
      <Warehouse3dOpsLegendItem color={STOCK_COLORS.high} label={t('inventory.warehouse3d.highStock')} />
    </Warehouse3dOpsLegend>
  );

  if (isLoadingWarehouses) {
    return <PageState tone="loading" title={t('common.loading')} />;
  }

  return (
    <OpsListPageShell
      className="wms-ops-erp-skin wms-ops-warehouse-3d-page"
      eyebrow={t('sidebar.warehouse3d')}
      title={t('inventory.warehouse3d.title')}
      description={t('inventory.warehouse3d.description')}
      actions={legend}
    >
      <div className="wms-ops-warehouse-3d-content">
        <div className="wms-ops-warehouse-3d-toolbar">
          <Warehouse3dOpsField label={t('inventory.warehouse3d.selectWarehouse')} className="min-w-[14rem] flex-1 sm:max-w-xs">
            <OpsSelect
              value={selectedDepoKodu}
              onValueChange={handleWarehouseChange}
              placeholder={t('inventory.warehouse3d.selectWarehouse')}
            >
              {warehouses?.map((warehouse) => (
                <SelectItem key={warehouse.depoKodu} value={warehouse.depoKodu.toString()}>
                  {warehouse.depoIsmi} ({warehouse.depoKodu})
                </SelectItem>
              ))}
            </OpsSelect>
          </Warehouse3dOpsField>
        </div>

        <Warehouse3dOpsViewport scene={isSceneReady} centered={!isSceneReady}>
          {!selectedDepoKodu ? (
            <Warehouse3dOpsEmpty
              icon={(
                <Warehouse3dOpsEmptyIcon>
                  <Warehouse />
                </Warehouse3dOpsEmptyIcon>
              )}
              title={t('inventory.warehouse3d.pleaseSelectWarehouse')}
            />
          ) : null}

          {selectedDepoKodu && isLoading ? (
            <OpsLoadingState message={t('common.loading')} code="LOAD" />
          ) : null}

          {selectedDepoKodu && error ? (
            <Warehouse3dOpsEmpty
              icon={(
                <Warehouse3dOpsEmptyIcon>
                  <AlertTriangle />
                </Warehouse3dOpsEmptyIcon>
              )}
              title={t('inventory.warehouse3d.error')}
              description={(error as Error).message}
            />
          ) : null}

          {selectedDepoKodu && !sceneActivated && !isLoading && !error ? (
            <>
              <div className="hidden w-full md:block">
                <Warehouse3dOpsEmpty
                  icon={(
                    <Warehouse3dOpsEmptyIcon>
                      <Boxes />
                    </Warehouse3dOpsEmptyIcon>
                  )}
                  title={selectedWarehouse?.depoIsmi ?? t('inventory.warehouse3d.selectWarehouse')}
                  description={t('inventory.warehouse3d.lazyLoadHint')}
                  action={(
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      onClick={() => startTransition(() => setSceneActivated(true))}
                      disabled={isFetching}
                    >
                      {t('inventory.warehouse3d.load3dView')}
                    </OpsActionButton>
                  )}
                />
              </div>
              <div className="w-full md:hidden">
                <Warehouse3dOpsEmpty
                  icon={(
                    <Warehouse3dOpsEmptyIcon>
                      <Monitor />
                    </Warehouse3dOpsEmptyIcon>
                  )}
                  title={t('inventory.warehouse3d.desktopOnly')}
                />
              </div>
            </>
          ) : null}

          {isSceneReady && warehouseData ? (
            <>
              <div className="hidden md:contents">
                <div className="wms-ops-warehouse-3d-viewport__canvas">
                  <Suspense
                    fallback={(
                      <div className="flex h-full min-h-[28rem] items-center justify-center p-6">
                        <OpsLoadingState message={t('common.loading')} code="SCENE" />
                      </div>
                    )}
                  >
                    <WarehouseScene
                      key={selectedDepoKodu}
                      data={warehouseData}
                      onSlotHover={setHoveredSlot}
                      onSlotClick={setClickedSlot}
                    />
                  </Suspense>
                </div>

                <div className="absolute bottom-4 left-4 z-10">
                  <Warehouse3dOpsControlPanel title={t('inventory.warehouse3d.controls')}>
                    <Warehouse3dOpsControlRow
                      icon={<Move3d />}
                      keys={t('inventory.warehouse3d.leftClickDrag')}
                      label={t('inventory.warehouse3d.rotate')}
                    />
                    <Warehouse3dOpsControlRow
                      icon={<Hand />}
                      keys={t('inventory.warehouse3d.rightClickDrag')}
                      label={t('inventory.warehouse3d.pan')}
                    />
                    <Warehouse3dOpsControlRow
                      icon={<Scroll />}
                      keys={t('inventory.warehouse3d.scroll')}
                      label={t('inventory.warehouse3d.zoom')}
                    />
                    <Warehouse3dOpsControlRow
                      icon={<MousePointerClick />}
                      keys={t('inventory.warehouse3d.clickShelf')}
                      label={t('inventory.warehouse3d.selectShelf')}
                    />
                  </Warehouse3dOpsControlPanel>
                </div>

                {displaySlot ? (
                  <Warehouse3dOpsDetailCard
                    className="absolute top-4 right-4 z-10 w-80"
                    title={displaySlot.hucreKodu}
                    subtitle={(
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ background: getStockColor(displaySlot.totalBakiye) }}
                          aria-hidden
                        />
                        {t('inventory.warehouse3d.totalStock')}: {displaySlot.totalBakiye}
                      </span>
                    )}
                    onClose={clickedSlot ? () => setClickedSlot(null) : undefined}
                  >
                    {displaySlot.stocks.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70">
                          {t('inventory.warehouse3d.products')}
                        </div>
                        <div className="max-h-60 space-y-1 overflow-y-auto">
                          {displaySlot.stocks.map((stock, index) => (
                            <Warehouse3dOpsStockRow
                              key={`${stock.stokKodu}-${index}`}
                              title={stock.stokAdi}
                              subtitle={`${stock.stokKodu} - ${t('inventory.warehouse3d.quantity')}: ${stock.bakiye}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs opacity-70">{t('inventory.warehouse3d.emptyCell')}</p>
                    )}
                  </Warehouse3dOpsDetailCard>
                ) : null}
              </div>

              <div className="w-full md:hidden">
                <Warehouse3dOpsEmpty
                  icon={(
                    <Warehouse3dOpsEmptyIcon>
                      <Monitor />
                    </Warehouse3dOpsEmptyIcon>
                  )}
                  title={t('inventory.warehouse3d.desktopOnly')}
                />
              </div>
            </>
          ) : null}
        </Warehouse3dOpsViewport>
      </div>
    </OpsListPageShell>
  );
}
