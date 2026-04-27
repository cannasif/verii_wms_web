import { type ChangeEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CarFront, ImagePlus, Loader2, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup } from '@/services/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { vehicleCheckInApi } from '../api/vehicle-check-in.api';
import type { CreateOrUpdateVehicleCheckInDto, VehicleCheckInHeaderDto } from '../types/vehicle-check-in.types';

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('tr-TR');
}

function buildCustomerLabel(record: Pick<CreateOrUpdateVehicleCheckInDto, 'customerCode' | 'customerName'>): string | null {
  if (!record.customerCode && !record.customerName) {
    return null;
  }

  return [record.customerCode, record.customerName].filter(Boolean).join(' - ');
}

function normalizePlateForLookup(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function VehicleCheckInPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastLookupPlateRef = useRef<string>('');

  const [formState, setFormState] = useState<CreateOrUpdateVehicleCheckInDto>({
    branchCode: '0',
    plateNo: '',
    firstName: '',
    lastName: '',
    customerId: null,
    customerCode: '',
    customerName: '',
  });
  const [currentRecord, setCurrentRecord] = useState<VehicleCheckInHeaderDto | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const entryDateText = useMemo(
    () => formatDateTime(currentRecord?.entryDate) || formatDateTime(new Date().toISOString()),
    [currentRecord?.entryDate],
  );

  useEffect(() => {
    setPageTitle(t('vehicleCheckIn.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getByIdMutation = useMutation({
    mutationFn: (id: number) => vehicleCheckInApi.getById(id),
    onSuccess: (data) => {
      hydrateForm(data);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) {
      return;
    }

    if (currentRecord?.id === id || getByIdMutation.isPending) {
      return;
    }

    getByIdMutation.mutate(id);
  }, [currentRecord?.id, getByIdMutation, searchParams]);

  const findTodayMutation = useMutation({
    mutationFn: (plateNo: string) => vehicleCheckInApi.findTodayByPlate(plateNo),
    onSuccess: (data) => {
      hydrateForm(data);
      toast.success(t('vehicleCheckIn.messages.todayFound'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const saveMutation = useMutation({
    mutationFn: (dto: CreateOrUpdateVehicleCheckInDto) => vehicleCheckInApi.save(dto),
    onSuccess: (data) => {
      hydrateForm(data);
      setSearchParams({ id: String(data.id) }, { replace: true });
      toast.success(t('vehicleCheckIn.messages.saved'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!currentRecord) {
        throw new Error(t('vehicleCheckIn.messages.saveFirst'));
      }

      return vehicleCheckInApi.uploadImages(currentRecord.id, selectedFiles);
    },
    onSuccess: async () => {
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (currentRecord) {
        const refreshed = await vehicleCheckInApi.getById(currentRecord.id);
        hydrateForm(refreshed);
      }
      toast.success(t('vehicleCheckIn.messages.imagesUploaded'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await vehicleCheckInApi.deleteImage(imageId);
      if (!currentRecord) {
        return;
      }
      return vehicleCheckInApi.getById(currentRecord.id);
    },
    onSuccess: (refreshed) => {
      if (refreshed) {
        hydrateForm(refreshed);
      }
      toast.success(t('vehicleCheckIn.messages.imageDeleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  function hydrateForm(data: VehicleCheckInHeaderDto): void {
    setCurrentRecord(data);
    lastLookupPlateRef.current = normalizePlateForLookup(data.plateNo);
    setFormState({
      branchCode: data.branchCode || '0',
      plateNo: data.plateNo,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      customerId: data.customerId ?? null,
      customerCode: data.customerCode || '',
      customerName: data.customerName || '',
    });
  }

  function handleSave(): void {
    if (!formState.plateNo.trim()) {
      toast.error(t('vehicleCheckIn.messages.plateRequired'));
      return;
    }

    saveMutation.mutate({
      ...formState,
      plateNo: formState.plateNo.trim(),
    });
  }

  function handleFindToday(): void {
    const plateNo = formState.plateNo.trim();
    if (!plateNo) {
      toast.error(t('vehicleCheckIn.messages.plateRequired'));
      return;
    }

    lastLookupPlateRef.current = normalizePlateForLookup(plateNo);
    findTodayMutation.mutate(plateNo);
  }

  function handlePlateBlur(): void {
    const plateNo = formState.plateNo.trim();
    if (!plateNo || findTodayMutation.isPending) {
      return;
    }

    const normalizedPlate = normalizePlateForLookup(plateNo);
    if (!normalizedPlate) {
      return;
    }

    const currentRecordPlate = normalizePlateForLookup(currentRecord?.plateNo);
    if (currentRecord?.id && currentRecordPlate === normalizedPlate) {
      lastLookupPlateRef.current = normalizedPlate;
      return;
    }

    if (lastLookupPlateRef.current === normalizedPlate) {
      return;
    }

    lastLookupPlateRef.current = normalizedPlate;
    findTodayMutation.mutate(plateNo);
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    setSelectedFiles(files);
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('vehicleCheckIn.badge')}</Badge>

      <FormPageShell title={t('vehicleCheckIn.title')} description={t('vehicleCheckIn.description')}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 p-4 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
            <div className="font-semibold">{t('vehicleCheckIn.guidance.title')}</div>
            <div className="mt-1">{t('vehicleCheckIn.guidance.sameDayRule')}</div>
            <div>{t('vehicleCheckIn.guidance.nextDayRule')}</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicle-plate">{t('vehicleCheckIn.fields.plate')} *</Label>
              <div className="flex gap-2">
                <Input
                  id="vehicle-plate"
                  value={formState.plateNo}
                  onChange={(event) => setFormState((prev) => ({ ...prev, plateNo: event.target.value.toUpperCase() }))}
                  onBlur={handlePlateBlur}
                  placeholder={t('vehicleCheckIn.fields.platePh')}
                />
                <Button type="button" variant="outline" onClick={handleFindToday} disabled={findTodayMutation.isPending}>
                  {findTodayMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
                  {t('vehicleCheckIn.actions.findToday')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('vehicleCheckIn.fields.entryDate')}</Label>
              <Input value={entryDateText} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-first-name">{t('vehicleCheckIn.fields.firstName')}</Label>
              <Input
                id="vehicle-first-name"
                value={formState.firstName || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, firstName: event.target.value }))}
                placeholder={t('vehicleCheckIn.fields.firstNamePh')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-last-name">{t('vehicleCheckIn.fields.lastName')}</Label>
              <Input
                id="vehicle-last-name"
                value={formState.lastName || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, lastName: event.target.value }))}
                placeholder={t('vehicleCheckIn.fields.lastNamePh')}
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>{t('vehicleCheckIn.fields.customer')}</Label>
              <PagedLookupDialog<CustomerLookup>
                open={customerDialogOpen}
                onOpenChange={setCustomerDialogOpen}
                title={t('vehicleCheckIn.customerLookup.title')}
                description={t('vehicleCheckIn.customerLookup.description')}
                value={buildCustomerLabel(formState)}
                placeholder={t('vehicleCheckIn.fields.customerPh')}
                queryKey={['vehicle-check-in', 'customers']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
                onSelect={(item) => setFormState((prev) => ({
                  ...prev,
                  customerId: item.id,
                  customerCode: item.cariKod,
                  customerName: item.cariIsim,
                }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CarFront className="mr-2 size-4" />}
              {t('vehicleCheckIn.actions.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/vehicle-check-in/list')}>
              {t('vehicleCheckIn.actions.openList')}
            </Button>
          </div>
        </div>
      </FormPageShell>

      <FormPageShell title={t('vehicleCheckIn.images.title')} description={t('vehicleCheckIn.images.description')}>
        <div className="space-y-4">
          {!currentRecord ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('vehicleCheckIn.images.saveHint')}
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <ImagePlus className="size-4" />
                  {t('vehicleCheckIn.images.add')}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => uploadMutation.mutate()}
                    disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
                    {t('vehicleCheckIn.images.upload')}
                  </Button>
                </div>
                {selectedFiles.length > 0 ? (
                  <div className="mt-3 text-xs text-slate-500">
                    {selectedFiles.map((file) => file.name).join(', ')}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {currentRecord.images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
                    <img src={image.fileUrl} alt={image.fileName || image.fileUrl} className="h-48 w-full object-cover" />
                    <div className="space-y-3 p-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{image.fileName || t('vehicleCheckIn.images.image')}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(image.createdDate)}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteImageMutation.mutate(image.id)}
                        disabled={deleteImageMutation.isPending}
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('vehicleCheckIn.images.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {currentRecord.images.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {t('vehicleCheckIn.images.empty')}
                </div>
              ) : null}
            </>
          )}
        </div>
      </FormPageShell>
    </div>
  );
}
