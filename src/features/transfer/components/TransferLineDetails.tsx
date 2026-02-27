import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransferLineSerials } from '../hooks/useTransferLineSerials';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TransferLine } from '../types/transfer';

interface TransferLineDetailsProps {
  line: TransferLine;
}

export function TransferLineDetails({ line }: TransferLineDetailsProps): ReactElement {
  const { t } = useTranslation();
  const { data: lineSerialsData, isLoading } = useTransferLineSerials(line.id);

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('transfer.list.stockCode', 'Stok Kodu')}
              </p>
              <p className="text-base font-semibold">{line.stockCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('transfer.list.quantity', 'Miktar')}
              </p>
              <p className="text-base">
                {line.quantity} {line.unit}
              </p>
            </div>
            {line.yapKod && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('transfer.details.configCode', 'Yapılandırma Kodu')}
                </p>
                <p className="text-base">{line.yapKod}</p>
              </div>
            )}
            {line.description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('goodsReceipt.report.description', 'Açıklama')}
                </p>
                <p className="text-base">{line.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : lineSerialsData?.data && lineSerialsData.data.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold mb-4">
              {t('transfer.list.lineDetails', 'Kalem Detayları')}
            </h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('transfer.list.quantity', 'Miktar')}</TableHead>
                    <TableHead>{t('transfer.list.serialNo', 'Seri No')}</TableHead>
                    <TableHead>{t('transfer.list.serialNo2', 'Seri No 2')}</TableHead>
                    <TableHead>{t('transfer.details.lotNo', 'Parti No')}</TableHead>
                    <TableHead>{t('transfer.details.batchNo', 'Batch No')}</TableHead>
                    <TableHead>{t('transfer.list.sourceCellCode', 'Çıkış Hücre')}</TableHead>
                    <TableHead>{t('transfer.list.targetCellCode', 'Varış Hücre')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineSerialsData.data.map((serial) => (
                    <TableRow key={serial.id}>
                      <TableCell>{serial.quantity}</TableCell>
                      <TableCell>{serial.serialNo || '-'}</TableCell>
                      <TableCell>{serial.serialNo2 || '-'}</TableCell>
                      <TableCell>{serial.serialNo3 || '-'}</TableCell>
                      <TableCell>{serial.serialNo4 || '-'}</TableCell>
                      <TableCell>{serial.sourceCellCode || '-'}</TableCell>
                      <TableCell>{serial.targetCellCode || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

