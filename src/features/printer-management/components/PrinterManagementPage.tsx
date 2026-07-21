import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Pencil, Power, RefreshCcw, Save, SendToBack } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { OpsActionButton, OpsCircuitToggleField, OpsFormPageShell } from '@/components/shared';
import { MasterDataOpsErpEyebrow } from '@/features/shared';
import { useUIStore } from '@/stores/ui-store';
import { barcodeDesignerApi } from '@/features/barcode-designer/api/barcode-designer.api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { DefinitionExcelActions } from '@/features/definition-excel';
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
  const printerFormRef = useRef<HTMLDivElement>(null);
  const profileFormRef = useRef<HTMLDivElement>(null);

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
    onSuccess: (response) => {
      toast.success(response.message);
      void printersQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('printerManagement.messages.printerSaveError'));
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
    onSuccess: (response) => {
      toast.success(response.message);
      void profilesQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('printerManagement.messages.profileSaveError'));
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
    <OpsFormPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.printerManagement')} />}
      title={t('sidebar.printerManagement')}
      description={t('printerManagement.description')}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DefinitionExcelActions
            definitionKey="printer-definition"
            fileNamePrefix="yazici-tanimlari"
            onImportCompleted={async () => {
              await printersQuery.refetch();
              await profilesQuery.refetch();
            }}
          />
          <DefinitionExcelActions
            definitionKey="printer-profile"
            fileNamePrefix="yazici-profilleri"
            onImportCompleted={async () => {
              await profilesQuery.refetch();
            }}
          />
          <DefinitionExcelActions
            definitionKey="barcode-template-printer-profile"
            fileNamePrefix="barkod-sablon-yazici-eslesmeleri"
            onImportCompleted={async () => {
              await templateMappingsQuery.refetch();
            }}
          />
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => {
              void printersQuery.refetch();
              void profilesQuery.refetch();
              void templatesQuery.refetch();
              void templateMappingsQuery.refetch();
              void jobsQuery.refetch();
            }}
          >
            <RefreshCcw className="size-3.5" aria-hidden />
            {t('common.refresh')}
          </OpsActionButton>
        </div>
      }
    >
      <div className="wms-ops-form wms-ops-erp-skin grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
        <div className="min-w-0 space-y-6">
          <Card ref={printerFormRef} className="min-w-0 scroll-mt-6 rounded-none border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-card-bg)] shadow-none backdrop-blur-none">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">{t('printerManagement.printerForm.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset disabled={printerFormReadOnly} className={`space-y-4 ${printerFormReadOnly ? 'pointer-events-none opacity-75' : ''}`}>
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
                <OpsCircuitToggleField
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
                  title={t('common.active')}
                />
                <OpsCircuitToggleField
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isDefault: checked }))}
                  title={t('common.default')}
                />
                <OpsCircuitToggleField
                  checked={form.supportsRawCommands}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, supportsRawCommands: checked }))}
                  title={t('printerManagement.printerForm.rawCommand')}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <OpsActionButton onClick={() => saveMutation.mutate()} disabled={printerFormReadOnly}>
                  <Save className="size-3.5" aria-hidden />
                  {selectedPrinterId ? t('printerManagement.printerForm.update') : t('printerManagement.printerForm.create')}
                </OpsActionButton>
                <OpsActionButton
                  variant="secondary"
                  onClick={() => {
                    setSelectedPrinterId(null);
                    setForm(EMPTY_FORM);
                  }}
                  disabled={!permission.canCreate}
                >
                  {t('common.clearForm')}
                </OpsActionButton>
              </div>
              </fieldset>
            </CardContent>
          </Card>

          <Card ref={profileFormRef} className="min-w-0 scroll-mt-6 rounded-none border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-card-bg)] shadow-none backdrop-blur-none">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">{t('printerManagement.profileForm.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset disabled={profileFormReadOnly} className={`space-y-4 ${profileFormReadOnly ? 'pointer-events-none opacity-75' : ''}`}>
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
                <OpsCircuitToggleField
                  checked={profileForm.isActive}
                  onCheckedChange={(checked) => setProfileForm((current) => ({ ...current, isActive: checked }))}
                  title={t('common.active')}
                />
                <OpsCircuitToggleField
                  checked={profileForm.isDefault}
                  onCheckedChange={(checked) => setProfileForm((current) => ({ ...current, isDefault: checked }))}
                  title={t('printerManagement.profileForm.defaultProfile')}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <OpsActionButton onClick={() => saveProfileMutation.mutate()} disabled={profileFormReadOnly || profileForm.printerDefinitionId <= 0}>
                  <Save className="size-3.5" aria-hidden />
                  {selectedProfileId ? t('printerManagement.profileForm.update') : t('printerManagement.profileForm.create')}
                </OpsActionButton>
                <OpsActionButton
                  variant="secondary"
                  onClick={() => {
                    setSelectedProfileId(null);
                    setProfileForm(EMPTY_PROFILE_FORM);
                  }}
                  disabled={!permission.canCreate}
                >
                  {t('printerManagement.profileForm.clear')}
                </OpsActionButton>
              </div>
              </fieldset>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 rounded-none border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-card-bg)] shadow-none backdrop-blur-none">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">{t('printerManagement.tables.printers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="wms-ops-data-grid overflow-x-auto">
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
                      <TableCell>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="wms-ops-grid-icon-btn"
                          aria-label={t('common.edit')}
                          title={t('common.edit')}
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
                            requestAnimationFrame(() => printerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                          }}
                          disabled={!permission.canUpdate}
                        >
                          <Pencil className="size-3" aria-hidden />
                        </Button>
                        {printer.id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="wms-ops-grid-icon-btn"
                            aria-label={printer.isActive ? t('common.deactivate') : t('common.activate')}
                            title={printer.isActive ? t('common.deactivate') : t('common.activate')}
                            onClick={() => toggleMutation.mutate({ id: printer.id!, isActive: !printer.isActive })}
                            disabled={!permission.canUpdate || toggleMutation.isPending}
                          >
                            <Power className="size-3" aria-hidden />
                          </Button>
                        ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-none border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-card-bg)] shadow-none backdrop-blur-none">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">{t('printerManagement.tables.profiles')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="wms-ops-data-grid overflow-x-auto">
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
                      <TableCell>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="wms-ops-grid-icon-btn"
                          aria-label={t('common.edit')}
                          title={t('common.edit')}
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
                            requestAnimationFrame(() => profileFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                          }}
                          disabled={!permission.canUpdate}
                        >
                          <Pencil className="size-3" aria-hidden />
                        </Button>
                        {profile.id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="wms-ops-grid-icon-btn"
                            aria-label={profile.isActive ? t('common.deactivate') : t('common.activate')}
                            title={profile.isActive ? t('common.deactivate') : t('common.activate')}
                            onClick={() => toggleProfileMutation.mutate({ id: profile.id!, isActive: !profile.isActive })}
                            disabled={!permission.canUpdate || toggleProfileMutation.isPending}
                          >
                            <Power className="size-3" aria-hidden />
                          </Button>
                        ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-none border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-card-bg)] shadow-none backdrop-blur-none">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">{t('printerManagement.tables.mappings')}</CardTitle>
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
                <OpsActionButton
                  variant="secondary"
                  disabled={!canManageMappings || !selectedTemplateId || !selectedMappingProfileId}
                  onClick={() => saveTemplateMappingMutation.mutate({ printerProfileId: Number(selectedMappingProfileId), isDefault: false })}
                >
                  {t('printerManagement.mappingForm.add')}
                </OpsActionButton>
                <OpsActionButton
                  disabled={!canManageMappings || !selectedTemplateId || !selectedMappingProfileId}
                  onClick={() => saveTemplateMappingMutation.mutate({ printerProfileId: Number(selectedMappingProfileId), isDefault: true })}
                >
                  {t('printerManagement.mappingForm.addDefault')}
                </OpsActionButton>
              </div>
              <div className="wms-ops-data-grid overflow-x-auto">
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
              </div>
              {selectedTemplateId && (templateMappingsQuery.data?.data ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">{t('printerManagement.mappingForm.empty')}</div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-none border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-card-bg)] shadow-none backdrop-blur-none">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">{t('printerManagement.tables.jobs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="wms-ops-data-grid overflow-x-auto">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
