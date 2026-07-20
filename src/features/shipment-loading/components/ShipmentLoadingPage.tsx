import { type FormEvent, type ReactElement, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PackageCheck, Truck, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsTextarea } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { shipmentLoadingApi } from '../api/shipment-loading.api';
import type { ShipmentLoadingDetail, ShipmentLoadingSession } from '../types/shipment-loading.types';

const queryKey = ['shipment-loading', 'sessions'];

const opsPanelClass = 'wms-ops-surface-card';
const opsPanelTitleClass = 'wms-ops-surface-title flex items-center gap-2';
const opsLabelClass = 'wms-ops-surface-label';
const opsInsetClass = 'wms-ops-surface-inset';

function parseNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('tr-TR');
}

const statusChipBase = 'wms-ops-surface-chip';

function statusTone(status: string): string {
  switch (status.toLowerCase()) {
    case 'closed':
    case 'loaded':
      return `${statusChipBase} border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`;
    case 'loading':
    case 'staged':
      return `${statusChipBase} border-[color-mix(in_oklab,var(--wms-ops-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--wms-ops-accent)_12%,transparent)] text-[color-mix(in_oklab,var(--wms-ops-accent)_80%,#0f172a)] dark:text-[color-mix(in_oklab,var(--wms-ops-accent)_85%,#e2e8f0)]`;
    case 'unloaded':
      return `${statusChipBase} border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300`;
    default:
      return `${statusChipBase} border-slate-400/40 bg-slate-500/10 text-slate-600 dark:text-slate-300`;
  }
}

