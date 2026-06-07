import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import i18n from '@/lib/i18n';

export const serviceCaseStatusOptions = [
  { value: '0', labelKey: 'serviceAllocation.enum.serviceCaseStatus.0' },
  { value: '1', labelKey: 'serviceAllocation.enum.serviceCaseStatus.1' },
  { value: '2', labelKey: 'serviceAllocation.enum.serviceCaseStatus.2' },
  { value: '3', labelKey: 'serviceAllocation.enum.serviceCaseStatus.3' },
  { value: '4', labelKey: 'serviceAllocation.enum.serviceCaseStatus.4' },
  { value: '5', labelKey: 'serviceAllocation.enum.serviceCaseStatus.5' },
  { value: '6', labelKey: 'serviceAllocation.enum.serviceCaseStatus.6' },
  { value: '7', labelKey: 'serviceAllocation.enum.serviceCaseStatus.7' },
  { value: '8', labelKey: 'serviceAllocation.enum.serviceCaseStatus.8' },
  { value: '9', labelKey: 'serviceAllocation.enum.serviceCaseStatus.9' },
] as const;

export const serviceCaseLineTypeOptions = [
  { value: '0', labelKey: 'serviceAllocation.enum.serviceCaseLineType.0' },
  { value: '1', labelKey: 'serviceAllocation.enum.serviceCaseLineType.1' },
  { value: '2', labelKey: 'serviceAllocation.enum.serviceCaseLineType.2' },
  { value: '3', labelKey: 'serviceAllocation.enum.serviceCaseLineType.3' },
] as const;

export const serviceProcessTypeOptions = [
  { value: '0', labelKey: 'serviceAllocation.enum.serviceProcessType.0' },
  { value: '1', labelKey: 'serviceAllocation.enum.serviceProcessType.1' },
  { value: '2', labelKey: 'serviceAllocation.enum.serviceProcessType.2' },
  { value: '3', labelKey: 'serviceAllocation.enum.serviceProcessType.3' },
] as const;

function coerceNumber(value: string | number | undefined | null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function normalizeKey(value: string | number | undefined | null): string {
  return String(value ?? '').trim().toLowerCase();
}

function badge(className: string, label: string): ReactElement {
  return <Badge className={className}>{label}</Badge>;
}

function tt(key: string): string {
  return i18n.t(key, { ns: 'service-allocation' });
}

export function renderServiceCaseStatus(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
        return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', tt('serviceAllocation.enum.serviceCaseStatus.0'));
    case 1:
      return badge('bg-zinc-100 text-zinc-700 hover:bg-zinc-100', tt('serviceAllocation.enum.serviceCaseStatus.1'));
    case 2:
      return badge('bg-sky-100 text-sky-700 hover:bg-sky-100', tt('serviceAllocation.enum.serviceCaseStatus.2'));
    case 3:
      return badge('bg-indigo-100 text-indigo-700 hover:bg-indigo-100', tt('serviceAllocation.enum.serviceCaseStatus.3'));
    case 4:
      return badge('bg-amber-100 text-amber-800 hover:bg-amber-100', tt('serviceAllocation.enum.serviceCaseStatus.4'));
    case 5:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', tt('serviceAllocation.enum.serviceCaseStatus.5'));
    case 6:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', tt('serviceAllocation.enum.serviceCaseStatus.6'));
    case 7:
      return badge('bg-teal-100 text-teal-800 hover:bg-teal-100', tt('serviceAllocation.enum.serviceCaseStatus.7'));
    case 8:
      return badge('bg-green-100 text-green-800 hover:bg-green-100', tt('serviceAllocation.enum.serviceCaseStatus.8'));
    case 9:
      return badge('bg-rose-100 text-rose-800 hover:bg-rose-100', tt('serviceAllocation.enum.serviceCaseStatus.9'));
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}

export function renderAllocationStatus(value: string | number | undefined | null): ReactElement {
  const key = normalizeKey(value);
  const numeric = coerceNumber(value);
    if (key.includes('partial') || numeric === 3) return badge('bg-amber-100 text-amber-800 hover:bg-amber-100', tt('serviceAllocation.enum.allocationStatus.3'));
    if (key.includes('allocated') || numeric === 2) return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', tt('serviceAllocation.enum.allocationStatus.2'));
    if (key.includes('waiting') || numeric === 0) return badge('bg-zinc-100 text-zinc-700 hover:bg-zinc-100', tt('serviceAllocation.enum.allocationStatus.0'));
    if (key.includes('shipped') || numeric === 4) return badge('bg-green-100 text-green-800 hover:bg-green-100', tt('serviceAllocation.enum.allocationStatus.4'));
    if (key.includes('cancel') || numeric === 5) return badge('bg-rose-100 text-rose-800 hover:bg-rose-100', tt('serviceAllocation.enum.allocationStatus.5'));
    if (key.includes('block') || numeric === 1) return badge('bg-slate-200 text-slate-800 hover:bg-slate-200', tt('serviceAllocation.enum.allocationStatus.1'));
  return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
}

export function renderServiceCaseLineType(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', tt('serviceAllocation.enum.serviceCaseLineType.0'));
    case 1:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', tt('serviceAllocation.enum.serviceCaseLineType.1'));
    case 2:
      return badge('bg-violet-100 text-violet-800 hover:bg-violet-100', tt('serviceAllocation.enum.serviceCaseLineType.2'));
    case 3:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', tt('serviceAllocation.enum.serviceCaseLineType.3'));
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}

export function renderServiceProcessType(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', tt('serviceAllocation.enum.serviceProcessType.0'));
    case 1:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', tt('serviceAllocation.enum.serviceProcessType.1'));
    case 2:
      return badge('bg-indigo-100 text-indigo-800 hover:bg-indigo-100', tt('serviceAllocation.enum.serviceProcessType.2'));
    case 3:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', tt('serviceAllocation.enum.serviceProcessType.3'));
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}

export function renderDocumentModule(value: string | number | undefined | null): ReactElement {
  const key = normalizeKey(value).toUpperCase();
  const label = key || String(value ?? '-');
  const colorMap: Record<string, string> = {
    WI: 'bg-sky-100 text-sky-700 hover:bg-sky-100',
    WT: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
    WO: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    SH: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    SIT: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    SRT: 'bg-teal-100 text-teal-800 hover:bg-teal-100',
  };
  return badge(colorMap[label] ?? 'bg-slate-100 text-slate-700 hover:bg-slate-100', label);
}

export function renderDocumentLinkPurpose(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
      return badge('bg-sky-100 text-sky-700 hover:bg-sky-100', tt('serviceAllocation.enum.documentLinkPurpose.0'));
    case 1:
      return badge('bg-indigo-100 text-indigo-700 hover:bg-indigo-100', tt('serviceAllocation.enum.documentLinkPurpose.1'));
    case 2:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', tt('serviceAllocation.enum.documentLinkPurpose.2'));
    case 3:
      return badge('bg-orange-100 text-orange-800 hover:bg-orange-100', tt('serviceAllocation.enum.documentLinkPurpose.3'));
    case 4:
      return badge('bg-teal-100 text-teal-800 hover:bg-teal-100', tt('serviceAllocation.enum.documentLinkPurpose.4'));
    case 5:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', tt('serviceAllocation.enum.documentLinkPurpose.5'));
    case 6:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', tt('serviceAllocation.enum.documentLinkPurpose.6'));
    case 7:
      return badge('bg-violet-100 text-violet-800 hover:bg-violet-100', tt('serviceAllocation.enum.documentLinkPurpose.7'));
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}
