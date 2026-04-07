import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductionTransferSuggestedLine } from '../types/production-transfer';

interface Props {
  lines: ProductionTransferSuggestedLine[];
  onApplySelected: (lines: ProductionTransferSuggestedLine[]) => void;
  applyMode: 'append' | 'replace';
  onApplyModeChange: (mode: 'append' | 'replace') => void;
  isLoading?: boolean;
}

export function ProductionTransferSuggestPanel({ lines, onApplySelected, applyMode, onApplyModeChange, isLoading }: Props): ReactElement {
  const { t } = useTranslation();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const lineRoleLabel = (value: ProductionTransferSuggestedLine['lineRole']): string =>
    ({
      ConsumptionSupply: t('productionTransfer.create.suggestPanel.lineRole.consumptionSupply'),
      SemiFinishedMove: t('productionTransfer.create.suggestPanel.lineRole.semiFinishedMove'),
      OutputMove: t('productionTransfer.create.suggestPanel.lineRole.outputMove'),
    })[value];

  const selectedLines = useMemo(
    () =>
      lines.filter((line, index) =>
        selectedKeys.includes(`${line.productionOrderNo}-${line.stockCode}-${line.lineRole}-${index}`)),
    [lines, selectedKeys],
  );

  const toggleLine = (key: string): void => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const selectAll = (): void => {
    setSelectedKeys(lines.map((line, index) => `${line.productionOrderNo}-${line.stockCode}-${line.lineRole}-${index}`));
  };

  const clearSelection = (): void => {
    setSelectedKeys([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('productionTransfer.create.suggestPanel.title')}</CardTitle>
        <CardDescription>{t('productionTransfer.create.suggestPanel.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {t('productionTransfer.create.suggestPanel.hint')}
        </div>
        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {t('productionTransfer.create.suggestPanel.noSuggestions')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.selection')}</TableHead>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.order')}</TableHead>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.lineRole')}</TableHead>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.stock')}</TableHead>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.quantity')}</TableHead>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.source')}</TableHead>
                <TableHead>{t('productionTransfer.create.suggestPanel.columns.target')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={`${line.productionOrderNo}-${line.stockCode}-${index}`}>
                  <TableCell>
                    <Button
                      type="button"
                      variant={selectedKeys.includes(`${line.productionOrderNo}-${line.stockCode}-${line.lineRole}-${index}`) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLine(`${line.productionOrderNo}-${line.stockCode}-${line.lineRole}-${index}`)}
                    >
                      {selectedKeys.includes(`${line.productionOrderNo}-${line.stockCode}-${line.lineRole}-${index}`)
                        ? t('productionTransfer.create.suggestPanel.actions.selected')
                        : t('productionTransfer.create.suggestPanel.actions.select')}
                    </Button>
                  </TableCell>
                  <TableCell>{line.productionOrderNo}</TableCell>
                  <TableCell><Badge variant="secondary">{lineRoleLabel(line.lineRole)}</Badge></TableCell>
                  <TableCell>{line.stockCode}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{line.sourceWarehouseCode || line.sourceCellCode || '-'}</TableCell>
                  <TableCell>{line.targetWarehouseCode || line.targetCellCode || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-44 space-y-2">
              <Label>{t('productionTransfer.create.suggestPanel.applyModeLabel')}</Label>
              <Select value={applyMode} onValueChange={(value) => onApplyModeChange(value as 'append' | 'replace')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="append">{t('productionTransfer.create.suggestPanel.applyMode.append')}</SelectItem>
                  <SelectItem value="replace">{t('productionTransfer.create.suggestPanel.applyMode.replace')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="ghost" onClick={selectAll} disabled={isLoading || lines.length === 0}>
              {t('productionTransfer.create.suggestPanel.actions.selectAll')}
            </Button>
            <Button type="button" variant="ghost" onClick={clearSelection} disabled={isLoading || selectedKeys.length === 0}>
              {t('productionTransfer.create.suggestPanel.actions.clearSelection')}
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={() => onApplySelected(selectedLines)} disabled={isLoading || selectedLines.length === 0}>
            {t('productionTransfer.create.suggestPanel.actions.applySelected')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
