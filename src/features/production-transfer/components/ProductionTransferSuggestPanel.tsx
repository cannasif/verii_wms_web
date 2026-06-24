import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsFieldShell } from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductionTransferSuggestedLine } from '../types/production-transfer';
import { PtFormField, PtSection, PtTerminalBlock } from './production-transfer-ops-ui';

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
    <PtSection
      variant="terminal"
      title={t('productionTransfer.create.suggestPanel.title')}
      subtitle={t('productionTransfer.create.suggestPanel.description')}
    >
      <div className="space-y-4">
        <PtTerminalBlock
          defaultOpen={false}
          title={t('productionTransfer.create.suggestPanel.hintTitle', { defaultValue: 'Kullanım' })}
          body={t('productionTransfer.create.suggestPanel.hint')}
        />
        {lines.length === 0 ? (
          <div className="wms-ops-panel-empty rounded-none border border-dashed p-4 text-sm">
            {t('productionTransfer.create.suggestPanel.noSuggestions')}
          </div>
        ) : (
          <div className="wms-ops-table-wrap overflow-hidden border">
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
                {lines.map((line, index) => {
                  const key = `${line.productionOrderNo}-${line.stockCode}-${line.lineRole}-${index}`;
                  const isSelected = selectedKeys.includes(key);
                  return (
                    <TableRow key={key}>
                      <TableCell className="wms-ops-table-center-col">
                        <OpsActionButton
                          type="button"
                          variant={isSelected ? 'primary' : 'secondary'}
                          onClick={() => toggleLine(key)}
                        >
                          {isSelected
                            ? t('productionTransfer.create.suggestPanel.actions.selected')
                            : t('productionTransfer.create.suggestPanel.actions.select')}
                        </OpsActionButton>
                      </TableCell>
                      <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.productionOrderNo}</TableCell>
                      <TableCell className="wms-ops-table-center-col">
                        <span className="wms-ops-status-badge wms-ops-status-badge--active">{lineRoleLabel(line.lineRole)}</span>
                      </TableCell>
                      <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.stockCode}</TableCell>
                      <TableCell className="wms-ops-table-center-col">{line.quantity}</TableCell>
                      <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.sourceWarehouseCode || line.sourceCellCode || '-'}</TableCell>
                      <TableCell className="wms-ops-table-center-col font-mono text-xs">{line.targetWarehouseCode || line.targetCellCode || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <PtFormField label={t('productionTransfer.create.suggestPanel.applyModeLabel')} className="min-w-44">
              <OpsFieldShell>
                <Select value={applyMode} onValueChange={(value) => onApplyModeChange(value as 'append' | 'replace')}>
                  <SelectTrigger className={OPS_FIELD_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                    <SelectItem value="append">{t('productionTransfer.create.suggestPanel.applyMode.append')}</SelectItem>
                    <SelectItem value="replace">{t('productionTransfer.create.suggestPanel.applyMode.replace')}</SelectItem>
                  </SelectContent>
                </Select>
              </OpsFieldShell>
            </PtFormField>
            <OpsActionButton type="button" variant="secondary" onClick={selectAll} disabled={isLoading || lines.length === 0}>
              {t('productionTransfer.create.suggestPanel.actions.selectAll')}
            </OpsActionButton>
            <OpsActionButton type="button" variant="secondary" onClick={clearSelection} disabled={isLoading || selectedKeys.length === 0}>
              {t('productionTransfer.create.suggestPanel.actions.clearSelection')}
            </OpsActionButton>
          </div>
          <OpsActionButton
            type="button"
            variant="primary"
            onClick={() => onApplySelected(selectedLines)}
            disabled={isLoading || selectedLines.length === 0}
          >
            {t('productionTransfer.create.suggestPanel.actions.applySelected')}
          </OpsActionButton>
        </div>
      </div>
    </PtSection>
  );
}
