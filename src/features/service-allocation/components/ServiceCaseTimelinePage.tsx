import { type ChangeEvent, type ReactElement, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsServiceEyebrow, OpsTextarea, PageState } from '@/components/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
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
  renderServiceAssignmentStatus,
  renderServiceCaseLineType,
  renderServiceCaseStatus,
  renderServiceDecisionType,
  renderServiceWarrantyStatus,
  renderServiceWorkSessionStatus,
  serviceDecisionTypeOptions,
} from '../utils/service-allocation-display';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('tr-TR');
}

function fileListToArray(event: ChangeEvent<HTMLInputElement>): File[] {
  return Array.from(event.target.files ?? []);
}

function hasVideoFile(files: File[]): boolean {
  return files.some((file) => {
    if (file.type.toLowerCase().startsWith('video/')) {
      return true;
    }

    return /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name);
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds && seconds !== 0) return '-';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes} dk ${remainingSeconds} sn` : `${remainingSeconds} sn`;
}

export function ServiceCaseTimelinePage(): ReactElement {
  const { t } = useTranslation(['service-allocation', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const parsedId = Number(id);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const query = useServiceCaseTimelineQuery(parsedId);
  const timeline = query.data;
  const dispositionPlanQuery = useQuery({
    queryKey: ['service-allocation', 'service-case', parsedId, 'disposition-plan'],
    queryFn: () => serviceAllocationApi.getServiceCaseDispositionPlan(parsedId),
    enabled: Number.isFinite(parsedId) && parsedId > 0,
  });
  const dispositionPlan = dispositionPlanQuery.data;
  const [assignedBranchCode, setAssignedBranchCode] = useState('0');
  const [assignedUserEmail, setAssignedUserEmail] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [startAssignmentId, setStartAssignmentId] = useState('');
  const [startNote, setStartNote] = useState('');
  const [beforeRepairPhotos, setBeforeRepairPhotos] = useState<File[]>([]);
  const [completeWorkSessionId, setCompleteWorkSessionId] = useState('');
  const [decisionType, setDecisionType] = useState('1');
  const [decisionReason, setDecisionReason] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [completionMedia, setCompletionMedia] = useState<File[]>([]);
  const openAssignments = useMemo(
    () => timeline?.assignments.filter((item) => ![3, 4, 5].includes(Number(item.status))) ?? [],
    [timeline?.assignments],
  );
  const startedSessions = useMemo(
    () => timeline?.workSessions.filter((item) => Number(item.status) === 0) ?? [],
    [timeline?.workSessions],
  );
  const completionHasVideo = useMemo(() => hasVideoFile(completionMedia), [completionMedia]);
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
  const assignMutation = useMutation({
    mutationFn: () =>
      serviceAllocationApi.assignServiceCase(parsedId, {
        assignedBranchCode,
        assignedUserEmail: assignedUserEmail || undefined,
        note: assignmentNote || undefined,
      }),
    onSuccess: () => {
      toast.success(t('serviceAllocation.technicalService.assignSuccess'));
      setAssignmentNote('');
      setAssignedUserEmail('');
      void query.refetch();
      queryClient.invalidateQueries({ queryKey: ['service-allocation'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.technicalService.assignError'));
    },
  });
  const startWorkMutation = useMutation({
    mutationFn: () =>
      serviceAllocationApi.startServiceCaseWork(parsedId, {
        assignmentId: Number(startAssignmentId),
        startNote: startNote || undefined,
        beforeRepairPhotos,
      }),
    onSuccess: () => {
      toast.success(t('serviceAllocation.technicalService.startSuccess'));
      setStartNote('');
      setBeforeRepairPhotos([]);
      setStartAssignmentId('');
      void query.refetch();
      queryClient.invalidateQueries({ queryKey: ['service-allocation'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.technicalService.startError'));
    },
  });
  const completeWorkMutation = useMutation({
    mutationFn: () =>
      serviceAllocationApi.completeServiceCaseWork(parsedId, {
        workSessionId: Number(completeWorkSessionId),
        decisionType: Number(decisionType),
        decisionReason: decisionReason || undefined,
        resolutionNote: resolutionNote || undefined,
        completionNote: completionNote || undefined,
        completionMedia,
      }),
    onSuccess: () => {
      toast.success(t('serviceAllocation.technicalService.completeSuccess'));
      setDecisionReason('');
      setResolutionNote('');
      setCompletionNote('');
      setCompletionMedia([]);
      setCompleteWorkSessionId('');
      void query.refetch();
      void dispositionPlanQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['service-allocation'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.technicalService.completeError'));
    },
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.timeline.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!timeline) {
      return;
    }

    setStartAssignmentId((current) => current || String(openAssignments[0]?.id ?? ''));
    setCompleteWorkSessionId((current) => current || String(startedSessions[0]?.id ?? ''));
  }, [openAssignments, startedSessions, timeline]);

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
                <ServiceCaseDetailRow label={t('serviceAllocation.warrantyStatus')}>
                  {renderServiceWarrantyStatus(timeline.serviceCase.warrantyStatus)}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.decisionType')}>
                  {renderServiceDecisionType(timeline.serviceCase.decisionType)}
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
                <ServiceCaseDetailRow label={t('serviceAllocation.barcode')}>
                  {timeline.serviceCase.barcode || '-'}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.saleDate')}>
                  {formatDate(timeline.serviceCase.saleDate)}
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
                <ServiceCaseDetailRow label={t('serviceAllocation.technicalService.mediaCount')}>
                  {timeline.media.length}
                </ServiceCaseDetailRow>
                <ServiceCaseDetailRow label={t('serviceAllocation.technicalService.assignmentCount')}>
                  {timeline.assignments.length}
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

          <section className="wms-ops-detail-panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="wms-ops-detail-section-title mb-1">{t('serviceAllocation.disposition.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('serviceAllocation.disposition.subtitle')}</p>
              </div>
              <span
                className={`wms-ops-code-badge self-start ${
                  dispositionPlan?.hasDispositionDocument
                    ? 'bg-emerald-100 text-emerald-700'
                    : dispositionPlan?.isReadyForDisposition
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {dispositionPlan?.hasDispositionDocument
                  ? t('serviceAllocation.disposition.linked')
                  : dispositionPlan?.isReadyForDisposition
                    ? t('serviceAllocation.disposition.ready')
                    : t('serviceAllocation.disposition.waiting')}
              </span>
            </div>

            {dispositionPlanQuery.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : dispositionPlanQuery.isError || !dispositionPlan ? (
              <div className="p-4 text-sm text-destructive">{t('serviceAllocation.disposition.loadError')}</div>
            ) : (
              <div className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border bg-background/80 p-4">
                  <div className="mb-3 text-sm font-semibold">{t('serviceAllocation.disposition.nextAction')}</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ServiceCaseDetailRow label={t('serviceAllocation.disposition.requiredAction')}>
                      {t(`serviceAllocation.disposition.actions.${dispositionPlan.requiredAction}`, {
                        defaultValue: dispositionPlan.requiredAction || '-',
                      })}
                    </ServiceCaseDetailRow>
                    <ServiceCaseDetailRow label={t('serviceAllocation.documentModule')}>
                      {dispositionPlan.requiredDocumentModule !== null && dispositionPlan.requiredDocumentModule !== undefined
                        ? renderDocumentModule(dispositionPlan.requiredDocumentModule)
                        : '-'}
                    </ServiceCaseDetailRow>
                    <ServiceCaseDetailRow label={t('serviceAllocation.linkPurpose')}>
                      {dispositionPlan.requiredLinkPurpose !== null && dispositionPlan.requiredLinkPurpose !== undefined
                        ? renderDocumentLinkPurpose(dispositionPlan.requiredLinkPurpose)
                        : '-'}
                    </ServiceCaseDetailRow>
                    <ServiceCaseDetailRow label={t('serviceAllocation.fromWarehouse')}>
                      {dispositionPlan.fromWarehouseId ?? '-'}
                    </ServiceCaseDetailRow>
                    <ServiceCaseDetailRow label={t('serviceAllocation.toWarehouse')}>
                      {dispositionPlan.toWarehouseId ?? '-'}
                    </ServiceCaseDetailRow>
                    <ServiceCaseDetailRow label={t('serviceAllocation.timeline.linkCount')}>
                      {dispositionPlan.existingLinks.length}
                    </ServiceCaseDetailRow>
                  </div>
                  <p className="mt-4 rounded-2xl border bg-muted/50 p-3 text-sm text-muted-foreground">
                    {dispositionPlan.message}
                  </p>
                </div>

                <div className="rounded-2xl border bg-background/80 p-4">
                  <div className="mb-3 text-sm font-semibold">{t('serviceAllocation.disposition.qualityGate')}</div>
                  <div className="space-y-2 text-sm">
                    {[
                      { key: 'decision', passed: dispositionPlan.decisionType !== 0 },
                      { key: 'completedWork', passed: dispositionPlan.hasCompletedWorkSession },
                      { key: 'completionVideo', passed: dispositionPlan.hasCompletionVideo },
                      { key: 'documentLink', passed: dispositionPlan.hasDispositionDocument },
                    ].map((gate) => (
                      <div key={gate.key} className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2">
                        <span>{t(`serviceAllocation.disposition.gates.${gate.key}`)}</span>
                        <span className={gate.passed ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
                          {gate.passed ? t('serviceAllocation.disposition.pass') : t('serviceAllocation.disposition.pending')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {permission.canUpdate ? (
            <section className="wms-ops-detail-panel overflow-hidden">
              <h3 className="wms-ops-detail-section-title">{t('serviceAllocation.technicalService.title')}</h3>
              <div className="grid gap-4 p-4 lg:grid-cols-3">
                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                  <div className="mb-3">
                    <div className="font-semibold">{t('serviceAllocation.technicalService.assignTitle')}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{t('serviceAllocation.technicalService.assignDescription')}</p>
                  </div>
                  <div className="space-y-3">
                    <OpsInput value={assignedBranchCode} onChange={(event) => setAssignedBranchCode(event.target.value)} placeholder={t('serviceAllocation.technicalService.branchCode')} />
                    <OpsInput value={assignedUserEmail} onChange={(event) => setAssignedUserEmail(event.target.value)} placeholder={t('serviceAllocation.technicalService.technicianEmail')} />
                    <OpsTextarea value={assignmentNote} onChange={(event) => setAssignmentNote(event.target.value)} rows={3} placeholder={t('serviceAllocation.technicalService.note')} />
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      disabled={!assignedBranchCode || assignMutation.isPending}
                      onClick={() => assignMutation.mutate()}
                    >
                      {assignMutation.isPending ? t('common.loading') : t('serviceAllocation.technicalService.assignAction')}
                    </OpsActionButton>
                  </div>
                </div>

                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                  <div className="mb-3">
                    <div className="font-semibold">{t('serviceAllocation.technicalService.startTitle')}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{t('serviceAllocation.technicalService.startDescription')}</p>
                  </div>
                  <div className="space-y-3">
                    <Select value={startAssignmentId} onValueChange={setStartAssignmentId}>
                      <SelectTrigger className={OPS_FIELD_CLASS}>
                        <SelectValue placeholder={t('serviceAllocation.technicalService.selectAssignment')} />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        {openAssignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={String(assignment.id)}>
                            #{assignment.id} - {assignment.assignedBranchCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <OpsTextarea value={startNote} onChange={(event) => setStartNote(event.target.value)} rows={3} placeholder={t('serviceAllocation.technicalService.startNote')} />
                    <OpsInput type="file" accept="image/*" multiple onChange={(event) => setBeforeRepairPhotos(fileListToArray(event))} />
                    <div className="text-xs text-muted-foreground">
                      {t('serviceAllocation.technicalService.selectedFileCount', { count: beforeRepairPhotos.length })}
                    </div>
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      disabled={!startAssignmentId || beforeRepairPhotos.length === 0 || startWorkMutation.isPending}
                      onClick={() => startWorkMutation.mutate()}
                    >
                      {startWorkMutation.isPending ? t('common.loading') : t('serviceAllocation.technicalService.startAction')}
                    </OpsActionButton>
                  </div>
                </div>

                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                  <div className="mb-3">
                    <div className="font-semibold">{t('serviceAllocation.technicalService.completeTitle')}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{t('serviceAllocation.technicalService.completeDescription')}</p>
                  </div>
                  <div className="space-y-3">
                    <Select value={completeWorkSessionId} onValueChange={setCompleteWorkSessionId}>
                      <SelectTrigger className={OPS_FIELD_CLASS}>
                        <SelectValue placeholder={t('serviceAllocation.technicalService.selectWorkSession')} />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        {startedSessions.map((session) => (
                          <SelectItem key={session.id} value={String(session.id)}>
                            #{session.id} - {formatDate(session.startedAt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={decisionType} onValueChange={setDecisionType}>
                      <SelectTrigger className={OPS_FIELD_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        {serviceDecisionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <OpsTextarea value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} rows={2} placeholder={t('serviceAllocation.technicalService.decisionReason')} />
                    <OpsTextarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} rows={2} placeholder={t('serviceAllocation.technicalService.resolutionNote')} />
                    <OpsTextarea value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} rows={2} placeholder={t('serviceAllocation.technicalService.completionNote')} />
                    <OpsInput type="file" accept="image/*,video/*" multiple onChange={(event) => setCompletionMedia(fileListToArray(event))} />
                    <div className="text-xs text-muted-foreground">
                      {t('serviceAllocation.technicalService.selectedFileCount', { count: completionMedia.length })}
                      {!completionHasVideo && completionMedia.length > 0 ? (
                        <span className="ml-2 text-destructive">{t('serviceAllocation.technicalService.videoRequired')}</span>
                      ) : null}
                    </div>
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      disabled={!completeWorkSessionId || !completionHasVideo || completeWorkMutation.isPending}
                      onClick={() => completeWorkMutation.mutate()}
                    >
                      {completeWorkMutation.isPending ? t('common.loading') : t('serviceAllocation.technicalService.completeAction')}
                    </OpsActionButton>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

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
            title={t('serviceAllocation.technicalService.assignments')}
            isEmpty={timeline.assignments.length === 0}
            emptyText={t('serviceAllocation.technicalService.noAssignments')}
            columns={[
              { key: 'assignedBranchCode', label: t('serviceAllocation.technicalService.branchCode'), className: 'wms-ops-table-center-col' },
              { key: 'assignedUserEmail', label: t('serviceAllocation.technicalService.technicianEmail'), className: 'wms-ops-table-center-col' },
              { key: 'status', label: t('serviceAllocation.status'), className: 'wms-ops-table-center-col' },
              { key: 'assignedAt', label: t('serviceAllocation.technicalService.assignedAt'), className: 'wms-ops-table-center-col' },
              { key: 'startedAt', label: t('serviceAllocation.technicalService.startedAt'), className: 'wms-ops-table-center-col' },
              { key: 'completedAt', label: t('serviceAllocation.technicalService.completedAt'), className: 'wms-ops-table-center-col' },
            ]}
          >
            {timeline.assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="wms-ops-table-center-col font-mono text-xs">{assignment.assignedBranchCode}</td>
                <td className="wms-ops-table-center-col">{assignment.assignedUserEmail || '-'}</td>
                <td className="wms-ops-table-center-col">{renderServiceAssignmentStatus(assignment.status)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(assignment.assignedAt)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(assignment.startedAt)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(assignment.completedAt)}</td>
              </tr>
            ))}
          </ServiceCaseOpsDataTable>

          <ServiceCaseOpsDataTable
            title={t('serviceAllocation.technicalService.workSessions')}
            isEmpty={timeline.workSessions.length === 0}
            emptyText={t('serviceAllocation.technicalService.noWorkSessions')}
            columns={[
              { key: 'technician', label: t('serviceAllocation.technicalService.technicianEmail'), className: 'wms-ops-table-center-col' },
              { key: 'status', label: t('serviceAllocation.status'), className: 'wms-ops-table-center-col' },
              { key: 'startedAt', label: t('serviceAllocation.technicalService.startedAt'), className: 'wms-ops-table-center-col' },
              { key: 'finishedAt', label: t('serviceAllocation.technicalService.finishedAt'), className: 'wms-ops-table-center-col' },
              { key: 'duration', label: t('serviceAllocation.technicalService.duration'), className: 'wms-ops-table-center-col' },
            ]}
          >
            {timeline.workSessions.map((session) => (
              <tr key={session.id}>
                <td className="wms-ops-table-center-col">{session.technicianUserEmail || `#${session.technicianUserId}`}</td>
                <td className="wms-ops-table-center-col">{renderServiceWorkSessionStatus(session.status)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(session.startedAt)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(session.finishedAt)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDuration(session.durationSeconds)}</td>
              </tr>
            ))}
          </ServiceCaseOpsDataTable>

          <ServiceCaseOpsDataTable
            title={t('serviceAllocation.technicalService.media')}
            isEmpty={timeline.media.length === 0}
            emptyText={t('serviceAllocation.technicalService.noMedia')}
            columns={[
              { key: 'fileName', label: t('serviceAllocation.technicalService.fileName'), className: 'wms-ops-table-center-col' },
              { key: 'mediaPhase', label: t('serviceAllocation.technicalService.mediaPhase'), className: 'wms-ops-table-center-col' },
              { key: 'contentType', label: t('serviceAllocation.technicalService.contentType'), className: 'wms-ops-table-center-col' },
              { key: 'capturedAt', label: t('serviceAllocation.technicalService.capturedAt'), className: 'wms-ops-table-center-col' },
            ]}
          >
            {timeline.media.map((media) => (
              <tr key={media.id}>
                <td className="wms-ops-table-center-col">
                  <a className="font-mono text-xs underline" href={media.fileUrl} target="_blank" rel="noreferrer">
                    {media.fileName}
                  </a>
                </td>
                <td className="wms-ops-table-center-col font-mono text-xs">{t(`serviceAllocation.enum.serviceMediaPhase.${media.mediaPhase}`)}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{media.contentType || '-'}</td>
                <td className="wms-ops-table-center-col font-mono text-xs">{formatDate(media.capturedAt)}</td>
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
