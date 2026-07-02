import { type ReactElement, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { OpsActionButton, OpsFormPageShell, OpsServiceEyebrow } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { serviceAllocationApi } from '../api/service-allocation.api';
import { useServiceCaseTimelineQuery } from '../hooks/useServiceCaseTimelineQuery';
import { ServiceCaseExistingLinesSection } from './service-case-form/ServiceCaseExistingLinesSection';
import { ServiceCaseHeaderSection } from './service-case-form/ServiceCaseHeaderSection';
import { ServiceCaseInitialLineSection } from './service-case-form/ServiceCaseInitialLineSection';
import { type ServiceCaseFormValues, toDateInput } from './service-case-form/shared';

export function ServiceCaseFormPage(): ReactElement {
  const { t } = useTranslation(['service-allocation', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const parsedId = Number(id);
  const isEdit = Number.isFinite(parsedId) && parsedId > 0;
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const timelineQuery = useServiceCaseTimelineQuery(isEdit ? parsedId : undefined);
  const canSubmit = isEdit ? permission.canUpdate : permission.canCreate;
  const isReadOnly = !canSubmit;
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [incomingStockLookupOpen, setIncomingStockLookupOpen] = useState(false);
  const [intakeWarehouseLookupOpen, setIntakeWarehouseLookupOpen] = useState(false);
  const [currentWarehouseLookupOpen, setCurrentWarehouseLookupOpen] = useState(false);
  const [initialLineStockLookupOpen, setInitialLineStockLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedIncomingStockLabel, setSelectedIncomingStockLabel] = useState('');
  const [selectedIntakeWarehouseLabel, setSelectedIntakeWarehouseLabel] = useState('');
  const [selectedCurrentWarehouseLabel, setSelectedCurrentWarehouseLabel] = useState('');
  const [selectedInitialLineStockLabel, setSelectedInitialLineStockLabel] = useState('');

  const form = useForm<ServiceCaseFormValues>({
    defaultValues: {
      caseNo: '',
      requestSource: '1',
      requestReference: '',
      customerCode: '',
      customerId: '',
      incomingStockCode: '',
      incomingStockId: '',
      incomingSerialNo: '',
      barcode: '',
      saleDate: '',
      warrantyPeriodMonths: '24',
      warrantyStatus: '0',
      forceWarrantyOverride: false,
      warrantyOverrideReason: '',
      intakeWarehouseId: '',
      currentWarehouseId: '',
      serviceWarehouseId: '',
      serviceShelfId: '',
      customerComplaint: '',
      faultDescription: '',
      diagnosisNote: '',
      resolutionNote: '',
      status: '0',
      receivedAt: '',
      closedAt: '',
      initialLineType: '1',
      initialProcessType: '1',
      initialLineStockCode: '',
      initialLineStockId: '',
      initialLineQuantity: '',
      initialLineUnit: '',
      initialLineErpOrderNo: '',
      initialLineErpOrderId: '',
      initialLineDescription: '',
    },
  });

  useEffect(() => {
    setPageTitle(
      isEdit
        ? t('serviceAllocation.form.editTitle')
        : t('serviceAllocation.form.createTitle'),
    );
    return () => setPageTitle(null);
  }, [isEdit, setPageTitle, t]);

  useEffect(() => {
    if (!timelineQuery.data) {
      return;
    }

    const { serviceCase } = timelineQuery.data;
    form.reset({
      caseNo: serviceCase.caseNo ?? '',
      requestSource: String(serviceCase.requestSource ?? 1),
      requestReference: serviceCase.requestReference ?? '',
      customerCode: serviceCase.customerCode ?? '',
      customerId: serviceCase.customerId ? String(serviceCase.customerId) : '',
      incomingStockCode: serviceCase.incomingStockCode ?? '',
      incomingStockId: serviceCase.incomingStockId ? String(serviceCase.incomingStockId) : '',
      incomingSerialNo: serviceCase.incomingSerialNo ?? '',
      barcode: serviceCase.barcode ?? '',
      saleDate: toDateInput(serviceCase.saleDate),
      warrantyPeriodMonths: String(serviceCase.warrantyPeriodMonths ?? 24),
      warrantyStatus: String(serviceCase.warrantyStatus ?? 0),
      forceWarrantyOverride: Boolean(serviceCase.warrantyManuallyOverridden),
      warrantyOverrideReason: '',
      intakeWarehouseId: serviceCase.intakeWarehouseId ? String(serviceCase.intakeWarehouseId) : '',
      currentWarehouseId: serviceCase.currentWarehouseId ? String(serviceCase.currentWarehouseId) : '',
      serviceWarehouseId: serviceCase.serviceWarehouseId ? String(serviceCase.serviceWarehouseId) : '',
      serviceShelfId: serviceCase.serviceShelfId ? String(serviceCase.serviceShelfId) : '',
      customerComplaint: serviceCase.customerComplaint ?? '',
      faultDescription: serviceCase.faultDescription ?? '',
      diagnosisNote: serviceCase.diagnosisNote ?? '',
      resolutionNote: serviceCase.resolutionNote ?? '',
      status: String(serviceCase.status ?? 0),
      receivedAt: toDateInput(serviceCase.receivedAt),
      closedAt: toDateInput(serviceCase.closedAt),
      initialLineType: '1',
      initialProcessType: '1',
      initialLineStockCode: '',
      initialLineStockId: '',
      initialLineQuantity: '',
      initialLineUnit: '',
      initialLineErpOrderNo: '',
      initialLineErpOrderId: '',
      initialLineDescription: '',
    });

    setSelectedCustomerLabel(serviceCase.customerCode ?? '');
    setSelectedIncomingStockLabel(serviceCase.incomingStockCode ?? '');
    setSelectedIntakeWarehouseLabel(serviceCase.intakeWarehouseId ? `#${serviceCase.intakeWarehouseId}` : '');
    setSelectedCurrentWarehouseLabel(serviceCase.currentWarehouseId ? `#${serviceCase.currentWarehouseId}` : '');
  }, [form, timelineQuery.data]);

  useEffect(() => {
    if (!timelineQuery.data) {
      return;
    }

    const { serviceCase } = timelineQuery.data;
    let active = true;

    void Promise.allSettled([
      serviceCase.customerId ? lookupApi.getCustomerById(serviceCase.customerId) : Promise.resolve(null),
      serviceCase.incomingStockId ? lookupApi.getProductById(serviceCase.incomingStockId) : Promise.resolve(null),
      serviceCase.intakeWarehouseId ? lookupApi.getWarehouseById(serviceCase.intakeWarehouseId) : Promise.resolve(null),
      serviceCase.currentWarehouseId ? lookupApi.getWarehouseById(serviceCase.currentWarehouseId) : Promise.resolve(null),
    ]).then(([customerResult, stockResult, intakeWarehouseResult, currentWarehouseResult]) => {
      if (!active) {
        return;
      }

      if (customerResult.status === 'fulfilled' && customerResult.value) {
        setSelectedCustomerLabel(`${customerResult.value.cariKod} - ${customerResult.value.cariIsim}`);
      }

      if (stockResult.status === 'fulfilled' && stockResult.value) {
        setSelectedIncomingStockLabel(`${stockResult.value.stokKodu} - ${stockResult.value.stokAdi}`);
      }

      if (intakeWarehouseResult.status === 'fulfilled' && intakeWarehouseResult.value) {
        setSelectedIntakeWarehouseLabel(`${intakeWarehouseResult.value.depoKodu} - ${intakeWarehouseResult.value.depoIsmi}`);
      }

      if (currentWarehouseResult.status === 'fulfilled' && currentWarehouseResult.value) {
        setSelectedCurrentWarehouseLabel(`${currentWarehouseResult.value.depoKodu} - ${currentWarehouseResult.value.depoIsmi}`);
      }
    });

    return () => {
      active = false;
    };
  }, [timelineQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: ServiceCaseFormValues) => {
      const casePayload = {
        caseNo: values.caseNo,
        requestSource: Number(values.requestSource),
        requestReference: values.requestReference || undefined,
        customerCode: values.customerCode,
        customerId: values.customerId ? Number(values.customerId) : undefined,
        incomingStockCode: values.incomingStockCode || undefined,
        incomingStockId: values.incomingStockId ? Number(values.incomingStockId) : undefined,
        incomingSerialNo: values.incomingSerialNo || undefined,
        barcode: values.barcode || undefined,
        saleDate: values.saleDate || undefined,
        warrantyPeriodMonths: values.warrantyPeriodMonths ? Number(values.warrantyPeriodMonths) : 24,
        warrantyStatus: Number(values.warrantyStatus),
        forceWarrantyOverride: values.forceWarrantyOverride,
        warrantyOverrideReason: values.warrantyOverrideReason || undefined,
        intakeWarehouseId: values.intakeWarehouseId ? Number(values.intakeWarehouseId) : undefined,
        currentWarehouseId: values.currentWarehouseId ? Number(values.currentWarehouseId) : undefined,
        serviceWarehouseId: values.serviceWarehouseId ? Number(values.serviceWarehouseId) : undefined,
        serviceShelfId: values.serviceShelfId ? Number(values.serviceShelfId) : undefined,
        customerComplaint: values.customerComplaint || undefined,
        faultDescription: values.faultDescription || undefined,
        diagnosisNote: values.diagnosisNote || undefined,
        resolutionNote: values.resolutionNote || undefined,
        status: Number(values.status),
        receivedAt: values.receivedAt || undefined,
        closedAt: values.closedAt || undefined,
        branchCode: '0',
      };

      const serviceCase = isEdit
        ? await serviceAllocationApi.updateServiceCase(parsedId, casePayload)
        : await serviceAllocationApi.createServiceCase(casePayload);

      const hasInitialLine = Boolean(values.initialLineQuantity && Number(values.initialLineQuantity) > 0);
      if (hasInitialLine) {
        await serviceAllocationApi.createServiceCaseLine({
          serviceCaseId: serviceCase.id,
          lineType: Number(values.initialLineType),
          processType: Number(values.initialProcessType),
          stockCode: values.initialLineStockCode || undefined,
          stockId: values.initialLineStockId ? Number(values.initialLineStockId) : undefined,
          quantity: Number(values.initialLineQuantity),
          unit: values.initialLineUnit || undefined,
          erpOrderNo: values.initialLineErpOrderNo || undefined,
          erpOrderId: values.initialLineErpOrderId || undefined,
          description: values.initialLineDescription || undefined,
          branchCode: '0',
        });
      }

      return serviceCase;
    },
    onSuccess: (serviceCase) => {
      queryClient.invalidateQueries({ queryKey: ['service-allocation'] });
      toast.success(
        isEdit
          ? t('serviceAllocation.form.updateSuccess')
          : t('serviceAllocation.form.createSuccess'),
      );
      navigate(`/service-allocation/cases/${serviceCase.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.form.saveError'));
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await saveMutation.mutateAsync(values);
  });

  const existingLines = timelineQuery.data?.lines ?? [];

  return (
    <OpsFormPageShell
      eyebrow={<OpsServiceEyebrow module={t('serviceAllocation.breadcrumb.module')} />}
      title={isEdit ? t('serviceAllocation.form.editTitle') : t('serviceAllocation.form.createTitle')}
      description={isEdit ? t('serviceAllocation.form.editSubtitle') : t('serviceAllocation.form.createSubtitle')}
      actions={
        <OpsActionButton
          type="button"
          variant="secondary"
          onClick={() => navigate(isEdit ? `/service-allocation/cases/${parsedId}` : '/service-allocation/cases')}
        >
          {t('common.back')}
        </OpsActionButton>
      }
    >
      <Form {...form}>
        <form className="wms-ops-form space-y-6" onSubmit={onSubmit}>
          <fieldset disabled={isReadOnly} className={`space-y-6 ${isReadOnly ? 'pointer-events-none opacity-75' : ''}`}>
            <ServiceCaseHeaderSection
              form={form}
              customerLookupOpen={customerLookupOpen}
              onCustomerLookupOpenChange={setCustomerLookupOpen}
              incomingStockLookupOpen={incomingStockLookupOpen}
              onIncomingStockLookupOpenChange={setIncomingStockLookupOpen}
              intakeWarehouseLookupOpen={intakeWarehouseLookupOpen}
              onIntakeWarehouseLookupOpenChange={setIntakeWarehouseLookupOpen}
              currentWarehouseLookupOpen={currentWarehouseLookupOpen}
              onCurrentWarehouseLookupOpenChange={setCurrentWarehouseLookupOpen}
              selectedCustomerLabel={selectedCustomerLabel}
              setSelectedCustomerLabel={setSelectedCustomerLabel}
              selectedIncomingStockLabel={selectedIncomingStockLabel}
              setSelectedIncomingStockLabel={setSelectedIncomingStockLabel}
              selectedIntakeWarehouseLabel={selectedIntakeWarehouseLabel}
              setSelectedIntakeWarehouseLabel={setSelectedIntakeWarehouseLabel}
              selectedCurrentWarehouseLabel={selectedCurrentWarehouseLabel}
              setSelectedCurrentWarehouseLabel={setSelectedCurrentWarehouseLabel}
            />

            <ServiceCaseInitialLineSection
              form={form}
              initialLineStockLookupOpen={initialLineStockLookupOpen}
              onInitialLineStockLookupOpenChange={setInitialLineStockLookupOpen}
              selectedInitialLineStockLabel={selectedInitialLineStockLabel}
              setSelectedInitialLineStockLabel={setSelectedInitialLineStockLabel}
            />

            {isEdit && existingLines.length > 0 ? (
              <ServiceCaseExistingLinesSection lines={existingLines} />
            ) : null}

            <div className="wms-ops-actions flex justify-end">
              <OpsActionButton type="submit" variant="primary" disabled={isReadOnly || saveMutation.isPending || timelineQuery.isLoading}>
                {saveMutation.isPending ? t('common.loading') : t('common.save')}
              </OpsActionButton>
            </div>
          </fieldset>
        </form>
      </Form>
    </OpsFormPageShell>
  );
}
