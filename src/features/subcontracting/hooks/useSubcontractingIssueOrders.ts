import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSubcontractingIssueOrders = (customerCode: string | undefined) => {
  return useQuery({
    queryKey: ['subcontracting-issue-orders', customerCode],
    queryFn: ({ signal }) => subcontractingApi.getIssueOrdersByCustomer(customerCode!, { signal }),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
};

