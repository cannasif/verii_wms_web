export const documentSeriesOperationTypes = ['WI', 'WO', 'WT', 'SH', 'SIT', 'SRT', 'PR', 'PT', 'QRETURN', 'QREJECT'] as const;
export const documentSeriesDocumentFlows = ['INTERNAL', 'NETSIS_OUTBOUND', 'EDISPATCH'] as const;
export const documentSeriesYearModes = ['NONE', 'YEAR2', 'YEAR4'] as const;

export function buildWarehouseLabel(code?: string | number | null, name?: string | null): string {
  const pieces = [code != null ? String(code) : '', name ?? ''].filter(Boolean);
  return pieces.join(' - ');
}

export function buildCustomerLabel(code?: string | null, name?: string | null): string {
  return [code ?? '', name ?? ''].filter(Boolean).join(' - ');
}

export function buildDefinitionLabel(code?: string | null, name?: string | null): string {
  return [code ?? '', name ?? ''].filter(Boolean).join(' - ');
}
