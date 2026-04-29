import type {
  SaveSteelGoodReciptAcceptanseInspectionDto,
  SteelGoodReciptAcceptanseInspectionBatchSearchDto,
  SteelGoodReciptAcceptanseLineListItemDto,
} from '../../types/steel-good-recipt-acceptanse.types';
import {
  resolveStatusCategory,
  type StatusCategoryKey,
} from '@/lib/localize-status';

export type SeriesStatusFilter = 'all' | StatusCategoryKey | 'unknown';

export function getStatusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('placed') || normalized.includes('placement')) {
    return 'border-violet-400/25 bg-violet-500/10 text-violet-200';
  }
  if (normalized.includes('waiting') || normalized.includes('pending')) {
    return 'border-amber-400/25 bg-amber-500/10 text-amber-200';
  }
  if (normalized.includes('approved')) return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (normalized.includes('rejected')) return 'border-rose-400/20 bg-rose-500/10 text-rose-200';
  if (normalized.includes('arrived')) return 'border-sky-400/20 bg-sky-500/10 text-sky-200';
  return 'border-white/10 bg-white/5 text-slate-200';
}

export function buildStatusSummary(lines: SteelGoodReciptAcceptanseLineListItemDto[]): {
  counts: Map<StatusCategoryKey, number>;
  unknown: number;
} {
  const counts = new Map<StatusCategoryKey, number>();
  let unknown = 0;

  for (const line of lines) {
    const category = resolveStatusCategory(line.status);
    if (category) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    } else {
      unknown += 1;
    }
  }

  return { counts, unknown };
}

export function filterDisplayLines(
  lines: SteelGoodReciptAcceptanseLineListItemDto[],
  seriesStatusFilter: SeriesStatusFilter,
): SteelGoodReciptAcceptanseLineListItemDto[] {
  if (seriesStatusFilter === 'all') {
    return lines;
  }
  if (seriesStatusFilter === 'unknown') {
    return lines.filter((line) => resolveStatusCategory(line.status) === null);
  }
  return lines.filter((line) => resolveStatusCategory(line.status) === seriesStatusFilter);
}

export function buildQuickDecisionForm(
  type: 'approved' | 'missing' | 'rejected',
  detail: {
    id: number;
    expectedQuantity: number;
    rejectReason?: string | null;
  },
  copy: {
    quickApproveNote: string;
    quickMissingNote: string;
    quickRejectReason: string;
    quickRejectNote: string;
  },
): SaveSteelGoodReciptAcceptanseInspectionDto {
  if (type === 'approved') {
    return {
      lineId: detail.id,
      isArrived: true,
      isApproved: true,
      arrivedQuantity: detail.expectedQuantity,
      approvedQuantity: detail.expectedQuantity,
      rejectedQuantity: 0,
      rejectReason: '',
      note: copy.quickApproveNote,
    };
  }

  if (type === 'missing') {
    return {
      lineId: detail.id,
      isArrived: false,
      isApproved: false,
      arrivedQuantity: 0,
      approvedQuantity: 0,
      rejectedQuantity: 0,
      rejectReason: '',
      note: copy.quickMissingNote,
    };
  }

  return {
    lineId: detail.id,
    isArrived: true,
    isApproved: false,
    arrivedQuantity: detail.expectedQuantity,
    approvedQuantity: 0,
    rejectedQuantity: detail.expectedQuantity,
    rejectReason: detail.rejectReason || copy.quickRejectReason,
    note: copy.quickRejectNote,
  };
}

export interface InspectionFormState extends SaveSteelGoodReciptAcceptanseInspectionDto {}

export type InspectionBatch = SteelGoodReciptAcceptanseInspectionBatchSearchDto;
export type InspectionLine = SteelGoodReciptAcceptanseLineListItemDto;
