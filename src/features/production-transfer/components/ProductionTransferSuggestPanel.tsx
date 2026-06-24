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
    <Card className="wms-ops-form-card overflow-hidden rounded-2xl border py-0 shadow-none">
      <CardHeader className="border-b px-4 py-4 sm:px-6">
        <CardTitle className="text-base">{t('productionTransfer.create.suggestPanel.title')}</CardTitle>
        <CardDescription>{t('productionTransfer.create.suggestPanel.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-6 sm:px-6">
        <div className="wms-ops-panel-empty wms-ops-panel-empty--inline rounded-xl border p-4 text-sm">
          {t('productionTransfer.create.suggestPanel.hint')}
        </div>
        {lines.length === 0 ? (
          <div className="wms-ops-panel-empty rounded-xl border border-dashed p-4 text-sm">
            {t('productionTransfer.create.suggestPanel.noSuggestions')}
          </div>
        ) : (
          <div className="wms-ops-table-wrap overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.selection')}</TableHead>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.order')}</TableHead>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.lineRole')}</TableHead>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.stock')}</TableHead>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.quantity')}</TableHead>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.source')}</TableHead>
                  <TableHead className="wms-ops-table-head wms-ops-table-center-col">{t('productionTransfer.create.suggestPanel.columns.target')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={`${line.productionOrderNo}-${line.stockCode}-${index}`}>
                    <TableCell className="wms-ops-table-center-col">
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
                    <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.productionOrderNo}</TableCell>
                    <TableCell className="wms-ops-table-center-col"><Badge variant="secondary">{lineRoleLabel(line.lineRole)}</Badge></TableCell>
                    <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.stockCode}</TableCell>
                    <TableCell className="wms-ops-table-center-col">{line.quantity}</TableCell>
                    <TableCell className="wms-ops-table-center-col">{line.sourceWarehouseCode || line.sourceCellCode || '-'}</TableCell>
                    <TableCell className="wms-ops-table-center-col">{line.targetWarehouseCode || line.targetCellCode || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
