import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransferOrderSelectionPanel } from './components/TransferOrderSelectionPanel';
import { TransferItemArea } from './components/TransferItemArea';
import { useTransferOrders } from '../../hooks/useTransferOrders';
import type { SelectedTransferOrderItem, TransferOrderItem } from '../../types/transfer';
import type { TransferFormData } from '../../types/transfer';

interface Step2TransferOrderSelectionProps {
  selectedItems: SelectedTransferOrderItem[];
  onToggleItem: (item: TransferOrderItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedTransferOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function Step2TransferOrderSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: Step2TransferOrderSelectionProps): ReactElement {
  const { t } = useTranslation();
  const { watch } = useFormContext<TransferFormData>();
  const customerId = watch('customerId');
  const [activeSiparisNo, setActiveSiparisNo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('orders');

  const { data: ordersData, isLoading: ordersLoading } = useTransferOrders(customerId);

  const orders = ordersData?.data || [];

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
              <CardTitle>{t('transfer.step2.selectCustomerFirst', 'Önce Cari Seçiniz')}</CardTitle>
              <CardDescription>
                {t('transfer.step2.customerPrompt', 'Siparişleri görüntülemek için lütfen önceki adımdan bir cari seçin.')}
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
                  {t('transfer.step2.orders', 'Siparişler')}
                </TabsTrigger>
                <TabsTrigger value="items" className="w-full" disabled={!activeSiparisNo}>
                  {t('transfer.step2.orderContent', 'Sipariş İçeriği')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="orders" className="flex-1 overflow-hidden m-0 mt-0">
              <TransferOrderSelectionPanel
                orders={orders}
                selectedOrderId={activeSiparisNo}
                onSelectOrder={handleSelectOrder}
                isLoading={ordersLoading}
              />
            </TabsContent>
            <TabsContent value="items" className="flex-1 overflow-hidden m-0 mt-0">
              <TransferItemArea
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
            <TransferOrderSelectionPanel
              orders={orders}
              selectedOrderId={activeSiparisNo}
              onSelectOrder={handleSelectOrder}
              isLoading={ordersLoading}
            />
          </div>
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
            <TransferItemArea
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
