import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ServiceCaseLineRow } from '../../types/service-allocation.types';
import { renderServiceCaseLineType, renderServiceProcessType } from '../../utils/service-allocation-display';

interface ServiceCaseExistingLinesSectionProps {
  lines: ServiceCaseLineRow[];
}

export function ServiceCaseExistingLinesSection({ lines }: ServiceCaseExistingLinesSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('serviceAllocation.lines', { defaultValue: 'Missing translation' })}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('serviceAllocation.lineType', { defaultValue: 'Missing translation' })}</TableHead>
              <TableHead>{t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' })}</TableHead>
              <TableHead>{t('serviceAllocation.quantity', { defaultValue: 'Missing translation' })}</TableHead>
              <TableHead>{t('serviceAllocation.processType', { defaultValue: 'Missing translation' })}</TableHead>
              <TableHead>{t('serviceAllocation.erpOrderNo', { defaultValue: 'Missing translation' })}</TableHead>
              <TableHead>{t('serviceAllocation.erpOrderId', { defaultValue: 'Missing translation' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{renderServiceCaseLineType(line.lineType)}</TableCell>
                <TableCell>{line.stockCode || '-'}</TableCell>
                <TableCell>{line.quantity}</TableCell>
                <TableCell>{renderServiceProcessType(line.processType)}</TableCell>
                <TableCell>{line.erpOrderNo || '-'}</TableCell>
                <TableCell>{line.erpOrderId || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
