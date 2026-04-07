import axios from 'axios';
import i18n from './i18n';
import { useAuthStore } from '@/stores/auth-store';
import { isRequestCanceled } from './request-utils';
import {
  loadConfig,
  getApiUrl,
  getApiBaseUrl,
  isCurrentAppPath,
  resolveAppPath,
} from './api-config';

export { loadConfig, getApiUrl, getApiBaseUrl, resolveAppPath };

export async function ensureApiReady(): Promise<void> {
  const base = await loadConfig();
  api.defaults.baseURL = base;
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

function shouldSkipBranchInjection(payload: unknown): boolean {
  return payload == null
    || typeof payload !== 'object'
    || payload instanceof FormData
    || payload instanceof Blob
    || payload instanceof ArrayBuffer;
}

function shouldReplaceBranchCode(value: unknown): boolean {
  return value == null
    || (typeof value === 'string' && (value.trim() === '' || value.trim() === '0'))
    || (typeof value === 'number' && value === 0);
}

function applyBranchCodeToPayload(payload: unknown, branchCode: string, visited = new WeakSet<object>()): void {
  if (shouldSkipBranchInjection(payload)) {
    return;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      applyBranchCodeToPayload(item, branchCode, visited);
    }
    return;
  }

  const target = payload as Record<string, unknown>;
  if (visited.has(target)) {
    return;
  }

  visited.add(target);

  if (Object.prototype.hasOwnProperty.call(target, 'branchCode') && shouldReplaceBranchCode(target.branchCode)) {
    target.branchCode = branchCode;
  }

  for (const value of Object.values(target)) {
    applyBranchCodeToPayload(value, branchCode, visited);
  }
}

function normalizeApiEnvelope(payload: unknown): unknown {
  if (
    (typeof Blob !== 'undefined' && payload instanceof Blob) ||
    payload instanceof ArrayBuffer
  ) {
    return payload;
  }

  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const source = payload as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...source };

  if (normalized.success === undefined && typeof source.Success === 'boolean') {
    normalized.success = source.Success;
  }
  if (normalized.message === undefined && typeof source.Message === 'string') {
    normalized.message = source.Message;
  }
  if (normalized.exceptionMessage === undefined && typeof source.ExceptionMessage === 'string') {
    normalized.exceptionMessage = source.ExceptionMessage;
  }
  if (normalized.data === undefined && source.Data !== undefined) {
    normalized.data = source.Data;
  }
  if (normalized.errorCode === undefined && typeof source.ErrorCode === 'string') {
    normalized.errorCode = source.ErrorCode;
  }
  if (normalized.details === undefined && source.Details !== undefined) {
    normalized.details = source.Details;
  }
  if (normalized.errors === undefined && Array.isArray(source.Errors)) {
    normalized.errors = source.Errors;
  }
  if (normalized.timestamp === undefined && typeof source.Timestamp === 'string') {
    normalized.timestamp = source.Timestamp;
  }
  if (normalized.statusCode === undefined && typeof source.StatusCode === 'number') {
    normalized.statusCode = source.StatusCode;
  }
  if (normalized.className === undefined && typeof source.ClassName === 'string') {
    normalized.className = source.ClassName;
  }

  return normalized;
}

function extractApiErrorMessage(payload: unknown): string | null {
  if (payload == null || typeof payload !== 'object') {
    return null;
  }

  const errorPayload = payload as Record<string, unknown>;

  const message = errorPayload.message;
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  const exceptionMessage = errorPayload.exceptionMessage;
  if (typeof exceptionMessage === 'string' && exceptionMessage.trim().length > 0) {
    return exceptionMessage;
  }

  const errors = errorPayload.errors;
  if (Array.isArray(errors)) {
    const firstError = errors.find((item) => typeof item === 'string' && item.trim().length > 0);
    if (typeof firstError === 'string') {
      return firstError;
    }
  }

  return null;
}

api.interceptors.request.use((config) => {
  config.baseURL = config.baseURL || getApiBaseUrl() || api.defaults.baseURL;

  const skipAuth = config.skipAuth === true;
  if (!skipAuth) {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Language'] = i18n.language || 'tr';

    const branch = useAuthStore.getState().branch;
    if (branch?.code) {
      config.headers['X-Branch-Code'] = branch.code;
      applyBranchCodeToPayload(config.data, branch.code);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    response.data = normalizeApiEnvelope(response.data);
    return response.data;
  },
  (error) => {
    if (isRequestCanceled(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      useAuthStore.getState().logout();

      if (!isCurrentAppPath('/auth/login?sessionExpired=true')) {
        window.location.href = resolveAppPath('/auth/login?sessionExpired=true');
      }
    }

    const apiError = normalizeApiEnvelope(error.response?.data);
    if (error.response) {
      error.response.data = apiError;
    }

    const apiMessage = extractApiErrorMessage(apiError);
    if (apiMessage) {
      error.message = apiMessage;
    }

    return Promise.reject(error);
  }
);

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }

  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: import('axios').AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: import('axios').AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: import('axios').AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: import('axios').AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: import('axios').AxiosRequestConfig): Promise<T>;
  }
}
