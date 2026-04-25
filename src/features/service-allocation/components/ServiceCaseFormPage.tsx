import { type ReactElement, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
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
  const { t } = useTranslation();
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
  }, [form, timelineQuery.data]);

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
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.customerId', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="incomingStockId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.stockId', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
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
                  <FormControl><Input {...field} type="number" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="currentWarehouseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.currentWarehouseId', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="initialLineStockId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.stockId', { defaultValue: 'Missing translation' })}</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
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
              <FormField control={form.control} name="initialLineErpOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serviceAllocation.erpOrderId', { defaultValue: 'Missing translation' })}</FormLabel>
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
