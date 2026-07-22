import { type ChangeEvent, type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsServiceEyebrow } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
} from '@/features/shared';
import { useUIStore } from '@/stores/ui-store';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { CustomerLookup } from '@/features/shared/api/lookup-types';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SteelGoodReciptAcceptanseExcelRowDto,
  SteelGoodReciptAcceptanseImportPreviewDto,
  SteelGoodReciptAcceptanseImportPreviewRequestDto,
} from '../types/steel-good-recipt-acceptanse.types';

const normalizeHeader = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const headerCandidates = {
  netsisOrderNo: ['Netsis Sip. No', 'Netsis Sipariş No', 'Netsis Siparis No', 'Sipariş No', 'Siparis No', 'FISNO'],
  netsisOrderLineNo: ['Netsis Sip. Sıra No', 'Netsis Sipariş Sıra No', 'Netsis Siparis Sira No', 'Sipariş Sıra No', 'Siparis Sira No', 'SIRA'],
  netsisLineSequenceNo: ['SIRA NO', 'SIRA NO.', 'Sıra No', 'Sira No', 'Kalem Sıra No', 'Kalem Sira No'],
  stockCode: ['Stok Kodu', 'Stok Kod', 'STOK_KODU', 'STOK KODU'],
  stockName: ['Stok Adı', 'Stok Adi', 'Stok İsmi', 'Stok Ismi', 'STOK_ADI', 'STOK ADI'],
  combinedSize: ['Kombine Size', 'Kombine Ölçü', 'Kombine Olcu', 'KOMBINE_SIZE'],
  serialNo: ['Seri No (Levha No)', 'Seri No', 'Levha No', 'SERI_NO_LEVHA', 'SERI NO LEVHA'],
  serialNo2: ['Seri-2 (Poz No)', 'Seri 2', 'Poz No', 'SERI2_POZNO', 'SERI 2 POZ NO'],
  expectedQuantity: ['Miktar(Kg)', 'Miktar (Kg)', 'Miktar Kg', 'Miktar', 'Beklenen Miktar', 'MIKTAR'],
  depotCode: ['Depo Kodu', 'Depo Kod', 'DEPO_KODU', 'DEPO_KOD', 'DEPO KODU'],
  materialQuality: ['Material Quality Malzeme Kalitesi', 'Material Quality', 'Malzeme Kalitesi', 'Kalite'],
  heatNumber: ['Heat Number Döküm/Şarj No', 'Heat Number', 'Döküm/Şarj No', 'Dokum Sarj No', 'Şarj No', 'Sarj No'],
  certificateNumber: ['Certificate Number Sertifika No', 'Certificate Number', 'Sertifika No', 'Sertifika'],
  exportRefNo: ['Export Ref No', 'Export Ref', 'EXPORT_REF_NO', 'EXPORT REF NO'],
} as const;

const knownHeaders = new Set(Object.values(headerCandidates).flat().map(normalizeHeader));
const templateColumns = [
  'Netsis Sip. No',
  'Netsis Sip. Sıra No',
  'SIRA NO',
  'Stok Kodu',
  'Stok Adı',
  'Kombine Size',
  'Seri No (Levha No)',
  'Seri-2 (Poz No)',
  'Miktar(Kg)',
  'Depo Kodu',
  'Material Quality',
  'Heat Number',
  'Certificate Number',
  'Export Ref No',
] as const;

const templateRows = [
  {
    'Netsis Sip. No': 'SIP202600001',
    'Netsis Sip. Sıra No': '1',
    'SIRA NO': '10',
    'Stok Kodu': 'SAC-304-10MM',
    'Stok Adı': '304 Kalite Sac Levha 10MM',
    'Kombine Size': '1500x3000x10',
    'Seri No (Levha No)': 'LVH-2026-0001',
    'Seri-2 (Poz No)': 'POZ-001',
    'Miktar(Kg)': 1250.5,
    'Depo Kodu': '01',
    'Material Quality': '304',
    'Heat Number': 'HEAT-7788',
    'Certificate Number': 'CERT-2026-001',
    'Export Ref No': 'EXP-2026-0001',
  },
  {
    'Netsis Sip. No': 'SIP202600001',
    'Netsis Sip. Sıra No': '2',
    'SIRA NO': '20',
    'Stok Kodu': 'SAC-S235-8MM',
    'Stok Adı': 'S235 Sac Levha 8MM',
    'Kombine Size': '1200x2400x8',
    'Seri No (Levha No)': 'LVH-2026-0002',
    'Seri-2 (Poz No)': 'POZ-002',
    'Miktar(Kg)': 820,
    'Depo Kodu': '01',
    'Material Quality': 'S235',
    'Heat Number': 'HEAT-7789',
    'Certificate Number': 'CERT-2026-002',
    'Export Ref No': 'EXP-2026-0001',
  },
];

