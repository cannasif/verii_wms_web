import type * as SignalR from '@microsoft/signalr';
import { ensureApiReady, getApiBaseUrl } from '@/lib/axios';
import { notificationApi } from '../api/notification-api';
import type { NotificationDto, SignalRNotificationPayload } from '../types/notification';
import { useNotificationStore } from '../stores/notification-store';

type SignalRModule = typeof import('@microsoft/signalr');

const INITIAL_RETRY_DELAYS_MS = [0, 2000, 5000, 10000] as const;
const RECONNECT_DELAYS_MS = [0, 2000, 10000, 30000] as const;
const SERVER_TIMEOUT_MS = 30000;
const KEEP_ALIVE_INTERVAL_MS = 15000;

let signalRModulePromise: Promise<SignalRModule> | null = null;

async function loadSignalR(): Promise<SignalRModule> {
  signalRModulePromise ??= import('@microsoft/signalr');
  return signalRModulePromise;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

class NotificationService {
  private hubConnection: SignalR.HubConnection | null = null;

  private connectPromise: Promise<void> | null = null;

  private reconnectTimeoutId: number | null = null;

  private manualDisconnect = false;

  private activeToken: string | null = null;

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
      await this.disconnect();
      return;
    }

    if (this.activeToken && this.activeToken !== token) {
      await this.disconnect();
    }

    const state = this.hubConnection?.state;
    if (state === signalR.HubConnectionState.Connected
      || state === signalR.HubConnectionState.Connecting
      || state === signalR.HubConnectionState.Reconnecting) {
      return this.connectPromise ?? Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.manualDisconnect = false;
    this.clearReconnectTimeout();

    this.connectPromise = this.startConnection(token)
      .finally(() => {
        this.connectPromise = null;
      });

    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    this.activeToken = null;
    this.clearReconnectTimeout();

    const connection = this.hubConnection;
    this.hubConnection = null;
    this.connectPromise = null;

    if (connection) {
      try {
        await connection.stop();
      } catch (error) {
        console.error('[NotificationService] Failed to stop SignalR connection:', error);
      }
    }

    useNotificationStore.getState().setConnectionState('disconnected');
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
          store.setNotifications([...newNotifications, ...store.notifications]);
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

  private async startConnection(token: string): Promise<void> {
    const signalR = await loadSignalR();
    const apiUrl = await this.getApiUrl();
    const hubUrl = `${apiUrl}/notificationHub`;
    const connection = this.createConnection(signalR, hubUrl);

    this.hubConnection = connection;
    this.activeToken = token;

    for (const retryDelayMs of INITIAL_RETRY_DELAYS_MS) {
      if (this.manualDisconnect) {
        return;
      }

      if (retryDelayMs > 0) {
        await delay(retryDelayMs);
      }

      try {
        await connection.start();
        useNotificationStore.getState().setConnectionState('connected');
        void this.fetchNotifications(true).catch((error) => {
          console.error('[NotificationService] Failed to prime notifications after connect:', error);
        });
        return;
      } catch (error) {
        console.error('[NotificationService] SignalR connection error:', error);
      }
    }

    useNotificationStore.getState().setConnectionState('disconnected');
    this.hubConnection = null;
    this.activeToken = null;

    if (!this.manualDisconnect && this.getToken()) {
      this.scheduleReconnect();
    }
  }

  private createConnection(signalR: SignalRModule, hubUrl: string): SignalR.HubConnection {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.getToken() ?? '',
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delayMs = RECONNECT_DELAYS_MS[retryContext.previousRetryCount];
          return delayMs ?? RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.serverTimeoutInMilliseconds = SERVER_TIMEOUT_MS;
    connection.keepAliveIntervalInMilliseconds = KEEP_ALIVE_INTERVAL_MS;

    connection.on('ReceiveNotification', (payload: SignalRNotificationPayload) => {
      this.handleNotification(payload);
    });

    connection.onreconnecting(() => {
      useNotificationStore.getState().setConnectionState('reconnecting');
    });

    connection.onreconnected(() => {
      useNotificationStore.getState().setConnectionState('connected');
      void this.fetchNotifications(true).catch((error) => {
        console.error('[NotificationService] Failed to refresh notifications after reconnect:', error);
      });
    });

    connection.onclose((error) => {
      if (error) {
        console.error('[NotificationService] SignalR connection closed with error:', error);
      }

      useNotificationStore.getState().setConnectionState('disconnected');
      this.hubConnection = null;

      if (!this.manualDisconnect && this.getToken()) {
        this.scheduleReconnect();
      }
    });

    return connection;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      return;
    }

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectTimeoutId = null;
      void this.connect().catch((error) => {
        console.error('[NotificationService] Scheduled reconnect failed:', error);
      });
    }, 5000);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
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
}

export const notificationService = new NotificationService();
