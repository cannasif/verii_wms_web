import { type ReactElement, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
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
  const query = useServiceCaseTimelineQuery(parsedId);
  const timeline = query.data;
  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const stockId = timeline?.serviceCase.incomingStockId;
      if (!stockId) {
        throw new Error(t('serviceAllocation.recompute.missingStock', { defaultValue: 'Incoming stock is not defined for this case.' }));
      }

      return serviceAllocationApi.recomputeAllocation(stockId, 0);
    },
    onSuccess: (result) => {
      toast.success(
        t('serviceAllocation.recompute.success', {
          defaultValue: 'Allocation recomputed. {{count}} line(s) processed.',
          count: result.processedLineCount,
        }),
      );
      void query.refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.recompute.error', { defaultValue: 'Allocation recompute failed.' }));
    },
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.timeline.title', { defaultValue: 'Service Case Timeline' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/service-allocation/cases')}>
          {t('common.back', { defaultValue: 'Back' })}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/service-allocation/cases/${parsedId}/edit`)}>
            {t('common.edit', { defaultValue: 'Edit' })}
          </Button>
          <Button
            onClick={() => recomputeMutation.mutate()}
            disabled={!timeline?.serviceCase.incomingStockId || recomputeMutation.isPending}
          >
            {recomputeMutation.isPending
              ? t('common.loading', { defaultValue: 'Loading...' })
              : t('serviceAllocation.recompute.action', { defaultValue: 'Recompute Allocation' })}
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
              <div><span className="font-medium">{t('serviceAllocation.customerCode', { defaultValue: 'Customer' })}:</span> {timeline.serviceCase.customerCode}</div>
              <div><span className="font-medium">{t('serviceAllocation.stockCode', { defaultValue: 'Incoming Stock' })}:</span> {timeline.serviceCase.incomingStockCode || '-'}</div>
              <div><span className="font-medium">{t('serviceAllocation.serialNo', { defaultValue: 'Serial No' })}:</span> {timeline.serviceCase.incomingSerialNo || '-'}</div>
              <div><span className="font-medium">{t('serviceAllocation.status', { defaultValue: 'Status' })}:</span> {renderServiceCaseStatus(timeline.serviceCase.status)}</div>
              <div><span className="font-medium">{t('serviceAllocation.receivedAt', { defaultValue: 'Received' })}:</span> {formatDate(timeline.serviceCase.receivedAt)}</div>
              <div><span className="font-medium">{t('serviceAllocation.closedAt', { defaultValue: 'Closed' })}:</span> {formatDate(timeline.serviceCase.closedAt)}</div>
              <div><span className="font-medium">{t('serviceAllocation.timeline.linkCount', { defaultValue: 'Linked Documents' })}:</span> {timeline.timeline.length}</div>
              <div><span className="font-medium">{t('serviceAllocation.timeline.lastMovement', { defaultValue: 'Last Movement' })}:</span> {formatDate(timeline.timeline[0]?.linkedAt)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('serviceAllocation.lines', { defaultValue: 'Case Lines' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('serviceAllocation.lineType', { defaultValue: 'Line Type' })}</TableHead>
                    <TableHead>{t('serviceAllocation.stockCode', { defaultValue: 'Stock Code' })}</TableHead>
                    <TableHead>{t('serviceAllocation.quantity', { defaultValue: 'Quantity' })}</TableHead>
                    <TableHead>{t('serviceAllocation.erpOrderNo', { defaultValue: 'ERP Order No' })}</TableHead>
                    <TableHead>{t('serviceAllocation.erpOrderId', { defaultValue: 'ERP Order Id' })}</TableHead>
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
              <CardTitle>{t('serviceAllocation.timeline.events', { defaultValue: 'Warehouse Timeline' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('serviceAllocation.sequence', { defaultValue: 'Seq' })}</TableHead>
                    <TableHead>{t('serviceAllocation.documentModule', { defaultValue: 'Module' })}</TableHead>
                    <TableHead>{t('serviceAllocation.documentHeaderId', { defaultValue: 'Document Id' })}</TableHead>
                    <TableHead>{t('serviceAllocation.linkPurpose', { defaultValue: 'Purpose' })}</TableHead>
                    <TableHead>{t('serviceAllocation.fromWarehouse', { defaultValue: 'From Wh' })}</TableHead>
                    <TableHead>{t('serviceAllocation.toWarehouse', { defaultValue: 'To Wh' })}</TableHead>
                    <TableHead>{t('serviceAllocation.linkedAt', { defaultValue: 'Linked At' })}</TableHead>
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
