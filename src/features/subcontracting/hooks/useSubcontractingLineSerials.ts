import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import type { SubcontractingLineSerialsResponse } from '../types/subcontracting';

export function useSubcontractingLineSerials(lineId: number | null, documentType: string | null) {
  return useQuery<SubcontractingLineSerialsResponse>({
    queryKey: ['subcontracting-line-serials', lineId, documentType],
    queryFn: (): Promise<SubcontractingLineSerialsResponse> => {
      if (!lineId || !documentType) {
        return Promise.resolve({
          success: true,
          data: [],
          message: '',
          exceptionMessage: '',
          errors: [],
          timestamp: new Date().toISOString(),
          statusCode: 200,
          className: '',
        } as SubcontractingLineSerialsResponse);
      }
      if (documentType === 'SRT') {
        return subcontractingApi.getReceiptLineSerials(lineId);
      }
      return subcontractingApi.getIssueLineSerials(lineId);
    },
    enabled: !!lineId && !!documentType,
    staleTime: 2 * 60 * 1000,
  });
}

