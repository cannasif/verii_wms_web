import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsFieldShell, OpsFormMessage, OpsInput, OpsTextarea } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { CustomerLookup, StockLookup, WarehouseLookup } from '@/features/shared/api/lookup-types';
import { cn } from '@/lib/utils';
import { serviceCaseStatusOptions } from '../../utils/service-allocation-display';
import {
  SERVICE_CASE_FORM_ITEM_CLASS,
  ServiceCaseFormPanel,
  translateServiceOptionLabel,
} from './service-allocation-ops-ui';
import type { ServiceCaseFormApi } from './shared';

interface ServiceCaseHeaderSectionProps {
  form: ServiceCaseFormApi;
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
  const { t } = useTranslation(['service-allocation', 'common']);

  return (
    <ServiceCaseFormPanel title={t('serviceAllocation.form.headerSection')}>
      <FormField
        control={form.control}
        name="caseNo"
        rules={{ required: true }}
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>
              {t('serviceAllocation.caseNo')}
              <span className="wms-ops-required"> *</span>
            </FormLabel>
            <FormControl>
              <OpsInput {...field} />
            </FormControl>
            <OpsFormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="customerCode"
        rules={{ required: true }}
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>
              {t('serviceAllocation.customerCode')}
              <span className="wms-ops-required"> *</span>
            </FormLabel>
            <FormControl>
              <OpsFieldShell className={customerLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<CustomerLookup>
                  variant="ops"
                  open={customerLookupOpen}
                  onOpenChange={onCustomerLookupOpenChange}
                  title={t('serviceAllocation.customerCode')}
                  description={t('serviceAllocation.form.customerLookupDescription')}
                  value={selectedCustomerLabel || field.value}
                  placeholder={t('serviceAllocation.form.selectCustomer')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('serviceAllocation.form.noCustomers')}
                  triggerClassName={OPS_FIELD_CLASS}
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
              </OpsFieldShell>
            </FormControl>
            <OpsFormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.status')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <OpsFieldShell>
                  <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                    <SelectValue />
                  </SelectTrigger>
                </OpsFieldShell>
              </FormControl>
              <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                {serviceCaseStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {translateServiceOptionLabel(t, option.labelKey, option.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="incomingStockCode"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.stockCode')}</FormLabel>
            <FormControl>
              <OpsFieldShell className={incomingStockLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<StockLookup>
                  variant="ops"
                  open={incomingStockLookupOpen}
                  onOpenChange={onIncomingStockLookupOpenChange}
                  title={t('serviceAllocation.stockCode')}
                  description={t('serviceAllocation.form.incomingStockLookupDescription')}
                  value={selectedIncomingStockLabel || field.value}
                  placeholder={t('serviceAllocation.form.selectStock')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('serviceAllocation.form.noStocks')}
                  triggerClassName={OPS_FIELD_CLASS}
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
              </OpsFieldShell>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="incomingSerialNo"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.serialNo')}</FormLabel>
            <FormControl>
              <OpsInput {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="receivedAt"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.receivedAt')}</FormLabel>
            <FormControl>
              <OpsInput type="date" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="intakeWarehouseId"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.intakeWarehouseId')}</FormLabel>
            <FormControl>
              <OpsFieldShell className={intakeWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<WarehouseLookup>
                  variant="ops"
                  open={intakeWarehouseLookupOpen}
                  onOpenChange={onIntakeWarehouseLookupOpenChange}
                  title={t('serviceAllocation.intakeWarehouseId')}
                  description={t('serviceAllocation.form.warehouseLookupDescription')}
                  value={selectedIntakeWarehouseLabel || (field.value ? `#${field.value}` : '')}
                  placeholder={t('serviceAllocation.form.selectWarehouse')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('serviceAllocation.form.noWarehouses')}
                  triggerClassName={OPS_FIELD_CLASS}
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
              </OpsFieldShell>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="currentWarehouseId"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.currentWarehouseId')}</FormLabel>
            <FormControl>
              <OpsFieldShell className={currentWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<WarehouseLookup>
                  variant="ops"
                  open={currentWarehouseLookupOpen}
                  onOpenChange={onCurrentWarehouseLookupOpenChange}
                  title={t('serviceAllocation.currentWarehouseId')}
                  description={t('serviceAllocation.form.warehouseLookupDescription')}
                  value={selectedCurrentWarehouseLabel || (field.value ? `#${field.value}` : '')}
                  placeholder={t('serviceAllocation.form.selectWarehouse')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('serviceAllocation.form.noWarehouses')}
                  triggerClassName={OPS_FIELD_CLASS}
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
              </OpsFieldShell>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="diagnosisNote"
        render={({ field }) => (
          <FormItem className={cn(SERVICE_CASE_FORM_ITEM_CLASS, 'md:col-span-2')}>
            <FormLabel>{t('serviceAllocation.diagnosisNote')}</FormLabel>
            <FormControl>
              <OpsTextarea {...field} rows={4} />
            </FormControl>
          </FormItem>
        )}
      />
    </ServiceCaseFormPanel>
  );
}
