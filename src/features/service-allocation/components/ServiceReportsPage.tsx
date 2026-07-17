import { type ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, ClipboardList, Link2, Wrench } from 'lucide-react';
import { OpsListPageShell, OpsServiceEyebrow, PageState } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { useAllocationQueueQuery } from '../hooks/useAllocationQueueQuery';
import { useDocumentLinksQuery } from '../hooks/useDocumentLinksQuery';
import { useServiceCasesQuery } from '../hooks/useServiceCasesQuery';
import type { AllocationQueueRow, BusinessDocumentLinkRow, ServiceCaseRow } from '../types/service-allocation.types';
import { renderDocumentLinkPurpose, renderDocumentModule, renderServiceCaseStatus } from '../utils/service-allocation-display';
import {
  ServiceReportDistributionPanel,
  ServiceReportFooterStat,
  ServiceReportKpiCard,
  ServiceReportPanel,
  ServiceReportPanelLink,
  ServiceReportTable,
} from './service-reports-ops-ui';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('tr-TR');
}

export function ServiceReportsPage(): ReactElement {
  const { t } = useTranslation(['service-allocation', 'common']);
  const { setPageTitle } = useUIStore();
  const serviceCasesQuery = useServiceCasesQuery({ pageNumber: 1, pageSize: 100, sortBy: 'ReceivedAt', sortDirection: 'desc' });
  const allocationQuery = useAllocationQueueQuery({ pageNumber: 1, pageSize: 100, sortBy: 'PriorityNo', sortDirection: 'asc' });
  const linksQuery = useDocumentLinksQuery({ pageNumber: 1, pageSize: 100, sortBy: 'LinkedAt', sortDirection: 'desc' });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.reports.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const isLoading = serviceCasesQuery.isLoading || allocationQuery.isLoading || linksQuery.isLoading;
  const isError = Boolean(serviceCasesQuery.error || allocationQuery.error || linksQuery.error);

  const cases = serviceCasesQuery.data?.data ?? [];
  const allocations = allocationQuery.data?.data ?? [];
  const links = linksQuery.data?.data ?? [];

  const waitingCases = cases.filter((item) => Number(item.status) === 4);
  const activeRepairCases = cases.filter((item) => Number(item.status) === 5 || Number(item.status) === 3);
  const partialAllocations = allocations.filter((item) => String(item.status).toLowerCase().includes('partial') || Number(item.status) === 3);
  const shipmentLinks = links.filter((item) => String(item.linkPurpose).toLowerCase().includes('shipment') || Number(item.linkPurpose) === 5);

  const caseStatusDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of cases) {
      const key = String(item.status);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  const linkPurposeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of links) {
      const key = String(item.linkPurpose);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([purpose, count]) => ({ purpose, count }))
      .sort((a, b) => b.count - a.count);
  }, [links]);

  const criticalWaitingCases = waitingCases.slice(0, 8);
  const criticalAllocations = partialAllocations.slice(0, 8);
  const recentMovements = links.slice(0, 10);

  return (
    <OpsListPageShell
      eyebrow={<OpsServiceEyebrow module={t('serviceAllocation.breadcrumb.module')} />}
      title={t('serviceAllocation.reports.title')}
      description={t('serviceAllocation.reports.subtitle')}
    >
      {isLoading ? (
        <PageState tone="loading" title={t('common.loading')} />
      ) : isError ? (
        <PageState tone="error" title={t('serviceAllocation.reports.loadError')} />
      ) : (
        <div className="wms-ops-service-reports min-w-0 max-w-full space-y-6">
          <div className="wms-ops-service-reports__kpi-grid">
            <ServiceReportKpiCard
              label={t('serviceAllocation.reports.totalCases')}
              value={cases.length}
              href="/service-allocation/cases"
              actionLabel={t('serviceAllocation.reports.openCases')}
              icon={Wrench}
              tone="default"
            />
            <ServiceReportKpiCard
              label={t('serviceAllocation.reports.waitingParts')}
              value={waitingCases.length}
              href="/service-allocation/cases"
              actionLabel={t('serviceAllocation.reports.reviewWaitingCases')}
              icon={Boxes}
              tone="warn"
            />
            <ServiceReportKpiCard
              label={t('serviceAllocation.reports.partialAllocations')}
              value={partialAllocations.length}
              href="/service-allocation/allocation-queue"
              actionLabel={t('serviceAllocation.reports.openPartialAllocations')}
              icon={ClipboardList}
              tone="info"
            />
            <ServiceReportKpiCard
              label={t('serviceAllocation.reports.documentLinks')}
              value={links.length}
              href="/service-allocation/document-links"
              actionLabel={t('serviceAllocation.reports.openDocumentLinks')}
              icon={Link2}
              tone="success"
            />
          </div>

          <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <ServiceReportPanel
              title={t('serviceAllocation.reports.criticalQueue')}
              actions={<ServiceReportPanelLink to="/service-allocation/allocation-queue" label={t('serviceAllocation.reports.openQueue')} />}
            >
              <div className="space-y-5">
                <ServiceReportTable<ServiceCaseRow>
                  title={t('serviceAllocation.reports.waitingCasesTable')}
                  badge={<span className="wms-ops-status-badge wms-ops-status-badge--pending">{criticalWaitingCases.length}</span>}
                  columns={[
                    { key: 'caseNo', label: t('serviceAllocation.caseNo') },
                    { key: 'customerCode', label: t('serviceAllocation.customerCode') },
                    { key: 'stockCode', label: t('serviceAllocation.stockCode') },
                    { key: 'receivedAt', label: t('serviceAllocation.receivedAt') },
                  ]}
                  rows={criticalWaitingCases}
                  emptyText={t('serviceAllocation.reports.noWaitingCases')}
                  rowKey={(row) => row.id}
                  renderRow={(row) => (
                    <>
                      <td className="font-semibold">{row.caseNo}</td>
                      <td>{row.customerCode}</td>
                      <td>{row.incomingStockCode || '-'}</td>
                      <td>{formatDate(row.receivedAt)}</td>
                    </>
                  )}
                />

                <ServiceReportTable<AllocationQueueRow>
                  title={t('serviceAllocation.reports.partialAllocationTable')}
                  badge={<span className="wms-ops-status-badge wms-ops-status-badge--active">{criticalAllocations.length}</span>}
                  columns={[
                    { key: 'stockCode', label: t('serviceAllocation.stockCode') },
                    { key: 'erpOrderNo', label: t('serviceAllocation.erpOrderNo') },
                    { key: 'quantity', label: t('serviceAllocation.quantity') },
                    { key: 'allocatedQuantity', label: t('serviceAllocation.allocatedQuantity') },
                  ]}
                  rows={criticalAllocations}
                  emptyText={t('serviceAllocation.reports.noPartialAllocations')}
                  rowKey={(row) => row.id}
                  renderRow={(row) => (
                    <>
                      <td className="font-semibold">{row.stockCode}</td>
                      <td>{row.erpOrderNo}</td>
                      <td>{row.requestedQuantity}</td>
                      <td>{row.allocatedQuantity}</td>
                    </>
                  )}
                />
              </div>
            </ServiceReportPanel>

            <div className="min-w-0 space-y-6">
              <ServiceReportDistributionPanel
                title={t('serviceAllocation.reports.caseDistribution')}
                emptyText={t('serviceAllocation.reports.noDistribution')}
                badgeTone="pending"
                items={caseStatusDistribution.map((item) => ({
                  key: item.status,
                  label: renderServiceCaseStatus(item.status),
                  count: item.count,
                }))}
              />
              <ServiceReportDistributionPanel
                title={t('serviceAllocation.reports.linkDistribution')}
                emptyText={t('serviceAllocation.reports.noDistribution')}
                badgeTone="active"
                items={linkPurposeDistribution.map((item) => ({
                  key: item.purpose,
                  label: renderDocumentLinkPurpose(item.purpose),
                  count: item.count,
                }))}
              />
            </div>
          </div>

          <ServiceReportPanel
            title={t('serviceAllocation.reports.recentMovements')}
            actions={(
              <>
                <span className="wms-ops-status-badge wms-ops-status-badge--done">
                  {shipmentLinks.length} {t('serviceAllocation.reports.shipmentLinks')}
                </span>
                <ServiceReportPanelLink to="/service-allocation/document-links" label={t('serviceAllocation.reports.openLinks')} />
              </>
            )}
          >
            <ServiceReportTable<BusinessDocumentLinkRow>
              columns={[
                { key: 'documentModule', label: t('serviceAllocation.documentModule') },
                { key: 'documentHeaderId', label: t('serviceAllocation.documentHeaderId') },
                { key: 'linkPurpose', label: t('serviceAllocation.linkPurpose') },
                { key: 'serviceCaseId', label: t('serviceAllocation.serviceCaseId') },
                { key: 'linkedAt', label: t('serviceAllocation.linkedAt') },
              ]}
              rows={recentMovements}
              emptyText={t('serviceAllocation.reports.noRecentMovements')}
              rowKey={(row) => row.id}
              renderRow={(row) => (
                <>
                  <td className="font-semibold">{renderDocumentModule(row.documentModule)}</td>
                  <td>{row.documentHeaderId}</td>
                  <td>{renderDocumentLinkPurpose(row.linkPurpose)}</td>
                  <td>{row.serviceCaseId ?? '-'}</td>
                  <td>{formatDate(row.linkedAt)}</td>
                </>
              )}
            />
          </ServiceReportPanel>

          <div className="wms-ops-service-reports__footer-grid">
            <ServiceReportFooterStat
              label={t('serviceAllocation.reports.allocationRows')}
              value={allocations.length}
              href="/service-allocation/allocation-queue"
              actionLabel={t('serviceAllocation.reports.openQueue')}
            />
            <ServiceReportFooterStat
              label={t('serviceAllocation.reports.activeRepairCases')}
              value={activeRepairCases.length}
              href="/service-allocation/cases"
              actionLabel={t('serviceAllocation.reports.openCases')}
            />
            <ServiceReportFooterStat
              label={t('serviceAllocation.reports.shipmentLinksCount')}
              value={shipmentLinks.length}
              href="/service-allocation/document-links"
              actionLabel={t('serviceAllocation.reports.openLinks')}
            />
          </div>
        </div>
      )}
    </OpsListPageShell>
  );
}
