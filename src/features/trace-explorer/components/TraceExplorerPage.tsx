import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, BriefcaseBusiness, ClipboardList, Search, Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsFormPageShell, OpsInput } from '@/components/shared';
import {
  ADMIN_OPS_PAGE_CLASS,
  AccessControlOpsFormField,
  AccessControlOpsScrollList,
  AccessControlOpsSection,
  AccessControlOpsStatGrid,
} from '@/features/access-control';
import {
  MasterDataOpsFlagChip,
  MasterDataOpsGuidance,
  MasterDataOpsResultPanel,
} from '@/features/shared';
import { useUIStore } from '@/stores/ui-store';
import { traceExplorerApi } from '../api/traceExplorer.api';

function TraceExplorerOpsEyebrow(): ReactElement {
  const { t } = useTranslation(['trace-explorer', 'access-control']);

  return (
    <>
      <span>{t('sidebar.accessControl', { ns: 'access-control', defaultValue: 'Access Control' })}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{t('menu')}</span>
    </>
  );
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function resolveResultTone(status: string): 'default' | 'info' | 'success' | 'warn' {
  const normalized = status.toLowerCase();
  if (normalized === 'success' || normalized === 'succeeded') return 'success';
  if (normalized.includes('fail') || normalized === 'failed' || normalized === 'error') return 'warn';
  return 'default';
}

function JsonBlock({ value }: { value?: string }): ReactElement {
  if (!value) {
    return <span className="wms-ops-pt-terminal__meta opacity-60">-</span>;
  }

  return (
    <pre className="wms-ops-access-control-scroll-list max-h-56 overflow-auto p-3 font-mono text-xs leading-5">
      {value}
    </pre>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="text-sm">
      <span className="wms-ops-prelabel-form-label">{label}:</span>{' '}
      <span className="wms-ops-pt-terminal__meta">{value}</span>
    </div>
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

  const summaryStats = [
    { label: t('summary.audit'), value: traceQuery.data?.summary.auditCount ?? 0 },
    { label: t('summary.jobExecution'), value: traceQuery.data?.summary.jobExecutionCount ?? 0 },
    { label: t('summary.jobFailure'), value: traceQuery.data?.summary.jobFailureCount ?? 0 },
    { label: t('summary.notification'), value: traceQuery.data?.summary.notificationCount ?? 0 },
    { label: t('summary.integration'), value: traceQuery.data?.summary.integrationCount ?? 0 },
  ];

  return (
    <OpsFormPageShell
      className={ADMIN_OPS_PAGE_CLASS}
      eyebrow={<TraceExplorerOpsEyebrow />}
      title={t('title')}
      description={t('searchDescription')}
    >
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AccessControlOpsSection title={t('searchTitle')} subtitle={t('searchDescription')}>
          <div className="space-y-4">
            <AccessControlOpsFormField label={t('traceIdLabel')} htmlFor="trace-id-input">
              <OpsInput
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
            </AccessControlOpsFormField>

            <div className="wms-ops-actions flex flex-wrap gap-3">
              <OpsActionButton
                type="button"
                variant="primary"
                onClick={handleSearch}
                disabled={!draftTraceId.trim() || traceQuery.isFetching}
              >
                <Search className="size-3.5" aria-hidden />
                {traceQuery.isFetching ? t('searching') : t('search')}
              </OpsActionButton>
              {submittedTraceId ? (
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => traceQuery.refetch()}
                  disabled={traceQuery.isFetching}
                >
                  {t('refresh')}
                </OpsActionButton>
              ) : null}
            </div>

            <MasterDataOpsGuidance
              title={t('supportTipTitle')}
              lines={[t('supportTipBody')]}
            />

            {traceQuery.isError ? (
              <MasterDataOpsResultPanel tone="danger">
                <div className="font-medium">{(traceQuery.error as Error).message || t('loadError')}</div>
                {supportErrorTraceId ? (
                  <div className="mt-1 text-xs opacity-80">{t('responseTraceId', { traceId: supportErrorTraceId })}</div>
                ) : null}
              </MasterDataOpsResultPanel>
            ) : null}
          </div>
        </AccessControlOpsSection>

        <div className="space-y-6">
          <AccessControlOpsStatGrid items={summaryStats} className="md:grid-cols-2 2xl:grid-cols-5" />

          <AccessControlOpsSection
            title={t('summaryTitle')}
            subtitle={
              submittedTraceId
                ? t('summaryDescription', { traceId: submittedTraceId })
                : t('summaryEmpty')
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="wms-ops-prelabel-form-label">{t('firstSeen')}</div>
                <div className="mt-1 text-sm">{formatDate(traceQuery.data?.summary.firstSeenAt)}</div>
              </div>
              <div>
                <div className="wms-ops-prelabel-form-label">{t('lastSeen')}</div>
                <div className="mt-1 text-sm">{formatDate(traceQuery.data?.summary.lastSeenAt)}</div>
              </div>
            </div>
          </AccessControlOpsSection>

          <AccessControlOpsSection
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="size-4" aria-hidden />
                {t('timelineTitle')}
              </span>
            }
            subtitle={t('timelineDescription')}
          >
            <AccessControlOpsScrollList emptyText={t('empty')} isEmpty={timelineItems.length === 0}>
              <div className="space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.id} className="wms-ops-receiving-area flex gap-4 border p-4">
                    <span className="wms-ops-subtitle-prefix mt-0.5 shrink-0" aria-hidden>
                      {'> '}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MasterDataOpsFlagChip tone="info">{item.kind}</MasterDataOpsFlagChip>
                        <MasterDataOpsFlagChip tone={resolveResultTone(item.status)}>{item.status}</MasterDataOpsFlagChip>
                      </div>
                      <div className="mt-2 font-medium">{item.title}</div>
                      <div className="wms-ops-pt-terminal__meta text-sm">{item.subtitle}</div>
                      <div className="mt-1 text-xs opacity-70">{formatDate(item.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AccessControlOpsScrollList>
          </AccessControlOpsSection>

          <AccessControlOpsSection
            title={
              <span className="inline-flex items-center gap-2">
                <ClipboardList className="size-4" aria-hidden />
                {t('auditTitle')}
              </span>
            }
          >
            <AccessControlOpsScrollList
              emptyText={t('empty')}
              isEmpty={(traceQuery.data?.auditLogs ?? []).length === 0}
            >
              <div className="space-y-4">
                {(traceQuery.data?.auditLogs ?? []).map((item) => (
                  <div key={`audit-${item.id}`} className="wms-ops-receiving-area border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <MasterDataOpsFlagChip>{item.entityType}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone="info">{item.actionType}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone={resolveResultTone(item.result)}>{item.result}</MasterDataOpsFlagChip>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <DetailField label={t('entityId')} value={item.entityId} />
                      <DetailField label={t('source')} value={item.source} />
                      <DetailField label={t('performedBy')} value={item.performedByUserEmail || '-'} />
                      <DetailField label={t('branchCode')} value={item.branchCode || '-'} />
                      <DetailField label={t('changedFields')} value={item.changedFields || '-'} />
                      <DetailField label={t('createdAt')} value={formatDate(item.createdDate)} />
                    </div>
                    {item.reason ? (
                      <div className="mt-3 text-sm">
                        <span className="wms-ops-prelabel-form-label">{t('reason')}:</span> {item.reason}
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <div>
                        <div className="mb-1 wms-ops-prelabel-form-label">{t('oldValues')}</div>
                        <JsonBlock value={item.oldValues} />
                      </div>
                      <div>
                        <div className="mb-1 wms-ops-prelabel-form-label">{t('newValues')}</div>
                        <JsonBlock value={item.newValues} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccessControlOpsScrollList>
          </AccessControlOpsSection>

          <AccessControlOpsSection
            title={
              <span className="inline-flex items-center gap-2">
                <BriefcaseBusiness className="size-4" aria-hidden />
                {t('jobsTitle')}
              </span>
            }
          >
            <AccessControlOpsScrollList
              emptyText={t('empty')}
              isEmpty={
                (traceQuery.data?.jobExecutions ?? []).length === 0
                && (traceQuery.data?.jobFailures ?? []).length === 0
              }
            >
              <div className="space-y-4">
                {(traceQuery.data?.jobExecutions ?? []).map((item) => (
                  <div key={`job-exec-${item.id}`} className="wms-ops-receiving-area border p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <MasterDataOpsFlagChip>{item.jobName}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone={resolveResultTone(item.status)}>{item.status}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone="info">{item.queue || 'default'}</MasterDataOpsFlagChip>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <DetailField label={t('jobId')} value={item.jobId} />
                      <DetailField label={t('retryCount')} value={item.retryCount} />
                      <DetailField label={t('startedAt')} value={formatDate(item.startedAt)} />
                      <DetailField label={t('finishedAt')} value={formatDate(item.finishedAt)} />
                      <DetailField label={t('durationMs')} value={item.durationMs} />
                      <DetailField label={t('branchCode')} value={item.branchCode} />
                    </div>
                    {item.reason || item.exceptionMessage ? (
                      <div className="mt-3 text-sm">
                        <span className="wms-ops-prelabel-form-label">{t('reason')}:</span>{' '}
                        {item.reason || item.exceptionMessage}
                      </div>
                    ) : null}
                  </div>
                ))}
                {(traceQuery.data?.jobFailures ?? []).map((item) => (
                  <MasterDataOpsResultPanel key={`job-failure-${item.id}`} tone="danger" className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <MasterDataOpsFlagChip tone="warn">{item.jobName}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone="info">{item.queue || 'default'}</MasterDataOpsFlagChip>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <DetailField label={t('jobId')} value={item.jobId} />
                      <DetailField label={t('retryCount')} value={item.retryCount} />
                      <DetailField label={t('failedAt')} value={formatDate(item.failedAt)} />
                      <DetailField label={t('branchCode')} value={item.branchCode} />
                    </div>
                    <div className="mt-3">
                      <span className="wms-ops-prelabel-form-label">{t('reason')}:</span>{' '}
                      {item.reason || item.exceptionMessage || '-'}
                    </div>
                  </MasterDataOpsResultPanel>
                ))}
              </div>
            </AccessControlOpsScrollList>
          </AccessControlOpsSection>

          <AccessControlOpsSection
            title={
              <span className="inline-flex items-center gap-2">
                <Waypoints className="size-4" aria-hidden />
                {t('integrationsTitle')}
              </span>
            }
          >
            <AccessControlOpsScrollList
              emptyText={t('empty')}
              isEmpty={(traceQuery.data?.integrations ?? []).length === 0}
            >
              <div className="space-y-4">
                {(traceQuery.data?.integrations ?? []).map((item) => (
                  <div key={`integration-${item.id}`} className="wms-ops-receiving-area border p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <MasterDataOpsFlagChip>{item.targetSystem}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone="info">{item.integrationType}</MasterDataOpsFlagChip>
                      <MasterDataOpsFlagChip tone={resolveResultTone(item.status)}>{item.status}</MasterDataOpsFlagChip>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <DetailField label={t('operation')} value={item.operation} />
                      <DetailField label={t('source')} value={item.source} />
                      <DetailField label={t('startedAt')} value={formatDate(item.startedAt)} />
                      <DetailField label={t('finishedAt')} value={formatDate(item.finishedAt)} />
                      <DetailField label={t('durationMs')} value={item.durationMs} />
                      <DetailField label={t('branchCode')} value={item.branchCode} />
                    </div>
                    {(item.errorMessage || item.errorType) ? (
                      <div className="mt-3 text-sm">
                        <span className="wms-ops-prelabel-form-label">{t('reason')}:</span>{' '}
                        {item.errorMessage || item.errorType}
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <div>
                        <div className="mb-1 wms-ops-prelabel-form-label">{t('requestMetadata')}</div>
                        <JsonBlock value={item.requestMetadata} />
                      </div>
                      <div>
                        <div className="mb-1 wms-ops-prelabel-form-label">{t('responseMetadata')}</div>
                        <JsonBlock value={item.responseMetadata} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccessControlOpsScrollList>
          </AccessControlOpsSection>

          <AccessControlOpsSection
            title={
              <span className="inline-flex items-center gap-2">
                <Bell className="size-4" aria-hidden />
                {t('notificationsTitle')}
              </span>
            }
          >
            <AccessControlOpsScrollList
              emptyText={t('empty')}
              isEmpty={(traceQuery.data?.notifications ?? []).length === 0}
            >
              <div className="space-y-4">
                {(traceQuery.data?.notifications ?? []).map((item) => (
                  <div key={`notification-${item.id}`} className="wms-ops-receiving-area border p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <MasterDataOpsFlagChip>{item.channel}</MasterDataOpsFlagChip>
                      {item.severity ? <MasterDataOpsFlagChip tone="info">{item.severity}</MasterDataOpsFlagChip> : null}
                      <MasterDataOpsFlagChip tone={item.isRead ? 'default' : 'warn'}>
                        {item.isRead ? t('read') : t('unread')}
                      </MasterDataOpsFlagChip>
                    </div>
                    <div className="mt-3 font-medium">{item.title}</div>
                    <div className="mt-1">{item.message}</div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <DetailField label={t('createdAt')} value={formatDate(item.createdDate)} />
                      <DetailField label={t('deliveredAt')} value={formatDate(item.deliveredAt)} />
                      <DetailField
                        label={t('relatedEntity')}
                        value={`${item.relatedEntityType || '-'}${item.relatedEntityId ? ` #${item.relatedEntityId}` : ''}`}
                      />
                      <DetailField label={t('branchCode')} value={item.branchCode} />
                    </div>
                  </div>
                ))}
              </div>
            </AccessControlOpsScrollList>
          </AccessControlOpsSection>

          <AccessControlOpsSection
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="size-4" aria-hidden />
                {t('traceFooterTitle')}
              </span>
            }
            subtitle={t('traceFooterDescription')}
          >
            <p className="wms-ops-pt-terminal__meta text-sm">
              {submittedTraceId ? t('responseTraceId', { traceId: submittedTraceId }) : t('summaryEmpty')}
            </p>
          </AccessControlOpsSection>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
