import { type FormEvent, type ReactElement, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PackageCheck, Truck, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/ui-store';
import { shipmentLoadingApi } from '../api/shipment-loading.api';
import type { ShipmentLoadingDetail, ShipmentLoadingSession } from '../types/shipment-loading.types';

const queryKey = ['shipment-loading', 'sessions'];

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

function statusTone(status: string): string {
  switch (status.toLowerCase()) {
    case 'closed':
    case 'loaded':
      return 'bg-emerald-100 text-emerald-800';
    case 'loading':
    case 'staged':
      return 'bg-cyan-100 text-cyan-800';
    case 'unloaded':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-700';
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
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
        <Badge className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-400">{t('eyebrow')}</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight">{t('title')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t('description')}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-5 text-cyan-700" />
              {t('session.title')}
            </CardTitle>
            <CardDescription>{t('session.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="shipmentHeaderId">{t('fields.shipmentHeaderId')}</Label>
                <Input id="shipmentHeaderId" value={shipmentHeaderId} onChange={(event) => setShipmentHeaderId(event.target.value)} inputMode="numeric" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicleCheckInHeaderId">{t('fields.vehicleCheckInHeaderId')}</Label>
                <Input id="vehicleCheckInHeaderId" value={vehicleCheckInHeaderId} onChange={(event) => setVehicleCheckInHeaderId(event.target.value)} inputMode="numeric" />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="plateNo">{t('fields.plateNo')}</Label>
                  <Input id="plateNo" value={plateNo} onChange={(event) => setPlateNo(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dockCode">{t('fields.dockCode')}</Label>
                  <Input id="dockCode" value={dockCode} onChange={(event) => setDockCode(event.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driverName">{t('fields.driverName')}</Label>
                <Input id="driverName" value={driverName} onChange={(event) => setDriverName(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sealNo">{t('fields.sealNo')}</Label>
                <Input id="sealNo" value={sealNo} onChange={(event) => setSealNo(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">{t('fields.note')}</Label>
                <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <Button className="w-full" type="submit" disabled={saveSessionMutation.isPending}>
                {t('actions.saveSession')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="size-5 text-cyan-700" />
                {t('list.title')}
              </CardTitle>
              <CardDescription>{t('list.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsQuery.isLoading && <p className="text-sm text-slate-500">{t('common.loading')}</p>}
              {sessionsQuery.data?.data.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => openSession(session)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{session.shipmentDocumentNo || `#${session.shipmentHeaderId}`}</p>
                      <p className="mt-1 text-sm text-slate-500">{session.plateNo || t('empty.noPlate')} · {session.driverName || t('empty.noDriver')}</p>
                    </div>
                    <Badge className={statusTone(session.status)}>{session.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                    <span>{t('metrics.staged')}: {session.stagedPackageCount}</span>
                    <span>{t('metrics.loaded')}: {session.loadedPackageCount}</span>
                    <span>{t('metrics.unloaded')}: {session.unloadedPackageCount}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="size-5 text-cyan-700" />
                {t('packages.title')}
              </CardTitle>
              <CardDescription>{t('packages.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
                <Input value={packageId} onChange={(event) => setPackageId(event.target.value)} placeholder={t('fields.packageId')} inputMode="numeric" />
                <Button type="button" variant="secondary" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'stage', sessionId: activeSessionId })}>{t('actions.stage')}</Button>
                <Button type="button" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'load', sessionId: activeSessionId })}>{t('actions.load')}</Button>
                <Button type="button" variant="outline" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'unload', sessionId: activeSessionId })}>{t('actions.unload')}</Button>
                <Button type="button" variant="destructive" disabled={!activeSessionId || actionMutation.isPending} onClick={() => activeSessionId && actionMutation.mutate({ action: 'close', sessionId: activeSessionId })}>{t('actions.close')}</Button>
              </div>

              {!activeDetail && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{t('empty.selectSession')}</p>}
              {activeDetail && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-bold text-slate-950">{activeDetail.session.shipmentDocumentNo || `#${activeDetail.session.shipmentHeaderId}`}</p>
                    <p>{t('fields.loadingStartedDate')}: {formatDate(activeDetail.session.loadingStartedDate)}</p>
                    <p>{t('fields.closedDate')}: {formatDate(activeDetail.session.closedDate)}</p>
                  </div>
                  {activeDetail.packages.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="font-bold text-slate-950">{item.packageNo}</p>
                        <p className="text-xs text-slate-500">{item.packageBarcode || `PackageId: ${item.packageId}`}</p>
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
    </div>
  );
}
