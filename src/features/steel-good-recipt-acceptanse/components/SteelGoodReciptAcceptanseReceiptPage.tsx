import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormPageShell } from '@/components/shared';
import { localizeStatus } from '@/lib/localize-status';
import { useUIStore } from '@/stores/ui-store';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';

export function SteelGoodReciptAcceptanseReceiptPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    setPageTitle(t('steelGoodReceiptAcceptance.receipt.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const candidatesQuery = useQuery({
    queryKey: ['sgra', 'receipt', 'candidates', search],
    queryFn: () => steelGoodReciptAcceptanseApi.getReceiptCandidatesPaged({ pageNumber: 1, pageSize: 100, search }),
  });

  const headersQuery = useQuery({
    queryKey: ['sgra', 'receipt', 'headers'],
    queryFn: () => steelGoodReciptAcceptanseApi.getReceiptHeadersPaged({ pageNumber: 1, pageSize: 20 }),
  });

  const candidateRows = candidatesQuery.data?.data ?? [];
  const receiptHeaders = headersQuery.data?.data ?? [];

  useEffect(() => {
    setSelectedLineIds((current) => current.filter((id) => candidateRows.some((row) => row.id === id)));
  }, [candidateRows]);

  const selectedRows = useMemo(
    () => candidateRows.filter((row) => selectedLineIds.includes(row.id)),
    [candidateRows, selectedLineIds],
  );

  const summary = useMemo(() => ({
    lineCount: selectedRows.length,
    totalQuantity: selectedRows.reduce((sum, row) => sum + row.approvedQuantity, 0),
    supplierCount: new Set(selectedRows.map((row) => row.supplierCode)).size,
  }), [selectedRows]);

  const createMutation = useMutation({
    mutationFn: () => steelGoodReciptAcceptanseApi.createReceipt({ lineIds: selectedLineIds, note }),
    onSuccess: (header) => {
      toast.success(`${t('steelGoodReceiptAcceptance.receipt.createBtn')}: ${header.documentNo}`);
      setSelectedLineIds([]);
      setNote('');
      void candidatesQuery.refetch();
      void headersQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function toggleLine(id: number): void {
    setSelectedLineIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('steelGoodReceiptAcceptance.badge')}</Badge>
      <FormPageShell
        title={t('steelGoodReceiptAcceptance.receipt.title')}
        description={t('steelGoodReceiptAcceptance.receipt.description')}
      >
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="space-y-4">
              <CardTitle>{t('steelGoodReceiptAcceptance.receipt.title')}</CardTitle>
              <div className="flex gap-3">
                <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.receipt.searchPh')} />
                <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>{t('common.search')}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidateRows.map((row) => (
                <label key={row.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={selectedLineIds.includes(row.id)} onChange={() => toggleLine(row.id)} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">{row.dCode}</Badge>
                      <Badge variant="secondary">{row.stockCode}</Badge>
                      <Badge variant="secondary">{localizeStatus(row.status, t)}</Badge>
                    </div>
                    <div className="font-medium">{row.serialNo}</div>
                    <div className="text-sm text-slate-400">{row.supplierCode} - {row.supplierName}</div>
                    <div className="grid gap-2 text-sm md:grid-cols-4">
                      <div>{t('steelGoodReceiptAcceptance.receipt.expected')}: <span className="font-medium">{row.expectedQuantity}</span></div>
                      <div>{t('steelGoodReceiptAcceptance.receipt.arrived')}: <span className="font-medium">{row.arrivedQuantity}</span></div>
                      <div>{t('steelGoodReceiptAcceptance.receipt.approved')}: <span className="font-medium">{row.approvedQuantity}</span></div>
                      <div>{t('steelGoodReceiptAcceptance.receipt.order')}: <span className="font-medium">{row.netsisOrderNo}/{row.netsisOrderLineNo}</span></div>
                    </div>
                  </div>
                </label>
              ))}
              {!candidatesQuery.isLoading && candidateRows.length === 0 ? (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.receipt.noLines')}</div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{t('steelGoodReceiptAcceptance.receipt.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between"><span>{t('steelGoodReceiptAcceptance.receipt.selLines')}</span><span className="font-medium">{summary.lineCount}</span></div>
                  <div className="flex items-center justify-between"><span>{t('steelGoodReceiptAcceptance.receipt.totalAppr')}</span><span className="font-medium">{summary.totalQuantity}</span></div>
                  <div className="flex items-center justify-between"><span>{t('steelGoodReceiptAcceptance.receipt.supCount')}</span><span className="font-medium">{summary.supplierCount}</span></div>
                </div>
                <div className="space-y-2">
                  <Label>{t('common.description')}</Label>
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.receipt.notePh')} />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={selectedLineIds.length === 0 || createMutation.isPending}
                  onClick={() => void createMutation.mutateAsync()}
                >
                  {createMutation.isPending ? t('steelGoodReceiptAcceptance.receipt.createPending') : t('steelGoodReceiptAcceptance.receipt.createBtn')}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{t('steelGoodReceiptAcceptance.receipt.pageTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {receiptHeaders.map((header) => (
                  <div key={header.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">{header.documentNo}</Badge>
                      <Badge variant="secondary">{localizeStatus(header.status, t)}</Badge>
                    </div>
                    <div className="mt-2 font-medium">{header.supplierCode} - {header.supplierName}</div>
                    <div className="mt-1 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.receipt.lineMeta', { l: header.totalLineCount, q: header.totalReceiptQuantity })}</div>
                  </div>
                ))}
                {!headersQuery.isLoading && receiptHeaders.length === 0 ? (
                  <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.receipt.noHeaders')}</div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
