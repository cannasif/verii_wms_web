import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OpsListPageShell, OpsServiceEyebrow } from '@/components/shared';
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
  | 'rowActions'
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
    case 'rowActions':
      return 'DocumentDate';
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

function resolveLineStockCode(line: { stockCode?: string | null; stockId?: number | null }): string {
  return line.stockCode?.trim() || (line.stockId ? `#${line.stockId}` : '-');
}

function resolveLineStockName(line: { stockName?: string | null; description?: string | null }): string {
  return line.stockName?.trim() || line.description?.trim() || '-';
}

function resolveEmployeeText(
  detail: KkdDistributionHeaderDto | null,
  row?: Pick<KkdDistributionListItemDto, 'employeeId' | 'employeeCode' | 'employeeName'> | null,
): string {
  const employeeCode = detail?.employeeCode || row?.employeeCode;
  const employeeName = detail?.employeeName || row?.employeeName;
  if (employeeCode || employeeName) {
    return `${employeeCode || ''}${employeeCode && employeeName ? ' - ' : ''}${employeeName || ''}`.trim();
  }

  const employeeId = detail?.employeeId ?? row?.employeeId;
  return employeeId ? `#${employeeId}` : '-';
}

function resolveWarehouseText(
  value: Pick<KkdDistributionHeaderDto | KkdDistributionListItemDto, 'warehouseId' | 'warehouseCode' | 'warehouseName'> | null | undefined,
): string {
  const warehouseCode = value?.warehouseCode;
  const warehouseName = value?.warehouseName?.trim();
  const hasWarehouseCode = warehouseCode !== null && warehouseCode !== undefined;
  if (hasWarehouseCode || warehouseName) {
    return `${warehouseCode ?? ''}${hasWarehouseCode && warehouseName ? ' - ' : ''}${warehouseName || ''}`.trim();
  }

  return value?.warehouseId ? `#${value.warehouseId}` : '-';
}

function resolveCustomerText(
  value: Pick<KkdDistributionHeaderDto | KkdDistributionListItemDto, 'customerCode' | 'customerName' | 'customerId'> | null | undefined,
): string {
  const customerCode = value?.customerCode?.trim();
  const customerName = value?.customerName?.trim();
  if (customerCode || customerName) {
    return `${customerCode || ''}${customerCode && customerName ? ' - ' : ''}${customerName || ''}`.trim();
  }

  return value?.customerId ? `#${value.customerId}` : '-';
}

