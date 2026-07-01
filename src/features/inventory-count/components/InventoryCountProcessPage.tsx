import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsTextarea, PageState } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { InventoryCountHeader, InventoryCountLine } from '../types/inventory-count';
import {
  getInventoryCountModeLabel,
  getInventoryCountStatusLabel,
  InventoryCountOpsBadge,
  InventoryCountOpsCallout,
  InventoryCountOpsEmpty,
  InventoryCountOpsField,
  InventoryCountOpsLineCard,
  InventoryCountOpsSectionHeader,
  InventoryCountOpsStat,
  InventoryCountOpsStatGrid,
  inventoryCountStatusTone,
} from './inventory-count-ops-ui';

const EMPTY_LINES: InventoryCountLine[] = [];

function parseHeaderId(value: string | null): number | null {
  const parsed = Number(value ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeLineId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function dedupeLines(lines: InventoryCountLine[]): InventoryCountLine[] {
  const seen = new Set<number>();
  const unique: InventoryCountLine[] = [];

  for (const line of lines) {
    const lineId = normalizeLineId(line.id);
    if (lineId == null || seen.has(lineId)) {
      continue;
    }
    seen.add(lineId);
    unique.push(line);
  }

  return unique.sort((left, right) => left.sequenceNo - right.sequenceNo);
}

function buildHeaderLabel(header: InventoryCountHeader): string {
  return (header.documentNo || 'Belgesiz') + ' - ' + (header.countType || 'Sayim');
}

function buildLineLabel(line: InventoryCountLine): string {
  const location = [line.warehouseCode, line.rackCode, line.cellCode].filter(Boolean).join(' / ');
  return line.stockCode + (location ? ' - ' + location : '');
}

function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value ?? 0);
}

