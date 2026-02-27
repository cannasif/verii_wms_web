import * as signalR from '@microsoft/signalr';
import { ensureApiReady, getApiBaseUrl } from '@/lib/axios';
import { notificationApi } from '../api/notification-api';
import type { NotificationDto, SignalRNotificationPayload } from '../types/notification';
import { useNotificationStore } from '../stores/notification-store';

class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  private async getApiUrl(): Promise<string> {
    await ensureApiReady();
    return getApiBaseUrl().replace(/\/$/, '') || 'http://localhost:5000';
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  async connect(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      console.warn('[NotificationService] No token available for SignalR connection');
      return;
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      const apiUrl = await this.getApiUrl();
      const hubUrl = `${apiUrl}/notificationHub?access_token=${encodeURIComponent(token)}`;

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const previousRetryCount = retryContext.previousRetryCount;
            if (previousRetryCount === 0) return 0;
            if (previousRetryCount === 1) return 2000;
            if (previousRetryCount === 2) return 10000;
            return 30000;
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.hubConnection.on('ReceiveNotification', (payload: SignalRNotificationPayload) => {
        this.handleNotification(payload);
      });

      this.hubConnection.onreconnecting(() => {
        useNotificationStore.getState().setConnectionState('reconnecting');
      });

      this.hubConnection.onreconnected(() => {
        useNotificationStore.getState().setConnectionState('connected');
        this.stopPolling();
      });

      this.hubConnection.onclose((error) => {
        if (error) {
          console.error('[NotificationService] SignalR connection closed with error:', error);
        }
        useNotificationStore.getState().setConnectionState('disconnected');
        this.startPolling();
      });

      await this.hubConnection.start();
      useNotificationStore.getState().setConnectionState('connected');
      this.stopPolling();
      
      await this.fetchNotifications(true);
    } catch (error) {
      console.error('[NotificationService] SignalR connection error:', error);
      useNotificationStore.getState().setConnectionState('disconnected');
      this.startPolling();
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
    useNotificationStore.getState().setConnectionState('disconnected');
  }


  private handleNotification(payload: any): void {
    const mapChannel = (channel: any): 'Terminal' | 'Web' => {
      if (typeof channel === 'string') {
        return channel as 'Terminal' | 'Web';
      }
      if (channel === 1 || channel === 'Terminal') return 'Terminal';
      if (channel === 2 || channel === 'Web') return 'Web';
      return 'Web';
    };

    const mapSeverity = (type: any): 'info' | 'warning' | 'error' => {
      if (typeof type === 'string') {
        const lowerType = type.toLowerCase();
        if (lowerType === 'info' || lowerType === 'warning' || lowerType === 'error') {
          return lowerType as 'info' | 'warning' | 'error';
        }
      }
      if (type === 1 || type === 'info') return 'info';
      if (type === 2 || type === 'warning') return 'warning';
      if (type === 3 || type === 'error') return 'error';
      return 'info';
    };

    const notification: NotificationDto = {
      id: payload.id,
      title: payload.title,
      message: payload.message,
      channel: mapChannel(payload.channel),
      severity: mapSeverity(payload.type),
      isRead: false,
      readDate: null,
      timestamp: payload.timestamp || new Date().toISOString(),
      recipientUserId: payload.recipientUserId ?? null,
      recipientTerminalUserId: payload.recipientTerminalUserId ?? null,
      relatedEntityType: payload.relatedEntityType || null,
      relatedEntityId: payload.relatedEntityId || null,
      actionUrl: payload.actionUrl || null,
      terminalActionCode: payload.terminalActionCode || null,
    };

    useNotificationStore.getState().addNotification(notification);
  }

  private startPolling(): void {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchNotifications(false);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  async fetchNotifications(resetPagination = true): Promise<void> {
    try {
      const store = useNotificationStore.getState();
      store.setLoading(true);

      const response = await notificationApi.getPagedNotifications({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'Id',
        sortDirection: 'desc',
      });
      
      if (resetPagination) {
        store.setNotifications(response.data);
        store.setPaginationState(1, response.totalPages, response.hasNextPage);
      } else {
        const existingIds = new Set(store.notifications.map((n) => n.id));
        const newNotifications = response.data.filter((n) => !existingIds.has(n.id));
        if (newNotifications.length > 0) {
          const currentNotifications = store.notifications;
          store.setNotifications([...newNotifications, ...currentNotifications]);
        }
        store.setPaginationState(store.currentPage, response.totalPages, store.hasNextPage);
      }
      
      store.setUnreadCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    } finally {
      useNotificationStore.getState().setLoading(false);
    }
  }

  async markAsRead(id: number): Promise<void> {
    try {
      await notificationApi.markAsRead(id);
      useNotificationStore.getState().markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const store = useNotificationStore.getState();
      
      if (store.unreadCount === 0) {
        return;
      }
      
      await notificationApi.markAllAsRead();
      store.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.hubConnection?.state ?? null;
  }
}

export const notificationService = new NotificationService();
