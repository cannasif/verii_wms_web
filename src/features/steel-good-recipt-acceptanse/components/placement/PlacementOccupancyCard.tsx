import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TFunction } from 'i18next';
import type { SteelGoodReciptAcceptanseLocationOccupancyItemDto } from '../../types/steel-good-recipt-acceptanse.types';

interface PlacementOccupancyCardProps {
  t: TFunction<'common'>;
  items: SteelGoodReciptAcceptanseLocationOccupancyItemDto[];
  isLoading: boolean;
}

export function PlacementOccupancyCard({ t, items, isLoading }: PlacementOccupancyCardProps): ReactElement {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{t('steelGoodReceiptAcceptance.placement.sameLocationTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={`${item.lineId}-${item.dCode}`} className="rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{item.dCode}</Badge>
              <Badge variant="secondary">{item.placementType}</Badge>
              {item.stackOrderNo ? <Badge variant="secondary">{t('steelGoodReceiptAcceptance.placement.stackBadge', { n: item.stackOrderNo })}</Badge> : null}
            </div>
            <div className="mt-2 font-medium">{item.serialNo}</div>
            <div className="text-sm text-slate-400">{item.stockCode} • {item.supplierCode}</div>
          </div>
        ))}
        {!isLoading && items.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.placement.noOther')}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