export function InventoryCountProcessPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const authUserId = useAuthStore((state) => state.user?.id);
  const canUpdate = permissionAccess.can('wms.inventory-count.update');
  const [searchParams, setSearchParams] = useSearchParams();
  const headerIdFromQuery = parseHeaderId(searchParams.get('headerId'));
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(headerIdFromQuery);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [headerLookupOpen, setHeaderLookupOpen] = useState(false);
  const [lineLookupOpen, setLineLookupOpen] = useState(false);
  const [selectedHeaderLabel, setSelectedHeaderLabel] = useState('');
  const [selectedLineLabel, setSelectedLineLabel] = useState('');
  const [enteredQuantity, setEnteredQuantity] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setPageTitle(t('inventoryCount.process.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const assignedHeadersQuery = useQuery({
    queryKey: ['inventory-count-process-assigned', authUserId],
    queryFn: () => inventoryCountApi.getAssignedHeadersPaged(authUserId || 0, { pageNumber: 1, pageSize: 100 }),
    enabled: Boolean(authUserId),
  });

  const allHeadersQuery = useQuery({
    queryKey: ['inventory-count-process-all'],
    queryFn: () => inventoryCountApi.getHeadersPaged({
      pageNumber: 1,
      pageSize: 100,
      filters: [{ column: 'Status', operator: 'neq', value: 'Completed' }],
    }),
  });

  const headerRows = useMemo(
    () => (assignedHeadersQuery.data?.data?.length ? assignedHeadersQuery.data.data : (allHeadersQuery.data?.data ?? [])),
    [allHeadersQuery.data?.data, assignedHeadersQuery.data?.data],
  );

  useEffect(() => {
    if (!selectedHeaderId && headerRows.length > 0) {
      setSelectedHeaderId(headerRows[0].id);
    }
  }, [headerRows, selectedHeaderId]);

  const selectedHeader = useMemo(
    () => headerRows.find((item) => item.id === selectedHeaderId) ?? null,
    [headerRows, selectedHeaderId],
  );

  useEffect(() => {
    if (headerIdFromQuery == null) {
      return;
    }
    setSelectedHeaderId((current) => (current === headerIdFromQuery ? current : headerIdFromQuery));
  }, [headerIdFromQuery]);

  const linesQuery = useQuery({
    queryKey: ['inventory-count-process-lines', selectedHeaderId],
    queryFn: () => inventoryCountApi.getLinesByHeader(selectedHeaderId || 0),
    enabled: Boolean(selectedHeaderId),
    staleTime: 30_000,
  });

  const lineRows = useMemo(
    () => (linesQuery.data ? dedupeLines(linesQuery.data) : EMPTY_LINES),
    [linesQuery.data],
  );

  useEffect(() => {
    if (!selectedHeaderId) {
      return;
    }
    const currentHeaderId = parseHeaderId(searchParams.get('headerId'));
    if (currentHeaderId === selectedHeaderId) {
      return;
    }
    setSearchParams({ headerId: String(selectedHeaderId) }, { replace: true });
  }, [searchParams, selectedHeaderId, setSearchParams]);

  useEffect(() => {
    if (lineRows.length === 0) {
      return;
    }

    const selectedId = normalizeLineId(selectedLineId);
    const hasSelectedLine = selectedId != null && lineRows.some((line) => normalizeLineId(line.id) === selectedId);

    if (!hasSelectedLine) {
      setSelectedLineId(normalizeLineId(lineRows[0]?.id));
    }
  }, [lineRows, selectedLineId]);

  const selectedLine = useMemo(() => {
    const selectedId = normalizeLineId(selectedLineId);
    if (selectedId == null) {
      return null;
    }
    return lineRows.find((item) => normalizeLineId(item.id) === selectedId) ?? null;
  }, [lineRows, selectedLineId]);

  useEffect(() => {
    if (selectedHeader) {
      setSelectedHeaderLabel(buildHeaderLabel(selectedHeader));
    }
  }, [selectedHeader]);

  useEffect(() => {
    if (selectedLine) {
      setSelectedLineLabel(buildLineLabel(selectedLine));
    }
  }, [selectedLine]);

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLine) {
        throw new Error(t('inventoryCount.process.errors.lineRequired'));
      }

      const quantity = Number(enteredQuantity);
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw new Error(t('inventoryCount.process.errors.quantityRequired'));
      }

      return await inventoryCountApi.addCountEntry({
        lineId: selectedLine.id,
        entryType: selectedLine.entryCount > 0 ? 'Recount' : 'FirstCount',
        enteredQuantity: quantity,
        warehouseCode: selectedLine.warehouseCode,
        rackCode: selectedLine.rackCode,
        cellCode: selectedLine.cellCode,
        note: note.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success(t('inventoryCount.process.success'));
      setEnteredQuantity('');
      setNote('');
      await linesQuery.refetch();
      await assignedHeadersQuery.refetch();
      await allHeadersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('inventoryCount.process.error'));
    },
  });

  const isBlindCount = selectedHeader?.countMode === 'Blind';
  const isLoading = assignedHeadersQuery.isLoading || allHeadersQuery.isLoading;
  const isError = Boolean(assignedHeadersQuery.error) || Boolean(allHeadersQuery.error);
  const errorMessage = (assignedHeadersQuery.error as Error)?.message || (allHeadersQuery.error as Error)?.message;

  if (isLoading) {
    return <PageState tone="loading" title={t('common.loading')} />;
  }

  if (isError) {
    return (
      <PageState
        tone="error"
        title={t('inventoryCount.process.loadErrorTitle')}
        description={errorMessage}
      />
    );
  }

  return (
    <OpsFormPageShell
      className="wms-ops-erp-skin wms-ops-inventory-count-page"
      eyebrow={t('sidebar.inventoryCount')}
      title={t('inventoryCount.process.title')}
      description={t('inventoryCount.process.description')}
    >
      <div className="wms-ops-inventory-count-content">
        {!canUpdate ? (
          <InventoryCountOpsCallout
            tone="warn"
            title={t('common.accessDeniedMessage')}
            body={t('inventoryCount.process.permissionInfo')}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <InventoryCountOpsSectionHeader
                  title={t('inventoryCount.process.pickHeaderTitle')}
                  description={t('inventoryCount.process.pickHeaderDescription')}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <InventoryCountOpsField label={t('inventoryCount.fields.header')}>
                  <PagedLookupDialog<InventoryCountHeader>
                    variant="ops"
                    open={headerLookupOpen}
                    onOpenChange={setHeaderLookupOpen}
                    title={t('inventoryCount.fields.header')}
                    description={t('inventoryCount.process.pickHeaderDescription')}
                    value={selectedHeaderLabel || (selectedHeaderId ? `#${selectedHeaderId}` : '')}
                    placeholder={t('inventoryCount.placeholders.selectHeader')}
                    searchPlaceholder={t('inventoryCount.placeholders.selectHeader')}
                    emptyText={t('inventoryCount.process.emptyHeaderMessage')}
                    queryKey={['inventory-count-process-header-lookup', authUserId || 'all']}
                    fetchPage={({ pageNumber, pageSize, search }) =>
                      authUserId
                        ? inventoryCountApi.getAssignedHeadersPaged(authUserId, { pageNumber, pageSize, search })
                        : inventoryCountApi.getHeadersPaged({
                            pageNumber,
                            pageSize,
                            search,
                            filters: [{ column: 'Status', operator: 'neq', value: 'Completed' }],
                          })
                    }
                    getKey={(header) => header.id.toString()}
                    getLabel={buildHeaderLabel}
                    onSelect={(header) => {
                      setSelectedHeaderId(header.id);
                      setSelectedHeaderLabel(buildHeaderLabel(header));
                      setSelectedLineId(null);
                      setSelectedLineLabel('');
                    }}
                  />
                </InventoryCountOpsField>

                {selectedHeader ? (
                  <InventoryCountOpsStatGrid columns={2}>
                    <InventoryCountOpsStat label={t('inventoryCount.fields.countType')} value={selectedHeader.countType || '-'} />
                    <InventoryCountOpsStat
                      label={t('inventoryCount.fields.countMode')}
                      value={getInventoryCountModeLabel(t, selectedHeader.countMode)}
                    />
                    <InventoryCountOpsStat label={t('inventoryCount.fields.lineCount')} value={selectedHeader.lineCount ?? 0} />
                    <InventoryCountOpsStat
                      label={t('inventoryCount.fields.status')}
                      value={(
                        <InventoryCountOpsBadge tone={inventoryCountStatusTone(selectedHeader.status)}>
                          {getInventoryCountStatusLabel(t, selectedHeader.status)}
                        </InventoryCountOpsBadge>
                      )}
                    />
                  </InventoryCountOpsStatGrid>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <InventoryCountOpsSectionHeader
                  title={t('inventoryCount.process.entryTitle')}
                  description={t('inventoryCount.process.entryDescription')}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <InventoryCountOpsField label={t('inventoryCount.fields.line')}>
                  <PagedLookupDialog<InventoryCountLine>
                    variant="ops"
                    open={lineLookupOpen}
                    onOpenChange={setLineLookupOpen}
                    title={t('inventoryCount.fields.line')}
                    description={selectedHeaderLabel || t('inventoryCount.fields.header')}
                    value={selectedLineLabel || (selectedLineId ? `#${selectedLineId}` : '')}
                    placeholder={t('inventoryCount.placeholders.selectLine')}
                    searchPlaceholder={t('inventoryCount.placeholders.selectLine')}
                    emptyText={t('inventoryCount.process.emptyLineMessage')}
                    disabled={!selectedHeaderId}
                    queryKey={['inventory-count-process-line-lookup', selectedHeaderId || 'none']}
                    fetchPage={({ pageNumber, pageSize, search }) =>
                      inventoryCountApi.getLinesByHeaderPaged(selectedHeaderId || 0, { pageNumber, pageSize, search })
                    }
                    getKey={(line) => line.id.toString()}
                    getLabel={buildLineLabel}
                    onSelect={(line) => {
                      setSelectedLineId(normalizeLineId(line.id));
                      setSelectedLineLabel(buildLineLabel(line));
                    }}
                  />
                </InventoryCountOpsField>

                {selectedLine ? (
                  <div className="wms-ops-inventory-count-line-detail">
                    <div className="wms-ops-inventory-count-line-detail__title">{selectedLine.stockCode}</div>
                    <div className="mt-1 text-muted-foreground">
                      {[selectedLine.warehouseCode, selectedLine.rackCode, selectedLine.cellCode].filter(Boolean).join(' / ') || t('inventoryCount.process.noLocation', { defaultValue: 'Konum bilgisi yok' })}
                    </div>
                    <div className="mt-3">
                      <InventoryCountOpsStatGrid columns={3}>
                        <InventoryCountOpsStat
                          label={t('inventoryCount.fields.expectedQuantity')}
                          value={isBlindCount ? '-' : formatNumber(selectedLine.expectedQuantity)}
                        />
                        <InventoryCountOpsStat
                          label={t('inventoryCount.fields.lastCountedQuantity')}
                          value={formatNumber(selectedLine.countedQuantity)}
                        />
                        <InventoryCountOpsStat label={t('inventoryCount.fields.unit')} value={selectedLine.unit || '-'} />
                      </InventoryCountOpsStatGrid>
                    </div>
                  </div>
                ) : (
                  <InventoryCountOpsEmpty>{t('inventoryCount.process.emptyLineMessage')}</InventoryCountOpsEmpty>
                )}

                <InventoryCountOpsField label={t('inventoryCount.fields.enteredQuantity')}>
                  <OpsInput
                    type="number"
                    min="0"
                    step="0.001"
                    value={enteredQuantity}
                    onChange={(event) => setEnteredQuantity(event.target.value)}
                    placeholder={t('inventoryCount.placeholders.enterQuantity')}
                    disabled={!selectedLine || !canUpdate}
                  />
                </InventoryCountOpsField>

                <InventoryCountOpsField label={t('common.note')}>
                  <OpsTextarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    placeholder={t('inventoryCount.placeholders.enterNote')}
                    disabled={!selectedLine || !canUpdate}
                  />
                </InventoryCountOpsField>

                <OpsActionButton
                  type="button"
                  variant="primary"
                  onClick={() => saveEntryMutation.mutate()}
                  disabled={!selectedLine || !canUpdate || saveEntryMutation.isPending}
                >
                  {saveEntryMutation.isPending ? t('common.saving') : t('inventoryCount.process.saveEntry')}
                </OpsActionButton>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <InventoryCountOpsSectionHeader
                title={t('inventoryCount.process.lineListTitle')}
                description={t('inventoryCount.process.lineListDescription')}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {linesQuery.isPending && lineRows.length === 0 ? (
                <InventoryCountOpsEmpty>{t('common.loading')}</InventoryCountOpsEmpty>
              ) : lineRows.length === 0 ? (
                <InventoryCountOpsEmpty>{t('inventoryCount.process.noLines')}</InventoryCountOpsEmpty>
              ) : (
                <div className="wms-ops-inventory-count-line-list max-h-[min(68dvh,720px)] space-y-3 overflow-y-auto pr-1">
                  {lineRows.map((line) => {
                  const lineId = normalizeLineId(line.id);
                  const isActive = lineId != null && lineId === normalizeLineId(selectedLineId);
                  return (
                    <InventoryCountOpsLineCard
                      key={lineId ?? `line-${line.sequenceNo}`}
                      active={isActive}
                      isDifference={line.isDifference}
                      onClick={() => {
                        if (lineId != null) {
                          setSelectedLineId(lineId);
                          setSelectedLineLabel(buildLineLabel(line));
                        }
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="wms-ops-inventory-count-line-card__title">{line.stockCode}</div>
                          <div className="wms-ops-inventory-count-line-card__meta">
                            {[line.warehouseCode, line.rackCode, line.cellCode].filter(Boolean).join(' / ') || t('inventoryCount.process.noLocation', { defaultValue: 'Konum bilgisi yok' })}
                          </div>
                        </div>
                        <InventoryCountOpsBadge tone={inventoryCountStatusTone(line.countStatus)}>
                          {getInventoryCountStatusLabel(t, line.countStatus)}
                        </InventoryCountOpsBadge>
                      </div>
                      <div className="mt-3">
                        <InventoryCountOpsStatGrid columns={3}>
                          <InventoryCountOpsStat
                            label={t('inventoryCount.fields.expectedQuantity')}
                            value={isBlindCount ? '-' : formatNumber(line.expectedQuantity)}
                          />
                          <InventoryCountOpsStat
                            label={t('inventoryCount.fields.countedQuantity')}
                            value={formatNumber(line.countedQuantity)}
                          />
                          <InventoryCountOpsStat
                            label={t('inventoryCount.fields.difference')}
                            value={isBlindCount ? '-' : formatNumber(line.differenceQuantity)}
                          />
                        </InventoryCountOpsStatGrid>
                      </div>
                    </InventoryCountOpsLineCard>
                  );
                })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
