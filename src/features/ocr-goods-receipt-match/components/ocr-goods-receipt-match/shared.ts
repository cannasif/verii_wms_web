export function buildCustomerLabel(code?: string | null, name?: string | null): string | null {
  return [code, name].filter(Boolean).join(' - ') || null;
}

export function buildStockLabel(code?: string | null, name?: string | null): string | null {
  return [code, name].filter(Boolean).join(' - ') || null;
}
