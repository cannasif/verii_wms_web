import { type ReactElement, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OpsActionButton, OpsFormPageShell, OpsServiceEyebrow, PageState } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { serviceAllocationApi } from '../api/service-allocation.api';
import { useServiceCaseTimelineQuery } from '../hooks/useServiceCaseTimelineQuery';
import {
  ServiceCaseDetailRow,
  ServiceCaseOpsDataTable,
} from './service-case-form/service-allocation-ops-ui';
import {
  renderDocumentLinkPurpose,
  renderDocumentModule,
  renderServiceCaseLineType,
  renderServiceCaseStatus,
} from '../utils/service-allocation-display';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('tr-TR');
}

export function ServiceCaseTimelinePage(): ReactElement {
  const { t } = useTranslation(['service-allocation', 'common']);
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
        throw new Error(t('serviceAllocation.recompute.missingStock'));
      }

      return serviceAllocationApi.recomputeAllocation(stockId, 0);
    },
    onSuccess: (result) => {
      toast.success(
        t('serviceAllocation.recompute.success', {
          count: result.processedLineCount,
        }),
      );
      void query.refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.recompute.error'));
    },
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.timeline.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  return (
    <OpsFormPageShell
      eyebrow={<OpsServiceEyebrow module={t('serviceAllocation.breadcrumb.module')} />}
      title={timeline?.serviceCase.caseNo ?? t('serviceAllocation.timeline.title')}
      description={t('serviceAllocation.timeline.subtitle')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/service-allocation/cases')}
          >
            {t('common.back')}
          </OpsActionButton>
          {permission.canUpdate ? (
            <OpsActionButton type="button" variant="secondary" onClick={() => navigate(`/service-allocation/cases/${parsedId}/edit`)}>
              {t('common.edit')}
            </OpsActionButton>
          ) : null}
          <OpsActionButton
            type="button"
            variant="primary"
            onClick={() => recomputeMutation.mutate()}
            disabled={!permission.canUpdate || !timeline?.serviceCase.incomingStockId || recomputeMutation.isPending}
          >
            {recomputeMutation.isPending ? t('common.loading') : t('serviceAllocation.recompute.action')}
          </OpsActionButton>
        </div>
      }
    >
      {query.isLoading ? (
        <PageState tone="loading" title={t('common.loading')} />
      ) : query.isError || !timeline ? (
        <PageState tone="error" title={t('serviceAllocation.timeline.loadError')} />
      ) : (
        <div className="wms-ops-detail-dialog space-y-6">
          <div className="grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
            <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
              <h3 className="wms-ops-detail-section-title">{t('serviceAllocation.form.headerSection')}</h3>
              <div className="wms-ops-detail-panel--rows flex-1">
                <ServiceCaseDetailRow label={t('serviceAllocation.caseNo')}>
                  <span className="wms-ops-code-badge">{timeline.serviceCase.caseNo}</span>
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.customerCode')}>
                  {timeline.serviceCase.customerCode}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.status')}>
                  {renderServiceCaseStatus(timeline.serviceCase.status)}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.receivedAt')}>
                  {formatDate(timeline.serviceCase.receivedAt)}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.closedAt')}>
                  {formatDate(timeline.serviceCase.closedAt)}
                </ServiceCaseDetailRow>
              </div>
            </div>

            <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
              <h3 className="wms-ops-detail-section-title">{t('serviceAllocation.stockCode')}</h3>
              <div className="wms-ops-detail-panel--rows flex-1">
                <ServiceCaseDetailRow label={t('serviceAllocation.stockCode')}>
                  {timeline.serviceCase.incomingStockCode || '-'}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.serialNo')}>
                  {timeline.serviceCase.incomingSerialNo || '-'}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.intakeWarehouseId')}>
                  {timeline.serviceCase.intakeWarehouseId ?? '-'}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.currentWarehouseId')}>
                  {timeline.serviceCase.currentWarehouseId ?? '-'}
                </ServiceCaseDetailRow>
              </div>
            </div>

            <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
              <h3 className="wms-ops-detail-section-title">{t('serviceAllocation.timeline.events')}</h3>
              <div className="wms-ops-detail-panel--rows flex-1">
                <ServiceCaseDetailRow label={t('serviceAllocation.timeline.linkCount')}>
                  {timeline.timeline.length}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.timeline.lastMovement')}>
                  {formatDate(timeline.timeline[0]?.linkedAt)}
                </ServiceCaseDetailRow>
              </div>
              {timeline.serviceCase.diagnosisNote ? (
                <div className="wms-ops-detail-panel__body">
                  <div className="wms-ops-detail-row__label mb-2">{t('serviceAllocation.diagnosisNote')}</div>
                  <p className="text-sm leading-6 break-words opacity-90">{timeline.serviceCase.diagnosisNote}</p>
                </div>
              ) : null}
            </div>
          </div>

          <ServiceCaseOpsDataTable
            title={t('serviceAllocation.lines')}
            isEmpty={timeline.lines.length === 0}
            emptyText={t('serviceAllocation.form.noExistingLines')}
            columns={[
              { key: 'lineType', label: t('serviceAllocation.lineType'), className: 'wms-ops-table-center-col' },
              { key: 'stockCode', label: t('serviceAllocation.stockCode'), className: 'wms-ops-table-center-col' },
              { key: 'quantity', label: t('serviceAllocation.quantity'), className: 'wms-ops-table-center-col' },
              { key: 'erpOrderNo', label: t('serviceAllocation.erpOrderNo'), className: 'wms-ops-table-center-col' },
              { key: 'erpOrderId', label: t('serviceAllocation.erpOrderId'), className: 'wms-ops-table-center-col' },
            ]}
          >
            {timeline.lines.map((line) => (
              <tr key={line.id}>
                <td className="wms-ops-table-center-col">{renderServiceCaseLineType(line.lineType)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{line.stockCode || '-'}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{line.quantity}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{line.erpOrderNo || '-'}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{line.erpOrderId || '-'}</td>
              </tr>
            ))}
          </ServiceCaseOpsDataTable>

          <ServiceCaseOpsDataTable
            title={t('serviceAllocation.timeline.events')}
            isEmpty={timeline.timeline.length === 0}
            emptyText={t('serviceAllocation.timeline.noEvents')}
            columns={[
              { key: 'sequenceNo', label: t('serviceAllocation.sequence'), className: 'wms-ops-table-center-col' },
              { key: 'documentModule', label: t('serviceAllocation.documentModule'), className: 'wms-ops-table-center-col' },
              { key: 'documentHeaderId', label: t('serviceAllocation.documentHeaderId'), className: 'wms-ops-table-center-col' },
              { key: 'linkPurpose', label: t('serviceAllocation.linkPurpose'), className: 'wms-ops-table-center-col' },
              { key: 'fromWarehouse', label: t('serviceAllocation.fromWarehouse'), className: 'wms-ops-table-center-col' },
              { key: 'toWarehouse', label: t('serviceAllocation.toWarehouse'), className: 'wms-ops-table-center-col' },
              { key: 'linkedAt', label: t('serviceAllocation.linkedAt'), className: 'wms-ops-table-center-col' },
            ]}
          >
            {timeline.timeline.map((event) => (
              <tr key={event.documentLinkId}>
                <td className="wms-ops-table-center-col font-mono text-xs">{event.sequenceNo}</td>
                <td className="wms-ops-table-center-col">{renderDocumentModule(event.documentModule)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{event.documentHeaderId}</td>
                <td className="wms-ops-table-center-col">{renderDocumentLinkPurpose(event.linkPurpose)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{event.fromWarehouseId ?? '-'}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{event.toWarehouseId ?? '-'}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(event.linkedAt)}</td>
              </tr>
            ))}
          </ServiceCaseOpsDataTable>
        </div>
      )}
    </OpsFormPageShell>
  );
}
