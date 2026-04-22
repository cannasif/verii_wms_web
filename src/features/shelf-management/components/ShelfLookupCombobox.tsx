import { type ReactElement, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Combobox } from '@/components/ui/combobox';
import { lookupApi } from '@/services/lookup-api';
import { shelfManagementApi } from '../api/shelf-management.api';

interface ShelfLookupComboboxProps {
  warehouseCode?: string | number | null;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  includeInactive?: boolean;
}

export function ShelfLookupCombobox({
  warehouseCode,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  includeInactive = false,
}: ShelfLookupComboboxProps): ReactElement {
  const normalizedWarehouseCode = typeof warehouseCode === 'string'
    ? Number(warehouseCode)
    : warehouseCode;

  const warehouseQuery = useQuery({
    queryKey: ['shelf-lookup-warehouse', normalizedWarehouseCode],
    queryFn: async ({ signal }) => {
      if (!normalizedWarehouseCode || Number.isNaN(normalizedWarehouseCode)) {
        return null;
      }

      const warehouses = await lookupApi.getWarehouses(normalizedWarehouseCode, { signal });
      return warehouses[0] ?? null;
    },
    enabled: !!normalizedWarehouseCode && !Number.isNaN(normalizedWarehouseCode),
  });

  const shelvesQuery = useQuery({
    queryKey: ['shelf-lookup', warehouseQuery.data?.id, includeInactive],
    queryFn: ({ signal }) => shelfManagementApi.getLookup(warehouseQuery.data!.id, includeInactive, { signal }),
    enabled: !!warehouseQuery.data?.id,
  });

  const options = useMemo(() => {
    return (shelvesQuery.data?.data ?? []).map((item) => ({
      value: item.code,
      label: `${item.code} · ${item.name}`,
    }));
  }, [shelvesQuery.data?.data]);

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      disabled={disabled || !warehouseQuery.data?.id}
    />
  );
}
