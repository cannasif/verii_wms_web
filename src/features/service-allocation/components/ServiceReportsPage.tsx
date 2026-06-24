import { type ReactElement, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Boxes, ClipboardList, Link2, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OpsListPageShell, OpsServiceEyebrow } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { useAllocationQueueQuery } from '../hooks/useAllocationQueueQuery';
import { useDocumentLinksQuery } from '../hooks/useDocumentLinksQuery';
import { useServiceCasesQuery } from '../hooks/useServiceCasesQuery';
import { renderDocumentLinkPurpose, renderDocumentModule, renderServiceCaseStatus } from '../utils/service-allocation-display';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export function ServiceReportsPage(): ReactElement {
  const { t } = useTranslation(["service-allocation", "common"]);
  const { setPageTitle } = useUIStore();
  const serviceCasesQuery = useServiceCasesQuery({ pageNumber: 1, pageSize: 100, sortBy: 'ReceivedAt', sortDirection: 'desc' });
  const allocationQuery = useAllocationQueueQuery({ pageNumber: 1, pageSize: 100, sortBy: 'PriorityNo', sortDirection: 'asc' });
  const linksQuery = useDocumentLinksQuery({ pageNumber: 1, pageSize: 100, sortBy: 'LinkedAt', sortDirection: 'desc' });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.reports.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

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
  const recentMovements = links.slice(0, 8);

  return (
    <OpsListPageShell
      eyebrow={<OpsServiceEyebrow module={t('serviceAllocation.breadcrumb.module')} />}
      title={t('serviceAllocation.reports.title')}
      description={t('serviceAllocation.reports.subtitle')}
    >
      <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="wms-ops-panel overflow-hidden rounded-2xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t('serviceAllocation.reports.totalCases')}
              </CardTitle>
              <Wrench className="size-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{cases.length}</div>
            <Button asChild variant="link" className="mt-3 h-auto px-0 text-slate-700">
              <Link to="/service-allocation/cases">
                {t('serviceAllocation.reports.openCases')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="wms-ops-panel overflow-hidden rounded-2xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-800">
                {t('serviceAllocation.reports.waitingParts')}
              </CardTitle>
              <Boxes className="size-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-amber-900">{waitingCases.length}</div>
            <Button asChild variant="link" className="mt-3 h-auto px-0 text-amber-800">
              <Link to="/service-allocation/cases">
                {t('serviceAllocation.reports.reviewWaitingCases')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="wms-ops-panel overflow-hidden rounded-2xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-800">
                {t('serviceAllocation.reports.partialAllocations')}
              </CardTitle>
              <ClipboardList className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-blue-900">{partialAllocations.length}</div>
            <Button asChild variant="link" className="mt-3 h-auto px-0 text-blue-800">
              <Link to="/service-allocation/allocation-queue">
                {t('serviceAllocation.reports.openPartialAllocations')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="wms-ops-panel overflow-hidden rounded-2xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-800">
                {t('serviceAllocation.reports.documentLinks')}
              </CardTitle>
              <Link2 className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-900">{links.length}</div>
            <Button asChild variant="link" className="mt-3 h-auto px-0 text-emerald-800">
              <Link to="/service-allocation/document-links">
                {t('serviceAllocation.reports.openDocumentLinks')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="wms-ops-panel rounded-2xl border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('serviceAllocation.reports.criticalQueue')}</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/service-allocation/allocation-queue">
                {t('serviceAllocation.reports.openQueue')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">
                  {t('serviceAllocation.reports.waitingCasesTable')}
                </h3>
                <Badge variant="secondary">{criticalWaitingCases.length}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('serviceAllocation.caseNo')}</TableHead>
                    <TableHead>{t('serviceAllocation.customerCode')}</TableHead>
                    <TableHead>{t('serviceAllocation.stockCode')}</TableHead>
                    <TableHead>{t('serviceAllocation.receivedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalWaitingCases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500">
                        {t('serviceAllocation.reports.noWaitingCases')}
                      </TableCell>
                    </TableRow>
                  ) : criticalWaitingCases.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.caseNo}</TableCell>
                      <TableCell>{item.customerCode}</TableCell>
                      <TableCell>{item.incomingStockCode || '-'}</TableCell>
                      <TableCell>{formatDate(item.receivedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">
                  {t('serviceAllocation.reports.partialAllocationTable')}
                </h3>
                <Badge variant="secondary">{criticalAllocations.length}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('serviceAllocation.stockCode')}</TableHead>
                    <TableHead>{t('serviceAllocation.erpOrderNo')}</TableHead>
                    <TableHead>{t('serviceAllocation.quantity')}</TableHead>
                    <TableHead>{t('serviceAllocation.allocatedQuantity')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalAllocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500">
                        {t('serviceAllocation.reports.noPartialAllocations')}
                      </TableCell>
                    </TableRow>
                  ) : criticalAllocations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.stockCode}</TableCell>
                      <TableCell>{item.erpOrderNo}</TableCell>
                      <TableCell>{item.requestedQuantity}</TableCell>
                      <TableCell>{item.allocatedQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="wms-ops-panel rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle>{t('serviceAllocation.reports.caseDistribution')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {caseStatusDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">{t('serviceAllocation.reports.noDistribution')}</p>
              ) : caseStatusDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3">
                  <span>{renderServiceCaseStatus(item.status)}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="wms-ops-panel rounded-2xl border shadow-none">
            <CardHeader>
              <CardTitle>{t('serviceAllocation.reports.linkDistribution')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkPurposeDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">{t('serviceAllocation.reports.noDistribution')}</p>
              ) : linkPurposeDistribution.map((item) => (
                <div key={item.purpose} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3">
                  <span>{renderDocumentLinkPurpose(item.purpose)}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('serviceAllocation.reports.recentMovements')}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{shipmentLinks.length} {t('serviceAllocation.reports.shipmentLinks')}</Badge>
            <Button asChild variant="outline" size="sm">
              <Link to="/service-allocation/document-links">
                {t('serviceAllocation.reports.openLinks')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('serviceAllocation.documentModule')}</TableHead>
                <TableHead>{t('serviceAllocation.documentHeaderId')}</TableHead>
                <TableHead>{t('serviceAllocation.linkPurpose')}</TableHead>
                <TableHead>{t('serviceAllocation.serviceCaseId')}</TableHead>
                <TableHead>{t('serviceAllocation.linkedAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    {t('serviceAllocation.reports.noRecentMovements')}
                  </TableCell>
                </TableRow>
              ) : recentMovements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{renderDocumentModule(item.documentModule)}</TableCell>
                  <TableCell>{item.documentHeaderId}</TableCell>
                  <TableCell>{renderDocumentLinkPurpose(item.linkPurpose)}</TableCell>
                  <TableCell>{item.serviceCaseId ?? '-'}</TableCell>
                  <TableCell>{formatDate(item.linkedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="wms-ops-panel rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle>{t('serviceAllocation.reports.allocationRows')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{allocations.length}</div>
            <Button asChild variant="link" className="mt-2 h-auto px-0">
              <Link to="/service-allocation/allocation-queue">
                {t('serviceAllocation.reports.openQueue')}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="wms-ops-panel rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle>{t('serviceAllocation.reports.activeRepairCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeRepairCases.length}</div>
            <Button asChild variant="link" className="mt-2 h-auto px-0">
              <Link to="/service-allocation/cases">
                {t('serviceAllocation.reports.openCases')}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="wms-ops-panel rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle>{t('serviceAllocation.reports.shipmentLinksCount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{shipmentLinks.length}</div>
            <Button asChild variant="link" className="mt-2 h-auto px-0">
              <Link to="/service-allocation/document-links">
                {t('serviceAllocation.reports.openLinks')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </OpsListPageShell>
  );
}
