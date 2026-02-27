import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { notificationService } from '../services/notification-service';

const REFRESH_INTERVAL = 60000;

export function useNotificationConnection(): void {
  const { isAuthenticated } = useAuthStore();
  const connectedRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const shouldConnect = isAuthenticated();
    
    if (shouldConnect && !connectedRef.current) {
      connectedRef.current = true;
      
      notificationService.fetchNotifications(true).catch((error) => {
        console.error('[useNotificationConnection] Failed to fetch initial notifications:', error);
      });
      
      notificationService.connect().catch((error) => {
        console.error('[useNotificationConnection] Failed to connect to SignalR:', error);
        connectedRef.current = false;
      });
      
      refreshIntervalRef.current = setInterval(() => {
        notificationService.fetchNotifications(false).catch((error) => {
          console.error('[useNotificationConnection] Failed to refresh notifications:', error);
        });
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (!shouldConnect && connectedRef.current) {
        connectedRef.current = false;
        notificationService.disconnect().catch((error) => {
          console.error('[useNotificationConnection] Failed to disconnect from SignalR:', error);
        });
      }
    };
  }, [isAuthenticated]);
}

