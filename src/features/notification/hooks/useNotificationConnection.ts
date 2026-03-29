import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { notificationService } from '../services/notification-service';

export function useNotificationConnection(): void {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const shouldDisconnect = !token || !user;

    if (shouldDisconnect) {
      notificationService.disconnect().catch((error) => {
        console.error('[useNotificationConnection] Failed to disconnect from SignalR:', error);
      });
    }

    return () => {
      if (shouldDisconnect) {
        notificationService.disconnect().catch((error) => {
          console.error('[useNotificationConnection] Failed to disconnect from SignalR:', error);
        });
      }
    };
  }, [token, user]);
}
