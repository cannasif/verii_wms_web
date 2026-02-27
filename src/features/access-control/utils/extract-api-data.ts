import type { ApiResponse } from '../types/access-control.types';

export function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || response.exceptionMessage || 'Request failed');
  }
  return response.data;
}
