import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Search, Calendar, Inbox, Loader2 } from 'lucide-react';
import { OpsInput } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ShipmentOrder } from '../../../types/shipment';

interface ShipmentOrderSelectionPanelProps {
  orders: ShipmentOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  isLoading: boolean;
  variant?: 'default' | 'ops';
}

export function ShipmentOrderSelectionPanel({
  orders,
  selectedOrderId,
  onSelectOrder,
  isLoading,
  variant = 'default',
}: ShipmentOrderSelectionPanelProps): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const isOps = variant === 'ops';

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchQuery) return orders;
    const lowerQuery = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.siparisNo.toLowerCase().includes(lowerQuery)
        || order.customerName.toLowerCase().includes(lowerQuery),
    );
  }, [orders, searchQuery]);

  const locale = i18n.language === 'tr'
    ? 'tr-TR'
    : i18n.language === 'en'
      ? 'en-US'
      : i18n.language === 'de'
        ? 'de-DE'
        : i18n.language === 'fr'
          ? 'fr-FR'
          : 'tr-TR';

  return (
    <div className={cn('flex h-full flex-col', isOps && 'wms-ops-order-panel')}>
      <div className={cn('border-b px-2 pb-2', isOps && 'wms-ops-order-panel__search')}>
        {isOps ? (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 z-[1] size-3.5 -translate-y-1/2" aria-hidden />
            <OpsInput
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn(OPS_FIELD_CLASS, 'h-9 pl-8 text-xs')}
            />
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        )}
      </div>

      <div className={cn('flex-1 space-y-1.5 overflow-y-auto p-2', isOps && 'wms-ops-order-panel__list')}>
        {isLoading ? (
          isOps ? (
            <div className="wms-ops-panel-empty">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          )
        ) : filteredOrders.length === 0 ? (
          isOps ? (
            <div className="wms-ops-panel-empty">
              <Inbox className="size-6" aria-hidden />
              <p>{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
            </div>
          )
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.siparisNo}
              className={cn(
                'cursor-pointer rounded border p-2 transition-all hover:bg-accent',
                isOps && 'wms-ops-order-card',
                selectedOrderId === order.siparisNo && (
                  isOps
                    ? 'wms-ops-order-card--active'
                    : 'border-primary bg-primary/5 ring-1 ring-primary'
                ),
              )}
              onClick={() => onSelectOrder(order.siparisNo)}
            >
              <div className="mb-1.5 flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-semibold">{order.siparisNo}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{order.customerName}</p>
                </div>
                <Badge
                  variant={order.remainingForImport > 0 ? 'default' : 'secondary'}
                  className={cn(
                    'shrink-0 px-1.5 py-0 text-[10px]',
                    isOps && 'wms-ops-order-badge',
                    isOps && order.remainingForImport > 0 && 'wms-ops-order-badge--pending',
                  )}
                >
                  {order.remainingForImport > 0
                    ? t('shipment.step2.pending')
                    : t('shipment.step2.completed')}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{new Date(order.orderDate).toLocaleDateString(locale)}</span>
                </div>
                <span className="font-medium">
                  {t('shipment.step2.remaining')}: {order.remainingForImport.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
