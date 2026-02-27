import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSubcontractingIssueOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: ['subcontracting-issue-order-items', orderNumbers],
    queryFn: () => subcontractingApi.getIssueOrderItems(orderNumbers!),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};

