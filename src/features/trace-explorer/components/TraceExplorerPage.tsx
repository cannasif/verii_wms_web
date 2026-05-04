import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, BriefcaseBusiness, ClipboardList, Search, Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { traceExplorerApi } from '../api/traceExplorer.api';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function JsonBlock({ value }: { value?: string }): ReactElement {
  if (!value) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <pre className="max-h-56 overflow-auto rounded-md bg-slate-950/95 p-3 text-xs leading-5 text-slate-100">
      {value}
    </pre>
  );
}

export function TraceExplorerPage(): ReactElement {
  const { t } = useTranslation(['trace-explorer', 'common']);
  const { setPageTitle } = useUIStore();
  const [draftTraceId, setDraftTraceId] = useState('');
  const [submittedTraceId, setSubmittedTraceId] = useState('');

  useEffect(() => {
    setPageTitle(t('title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const traceQuery = useQuery({
    queryKey: ['trace-explorer', submittedTraceId],
    queryFn: () => traceExplorerApi.getByTraceId(submittedTraceId),
    enabled: submittedTraceId.trim().length > 0,
    retry: false,
  });

  const supportErrorTraceId = useMemo(() => {
    const error = traceQuery.error as (Error & { traceId?: string }) | null;
    return error?.traceId ?? null;
  }, [traceQuery.error]);

  const timelineItems = useMemo(() => {
    const data = traceQuery.data;
    if (!data) return [];

    return [
      ...data.auditLogs.map((item) => ({
        id: `audit-${item.id}`,
        timestamp: item.createdDate ?? '',
        kind: t('timeline.audit'),
        title: `${item.entityType} · ${item.actionType}`,
        subtitle: item.entityId,
        status: item.result,
      })),
      ...data.jobExecutions.map((item) => ({
        id: `job-exec-${item.id}`,
        timestamp: item.startedAt,
        kind: t('timeline.jobExecution'),
        title: item.jobName,
        subtitle: item.jobId,
        status: item.status,
      })),
      ...data.jobFailures.map((item) => ({
        id: `job-failure-${item.id}`,
        timestamp: item.failedAt,
        kind: t('timeline.jobFailure'),
        title: item.jobName,
        subtitle: item.jobId,
        status: item.reason || item.exceptionType || 'Failed',
      })),
      ...data.notifications.map((item) => ({
        id: `notification-${item.id}`,
        timestamp: item.createdDate ?? item.deliveredAt ?? '',
        kind: t('timeline.notification'),
        title: item.title,
        subtitle: item.channel,
        status: item.isRead ? t('read') : t('unread'),
      })),
      ...data.integrations.map((item) => ({
        id: `integration-${item.id}`,
        timestamp: item.createdDate ?? item.startedAt,
        kind: t('timeline.integration'),
        title: item.operation,
        subtitle: item.targetSystem,
        status: item.status,
      })),
    ]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [traceQuery.data, t]);

  const handleSearch = (): void => {
    const normalized = draftTraceId.trim();
    if (!normalized) return;
    setSubmittedTraceId(normalized);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t('menu') },
          { label: t('title') },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle>{t('searchTitle')}</CardTitle>
            <CardDescription>{t('searchDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="trace-id-input">
                {t('traceIdLabel')}
              </label>
              <Input
                id="trace-id-input"
                value={draftTraceId}
                onChange={(event) => setDraftTraceId(event.target.value)}
                placeholder={t('traceIdPlaceholder')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSearch} disabled={!draftTraceId.trim() || traceQuery.isFetching}>
                <Search className="mr-2 h-4 w-4" />
                {traceQuery.isFetching ? t('searching') : t('search')}
              </Button>
              {submittedTraceId ? (
                <Button type="button" variant="outline" onClick={() => traceQuery.refetch()} disabled={traceQuery.isFetching}>
                  {t('refresh')}
                </Button>
              ) : null}
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-800">{t('supportTipTitle')}</div>
              <p className="mt-1">{t('supportTipBody')}</p>
            </div>

            {traceQuery.isError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <div className="font-medium">{(traceQuery.error as Error).message || t('loadError')}</div>
                {supportErrorTraceId ? <div className="mt-1 text-xs">{t('responseTraceId', { traceId: supportErrorTraceId })}</div> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('summary.audit')}</CardDescription>
                <CardTitle className="text-3xl">{traceQuery.data?.summary.auditCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('summary.jobExecution')}</CardDescription>
                <CardTitle className="text-3xl">{traceQuery.data?.summary.jobExecutionCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('summary.jobFailure')}</CardDescription>
                <CardTitle className="text-3xl">{traceQuery.data?.summary.jobFailureCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('summary.notification')}</CardDescription>
                <CardTitle className="text-3xl">{traceQuery.data?.summary.notificationCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('summary.integration')}</CardDescription>
                <CardTitle className="text-3xl">{traceQuery.data?.summary.integrationCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle>{t('summaryTitle')}</CardTitle>
              <CardDescription>
                {submittedTraceId ? t('summaryDescription', { traceId: submittedTraceId }) : t('summaryEmpty')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('firstSeen')}</div>
                <div className="mt-1 text-sm text-slate-900">{formatDate(traceQuery.data?.summary.firstSeenAt)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('lastSeen')}</div>
                <div className="mt-1 text-sm text-slate-900">{formatDate(traceQuery.data?.summary.lastSeenAt)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />{t('timelineTitle')}</CardTitle>
              <CardDescription>{t('timelineDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineItems.length === 0 ? (
                <div className="text-sm text-slate-500">{t('empty')}</div>
              ) : timelineItems.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg border border-slate-200 p-4">
                  <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{item.kind}</Badge>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                    <div className="mt-2 font-medium text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-600">{item.subtitle}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(item.timestamp)}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />{t('auditTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(traceQuery.data?.auditLogs ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">{t('empty')}</div>
              ) : traceQuery.data!.auditLogs.map((item) => (
                <div key={`audit-${item.id}`} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.entityType}</Badge>
                    <Badge variant="outline">{item.actionType}</Badge>
                    <Badge variant={item.result.toLowerCase() === 'success' || item.result.toLowerCase() === 'succeeded' ? 'secondary' : 'destructive'}>{item.result}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <div><span className="font-medium text-slate-700">{t('entityId')}:</span> {item.entityId}</div>
                    <div><span className="font-medium text-slate-700">{t('source')}:</span> {item.source}</div>
                    <div><span className="font-medium text-slate-700">{t('performedBy')}:</span> {item.performedByUserEmail || '-'}</div>
                    <div><span className="font-medium text-slate-700">{t('branchCode')}:</span> {item.branchCode || '-'}</div>
                    <div><span className="font-medium text-slate-700">{t('changedFields')}:</span> {item.changedFields || '-'}</div>
                    <div><span className="font-medium text-slate-700">{t('createdAt')}:</span> {formatDate(item.createdDate)}</div>
                  </div>
                  {item.reason ? <div className="mt-3 text-sm text-slate-700"><span className="font-medium">{t('reason')}:</span> {item.reason}</div> : null}
                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t('oldValues')}</div>
                      <JsonBlock value={item.oldValues} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t('newValues')}</div>
                      <JsonBlock value={item.newValues} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5" />{t('jobsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(traceQuery.data?.jobExecutions ?? []).length === 0 && (traceQuery.data?.jobFailures ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">{t('empty')}</div>
              ) : null}
              {(traceQuery.data?.jobExecutions ?? []).map((item) => (
                <div key={`job-exec-${item.id}`} className="rounded-lg border border-slate-200 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.jobName}</Badge>
                    <Badge variant={item.status.toLowerCase() === 'succeeded' ? 'secondary' : 'destructive'}>{item.status}</Badge>
                    <Badge variant="outline">{item.queue || 'default'}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div><span className="font-medium text-slate-700">{t('jobId')}:</span> {item.jobId}</div>
                    <div><span className="font-medium text-slate-700">{t('retryCount')}:</span> {item.retryCount}</div>
                    <div><span className="font-medium text-slate-700">{t('startedAt')}:</span> {formatDate(item.startedAt)}</div>
                    <div><span className="font-medium text-slate-700">{t('finishedAt')}:</span> {formatDate(item.finishedAt)}</div>
                    <div><span className="font-medium text-slate-700">{t('durationMs')}:</span> {item.durationMs}</div>
                    <div><span className="font-medium text-slate-700">{t('branchCode')}:</span> {item.branchCode}</div>
                  </div>
                  {item.reason || item.exceptionMessage ? (
                    <div className="mt-3 text-sm text-slate-700">
                      <span className="font-medium">{t('reason')}:</span> {item.reason || item.exceptionMessage}
                    </div>
                  ) : null}
                </div>
              ))}
              {(traceQuery.data?.jobFailures ?? []).map((item) => (
                <div key={`job-failure-${item.id}`} className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive">{item.jobName}</Badge>
                    <Badge variant="outline">{item.queue || 'default'}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div><span className="font-medium">{t('jobId')}:</span> {item.jobId}</div>
                    <div><span className="font-medium">{t('retryCount')}:</span> {item.retryCount}</div>
                    <div><span className="font-medium">{t('failedAt')}:</span> {formatDate(item.failedAt)}</div>
                    <div><span className="font-medium">{t('branchCode')}:</span> {item.branchCode}</div>
                  </div>
                  <div className="mt-3"><span className="font-medium">{t('reason')}:</span> {item.reason || item.exceptionMessage || '-'}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Waypoints className="h-5 w-5" />{t('integrationsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(traceQuery.data?.integrations ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">{t('empty')}</div>
              ) : traceQuery.data!.integrations.map((item) => (
                <div key={`integration-${item.id}`} className="rounded-lg border border-slate-200 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.targetSystem}</Badge>
                    <Badge variant="outline">{item.integrationType}</Badge>
                    <Badge variant={item.status.toLowerCase() === 'succeeded' ? 'secondary' : 'destructive'}>{item.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div><span className="font-medium text-slate-700">{t('operation')}:</span> {item.operation}</div>
                    <div><span className="font-medium text-slate-700">{t('source')}:</span> {item.source}</div>
                    <div><span className="font-medium text-slate-700">{t('startedAt')}:</span> {formatDate(item.startedAt)}</div>
                    <div><span className="font-medium text-slate-700">{t('finishedAt')}:</span> {formatDate(item.finishedAt)}</div>
                    <div><span className="font-medium text-slate-700">{t('durationMs')}:</span> {item.durationMs}</div>
                    <div><span className="font-medium text-slate-700">{t('branchCode')}:</span> {item.branchCode}</div>
                  </div>
                  {(item.errorMessage || item.errorType) ? (
                    <div className="mt-3 text-sm text-slate-700">
                      <span className="font-medium">{t('reason')}:</span> {item.errorMessage || item.errorType}
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t('requestMetadata')}</div>
                      <JsonBlock value={item.requestMetadata} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t('responseMetadata')}</div>
                      <JsonBlock value={item.responseMetadata} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />{t('notificationsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(traceQuery.data?.notifications ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">{t('empty')}</div>
              ) : traceQuery.data!.notifications.map((item) => (
                <div key={`notification-${item.id}`} className="rounded-lg border border-slate-200 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.channel}</Badge>
                    {item.severity ? <Badge variant="outline">{item.severity}</Badge> : null}
                    <Badge variant={item.isRead ? 'outline' : 'secondary'}>{item.isRead ? t('read') : t('unread')}</Badge>
                  </div>
                  <div className="mt-3 font-medium text-slate-900">{item.title}</div>
                  <div className="mt-1 text-slate-700">{item.message}</div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div><span className="font-medium text-slate-700">{t('createdAt')}:</span> {formatDate(item.createdDate)}</div>
                    <div><span className="font-medium text-slate-700">{t('deliveredAt')}:</span> {formatDate(item.deliveredAt)}</div>
                    <div><span className="font-medium text-slate-700">{t('relatedEntity')}:</span> {item.relatedEntityType || '-'}{item.relatedEntityId ? ` #${item.relatedEntityId}` : ''}</div>
                    <div><span className="font-medium text-slate-700">{t('branchCode')}:</span> {item.branchCode}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />{t('traceFooterTitle')}</CardTitle>
              <CardDescription>{t('traceFooterDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {submittedTraceId ? t('responseTraceId', { traceId: submittedTraceId }) : t('summaryEmpty')}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
