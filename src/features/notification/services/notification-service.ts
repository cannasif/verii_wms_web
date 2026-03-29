import type * as SignalR from '@microsoft/signalr';
import { ensureApiReady, getApiBaseUrl } from '@/lib/axios';
import { notificationApi } from '../api/notification-api';
import type { NotificationDto, SignalRNotificationPayload } from '../types/notification';
import { useNotificationStore } from '../stores/notification-store';

type SignalRModule = typeof import('@microsoft/signalr');

let signalRModulePromise: Promise<SignalRModule> | null = null;

async function loadSignalR(): Promise<SignalRModule> {
  signalRModulePromise ??= import('@microsoft/signalr');
  return signalRModulePromise;
}

class NotificationService {
  private hubConnection: SignalR.HubConnection | null = null;

  private async getApiUrl(): Promise<string> {
    await ensureApiReady();
    return getApiBaseUrl().replace(/\/$/, '');
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  async connect(): Promise<void> {
    const signalR = await loadSignalR();
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
      const hubUrl = `${apiUrl}/notificationHub`;

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => this.getToken() ?? '',
        })
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
      });

      this.hubConnection.onclose((error) => {
        if (error) {
          console.error('[NotificationService] SignalR connection closed with error:', error);
        }
        useNotificationStore.getState().setConnectionState('disconnected');
        this.hubConnection = null;
      });

      await this.hubConnection.start();
      useNotificationStore.getState().setConnectionState('connected');
    } catch (error) {
      console.error('[NotificationService] SignalR connection error:', error);
      useNotificationStore.getState().setConnectionState('disconnected');
      this.hubConnection = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
    useNotificationStore.getState().setConnectionState('disconnected');
  }


  private handleNotification(payload: Partial<SignalRNotificationPayload>): void {
    const mapChannel = (channel: unknown): 'Terminal' | 'Web' => {
      if (typeof channel === 'string') {
        if (channel === 'Terminal' || channel === 'Web') {
          return channel;
        }
      }
      if (channel === 1 || channel === 'Terminal') return 'Terminal';
      if (channel === 2 || channel === 'Web') return 'Web';
      return 'Web';
    };

    const mapSeverity = (type: unknown): 'info' | 'warning' | 'error' => {
      if (typeof type === 'string') {
        const lowerType = type.toLowerCase();
        if (lowerType === 'info' || lowerType === 'warning' || lowerType === 'error') {
          return lowerType;
        }
      }
      if (type === 1 || type === 'info') return 'info';
      if (type === 2 || type === 'warning') return 'warning';
      if (type === 3 || type === 'error') return 'error';
      return 'info';
    };

    const notification: NotificationDto = {
      id: payload.id ?? 0,
      title: payload.title ?? '',
      message: payload.message ?? '',
      channel: mapChannel(payload.channel),
      severity: mapSeverity(payload.type),
      isRead: false,
      readDate: null,
      timestamp: payload.timestamp || new Date().toISOString(),
      recipientUserId: payload.recipientUserId ?? null,
      recipientTerminalUserId: payload.recipientTerminalUserId ?? null,
      relatedEntityType: 'relatedEntityType' in payload && typeof payload.relatedEntityType === 'string' ? payload.relatedEntityType : null,
      relatedEntityId: 'relatedEntityId' in payload && typeof payload.relatedEntityId === 'number' ? payload.relatedEntityId : null,
      actionUrl: 'actionUrl' in payload && typeof payload.actionUrl === 'string' ? payload.actionUrl : null,
      terminalActionCode: 'terminalActionCode' in payload && typeof payload.terminalActionCode === 'string' ? payload.terminalActionCode : null,
    };

    useNotificationStore.getState().addNotification(notification);
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

  getConnectionState(): SignalR.HubConnectionState | null {
    return this.hubConnection?.state ?? null;
  }
}

export const notificationService = new NotificationService();
