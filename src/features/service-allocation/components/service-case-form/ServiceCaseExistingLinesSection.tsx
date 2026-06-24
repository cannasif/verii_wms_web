import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceCaseLineRow } from '../../types/service-allocation.types';
import { renderServiceCaseLineType, renderServiceProcessType } from '../../utils/service-allocation-display';
import { ServiceCaseOpsDataTable } from './service-allocation-ops-ui';

interface ServiceCaseExistingLinesSectionProps {
  lines: ServiceCaseLineRow[];
}

export function ServiceCaseExistingLinesSection({ lines }: ServiceCaseExistingLinesSectionProps): ReactElement {
  const { t } = useTranslation(['service-allocation', 'common']);

  return (
    <ServiceCaseOpsDataTable
      title={t('serviceAllocation.lines')}
      isEmpty={lines.length === 0}
      emptyText={t('serviceAllocation.form.noExistingLines')}
      columns={[
        { key: 'lineType', label: t('serviceAllocation.lineType'), className: 'wms-ops-table-center-col' },
        { key: 'stockCode', label: t('serviceAllocation.stockCode'), className: 'wms-ops-table-center-col' },
        { key: 'quantity', label: t('serviceAllocation.quantity'), className: 'wms-ops-table-center-col' },
        { key: 'processType', label: t('serviceAllocation.processType'), className: 'wms-ops-table-center-col' },
        { key: 'erpOrderNo', label: t('serviceAllocation.erpOrderNo'), className: 'wms-ops-table-center-col' },
        { key: 'erpOrderId', label: t('serviceAllocation.erpOrderId'), className: 'wms-ops-table-center-col' },
      ]}
    >
      {lines.map((line) => (
        <tr key={line.id}>
          <td className="wms-ops-table-center-col">{renderServiceCaseLineType(line.lineType)}</td>
          <td className="wms-ops-table-center-col font-mono text-xs">{line.stockCode || '-'}</td>
          <td className="wms-ops-table-center-col font-mono text-xs">{line.quantity}</td>
          <td className="wms-ops-table-center-col">{renderServiceProcessType(line.processType)}</td>
          <td className="wms-ops-table-center-col font-mono text-xs">{line.erpOrderNo || '-'}</td>
          <td className="wms-ops-table-center-col font-mono text-xs">{line.erpOrderId || '-'}</td>
        </tr>
      ))}
    </ServiceCaseOpsDataTable>
  );
}
