import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { OpsFieldShell, OpsFormMessage, PagedLookupDialog } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { cn } from '@/lib/utils';
import { documentSeriesManagementApi } from '../api/document-series-management.api';
import type {
  WmsDocumentSeriesDefinitionPagedRowDto,
} from '../types/document-series-management.types';
import { useAuthStore } from '@/stores/auth-store';

type OperationDocumentSeriesFormValues = {
  documentNo: string;
  documentSeriesDefinitionId?: number;
  requiresEDispatch?: boolean;
};

interface OperationDocumentSeriesSelectorProps {
  operationType: string;
  warehouseId?: number;
  customerId?: number;
  disabled?: boolean;
  variant?: 'default' | 'ops';
}

function buildDefinitionPreview(definition: WmsDocumentSeriesDefinitionPagedRowDto): string {
  const now = new Date();
  const yearPart = definition.yearMode === 'YEAR2'
    ? now.getFullYear().toString().slice(-2)
    : definition.yearMode === 'YEAR4'
      ? now.getFullYear().toString()
      : '';

  const numberPart = String(definition.currentNumber).padStart(definition.numberLength, '0');
  return `${definition.seriesPrefix}${yearPart}${numberPart}`;
}

function buildDefinitionLabel(definition: Pick<WmsDocumentSeriesDefinitionPagedRowDto, 'code' | 'name' | 'seriesPrefix'>): string {
  return `${definition.code} - ${definition.name} (${definition.seriesPrefix})`;
}

function buildMatchLabel(t: (key: string, options?: Record<string, unknown>) => string, match: string | undefined): string {
  switch (match) {
    case 'UserPreference':
      return t('documentSeries.matchTypes.userPreference');
    case 'Rule':
      return t('documentSeries.matchTypes.rule');
    case 'DefaultDefinition':
      return t('documentSeries.matchTypes.defaultDefinition');
    default:
      return t('documentSeries.matchTypes.unknown');
  }
}

export function OperationDocumentSeriesSelector({
  operationType,
  warehouseId,
  customerId,
  disabled = false,
  variant = 'default',
}: OperationDocumentSeriesSelectorProps): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext<OperationDocumentSeriesFormValues>();
  const isOps = variant === 'ops';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [lastAutoDocumentNo, setLastAutoDocumentNo] = useState('');
  const [manualSelection, setManualSelection] = useState(false);

  const branchCode = useAuthStore((state) => state.branch?.code?.trim() || '0');
  const userId = useAuthStore((state) => state.user?.id);

  const resolveKey = useMemo(
    () => [operationType, branchCode, userId ?? null, warehouseId ?? null, customerId ?? null].join('|'),
    [branchCode, customerId, operationType, userId, warehouseId],
  );

  useEffect(() => {
    setManualSelection(false);
  }, [resolveKey]);

  const resolutionQuery = useQuery({
    queryKey: ['document-series', 'resolve', operationType, branchCode, userId, warehouseId, customerId],
    queryFn: () =>
      documentSeriesManagementApi.resolve({
        operationType,
        branchCode,
        warehouseId,
        customerId,
        userId,
        requiresEDispatch: false,
      }),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    const resolved = resolutionQuery.data;
    if (!resolved || manualSelection) {
      return;
    }

    const currentSeriesId = form.getValues('documentSeriesDefinitionId');
    if (currentSeriesId !== resolved.documentSeriesDefinitionId) {
      form.setValue('documentSeriesDefinitionId', resolved.documentSeriesDefinitionId, { shouldDirty: false });
    }

    const currentRequiresEDispatch = form.getValues('requiresEDispatch');
    if (currentRequiresEDispatch !== resolved.isEDispatchSeries) {
      form.setValue('requiresEDispatch', resolved.isEDispatchSeries, { shouldDirty: false });
    }

    const nextLabel = `${resolved.code} - ${resolved.name} (${resolved.seriesPrefix})`;
    setSelectedLabel((current) => (current === nextLabel ? current : nextLabel));

    const autoDocumentNo = resolved.previewDocumentNo;
    const existingDocumentNo = form.getValues('documentNo');

    if (!existingDocumentNo || existingDocumentNo === lastAutoDocumentNo) {
      if (existingDocumentNo !== autoDocumentNo) {
        form.setValue('documentNo', autoDocumentNo, { shouldDirty: false, shouldValidate: true });
      }
      if (lastAutoDocumentNo !== autoDocumentNo) {
        setLastAutoDocumentNo(autoDocumentNo);
      }
    }
  }, [form, lastAutoDocumentNo, manualSelection, resolutionQuery.data]);

  const resolutionMeta = resolutionQuery.data;
  const resolutionText = resolutionMeta
    ? `${buildMatchLabel(t, resolutionMeta.matchedBy)}: ${resolutionMeta.previewDocumentNo}`
    : resolutionQuery.isError
      ? t('documentSeries.messages.resolveFallback')
      : t('documentSeries.messages.resolvePending');

  const lookupDialog = (
    <PagedLookupDialog<WmsDocumentSeriesDefinitionPagedRowDto>
      variant={isOps ? 'ops' : 'default'}
      open={lookupOpen}
      onOpenChange={setLookupOpen}
      title={t('documentSeries.fields.selection')}
      description={isOps ? undefined : t('documentSeries.messages.selectorHelp')}
      value={selectedLabel}
      placeholder={t('documentSeries.placeholders.definition')}
      searchPlaceholder={t('documentSeries.searchPlaceholder')}
      emptyText={t('documentSeries.definitions.empty')}
      disabled={disabled}
      triggerClassName={isOps ? OPS_FIELD_CLASS : undefined}
      queryKey={['document-series', 'definitions', operationType]}
      fetchPage={async ({ search }) => {
        const response = await documentSeriesManagementApi.getDefinitionsPaged({
          pageNumber: 1,
          pageSize: 200,
          search,
        });

        const filtered = (response.data ?? []).filter(
          (item) => item.operationType === operationType && item.isActive,
        );

        return {
          ...response,
          data: filtered,
          totalCount: filtered.length,
          pageNumber: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        };
      }}
      getKey={(item) => item.id.toString()}
      getLabel={buildDefinitionLabel}
      onSelect={(definition) => {
        const preview = buildDefinitionPreview(definition);
        setManualSelection(true);
        setSelectedLabel(buildDefinitionLabel(definition));
        form.setValue('documentSeriesDefinitionId', definition.id, { shouldDirty: true, shouldValidate: true });
        form.setValue('requiresEDispatch', definition.isEDispatchSeries, { shouldDirty: true });
        form.setValue('documentNo', preview, { shouldDirty: true, shouldValidate: true });
        setLastAutoDocumentNo(preview);
      }}
    />
  );

  return (
    <FormField
      control={form.control}
      name="documentSeriesDefinitionId"
      render={() => (
        <FormItem className={formItemClass}>
          <div className="flex items-center gap-2">
            <FormLabel>{t('documentSeries.fields.selection')}</FormLabel>
            {resolutionMeta ? (
              <Badge
                variant="outline"
                className={cn('text-[11px]', isOps && 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200')}
              >
                {buildMatchLabel(t, resolutionMeta.matchedBy)}
              </Badge>
            ) : null}
          </div>
          <FormControl>
            {isOps ? (
              <OpsFieldShell className={lookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                {lookupDialog}
              </OpsFieldShell>
            ) : (
              lookupDialog
            )}
          </FormControl>
          <FormDescription className={isOps ? 'wms-ops-notes-hint' : undefined}>
            {resolutionText}
          </FormDescription>
          {fieldMessage}
        </FormItem>
      )}
    />
  );
}
