import { type ReactElement, type WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsFieldShell, OpsInput, OpsTextarea } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { StockLookup } from '@/features/shared/api/lookup-types';
import { cn } from '@/lib/utils';
import {
  serviceCaseLineTypeOptions,
  serviceProcessTypeOptions,
} from '../../utils/service-allocation-display';
import {
  SERVICE_CASE_FORM_ITEM_CLASS,
  ServiceCaseFormPanel,
  translateServiceOptionLabel,
} from './service-allocation-ops-ui';
import type { ServiceCaseFormApi } from './shared';

interface ServiceCaseInitialLineSectionProps {
  form: ServiceCaseFormApi;
  initialLineStockLookupOpen: boolean;
  onInitialLineStockLookupOpenChange: (open: boolean) => void;
  selectedInitialLineStockLabel: string;
  setSelectedInitialLineStockLabel: (value: string) => void;
}

const getStockLabel = (item: StockLookup): string => `${item.stokKodu} - ${item.stokAdi}`;

const preventNumberInputWheel = (event: WheelEvent<HTMLInputElement>): void => {
  event.currentTarget.blur();
};

export function ServiceCaseInitialLineSection({
  form,
  initialLineStockLookupOpen,
  onInitialLineStockLookupOpenChange,
  selectedInitialLineStockLabel,
  setSelectedInitialLineStockLabel,
}: ServiceCaseInitialLineSectionProps): ReactElement {
  const { t } = useTranslation(['service-allocation', 'common']);

  return (
    <ServiceCaseFormPanel title={t('serviceAllocation.form.initialLine')}>
      <FormField
        control={form.control}
        name="initialLineType"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.lineType')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <OpsFieldShell>
                  <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                    <SelectValue />
                  </SelectTrigger>
                </OpsFieldShell>
              </FormControl>
              <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                {serviceCaseLineTypeOptions.map((option) => (
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
        name="initialProcessType"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.processType')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <OpsFieldShell>
                  <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                    <SelectValue />
                  </SelectTrigger>
                </OpsFieldShell>
              </FormControl>
              <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                {serviceProcessTypeOptions.map((option) => (
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
        name="initialLineStockCode"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.stockCode')}</FormLabel>
            <FormControl>
              <OpsFieldShell className={initialLineStockLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<StockLookup>
                  variant="ops"
                  open={initialLineStockLookupOpen}
                  onOpenChange={onInitialLineStockLookupOpenChange}
                  title={t('serviceAllocation.stockCode')}
                  description={t('serviceAllocation.form.initialLineStockLookupDescription')}
                  value={selectedInitialLineStockLabel || field.value}
                  placeholder={t('serviceAllocation.form.selectStock')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('serviceAllocation.form.noStocks')}
                  triggerClassName={OPS_FIELD_CLASS}
                  queryKey={['service-allocation', 'initial-line-stock-lookup']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                  getKey={(item) => item.id.toString()}
                  getLabel={getStockLabel}
                  onSelect={(item) => {
                    field.onChange(item.stokKodu);
                    form.setValue('initialLineStockId', String(item.id));
                    form.setValue('initialLineUnit', item.olcuBr1 || '');
                    setSelectedInitialLineStockLabel(getStockLabel(item));
                  }}
                />
              </OpsFieldShell>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="initialLineQuantity"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.quantity')}</FormLabel>
            <FormControl>
              <OpsInput
                {...field}
                type="number"
                step="0.01"
                inputMode="decimal"
                onWheel={preventNumberInputWheel}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="initialLineUnit"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.unit')}</FormLabel>
            <FormControl>
              <OpsInput {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="initialLineErpOrderNo"
        render={({ field }) => (
          <FormItem className={SERVICE_CASE_FORM_ITEM_CLASS}>
            <FormLabel>{t('serviceAllocation.erpOrderNo')}</FormLabel>
            <FormControl>
              <OpsInput {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="initialLineDescription"
        render={({ field }) => (
          <FormItem className={cn(SERVICE_CASE_FORM_ITEM_CLASS, 'md:col-span-2')}>
            <FormLabel>{t('serviceAllocation.description')}</FormLabel>
            <FormControl>
              <OpsTextarea {...field} rows={3} />
            </FormControl>
          </FormItem>
        )}
      />
    </ServiceCaseFormPanel>
  );
}
