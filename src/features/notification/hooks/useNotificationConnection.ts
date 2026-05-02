import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { notificationService } from '../services/notification-service';

export function useNotificationConnection(): void {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let isCancelled = false;

    if (!token || !user) {
      notificationService.disconnect().catch((error) => {
        console.error('[useNotificationConnection] Failed to disconnect from SignalR:', error);
      });

      return;
    }

    notificationService.connect().catch((error) => {
      if (!isCancelled) {
        console.error('[useNotificationConnection] Failed to connect to SignalR:', error);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [token, user]);

  useEffect(() => {
    return () => {
      notificationService.disconnect().catch((error) => {
        console.error('[useNotificationConnection] Failed to disconnect from SignalR during unmount:', error);
      });
    };
  }, []);
}
