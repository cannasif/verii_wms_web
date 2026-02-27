import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrderItem, SelectedOrderItem } from '../types/goods-receipt';

interface OrderItemsAccordionProps {
  customerCode: string;
  orderId: string;
  selectedItems: SelectedOrderItem[];
  onToggleItem: (item: OrderItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export function OrderItemsAccordion({
  customerCode,
  orderId,
  selectedItems,
  onToggleItem,
  onUpdateQuantity,
}: OrderItemsAccordionProps): ReactElement {
  const { t } = useTranslation();
  const { data: orderItems, isLoading } = useQuery({
    queryKey: ['orderItems', customerCode, orderId],
    queryFn: () => goodsReceiptApi.getOrderItems(customerCode, orderId),
    enabled: !!customerCode && !!orderId,
  });

  const handleQuantityChange = (itemId: string, value: string): void => {
    const quantity = parseFloat(value) || 0;
    onUpdateQuantity(itemId, quantity);
  };

  if (isLoading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">{t('common.loading')}</div>;
  }

  if (!orderItems || orderItems.length === 0) {
    return <div className="text-center py-4 text-sm text-muted-foreground">{t('goodsReceipt.orderItems.itemNotFound')}</div>;
  }

  return (
    <div className="space-y-1.5">
      {orderItems.map((item) => {
        const selectedItem = selectedItems.find((si) => si.id === item.id);
        const isSelected = !!selectedItem;

        return (
          <div
            key={item.id}
            className={`p-2 border rounded text-sm ${
              isSelected ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleItem(item)}
                className="cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.productCode} • {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor={`qty-${item.id}`} className="text-xs whitespace-nowrap">
                      {t('goodsReceipt.orderDetails.quantity')}
                    </Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={selectedItem?.receiptQuantity || 0}
                      onChange={(e) => handleQuantityChange(item.id || '', e.target.value)}
                      className="w-20 h-7 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

