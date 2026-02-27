import { api } from '@/lib/axios';
import type { ApiResponse, PagedResponse } from '@/types/api';
import type { NotificationDto, CreateNotificationRequest, GetPagedNotificationsRequest, PagedNotificationsResponse } from '../types/notification';

const mapChannel = (channel: any): 'Terminal' | 'Web' => {
  if (typeof channel === 'string') {
    if (channel === 'Terminal' || channel === 'Web') {
      return channel as 'Terminal' | 'Web';
    }
  }
  if (channel === 1 || channel === 'Web') return 'Web';
  if (channel === 2 || channel === 'Terminal') return 'Terminal';
  return 'Web';
};

const mapSeverity = (severity: any): 'info' | 'warning' | 'error' => {
  if (typeof severity === 'string') {
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity === 'info' || lowerSeverity === 'warning' || lowerSeverity === 'error') {
      return lowerSeverity as 'info' | 'warning' | 'error';
    }
  }
  if (severity === 1 || severity === 'info') return 'info';
  if (severity === 2 || severity === 'warning') return 'warning';
  if (severity === 3 || severity === 'error') return 'error';
  return 'info';
};

const mapNotification = (item: any): NotificationDto => ({
  id: item.id,
  title: item.title,
  message: item.message,
  channel: mapChannel(item.channel),
  severity: mapSeverity(item.severity),
  isRead: item.isRead || false,
  readDate: item.readDate || null,
  timestamp: item.timestamp || item.createdDate || new Date().toISOString(),
  recipientUserId: item.recipientUserId ?? null,
  recipientTerminalUserId: item.recipientTerminalUserId ?? null,
  relatedEntityType: item.relatedEntityType || null,
  relatedEntityId: item.relatedEntityId || null,
  actionUrl: item.actionUrl || null,
  terminalActionCode: item.terminalActionCode || null,
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
    const requestBody = {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 10,
      sortBy: params.sortBy ?? 'Id',
      sortDirection: params.sortDirection ?? 'desc',
      filters: params.filters ?? [],
    };
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
