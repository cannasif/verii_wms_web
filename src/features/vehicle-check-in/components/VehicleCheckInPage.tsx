import { type ChangeEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { lookupApi } from '@/services/lookup-api';
import { useUIStore } from '@/stores/ui-store';
import { vehicleCheckInApi } from '../api/vehicle-check-in.api';
import type { CreateOrUpdateVehicleCheckInDto, VehicleCheckInHeaderDto } from '../types/vehicle-check-in.types';
import { VehicleCheckInFormSection } from './vehicle-check-in/VehicleCheckInFormSection';
import { VehicleCheckInImagesSection } from './vehicle-check-in/VehicleCheckInImagesSection';
import { formatDateTime, normalizePlateForLookup } from './vehicle-check-in/shared';

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

      <VehicleCheckInFormSection
        entryDateText={entryDateText}
        formState={formState}
        onFormStateChange={(updater) => setFormState(updater)}
        customerDialogOpen={customerDialogOpen}
        onCustomerDialogOpenChange={setCustomerDialogOpen}
        onFindToday={handleFindToday}
        findTodayPending={findTodayMutation.isPending}
        onPlateBlur={handlePlateBlur}
        onSave={handleSave}
        savePending={saveMutation.isPending}
        onOpenList={() => navigate('/vehicle-check-in/list')}
        fetchCustomers={({ pageNumber, pageSize, search, signal }) => lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
      />

      <VehicleCheckInImagesSection
        currentRecord={currentRecord}
        selectedFiles={selectedFiles}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        onUpload={() => uploadMutation.mutate()}
        uploadPending={uploadMutation.isPending}
        onDeleteImage={(imageId) => deleteImageMutation.mutate(imageId)}
        deletePending={deleteImageMutation.isPending}
      />
    </div>
  );
}
