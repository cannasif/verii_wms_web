import { useQuery } from '@tanstack/react-query';
import { erpCommonApi } from '@/services/erp-common-api';
import type { Branch } from '../types/auth';
import { AUTH_QUERY_KEYS } from '../utils/query-keys';

export const useBranches = () => {
  return useQuery<Branch[]>({
    queryKey: [AUTH_QUERY_KEYS.BRANCHES],
    queryFn: async (): Promise<Branch[]> => {
      const data = await erpCommonApi.getBranches();
      return data.map((branch) => ({
        id: String(branch.subeKodu),
        name: branch.unvan && branch.unvan.trim().length > 0 ? branch.unvan : '-',
        code: String(branch.subeKodu),
      }));
    },
    staleTime: Infinity,
  });
};
