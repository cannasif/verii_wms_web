import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FilterColumnConfig, FilterRow } from '@/lib/advanced-filter-types';
import { getDefaultOperatorForColumn, getOperatorsForColumn } from '@/lib/advanced-filter-types';

export interface AdvancedFilterProps {
  columns: readonly FilterColumnConfig[];
  defaultColumn: string;
  draftRows: FilterRow[];
  onDraftRowsChange: (rows: FilterRow[]) => void;
  onSearch: () => void;
  onClear: () => void;
  translationNamespace?: string;
  embedded?: boolean;
  appliedFilterCount?: number;
}

function generateId(): string {
  return `filter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdvancedFilter({
  columns,
  defaultColumn,
  draftRows,
  onDraftRowsChange,
  onSearch,
  onClear,
  translationNamespace = 'common',
  embedded = false,
  appliedFilterCount = 0,
}: AdvancedFilterProps): ReactElement {
  const { t } = useTranslation([translationNamespace, 'common']);

  const addRow = (): void => {
    onDraftRowsChange([
      ...draftRows,
      {
        id: generateId(),
        column: defaultColumn,
        operator: getDefaultOperatorForColumn(defaultColumn, columns),
        value: '',
      },
    ]);
  };

  const removeRow = (id: string): void => {
    onDraftRowsChange(draftRows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, patch: Partial<Omit<FilterRow, 'id'>>): void => {
    onDraftRowsChange(
      draftRows.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        if (patch.column !== undefined) {
          next.operator = getDefaultOperatorForColumn(patch.column, columns);
        }
        return next;
      })
    );
  };

  const getLabel = (key: string, fallback?: string): string => {
    const nsLabel = t(`advancedFilter.${key}`, { ns: translationNamespace });
    if (nsLabel && nsLabel !== `advancedFilter.${key}`) return nsLabel;
    const commonLabel = t(`advancedFilter.${key}`, { ns: 'common' });
    if (commonLabel && commonLabel !== `advancedFilter.${key}`) return commonLabel;
    return fallback ?? key;
  };

  return (
    <div className={embedded ? 'p-4 space-y-4' : 'rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-card/50 p-4 space-y-4'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {getLabel('title', 'Gelişmiş Filtre')}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" />
            {getLabel('add', 'Filtre Ekle')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            {getLabel('clear', 'Temizle')}
          </Button>
          <Button type="button" size="sm" onClick={onSearch}>
            <Search className="h-4 w-4 mr-1" />
            {getLabel('search', 'Ara')}
            {appliedFilterCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                {appliedFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>
      {appliedFilterCount > 0 && (
        <div className="rounded-md border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {getLabel('activeInfo', 'Filtre uygulandi')}: {appliedFilterCount}
        </div>
      )}
      {draftRows.length > 0 && (
        <div className="space-y-2">
          {draftRows.map((row) => {
            const config = columns.find((item) => item.value === row.column);
            const isDate = config?.type === 'date';
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-2">
                <Select value={row.column} onValueChange={(value) => updateRow(row.id, { column: value })}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder={getLabel('column', 'Alan')} />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.value} value={column.value}>
                        {t(column.labelKey, { ns: translationNamespace, defaultValue: column.value })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={row.operator} onValueChange={(value) => updateRow(row.id, { operator: value })}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder={getLabel('operator', 'Operator')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorsForColumn(row.column, columns).map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {t(`advancedFilter.operator${operator}`, { ns: 'common', defaultValue: operator })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {config?.type === 'boolean' ? (
                  <Select
                    value={row.value.toLowerCase() === 'true' ? 'true' : row.value.toLowerCase() === 'false' ? 'false' : '_none'}
                    onValueChange={(value) => updateRow(row.id, { value: value === '_none' ? '' : value })}
                  >
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <SelectValue placeholder={getLabel('value', 'Deger')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{getLabel('value', 'Deger')}</SelectItem>
                      <SelectItem value="true">{t('advancedFilter.true', { ns: 'common', defaultValue: 'True' })}</SelectItem>
                      <SelectItem value="false">{t('advancedFilter.false', { ns: 'common', defaultValue: 'False' })}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={isDate ? 'date' : 'text'}
                    placeholder={getLabel('value', 'Deger')}
                    value={row.value}
                    onChange={(event) => updateRow(row.id, { value: event.target.value })}
                    className="w-full sm:w-[170px]"
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-500 hover:text-destructive"
                  onClick={() => removeRow(row.id)}
                  aria-label={getLabel('remove', 'Sil')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
