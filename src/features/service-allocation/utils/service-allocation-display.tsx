import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';

export const serviceCaseStatusOptions = [
  { value: '0', label: 'Draft' },
  { value: '1', label: 'Waiting For Intake' },
  { value: '2', label: 'Received' },
  { value: '3', label: 'In Diagnosis' },
  { value: '4', label: 'Waiting For Parts' },
  { value: '5', label: 'In Repair' },
  { value: '6', label: 'Ready For Return' },
  { value: '7', label: 'Returned To Main Warehouse' },
  { value: '8', label: 'Closed' },
  { value: '9', label: 'Cancelled' },
] as const;

export const serviceCaseLineTypeOptions = [
  { value: '0', label: 'Incoming Product' },
  { value: '1', label: 'Spare Part' },
  { value: '2', label: 'Labor' },
  { value: '3', label: 'Replacement Product' },
] as const;

export const serviceProcessTypeOptions = [
  { value: '0', label: 'Normal Sales Order' },
  { value: '1', label: 'Service Repair' },
  { value: '2', label: 'Spare Part Supply' },
  { value: '3', label: 'Repair Return' },
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

export function renderServiceCaseStatus(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', 'Draft');
    case 1:
      return badge('bg-zinc-100 text-zinc-700 hover:bg-zinc-100', 'Waiting For Intake');
    case 2:
      return badge('bg-sky-100 text-sky-700 hover:bg-sky-100', 'Received');
    case 3:
      return badge('bg-indigo-100 text-indigo-700 hover:bg-indigo-100', 'In Diagnosis');
    case 4:
      return badge('bg-amber-100 text-amber-800 hover:bg-amber-100', 'Waiting For Parts');
    case 5:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', 'In Repair');
    case 6:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', 'Ready For Return');
    case 7:
      return badge('bg-teal-100 text-teal-800 hover:bg-teal-100', 'Returned To Main Warehouse');
    case 8:
      return badge('bg-green-100 text-green-800 hover:bg-green-100', 'Closed');
    case 9:
      return badge('bg-rose-100 text-rose-800 hover:bg-rose-100', 'Cancelled');
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}

export function renderAllocationStatus(value: string | number | undefined | null): ReactElement {
  const key = normalizeKey(value);
  const numeric = coerceNumber(value);
  if (key.includes('partial') || numeric === 3) return badge('bg-amber-100 text-amber-800 hover:bg-amber-100', 'Partially Allocated');
  if (key.includes('allocated') || numeric === 2) return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', 'Allocated');
  if (key.includes('waiting') || numeric === 0) return badge('bg-zinc-100 text-zinc-700 hover:bg-zinc-100', 'Waiting');
  if (key.includes('shipped') || numeric === 4) return badge('bg-green-100 text-green-800 hover:bg-green-100', 'Shipped');
  if (key.includes('cancel') || numeric === 5) return badge('bg-rose-100 text-rose-800 hover:bg-rose-100', 'Cancelled');
  if (key.includes('block') || numeric === 1) return badge('bg-slate-200 text-slate-800 hover:bg-slate-200', 'Blocked');
  return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
}

export function renderServiceCaseLineType(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', 'Incoming Product');
    case 1:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', 'Spare Part');
    case 2:
      return badge('bg-violet-100 text-violet-800 hover:bg-violet-100', 'Labor');
    case 3:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', 'Replacement Product');
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}

export function renderServiceProcessType(value: string | number | undefined | null): ReactElement {
  const numeric = coerceNumber(value);
  switch (numeric) {
    case 0:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', 'Normal Sales Order');
    case 1:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', 'Service Repair');
    case 2:
      return badge('bg-indigo-100 text-indigo-800 hover:bg-indigo-100', 'Spare Part Supply');
    case 3:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', 'Repair Return');
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
      return badge('bg-sky-100 text-sky-700 hover:bg-sky-100', 'Intake');
    case 1:
      return badge('bg-indigo-100 text-indigo-700 hover:bg-indigo-100', 'Internal Transfer');
    case 2:
      return badge('bg-blue-100 text-blue-800 hover:bg-blue-100', 'Spare Part Supply');
    case 3:
      return badge('bg-orange-100 text-orange-800 hover:bg-orange-100', 'Repair Operation');
    case 4:
      return badge('bg-teal-100 text-teal-800 hover:bg-teal-100', 'Return To Main Warehouse');
    case 5:
      return badge('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', 'Shipment');
    case 6:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', 'Allocation Source');
    case 7:
      return badge('bg-violet-100 text-violet-800 hover:bg-violet-100', 'Allocation Result');
    default:
      return badge('bg-slate-100 text-slate-700 hover:bg-slate-100', String(value ?? '-'));
  }
}
