import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup, StockLookup, WarehouseLookup } from '@/services/lookup-types';
import { serviceCaseStatusOptions } from '../../utils/service-allocation-display';
import type { ServiceCaseFormApi } from './shared';

interface ServiceCaseHeaderSectionProps {
  form: ServiceCaseFormApi;
  isEdit: boolean;
  customerLookupOpen: boolean;
  onCustomerLookupOpenChange: (open: boolean) => void;
  incomingStockLookupOpen: boolean;
  onIncomingStockLookupOpenChange: (open: boolean) => void;
  intakeWarehouseLookupOpen: boolean;
  onIntakeWarehouseLookupOpenChange: (open: boolean) => void;
  currentWarehouseLookupOpen: boolean;
  onCurrentWarehouseLookupOpenChange: (open: boolean) => void;
  selectedCustomerLabel: string;
  setSelectedCustomerLabel: (value: string) => void;
  selectedIncomingStockLabel: string;
  setSelectedIncomingStockLabel: (value: string) => void;
  selectedIntakeWarehouseLabel: string;
  setSelectedIntakeWarehouseLabel: (value: string) => void;
  selectedCurrentWarehouseLabel: string;
  setSelectedCurrentWarehouseLabel: (value: string) => void;
}

const getCustomerLabel = (item: CustomerLookup): string => `${item.cariKod} - ${item.cariIsim}`;
const getStockLabel = (item: StockLookup): string => `${item.stokKodu} - ${item.stokAdi}`;
const getWarehouseLabel = (item: WarehouseLookup): string => `${item.depoKodu} - ${item.depoIsmi}`;

export function ServiceCaseHeaderSection({
  form,
  isEdit,
  customerLookupOpen,
  onCustomerLookupOpenChange,
  incomingStockLookupOpen,
  onIncomingStockLookupOpenChange,
  intakeWarehouseLookupOpen,
  onIntakeWarehouseLookupOpenChange,
  currentWarehouseLookupOpen,
  onCurrentWarehouseLookupOpenChange,
  selectedCustomerLabel,
  setSelectedCustomerLabel,
  selectedIncomingStockLabel,
  setSelectedIncomingStockLabel,
  selectedIntakeWarehouseLabel,
  setSelectedIntakeWarehouseLabel,
  selectedCurrentWarehouseLabel,
  setSelectedCurrentWarehouseLabel,
}: ServiceCaseHeaderSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
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
                onOpenChange={onCustomerLookupOpenChange}
                title={t('serviceAllocation.customerCode')}
                description={t('serviceAllocation.form.customerLookupDescription')}
                value={selectedCustomerLabel || field.value}
                placeholder={t('serviceAllocation.form.selectCustomer')}
                searchPlaceholder={t('common.search')}
                emptyText={t('serviceAllocation.form.noCustomers')}
                queryKey={['service-allocation', 'customer-lookup']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
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
                {serviceCaseStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey, { defaultValue: option.value })}
                  </SelectItem>
                ))}
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
                onOpenChange={onIncomingStockLookupOpenChange}
                title={t('serviceAllocation.stockCode')}
                description={t('serviceAllocation.form.incomingStockLookupDescription')}
                value={selectedIncomingStockLabel || field.value}
                placeholder={t('serviceAllocation.form.selectStock')}
                searchPlaceholder={t('common.search')}
                emptyText={t('serviceAllocation.form.noStocks')}
                queryKey={['service-allocation', 'incoming-stock-lookup']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
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
                onOpenChange={onIntakeWarehouseLookupOpenChange}
                title={t('serviceAllocation.intakeWarehouseId')}
                description={t('serviceAllocation.form.warehouseLookupDescription')}
                value={selectedIntakeWarehouseLabel || (field.value ? `#${field.value}` : '')}
                placeholder={t('serviceAllocation.form.selectWarehouse')}
                searchPlaceholder={t('common.search')}
                emptyText={t('serviceAllocation.form.noWarehouses')}
                queryKey={['service-allocation', 'intake-warehouse-lookup']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
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
                onOpenChange={onCurrentWarehouseLookupOpenChange}
                title={t('serviceAllocation.currentWarehouseId')}
                description={t('serviceAllocation.form.warehouseLookupDescription')}
                value={selectedCurrentWarehouseLabel || (field.value ? `#${field.value}` : '')}
                placeholder={t('serviceAllocation.form.selectWarehouse')}
                searchPlaceholder={t('common.search')}
                emptyText={t('serviceAllocation.form.noWarehouses')}
                queryKey={['service-allocation', 'current-warehouse-lookup']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
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
  );
}
