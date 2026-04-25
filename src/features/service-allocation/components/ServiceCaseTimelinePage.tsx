import { type ReactElement, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { serviceAllocationApi } from '../api/service-allocation.api';
import { useServiceCaseTimelineQuery } from '../hooks/useServiceCaseTimelineQuery';
import {
  renderDocumentLinkPurpose,
  renderDocumentModule,
  renderServiceCaseLineType,
  renderServiceCaseStatus,
} from '../utils/service-allocation-display';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export function ServiceCaseTimelinePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = Number(id);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const query = useServiceCaseTimelineQuery(parsedId);
  const timeline = query.data;
  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const stockId = timeline?.serviceCase.incomingStockId;
      if (!stockId) {
        throw new Error(t('serviceAllocation.recompute.missingStock', { defaultValue: 'Missing translation' }));
      }

      return serviceAllocationApi.recomputeAllocation(stockId, 0);
    },
    onSuccess: (result) => {
      toast.success(
        t('serviceAllocation.recompute.success', {
          defaultValue: 'Missing translation',
          count: result.processedLineCount,
        }),
      );
      void query.refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.recompute.error', { defaultValue: 'Missing translation' }));
    },
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.timeline.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/service-allocation/cases')}>
          {t('common.back', { defaultValue: 'Missing translation' })}
        </Button>
        <div className="flex items-center gap-2">
          {permission.canUpdate ? (
            <Button variant="outline" onClick={() => navigate(`/service-allocation/cases/${parsedId}/edit`)}>
              {t('common.edit', { defaultValue: 'Missing translation' })}
            </Button>
          ) : null}
          <Button
            onClick={() => recomputeMutation.mutate()}
            disabled={!permission.canUpdate || !timeline?.serviceCase.incomingStockId || recomputeMutation.isPending}
          >
            {recomputeMutation.isPending
              ? t('common.loading', { defaultValue: 'Missing translation' })
              : t('serviceAllocation.recompute.action', { defaultValue: 'Missing translation' })}
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <p>{t('common.loading')}</p>
      ) : timeline ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{timeline.serviceCase.caseNo}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div><span className="font-medium">{t('serviceAllocation.customerCode', { defaultValue: 'Missing translation' })}:</span> {timeline.serviceCase.customerCode}</div>
              <div><span className="font-medium">{t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' })}:</span> {timeline.serviceCase.incomingStockCode || '-'}</div>
              <div><span className="font-medium">{t('serviceAllocation.serialNo', { defaultValue: 'Missing translation' })}:</span> {timeline.serviceCase.incomingSerialNo || '-'}</div>
              <div><span className="font-medium">{t('serviceAllocation.status', { defaultValue: 'Missing translation' })}:</span> {renderServiceCaseStatus(timeline.serviceCase.status)}</div>
              <div><span className="font-medium">{t('serviceAllocation.receivedAt', { defaultValue: 'Missing translation' })}:</span> {formatDate(timeline.serviceCase.receivedAt)}</div>
              <div><span className="font-medium">{t('serviceAllocation.closedAt', { defaultValue: 'Missing translation' })}:</span> {formatDate(timeline.serviceCase.closedAt)}</div>
              <div><span className="font-medium">{t('serviceAllocation.timeline.linkCount', { defaultValue: 'Missing translation' })}:</span> {timeline.timeline.length}</div>
              <div><span className="font-medium">{t('serviceAllocation.timeline.lastMovement', { defaultValue: 'Missing translation' })}:</span> {formatDate(timeline.timeline[0]?.linkedAt)}</div>
            </CardContent>
          </Card>

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
                    <TableHead>{t('serviceAllocation.erpOrderNo', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.erpOrderId', { defaultValue: 'Missing translation' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{renderServiceCaseLineType(line.lineType)}</TableCell>
                      <TableCell>{line.stockCode || '-'}</TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>{line.erpOrderNo || '-'}</TableCell>
                      <TableCell>{line.erpOrderId || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('serviceAllocation.timeline.events', { defaultValue: 'Missing translation' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('serviceAllocation.sequence', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.documentModule', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.documentHeaderId', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.linkPurpose', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.fromWarehouse', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.toWarehouse', { defaultValue: 'Missing translation' })}</TableHead>
                    <TableHead>{t('serviceAllocation.linkedAt', { defaultValue: 'Missing translation' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline.timeline.map((event) => (
                    <TableRow key={event.documentLinkId}>
                      <TableCell>{event.sequenceNo}</TableCell>
                      <TableCell>{renderDocumentModule(event.documentModule)}</TableCell>
                      <TableCell>{event.documentHeaderId}</TableCell>
                      <TableCell>{renderDocumentLinkPurpose(event.linkPurpose)}</TableCell>
                      <TableCell>{event.fromWarehouseId ?? '-'}</TableCell>
                      <TableCell>{event.toWarehouseId ?? '-'}</TableCell>
                      <TableCell>{formatDate(event.linkedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
