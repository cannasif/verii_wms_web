import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Printer, RefreshCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { printerManagementApi } from '@/features/printer-management/api/printer-management.api';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
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

type HeaderColumnKey = 'select' | 'documentNo' | 'subtitle' | 'status' | 'documentDate';
type HeaderSortKey = 'id';

interface OperationOption {
  value: BarcodePrintSourceModule;
  label: string;
  description: string;
}

const operationOptions: OperationOption[] = [
  { value: 'goods-receipt', label: 'Mal Kabul', description: 'Tüm mal kabuller' },
  { value: 'transfer', label: 'Transfer', description: 'Depolar arası transferler' },
  { value: 'warehouse-inbound', label: 'Ambar Giriş', description: 'Ambar giriş belgeleri' },
  { value: 'warehouse-outbound', label: 'Ambar Çıkış', description: 'Ambar çıkış belgeleri' },
  { value: 'shipment', label: 'Sevkiyat', description: 'Sevkiyat belgeleri' },
  { value: 'subcontracting-issue', label: 'Fason Çıkış', description: 'Fasona çıkış belgeleri' },
  { value: 'subcontracting-receipt', label: 'Fason Giriş', description: 'Fasondan giriş belgeleri' },
  { value: 'package', label: 'Paketleme', description: 'Paket ve koli belgeleri' },
  { value: 'production-transfer', label: 'Üretim Transfer', description: 'Üretim transfer belgeleri' },
];

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
  const { id } = useParams();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.print-management');
  const initialTemplateId = id ? Number(id) : null;

  const [sourceModule, setSourceModule] = useState<BarcodePrintSourceModule>('goods-receipt');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialTemplateId);
  const [selectedHeaderMap, setSelectedHeaderMap] = useState<Record<number, BarcodeSourceHeaderOption>>({});
  const [selectedLineMap, setSelectedLineMap] = useState<Record<number, BarcodeSourceLineOption>>({});
  const [selectedServerPrinterId, setSelectedServerPrinterId] = useState('');
  const [selectedServerPrinterProfileId, setSelectedServerPrinterProfileId] = useState('');
  const [copies, setCopies] = useState(1);

  const pagedGrid = usePagedDataGrid<HeaderSortKey>({
    pageKey: `barcode-print-${sourceModule}`,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    defaultPageNumber: 0,
    defaultPageSize: 10,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpBarcodePrint', { defaultValue: 'Barkod Yazdır' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    setSelectedHeaderMap({});
    setSelectedLineMap({});
    pagedGrid.setPageNumber(0);
  }, [sourceModule]); // eslint-disable-line react-hooks/exhaustive-deps

  const templatesQuery = useQuery({
    queryKey: ['barcode-designer-templates-for-print-operations'],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplates({ signal }),
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
    enabled: !!selectedTemplateId,
  });

  const headersQuery = useQuery({
    queryKey: ['barcode-print-headers-paged', sourceModule, pagedGrid.queryParams],
    queryFn: () => barcodePrintSourceBrowserApi.getHeadersPaged(sourceModule, pagedGrid.queryParams),
  });

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
  });

  const templatePrinterProfilesQuery = useQuery({
    queryKey: ['barcode-designer-template-printer-profiles-for-print-operations', selectedTemplateId],
    queryFn: ({ signal }) => printerManagementApi.getTemplatePrinterProfiles(selectedTemplateId!, { signal }),
    enabled: !!selectedTemplateId,
  });

  const printerProfilesQuery = useQuery({
    queryKey: ['printer-management-profiles-for-barcode-print-operations'],
    queryFn: ({ signal }) => printerManagementApi.getProfiles(undefined, { signal }),
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
      { key: 'documentNo', label: t('common.documentNo', { defaultValue: 'Belge No' }) },
      { key: 'subtitle', label: t('common.description', { defaultValue: 'Açıklama' }) },
      { key: 'status', label: t('common.status', { defaultValue: 'Durum' }) },
      { key: 'documentDate', label: t('common.date', { defaultValue: 'Tarih' }) },
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
        throw new Error(t('barcodePrint.selectTemplateFirst', { defaultValue: 'Önce bir barkod tasarımı seçin' }));
      }

      if (!selectedServerPrinterId) {
        throw new Error(t('barcodePrint.selectPrinterFirst', { defaultValue: 'Önce bir yazıcı seçin' }));
      }

      if (!selectedServerPrinterProfileId) {
        throw new Error(t('barcodePrint.selectProfileFirst', { defaultValue: 'Önce bir printer profile seçin' }));
      }

      if (selectedHeaderIds.length === 0) {
        throw new Error(t('barcodePrint.selectDocumentFirst', { defaultValue: 'Yazdırmak için en az bir belge seçin' }));
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
        throw new Error(t('barcodePrint.noPrintableLines', { defaultValue: 'Seçili belge için yazdırılabilir satır bulunamadı' }));
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
      toast.success(response.message || t('barcodePrint.printQueued', { defaultValue: 'Baskı işi kuyruğa alındı' }));
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('barcodePrint.printCreateFailed', { defaultValue: 'Baskı işi oluşturulamadı' }));
    },
  });

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'ERP' }) },
          { label: t('sidebar.erpBarcodePrint', { defaultValue: 'Barkod Yazdır' }), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('sidebar.erp', { defaultValue: 'ERP' })}</Badge>
              <Badge variant="secondary">{t('barcodePrint.badge', { defaultValue: 'WMS Print' })}</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {t('sidebar.erpBarcodePrint', { defaultValue: 'Barkod Yazdır' })}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t('barcodePrint.heroDescription', { defaultValue: 'İşlem seçin, paged listeden belge veya belge satırı seçin, tasarım ve yazıcı belirleyip doğrudan baskı kuyruğuna gönderin.' })}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodePrint.operation', { defaultValue: 'İşlem' })}</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{getOperationLabel(sourceModule)}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodePrint.selectedDocuments', { defaultValue: 'Seçili Belge' })}</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{selectedHeaderIds.length}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodePrint.selectedLines', { defaultValue: 'Seçili Satır' })}</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{selectedLineIds.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('barcodePrint.operationAndDocumentList', { defaultValue: 'İşlem ve Belge Listesi' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
                <div className="space-y-2">
                  <Label>{t('barcodePrint.operation', { defaultValue: 'İşlem' })}</Label>
                  <Select value={sourceModule} onValueChange={(value) => setSourceModule(value as BarcodePrintSourceModule)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('barcodePrint.selectOperation', { defaultValue: 'İşlem seç' })} />
                    </SelectTrigger>
                    <SelectContent>
                      {operationOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-900/30">
                  <div className="font-medium text-slate-900 dark:text-white">{getOperationLabel(sourceModule)}</div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300">
                    {operationOptions.find((item) => item.value === sourceModule)?.description}
                  </div>
                </div>
              </div>

              <PagedDataGrid<BarcodeSourceHeaderOption, HeaderColumnKey>
                pageKey={`barcode-print-grid-${sourceModule}`}
                columns={columns}
                rows={currentPageRows}
                rowKey={(row) => row.id}
                renderCell={(row, columnKey) => {
                  switch (columnKey) {
                    case 'select':
                      return (
                        <input
                          type="checkbox"
                          checked={selectedHeaderMap[row.id] != null}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleHeaderSelection(row)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      );
                    case 'documentNo':
                      return <span className="font-medium">{row.title}</span>;
                    case 'subtitle':
                      return row.subtitle ?? '-';
                    case 'status':
                      return <Badge variant="outline">{row.status ?? '-'}</Badge>;
                    case 'documentDate':
                      return formatDate(row.documentDate);
                    default:
                      return null;
                  }
                }}
                onRowClick={(row) => toggleHeaderSelection(row)}
                isLoading={headersQuery.isLoading}
                isError={headersQuery.isError}
                errorText={t('barcodePrint.documentListLoadFailed', { defaultValue: 'Belge listesi yüklenemedi.' })}
                emptyText={t('barcodePrint.documentListEmpty', { defaultValue: 'Bu işlem için belge bulunamadı.' })}
                pageSize={pagedGrid.pageSize}
                pageSizeOptions={pagedGrid.pageSizeOptions}
                onPageSizeChange={pagedGrid.handlePageSizeChange}
                pageNumber={pagedGrid.getDisplayPageNumber(headersQuery.data)}
                totalPages={headersQuery.data?.totalPages ?? 1}
                hasPreviousPage={headersQuery.data?.hasPreviousPage ?? false}
                hasNextPage={headersQuery.data?.hasNextPage ?? false}
                onPreviousPage={pagedGrid.goToPreviousPage}
                onNextPage={pagedGrid.goToNextPage}
                previousLabel={t('common.previous', { defaultValue: 'Önceki' })}
                nextLabel={t('common.next', { defaultValue: 'Sonraki' })}
                paginationInfoText={paginationInfoText}
                search={{
                  value: pagedGrid.searchInput,
                  onValueChange: pagedGrid.searchConfig.onValueChange,
                  onSearchChange: pagedGrid.searchConfig.onSearchChange,
                  placeholder: t('barcodePrint.searchInOperation', { defaultValue: '{{operation}} içinde ara...', operation: getOperationLabel(sourceModule) }),
                }}
                leftSlot={(
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={toggleAllVisibleRows}>
                      {allVisibleRowsSelected
                        ? t('barcodePrint.clearVisible', { defaultValue: 'Görünenleri Kaldır' })
                        : t('barcodePrint.selectVisible', { defaultValue: 'Görünenleri Seç' })}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearSelection} disabled={selectedHeaderIds.length === 0 && selectedLineIds.length === 0}>
                      <Trash2 className="mr-2 size-4" />
                      {t('barcodePrint.clearSelection', { defaultValue: 'Seçimi Temizle' })}
                    </Button>
                  </div>
                )}
                refresh={{
                  onRefresh: () => {
                    void headersQuery.refetch();
                  },
                  isLoading: headersQuery.isFetching,
                  label: t('common.refresh', { defaultValue: 'Yenile' }),
                }}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('barcodePrint.documentLines', { defaultValue: 'Belge Satırları' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {singleSelectedHeader ? (
                <>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-900/30">
                    <div className="font-medium text-slate-900 dark:text-white">{singleSelectedHeader.title}</div>
                    <div className="mt-1 text-slate-600 dark:text-slate-300">
                      {t('barcodePrint.linesHelp', { defaultValue: 'Satır seçersen sadece o satırlar basılır. Seçmezsen belgenin tüm satırları yazdırılır.' })}
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                        <tr>
                          <th className="w-12 px-3 py-3 text-left">
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
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </th>
                          <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-300">{t('common.stock', { defaultValue: 'Stok' })}</th>
                          <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-300">{t('common.description')}</th>
                          <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-300">{t('common.quantity', { defaultValue: 'Miktar' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(linesQuery.data ?? []).map((line) => (
                          <tr
                            key={line.id}
                            className="cursor-pointer border-t border-slate-200/70 hover:bg-slate-50/70 dark:border-white/10 dark:hover:bg-white/[0.03]"
                            onClick={() => toggleLineSelection(line)}
                          >
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedLineMap[line.id] != null}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => toggleLineSelection(line)}
                                className="h-4 w-4 rounded border-slate-300"
                              />
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">{line.title}</td>
                            <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{line.subtitle ?? '-'}</td>
                            <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{line.quantity ?? '-'}</td>
                          </tr>
                        ))}
                        {linesQuery.isLoading ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-slate-500">{t('barcodePrint.linesLoading', { defaultValue: 'Satırlar yükleniyor...' })}</td>
                          </tr>
                        ) : null}
                        {!linesQuery.isLoading && (linesQuery.data ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-slate-500">{t('barcodePrint.linesEmpty', { defaultValue: 'Bu belge için satır bulunamadı.' })}</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300/80 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {t('barcodePrint.selectSingleDocument', { defaultValue: 'Satır bazlı baskı için listeden tek bir belge seç.' })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('barcodePrint.printSettings', { defaultValue: 'Baskı Ayarları' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tasarım</Label>
                <Select value={selectedTemplateId ? String(selectedTemplateId) : ''} onValueChange={(value) => setSelectedTemplateId(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Barkod tasarımı seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {(templatesQuery.data?.data ?? []).map((template) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Yazıcı</Label>
                <Select value={selectedServerPrinterId} onValueChange={setSelectedServerPrinterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sunucu yazıcısı seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {(serverPrintersQuery.data?.data ?? []).filter((item) => item.isActive).map((printer) => (
                      <SelectItem key={printer.id} value={String(printer.id)}>
                        {printer.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Printer Profile</Label>
                <Select value={selectedServerPrinterProfileId} onValueChange={setSelectedServerPrinterProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Printer profile seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServerProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={String(profile.id)}>
                        {profile.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kopya</Label>
                <Input
                  type="number"
                  min={1}
                  value={copies}
                  onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
                  disabled={!permission.canCreate && !permission.canUpdate}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => printMutation.mutate()}
                disabled={printMutation.isPending || (!permission.canCreate && !permission.canUpdate)}
              >
                <Printer className="mr-2 size-4" />
                {selectedLineIds.length > 0 ? 'Seçili Satırları Yazdır' : 'Seçili Belgeleri Yazdır'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  void serverPrintersQuery.refetch();
                  void printerProfilesQuery.refetch();
                }}
              >
                <RefreshCcw className="mr-2 size-4" />
                Yazıcıları Yenile
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Seçim Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">İşlem</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{getOperationLabel(sourceModule)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Seçili Belgeler</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedHeaderIds.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Seçili Satırlar</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedLineIds.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Tasarım</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedTemplate?.displayName ?? '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Baskı Kapsamı</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">
                  {selectedLineIds.length > 0 && singleSelectedHeader
                    ? `${singleSelectedHeader.title} içinden ${selectedLineIds.length} satır`
                    : `${selectedHeaderIds.length} belge`}
                </div>
              </div>
              <div className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                Bu ekran operasyon içindir. Tasarım seçimi yapılır, belge grid’den seçilir ve baskı işi doğrudan kuyruklanır.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
