import { Suspense, lazy, type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWarehouse3d } from '../hooks/useWarehouse3d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import type { WarehouseSlot } from '../types/warehouse-3d';

const WarehouseScene = lazy(async () => {
  const module = await import('./WarehouseScene');
  return { default: module.WarehouseScene };
});

export function Warehouse3dPage(): ReactElement {
  const { t } = useTranslation();
  const [selectedDepoKodu, setSelectedDepoKodu] = useState<string>('');
  const [hoveredSlot, setHoveredSlot] = useState<WarehouseSlot | null>(null);
  const [clickedSlot, setClickedSlot] = useState<WarehouseSlot | null>(null);
  
  const { data: warehouses } = useWarehouses();
  const { data: warehouseData, isLoading, error } = useWarehouse3d(selectedDepoKodu, !!selectedDepoKodu);

  const displaySlot = clickedSlot || hoveredSlot;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <label className="text-sm font-medium">
          {t('inventory.warehouse3d.selectWarehouse')}
        </label>
        <Select value={selectedDepoKodu} onValueChange={setSelectedDepoKodu}>
          <SelectTrigger className="w-full sm:max-w-[260px]">
            <SelectValue placeholder={t('inventory.warehouse3d.selectWarehouse')} />
          </SelectTrigger>
          <SelectContent>
            {warehouses?.map((warehouse) => (
              <SelectItem key={warehouse.depoKodu} value={warehouse.depoKodu.toString()}>
                {warehouse.depoIsmi} ({warehouse.depoKodu})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex flex-wrap gap-3 text-sm lg:ml-auto lg:justify-end">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#49546d' }}></div>
            <span>{t('inventory.warehouse3d.empty')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#f7ba3e' }}></div>
            <span>{t('inventory.warehouse3d.lowStock')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#3c9dff' }}></div>
            <span>{t('inventory.warehouse3d.mediumStock')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#10b981' }}></div>
            <span>{t('inventory.warehouse3d.highStock')}</span>
          </div>
        </div>
      </div>

      {!selectedDepoKodu && (
        <div className="hidden min-h-[460px] items-center justify-center rounded-lg border bg-muted/30 md:flex xl:min-h-[600px]">
          <div className="text-center p-6">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg text-muted-foreground">
              {t('inventory.warehouse3d.pleaseSelectWarehouse')}
            </p>
          </div>
        </div>
      )}

      {selectedDepoKodu && isLoading && (
        <div className="flex min-h-[460px] items-center justify-center xl:min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      )}

      {selectedDepoKodu && error && (
        <div className="flex min-h-[460px] items-center justify-center xl:min-h-[600px]">
          <p className="text-destructive">
            {t('inventory.warehouse3d.error')}
          </p>
        </div>
      )}

      {selectedDepoKodu && warehouseData && !isLoading && (
        <>
          <div className="relative hidden min-h-[460px] md:block xl:min-h-[600px]">
            <div className="h-full w-full rounded-lg overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex h-full min-h-[460px] items-center justify-center xl:min-h-[600px]">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                      <p>{t('common.loading')}</p>
                    </div>
                  </div>
                }
              >
                <WarehouseScene
                  key={selectedDepoKodu}
                  data={warehouseData}
                  onSlotHover={setHoveredSlot}
                  onSlotClick={setClickedSlot}
                />
              </Suspense>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 text-xs space-y-1">
              <div className="font-medium mb-2">{t('inventory.warehouse3d.controls')}</div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px]">{t('inventory.warehouse3d.leftClickDrag')}</kbd>
                <span>{t('inventory.warehouse3d.rotate')}</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px]">{t('inventory.warehouse3d.rightClickDrag')}</kbd>
                <span>{t('inventory.warehouse3d.pan')}</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px]">{t('inventory.warehouse3d.scroll')}</kbd>
                <span>{t('inventory.warehouse3d.zoom')}</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px]">{t('inventory.warehouse3d.clickShelf')}</kbd>
                <span>{t('inventory.warehouse3d.selectShelf')}</span>
              </div>
            </div>
            
            {displaySlot && (
              <Card className="absolute top-4 right-4 w-80 z-10 bg-background/95 backdrop-blur">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{displaySlot.hucreKodu}</CardTitle>
                    {clickedSlot && (
                      <button 
                        onClick={() => setClickedSlot(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        background: displaySlot.totalBakiye === 0 ? '#49546d' : 
                                    displaySlot.totalBakiye < 10 ? '#f7ba3e' : 
                                    displaySlot.totalBakiye < 50 ? '#3c9dff' : '#10b981'
                      }}
                    />
                    {t('inventory.warehouse3d.totalStock')}: {displaySlot.totalBakiye}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displaySlot.stocks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t('inventory.warehouse3d.products')}:
                      </p>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {displaySlot.stocks.map((stock, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded">
                            <p className="font-medium">{stock.stokAdi}</p>
                            <p className="text-muted-foreground">
                              {stock.stokKodu} - {t('inventory.warehouse3d.quantity')}: {stock.bakiye}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('inventory.warehouse3d.emptyCell')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="flex min-h-[320px] items-center justify-center md:hidden">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🖥️</div>
              <p className="text-muted-foreground">
                {t('inventory.warehouse3d.desktopOnly')}
              </p>
            </div>
          </div>
        </>
      )}

      {!selectedDepoKodu && (
        <div className="flex min-h-[320px] items-center justify-center md:hidden">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-muted-foreground">
              {t('inventory.warehouse3d.pleaseSelectWarehouse')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