export function ShipmentLoadingPage(): ReactElement {
  const { t } = useTranslation(['shipment-loading', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const [shipmentHeaderId, setShipmentHeaderId] = useState('');
  const [vehicleCheckInHeaderId, setVehicleCheckInHeaderId] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dockCode, setDockCode] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [note, setNote] = useState('');
  const [activeDetail, setActiveDetail] = useState<ShipmentLoadingDetail | null>(null);
  const [packageId, setPackageId] = useState('');

  useEffect(() => {
    setPageTitle(t('title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const sessionsQuery = useQuery({
    queryKey,
    queryFn: () => shipmentLoadingApi.getPaged({ pageNumber: 1, pageSize: 25, sortBy: 'Id', sortDirection: 'desc' }),
  });

  const saveSessionMutation = useMutation({
    mutationFn: () => {
      const shipmentId = parseNumber(shipmentHeaderId);
      if (!shipmentId) {
        throw new Error(t('validation.shipmentRequired'));
      }

      return shipmentLoadingApi.createOrUpdateSession({
        shipmentHeaderId: shipmentId,
        vehicleCheckInHeaderId: parseNumber(vehicleCheckInHeaderId),
        plateNo: plateNo || null,
        driverName: driverName || null,
        dockCode: dockCode || null,
        sealNo: sealNo || null,
        note: note || null,
      });
    },
    onSuccess: (detail) => {
      setActiveDetail(detail);
      toast.success(t('toast.sessionSaved'));
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.sessionError')),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, sessionId }: { action: 'stage' | 'load' | 'unload' | 'close'; sessionId: number }) => {
      const parsedPackageId = parseNumber(packageId);
      if (action !== 'close' && !parsedPackageId) {
        throw new Error(t('validation.packageRequired'));
      }

      if (action === 'stage') return shipmentLoadingApi.stagePackage(sessionId, parsedPackageId!, note || undefined);
      if (action === 'load') return shipmentLoadingApi.loadPackage(sessionId, parsedPackageId!, note || undefined);
      if (action === 'unload') return shipmentLoadingApi.unloadPackage(sessionId, parsedPackageId!, note || undefined);
      return shipmentLoadingApi.closeSession(sessionId);
    },
    onSuccess: (detail) => {
      setActiveDetail(detail);
      toast.success(t('toast.actionSuccess'));
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.actionError')),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveSessionMutation.mutate();
  };

  const openSession = (session: ShipmentLoadingSession) => {
    setShipmentHeaderId(String(session.shipmentHeaderId));
    setVehicleCheckInHeaderId(session.vehicleCheckInHeaderId ? String(session.vehicleCheckInHeaderId) : '');
    setPlateNo(session.plateNo ?? '');
    setDriverName(session.driverName ?? '');
    setDockCode(session.dockCode ?? '');
    setSealNo(session.sealNo ?? '');
    setNote(session.note ?? '');
    shipmentLoadingApi.createOrUpdateSession({
      shipmentHeaderId: session.shipmentHeaderId,
      vehicleCheckInHeaderId: session.vehicleCheckInHeaderId,
      plateNo: session.plateNo,
      driverName: session.driverName,
      dockCode: session.dockCode,
      sealNo: session.sealNo,
      note: session.note,
    }).then(setActiveDetail).catch((error) => toast.error(error instanceof Error ? error.message : t('toast.sessionError')));
  };

  const activeSessionId = activeDetail?.session.id;

  return (
    <OpsFormPageShell eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className={opsPanelClass}>
          <CardHeader>
            <CardTitle className={opsPanelTitleClass}>
              <Truck className="size-5 text-[var(--wms-ops-accent)]" />
              {t('session.title')}
            </CardTitle>
            <CardDescription>{t('session.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="shipmentHeaderId" className={opsLabelClass}>{t('fields.shipmentHeaderId')}</Label>
                <OpsInput id="shipmentHeaderId" value={shipmentHeaderId} onChange={(event) => setShipmentHeaderId(event.target.value)} inputMode="numeric" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicleCheckInHeaderId" className={opsLabelClass}>{t('fields.vehicleCheckInHeaderId')}</Label>
                <OpsInput id="vehicleCheckInHeaderId" value={vehicleCheckInHeaderId} onChange={(event) => setVehicleCheckInHeaderId(event.target.value)} inputMode="numeric" />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="plateNo" className={opsLabelClass}>{t('fields.plateNo')}</Label>
                  <OpsInput id="plateNo" value={plateNo} onChange={(event) => setPlateNo(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dockCode" className={opsLabelClass}>{t('fields.dockCode')}</Label>
                  <OpsInput id="dockCode" value={dockCode} onChange={(event) => setDockCode(event.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driverName" className={opsLabelClass}>{t('fields.driverName')}</Label>
                <OpsInput id="driverName" value={driverName} onChange={(event) => setDriverName(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sealNo" className={opsLabelClass}>{t('fields.sealNo')}</Label>
                <OpsInput id="sealNo" value={sealNo} onChange={(event) => setSealNo(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note" className={opsLabelClass}>{t('fields.note')}</Label>
                <OpsTextarea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <OpsActionButton className="w-full" type="submit" disabled={saveSessionMutation.isPending}>
                {t('actions.saveSession')}
              </OpsActionButton>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={opsPanelClass}>
            <CardHeader>
              <CardTitle className={opsPanelTitleClass}>
                <Warehouse className="size-5 text-[var(--wms-ops-accent)]" />
                {t('list.title')}
              </CardTitle>
              <CardDescription>{t('list.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsQuery.isLoading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
              {sessionsQuery.data?.data.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => openSession(session)}
                  className="wms-ops-surface-inset wms-ops-surface-row w-full p-4 text-left transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="wms-ops-surface-value">{session.shipmentDocumentNo || `#${session.shipmentHeaderId}`}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{session.plateNo || t('empty.noPlate')} · {session.driverName || t('empty.noDriver')}</p>
                    </div>
                    <Badge className={statusTone(session.status)}>{session.status}</Badge>
                  </div>
                  <div className="wms-ops-surface-meta mt-3 grid gap-2 text-muted-foreground md:grid-cols-3">
                    <span>{t('metrics.staged')}: {session.stagedPackageCount}</span>
                    <span>{t('metrics.loaded')}: {session.loadedPackageCount}</span>
                    <span>{t('metrics.unloaded')}: {session.unloadedPackageCount}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className={opsPanelClass}>
            <CardHeader>
              <CardTitle className={opsPanelTitleClass}>
                <PackageCheck className="size-5 text-[var(--wms-ops-accent)]" />
                {t('packages.title')}
              </CardTitle>
              <CardDescription>{t('packages.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
                <OpsInput value={packageId} onChange={(event) => setPackageId(event.target.value)} placeholder={t('fields.packageId')} inputMode="numeric" />
                <OpsActionButton variant="secondary" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'stage', sessionId: activeSessionId })}>{t('actions.stage')}</OpsActionButton>
                <OpsActionButton disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'load', sessionId: activeSessionId })}>{t('actions.load')}</OpsActionButton>
                <OpsActionButton variant="secondary" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'unload', sessionId: activeSessionId })}>{t('actions.unload')}</OpsActionButton>
                <Button type="button" variant="destructive" className="wms-ops-surface-danger-btn shadow-none" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'close', sessionId: activeSessionId })}>{t('actions.close')}</Button>
              </div>

              {!activeDetail && <p className={`${opsInsetClass} p-4 text-sm text-muted-foreground`}>{t('empty.selectSession')}</p>}
              {activeDetail && (
                <div className="space-y-3">
                  <div className={`${opsInsetClass} p-4 text-sm text-muted-foreground`}>
                    <p className="wms-ops-surface-value text-foreground">{activeDetail.session.shipmentDocumentNo || `#${activeDetail.session.shipmentHeaderId}`}</p>
                    <p>{t('fields.loadingStartedDate')}: {formatDate(activeDetail.session.loadingStartedDate)}</p>
                    <p>{t('fields.closedDate')}: {formatDate(activeDetail.session.closedDate)}</p>
                  </div>
                  {activeDetail.packages.map((item) => (
                    <div key={item.id} className={`${opsInsetClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
                      <div>
                        <p className="wms-ops-surface-value">{item.packageNo}</p>
                        <p className="wms-ops-surface-meta text-muted-foreground">{item.packageBarcode || `PackageId: ${item.packageId}`}</p>
                      </div>
                      <Badge className={statusTone(item.status)}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
