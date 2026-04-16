import { useQuery } from '@tanstack/react-query';
import { serviceAllocationApi } from '../api/service-allocation.api';

export function useServiceCaseTimelineQuery(id: number | undefined) {
  return useQuery({
    queryKey: ['service-allocation', 'timeline', id],
    queryFn: () => serviceAllocationApi.getServiceCaseTimeline(id as number),
    enabled: Number.isFinite(id) && Number(id) > 0,
  });
}
