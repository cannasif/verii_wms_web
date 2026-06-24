import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Printer, RefreshCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PagedDataGrid, OpsActionButton, OpsFieldShell, type PagedDataGridColumn } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { printerManagementApi } from '@/features/printer-management/api/printer-management.api';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useRouteScreenReady } from '@/routes/RouteRuntimeBoundary';
import type { PrinterProfile } from '@/features/printer-management/types/printer-management.types';
import { barcodeDesignerApi } from '../api/barcode-designer.api';
import { barcodePrintSourceBrowserApi } from '../api/barcode-print-source-browser.api';
import type {
  BarcodePrintSourceModule,
  BarcodeSourceHeaderOption,
  BarcodeSourceLineOption,
  BarcodeTemplate,
} from '../types/barcode-designer-editor.types';
import { DEFAULT_TEMPLATE_DOCUMENT } from '../utils/barcode-designer-document';
import { getPrintSourceStatusBadgeClass, localizePrintSourceStatus } from '../utils/print-source-status';

type HeaderColumnKey = 'select' | 'documentNo' | 'subtitle' | 'status' | 'documentDate';
type HeaderSortKey = 'id';

interface OperationOption {
  value: BarcodePrintSourceModule;
  label: string;
  description: string;
}

const operationOptions: OperationOption[] = [
  { value: 'goods-receipt', label: 'Mal Kabul', description: 'Tüm mal kabuller' },
  { value: 'goods-receipt-pre-label', label: 'Mal Kabul Ön Etiket', description: 'Siparişe istinaden basılmış ön barkod etiketleri' },
  { value: 'transfer', label: 'Transfer', description: 'Depolar arası transferler' },
  { value: 'warehouse-inbound', label: 'Ambar Giriş', description: 'Ambar giriş belgeleri' },
  { value: 'warehouse-outbound', label: 'Ambar Çıkış', description: 'Ambar çıkış belgeleri' },
  { value: 'shipment', label: 'Sevkiyat', description: 'Sevkiyat belgeleri' },
  { value: 'subcontracting-issue', label: 'Fason Çıkış', description: 'Fasona çıkış belgeleri' },
  { value: 'subcontracting-receipt', label: 'Fason Giriş', description: 'Fasondan giriş belgeleri' },
  { value: 'package', label: 'Paketleme', description: 'Paket ve koli belgeleri' },
  { value: 'production-transfer', label: 'Üretim Transfer', description: 'Üretim transfer belgeleri' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  select: 5,
  documentNo: 22,
  subtitle: 28,
  status: 14,
  documentDate: 16,
};

function mapSortBy(_: HeaderSortKey): string {
  return 'Id';
}

function getOperationLabel(sourceModule: BarcodePrintSourceModule): string {
  return operationOptions.find((item) => item.value === sourceModule)?.label ?? sourceModule;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function BarcodePrintPage(): ReactElement {
  const { t } = useTranslation('common');
  const { reportScreenReady } = useRouteScreenReady();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.print-management');
  const initialTemplateId = id ? Number(id) : null;
  const initialSourceModule = operationOptions.some((item) => item.value === searchParams.get('sourceModule'))
    ? searchParams.get('sourceModule') as BarcodePrintSourceModule
    : 'goods-receipt';
  const initialSourceHeaderId = Number(searchParams.get('sourceHeaderId') ?? 0);

  const initialPrintMode = searchParams.get('printMode');
  const hasDeepLinkSelection = Number.isFinite(initialSourceHeaderId) && initialSourceHeaderId > 0;

  const [sourceModule, setSourceModule] = useState<BarcodePrintSourceModule>(initialSourceModule);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialTemplateId);
  const [selectedHeaderMap, setSelectedHeaderMap] = useState<Record<number, BarcodeSourceHeaderOption>>(
    hasDeepLinkSelection
      ? { [initialSourceHeaderId]: { id: initialSourceHeaderId, sourceModule: initialSourceModule, title: `#${initialSourceHeaderId}` } }
      : {},
  );
  const [selectedLineMap, setSelectedLineMap] = useState<Record<number, BarcodeSourceLineOption>>({});
  const [selectedServerPrinterId, setSelectedServerPrinterId] = useState('');
  const [selectedServerPrinterProfileId, setSelectedServerPrinterProfileId] = useState('');
  const [copies, setCopies] = useState(1);
  const [printSettingsExpanded, setPrintSettingsExpanded] = useState(hasDeepLinkSelection || Boolean(initialPrintMode));
  const screenReadyReportedRef = useRef(false);
  const sourceModuleHydratedRef = useRef(false);

  const pagedGrid = usePagedDataGrid<HeaderSortKey>({
    pageKey: `barcode-print-${sourceModule}`,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    defaultPageNumber: 0,
    defaultPageSize: 10,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpBarcodePrint', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!sourceModuleHydratedRef.current) {
      sourceModuleHydratedRef.current = true;
      return;
    }

    setSelectedHeaderMap({});
    setSelectedLineMap({});
    pagedGrid.setPageNumber(0);
  }, [sourceModule]); // eslint-disable-line react-hooks/exhaustive-deps

  const templatesQuery = useQuery({
    queryKey: ['barcode-designer-templates-for-print-operations'],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplates({ signal }),
    enabled: printSettingsExpanded,
  });

  useEffect(() => {
    if (selectedTemplateId) {
      return;
    }

    const templates = templatesQuery.data?.data ?? [];
    if (templates.length === 0) {
      return;
    }

    const preferredTemplate = templates.find((item) => item.id === initialTemplateId) ?? templates.find((item) => item.isActive) ?? templates[0];
    if (preferredTemplate?.id) {
      setSelectedTemplateId(preferredTemplate.id);
    }
  }, [initialTemplateId, selectedTemplateId, templatesQuery.data?.data]);

  const selectedTemplate = useMemo<BarcodeTemplate | null>(() => {
    const templates = templatesQuery.data?.data ?? [];
    return templates.find((item) => item.id === selectedTemplateId) ?? null;
  }, [selectedTemplateId, templatesQuery.data?.data]);

  const draftQuery = useQuery({
    queryKey: ['barcode-designer-draft-for-print-operations', selectedTemplateId],
    queryFn: ({ signal }) => barcodeDesignerApi.getDraft(selectedTemplateId!, { signal }),
    enabled: !!selectedTemplateId && printSettingsExpanded,
  });

  const headersQuery = useQuery({
    queryKey: ['barcode-print-headers-paged', sourceModule, pagedGrid.queryParams],
    queryFn: () => barcodePrintSourceBrowserApi.getHeadersPaged(sourceModule, pagedGrid.queryParams),
  });

  useEffect(() => {
    if (screenReadyReportedRef.current || headersQuery.isLoading) {
      return;
    }

    screenReadyReportedRef.current = true;
    reportScreenReady('initial-screen');
  }, [headersQuery.isLoading, reportScreenReady]);

  const selectedHeaderIds = useMemo(
    () => Object.keys(selectedHeaderMap).map(Number).sort((left, right) => left - right),
    [selectedHeaderMap],
  );

  const singleSelectedHeaderId = selectedHeaderIds.length === 1 ? selectedHeaderIds[0] : null;
  const singleSelectedHeader = singleSelectedHeaderId ? selectedHeaderMap[singleSelectedHeaderId] : null;

  useEffect(() => {
    if (!singleSelectedHeaderId) {
      setSelectedLineMap({});
    }
  }, [singleSelectedHeaderId]);

  const linesQuery = useQuery({
    queryKey: ['barcode-print-lines', sourceModule, singleSelectedHeaderId],
    queryFn: () => barcodePrintSourceBrowserApi.getLines(sourceModule, singleSelectedHeaderId!),
    enabled: singleSelectedHeaderId != null,
  });

  const serverPrintersQuery = useQuery({
    queryKey: ['printer-management-printers-for-barcode-print-operations'],
    queryFn: ({ signal }) => printerManagementApi.getPrinters({ signal }),
    enabled: printSettingsExpanded,
  });

  const templatePrinterProfilesQuery = useQuery({
    queryKey: ['barcode-designer-template-printer-profiles-for-print-operations', selectedTemplateId],
    queryFn: ({ signal }) => printerManagementApi.getTemplatePrinterProfiles(selectedTemplateId!, { signal }),
    enabled: !!selectedTemplateId && printSettingsExpanded,
  });

  const printerProfilesQuery = useQuery({
    queryKey: ['printer-management-profiles-for-barcode-print-operations'],
    queryFn: ({ signal }) => printerManagementApi.getProfiles(undefined, { signal }),
    enabled: printSettingsExpanded,
  });

  useEffect(() => {
    const activePrinter = serverPrintersQuery.data?.data?.find((item) => item.isActive && item.isDefault)
      ?? serverPrintersQuery.data?.data?.find((item) => item.isActive);

    if (activePrinter?.id && !selectedServerPrinterId) {
      setSelectedServerPrinterId(String(activePrinter.id));
    }
  }, [selectedServerPrinterId, serverPrintersQuery.data?.data]);

  useEffect(() => {
    const defaultMapping = templatePrinterProfilesQuery.data?.data?.find((item) => item.isDefault)
      ?? templatePrinterProfilesQuery.data?.data?.[0];

    if (!defaultMapping) {
      setSelectedServerPrinterProfileId('');
      return;
    }

    setSelectedServerPrinterProfileId(String(defaultMapping.printerProfileId));

    const matchingPrinter = (serverPrintersQuery.data?.data ?? []).find((item) => item.code === defaultMapping.printerCode && item.isActive);
    if (matchingPrinter?.id) {
      setSelectedServerPrinterId(String(matchingPrinter.id));
    }
  }, [serverPrintersQuery.data?.data, templatePrinterProfilesQuery.data?.data]);

  const availableServerProfiles = useMemo<PrinterProfile[]>(() => {
    const selectedPrinter = (serverPrintersQuery.data?.data ?? []).find((item) => String(item.id) === selectedServerPrinterId);
    const templateMappings = templatePrinterProfilesQuery.data?.data ?? [];
    const allProfiles = printerProfilesQuery.data?.data ?? [];

    return allProfiles.filter((profile) => {
      if (!profile.isActive) {
        return false;
      }

      const printerMatches = !selectedPrinter || profile.printerCode === selectedPrinter.code;
      const mappedToTemplate = !selectedTemplateId || templateMappings.some((mapping) => mapping.printerProfileId === profile.id);

      return printerMatches && mappedToTemplate;
    });
  }, [printerProfilesQuery.data?.data, selectedServerPrinterId, selectedTemplateId, serverPrintersQuery.data?.data, templatePrinterProfilesQuery.data?.data]);

  const selectedLineIds = useMemo(
    () => Object.keys(selectedLineMap).map(Number).sort((left, right) => left - right),
    [selectedLineMap],
  );

  const currentPageRows = headersQuery.data?.data ?? [];
  const allVisibleRowsSelected = currentPageRows.length > 0 && currentPageRows.every((row) => selectedHeaderMap[row.id] != null);

  const paginationRange = getPagedRange(headersQuery.data, 0);
  const paginationInfoText = t('common.paginationInfo', {
    current: paginationRange.from,
    total: paginationRange.to,
    totalCount: paginationRange.total,
    defaultValue: `${paginationRange.from}-${paginationRange.to} / ${paginationRange.total}`,
  });

  const columns = useMemo<PagedDataGridColumn<HeaderColumnKey>[]>(
    () => [
      { key: 'select', label: '' },
      { key: 'documentNo', label: t('common.documentNo', { defaultValue: 'Missing translation' }) },
      { key: 'subtitle', label: t('common.description', { defaultValue: 'Missing translation' }) },
      { key: 'status', label: t('common.status', { defaultValue: 'Missing translation' }) },
      { key: 'documentDate', label: t('common.date', { defaultValue: 'Missing translation' }) },
    ],
    [t],
  );

  const toggleHeaderSelection = (header: BarcodeSourceHeaderOption): void => {
    setSelectedHeaderMap((current) => {
      if (current[header.id]) {
        const next = { ...current };
        delete next[header.id];
        return next;
      }

      return {
        ...current,
        [header.id]: header,
      };
    });
  };

  const toggleAllVisibleRows = (): void => {
    setSelectedHeaderMap((current) => {
      const next = { ...current };

      if (allVisibleRowsSelected) {
        currentPageRows.forEach((row) => {
          delete next[row.id];
        });
        return next;
      }

      currentPageRows.forEach((row) => {
        next[row.id] = row;
      });
      return next;
    });
  };

  const toggleLineSelection = (line: BarcodeSourceLineOption): void => {
    setSelectedLineMap((current) => {
      if (current[line.id]) {
        const next = { ...current };
        delete next[line.id];
        return next;
      }

      return {
        ...current,
        [line.id]: line,
      };
    });
  };

  const clearSelection = (): void => {
    setSelectedHeaderMap({});
    setSelectedLineMap({});
  };

  const printMutation = useMutation({
    mutationFn: async () => {
      if (!permission.canCreate && !permission.canUpdate) {
        throw new Error(t('common.noPermission'));
      }

      if (!selectedTemplateId) {
        throw new Error(t('barcodePrint.selectTemplateFirst', { defaultValue: 'Missing translation' }));
      }

      if (!selectedServerPrinterId) {
        throw new Error(t('barcodePrint.selectPrinterFirst', { defaultValue: 'Missing translation' }));
      }

      if (!selectedServerPrinterProfileId) {
        throw new Error(t('barcodePrint.selectProfileFirst', { defaultValue: 'Missing translation' }));
      }

      if (selectedHeaderIds.length === 0) {
        throw new Error(t('barcodePrint.selectDocumentFirst', { defaultValue: 'Missing translation' }));
      }

      const resolveRequests = selectedLineIds.length > 0 && singleSelectedHeaderId
        ? selectedLineIds.map((lineId) => ({
            sourceModule,
            sourceHeaderId: singleSelectedHeaderId,
            sourceLineId: lineId,
            printMode: 'document-line' as const,
          }))
        : selectedHeaderIds.map((headerId) => ({
            sourceModule,
            sourceHeaderId: headerId,
            sourceLineId: null,
            printMode: 'document-all' as const,
          }));

      const resolvedGroups = await Promise.all(resolveRequests.map((request) => barcodeDesignerApi.resolvePrintSource(request)));
      const resolvedSourceItems = resolvedGroups.flatMap((response) => response.data ?? []);

      if (resolvedSourceItems.length === 0) {
        throw new Error(t('barcodePrint.noPrintableLines', { defaultValue: 'Missing translation' }));
      }

      const records = resolvedSourceItems.map((item) => ({
        stockCode: item.stockCode ?? '',
        stockName: item.stockName ?? '',
        serialNo: item.serialNo ?? '',
        quantity: item.quantity ?? 0,
        documentNo: item.documentNo ?? '',
        customerCode: item.customerCode ?? '',
      }));

      const selectedProfile = availableServerProfiles.find((item) => String(item.id) === selectedServerPrinterProfileId);

      return await printerManagementApi.createPrintJob({
        printerDefinitionId: Number(selectedServerPrinterId),
        printerProfileId: Number(selectedServerPrinterProfileId),
        barcodeTemplateId: selectedTemplateId,
        jobName: `${getOperationLabel(sourceModule)}-${selectedTemplate?.templateCode ?? 'BARCODE'}-${new Date().toISOString()}`,
        outputFormat: selectedProfile?.outputType ?? 'Pdf',
        copies: Math.max(1, copies),
        payloadJson: JSON.stringify({
          templateJson: draftQuery.data?.data?.templateJson ?? JSON.stringify(DEFAULT_TEMPLATE_DOCUMENT),
          sourceModule,
          selectedHeaderIds,
          selectedLineIds,
          records,
          resolvedSourceItems,
        }),
        previewPayload: draftQuery.data?.data?.templateJson ?? JSON.stringify(DEFAULT_TEMPLATE_DOCUMENT),
        sourceModule,
        sourceHeaderId: selectedHeaderIds.length === 1 ? selectedHeaderIds[0] : null,
        sourceLineId: selectedLineIds.length === 1 ? selectedLineIds[0] : null,
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || t('barcodePrint.printQueued', { defaultValue: 'Missing translation' }));
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('barcodePrint.printCreateFailed', { defaultValue: 'Missing translation' }));
    },
  });

  return (
    <div className="wms-ops-form wms-ops-erp-skin wms-ops-list wms-ops-barcode-print space-y-5">
      <header className="wms-ops-header">
        <div className="wms-ops-eyebrow font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
          {t('sidebar.erp', { defaultValue: 'ERP' })} / {t('barcodePrint.badge', { defaultValue: 'WMS Print' })}
        </div>
      </header>

      <section className="wms-ops-barcode-print__hero">
        <div className="wms-ops-barcode-print__hero-grid">
          <div>
            <h1 className="wms-ops-barcode-print__title">
              {t('sidebar.erpBarcodePrint', { defaultValue: 'Barcode Print' })}
            </h1>
            <p className="wms-ops-barcode-print__description">
              {t('barcodePrint.heroDescription', { defaultValue: 'Missing translation' })}
            </p>
          </div>
          <div className="wms-ops-barcode-print__stats">
            <div className="wms-ops-barcode-print__stat">
              <div className="wms-ops-barcode-print__stat-label">{t('barcodePrint.operation', { defaultValue: 'Operation' })}</div>
              <div className="wms-ops-barcode-print__stat-value">{getOperationLabel(sourceModule)}</div>
            </div>
            <div className="wms-ops-barcode-print__stat">
              <div className="wms-ops-barcode-print__stat-label">{t('barcodePrint.selectedDocuments', { defaultValue: 'Documents' })}</div>
              <div className="wms-ops-barcode-print__stat-value">{selectedHeaderIds.length}</div>
            </div>
            <div className="wms-ops-barcode-print__stat">
              <div className="wms-ops-barcode-print__stat-label">{t('barcodePrint.selectedLines', { defaultValue: 'Lines' })}</div>
              <div className="wms-ops-barcode-print__stat-value">{selectedLineIds.length}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="wms-ops-barcode-print__layout">
        <div className="wms-ops-barcode-print__main">
          <section className="wms-ops-barcode-print__panel">
            <div className="wms-ops-barcode-print__panel-head">
              <h2 className="wms-ops-barcode-print__panel-title">
                {t('barcodePrint.operationAndDocumentList', { defaultValue: 'Missing translation' })}
              </h2>
            </div>
            <div className="wms-ops-barcode-print__panel-body space-y-4">
              <div className="wms-ops-barcode-print__operation-row">
                <div className="wms-ops-barcode-print__operation-field">
                  <span className="wms-ops-barcode-print__field-label">{t('barcodePrint.operation', { defaultValue: 'Operation' })}</span>
                  <OpsFieldShell className="wms-ops-barcode-print__operation-shell">
                    <Select value={sourceModule} onValueChange={(value) => setSourceModule(value as BarcodePrintSourceModule)}>
                      <SelectTrigger className={cn(OPS_FIELD_CLASS, 'wms-ops-barcode-print__operation-trigger h-11 w-full')}>
                        <SelectValue placeholder={t('barcodePrint.selectOperation', { defaultValue: 'Missing translation' })} />
                      </SelectTrigger>
                      <SelectContent className="wms-ops-list-select-content">
                        {operationOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </OpsFieldShell>
                </div>
                <div className="wms-ops-barcode-print__info-box">
                  <strong>{getOperationLabel(sourceModule)}</strong>
                  {operationOptions.find((item) => item.value === sourceModule)?.description}
                </div>
              </div>

              <PagedDataGrid<BarcodeSourceHeaderOption, HeaderColumnKey>
                pageKey={`barcode-print-grid-${sourceModule}`}
                columns={columns}
                rows={currentPageRows}
                rowKey={(row) => row.id}
                idColumnKey="select"
                lockedColumnKeys={['select']}
                defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
                renderCell={(row, columnKey) => {
                  switch (columnKey) {
                    case 'select':
                      return (
                        <input
                          type="checkbox"
                          checked={selectedHeaderMap[row.id] != null}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleHeaderSelection(row)}
                          className="wms-ops-barcode-print__checkbox"
                        />
                      );
                    case 'documentNo':
                      return <span className="font-medium">{row.title}</span>;
                    case 'subtitle':
                      return row.subtitle ?? '-';
                    case 'status': {
                      const status = row.status ?? '';
                      const statusLabel = localizePrintSourceStatus(status, t);
                      return status ? (
                        <Badge
                          variant="outline"
                          className={getPrintSourceStatusBadgeClass(status)}
                          title={status !== statusLabel ? status : undefined}
                        >
                          {statusLabel}
                        </Badge>
                      ) : (
                        '-'
                      );
                    }
                    case 'documentDate':
                      return formatDate(row.documentDate);
                    default:
                      return null;
                  }
                }}
                onRowClick={(row) => toggleHeaderSelection(row)}
                isLoading={headersQuery.isLoading}
                isError={headersQuery.isError}
                errorText={t('barcodePrint.documentListLoadFailed', { defaultValue: 'Missing translation' })}
                emptyText={t('barcodePrint.documentListEmpty', { defaultValue: 'Missing translation' })}
                pageSize={pagedGrid.pageSize}
                pageSizeOptions={pagedGrid.pageSizeOptions}
                onPageSizeChange={pagedGrid.handlePageSizeChange}
                pageNumber={pagedGrid.getDisplayPageNumber(headersQuery.data)}
                totalPages={headersQuery.data?.totalPages ?? 1}
                hasPreviousPage={headersQuery.data?.hasPreviousPage ?? false}
                hasNextPage={headersQuery.data?.hasNextPage ?? false}
                onPreviousPage={pagedGrid.goToPreviousPage}
                onNextPage={pagedGrid.goToNextPage}
                previousLabel={t('common.previous', { defaultValue: 'Missing translation' })}
                nextLabel={t('common.next', { defaultValue: 'Missing translation' })}
                paginationInfoText={paginationInfoText}
                search={{
                  value: pagedGrid.searchInput,
                  onValueChange: pagedGrid.searchConfig.onValueChange,
                  onSearchChange: pagedGrid.searchConfig.onSearchChange,
                  placeholder: t('barcodePrint.searchInOperation', { defaultValue: 'Missing translation', operation: getOperationLabel(sourceModule) }),
                  className: 'wms-ops-barcode-print__search',
                }}
                refresh={{
                  onRefresh: () => {
                    void headersQuery.refetch();
                  },
                  isLoading: headersQuery.isFetching,
                  label: t('common.refresh', { defaultValue: 'Missing translation' }),
                }}
                afterRefreshSlot={(
                  <>
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      className="wms-ops-barcode-print__toolbar-select-btn"
                      onClick={toggleAllVisibleRows}
                    >
                      {allVisibleRowsSelected
                        ? t('barcodePrint.clearVisible', { defaultValue: 'Missing translation' })
                        : t('barcodePrint.selectVisible', { defaultValue: 'Missing translation' })}
                    </OpsActionButton>
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      className="wms-ops-barcode-print__toolbar-select-btn"
                      onClick={clearSelection}
                      disabled={selectedHeaderIds.length === 0 && selectedLineIds.length === 0}
                    >
                      <Trash2 className="size-3 shrink-0" aria-hidden />
                      {t('barcodePrint.clearSelection', { defaultValue: 'Missing translation' })}
                    </OpsActionButton>
                  </>
                )}
                variant="ops"
              />
            </div>
          </section>

          <section className="wms-ops-barcode-print__panel">
            <div className="wms-ops-barcode-print__panel-head">
              <h2 className="wms-ops-barcode-print__panel-title">
                {t('barcodePrint.documentLines', { defaultValue: 'Missing translation' })}
              </h2>
            </div>
            <div className="wms-ops-barcode-print__panel-body">
              {singleSelectedHeader ? (
                <div className="space-y-4">
                  <div className="wms-ops-barcode-print__info-box">
                    <strong>{singleSelectedHeader.title}</strong>
                    {t('barcodePrint.linesHelp', { defaultValue: 'Missing translation' })}
                  </div>

                  <div className="wms-ops-barcode-print__lines-wrap custom-scrollbar">
                    <table className="wms-ops-barcode-print__lines-table">
                      <thead>
                        <tr>
                          <th className="w-12">
                            <input
                              type="checkbox"
                              checked={(linesQuery.data ?? []).length > 0 && (linesQuery.data ?? []).every((line) => selectedLineMap[line.id] != null)}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => {
                                const lines = linesQuery.data ?? [];
                                const allSelected = lines.length > 0 && lines.every((line) => selectedLineMap[line.id] != null);
                                setSelectedLineMap((current) => {
                                  const next = { ...current };
                                  if (allSelected) {
                                    lines.forEach((line) => {
                                      delete next[line.id];
                                    });
                                    return next;
                                  }

                                  lines.forEach((line) => {
                                    next[line.id] = line;
                                  });
                                  return next;
                                });
                              }}
                              className="wms-ops-barcode-print__checkbox"
                            />
                          </th>
                          <th>{t('common.stock', { defaultValue: 'Stock' })}</th>
                          <th>{t('common.description')}</th>
                          <th>{t('common.quantity', { defaultValue: 'Quantity' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(linesQuery.data ?? []).map((line) => (
                          <tr key={line.id} onClick={() => toggleLineSelection(line)}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedLineMap[line.id] != null}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => toggleLineSelection(line)}
                                className="wms-ops-barcode-print__checkbox"
                              />
                            </td>
                            <td className="font-medium">{line.title}</td>
                            <td>{line.subtitle ?? '-'}</td>
                            <td>{line.quantity ?? '-'}</td>
                          </tr>
                        ))}
                        {linesQuery.isLoading ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground">
                              {t('barcodePrint.linesLoading', { defaultValue: 'Missing translation' })}
                            </td>
                          </tr>
                        ) : null}
                        {!linesQuery.isLoading && (linesQuery.data ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground">
                              {t('barcodePrint.linesEmpty', { defaultValue: 'Missing translation' })}
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="wms-ops-barcode-print__empty">
                  {t('barcodePrint.selectSingleDocument', { defaultValue: 'Missing translation' })}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="wms-ops-barcode-print__aside">
          <section className="wms-ops-barcode-print__panel">
            <button
              type="button"
              className="wms-ops-barcode-print__panel-head wms-ops-barcode-print__panel-head--toggle"
              onClick={() => setPrintSettingsExpanded((current) => !current)}
            >
              <h2 className="wms-ops-barcode-print__panel-title">
                {t('barcodePrint.printSettings', { defaultValue: 'Missing translation' })}
              </h2>
              <span className="wms-ops-barcode-print__settings-toggle">
                {printSettingsExpanded ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
                {printSettingsExpanded
                  ? t('barcodePrint.settingsExpanded', { defaultValue: 'Open' })
                  : t('barcodePrint.settingsCollapsed', { defaultValue: 'Load' })}
              </span>
            </button>
            <div className="wms-ops-barcode-print__panel-body wms-ops-barcode-print__panel-body--compact space-y-4">
              {!printSettingsExpanded ? (
                <div className="wms-ops-barcode-print__empty min-h-[5rem]">
                  {t('barcodePrint.settingsLazyHint', { defaultValue: 'Missing translation' })}
                </div>
              ) : (
                <>
                  <div>
                    <span className="wms-ops-barcode-print__field-label">{t('barcodePrint.design', { defaultValue: 'Design' })}</span>
                    <OpsFieldShell>
                      <Select value={selectedTemplateId ? String(selectedTemplateId) : ''} onValueChange={(value) => setSelectedTemplateId(Number(value))}>
                        <SelectTrigger className={cn(OPS_FIELD_CLASS, 'h-10 w-full')}>
                          <SelectValue placeholder={t('barcodePrint.selectDesign', { defaultValue: 'Missing translation' })} />
                        </SelectTrigger>
                        <SelectContent className="wms-ops-list-select-content">
                          {(templatesQuery.data?.data ?? []).map((template) => (
                            <SelectItem key={template.id} value={String(template.id)}>
                              {template.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </OpsFieldShell>
                  </div>

                  <div>
                    <span className="wms-ops-barcode-print__field-label">{t('barcodePrint.printer', { defaultValue: 'Printer' })}</span>
                    <OpsFieldShell>
                      <Select value={selectedServerPrinterId} onValueChange={setSelectedServerPrinterId}>
                        <SelectTrigger className={cn(OPS_FIELD_CLASS, 'h-10 w-full')}>
                          <SelectValue placeholder={t('barcodePrint.selectServerPrinter', { defaultValue: 'Missing translation' })} />
                        </SelectTrigger>
                        <SelectContent className="wms-ops-list-select-content">
                          {(serverPrintersQuery.data?.data ?? []).filter((item) => item.isActive).map((printer) => (
                            <SelectItem key={printer.id} value={String(printer.id)}>
                              {printer.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </OpsFieldShell>
                  </div>

                  <div>
                    <span className="wms-ops-barcode-print__field-label">{t('barcodePrint.printerProfile', { defaultValue: 'Profile' })}</span>
                    <OpsFieldShell>
                      <Select value={selectedServerPrinterProfileId} onValueChange={setSelectedServerPrinterProfileId}>
                        <SelectTrigger className={cn(OPS_FIELD_CLASS, 'h-10 w-full')}>
                          <SelectValue placeholder={t('barcodePrint.selectPrinterProfile', { defaultValue: 'Missing translation' })} />
                        </SelectTrigger>
                        <SelectContent className="wms-ops-list-select-content">
                          {availableServerProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={String(profile.id)}>
                              {profile.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </OpsFieldShell>
                  </div>

                  <div>
                    <span className="wms-ops-barcode-print__field-label">{t('barcodePrint.copies', { defaultValue: 'Copies' })}</span>
                    <OpsFieldShell>
                      <Input
                        type="number"
                        min={1}
                        value={copies}
                        onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
                        disabled={!permission.canCreate && !permission.canUpdate}
                        className={cn(OPS_FIELD_CLASS, 'h-10')}
                      />
                    </OpsFieldShell>
                  </div>

                  <div className="wms-ops-barcode-print__actions">
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      onClick={() => printMutation.mutate()}
                      disabled={printMutation.isPending || (!permission.canCreate && !permission.canUpdate)}
                    >
                      <Printer className="size-3.5 shrink-0" aria-hidden />
                      {selectedLineIds.length > 0
                        ? t('barcodePrint.printSelectedLines', { defaultValue: 'Missing translation' })
                        : t('barcodePrint.printSelectedDocuments', { defaultValue: 'Missing translation' })}
                    </OpsActionButton>
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        void serverPrintersQuery.refetch();
                        void printerProfilesQuery.refetch();
                      }}
                    >
                      <RefreshCcw className="size-3.5 shrink-0" aria-hidden />
                      {t('barcodePrint.refreshPrinters', { defaultValue: 'Missing translation' })}
                    </OpsActionButton>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="wms-ops-barcode-print__panel">
            <div className="wms-ops-barcode-print__panel-head">
              <h2 className="wms-ops-barcode-print__panel-title">
                {t('barcodePrint.selectionSummary', { defaultValue: 'Selection summary' })}
              </h2>
            </div>
            <div className="wms-ops-barcode-print__panel-body space-y-2">
              <div className="wms-ops-barcode-print__summary-item">
                <div className="wms-ops-barcode-print__summary-label">{t('barcodePrint.operation', { defaultValue: 'Operation' })}</div>
                <div className="wms-ops-barcode-print__summary-value">{getOperationLabel(sourceModule)}</div>
              </div>
              <div className="wms-ops-barcode-print__summary-item">
                <div className="wms-ops-barcode-print__summary-label">{t('barcodePrint.selectedDocuments', { defaultValue: 'Documents' })}</div>
                <div className="wms-ops-barcode-print__summary-value">{selectedHeaderIds.length}</div>
              </div>
              <div className="wms-ops-barcode-print__summary-item">
                <div className="wms-ops-barcode-print__summary-label">{t('barcodePrint.selectedLines', { defaultValue: 'Lines' })}</div>
                <div className="wms-ops-barcode-print__summary-value">{selectedLineIds.length}</div>
              </div>
              <div className="wms-ops-barcode-print__summary-item">
                <div className="wms-ops-barcode-print__summary-label">{t('barcodePrint.design', { defaultValue: 'Design' })}</div>
                <div className="wms-ops-barcode-print__summary-value">{selectedTemplate?.displayName ?? '-'}</div>
              </div>
              <div className="wms-ops-barcode-print__summary-item">
                <div className="wms-ops-barcode-print__summary-label">{t('barcodePrint.printScope', { defaultValue: 'Print scope' })}</div>
                <div className="wms-ops-barcode-print__summary-value">
                  {selectedLineIds.length > 0 && singleSelectedHeader
                    ? t('barcodePrint.printScopeLines', {
                        defaultValue: '{{count}} lines from {{document}}',
                        document: singleSelectedHeader.title,
                        count: selectedLineIds.length,
                      })
                    : t('barcodePrint.printScopeDocuments', {
                        defaultValue: '{{count}} documents',
                        count: selectedHeaderIds.length,
                      })}
                </div>
              </div>
              <p className="wms-ops-barcode-print__hint pt-1">
                {t('barcodePrint.screenHint', { defaultValue: 'Missing translation' })}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
