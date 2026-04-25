import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { RefreshCcw, Save, SendToBack } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/ui-store';
import { barcodeDesignerApi } from '@/features/barcode-designer/api/barcode-designer.api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { printerManagementApi } from '../api/printer-management.api';
import type { PrinterDefinitionUpsertRequest, PrinterProfileUpsertRequest } from '../types/printer-management.types';

const EMPTY_FORM: PrinterDefinitionUpsertRequest = {
  code: '',
  displayName: '',
  connectionType: 'AgentQueue',
  outputType: 'Pdf',
  host: '',
  queueName: '',
  description: '',
  isActive: true,
  isDefault: false,
  supportsRawCommands: false,
};

const EMPTY_PROFILE_FORM: PrinterProfileUpsertRequest = {
  printerDefinitionId: 0,
  code: '',
  displayName: '',
  labelWidth: 100,
  labelHeight: 150,
  dpi: 203,
  outputType: 'Zpl',
  transportType: 'TcpSocket',
  isActive: true,
  isDefault: false,
  description: '',
};

export function PrinterManagementPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.print-management');
  const [form, setForm] = useState<PrinterDefinitionUpsertRequest>(EMPTY_FORM);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState<PrinterProfileUpsertRequest>(EMPTY_PROFILE_FORM);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedMappingProfileId, setSelectedMappingProfileId] = useState<string>('');

  useEffect(() => {
    setPageTitle(t('sidebar.printerManagement'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const printersQuery = useQuery({
    queryKey: ['printer-management-printers'],
    queryFn: ({ signal }) => printerManagementApi.getPrinters({ signal }),
  });

  const jobsQuery = useQuery({
    queryKey: ['printer-management-jobs'],
    queryFn: ({ signal }) => printerManagementApi.getPrintJobs(50, { signal }),
  });

  const profilesQuery = useQuery({
    queryKey: ['printer-management-profiles'],
    queryFn: ({ signal }) => printerManagementApi.getProfiles(undefined, { signal }),
  });

  const templatesQuery = useQuery({
    queryKey: ['barcode-designer-templates-for-printer-mapping'],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplates({ signal }),
  });

  const templateMappingsQuery = useQuery({
    queryKey: ['printer-management-template-mappings', selectedTemplateId],
    queryFn: ({ signal }) => printerManagementApi.getTemplatePrinterProfiles(selectedTemplateId!, { signal }),
    enabled: !!selectedTemplateId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selectedPrinterId) {
        return await printerManagementApi.updatePrinter(selectedPrinterId, form);
      }
      return await printerManagementApi.createPrinter(form);
    },
    onSuccess: () => {
      toast.success(selectedPrinterId ? t('printerManagement.messages.printerUpdated') : t('printerManagement.messages.printerCreated'));
      void printersQuery.refetch();
      void profilesQuery.refetch();
      setForm(EMPTY_FORM);
      setSelectedPrinterId(null);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('printerManagement.messages.printerSaveError'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (payload: { id: number; isActive: boolean }) => await printerManagementApi.setPrinterActive(payload.id, payload.isActive),
    onSuccess: () => {
      void printersQuery.refetch();
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (selectedProfileId) {
        return await printerManagementApi.updateProfile(selectedProfileId, profileForm);
      }
      return await printerManagementApi.createProfile(profileForm);
    },
    onSuccess: () => {
      toast.success(selectedProfileId ? t('printerManagement.messages.profileUpdated') : t('printerManagement.messages.profileCreated'));
      void profilesQuery.refetch();
      setProfileForm(EMPTY_PROFILE_FORM);
      setSelectedProfileId(null);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('printerManagement.messages.profileSaveError'));
    },
  });

  const toggleProfileMutation = useMutation({
    mutationFn: async (payload: { id: number; isActive: boolean }) => await printerManagementApi.setProfileActive(payload.id, payload.isActive),
    onSuccess: () => {
      void profilesQuery.refetch();
    },
  });

  const saveTemplateMappingMutation = useMutation({
    mutationFn: async (payload: { printerProfileId: number; isDefault: boolean }) => {
      if (!selectedTemplateId) {
        throw new Error(t('printerManagement.messages.templateRequired'));
      }

      return await printerManagementApi.upsertTemplatePrinterProfile({
        barcodeTemplateId: selectedTemplateId,
        printerProfileId: payload.printerProfileId,
        isDefault: payload.isDefault,
      });
    },
    onSuccess: () => {
      toast.success(t('printerManagement.messages.mappingSaved'));
      void templateMappingsQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('printerManagement.messages.mappingSaveError'));
    },
  });

  const mappingCandidateProfiles = useMemo(() => {
    return (profilesQuery.data?.data ?? []).filter((item) => item.isActive);
  }, [profilesQuery.data?.data]);
  const printerFormReadOnly = selectedPrinterId ? !permission.canUpdate : !permission.canCreate;
  const profileFormReadOnly = selectedProfileId ? !permission.canUpdate : !permission.canCreate;
  const canManageMappings = permission.canUpdate;

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp') },
          { label: t('sidebar.erpBarcodeDesigner') },
          { label: t('sidebar.printerManagement'), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('printerManagement.badges.serverPrinting')}</Badge>
              <Badge variant="secondary">{t('printerManagement.badges.queue')}</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{t('sidebar.printerManagement')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t('printerManagement.description')}
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            void printersQuery.refetch();
            void profilesQuery.refetch();
            void templatesQuery.refetch();
            void templateMappingsQuery.refetch();
            void jobsQuery.refetch();
          }}>
            <RefreshCcw className="mr-2 size-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('printerManagement.printerForm.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset disabled={printerFormReadOnly} className={printerFormReadOnly ? 'pointer-events-none opacity-75' : undefined}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('printerManagement.printerForm.code')}</Label>
                  <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.printerForm.displayName')}</Label>
                  <Input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('printerManagement.printerForm.connectionType')}</Label>
                  <Select value={form.connectionType} onValueChange={(value) => setForm((current) => ({ ...current, connectionType: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AgentQueue">Agent Queue</SelectItem>
                      <SelectItem value="NetworkPrinter">Network Printer</SelectItem>
                      <SelectItem value="ServerQueue">Server Queue</SelectItem>
                      <SelectItem value="RawZpl">Raw ZPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.printerForm.outputType')}</Label>
                  <Select value={form.outputType} onValueChange={(value) => setForm((current) => ({ ...current, outputType: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pdf">PDF</SelectItem>
                      <SelectItem value="Png">PNG</SelectItem>
                      <SelectItem value="Svg">SVG</SelectItem>
                      <SelectItem value="Zpl">ZPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('printerManagement.printerForm.host')}</Label>
                  <Input value={form.host ?? ''} onChange={(event) => setForm((current) => ({ ...current, host: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.printerForm.queue')}</Label>
                  <Input value={form.queueName ?? ''} onChange={(event) => setForm((current) => ({ ...current, queueName: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-3 py-2 dark:border-white/10">
                  <span className="text-sm">{t('common.active')}</span>
                  <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-3 py-2 dark:border-white/10">
                  <span className="text-sm">{t('common.default')}</span>
                  <Switch checked={form.isDefault} onCheckedChange={(checked) => setForm((current) => ({ ...current, isDefault: checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-3 py-2 dark:border-white/10">
                  <span className="text-sm">{t('printerManagement.printerForm.rawCommand')}</span>
                  <Switch checked={form.supportsRawCommands} onCheckedChange={(checked) => setForm((current) => ({ ...current, supportsRawCommands: checked }))} />
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => saveMutation.mutate()} disabled={printerFormReadOnly}>
                  <Save className="mr-2 size-4" />
                  {selectedPrinterId ? t('printerManagement.printerForm.update') : t('printerManagement.printerForm.create')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPrinterId(null);
                    setForm(EMPTY_FORM);
                  }}
                  disabled={!permission.canCreate}
                >
                  {t('common.clearForm')}
                </Button>
              </div>
              </fieldset>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('printerManagement.profileForm.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset disabled={profileFormReadOnly} className={profileFormReadOnly ? 'pointer-events-none opacity-75' : undefined}>
              <div className="space-y-2">
                <Label>{t('printerManagement.profileForm.printer')}</Label>
                <Select
                  value={profileForm.printerDefinitionId > 0 ? String(profileForm.printerDefinitionId) : ''}
                  onValueChange={(value) => setProfileForm((current) => ({ ...current, printerDefinitionId: Number(value) }))}
                >
                  <SelectTrigger><SelectValue placeholder={t('printerManagement.profileForm.selectPrinter')} /></SelectTrigger>
                  <SelectContent>
                    {(printersQuery.data?.data ?? []).map((printer) => (
                      <SelectItem key={printer.id} value={String(printer.id)}>
                        {printer.displayName} ({printer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('printerManagement.profileForm.code')}</Label>
                  <Input value={profileForm.code} onChange={(event) => setProfileForm((current) => ({ ...current, code: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.profileForm.displayName')}</Label>
                  <Input value={profileForm.displayName} onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('printerManagement.profileForm.width')}</Label>
                  <Input type="number" value={profileForm.labelWidth} onChange={(event) => setProfileForm((current) => ({ ...current, labelWidth: Number(event.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.profileForm.height')}</Label>
                  <Input type="number" value={profileForm.labelHeight} onChange={(event) => setProfileForm((current) => ({ ...current, labelHeight: Number(event.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>DPI</Label>
                  <Input type="number" value={profileForm.dpi} onChange={(event) => setProfileForm((current) => ({ ...current, dpi: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('printerManagement.profileForm.outputType')}</Label>
                  <Select value={profileForm.outputType} onValueChange={(value) => setProfileForm((current) => ({ ...current, outputType: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pdf">PDF</SelectItem>
                      <SelectItem value="Png">PNG</SelectItem>
                      <SelectItem value="Svg">SVG</SelectItem>
                      <SelectItem value="Zpl">ZPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.profileForm.transportType')}</Label>
                  <Select value={profileForm.transportType} onValueChange={(value) => setProfileForm((current) => ({ ...current, transportType: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TcpSocket">TCP Socket</SelectItem>
                      <SelectItem value="SystemQueue">System Queue</SelectItem>
                      <SelectItem value="FileDrop">File Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea value={profileForm.description ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-3 py-2 dark:border-white/10">
                  <span className="text-sm">{t('common.active')}</span>
                  <Switch checked={profileForm.isActive} onCheckedChange={(checked) => setProfileForm((current) => ({ ...current, isActive: checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-3 py-2 dark:border-white/10">
                  <span className="text-sm">{t('printerManagement.profileForm.defaultProfile')}</span>
                  <Switch checked={profileForm.isDefault} onCheckedChange={(checked) => setProfileForm((current) => ({ ...current, isDefault: checked }))} />
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => saveProfileMutation.mutate()} disabled={profileFormReadOnly || profileForm.printerDefinitionId <= 0}>
                  <Save className="mr-2 size-4" />
                  {selectedProfileId ? t('printerManagement.profileForm.update') : t('printerManagement.profileForm.create')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProfileId(null);
                    setProfileForm(EMPTY_PROFILE_FORM);
                  }}
                  disabled={!permission.canCreate}
                >
                  {t('printerManagement.profileForm.clear')}
                </Button>
              </div>
              </fieldset>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('printerManagement.tables.printers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('printerManagement.table.code')}</TableHead>
                    <TableHead>{t('printerManagement.table.name')}</TableHead>
                    <TableHead>{t('printerManagement.table.connection')}</TableHead>
                    <TableHead>{t('printerManagement.table.output')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(printersQuery.data?.data ?? []).map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.code}</TableCell>
                      <TableCell>{printer.displayName}</TableCell>
                      <TableCell>{printer.connectionType}</TableCell>
                      <TableCell>{printer.outputType}</TableCell>
                      <TableCell className="space-x-2">
                        <Badge variant={printer.isActive ? 'secondary' : 'outline'}>{printer.isActive ? t('common.active') : t('common.passive')}</Badge>
                        {printer.isDefault ? <Badge variant="outline">{t('common.default')}</Badge> : null}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPrinterId(printer.id ?? null);
                            setForm({
                              code: printer.code,
                              displayName: printer.displayName,
                              connectionType: printer.connectionType,
                              outputType: printer.outputType,
                              host: printer.host ?? '',
                              queueName: printer.queueName ?? '',
                              description: printer.description ?? '',
                              isActive: printer.isActive,
                              isDefault: printer.isDefault,
                              supportsRawCommands: printer.supportsRawCommands,
                            });
                          }}
                          disabled={!permission.canUpdate}
                        >
                          {t('common.edit')}
                        </Button>
                        {printer.id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMutation.mutate({ id: printer.id!, isActive: !printer.isActive })}
                            disabled={!permission.canUpdate}
                          >
                            {printer.isActive ? t('common.deactivate') : t('common.activate')}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('printerManagement.tables.profiles')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('printerManagement.table.profile')}</TableHead>
                    <TableHead>{t('printerManagement.table.printer')}</TableHead>
                    <TableHead>{t('printerManagement.table.size')}</TableHead>
                    <TableHead>{t('printerManagement.table.format')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(profilesQuery.data?.data ?? []).map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div>{profile.displayName}</div>
                        <div className="text-xs text-slate-500">{profile.code}</div>
                      </TableCell>
                      <TableCell>{profile.printerDisplayName}</TableCell>
                      <TableCell>{profile.labelWidth} x {profile.labelHeight} mm / {profile.dpi} DPI</TableCell>
                      <TableCell>{profile.outputType} / {profile.transportType}</TableCell>
                      <TableCell className="space-x-2">
                        <Badge variant={profile.isActive ? 'secondary' : 'outline'}>{profile.isActive ? t('common.active') : t('common.passive')}</Badge>
                        {profile.isDefault ? <Badge variant="outline">{t('common.default')}</Badge> : null}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProfileId(profile.id ?? null);
                            setProfileForm({
                              printerDefinitionId: profile.printerDefinitionId,
                              code: profile.code,
                              displayName: profile.displayName,
                              labelWidth: profile.labelWidth,
                              labelHeight: profile.labelHeight,
                              dpi: profile.dpi,
                              outputType: profile.outputType,
                              transportType: profile.transportType,
                              isActive: profile.isActive,
                              isDefault: profile.isDefault,
                              description: profile.description ?? '',
                            });
                          }}
                          disabled={!permission.canUpdate}
                        >
                          {t('common.edit')}
                        </Button>
                        {profile.id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProfileMutation.mutate({ id: profile.id!, isActive: !profile.isActive })}
                            disabled={!permission.canUpdate}
                          >
                            {profile.isActive ? t('common.deactivate') : t('common.activate')}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('printerManagement.tables.mappings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-[0.42fr_0.58fr]">
                <div className="space-y-2">
                  <Label>{t('printerManagement.mappingForm.template')}</Label>
                  <Select
                    value={selectedTemplateId ? String(selectedTemplateId) : ''}
                    onValueChange={(value) => setSelectedTemplateId(Number(value))}
                  >
                    <SelectTrigger><SelectValue placeholder={t('printerManagement.mappingForm.selectTemplate')} /></SelectTrigger>
                    <SelectContent>
                      {(templatesQuery.data?.data ?? []).map((template) => (
                        <SelectItem key={template.id} value={String(template.id)}>
                          {template.displayName} ({template.templateCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('printerManagement.mappingForm.profile')}</Label>
                  <Select value={selectedMappingProfileId} onValueChange={setSelectedMappingProfileId}>
                    <SelectTrigger><SelectValue placeholder={t('printerManagement.mappingForm.selectProfile')} /></SelectTrigger>
                    <SelectContent>
                      {mappingCandidateProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={String(profile.id)}>
                          {profile.displayName} ({profile.printerDisplayName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  disabled={!canManageMappings || !selectedTemplateId || !selectedMappingProfileId}
                  onClick={() => saveTemplateMappingMutation.mutate({ printerProfileId: Number(selectedMappingProfileId), isDefault: false })}
                >
                  {t('printerManagement.mappingForm.add')}
                </Button>
                <Button
                  disabled={!canManageMappings || !selectedTemplateId || !selectedMappingProfileId}
                  onClick={() => saveTemplateMappingMutation.mutate({ printerProfileId: Number(selectedMappingProfileId), isDefault: true })}
                >
                  {t('printerManagement.mappingForm.addDefault')}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('printerManagement.mappingForm.template')}</TableHead>
                    <TableHead>{t('printerManagement.mappingForm.profile')}</TableHead>
                    <TableHead>{t('printerManagement.table.printer')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(templateMappingsQuery.data?.data ?? []).map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">
                        <div>{mapping.templateDisplayName}</div>
                        <div className="text-xs text-slate-500">{mapping.templateCode}</div>
                      </TableCell>
                      <TableCell>
                        <div>{mapping.printerProfileDisplayName}</div>
                        <div className="text-xs text-slate-500">{mapping.printerProfileCode}</div>
                      </TableCell>
                      <TableCell>{mapping.printerCode}</TableCell>
                      <TableCell>
                        <Badge variant={mapping.isDefault ? 'default' : 'secondary'}>
                          {mapping.isDefault ? t('common.default') : t('printerManagement.mappingForm.attached')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!mapping.isDefault ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveTemplateMappingMutation.mutate({ printerProfileId: mapping.printerProfileId, isDefault: true })}
                            disabled={!permission.canUpdate}
                          >
                            {t('printerManagement.mappingForm.makeDefault')}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedTemplateId && (templateMappingsQuery.data?.data ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">{t('printerManagement.mappingForm.empty')}</div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{t('printerManagement.tables.jobs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('printerManagement.jobs.jobName')}</TableHead>
                    <TableHead>{t('printerManagement.table.printer')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.error')}</TableHead>
                    <TableHead>{t('printerManagement.jobs.retry', { defaultValue: 'Missing translation' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(jobsQuery.data?.data ?? []).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.jobName}</TableCell>
                      <TableCell>
                        <div>{job.printerDisplayName}</div>
                        {job.printerProfileDisplayName ? (
                          <div className="text-xs text-slate-500">{job.printerProfileDisplayName}</div>
                        ) : null}
                      </TableCell>
                      <TableCell><Badge variant="outline">{job.status}</Badge></TableCell>
                      <TableCell>{job.requestedAt}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{job.errorMessage ?? '-'}</TableCell>
                      <TableCell>
                        {job.id && (job.status === 'Failed' || job.status === 'Cancelled') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await printerManagementApi.retryPrintJob(job.id!);
                              toast.success(t('printerManagement.messages.retryQueued'));
                              void jobsQuery.refetch();
                            }}
                            disabled={!permission.canCreate}
                          >
                            <SendToBack className="mr-2 size-4" />
                            {t('printerManagement.jobs.retry', { defaultValue: 'Missing translation' })}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
