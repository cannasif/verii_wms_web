import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedResponse } from '@/types/api';
import type { NotificationDto, CreateNotificationRequest, GetPagedNotificationsRequest, PagedNotificationsResponse } from '../types/notification';

type NotificationApiRecord = Record<string, unknown>;

const getRecordValue = <T>(record: NotificationApiRecord, key: string): T | undefined =>
  record[key] as T | undefined;

const mapChannel = (channel: unknown): 'Terminal' | 'Web' => {
  if (typeof channel === 'string') {
    if (channel === 'Terminal' || channel === 'Web') {
      return channel;
    }
  }
  if (channel === 1 || channel === 'Web') return 'Web';
  if (channel === 2 || channel === 'Terminal') return 'Terminal';
  return 'Web';
};

const mapSeverity = (severity: unknown): 'info' | 'warning' | 'error' => {
  if (typeof severity === 'string') {
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity === 'info' || lowerSeverity === 'warning' || lowerSeverity === 'error') {
      return lowerSeverity;
    }
  }
  if (severity === 1 || severity === 'info') return 'info';
  if (severity === 2 || severity === 'warning') return 'warning';
  if (severity === 3 || severity === 'error') return 'error';
  return 'info';
};

const mapNotification = (item: NotificationApiRecord): NotificationDto => ({
  id: getRecordValue<number>(item, 'id') ?? 0,
  title: getRecordValue<string>(item, 'title') ?? '',
  message: getRecordValue<string>(item, 'message') ?? '',
  channel: mapChannel(getRecordValue(item, 'channel')),
  severity: mapSeverity(getRecordValue(item, 'severity')),
  isRead: getRecordValue<boolean>(item, 'isRead') ?? false,
  readDate: getRecordValue<string | null>(item, 'readDate') ?? null,
  timestamp:
    getRecordValue<string>(item, 'timestamp') ??
    getRecordValue<string>(item, 'createdDate') ??
    new Date().toISOString(),
  recipientUserId: getRecordValue<number | null>(item, 'recipientUserId') ?? null,
  recipientTerminalUserId: getRecordValue<number | null>(item, 'recipientTerminalUserId') ?? null,
  relatedEntityType: getRecordValue<string | null>(item, 'relatedEntityType') ?? null,
  relatedEntityId: getRecordValue<number | null>(item, 'relatedEntityId') ?? null,
  actionUrl: getRecordValue<string | null>(item, 'actionUrl') ?? null,
  terminalActionCode: getRecordValue<string | null>(item, 'terminalActionCode') ?? null,
});

export const notificationApi = {
  getByUserId: async (userId?: number): Promise<NotificationDto[]> => {
    const url = userId ? `/api/notification/user/${userId}` : '/api/notification/user';
    const response = await api.get(url) as ApiResponse<NotificationDto[]>;
    if (response.success && response.data) {
      return response.data.map(mapNotification);
    }
    throw new Error(response.message || 'Bildirimler yüklenemedi');
  },

  getByTerminalUserId: async (terminalUserId?: number): Promise<NotificationDto[]> => {
    const url = terminalUserId 
      ? `/api/notification/terminal-user/${terminalUserId}` 
      : '/api/notification/terminal-user';
    const response = await api.get(url) as ApiResponse<NotificationDto[]>;
    if (response.success && response.data) {
      return response.data.map(mapNotification);
    }
    throw new Error(response.message || 'Bildirimler yüklenemedi');
  },

  markAsRead: async (id: number): Promise<void> => {
    const response = await api.put(`/api/notification/${id}/read`) as ApiResponse<void>;
    if (!response.success) {
      throw new Error(response.message || 'Bildirim okundu olarak işaretlenemedi');
    }
  },

  create: async (request: CreateNotificationRequest): Promise<NotificationDto> => {
    const response = await api.post('/api/notification', request) as ApiResponse<NotificationDto>;
    if (response.success && response.data) {
      return mapNotification(response.data);
    }
    throw new Error(response.message || 'Bildirim oluşturulamadı');
  },

  getPagedNotifications: async (
    params: GetPagedNotificationsRequest = {}
  ): Promise<PagedResponse<NotificationDto>> => {
    const requestBody = buildPagedRequest(params, { pageNumber: 1 });
    const response = await api.post('/api/notification/user/paged', requestBody) as PagedNotificationsResponse;
    if (response.success && response.data) {
      return {
        ...response.data,
        data: response.data.data.map(mapNotification),
      };
    }
    throw new Error(response.message || 'Bildirimler yüklenemedi');
  },

  markNotificationsAsReadBulk: async (ids: number[]): Promise<boolean> => {
    const response = await api.put('/api/notification/read/bulk', ids) as ApiResponse<boolean>;
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Bildirimler okundu olarak işaretlenemedi');
  },

  markAllAsRead: async (): Promise<boolean> => {
    const response = await api.put('/api/notification/read/all') as ApiResponse<boolean>;
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Tüm bildirimler okundu olarak işaretlenemedi');
  },
};
