import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Search, Calendar, Loader2, Inbox } from 'lucide-react';
import { OpsInput, PageState } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Order } from '../../../types/goods-receipt';

interface OrderSelectionPanelProps {
    orders: Order[];
    selectedOrderId: string | null;
    onSelectOrder: (orderId: string) => void;
    isLoading: boolean;
    variant?: 'default' | 'ops';
}

export function OrderSelectionPanel({
    orders,
    selectedOrderId,
    onSelectOrder,
    isLoading,
    variant = 'default',
}: OrderSelectionPanelProps): ReactElement {
    const { t } = useTranslation(['goods-receipt', 'common']);
    const [searchQuery, setSearchQuery] = useState('');
    const isOps = variant === 'ops';

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (!searchQuery) return orders;
        const lowerQuery = searchQuery.toLowerCase();
        return orders.filter((order) =>
            order.siparisNo.toLowerCase().includes(lowerQuery) ||
            order.customerName.toLowerCase().includes(lowerQuery)
        );
    }, [orders, searchQuery]);

    return (
        <div className={cn('flex flex-col h-full', isOps && 'wms-ops-order-panel')}>
            <div className={cn('pb-2 border-b px-2', isOps && 'wms-ops-order-panel__search border-b')}>
                {isOps ? (
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] size-3.5 -translate-y-1/2" aria-hidden />
                        <OpsInput
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(OPS_FIELD_CLASS, 'h-9 pl-8 text-xs')}
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-7 h-7 text-xs"
                        />
                    </div>
                )}
            </div>

            <div className={cn('flex-1 overflow-y-auto space-y-1.5 p-2', isOps && 'wms-ops-order-panel__list')}>
                {isLoading ? (
                    isOps ? (
                        <div className="wms-ops-panel-empty">
                            <Loader2 className="size-6 animate-spin" aria-hidden />
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : (
                        <PageState tone="loading" title={t('common.loading')} compact />
                    )
                ) : filteredOrders.length === 0 ? (
                    isOps ? (
                        <div className="wms-ops-panel-empty">
                            <Inbox className="size-6" aria-hidden />
                            <p>{t('common.noResults')}</p>
                        </div>
                    ) : (
                        <PageState tone="empty" title={t('common.noResults')} compact />
                    )
                ) : (
                    filteredOrders.map((order) => (
                        <div
                            key={order.siparisNo}
                            className={cn(
                                'cursor-pointer border rounded p-2 transition-all hover:bg-accent',
                                isOps && 'wms-ops-order-card',
                                selectedOrderId === order.siparisNo && (
                                    isOps
                                        ? 'wms-ops-order-card--active'
                                        : 'ring-1 ring-primary border-primary bg-primary/5'
                                ),
                            )}
                            onClick={() => onSelectOrder(order.siparisNo)}
                        >
                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono font-semibold text-xs truncate">
                                        {order.siparisNo}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                        {order.customerName}
                                    </p>
                                </div>
                                <Badge
                                    variant={order.remainingForImport > 0 ? 'default' : 'secondary'}
                                    className={cn(
                                        'text-[10px] shrink-0 px-1.5 py-0',
                                        isOps && 'wms-ops-order-badge',
                                        isOps && order.remainingForImport > 0 && 'wms-ops-order-badge--pending',
                                    )}
                                >
                                    {order.remainingForImport > 0 
                                        ? t('goodsReceipt.step2.pending')
                                        : t('goodsReceipt.step2.completed')}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5" />
                                    <span>
                                      {new Date(order.orderDate).toLocaleDateString(
                                        i18n.language === 'tr' ? 'tr-TR' :
                                        i18n.language === 'en' ? 'en-US' :
                                        i18n.language === 'de' ? 'de-DE' :
                                        i18n.language === 'fr' ? 'fr-FR' : 'tr-TR'
                                      )}
                                    </span>
                                </div>
                                <span className="font-medium">
                                    {t('goodsReceipt.step2.remaining')}: {order.remainingForImport.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