const findHeaderRowIndex = (sheet: XLSX.WorkSheet): number => {
  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: false });
  let bestIndex = 0;
  let bestScore = 0;

  sheetRows.slice(0, 25).forEach((row, index) => {
    const score = row.reduce<number>(
      (total, cell) => total + (knownHeaders.has(normalizeHeader(String(cell ?? ''))) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });

  return bestScore >= 2 ? bestIndex : 0;
};

const findValue = (row: Record<string, unknown>, candidates: string[]): string => {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate);
    const match = entries.find(([key]) => normalizeHeader(key) === normalizedCandidate);
    if (match && match[1] != null) {
      return String(match[1]).trim();
    }
  }
  return '';
};

const toDecimal = (value: string): number => {
  if (!value) return 0;
  const compact = value.trim().replace(/\s/g, '');
  const hasComma = compact.includes(',');
  const hasDot = compact.includes('.');

  const normalized =
    hasComma && hasDot
      ? compact.lastIndexOf(',') > compact.lastIndexOf('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(/,/g, '')
      : hasComma
        ? compact.replace(',', '.')
        : compact;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const downloadWorkbook = (workbook: XLSX.WorkBook, fileName: string): void => {
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const downloadTemplate = (): void => {
  const workbook = XLSX.utils.book_new();
  const templateSheet = XLSX.utils.json_to_sheet(templateRows, { header: [...templateColumns] });
  templateSheet['!cols'] = templateColumns.map((column) => ({ wch: Math.max(16, column.length + 4) }));
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Sac Mal Kabul');

  const guideSheet = XLSX.utils.aoa_to_sheet([
    ['Alan', 'Zorunlu', 'Açıklama'],
    ['Tedarikçi', 'Evet', 'Ekrandan seçilir, Excel içine yazılmaz.'],
    ['Excel Kayıt No veya Export Ref No', 'Evet', 'Ekrandan girilebilir; Export Ref No Excel satırlarında da bulunabilir.'],
    ['Netsis Sip. No', 'Evet', 'Netsis sipariş numarası. Örnek: SIP202600001'],
    ['Netsis Sip. Sıra No', 'Evet', 'Netsis sipariş kalem/sıra bilgisi.'],
    ['Stok Kodu', 'Evet', 'WMS/Netsis stok kodu.'],
    ['Seri No (Levha No)', 'Evet', 'Levha/seri benzersiz bilgisidir.'],
    ['Miktar(Kg)', 'Evet', 'Sayı giriniz. Virgül veya nokta desteklenir.'],
    ['Diğer alanlar', 'Hayır', 'Stok adı, kalite, heat, sertifika, depo ve poz no takip/rapor için kullanılır.'],
  ]);
  guideSheet['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 86 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Kullanım Notları');

  downloadWorkbook(workbook, `sac-mal-kabul-sablon-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export function SteelGoodReciptAcceptanseImportPage(): ReactElement {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [supplier, setSupplier] = useState<CustomerLookup | null>(null);
  const [excelRecordNo, setExcelRecordNo] = useState('');
  const [exportRefNo, setExportRefNo] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<SteelGoodReciptAcceptanseExcelRowDto[]>([]);
  const [preview, setPreview] = useState<SteelGoodReciptAcceptanseImportPreviewDto | null>(null);

  const effectiveExportRefNo = useMemo(() => {
    if (exportRefNo.trim()) {
      return exportRefNo.trim();
    }

    const distinctRowExportRefs = Array.from(new Set(rows.map((row) => row.exportRefNo?.trim()).filter(Boolean)));
    return distinctRowExportRefs.length === 1 ? distinctRowExportRefs[0] ?? null : null;
  }, [exportRefNo, rows]);

  const previewByRowNumber = useMemo(() => {
    if (!preview) {
      return new Map<number, SteelGoodReciptAcceptanseImportPreviewDto['rows'][number]>();
    }

    return new Map(preview.rows.map((row) => [row.rowNumber, row]));
  }, [preview]);

  useEffect(() => {
    setPageTitle(t('steelGoodReceiptAcceptance.import.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const requestPayload = useMemo<SteelGoodReciptAcceptanseImportPreviewRequestDto | null>(() => {
    if (!supplier || rows.length === 0 || !fileName.trim() || (!excelRecordNo.trim() && !effectiveExportRefNo)) {
      return null;
    }

    return {
      branchCode: String(supplier.subeKodu || 0),
      supplierId: supplier.id,
      supplierCode: supplier.cariKod,
      supplierName: supplier.cariIsim,
      excelRecordNo: excelRecordNo.trim(),
      exportRefNo: effectiveExportRefNo,
      fileName: fileName.trim(),
      rows,
    };
  }, [supplier, rows, excelRecordNo, effectiveExportRefNo, fileName]);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!requestPayload) throw new Error(t('steelGoodReceiptAcceptance.import.errPayload'));
      return steelGoodReciptAcceptanseApi.previewImport(requestPayload);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success(t('steelGoodReceiptAcceptance.import.previewOk'));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!requestPayload) throw new Error(t('steelGoodReceiptAcceptance.import.errPayload'));
      return steelGoodReciptAcceptanseApi.commitImport(requestPayload);
    },
    onSuccess: () => {
      toast.success(t('steelGoodReceiptAcceptance.import.commitOk'));
      navigate('/sac-mal-kabul/list');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      if (!sheet) throw new Error(t('steelGoodReceiptAcceptance.import.readErr'));

      const headerRowIndex = findHeaderRowIndex(sheet);
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', range: headerRowIndex });

      const mappedRows = jsonRows.map((row, index) => ({
        rowNumber: headerRowIndex + index + 2,
        netsisOrderNo: findValue(row, [...headerCandidates.netsisOrderNo]),
        netsisOrderLineNo: findValue(row, [...headerCandidates.netsisOrderLineNo]),
        netsisLineSequenceNo: findValue(row, [...headerCandidates.netsisLineSequenceNo]) || null,
        stockCode: findValue(row, [...headerCandidates.stockCode]),
        stockName: findValue(row, [...headerCandidates.stockName]) || null,
        combinedSize: findValue(row, [...headerCandidates.combinedSize]) || null,
        serialNo: findValue(row, [...headerCandidates.serialNo]),
        serialNo2: findValue(row, [...headerCandidates.serialNo2]) || null,
        expectedQuantity: toDecimal(findValue(row, [...headerCandidates.expectedQuantity])),
        unit: 'KG',
        depotCode: findValue(row, [...headerCandidates.depotCode]) || null,
        materialQuality: findValue(row, [...headerCandidates.materialQuality]) || null,
        heatNumber: findValue(row, [...headerCandidates.heatNumber]) || null,
        certificateNumber: findValue(row, [...headerCandidates.certificateNumber]) || null,
        exportRefNo: findValue(row, [...headerCandidates.exportRefNo]) || exportRefNo.trim() || null,
      })) satisfies SteelGoodReciptAcceptanseExcelRowDto[];

      const dataRows = mappedRows.filter((row) => row.stockCode || row.serialNo || row.netsisOrderNo);
      setRows(dataRows);
      setFileName(file.name);
      setPreview(null);
      if (dataRows.length === 0) {
        toast.error(t('steelGoodReceiptAcceptance.import.readErr'));
      } else {
        toast.success(t('steelGoodReceiptAcceptance.import.readOk', { n: dataRows.length }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('steelGoodReceiptAcceptance.import.readErr'));
    }
  };

  return (
    <OpsFormPageShell
      className="wms-ops-sac-mal-page"
      eyebrow={<OpsServiceEyebrow module={t('steelGoodReceiptAcceptance.breadcrumb.module')} />}
      title={t('steelGoodReceiptAcceptance.import.title')}
      description={t('steelGoodReceiptAcceptance.import.description')}
    >
      <div className="space-y-6">
        <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.import.title')}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-none border border-dashed border-cyan-300/40 bg-cyan-500/5 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-500">
                {t('steelGoodReceiptAcceptance.import.templateTitle')}
              </p>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {t('steelGoodReceiptAcceptance.import.templateDescription')}
              </p>
            </div>
            <OpsActionButton type="button" variant="secondary" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              {t('steelGoodReceiptAcceptance.import.templateBtn')}
            </OpsActionButton>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.import.supplier')}>
              <PagedLookupDialog<CustomerLookup>
                variant="ops"
                open={supplierLookupOpen}
                onOpenChange={setSupplierLookupOpen}
                title={t('steelGoodReceiptAcceptance.import.dialogTitle')}
                placeholder={t('steelGoodReceiptAcceptance.import.dialogPh')}
                value={supplier ? `${supplier.cariKod} - ${supplier.cariIsim}` : null}
                queryKey={['sgra-suppliers']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
                }
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
                onSelect={(item) => setSupplier(item)}
              />
            </MasterDataOpsFormField>

            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.import.recNo')}>
              <OpsInput value={excelRecordNo} onChange={(event) => setExcelRecordNo(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.import.recNoPh')} />
            </MasterDataOpsFormField>

            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.import.expRef')}>
              <OpsInput value={exportRefNo} onChange={(event) => setExportRefNo(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.import.expRefPh')} />
            </MasterDataOpsFormField>

            <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.import.file')}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => void handleFileChange(event)}
                className="wms-ops-list-field-trigger w-full min-w-0 text-sm file:mr-3 file:border-0 file:bg-transparent file:font-semibold file:uppercase file:tracking-wide"
              />
            </MasterDataOpsFormField>
          </div>

          <div className="wms-ops-actions mt-5 flex flex-wrap gap-3">
            <OpsActionButton type="button" variant="secondary" onClick={() => previewMutation.mutate()} disabled={!requestPayload || previewMutation.isPending}>
              {previewMutation.isPending ? t('steelGoodReceiptAcceptance.import.previewP') : t('steelGoodReceiptAcceptance.import.previewBtn')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              onClick={() => commitMutation.mutate()}
              disabled={!requestPayload || !preview || preview.errorRowCount > 0 || commitMutation.isPending}
            >
              {commitMutation.isPending ? t('steelGoodReceiptAcceptance.import.commitP') : t('steelGoodReceiptAcceptance.import.commitBtn')}
            </OpsActionButton>
          </div>

          {commitMutation.isError ? (
            <div role="alert" className="mt-4 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {commitMutation.error instanceof Error
                ? commitMutation.error.message
                : t('steelGoodReceiptAcceptance.import.errPayload')}
            </div>
          ) : null}
        </MasterDataOpsSection>

        {preview ? (
          <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.import.previewBtn')}>
            <div className="flex flex-wrap gap-2 text-sm">
              <MasterDataOpsFlagChip>{t('steelGoodReceiptAcceptance.import.badgeTotal', { n: preview.totalRows })}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone="info">{t('steelGoodReceiptAcceptance.import.badgeNew', { n: preview.newRowCount })}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone="info">{t('steelGoodReceiptAcceptance.import.badgeUp', { n: preview.updateRowCount })}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone={preview.errorRowCount > 0 ? 'warn' : 'success'}>{t('steelGoodReceiptAcceptance.import.badgeErr', { n: preview.errorRowCount })}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip>{t('steelGoodReceiptAcceptance.import.badgeExp', { n: preview.totalExpectedQuantity })}</MasterDataOpsFlagChip>
            </div>

            <div className="wms-ops-table-wrap mt-4 overflow-x-auto border">
              <table className="wms-ops-table min-w-[120rem] text-sm">
                <thead>
                  <tr>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableRow')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colOrd')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colLineSeq')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colOrderLine')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableSt')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colCombinedSize')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tablePlate')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colSerial2')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableExp')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colDepot')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colMaterialQuality')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colHeatNumber')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colCertificateNumber')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colExportRef')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableAction')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableD')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableStat')}</th>
                      <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.import.tableErr')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((sourceRow) => {
                      const previewRow = previewByRowNumber.get(sourceRow.rowNumber);
                      return (
                        <tr key={sourceRow.rowNumber}>
                          <td className="px-3 py-2">{sourceRow.rowNumber}</td>
                          <td className="px-3 py-2">{sourceRow.netsisOrderNo || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.netsisLineSequenceNo || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.netsisOrderLineNo || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.stockCode || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.combinedSize || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.serialNo || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.serialNo2 || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.expectedQuantity}</td>
                          <td className="px-3 py-2">{sourceRow.depotCode || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.materialQuality || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.heatNumber || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.certificateNumber || '-'}</td>
                          <td className="px-3 py-2">{sourceRow.exportRefNo || '-'}</td>
                          <td className="px-3 py-2">{previewRow?.actionType ?? '-'}</td>
                          <td className="px-3 py-2">{previewRow?.existingDCode ?? '-'}</td>
                          <td className="px-3 py-2">{previewRow?.existingStatus ?? '-'}</td>
                          <td className="px-3 py-2 text-rose-400">{previewRow?.errors.join(', ') || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          </MasterDataOpsSection>
        ) : null}
      </div>
    </OpsFormPageShell>
  );
}
