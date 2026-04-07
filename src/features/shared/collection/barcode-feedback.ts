import axios from 'axios';
import type { ApiResponse } from '@/types/api';
import { isBarcodeResolutionError, type BarcodeMatchCandidate, type ResolvedBarcode } from '@/services/barcode-types';

export interface BarcodeFeedbackState {
  message: string;
  candidates: BarcodeMatchCandidate[];
  errorCode?: string;
}

function extractCandidates(details: unknown): BarcodeMatchCandidate[] {
  if (!details || typeof details !== 'object') {
    return [];
  }

  const source = details as {
    candidates?: BarcodeMatchCandidate[];
    data?: { candidates?: BarcodeMatchCandidate[] };
  };

  if (Array.isArray(source.candidates)) {
    return source.candidates;
  }

  if (Array.isArray(source.data?.candidates)) {
    return source.data.candidates;
  }

  return [];
}

export function extractBarcodeFeedback(error: unknown, fallbackMessage: string): BarcodeFeedbackState {
  if (isBarcodeResolutionError(error)) {
    return {
      message: error.message || fallbackMessage,
      candidates: error.candidates,
    };
  }

  if (axios.isAxiosError<ApiResponse<ResolvedBarcode>>(error)) {
    const payload = error.response?.data;
    return {
      message: (payload?.message && payload.message.trim().length > 0 ? payload.message : error.message) || fallbackMessage,
      candidates: extractCandidates(payload?.details ?? payload?.data),
      errorCode: payload?.errorCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      candidates: [],
    };
  }

  return {
    message: fallbackMessage,
    candidates: [],
  };
}

export function getBarcodeCandidateLabel(candidate: BarcodeMatchCandidate): string {
  const stock = candidate.stockCode ?? '?';
  const name = candidate.stockName ? ` - ${candidate.stockName}` : '';
  const yap = candidate.yapKod ? ` (${candidate.yapKod})` : '';
  return `${stock}${name}${yap}`;
}
