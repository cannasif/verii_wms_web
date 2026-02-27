import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Order } from '../../../types/goods-receipt';

interface OrderSelectionPanelProps {
    orders: Order[];
    selectedOrderId: string | null;
    onSelectOrder: (orderId: string) => void;
    isLoading: boolean;
}

export function OrderSelectionPanel({
    orders,
    selectedOrderId,
    onSelectOrder,
    isLoading,
}: OrderSelectionPanelProps): ReactElement {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');

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
        <div className="flex flex-col h-full">
            <div className="pb-2 border-b px-2">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search', 'Sipariş No ile ara...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 h-7 text-xs"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 p-2">
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">{t('common.loading', 'Yükleniyor...')}</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">{t('common.noResults', 'Sonuç bulunamadı')}</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div
                            key={order.siparisNo}
                            className={cn(
                                'cursor-pointer border rounded p-2 transition-all hover:bg-accent',
                                selectedOrderId === order.siparisNo && 'ring-1 ring-primary border-primary bg-primary/5'
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
                                <Badge variant={order.remainingForImport > 0 ? 'default' : 'secondary'} className="text-[10px] shrink-0 px-1.5 py-0">
                                    {order.remainingForImport > 0 
                                        ? t('goodsReceipt.step2.pending', 'Beklemede')
                                        : t('goodsReceipt.step2.completed', 'Tamamlandı')}
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
                                    {t('goodsReceipt.step2.remaining', 'Kalan')}: {order.remainingForImport.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
