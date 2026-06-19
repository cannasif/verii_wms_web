import { type ReactElement, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ArrowDown, ArrowUp, Columns3, Eye, EyeOff } from 'lucide-react';

import { OpsActionButton } from './OpsActionButton';

import type { DataTableVariant } from './DataTableActionBar';

import { saveColumnPreferences, pinLeadingLockedKeys } from '@/lib/column-preferences';

import { cn } from '@/lib/utils';



export interface ColumnDef {

  key: string;

  label: string;

}



interface ColumnPreferencesPopoverProps {

  pageKey: string;

  userId?: number;

  columns: ColumnDef[];

  visibleColumns: string[];

  columnOrder: string[];

  lockedKeys?: string[];
  excludedKeys?: string[];
  onVisibleColumnsChange: (visible: string[]) => void;

  onColumnOrderChange: (order: string[]) => void;

  variant?: DataTableVariant;

}



export function ColumnPreferencesPopover({

  pageKey,

  userId,

  columns,

  visibleColumns,

  columnOrder,

  lockedKeys = ['id'],
  excludedKeys = ['actions'],
  onVisibleColumnsChange,

  onColumnOrderChange,

  variant = 'default',

}: ColumnPreferencesPopoverProps): ReactElement {

  const { t } = useTranslation();

  const isOps = variant === 'ops';

  const [open, setOpen] = useState(false);

  const lockedSet = useMemo(() => new Set(lockedKeys), [lockedKeys]);
  const excludedSet = useMemo(() => new Set(excludedKeys), [excludedKeys]);

  const columnMap = useMemo(
    () => new Map(columns.filter((column) => !excludedSet.has(column.key)).map((column) => [column.key, column])),
    [columns, excludedSet],
  );

  const manageableOrder = useMemo(
    () => columnOrder.filter((key) => !excludedSet.has(key)),
    [columnOrder, excludedSet],
  );
  const manageableVisible = useMemo(
    () => visibleColumns.filter((key) => !excludedSet.has(key)),
    [visibleColumns, excludedSet],
  );

  const displayColumns = manageableOrder.filter((key) => manageableVisible.includes(key));
  const hiddenColumns = manageableOrder.filter((key) => !manageableVisible.includes(key));

  const firstMovableIndex = useMemo(() => {
    const index = displayColumns.findIndex((key) => !lockedSet.has(key));
    return index < 0 ? displayColumns.length : index;
  }, [displayColumns, lockedSet]);

  const finalizeOrder = (order: string[]): string[] => pinLeadingLockedKeys(order, lockedKeys);

  const persist = (nextOrder: string[], nextVisible: string[]): void => {
    const pinnedOrder = finalizeOrder(nextOrder);
    saveColumnPreferences(pageKey, userId, {
      order: pinnedOrder,
      visibleKeys: nextVisible,
    });
  };



  const toggleColumn = (key: string): void => {
    if (lockedSet.has(key) || excludedSet.has(key)) return;

    const nextVisible = manageableVisible.includes(key)
      ? manageableVisible.filter((columnKey) => columnKey !== key)
      : [...manageableVisible, key].sort((a, b) => manageableOrder.indexOf(a) - manageableOrder.indexOf(b));

    onVisibleColumnsChange(nextVisible);
    persist(finalizeOrder(manageableOrder), nextVisible);
  };

  const moveColumn = (key: string, direction: 'up' | 'down'): void => {
    if (lockedSet.has(key) || excludedSet.has(key)) return;

    const visibleOrdered = manageableOrder.filter((columnKey) => manageableVisible.includes(columnKey));
    const idx = visibleOrdered.indexOf(key);
    if (idx < 0) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= visibleOrdered.length) return;
    if (direction === 'up' && newIdx < firstMovableIndex) return;

    const nextVisibleOrdered = [...visibleOrdered];
    [nextVisibleOrdered[idx], nextVisibleOrdered[newIdx]] = [
      nextVisibleOrdered[newIdx],
      nextVisibleOrdered[idx],
    ];

    const hidden = manageableOrder.filter((columnKey) => !manageableVisible.includes(columnKey));
    const nextOrder = finalizeOrder([...nextVisibleOrdered, ...hidden]);

    onColumnOrderChange(nextOrder);
    onVisibleColumnsChange(nextVisibleOrdered);
    persist(nextOrder, nextVisibleOrdered);
  };



  const renderMoveButtons = (key: string, idx: number, isLocked: boolean): ReactElement | null => {
    if (isLocked) return null;

    if (isOps) {
      return (
        <>
          <button
            type="button"
            className="wms-ops-list-popover__icon-btn wms-ops-list-popover__icon-btn--move"
            onClick={() => moveColumn(key, 'up')}
            disabled={idx <= firstMovableIndex}
            aria-label={t('common.moveUp', { defaultValue: 'Up' })}
          >
            <ArrowUp className="size-3" aria-hidden />
          </button>
          <button
            type="button"
            className="wms-ops-list-popover__icon-btn wms-ops-list-popover__icon-btn--move"
            onClick={() => moveColumn(key, 'down')}
            disabled={idx >= displayColumns.length - 1}
            aria-label={t('common.moveDown', { defaultValue: 'Down' })}
          >
            <ArrowDown className="size-3" aria-hidden />
          </button>
        </>
      );
    }



    return (

      <>

        <Button

          variant="ghost"

          size="icon"

          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"

          onClick={() => moveColumn(key, 'up')}

          disabled={idx <= firstMovableIndex}

        >

          <ArrowUp className="h-3.5 w-3.5" />

        </Button>

        <Button

          variant="ghost"

          size="icon"

          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"

          onClick={() => moveColumn(key, 'down')}

          disabled={idx >= displayColumns.length - 1}

        >

          <ArrowDown className="h-3.5 w-3.5" />

        </Button>

      </>

    );

  };



  const renderHideButton = (key: string): ReactElement => {

    if (isOps) {

      return (

        <button

          type="button"

          className="wms-ops-list-popover__icon-btn wms-ops-list-popover__icon-btn--danger shrink-0"

          onClick={() => toggleColumn(key)}

          title={t('common.hide')}

          aria-label={t('common.hide')}

        >

          <EyeOff className="size-3" aria-hidden />

        </button>

      );

    }



    return (

      <Button

        variant="ghost"

        size="icon"

        className="h-6 w-6 shrink-0 text-slate-400 hover:text-destructive"

        onClick={() => toggleColumn(key)}

        title={t('common.hide')}

      >

        <EyeOff className="h-3.5 w-3.5" />

      </Button>

    );

  };



  const renderShowButton = (key: string): ReactElement => {

    if (isOps) {

      return (

        <button

          type="button"

          className="wms-ops-list-popover__icon-btn shrink-0"

          onClick={() => toggleColumn(key)}

          title={t('common.show')}

          aria-label={t('common.show')}

        >

          <Eye className="size-3" aria-hidden />

        </button>

      );

    }



    return (

      <Button

        variant="ghost"

        size="icon"

        className="h-6 w-6 shrink-0"

        onClick={() => toggleColumn(key)}

        title={t('common.show')}

      >

        <Eye className="h-3.5 w-3.5" />

      </Button>

    );

  };



  return (

    <Popover open={open} onOpenChange={setOpen}>

      <PopoverTrigger asChild>

        {isOps ? (

          <OpsActionButton type="button" variant="secondary" className="wms-ops-list-toolbar-btn">

            <Columns3 className="size-3.5" aria-hidden />

            {t('common.columns')}

          </OpsActionButton>

        ) : (

          <Button

            variant="outline"

            size="sm"

            className="h-9 border-dashed border-slate-300 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm"

          >

            <Columns3 className="mr-2 h-4 w-4" />

            {t('common.columns')}

          </Button>

        )}

      </PopoverTrigger>

      <PopoverContent

        align="end"

        className={cn(

          isOps

            ? 'wms-ops-list-popover wms-ops-list-popover--columns w-80 p-0 border-0 shadow-none'

            : 'w-72 p-0 bg-white/95 dark:bg-[#1a1025]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl rounded-xl z-50',

        )}

      >

        {isOps ? (

          <div className="p-2 space-y-1">

            <div className="wms-ops-list-popover__section-title">{t('common.visibleColumns')}</div>

            <div className="wms-ops-list-popover__scroll space-y-0.5">

              {displayColumns.map((key) => {

                const col = columnMap.get(key);

                if (!col) return null;

                const isLocked = lockedSet.has(key);

                const idx = displayColumns.indexOf(key);



                return (
                  <div key={key} className="wms-ops-list-popover__row group">
                    <div className="wms-ops-list-popover__move-slot" aria-hidden={isLocked}>
                      {!isLocked ? renderMoveButtons(key, idx, isLocked) : null}
                    </div>
                    <span className="wms-ops-list-popover__row-label truncate">{col.label}</span>
                    {!isLocked ? renderHideButton(key) : <span className="wms-ops-list-popover__action-spacer" aria-hidden />}
                  </div>
                );

              })}

            </div>

            {hiddenColumns.length > 0 ? (

              <>

                <div className="wms-ops-list-popover__divider" />

                <div className="wms-ops-list-popover__section-title">{t('common.hiddenColumns')}</div>

                <div className="space-y-0.5">

                  {hiddenColumns.map((key) => {

                    const col = columnMap.get(key);

                    if (!col) return null;



                    return (
                      <div key={key} className="wms-ops-list-popover__row">
                        <span className="wms-ops-list-popover__move-slot" aria-hidden />
                        <span className="wms-ops-list-popover__row-label wms-ops-list-popover__row-label--muted truncate">
                          {col.label}
                        </span>
                        {renderShowButton(key)}
                      </div>
                    );

                  })}

                </div>

              </>

            ) : null}

          </div>

        ) : (

          <div className="p-2 space-y-2">

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1.5">

              {t('common.visibleColumns')}

            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">

              {displayColumns.map((key) => {

                const col = columnMap.get(key);

                if (!col) return null;

                const isLocked = lockedSet.has(key);

                const idx = displayColumns.indexOf(key);



                return (

                  <div

                    key={key}

                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 group"

                  >

                    <div className="flex items-center gap-1 flex-1 min-w-0">

                      {renderMoveButtons(key, idx, isLocked)}

                      <span className="text-sm truncate">{col.label}</span>

                    </div>

                    {!isLocked ? renderHideButton(key) : null}

                  </div>

                );

              })}

            </div>

            {hiddenColumns.length > 0 && (

              <>

                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1.5 pt-2 border-t border-slate-100 dark:border-white/10">

                  {t('common.hiddenColumns')}

                </div>

                <div className="space-y-1">

                  {hiddenColumns.map((key) => {

                    const col = columnMap.get(key);

                    if (!col) return null;



                    return (

                      <div

                        key={key}

                        className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5"

                      >

                        <span className="text-sm text-slate-500 dark:text-slate-400 truncate">

                          {col.label}

                        </span>

                        {renderShowButton(key)}

                      </div>

                    );

                  })}

                </div>

              </>

            )}

          </div>

        )}

      </PopoverContent>

    </Popover>

  );

}


