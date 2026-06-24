import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ShipmentOrderSelectionPanel } from './components/ShipmentOrderSelectionPanel';
import { ShipmentItemArea } from './components/ShipmentItemArea';
import { useShipmentOrders } from '../../hooks/useShipmentOrders';
import type { SelectedShipmentOrderItem, ShipmentOrderItem } from '../../types/shipment';
import type { ShipmentFormData } from '../../types/shipment';

interface Step2ShipmentOrderSelectionProps {
  selectedItems: SelectedShipmentOrderItem[];
  onToggleItem: (item: ShipmentOrderItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedShipmentOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function Step2ShipmentOrderSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
  variant = 'default',
}: Step2ShipmentOrderSelectionProps): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const { watch } = useFormContext<ShipmentFormData>();
  const customerId = watch('customerId');
  const [activeSiparisNo, setActiveSiparisNo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('orders');
  const isOps = variant === 'ops';

  const { data: ordersData, isLoading: ordersLoading } = useShipmentOrders(customerId);

  const orders = ordersData?.data || [];

  const handleSelectOrder = (siparisNo: string): void => {
    setActiveSiparisNo(siparisNo);
    setActiveTab('items');
  };

  if (!customerId) {
    return (
      <div className={cn(isOps && 'wms-ops-form wms-ops-list')}>
        <Card className={cn(isOps && 'wms-ops-order-step')}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="max-w-sm space-y-4 text-center">
              <div
                className={cn(
                  'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
                  isOps ? 'wms-ops-panel-empty__icon' : 'bg-muted',
                )}
              >
                <span className="text-2xl font-semibold">1</span>
              </div>
              <div className="space-y-2">
                <CardTitle className={cn(isOps && 'wms-ops-panel-empty__title')}>
                  {t('shipment.step2.selectCustomerFirst')}
                </CardTitle>
                <CardDescription className={cn(isOps && 'wms-ops-panel-empty__hint')}>
                  {t('shipment.step2.customerPrompt')}
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(isOps && 'wms-ops-form wms-ops-list')}>
      <Card className={cn('flex flex-col', isOps && 'wms-ops-order-step')}>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="lg:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
              <div className={cn('border-b px-4 py-2', isOps && 'wms-ops-order-step__mobile-tabs')}>
                <TabsList
                  className={cn(
                    'grid w-full grid-cols-2',
                    isOps && 'wms-ops-tabs wms-ops-step-tabs',
                    isOps && activeTab === 'orders' ? 'wms-ops-tabs--order' : isOps && 'wms-ops-tabs--stock',
                  )}
                >
                  {isOps ? <span className="wms-ops-tab-indicator wms-ops-step-tab-indicator" aria-hidden /> : null}
                  <TabsTrigger value="orders" className={cn('w-full', isOps && 'wms-ops-tab')}>
                    {t('shipment.step2.orders')}
                  </TabsTrigger>
                  <TabsTrigger value="items" className={cn('w-full', isOps && 'wms-ops-tab')} disabled={!activeSiparisNo}>
                    {t('shipment.step2.orderContent')}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="orders" className="m-0 mt-0 flex-1 overflow-hidden">
                <ShipmentOrderSelectionPanel
                  orders={orders}
                  selectedOrderId={activeSiparisNo}
                  onSelectOrder={handleSelectOrder}
                  isLoading={ordersLoading}
                  variant={variant}
                />
              </TabsContent>
              <TabsContent value="items" className="m-0 mt-0 flex-1 overflow-hidden">
                <ShipmentItemArea
                  siparisNo={activeSiparisNo}
                  selectedItems={selectedItems}
                  onUpdateItem={onUpdateItem}
                  onToggleItem={onToggleItem}
                  onRemoveItem={onRemoveItem}
                  variant={variant}
                />
              </TabsContent>
            </Tabs>
          </div>
          <div
            className={cn(
              'hidden h-full lg:flex lg:flex-row',
              isOps
                ? 'lg:divide-x lg:divide-[color-mix(in_oklab,var(--wms-ops-accent)_18%,var(--wms-ops-card-border))]'
                : 'lg:divide-x lg:divide-border',
            )}
          >
            <div className="flex min-w-0 flex-col overflow-hidden lg:w-[32%] xl:w-[30%]">
              <ShipmentOrderSelectionPanel
                orders={orders}
                selectedOrderId={activeSiparisNo}
                onSelectOrder={handleSelectOrder}
                isLoading={ordersLoading}
                variant={variant}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <ShipmentItemArea
                siparisNo={activeSiparisNo}
                selectedItems={selectedItems}
                onUpdateItem={onUpdateItem}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
                variant={variant}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
