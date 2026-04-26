import { type ReactElement, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';

export function SteelGoodReciptAcceptanseListPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPageTitle('Sac Mal Kabul Beklenen Liste');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const query = useQuery({
    queryKey: ['sgra-lines', search],
    queryFn: () => steelGoodReciptAcceptanseApi.getLinesPaged({ pageNumber: 1, pageSize: 50, search }),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">Sac Mal Kabul</Badge>
      <FormPageShell
        title="Beklenen Levha Listesi"
        description="Excel aktarimindaki kolonlari ayni isimlerle izleyin. Tablo saga sola kaydirilabilir."
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="D-KODU, stok, seri veya siparis no ara" />
            <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>Ara</Button>
            <Button type="button" variant="ghost" onClick={() => void query.refetch()}>Yenile</Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[2100px] text-sm">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-3 py-2">Excel Kayit No</th>
                  <th className="px-3 py-2">D-KODU</th>
                  <th className="px-3 py-2">Tedarikci</th>
                  <th className="px-3 py-2">Netsis Sip. No</th>
                  <th className="px-3 py-2">Sira No</th>
                  <th className="px-3 py-2">Netsis Sip. Sira No</th>
                  <th className="px-3 py-2">Stok Kodu</th>
                  <th className="px-3 py-2">Stok Adi</th>
                  <th className="px-3 py-2">Kombine Size</th>
                  <th className="px-3 py-2">Seri No (Levha No)</th>
                  <th className="px-3 py-2">Seri-2 (Poz No)</th>
                  <th className="px-3 py-2">Miktar(Kg)</th>
                  <th className="px-3 py-2">Depo Kodu</th>
                  <th className="px-3 py-2">Material Quality</th>
                  <th className="px-3 py-2">Heat Number</th>
                  <th className="px-3 py-2">Certificate Number</th>
                  <th className="px-3 py-2">Export Ref No</th>
                  <th className="px-3 py-2">Gelen</th>
                  <th className="px-3 py-2">Onaylanan</th>
                  <th className="px-3 py-2">Red</th>
                  <th className="px-3 py-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="px-3 py-2">{row.excelRecordNo || '-'}</td>
                    <td className="px-3 py-2 font-medium">{row.dCode}</td>
                    <td className="px-3 py-2">{row.supplierCode} - {row.supplierName}</td>
                    <td className="px-3 py-2">{row.netsisOrderNo || '-'}</td>
                    <td className="px-3 py-2">{row.netsisLineSequenceNo || '-'}</td>
                    <td className="px-3 py-2">{row.netsisOrderLineNo || '-'}</td>
                    <td className="px-3 py-2">{row.stockCode || '-'}</td>
                    <td className="px-3 py-2">{row.description || '-'}</td>
                    <td className="px-3 py-2">{row.combinedSize || '-'}</td>
                    <td className="px-3 py-2">{row.serialNo || '-'}</td>
                    <td className="px-3 py-2">{row.serialNo2 || '-'}</td>
                    <td className="px-3 py-2">{row.expectedQuantity}</td>
                    <td className="px-3 py-2">{row.depotCode || '-'}</td>
                    <td className="px-3 py-2">{row.materialQuality || '-'}</td>
                    <td className="px-3 py-2">{row.heatNumber || '-'}</td>
                    <td className="px-3 py-2">{row.certificateNumber || '-'}</td>
                    <td className="px-3 py-2">{row.exportRefNo || '-'}</td>
                    <td className="px-3 py-2">{row.arrivedQuantity}</td>
                    <td className="px-3 py-2">{row.approvedQuantity}</td>
                    <td className="px-3 py-2">{row.rejectedQuantity}</td>
                    <td className="px-3 py-2">{row.status}</td>
                  </tr>
                ))}
                {!query.isLoading && rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-400" colSpan={19}>Kayit bulunamadi</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
