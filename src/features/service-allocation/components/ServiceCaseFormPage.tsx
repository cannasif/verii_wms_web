import { type ReactElement, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup, StockLookup, WarehouseLookup } from '@/services/lookup-types';
import { serviceAllocationApi } from '../api/service-allocation.api';
import { useServiceCaseTimelineQuery } from '../hooks/useServiceCaseTimelineQuery';
import {
  renderServiceCaseLineType,
  renderServiceProcessType,
  serviceCaseLineTypeOptions,
  serviceCaseStatusOptions,
  serviceProcessTypeOptions,
} from '../utils/service-allocation-display';

type ServiceCaseFormValues = {
  caseNo: string;
  customerCode: string;
  customerId?: string;
  incomingStockCode: string;
  incomingStockId?: string;
  incomingSerialNo: string;
  intakeWarehouseId?: string;
  currentWarehouseId?: string;
  diagnosisNote: string;
  status: string;
  receivedAt: string;
  closedAt: string;
  initialLineType: string;
  initialProcessType: string;
  initialLineStockCode: string;
  initialLineStockId?: string;
  initialLineQuantity?: string;
  initialLineUnit: string;
  initialLineErpOrderNo: string;
  initialLineErpOrderId: string;
  initialLineDescription: string;
};

function toDateInput(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}

