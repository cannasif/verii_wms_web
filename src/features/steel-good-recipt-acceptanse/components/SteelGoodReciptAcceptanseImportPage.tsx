import { type ChangeEvent, type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup } from '@/services/lookup-types';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SteelGoodReciptAcceptanseExcelRowDto,
  SteelGoodReciptAcceptanseImportPreviewDto,
  SteelGoodReciptAcceptanseImportPreviewRequestDto,
} from '../types/steel-good-recipt-acceptanse.types';

const normalizeHeader = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\./g, '')
    .trim();

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
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      const mappedRows = jsonRows.map((row, index) => ({
        rowNumber: index + 2,
        netsisOrderNo: findValue(row, ['Netsis Sip. No', 'FISNO']),
        netsisOrderLineNo: findValue(row, ['Netsis Sip. Sıra No', 'Netsis Sip. Sira No', 'SIRA']),
        netsisLineSequenceNo: findValue(row, ['SIRA NO', 'SIRA NO.']) || null,
        stockCode: findValue(row, ['Stok Kodu', 'STOK_KODU']),
        stockName: findValue(row, ['Stok Adi', 'STOK_ADI']) || null,
        combinedSize: findValue(row, ['Kombine Size', 'KOMBINE_SIZE']) || null,
        serialNo: findValue(row, ['Seri No (Levha No)', 'SERI_NO_LEVHA']),
        serialNo2: findValue(row, ['Seri-2 (Poz No)', 'SERI2_POZNO']) || null,
        expectedQuantity: toDecimal(findValue(row, ['Miktar(Kg)', 'MIKTAR'])),
        unit: 'KG',
        depotCode: findValue(row, ['Depo Kodu', 'DEPO_KODU', 'DEPO_KOD']) || null,
        materialQuality: findValue(row, ['Material Quality Malzeme Kalitesi', 'Material Quality', 'Malzeme Kalitesi']) || null,
        heatNumber: findValue(row, ['Heat Number Döküm/Şarj No', 'Heat Number', 'Döküm/Şarj No']) || null,
        certificateNumber: findValue(row, ['Certificate Number Sertifika No', 'Certificate Number', 'Sertifika No']) || null,
        exportRefNo: findValue(row, ['Export Ref No', 'EXPORT_REF_NO']) || exportRefNo.trim() || null,
      })) satisfies SteelGoodReciptAcceptanseExcelRowDto[];

      setRows(mappedRows.filter((row) => row.stockCode || row.serialNo || row.netsisOrderNo));
      setFileName(file.name);
      setPreview(null);
      toast.success(t('steelGoodReceiptAcceptance.import.readOk', { n: mappedRows.length }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('steelGoodReceiptAcceptance.import.readErr'));
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('steelGoodReceiptAcceptance.badge')}</Badge>
      <FormPageShell
        title={t('steelGoodReceiptAcceptance.import.title')}
        description={t('steelGoodReceiptAcceptance.import.description')}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('steelGoodReceiptAcceptance.import.supplier')}</label>
              <PagedLookupDialog<CustomerLookup>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('steelGoodReceiptAcceptance.import.recNo')}</label>
              <Input value={excelRecordNo} onChange={(event) => setExcelRecordNo(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.import.recNoPh')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('steelGoodReceiptAcceptance.import.expRef')}</label>
              <Input value={exportRefNo} onChange={(event) => setExportRefNo(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.import.expRefPh')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('steelGoodReceiptAcceptance.import.file')}</label>
              <Input type="file" accept=".xlsx,.xls" onChange={(event) => void handleFileChange(event)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void previewMutation.mutateAsync()} disabled={!requestPayload || previewMutation.isPending}>
              {previewMutation.isPending ? t('steelGoodReceiptAcceptance.import.previewP') : t('steelGoodReceiptAcceptance.import.previewBtn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void commitMutation.mutateAsync()}
              disabled={!requestPayload || !preview || preview.errorRowCount > 0 || commitMutation.isPending}
            >
              {commitMutation.isPending ? t('steelGoodReceiptAcceptance.import.commitP') : t('steelGoodReceiptAcceptance.import.commitBtn')}
            </Button>
          </div>

          {preview ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">{t('steelGoodReceiptAcceptance.import.badgeTotal', { n: preview.totalRows })}</Badge>
                <Badge variant="secondary">{t('steelGoodReceiptAcceptance.import.badgeNew', { n: preview.newRowCount })}</Badge>
                <Badge variant="secondary">{t('steelGoodReceiptAcceptance.import.badgeUp', { n: preview.updateRowCount })}</Badge>
                <Badge variant={preview.errorRowCount > 0 ? 'destructive' : 'secondary'}>{t('steelGoodReceiptAcceptance.import.badgeErr', { n: preview.errorRowCount })}</Badge>
                <Badge variant="secondary">{t('steelGoodReceiptAcceptance.import.badgeExp', { n: preview.totalExpectedQuantity })}</Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-left">
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
                        <tr key={sourceRow.rowNumber} className="border-t border-white/5">
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
                          <td className="px-3 py-2 text-rose-300">{previewRow?.errors.join(', ') || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </FormPageShell>
    </div>
  );
}
