import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsServiceEyebrow, OpsTextarea } from '@/components/shared';
import {
  MasterDataOpsEmptyState,
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
  MasterDataOpsStatGrid,
} from '@/features/shared';
import { localizeStatus } from '@/lib/localize-status';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';

export function SteelGoodReciptAcceptanseReceiptPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search')?.trim() ?? '';
  const pageParam = Number(searchParams.get('page'));
  const pageNumber = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    setPageTitle(t('steelGoodReceiptAcceptance.receipt.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const candidatesQuery = useQuery({
    queryKey: ['sgra', 'receipt', 'candidates', pageNumber, search],
    queryFn: () => steelGoodReciptAcceptanseApi.getReceiptCandidatesPaged({ pageNumber, pageSize: 20, search }),
  });

  const headersQuery = useQuery({
    queryKey: ['sgra', 'receipt', 'headers'],
    queryFn: () => steelGoodReciptAcceptanseApi.getReceiptHeadersPaged({ pageNumber: 1, pageSize: 20 }),
  });

  const candidateRows = useMemo(() => candidatesQuery.data?.data ?? [], [candidatesQuery.data?.data]);
  const receiptHeaders = useMemo(() => headersQuery.data?.data ?? [], [headersQuery.data?.data]);
  const candidateRange = getPagedRange(candidatesQuery.data, 1);

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

  function updateCandidateQuery(nextPage: number, nextSearch = search): void {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(Math.max(1, nextPage)));
      if (nextSearch) next.set('search', nextSearch);
      else next.delete('search');
      return next;
    }, { replace: true });
  }

  function handleSearch(): void {
    const nextSearch = searchInput.trim();
    setSearch(nextSearch);
    updateCandidateQuery(1, nextSearch);
  }

  return (
    <OpsFormPageShell
      className="wms-ops-sac-mal-page"
      eyebrow={<OpsServiceEyebrow module={t('steelGoodReceiptAcceptance.breadcrumb.module')} />}
      title={t('steelGoodReceiptAcceptance.receipt.title')}
      description={t('steelGoodReceiptAcceptance.receipt.description')}
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.receipt.title')}>
          <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.receipt.searchPh')}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="min-w-0 flex-1">
                <OpsInput value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.receipt.searchPh')} />
              </div>
              <OpsActionButton type="button" variant="secondary" onClick={handleSearch}>{t('common.search')}</OpsActionButton>
            </div>
          </MasterDataOpsFormField>

          <div className="mt-4 space-y-3">
            {candidateRows.map((row) => (
              <label key={row.id} className="flex cursor-pointer items-start gap-3 border border-[color-mix(in_oklab,var(--wms-ops-accent)_14%,var(--wms-ops-card-border))] p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--wms-ops-accent)]" checked={selectedLineIds.includes(row.id)} onChange={() => toggleLine(row.id)} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <MasterDataOpsFlagChip>{row.dCode}</MasterDataOpsFlagChip>
                    <MasterDataOpsFlagChip tone="info">{row.stockCode}</MasterDataOpsFlagChip>
                    <MasterDataOpsFlagChip>{localizeStatus(row.status, t)}</MasterDataOpsFlagChip>
                  </div>
                  <div className="font-medium">{row.serialNo}</div>
                  <div className="text-sm opacity-70">{row.supplierCode} - {row.supplierName}</div>
                  <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div>{t('steelGoodReceiptAcceptance.receipt.expected')}: <span className="font-medium">{row.expectedQuantity}</span></div>
                    <div>{t('steelGoodReceiptAcceptance.receipt.arrived')}: <span className="font-medium">{row.arrivedQuantity}</span></div>
                    <div>{t('steelGoodReceiptAcceptance.receipt.approved')}: <span className="font-medium">{row.approvedQuantity}</span></div>
                    <div>{t('steelGoodReceiptAcceptance.receipt.order')}: <span className="font-medium">{row.netsisOrderNo}/{row.netsisOrderLineNo}</span></div>
                  </div>
                </div>
              </label>
            ))}
            {!candidatesQuery.isLoading && candidateRows.length === 0 ? (
              <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.receipt.noLines')}</MasterDataOpsEmptyState>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
              <span>
                {t('common.paginationInfo', {
                  current: candidateRange.from,
                  total: candidateRange.to,
                  totalCount: candidateRange.total,
                  defaultValue: `${candidateRange.from}-${candidateRange.to} / ${candidateRange.total}`,
                })}
              </span>
              <div className="flex gap-2">
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  disabled={!candidatesQuery.data?.hasPreviousPage || candidatesQuery.isFetching}
                  onClick={() => updateCandidateQuery(pageNumber - 1)}
                >
                  {t('common.previous')}
                </OpsActionButton>
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  disabled={!candidatesQuery.data?.hasNextPage || candidatesQuery.isFetching}
                  onClick={() => updateCandidateQuery(pageNumber + 1)}
                >
                  {t('common.next')}
                </OpsActionButton>
              </div>
            </div>
          </div>
        </MasterDataOpsSection>

        <div className="space-y-6">
          <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.receipt.createBtn')}>
            <MasterDataOpsStatGrid
              items={[
                { label: t('steelGoodReceiptAcceptance.receipt.selLines'), value: summary.lineCount },
                { label: t('steelGoodReceiptAcceptance.receipt.totalAppr'), value: summary.totalQuantity },
                { label: t('steelGoodReceiptAcceptance.receipt.supCount'), value: summary.supplierCount },
              ]}
            />
            <MasterDataOpsFormField label={t('common.description')} className="mt-4">
              <OpsTextarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.receipt.notePh')} />
            </MasterDataOpsFormField>
            <div className="wms-ops-actions mt-4">
              <OpsActionButton
                type="button"
                variant="primary"
                className="w-full"
                disabled={selectedLineIds.length === 0 || createMutation.isPending}
                onClick={() => void createMutation.mutateAsync()}
              >
                {createMutation.isPending ? t('steelGoodReceiptAcceptance.receipt.createPending') : t('steelGoodReceiptAcceptance.receipt.createBtn')}
              </OpsActionButton>
            </div>
          </MasterDataOpsSection>

          <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.receipt.pageTitle')}>
            <div className="space-y-3">
              {receiptHeaders.map((header) => (
                <div key={header.id} className="border border-[color-mix(in_oklab,var(--wms-ops-accent)_14%,var(--wms-ops-card-border))] p-4">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <MasterDataOpsFlagChip tone="info">{header.documentNo}</MasterDataOpsFlagChip>
                    <MasterDataOpsFlagChip>{localizeStatus(header.status, t)}</MasterDataOpsFlagChip>
                  </div>
                  <div className="mt-2 font-medium">{header.supplierCode} - {header.supplierName}</div>
                  <div className="mt-1 text-sm opacity-70">{t('steelGoodReceiptAcceptance.receipt.lineMeta', { l: header.totalLineCount, q: header.totalReceiptQuantity })}</div>
                </div>
              ))}
              {!headersQuery.isLoading && receiptHeaders.length === 0 ? (
                <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.receipt.noHeaders')}</MasterDataOpsEmptyState>
              ) : null}
            </div>
          </MasterDataOpsSection>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
