import { useQuery } from '@tanstack/react-query';
import { serviceAllocationApi } from '../api/service-allocation.api';
import type { PagedParams } from '@/types/api';

export function useServiceCasesQuery(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['service-allocation', 'cases', params],
    queryFn: () => serviceAllocationApi.getServiceCases(params),
  });
}