export function ServiceCaseFormPage(): ReactElement {
  const { t } = useTranslation('common');
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
      customerCode: '',
      customerId: '',
      incomingStockCode: '',
      incomingStockId: '',
      incomingSerialNo: '',
      intakeWarehouseId: '',
      currentWarehouseId: '',
      diagnosisNote: '',
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
        ? t('serviceAllocation.form.editTitle', { defaultValue: 'Missing translation' })
        : t('serviceAllocation.form.createTitle', { defaultValue: 'Missing translation' }),
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
      customerCode: serviceCase.customerCode ?? '',
      customerId: serviceCase.customerId ? String(serviceCase.customerId) : '',
      incomingStockCode: serviceCase.incomingStockCode ?? '',
      incomingStockId: serviceCase.incomingStockId ? String(serviceCase.incomingStockId) : '',
      incomingSerialNo: serviceCase.incomingSerialNo ?? '',
      intakeWarehouseId: serviceCase.intakeWarehouseId ? String(serviceCase.intakeWarehouseId) : '',
      currentWarehouseId: serviceCase.currentWarehouseId ? String(serviceCase.currentWarehouseId) : '',
      diagnosisNote: serviceCase.diagnosisNote ?? '',
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
        customerCode: values.customerCode,
        customerId: values.customerId ? Number(values.customerId) : undefined,
        incomingStockCode: values.incomingStockCode || undefined,
        incomingStockId: values.incomingStockId ? Number(values.incomingStockId) : undefined,
        incomingSerialNo: values.incomingSerialNo || undefined,
        intakeWarehouseId: values.intakeWarehouseId ? Number(values.intakeWarehouseId) : undefined,
        currentWarehouseId: values.currentWarehouseId ? Number(values.currentWarehouseId) : undefined,
        diagnosisNote: values.diagnosisNote || undefined,
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
          ? t('serviceAllocation.form.updateSuccess', { defaultValue: 'Missing translation' })
          : t('serviceAllocation.form.createSuccess', { defaultValue: 'Missing translation' }),
      );
      navigate(`/service-allocation/cases/${serviceCase.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('serviceAllocation.form.saveError', { defaultValue: 'Missing translation' }));
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await saveMutation.mutateAsync(values);
  });

  const existingLines = timelineQuery.data?.lines ?? [];

  const getCustomerLabel = (item: CustomerLookup): string => `${item.cariKod} - ${item.cariIsim}`;
  const getStockLabel = (item: StockLookup): string => `${item.stokKodu} - ${item.stokAdi}`;
  const getWarehouseLabel = (item: WarehouseLookup): string => `${item.depoKodu} - ${item.depoIsmi}`;

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(isEdit ? `/service-allocation/cases/${parsedId}` : '/service-allocation/cases')}>
          {t('common.back', { defaultValue: 'Missing translation' })}
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={onSubmit}>
          <fieldset disabled={isReadOnly} className={isReadOnly ? 'pointer-events-none opacity-75' : undefined}>
          <Card>
            <CardHeader>
              <CardTitle>
                {isEdit
                  ? t('serviceAllocation.form.editTitle', { defaultValue: 'Missing translation' })
                  : t('serviceAllocation.form.createTitle', { defaultValue: 'Missing translation' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="caseNo" rules={{ required: true }} render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.caseNo', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customerCode" rules={{ required: true }} render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.customerCode', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl>
                    <PagedLookupDialog<CustomerLookup>
                      open={customerLookupOpen}
                      onOpenChange={setCustomerLookupOpen}
                      title={t('serviceAllocation.customerCode')}
                      description={t('serviceAllocation.form.customerLookupDescription')}
                      value={selectedCustomerLabel || field.value}
                      placeholder={t('serviceAllocation.form.selectCustomer')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('serviceAllocation.form.noCustomers')}
                      queryKey={['service-allocation', 'customer-lookup']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={getCustomerLabel}
                      onSelect={(item) => {
                        field.onChange(item.cariKod);
                        form.setValue('customerId', String(item.id));
                        setSelectedCustomerLabel(getCustomerLabel(item));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.status', { defaultValue: 'Missing translation' })}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceCaseStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="incomingStockCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl>
                    <PagedLookupDialog<StockLookup>
                      open={incomingStockLookupOpen}
                      onOpenChange={setIncomingStockLookupOpen}
                      title={t('serviceAllocation.stockCode')}
                      description={t('serviceAllocation.form.incomingStockLookupDescription')}
                      value={selectedIncomingStockLabel || field.value}
                      placeholder={t('serviceAllocation.form.selectStock')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('serviceAllocation.form.noStocks')}
                      queryKey={['service-allocation', 'incoming-stock-lookup']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={getStockLabel}
                      onSelect={(item) => {
                        field.onChange(item.stokKodu);
                        form.setValue('incomingStockId', String(item.id));
                        setSelectedIncomingStockLabel(getStockLabel(item));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="incomingSerialNo" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.serialNo', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="receivedAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.receivedAt', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} type="date" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="intakeWarehouseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.intakeWarehouseId', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl>
                    <PagedLookupDialog<WarehouseLookup>
                      open={intakeWarehouseLookupOpen}
                      onOpenChange={setIntakeWarehouseLookupOpen}
                      title={t('serviceAllocation.intakeWarehouseId')}
                      description={t('serviceAllocation.form.warehouseLookupDescription')}
                      value={selectedIntakeWarehouseLabel || (field.value ? `#${field.value}` : '')}
                      placeholder={t('serviceAllocation.form.selectWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('serviceAllocation.form.noWarehouses')}
                      queryKey={['service-allocation', 'intake-warehouse-lookup']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={getWarehouseLabel}
                      onSelect={(item) => {
                        field.onChange(String(item.id));
                        setSelectedIntakeWarehouseLabel(getWarehouseLabel(item));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="currentWarehouseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.currentWarehouseId', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl>
                    <PagedLookupDialog<WarehouseLookup>
                      open={currentWarehouseLookupOpen}
                      onOpenChange={setCurrentWarehouseLookupOpen}
                      title={t('serviceAllocation.currentWarehouseId')}
                      description={t('serviceAllocation.form.warehouseLookupDescription')}
                      value={selectedCurrentWarehouseLabel || (field.value ? `#${field.value}` : '')}
                      placeholder={t('serviceAllocation.form.selectWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('serviceAllocation.form.noWarehouses')}
                      queryKey={['service-allocation', 'current-warehouse-lookup']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={getWarehouseLabel}
                      onSelect={(item) => {
                        field.onChange(String(item.id));
                        setSelectedCurrentWarehouseLabel(getWarehouseLabel(item));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <div className="md:col-span-2">
                <FormField control={form.control} name="diagnosisNote" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('serviceAllocation.diagnosisNote', { defaultValue: 'Missing translation' })}</FormLabel>
                    <FormControl><Textarea {...field} rows={4} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('serviceAllocation.form.initialLine', { defaultValue: 'Missing translation' })}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="initialLineType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.lineType', { defaultValue: 'Missing translation' })}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceCaseLineTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="initialProcessType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.processType', { defaultValue: 'Missing translation' })}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceProcessTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="initialLineStockCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl>
                    <PagedLookupDialog<StockLookup>
                      open={initialLineStockLookupOpen}
                      onOpenChange={setInitialLineStockLookupOpen}
                      title={t('serviceAllocation.stockCode')}
                      description={t('serviceAllocation.form.initialLineStockLookupDescription')}
                      value={selectedInitialLineStockLabel || field.value}
                      placeholder={t('serviceAllocation.form.selectStock')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('serviceAllocation.form.noStocks')}
                      queryKey={['service-allocation', 'initial-line-stock-lookup']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={getStockLabel}
                      onSelect={(item) => {
                        field.onChange(item.stokKodu);
                        form.setValue('initialLineStockId', String(item.id));
                        form.setValue('initialLineUnit', item.olcuBr1 || '');
                        setSelectedInitialLineStockLabel(getStockLabel(item));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="initialLineQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.quantity', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} type="number" step="0.01" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="initialLineUnit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.unit', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="initialLineErpOrderNo" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.erpOrderNo', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="md:col-span-2">
                <FormField control={form.control} name="initialLineDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('serviceAllocation.description', { defaultValue: 'Missing translation' })}</FormLabel>
                    <FormControl><Textarea {...field} rows={3} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {isEdit && existingLines.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('serviceAllocation.lines', { defaultValue: 'Missing translation' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('serviceAllocation.lineType', { defaultValue: 'Missing translation' })}</TableHead>
                      <TableHead>{t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' })}</TableHead>
                      <TableHead>{t('serviceAllocation.quantity', { defaultValue: 'Missing translation' })}</TableHead>
                      <TableHead>{t('serviceAllocation.processType', { defaultValue: 'Missing translation' })}</TableHead>
                      <TableHead>{t('serviceAllocation.erpOrderNo', { defaultValue: 'Missing translation' })}</TableHead>
                      <TableHead>{t('serviceAllocation.erpOrderId', { defaultValue: 'Missing translation' })}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{renderServiceCaseLineType(line.lineType)}</TableCell>
                        <TableCell>{line.stockCode || '-'}</TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>{renderServiceProcessType(line.processType)}</TableCell>
                        <TableCell>{line.erpOrderNo || '-'}</TableCell>
                        <TableCell>{line.erpOrderId || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isReadOnly || saveMutation.isPending || timelineQuery.isLoading}>
              {saveMutation.isPending
                ? t('common.loading', { defaultValue: 'Missing translation' })
                : t('common.save', { defaultValue: 'Missing translation' })}
            </Button>
          </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
