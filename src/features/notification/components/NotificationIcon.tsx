import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '../stores/notification-store';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationIcon(): ReactElement {
  const { t } = useTranslation();
  const { unreadCount, connectionState } = useNotificationStore();
  const hasUnread = unreadCount > 0;

  return (
    <NotificationDropdown
      children={
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${t('notification.notifications')}${hasUnread ? ` (${unreadCount} ${t('notification.new')})` : ''}`}
        >
          <BellIcon className="size-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-destructive" />
            </span>
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {connectionState === 'disconnected' && (
            <span
              className={cn(
                'absolute bottom-0 right-0 size-2 rounded-full border-2 border-background',
                'bg-yellow-500'
              )}
              title={t('notification.connectionDisconnected')}
            />
          )}
        </Button>
      }
    />
  );
}

