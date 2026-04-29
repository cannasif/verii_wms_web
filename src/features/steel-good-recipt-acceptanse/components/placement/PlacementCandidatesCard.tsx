import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TFunction } from 'i18next';
import { localizeStatus } from '@/lib/localize-status';
import type { SteelGoodReciptAcceptanseLineListItemDto } from '../../types/steel-good-recipt-acceptanse.types';

interface PlacementCandidatesCardProps {
  t: TFunction<'common'>;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  candidates: SteelGoodReciptAcceptanseLineListItemDto[];
  selectedLine: SteelGoodReciptAcceptanseLineListItemDto | null;
  onSelectLine: (row: SteelGoodReciptAcceptanseLineListItemDto) => void;
  isLoading: boolean;
}

export function PlacementCandidatesCard({
  t,
  searchInput,
  onSearchInputChange,
  onSearch,
  candidates,
  selectedLine,
  onSelectLine,
  isLoading,
}: PlacementCandidatesCardProps): ReactElement {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-4">
        <CardTitle>{t('steelGoodReceiptAcceptance.placement.title')}</CardTitle>
        <div className="flex gap-3">
          <Input value={searchInput} onChange={(event) => onSearchInputChange(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.searchPh')} />
          <Button type="button" variant="outline" onClick={onSearch}>{t('common.search')}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {candidates.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelectLine(row)}
            className={`w-full rounded-2xl border p-4 text-left ${selectedLine?.id === row.id ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5'}`}
          >
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{row.dCode}</Badge>
              <Badge variant="secondary">{row.stockCode}</Badge>
              <Badge variant="secondary">{localizeStatus(row.status, t)}</Badge>
            </div>
            <div className="mt-2 font-medium">{row.serialNo}</div>
            <div className="text-sm text-slate-400">{row.supplierCode} - {row.supplierName}</div>
            <div className="mt-1 text-sm">{t('steelGoodReceiptAcceptance.placement.approvedQty')}: <span className="font-medium">{row.approvedQuantity}</span></div>
          </button>
        ))}
        {!isLoading && candidates.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.noPending')}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
