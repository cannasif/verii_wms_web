import { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NotificationDto } from '../types/notification';
import { formatNotificationTime } from '../utils/date-utils';
import { notificationApi } from '../api/notification-api';
import { useNotificationStore } from '../stores/notification-store';

interface NotificationItemProps {
  notification: NotificationDto;
}

export function NotificationItem({ notification }: NotificationItemProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { markAsRead: markAsReadStore, addMarkedAsReadId } = useNotificationStore();

  const getRouteForEntity = (entityType: string, entityId: number): string | null => {
    if (!entityType || !entityType.endsWith('Header')) {
      const routeMap: Record<string, string> = {
        Package: `/package/detail/${entityId}`,
        Shipment: `/shipment/collection/${entityId}`,
        GoodsReceipt: `/goods-receipt/collection/${entityId}`,
      };
      return routeMap[entityType] || null;
    }
    
    const prefix = entityType.replace('Header', '');
    
    const headerRouteMap: Record<string, { route: string; useCollection: boolean }> = {
      WT: { route: 'transfer', useCollection: true },
      GR: { route: 'goods-receipt', useCollection: true },
      SH: { route: 'shipment', useCollection: true },
      SIT: { route: 'subcontracting/issue', useCollection: true },
      SRT: { route: 'subcontracting/receipt', useCollection: true },
      WI: { route: 'warehouse/inbound', useCollection: false },
      WO: { route: 'warehouse/outbound', useCollection: false },
    };
    
    const routeConfig = headerRouteMap[prefix];
    if (routeConfig) {
      if (routeConfig.useCollection) {
        return `/${routeConfig.route}/collection/${entityId}`;
      } else {
        return `/${routeConfig.route}/assigned`;
      }
    }
    
    return null;
  };

  const handleClick = async (): Promise<void> => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.relatedEntityType && notification.relatedEntityId) {
      const route = getRouteForEntity(notification.relatedEntityType, notification.relatedEntityId);
      if (route) {
        navigate(route);
      }
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    
    if (notification.isRead) return;
    
    try {
      await notificationApi.markNotificationsAsReadBulk([notification.id]);
      markAsReadStore(notification.id);
      addMarkedAsReadId(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex flex-col gap-2 p-3 rounded-md border cursor-pointer transition-all hover:bg-accent bg-accent/50 border-border"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {!notification.isRead && (
        <div className="absolute top-2 right-2 size-2 rounded-full bg-green-500" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm truncate font-semibold">
            {notification.title}
          </h4>
        </div>
        <p className="text-sm line-clamp-2 mt-1">
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {formatNotificationTime(notification.timestamp)}
          </p>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="h-7 text-xs gap-1.5"
            >
              <CheckIcon className="size-3" />
              {t('notification.markAsRead', 'Okundu işaretle')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

