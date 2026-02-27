import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { Button } from '@/components/ui/button';
import type { OrderItem, SelectedOrderItem } from '../types/goods-receipt';

interface OrderDetailsDialogProps {
  customerCode: string | null;
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedOrderItem[];
  onToggleItem: (item: OrderItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export function OrderDetailsDialog({
  customerCode,
  orderId,
  isOpen,
  onClose,
  selectedItems,
  onToggleItem,
  onUpdateQuantity,
}: OrderDetailsDialogProps): ReactElement {
  const { t } = useTranslation();
  const { data: orderItems, isLoading } = useQuery({
    queryKey: ['orderItems', customerCode, orderId],
    queryFn: () => goodsReceiptApi.getOrderItems(customerCode!, orderId!),
    enabled: !!customerCode && !!orderId && isOpen,
  });

  const handleToggleItem = (item: OrderItem): void => {
    onToggleItem(item);
  };

  const handleQuantityChange = (itemId: string, value: string): void => {
    const quantity = parseFloat(value) || 0;
    onUpdateQuantity(itemId, quantity);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('goodsReceipt.orderDetails.title')}</DialogTitle>
          <DialogDescription>
            {t('goodsReceipt.orderDetails.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">{t('common.loading')}</div>
        ) : (
          <div className="space-y-4 mt-4">
            {orderItems?.map((item) => {
              const selectedItem = selectedItems.find((si) => si.id === item.id);
              const isSelected = !!selectedItem;

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(item)}
                          className="cursor-pointer"
                        />
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.productCode}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('goodsReceipt.orderDetails.orderQuantity')}</p>
                          <p className="font-medium">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('goodsReceipt.orderDetails.unitPrice')}</p>
                          <p className="font-medium">
                            {(item.unitPrice || 0).toLocaleString('tr-TR')} ₺
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('goodsReceipt.orderDetails.total')}</p>
                          <p className="font-medium">
                            {(item.totalPrice || 0).toLocaleString('tr-TR')} ₺
                          </p>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm">{t('goodsReceipt.orderDetails.quantity')}</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={selectedItem?.receiptQuantity || 0}
                          onChange={(e) =>
                            handleQuantityChange(item.id || '', e.target.value)
                          }
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