function safePdfText(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function fileSafeName(value: string | number | null | undefined): string {
  return safePdfText(value)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
      {
        key: 'rowActions',
        label: t('common.actions'),
        sortable: false,
        headClassName: 'sticky left-0 z-20 w-[176px] min-w-[176px] shadow-[8px_0_16px_-14px_rgba(15,23,42,0.6)]',
        cellClassName: 'sticky left-0 z-10 w-[176px] min-w-[176px] bg-white dark:bg-[#130822] shadow-[8px_0_16px_-14px_rgba(15,23,42,0.6)]',
      },
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
    const pendingWindow = window.open('', '_blank');
    if (pendingWindow) {
      pendingWindow.document.write(`
        <!doctype html>
        <html lang="${escapeHtml(i18n.language || 'tr')}">
          <head>
            <title>${escapeHtml(t('kkd.operational.distributionList.pdfPreparing'))}</title>
            <style>
              body {
                min-height: 100vh;
                margin: 0;
                display: grid;
                place-items: center;
                background: #f8fafc;
                color: #0f172a;
                font-family: Arial, Helvetica, sans-serif;
              }
              .box {
                padding: 28px 32px;
                border: 1px solid #dbe4ef;
                border-radius: 18px;
                background: #fff;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
                text-align: center;
              }
              .title { font-size: 18px; font-weight: 800; }
              .desc { margin-top: 8px; color: #64748b; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="title">${escapeHtml(t('kkd.operational.distributionList.pdfPreparing'))}</div>
              <div class="desc">${escapeHtml(row.documentNo || row.id)}</div>
            </div>
          </body>
        </html>
      `);
      pendingWindow.document.close();
    }

    try {
      const [{ jsPDF: JsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const distribution = await kkdApi.getDistributionById(row.id);
      const employeeName = resolveEmployeeText(distribution, row);
      const warehouseText = resolveWarehouseText({
        warehouseId: distribution.warehouseId || row.warehouseId,
        warehouseCode: distribution.warehouseCode ?? row.warehouseCode,
        warehouseName: distribution.warehouseName ?? row.warehouseName,
      });
      const documentDate = formatDate(distribution.documentDate ?? row.documentDate, dateLocale);
      const generatedDate = formatDate(new Date().toISOString(), dateLocale);
      const lineRows = distribution.lines.length
        ? distribution.lines.map((line, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(resolveLineStockCode(line))}</td>
            <td>${escapeHtml(resolveLineStockName(line))}</td>
            <td class="right">${escapeHtml(line.quantity)}</td>
            <td>${escapeHtml(line.groupName ? `${line.groupCode} - ${line.groupName}` : line.groupCode)}</td>
            <td>${escapeHtml(line.barcode || line.serialNo || line.shelfId)}</td>
          </tr>`).join('')
        : `<tr><td colspan="6" class="empty">${escapeHtml(t('kkd.operational.distributionList.pdfEmptyLines'))}</td></tr>`;

      const element = document.createElement('div');
      element.style.position = 'fixed';
      element.style.left = '-10000px';
      element.style.top = '0';
      element.style.width = '1123px';
      element.style.background = '#ffffff';
      element.innerHTML = `
        <div class="kkd-pdf-form">
          <style>
            .kkd-pdf-form {
              width: 1123px;
              min-height: 794px;
              padding: 44px;
              background: #fff;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
              box-sizing: border-box;
            }
            .kkd-pdf-form * { box-sizing: border-box; }
            .kkd-antet {
              display: grid;
              grid-template-columns: 230px 1fr 230px;
              border: 2px solid #111;
              height: 118px;
            }
            .kkd-antet > div {
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              border-right: 2px solid #111;
              padding: 10px;
            }
            .kkd-antet > div:last-child { border-right: 0; }
            .kkd-municipality {
              color: #1d5f8f;
              font-size: 18px;
              line-height: 1.22;
              font-weight: 800;
              letter-spacing: 0.02em;
            }
            .kkd-title {
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 32px;
              line-height: 1.16;
              font-weight: 900;
              letter-spacing: 0.02em;
            }
            .kkd-izenerji {
              color: #24566a;
              font-size: 28px;
              font-weight: 900;
              letter-spacing: 0.03em;
              position: relative;
            }
            .kkd-izenerji::before {
              content: '';
              position: absolute;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              width: 48px;
              height: 18px;
              background: linear-gradient(135deg, #ff6a00, #f04a23);
              border-radius: 48px 48px 0 0;
              opacity: 0.95;
            }
            .kkd-info {
              margin-top: 26px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 14px;
            }
            .kkd-info-row {
              min-height: 38px;
              display: grid;
              grid-template-columns: 132px 1fr;
              border: 1.5px solid #111;
            }
            .kkd-info-row.full { grid-column: 1 / -1; }
            .kkd-info-row strong {
              display: flex;
              align-items: center;
              padding: 8px 10px;
              background: #f2f2f2;
              border-right: 1.5px solid #111;
              font-size: 12px;
            }
            .kkd-info-row span {
              display: flex;
              align-items: center;
              padding: 8px 10px;
              font-size: 12px;
            }
            .kkd-section-title {
              margin: 24px 0 10px;
              color: #24566a;
              font-size: 15px;
              font-weight: 900;
              letter-spacing: 0.18em;
            }
            .kkd-lines {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 11px;
            }
            .kkd-lines th,
            .kkd-lines td {
              border: 1.2px solid #111;
              padding: 8px 7px;
              vertical-align: middle;
              word-break: break-word;
            }
            .kkd-lines th {
              background: #f2f2f2;
              text-align: center;
              font-weight: 800;
            }
            .kkd-lines .right { text-align: right; }
            .kkd-lines .empty { text-align: center; color: #64748b; }
            .kkd-declaration {
              margin-top: 12px;
              min-height: 84px;
              border: 1.5px solid #111;
              padding: 13px;
              font-size: 12px;
              line-height: 1.55;
            }
            .kkd-signatures {
              margin-top: 34px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 18px;
            }
            .kkd-signature {
              height: 126px;
              border: 1.5px solid #111;
              padding: 16px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-align: center;
              font-size: 12px;
            }
            .kkd-signature h3 { margin: 0; font-size: 13px; }
            .kkd-signature div {
              padding-top: 8px;
              border-top: 1.5px solid #111;
              font-size: 11px;
            }
            .kkd-footer {
              margin-top: 28px;
              display: flex;
              justify-content: space-between;
              color: #475569;
              font-size: 10px;
            }
          </style>
          <div class="kkd-antet">
            <div class="kkd-municipality">İZMİR<br />BÜYÜKŞEHİR<br />BELEDİYESİ</div>
            <div class="kkd-title">İZENERJİ A.Ş.<br />DEMİRBAŞ/SABİT KIYMET ZİMMET FORMU</div>
            <div class="kkd-izenerji">İZENERJİ</div>
          </div>
          <div class="kkd-info">
            <div class="kkd-info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfDocumentNo'))}</strong><span>${escapeHtml(distribution.documentNo || row.documentNo || row.id)}</span></div>
            <div class="kkd-info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfDate'))}</strong><span>${escapeHtml(documentDate)}</span></div>
            <div class="kkd-info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfEmployee'))}</strong><span>${escapeHtml(employeeName)}</span></div>
            <div class="kkd-info-row"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfWarehouse'))}</strong><span>${escapeHtml(warehouseText)}</span></div>
            <div class="kkd-info-row full"><strong>${escapeHtml(t('kkd.operational.distributionList.pdfCustomer'))}</strong><span>${escapeHtml(resolveCustomerText(distribution) !== '-' ? resolveCustomerText(distribution) : resolveCustomerText(row))}</span></div>
          </div>
          <div class="kkd-section-title">${escapeHtml(t('kkd.operational.distributionList.pdfLinesTitle'))}</div>
          <table class="kkd-lines">
            <thead>
              <tr>
                <th style="width: 34px;">#</th>
                <th style="width: 112px;">${escapeHtml(t('kkd.operational.distributionList.stockCode'))}</th>
                <th>${escapeHtml(t('kkd.operational.distributionList.stockName'))}</th>
                <th style="width: 70px;">${escapeHtml(t('kkd.operational.distributionList.quantity'))}</th>
                <th style="width: 102px;">${escapeHtml(t('kkd.operational.distributionList.group'))}</th>
                <th style="width: 150px;">${escapeHtml(t('kkd.operational.distributionList.barcodeSerial'))}</th>
              </tr>
            </thead>
            <tbody>${lineRows}</tbody>
          </table>
          <div class="kkd-section-title">Teslim Beyanı</div>
          <div class="kkd-declaration">${escapeHtml(t('kkd.operational.distributionList.pdfDeclaration'))}</div>
          <div class="kkd-signatures">
            <div class="kkd-signature"><h3>${escapeHtml(t('kkd.operational.distributionList.pdfDeliveredBy'))}</h3><div>${escapeHtml(t('kkd.operational.distributionList.pdfNameDateSignature'))}</div></div>
            <div class="kkd-signature"><h3>${escapeHtml(t('kkd.operational.distributionList.pdfReceivedBy'))}</h3><div>${escapeHtml(t('kkd.operational.distributionList.pdfNameDateSignature'))}</div></div>
            <div class="kkd-signature"><h3>${escapeHtml(t('kkd.operational.distributionList.pdfStamp'))}</h3><div>${escapeHtml(t('kkd.operational.distributionList.pdfStampSignature'))}</div></div>
          </div>
          <div class="kkd-footer">
            <span>${escapeHtml(t('kkd.operational.distributionList.pdfGeneratedAt'))}: ${escapeHtml(generatedDate)}</span>
            <span>${escapeHtml(t('kkd.operational.distributionList.pdfFooter'))}</span>
          </div>
        </div>`;

      document.body.appendChild(element);
      try {
        const canvas = await html2canvas(element.firstElementChild as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
          position -= pdfHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        const fileName = `kkd-zimmet-${fileSafeName(distribution.documentNo || row.documentNo || row.id)}.pdf`;
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        if (pendingWindow) {
          pendingWindow.document.open();
          pendingWindow.document.write(`
            <!doctype html>
            <html lang="${escapeHtml(i18n.language || 'tr')}">
              <head>
                <title>${escapeHtml(fileName)}</title>
                <style>
                  html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    background: #0f172a;
                    font-family: Arial, Helvetica, sans-serif;
                  }
                  .toolbar {
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 0 18px;
                    background: #111827;
                    color: #fff;
                    box-sizing: border-box;
                  }
                  .title {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 14px;
                    font-weight: 700;
                  }
                  .actions {
                    display: flex;
                    gap: 10px;
                    flex: 0 0 auto;
                  }
                  .actions a,
                  .actions button {
                    border: 0;
                    border-radius: 999px;
                    padding: 9px 14px;
                    background: #0ea5e9;
                    color: #fff;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 800;
                    text-decoration: none;
                  }
                  .actions button { background: #334155; }
                  iframe {
                    width: 100%;
                    height: calc(100% - 56px);
                    border: 0;
                    background: #fff;
                  }
                </style>
              </head>
              <body>
                <div class="toolbar">
                  <div class="title">${escapeHtml(fileName)}</div>
                  <div class="actions">
                    <a href="${url}" download="${escapeHtml(fileName)}">İndir</a>
                    <button type="button" onclick="window.print()">Yazdır</button>
                  </div>
                </div>
                <iframe title="${escapeHtml(fileName)}" src="${url}"></iframe>
              </body>
            </html>
          `);
          pendingWindow.document.close();
          pendingWindow.focus();
        } else {
          doc.save(fileName);
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
      } finally {
        document.body.removeChild(element);
      }
    } catch (error) {
      try {
        const [{ jsPDF: JsPDF }, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);
        const autoTable = autoTableModule.default ?? autoTableModule.autoTable;
        const distribution = await kkdApi.getDistributionById(row.id);
        const employeeName = resolveEmployeeText(distribution, row);
        const warehouseText = resolveWarehouseText({
          warehouseId: distribution.warehouseId || row.warehouseId,
          warehouseCode: distribution.warehouseCode ?? row.warehouseCode,
          warehouseName: distribution.warehouseName ?? row.warehouseName,
        });
        const documentNo = distribution.documentNo || row.documentNo || String(row.id);
        const fileName = `kkd-zimmet-${fileSafeName(documentNo)}.pdf`;
        const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 12;

        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.3);
        doc.rect(margin, 10, 60, 28);
        doc.rect(margin + 60, 10, pageWidth - (margin * 2) - 120, 28);
        doc.rect(pageWidth - margin - 60, 10, 60, 28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(29, 95, 143);
        doc.text('IZMIR BUYUKSEHIR', margin + 30, 21, { align: 'center' });
        doc.text('BELEDIYESI', margin + 30, 28, { align: 'center' });
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(18);
        doc.text('IZENERJI A.S.', pageWidth / 2, 21, { align: 'center' });
        doc.text('DEMIRBAS/SABIT KIYMET ZIMMET FORMU', pageWidth / 2, 31, { align: 'center' });
        doc.setTextColor(36, 86, 106);
        doc.setFontSize(18);
        doc.text('IZENERJI', pageWidth - margin - 30, 27, { align: 'center' });

        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const infoY = 48;
        const leftX = margin;
        const rightX = pageWidth / 2 + 4;
        const labelWidth = 34;
        const valueWidth = (pageWidth / 2) - margin - 10 - labelWidth;
        const drawInfo = (x: number, y: number, label: string, value: string): void => {
          doc.rect(x, y, labelWidth, 9);
          doc.rect(x + labelWidth, y, valueWidth, 9);
          doc.setFont('helvetica', 'bold');
          doc.text(label, x + 2, y + 6);
          doc.setFont('helvetica', 'normal');
          doc.text(value || '-', x + labelWidth + 2, y + 6, { maxWidth: valueWidth - 4 });
        };
        drawInfo(leftX, infoY, 'Belge No', safePdfText(documentNo));
        drawInfo(rightX, infoY, 'Tarih', formatDate(distribution.documentDate ?? row.documentDate, dateLocale));
        drawInfo(leftX, infoY + 10, 'Personel', safePdfText(employeeName));
        drawInfo(rightX, infoY + 10, 'Depo', safePdfText(warehouseText));
        drawInfo(leftX, infoY + 20, 'Cari', safePdfText(resolveCustomerText(distribution) !== '-' ? resolveCustomerText(distribution) : resolveCustomerText(row)));

        autoTable(doc, {
          startY: 84,
          head: [['#', 'Stok Kodu', 'Stok Adi', 'Miktar', 'Grup', 'Barkod / Seri / Raf']],
          body: distribution.lines.length
            ? distribution.lines.map((line, index) => [
              String(index + 1),
              resolveLineStockCode(line),
              resolveLineStockName(line),
              safePdfText(line.quantity),
              safePdfText(line.groupName ? `${line.groupCode} - ${line.groupName}` : line.groupCode),
              safePdfText(line.barcode || line.serialNo || line.shelfId),
            ])
            : [['-', 'Kalem yok', '-', '-', '-', '-']],
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: [242, 242, 242], textColor: [17, 24, 39], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            3: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 48 },
          },
          margin: { left: margin, right: margin },
        });

        const signatureY = pageHeight - 42;
        const signatureWidth = (pageWidth - (margin * 2) - 16) / 3;
        ['Teslim Eden', 'Teslim Alan', 'Kase / Imza'].forEach((title, index) => {
          const x = margin + index * (signatureWidth + 8);
          doc.rect(x, signatureY, signatureWidth, 26);
          doc.setFont('helvetica', 'bold');
          doc.text(title, x + signatureWidth / 2, signatureY + 8, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.line(x + 8, signatureY + 20, x + signatureWidth - 8, signatureY + 20);
        });

        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(`Olusturma: ${formatDate(new Date().toISOString(), dateLocale)}`, margin, pageHeight - 6);

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        if (pendingWindow) {
          pendingWindow.document.open();
          pendingWindow.document.write(`
            <!doctype html>
            <html lang="${escapeHtml(i18n.language || 'tr')}">
              <head><title>${escapeHtml(fileName)}</title></head>
              <body style="margin:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;">
                <div style="height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#111827;color:white;box-sizing:border-box;">
                  <strong>${escapeHtml(fileName)}</strong>
                  <span>
                    <a style="border-radius:999px;padding:9px 14px;background:#0ea5e9;color:white;text-decoration:none;font-weight:800;" href="${url}" download="${escapeHtml(fileName)}">İndir</a>
                    <button style="margin-left:8px;border:0;border-radius:999px;padding:9px 14px;background:#334155;color:white;font-weight:800;cursor:pointer;" onclick="window.print()">Yazdır</button>
                  </span>
                </div>
                <iframe title="${escapeHtml(fileName)}" src="${url}" style="width:100%;height:calc(100vh - 56px);border:0;background:white;"></iframe>
              </body>
            </html>
          `);
          pendingWindow.document.close();
          pendingWindow.focus();
        } else {
          doc.save(fileName);
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
      } catch (fallbackError) {
        // Keep the grid usable and expose the real failure for support diagnostics.
        console.error('KKD distribution PDF generation failed', { error, fallbackError });
        if (pendingWindow) {
          const message = fallbackError instanceof Error ? fallbackError.message : error instanceof Error ? error.message : 'Bilinmeyen hata';
          pendingWindow.document.body.innerHTML = `
            <div style="max-width: 640px; margin: 80px auto; padding: 24px; border: 1px solid #fecaca; border-radius: 16px; background: #fff1f2; color: #7f1d1d; font-family: Arial, Helvetica, sans-serif;">
              <h1 style="margin: 0 0 10px; font-size: 18px;">PDF oluşturulamadı</h1>
              <p style="margin: 0 0 12px; font-size: 14px;">Lütfen sayfayı yenileyip tekrar deneyin. Sorun devam ederse dağıtım fişi detayını kontrol edin.</p>
              <code style="display:block;white-space:pre-wrap;font-size:12px;color:#991b1b;">${escapeHtml(message)}</code>
            </div>
          `;
        }
      }
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <OpsListPageShell
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.distributionList.pageTitle')}
      description={t('kkd.operational.distributionList.breadcrumb')}
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.distributionList.gridTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdDistributionListItemDto, DistributionColumnKey>
              variant="ops"
              pageKey="kkd-distribution-list"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'rowActions':
                    return (
                      <div className="flex items-center gap-2" data-no-drag-scroll="true">
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
                    );
                  case 'documentNo':
                    return row.documentNo || '-';
                  case 'documentDate':
                    return formatDate(row.documentDate, dateLocale);
                  case 'customerCode':
                    return resolveCustomerText(row);
                  case 'employee':
                    return row.employeeCode ? `${row.employeeCode} - ${row.employeeName || ''}`.trim() : row.employeeName || '-';
                  case 'warehouseId':
                    return resolveWarehouseText(row);
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
                    {resolveCustomerText(detail)} / {resolveEmployeeText(detail, selectedHeader)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.pdfWarehouse')}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                    {resolveWarehouseText(detail)}
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
                            <Badge>{resolveLineStockCode(line)}</Badge>
                          </div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.stockName')}</p>
                            {resolveLineStockName(line)}
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
    </OpsListPageShell>
  );
}
