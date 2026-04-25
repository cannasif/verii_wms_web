import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DetailPageShell } from '@/components/shared/DetailPageShell';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { InventoryCountHeader, InventoryCountLine } from '../types/inventory-count';

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

function statusTone(status?: string): 'secondary' | 'destructive' | 'default' | 'outline' {
  if (status === 'Recount' || status === 'Review') return 'destructive';
  if (status === 'Counted' || status === 'Completed') return 'default';
  if (status === 'Counting') return 'outline';
  return 'secondary';
}

export function InventoryCountProcessPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const authUserId = useAuthStore((state) => state.user?.id);
  const canUpdate = permissionAccess.can('wms.inventory-count.update');
  const [searchParams, setSearchParams] = useSearchParams();
  const headerIdFromQuery = Number(searchParams.get('headerId') ?? '');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(Number.isFinite(headerIdFromQuery) && headerIdFromQuery > 0 ? headerIdFromQuery : null);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [headerLookupOpen, setHeaderLookupOpen] = useState(false);
  const [lineLookupOpen, setLineLookupOpen] = useState(false);
  const [selectedHeaderLabel, setSelectedHeaderLabel] = useState('');
  const [selectedLineLabel, setSelectedLineLabel] = useState('');
  const [enteredQuantity, setEnteredQuantity] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setPageTitle(t('inventoryCount.process.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const assignedHeadersQuery = useQuery({
    queryKey: ['inventory-count-process-assigned', authUserId],
    queryFn: () => inventoryCountApi.getAssignedHeadersPaged(authUserId || 0, { pageNumber: 0, pageSize: 100 }),
    enabled: Boolean(authUserId),
  });

  const allHeadersQuery = useQuery({
    queryKey: ['inventory-count-process-all'],
    queryFn: () => inventoryCountApi.getHeadersPaged({
      pageNumber: 0,
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

  const linesQuery = useQuery({
    queryKey: ['inventory-count-process-lines', selectedHeaderId],
    queryFn: () => inventoryCountApi.getLinesByHeader(selectedHeaderId || 0),
    enabled: Boolean(selectedHeaderId),
  });

  const lineRows = linesQuery.data ?? [];

  useEffect(() => {
    if (selectedHeaderId) {
      setSearchParams({ headerId: String(selectedHeaderId) }, { replace: true });
    }
  }, [selectedHeaderId, setSearchParams]);

  useEffect(() => {
    if (!selectedLineId && lineRows.length > 0) {
      setSelectedLineId(lineRows[0].id);
    }
    if (selectedLineId && lineRows.every((line) => line.id !== selectedLineId)) {
      setSelectedLineId(lineRows[0]?.id ?? null);
    }
  }, [lineRows, selectedLineId]);

  const selectedLine = useMemo(
    () => lineRows.find((item) => item.id === selectedLineId) ?? null,
    [lineRows, selectedLineId],
  );

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
        throw new Error(t('inventoryCount.process.errors.lineRequired', { defaultValue: 'Missing translation' }));
      }

      const quantity = Number(enteredQuantity);
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw new Error(t('inventoryCount.process.errors.quantityRequired', { defaultValue: 'Missing translation' }));
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
      toast.success(t('inventoryCount.process.success', { defaultValue: 'Missing translation' }));
      setEnteredQuantity('');
      setNote('');
      await linesQuery.refetch();
      await assignedHeadersQuery.refetch();
      await allHeadersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('inventoryCount.process.error', { defaultValue: 'Missing translation' }));
    },
  });

  const isBlindCount = selectedHeader?.countMode === 'Blind';

  return (
    <div className="space-y-6">
      <DetailPageShell
        title={t('inventoryCount.process.title', { defaultValue: 'Missing translation' })}
        description={t('inventoryCount.process.description', {
          defaultValue: 'Missing translation',
        })}
        isLoading={assignedHeadersQuery.isLoading || allHeadersQuery.isLoading}
        isError={Boolean(assignedHeadersQuery.error) || Boolean(allHeadersQuery.error)}
        errorTitle={t('inventoryCount.process.loadErrorTitle', { defaultValue: 'Missing translation' })}
        errorDescription={(assignedHeadersQuery.error as Error)?.message || (allHeadersQuery.error as Error)?.message}
      >
        {!canUpdate ? (
          <Card className="mb-6 border-amber-200 bg-amber-50/80">
            <CardContent className="py-4 text-sm text-amber-900">
              {t('inventoryCount.process.permissionInfo', {
                defaultValue: 'Missing translation',
              })}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventoryCount.process.pickHeaderTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('inventoryCount.process.pickHeaderDescription', {
                  defaultValue: 'Missing translation',
                })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('inventoryCount.fields.header', { defaultValue: 'Missing translation' })}</Label>
                  <PagedLookupDialog<InventoryCountHeader>
                    open={headerLookupOpen}
                    onOpenChange={setHeaderLookupOpen}
                    title={t('inventoryCount.fields.header', { defaultValue: 'Missing translation' })}
                    description={t('inventoryCount.process.pickHeaderDescription', {
                      defaultValue: 'Missing translation',
                    })}
                    value={selectedHeaderLabel || (selectedHeaderId ? `#${selectedHeaderId}` : '')}
                    placeholder={t('inventoryCount.placeholders.selectHeader', { defaultValue: 'Missing translation' })}
                    searchPlaceholder={t('inventoryCount.placeholders.selectHeader', { defaultValue: 'Missing translation' })}
                    emptyText={t('inventoryCount.process.emptyHeaderMessage', { defaultValue: 'Missing translation' })}
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
                </div>

                {selectedHeader ? (
                  <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.countType', { defaultValue: 'Missing translation' })}</div>
                      <div className="font-medium">{selectedHeader.countType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.countMode', { defaultValue: 'Missing translation' })}</div>
                      <div className="font-medium">
                        {isBlindCount
                          ? t('inventoryCount.create.options.countMode.blind')
                          : t('inventoryCount.create.options.countMode.open')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.lineCount', { defaultValue: 'Missing translation' })}</div>
                      <div className="font-medium">{selectedHeader.lineCount ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.status', { defaultValue: 'Missing translation' })}</div>
                      <div><Badge variant={statusTone(selectedHeader.status)}>{selectedHeader.status || 'Draft'}</Badge></div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('inventoryCount.process.entryTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('inventoryCount.process.entryDescription', {
                  defaultValue: 'Missing translation',
                })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('inventoryCount.fields.line', { defaultValue: 'Missing translation' })}</Label>
                  <PagedLookupDialog<InventoryCountLine>
                    open={lineLookupOpen}
                    onOpenChange={setLineLookupOpen}
                    title={t('inventoryCount.fields.line', { defaultValue: 'Missing translation' })}
                    description={selectedHeaderLabel || t('inventoryCount.fields.header', { defaultValue: 'Missing translation' })}
                    value={selectedLineLabel || (selectedLineId ? `#${selectedLineId}` : '')}
                    placeholder={t('inventoryCount.placeholders.selectLine', { defaultValue: 'Missing translation' })}
                    searchPlaceholder={t('inventoryCount.placeholders.selectLine', { defaultValue: 'Missing translation' })}
                    emptyText={t('inventoryCount.process.emptyLineMessage', { defaultValue: 'Missing translation' })}
                    disabled={!selectedHeaderId}
                    queryKey={['inventory-count-process-line-lookup', selectedHeaderId || 'none']}
                    fetchPage={({ pageNumber, pageSize, search }) =>
                      inventoryCountApi.getLinesByHeaderPaged(selectedHeaderId || 0, { pageNumber, pageSize, search })
                    }
                    getKey={(line) => line.id.toString()}
                    getLabel={buildLineLabel}
                    onSelect={(line) => {
                      setSelectedLineId(line.id);
                      setSelectedLineLabel(buildLineLabel(line));
                    }}
                  />
                </div>

                {selectedLine ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
                    <div className="font-semibold">{selectedLine.stockCode}</div>
                    <div className="mt-1 text-muted-foreground">
                      {[selectedLine.warehouseCode, selectedLine.rackCode, selectedLine.cellCode].filter(Boolean).join(' / ') || 'Konum bilgisi yok'}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.expectedQuantity', { defaultValue: 'Missing translation' })}</div>
                        <div className="font-medium">{isBlindCount ? '-' : formatNumber(selectedLine.expectedQuantity)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.lastCountedQuantity', { defaultValue: 'Missing translation' })}</div>
                        <div className="font-medium">{formatNumber(selectedLine.countedQuantity)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.unit', { defaultValue: 'Missing translation' })}</div>
                        <div className="font-medium">{selectedLine.unit || '-'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {t('inventoryCount.process.emptyLineMessage', { defaultValue: 'Missing translation' })}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('inventoryCount.fields.enteredQuantity', { defaultValue: 'Missing translation' })}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={enteredQuantity}
                    onChange={(event) => setEnteredQuantity(event.target.value)}
                    placeholder={t('inventoryCount.placeholders.enterQuantity', { defaultValue: 'Missing translation' })}
                    disabled={!selectedLine || !canUpdate}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('common.note', { defaultValue: 'Missing translation' })}</Label>
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    placeholder={t('inventoryCount.placeholders.enterNote', { defaultValue: 'Missing translation' })}
                    disabled={!selectedLine || !canUpdate}
                  />
                </div>

                <Button type="button" onClick={() => saveEntryMutation.mutate()} disabled={!selectedLine || !canUpdate || saveEntryMutation.isPending}>
                  {saveEntryMutation.isPending
                    ? t('common.saving', { defaultValue: 'Missing translation' })
                    : t('inventoryCount.process.saveEntry', { defaultValue: 'Missing translation' })}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventoryCount.process.lineListTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('inventoryCount.process.lineListDescription', {
                  defaultValue: 'Missing translation',
                })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {linesQuery.isLoading ? (
                  <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                    {t('common.loading', { defaultValue: 'Missing translation' })}
                  </div>
                ) : lineRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {t('inventoryCount.process.noLines', { defaultValue: 'Missing translation' })}
                  </div>
                ) : (
                  lineRows.map((line) => {
                    const isActive = line.id === selectedLineId;
                    return (
                      <button
                        type="button"
                        key={line.id}
                        onClick={() => setSelectedLineId(line.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${isActive ? 'border-sky-500 bg-sky-50' : line.isDifference ? 'border-rose-300 bg-rose-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{line.stockCode}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {[line.warehouseCode, line.rackCode, line.cellCode].filter(Boolean).join(' / ') || 'Konum bilgisi yok'}
                            </div>
                          </div>
                          <Badge variant={statusTone(line.countStatus)}>{line.countStatus}</Badge>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div>
                            <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.expectedQuantity', { defaultValue: 'Missing translation' })}</div>
                            <div className="font-medium">{isBlindCount ? '-' : formatNumber(line.expectedQuantity)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.countedQuantity', { defaultValue: 'Missing translation' })}</div>
                            <div className="font-medium">{formatNumber(line.countedQuantity)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">{t('inventoryCount.fields.difference', { defaultValue: 'Missing translation' })}</div>
                            <div className="font-medium">{isBlindCount ? '-' : formatNumber(line.differenceQuantity)}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DetailPageShell>
    </div>
  );
}
