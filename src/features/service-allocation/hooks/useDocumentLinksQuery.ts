import { useQuery } from '@tanstack/react-query';
import type { PagedParams } from '@/types/api';
import { serviceAllocationApi } from '../api/service-allocation.api';

export function useDocumentLinksQuery(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['service-allocation', 'document-links', params],
    queryFn: () => serviceAllocationApi.getDocumentLinks(params),
  });
}
