import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderSelectionPanel } from './components/OrderSelectionPanel';
import { ReceivingArea } from './components/ReceivingArea';
import { useOrdersByCustomer } from '../../hooks/useOrdersByCustomer';
import type {
  GoodsReceiptFormData,
  SelectedOrderItem,
  OrderItem,
} from '../../types/goods-receipt';

interface Step2OrderSelectionProps {
  selectedItems: SelectedOrderItem[];
  onToggleItem: (item: OrderItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function Step2OrderSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: Step2OrderSelectionProps): ReactElement {
  const { t } = useTranslation();
  const { watch } = useFormContext<GoodsReceiptFormData>();
  const customerCode = watch('customerId');
  const [activeSiparisNo, setActiveSiparisNo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('orders');

  const { data: orders, isLoading: ordersLoading } = useOrdersByCustomer(customerCode);

  const handleSelectOrder = (siparisNo: string): void => {
    setActiveSiparisNo(siparisNo);
    setActiveTab('items');
  };

  if (!customerCode) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-2xl font-semibold">1</span>
            </div>
            <div className="space-y-2">
              <CardTitle>{t('goodsReceipt.step2.selectCustomerFirst', 'Önce Müşteri Seçiniz')}</CardTitle>
              <CardDescription>
                {t('goodsReceipt.step2.customerPrompt', 'Siparişleri görüntülemek için lütfen önceki adımdan bir müşteri seçin.')}
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
                  {t('goodsReceipt.step2.orders', 'Siparişler')}
                </TabsTrigger>
                <TabsTrigger value="items" className="w-full" disabled={!activeSiparisNo}>
                  {t('goodsReceipt.step2.orderContent', 'Sipariş İçeriği')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="orders" className="flex-1 overflow-hidden m-0 mt-0">
              <OrderSelectionPanel
                orders={orders || []}
                selectedOrderId={activeSiparisNo}
                onSelectOrder={handleSelectOrder}
                isLoading={ordersLoading}
              />
            </TabsContent>
            <TabsContent value="items" className="flex-1 overflow-hidden m-0 mt-0">
              <ReceivingArea
                customerCode={customerCode}
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
            <OrderSelectionPanel
              orders={orders || []}
              selectedOrderId={activeSiparisNo}
              onSelectOrder={handleSelectOrder}
              isLoading={ordersLoading}
            />
          </div>
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
            <ReceivingArea
              customerCode={customerCode}
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
