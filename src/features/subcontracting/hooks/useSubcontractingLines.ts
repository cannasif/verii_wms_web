import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import type { SubcontractingLinesResponse } from '../types/subcontracting';

export function useSubcontractingLines(headerId: number | null, documentType: string | null) {
  return useQuery<SubcontractingLinesResponse>({
    queryKey: ['subcontracting-lines', headerId, documentType],
    queryFn: (): Promise<SubcontractingLinesResponse> => {
      if (!headerId || !documentType) {
        return Promise.resolve({
          success: true,
          data: [],
          message: '',
          exceptionMessage: '',
          errors: [],
          timestamp: new Date().toISOString(),
          statusCode: 200,
          className: '',
        } as SubcontractingLinesResponse);
      }
      if (documentType === 'SRT') {
        return subcontractingApi.getReceiptLines(headerId);
      }
      return subcontractingApi.getIssueLines(headerId);
    },
    enabled: !!headerId && !!documentType,
    staleTime: 2 * 60 * 1000,
  });
}

