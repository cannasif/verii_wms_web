import { type ReactElement, useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '../stores/notification-store';
import { notificationApi } from '../api/notification-api';
import { NotificationItem } from './NotificationItem';
import { debounce } from '@/lib/utils/debounce';

interface NotificationDropdownProps {
  children: ReactElement;
}

export function NotificationDropdown({ children }: NotificationDropdownProps): ReactElement {
  const { t, i18n } = useTranslation();
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasNextPage,
    currentPage,
    isMarkingAsRead,
    setLoading,
    setLoadingMore,
    setNotifications,
    appendNotifications,
    setPaginationState,
    markAllAsRead: markAllAsReadStore,
    setUnreadCount,
    clearNotifications,
  } = useNotificationStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const currentLanguageRef = useRef(i18n.language);
  const [isOpen, setIsOpen] = useState(false);

  const loadInitialNotifications = useCallback(async (): Promise<void> => {
    if (notifications.length > 0 && currentPage > 0) return;
    
    setLoading(true);
    
    try {
      const response = await notificationApi.getPagedNotifications({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'Id',
        sortDirection: 'desc',
      });
      
      setNotifications(response.data);
      setPaginationState(1, response.totalPages, response.hasNextPage);
      setUnreadCount(response.totalCount);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [notifications.length, currentPage, setLoading, setNotifications, setPaginationState, setUnreadCount]);

  const loadMoreNotifications = useCallback(async (): Promise<void> => {
    if (!hasNextPage || isLoadingMore || isLoading) return;
    
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const response = await notificationApi.getPagedNotifications({
        pageNumber: nextPage,
        pageSize: 10,
        sortBy: 'Id',
        sortDirection: 'desc',
      });
      
      appendNotifications(response.data);
      setPaginationState(nextPage, response.totalPages, response.hasNextPage);
    } catch (error) {
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, isLoadingMore, isLoading, currentPage, setLoadingMore, appendNotifications, setPaginationState]);


  const handleScroll = useCallback((): void => {
    if (!scrollContainerRef.current || isLoadingMore || isLoading) return;
    
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const threshold = 200;
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasNextPage) {
      loadMoreNotifications();
    }
  }, [isLoadingMore, isLoading, hasNextPage, loadMoreNotifications]);

  const debouncedScrollHandlerRef = useRef<((...args: unknown[]) => void) | undefined>(undefined);
  
  useEffect(() => {
    debouncedScrollHandlerRef.current = debounce(handleScroll, 300);
    return () => {
      debouncedScrollHandlerRef.current = undefined;
    };
  }, [handleScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isOpen) return;
    
    const handler = debouncedScrollHandlerRef.current;
    if (!handler) return;
    
    container.addEventListener('scroll', handler);
    return () => {
      container.removeEventListener('scroll', handler);
    };
  }, [isOpen]);

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    const container = scrollContainerRef.current;
    if (!trigger || !hasNextPage || !container || !isOpen) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && !isLoading) {
          loadMoreNotifications();
        }
      },
      { root: container, rootMargin: '200px', threshold: 0.1 }
    );
    
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, isLoading, loadMoreNotifications, isOpen]);

  useEffect(() => {
    if (isOpen && notifications.length === 0 && !isLoading) {
      loadInitialNotifications();
    }
  }, [isOpen, notifications.length, isLoading, loadInitialNotifications]);

  useEffect(() => {
    if (currentLanguageRef.current !== i18n.language) {
      currentLanguageRef.current = i18n.language;
      clearNotifications();
      if (isOpen) {
        loadInitialNotifications();
      }
    }
  }, [i18n.language, isOpen, loadInitialNotifications, clearNotifications]);

  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    if (unreadCount === 0) return;
    
    try {
      await notificationApi.markAllAsRead();
      markAllAsReadStore();
    } catch (error) {
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            {t('notification.title')}
            {hasUnread && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({unreadCount} {t('notification.unreadCount')})
              </span>
            )}
          </DropdownMenuLabel>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
              disabled={isMarkingAsRead}
            >
              {t('notification.markAllAsRead')}
            </Button>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-[400px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('notification.loading')}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t('notification.noNotifications')}</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                  {hasNextPage && (
                    <div ref={loadMoreTriggerRef} className="h-4" />
                  )}
                  {isLoadingMore && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t('notification.loading')}
                    </div>
                  )}
                  {!hasNextPage && notifications.length > 0 && (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      {t('notification.noMoreNotifications', 'Tüm bildirimler yüklendi')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

