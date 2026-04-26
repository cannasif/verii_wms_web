import { type ChangeEvent, type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [supplier, setSupplier] = useState<CustomerLookup | null>(null);
  const [excelRecordNo, setExcelRecordNo] = useState('');
  const [exportRefNo, setExportRefNo] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<SteelGoodReciptAcceptanseExcelRowDto[]>([]);
  const [preview, setPreview] = useState<SteelGoodReciptAcceptanseImportPreviewDto | null>(null);

  useEffect(() => {
    setPageTitle('Sac Mal Kabul Excel Aktarim');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const requestPayload = useMemo<SteelGoodReciptAcceptanseImportPreviewRequestDto | null>(() => {
    if (!supplier || rows.length === 0 || !excelRecordNo.trim() || !fileName.trim()) {
      return null;
    }

    return {
      branchCode: String(supplier.subeKodu || 0),
      supplierId: supplier.id,
      supplierCode: supplier.cariKod,
      supplierName: supplier.cariIsim,
      excelRecordNo: excelRecordNo.trim(),
      exportRefNo: exportRefNo.trim() || null,
      fileName: fileName.trim(),
      rows,
    };
  }, [supplier, rows, excelRecordNo, exportRefNo, fileName]);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!requestPayload) throw new Error('Aktarim verisi hazir degil');
      return steelGoodReciptAcceptanseApi.previewImport(requestPayload);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success('Excel on izleme hazirlandi');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!requestPayload) throw new Error('Aktarim verisi hazir degil');
      return steelGoodReciptAcceptanseApi.commitImport(requestPayload);
    },
    onSuccess: () => {
      toast.success('Sac mal kabul aktarimi tamamlandi');
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
        exportRefNo: exportRefNo.trim() || null,
      })) satisfies SteelGoodReciptAcceptanseExcelRowDto[];

      setRows(mappedRows.filter((row) => row.stockCode || row.serialNo || row.netsisOrderNo));
      setFileName(file.name);
      setPreview(null);
      toast.success(`${mappedRows.length} satir okundu`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Excel okunamadi');
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">Sac Mal Kabul</Badge>
      <FormPageShell
        title="Sac Mal Kabul Excel Aktarimi"
        description="Tedarikciden gelen levha listesini yukleyin, on izleme alin ve D-KODU korumali sekilde sisteme aktarın."
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tedarikci</label>
              <PagedLookupDialog<CustomerLookup>
                open={supplierLookupOpen}
                onOpenChange={setSupplierLookupOpen}
                title="Tedarikci sec"
                placeholder="Tedarikci seciniz"
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
              <label className="text-sm font-medium">Excel Kayit No</label>
              <Input value={excelRecordNo} onChange={(event) => setExcelRecordNo(event.target.value)} placeholder="Excel kayit no" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Ref No</label>
              <Input value={exportRefNo} onChange={(event) => setExportRefNo(event.target.value)} placeholder="Export ref no (opsiyonel)" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Excel Dosyasi</label>
              <Input type="file" accept=".xlsx,.xls" onChange={(event) => void handleFileChange(event)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void previewMutation.mutateAsync()} disabled={!requestPayload || previewMutation.isPending}>
              {previewMutation.isPending ? 'On izleniyor...' : 'On Izleme Al'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void commitMutation.mutateAsync()}
              disabled={!requestPayload || !preview || preview.errorRowCount > 0 || commitMutation.isPending}
            >
              {commitMutation.isPending ? 'Aktariliyor...' : 'Aktarimi Tamamla'}
            </Button>
          </div>

          {preview ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">Toplam Satir: {preview.totalRows}</Badge>
                <Badge variant="secondary">Yeni: {preview.newRowCount}</Badge>
                <Badge variant="secondary">Guncellenecek: {preview.updateRowCount}</Badge>
                <Badge variant={preview.errorRowCount > 0 ? 'destructive' : 'secondary'}>Hata: {preview.errorRowCount}</Badge>
                <Badge variant="secondary">Toplam Beklenen: {preview.totalExpectedQuantity}</Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-left">
                    <tr>
                      <th className="px-3 py-2">Satir</th>
                      <th className="px-3 py-2">Aksiyon</th>
                      <th className="px-3 py-2">D-KODU</th>
                      <th className="px-3 py-2">Stok</th>
                      <th className="px-3 py-2">Levha No</th>
                      <th className="px-3 py-2">Beklenen</th>
                      <th className="px-3 py-2">Durum</th>
                      <th className="px-3 py-2">Hata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.compositeKey} className="border-t border-white/5">
                        <td className="px-3 py-2">{row.rowNumber}</td>
                        <td className="px-3 py-2">{row.actionType}</td>
                        <td className="px-3 py-2">{row.existingDCode ?? '-'}</td>
                        <td className="px-3 py-2">{row.stockCode}</td>
                        <td className="px-3 py-2">{row.serialNo}</td>
                        <td className="px-3 py-2">{row.expectedQuantity}</td>
                        <td className="px-3 py-2">{row.existingStatus ?? '-'}</td>
                        <td className="px-3 py-2 text-rose-300">{row.errors.join(', ') || '-'}</td>
                      </tr>
                    ))}
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
