import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WarehouseOrderSelectionPanel } from './components/WarehouseOrderSelectionPanel';
import { WarehouseItemArea } from './components/WarehouseItemArea';
import { useWarehouseInboundOrders } from '../../hooks/useWarehouseInboundOrders';
import { useWarehouseOutboundOrders } from '../../hooks/useWarehouseOutboundOrders';
import type { SelectedWarehouseOrderItem, WarehouseOrderItem } from '../../types/warehouse';
import type { WarehouseFormData } from '../../types/warehouse';

type WarehouseType = 'inbound' | 'outbound';

interface Step2WarehouseOrderSelectionProps {
  type: WarehouseType;
  selectedItems: SelectedWarehouseOrderItem[];
  onToggleItem: (item: WarehouseOrderItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function Step2WarehouseOrderSelection({
  type,
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: Step2WarehouseOrderSelectionProps): ReactElement {
  const { t } = useTranslation();
  const { watch } = useFormContext<WarehouseFormData>();
  const customerId = watch('customerId');
  const [activeSiparisNo, setActiveSiparisNo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('orders');

  const { data: inboundOrdersData, isLoading: inboundOrdersLoading } = useWarehouseInboundOrders(
    type === 'inbound' ? customerId : undefined
  );
  const { data: outboundOrdersData, isLoading: outboundOrdersLoading } = useWarehouseOutboundOrders(
    type === 'outbound' ? customerId : undefined
  );

  const orders = (type === 'inbound' ? inboundOrdersData?.data : outboundOrdersData?.data) || [];
  const ordersLoading = type === 'inbound' ? inboundOrdersLoading : outboundOrdersLoading;

  const handleSelectOrder = (siparisNo: string): void => {
    setActiveSiparisNo(siparisNo);
    setActiveTab('items');
  };

  if (!customerId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-2xl font-semibold">1</span>
            </div>
            <div className="space-y-2">
              <CardTitle>{t('warehouse.step2.selectCustomerFirst', 'Önce Cari Seçiniz')}</CardTitle>
              <CardDescription>
                {t('warehouse.step2.customerPrompt', 'Siparişleri görüntülemek için lütfen önceki adımdan bir cari seçin.')}
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-4 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders" className="w-full">
                  {t('warehouse.step2.orders', 'Siparişler')}
                </TabsTrigger>
                <TabsTrigger value="items" className="w-full" disabled={!activeSiparisNo}>
                  {t('warehouse.step2.orderContent', 'Sipariş İçeriği')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="orders" className="flex-1 overflow-hidden m-0 mt-0">
              <WarehouseOrderSelectionPanel
                orders={orders}
                selectedOrderId={activeSiparisNo}
                onSelectOrder={handleSelectOrder}
                isLoading={ordersLoading}
              />
            </TabsContent>
            <TabsContent value="items" className="flex-1 overflow-hidden m-0 mt-0">
              <WarehouseItemArea
                type={type}
                siparisNo={activeSiparisNo}
                selectedItems={selectedItems}
                onUpdateItem={onUpdateItem}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="hidden lg:flex lg:flex-row lg:h-full lg:divide-x lg:divide-border">
          <div className="w-[30%] overflow-hidden min-w-0 flex flex-col">
            <WarehouseOrderSelectionPanel
              orders={orders}
              selectedOrderId={activeSiparisNo}
              onSelectOrder={handleSelectOrder}
              isLoading={ordersLoading}
            />
          </div>
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
            <WarehouseItemArea
              type={type}
              siparisNo={activeSiparisNo}
              selectedItems={selectedItems}
              onUpdateItem={onUpdateItem}
              onToggleItem={onToggleItem}
              onRemoveItem={onRemoveItem}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

