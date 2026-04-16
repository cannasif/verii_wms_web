import { useQuery } from '@tanstack/react-query';
import type { PagedParams } from '@/types/api';
import { serviceAllocationApi } from '../api/service-allocation.api';

export function useAllocationQueueQuery(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['service-allocation', 'allocation-queue', params],
    queryFn: () => serviceAllocationApi.getAllocationQueue(params),
  });
}
