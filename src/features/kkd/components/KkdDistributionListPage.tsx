import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { getLocaleForFormatting } from '@/lib/i18n';
import { localizeStatus } from '@/lib/localize-status';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdDistributionHeaderDto, KkdDistributionListItemDto } from '../types/kkd.types';

type DistributionColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'employee'
  | 'warehouseId'
  | 'status'
  | 'sourceChannel'
  | 'lineCount'
  | 'totalQuantity'
  | 'erpStatus';

function mapSortBy(value: DistributionColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'customerCode':
      return 'CustomerCode';
    case 'employee':
      return 'EmployeeCode';
    case 'warehouseId':
      return 'WarehouseId';
    case 'status':
      return 'Status';
    case 'sourceChannel':
      return 'SourceChannel';
    case 'lineCount':
      return 'LineCount';
    case 'totalQuantity':
      return 'TotalQuantity';
    case 'erpStatus':
      return 'ERPIntegrationStatus';
    default:
      return 'DocumentDate';
  }
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale);
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function KkdDistributionListPage(): ReactElement {
  const { t, i18n } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();
  const dateLocale = getLocaleForFormatting(i18n.language);
  const [selectedHeader, setSelectedHeader] = useState<KkdDistributionHeaderDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const pagedGrid = usePagedDataGrid<DistributionColumnKey>({
    pageKey: 'kkd-distribution-list-grid',
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('kkd.operational.distributionList.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'distribution-list', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getDistributions(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const detailQuery = useQuery({
    queryKey: ['kkd', 'distribution-detail', selectedHeader?.id],
    queryFn: () => kkdApi.getDistributionById(selectedHeader!.id),
    enabled: Boolean(selectedHeader?.id),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<DistributionColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('kkd.operational.distributionList.colDocNo') },
      { key: 'documentDate', label: t('kkd.operational.distributionList.colDocDate') },
      { key: 'customerCode', label: t('kkd.operational.distributionList.colCustomer') },
      { key: 'employee', label: t('kkd.operational.distributionList.colEmployee') },
      { key: 'warehouseId', label: t('kkd.operational.distributionList.colWarehouse') },
      { key: 'status', label: t('kkd.operational.distributionList.colStatus') },
      { key: 'sourceChannel', label: t('kkd.operational.distributionList.colSource') },
      { key: 'lineCount', label: t('kkd.operational.distributionList.colLineCount') },
      { key: 'totalQuantity', label: t('kkd.operational.distributionList.colTotalQty') },
      { key: 'erpStatus', label: t('kkd.operational.distributionList.colErpStatus') },
    ],
    [t],
  );

  const detail = detailQuery.data ?? selectedHeader;

  const openDetail = (row: KkdDistributionListItemDto): void => {
    setSelectedHeader({ ...row, lines: [] });
    setDetailOpen(true);
  };

  const openPdf = async (row: KkdDistributionListItemDto): Promise<void> => {
    setPdfLoadingId(row.id);
    try {
      const distribution = await kkdApi.getDistributionById(row.id);
      const employeeName = row.employeeName || `#${row.employeeId}`;
      const documentDate = formatDate(distribution.documentDate ?? row.documentDate, dateLocale);
      const generatedDate = formatDate(new Date().toISOString(), dateLocale);
      const lineRows = distribution.lines.length
        ? distribution.lines.map((line, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(line.stockCode)}</td>
              <td>${escapeHtml(line.stockName)}</td>
              <td class="qty">${escapeHtml(line.quantity)}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="4" class="empty">${escapeHtml(t('kkd.operational.distributionList.pdfEmptyLines'))}</td></tr>`;

      const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=760');
      if (!printWindow) return;

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t('kkd.operational.distributionList.pdfTitle'))}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
    .form { border: 1px solid #111827; min-height: calc(297mm - 32mm); padding: 16px; }
    .top { display: grid; grid-template-columns: 1fr 2fr 1fr; border: 1px solid #111827; }
    .top > div { min-height: 54px; display: flex; align-items: center; justify-content: center; padding: 8px; border-right: 1px solid #111827; text-align: center; }
    .top > div:last-child { border-right: 0; }
    .brand { font-weight: 800; font-size: 18px; letter-spacing: 0.08em; }
    .title { font-weight: 800; font-size: 16px; letter-spacing: 0.04em; }
    .code { flex-direction: column; gap: 3px; align-items: flex-start !important; font-size: 10px; }
    .info { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-row { border: 1px solid #111827; min-height: 34px; display: grid; grid-template-columns: 130px 1fr; }
    .info-row strong { background: #f3f4f6; border-right: 1px solid #111827; display: flex; align-items: center; padding: 8px; }
    .info-row span { display: flex; align-items: center; padding: 8px; }
    .section-title { margin: 22px 0 8px; font-weight: 800; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #111827; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 800; }
    th:first-child, td:first-child { width: 36px; text-align: center; }
    .qty { width: 90px; text-align: right; }
    .empty { text-align: center; color: #6b7280; }
    .declaration { margin-top: 18px; line-height: 1.55; border: 1px solid #111827; padding: 12px; min-height: 70px; }
    .signatures { margin-top: 26px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .signature-box { border: 1px solid #111827; min-height: 124px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; }
    .signature-box h3 { margin: 0; text-align: center; font-size: 12px; }
    .signature-line { border-top: 1px solid #111827; padding-top: 8px; color: #374151; }
    .footer { margin-top: 18px; display: flex; justify-content: space-between; color: #6b7280; font-size: 10px; }
    @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="form">
    <div class="top">
      <div class="brand">V3RII</div>
      <div class="title">${escapeHtml(t('kkd.operational.distributionList.pdfTitle'))}</div>
      <div class="code">
        <div>${escapeHtml(t('kkd.operational.distributionList.pdfDocumentNo'))}: ${escapeHtml(distribution.documentNo || row.documentNo || row.id)}</div>
        <div>${escapeHtml(t('kkd.operational.distributionList.pdfRevision'))}: 00</div>
      </div>
    </div>
    <div class="info">
      <div class="info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfEmployee'))}</strong><span>${escapeHtml(employeeName)}</span></div>
      <div class="info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfDate'))}</strong><span>${escapeHtml(documentDate)}</span></div>
      <div class="info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfCustomer'))}</strong><span>${escapeHtml(distribution.customerCode || row.customerCode)}</span></div>
      <div class="info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfWarehouse'))}</strong><span>#${escapeHtml(distribution.warehouseId || row.warehouseId)}</span></div>
    </div>
    <div class="section-title">${escapeHtml(t('kkd.operational.distributionList.pdfLinesTitle'))}</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${escapeHtml(t('kkd.operational.distributionList.stockCode'))}</th>
          <th>${escapeHtml(t('kkd.operational.distributionList.stockName'))}</th>
          <th class="qty">${escapeHtml(t('kkd.operational.distributionList.quantity'))}</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>
    <div class="declaration">${escapeHtml(t('kkd.operational.distributionList.pdfDeclaration'))}</div>
    <div class="signatures">
      <div class="signature-box"><h3>${escapeHtml(t('kkd.operational.distributionList.pdfDeliveredBy'))}</h3><div class="signature-line">${escapeHtml(t('kkd.operational.distributionList.pdfNameDateSignature'))}</div></div>
      <div class="signature-box"><h3>${escapeHtml(t('kkd.operational.distributionList.pdfReceivedBy'))}</h3><div class="signature-line">${escapeHtml(t('kkd.operational.distributionList.pdfNameDateSignature'))}</div></div>
      <div class="signature-box"><h3>${escapeHtml(t('kkd.operational.distributionList.pdfStamp'))}</h3><div class="signature-line">${escapeHtml(t('kkd.operational.distributionList.pdfStampSignature'))}</div></div>
    </div>
    <div class="footer">
      <span>${escapeHtml(t('kkd.operational.distributionList.pdfGeneratedAt'))}: ${escapeHtml(generatedDate)}</span>
      <span>${escapeHtml(t('kkd.operational.distributionList.pdfFooter'))}</span>
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`);
      printWindow.document.close();
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.kkdOperationsGroup') }, { label: t('kkd.operational.distributionList.breadcrumb'), isActive: true }]} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.distributionList.gridTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdDistributionListItemDto, DistributionColumnKey>
              pageKey="kkd-distribution-list"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'documentNo':
                    return row.documentNo || '-';
                  case 'documentDate':
                    return formatDate(row.documentDate, dateLocale);
                  case 'customerCode':
                    return row.customerCode;
                  case 'employee':
                    return row.employeeCode ? `${row.employeeCode} - ${row.employeeName || ''}`.trim() : row.employeeName || '-';
                  case 'warehouseId':
                    return `#${row.warehouseId}`;
                  case 'status':
                    return localizeStatus(row.status, t);
                  case 'sourceChannel':
                    return row.sourceChannel;
                  case 'lineCount':
                    return row.lineCount;
                  case 'totalQuantity':
                    return row.totalQuantity;
                  case 'erpStatus':
                    return row.erpIntegrationStatus || '-';
                  default:
                    return '-';
                }
              }}
              sortBy={pagedGrid.sortBy}
              sortDirection={pagedGrid.sortDirection}
              onSort={pagedGrid.handleSort}
              actionsHeaderLabel={t('common.actions')}
              renderActionsCell={(row) => (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title={t('common.view')}
                    aria-label={t('common.view')}
                    onClick={() => openDetail(row)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>{t('common.view')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title={t('kkd.operational.distributionList.pdfAction')}
                    aria-label={t('kkd.operational.distributionList.pdfAction')}
                    disabled={pdfLoadingId === row.id}
                    onClick={() => void openPdf(row)}
                  >
                    <FileText className="h-4 w-4" />
                    <span>{pdfLoadingId === row.id ? t('kkd.operational.distributionList.pdfPreparing') : t('kkd.operational.distributionList.pdfAction')}</span>
                  </Button>
                </div>
              )}
              pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
              pageSizeOptions={pagedGrid.pageSizeOptions}
              onPageSizeChange={pagedGrid.handlePageSizeChange}
              pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
              totalPages={query.data?.totalPages ?? 0}
              hasPreviousPage={query.data?.hasPreviousPage ?? false}
              hasNextPage={query.data?.hasNextPage ?? false}
              onPreviousPage={pagedGrid.goToPreviousPage}
              onNextPage={pagedGrid.goToNextPage}
              previousLabel={t('common.previous')}
              nextLabel={t('common.next')}
              paginationInfoText={t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total })}
              isLoading={query.isLoading}
              isError={query.isError}
              errorText={t('kkd.operational.distributionList.errLoad')}
              emptyText={t('kkd.operational.distributionList.empty')}
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: t('kkd.operational.distributionList.searchPh'),
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('kkd.operational.distributionList.detailTitle')}</DialogTitle>
            <DialogDescription>
              {detail?.documentNo || (detail ? t('kkd.operational.distributionList.headerBadge', { id: detail.id }) : t('kkd.operational.distributionList.linesLoading'))}
            </DialogDescription>
          </DialogHeader>

          {detail ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge>{detail.documentNo || t('kkd.operational.distributionList.headerBadge', { id: detail.id })}</Badge>
                <Badge variant="secondary">{localizeStatus(detail.status, t)}</Badge>
                <Badge variant="outline">{detail.sourceChannel}</Badge>
                <Badge variant="outline">{t('kkd.operational.distributionList.erpPrefix')}: {detail.erpIntegrationStatus || '-'}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.customerEmployee')}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                    {detail.customerCode || '-'} / #{detail.employeeId}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.documentCompletion')}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                    {formatDate(detail.documentDate, dateLocale)} / {formatDate(detail.completionDate, dateLocale)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.linesTitle')}</h2>
                {detailQuery.isLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {t('kkd.operational.distributionList.linesLoading')}
                  </div>
                ) : detail.lines.length ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="hidden grid-cols-[1.5fr_2fr_0.7fr_1fr_1.2fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-white/5 dark:text-slate-400 md:grid">
                      <span>{t('kkd.operational.distributionList.stockCode')}</span>
                      <span>{t('kkd.operational.distributionList.stockName')}</span>
                      <span>{t('kkd.operational.distributionList.quantity')}</span>
                      <span>{t('kkd.operational.distributionList.group')}</span>
                      <span>{t('kkd.operational.distributionList.barcodeSerial')}</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-white/10">
                      {detail.lines.map((line) => (
                        <div key={line.id} className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.5fr_2fr_0.7fr_1fr_1.2fr] md:items-center">
                          <div>
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.stockCode')}</p>
                            <Badge>{line.stockCode || '-'}</Badge>
                          </div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.stockName')}</p>
                            {line.stockName || '-'}
                          </div>
                          <div>
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.quantity')}</p>
                            {line.quantity}
                          </div>
                          <div>
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.group')}</p>
                            {line.groupCode ? <Badge variant="secondary">{line.groupName ? `${line.groupCode} - ${line.groupName}` : line.groupCode}</Badge> : '-'}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.barcodeSerial')}</p>
                            {t('kkd.operational.distributionList.lineMeta', { b: line.barcode || '-', s: line.serialNo || '-', r: line.shelfId || '-' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {t('kkd.operational.distributionList.pickDocument')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t('kkd.operational.distributionList.linesLoading')}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
