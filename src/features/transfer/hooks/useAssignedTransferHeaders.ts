import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export function useAssignedTransferHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.ASSIGNED_HEADERS, userId],
    queryFn: () => transferApi.getAssignedHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}


