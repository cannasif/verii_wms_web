import { type ReactElement, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { localizeStatus } from '@/lib/localize-status';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';

export function SteelGoodReciptAcceptanseListPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPageTitle(t('steelGoodReceiptAcceptance.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['sgra-lines', search],
    queryFn: () => steelGoodReciptAcceptanseApi.getLinesPaged({ pageNumber: 1, pageSize: 50, search }),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('steelGoodReceiptAcceptance.badge')}</Badge>
      <FormPageShell
        title={t('steelGoodReceiptAcceptance.list.title')}
        description={t('steelGoodReceiptAcceptance.list.description')}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.list.searchPh')} />
            <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>{t('common.search')}</Button>
            <Button type="button" variant="ghost" onClick={() => void query.refetch()}>{t('steelGoodReceiptAcceptance.list.refresh')}</Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[2100px] text-sm">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colRecNo')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colD')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colSup')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colOrd')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colLineSeq')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colOrderLine')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colSt')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colStockName')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colCombinedSize')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colPlate')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colSerial2')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colExp')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colDepot')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colMaterialQuality')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colHeatNumber')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colCertificateNumber')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colExportRef')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colArr')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colAp')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colRejected')}</th>
                  <th className="px-3 py-2">{t('steelGoodReceiptAcceptance.list.colStat')}</th>
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
                    <td className="px-3 py-2">{localizeStatus(row.status, t)}</td>
                  </tr>
                ))}
                {!query.isLoading && rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-400" colSpan={21}>{t('steelGoodReceiptAcceptance.list.empty')}</td>
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
