import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lookupApi } from '@/services/lookup-api';
import type { StockLookup } from '@/services/lookup-types';
import {
  serviceCaseLineTypeOptions,
  serviceProcessTypeOptions,
} from '../../utils/service-allocation-display';
import type { ServiceCaseFormApi } from './shared';

interface ServiceCaseInitialLineSectionProps {
  form: ServiceCaseFormApi;
  initialLineStockLookupOpen: boolean;
  onInitialLineStockLookupOpenChange: (open: boolean) => void;
  selectedInitialLineStockLabel: string;
  setSelectedInitialLineStockLabel: (value: string) => void;
}

const getStockLabel = (item: StockLookup): string => `${item.stokKodu} - ${item.stokAdi}`;

export function ServiceCaseInitialLineSection({
  form,
  initialLineStockLookupOpen,
  onInitialLineStockLookupOpenChange,
  selectedInitialLineStockLabel,
  setSelectedInitialLineStockLabel,
}: ServiceCaseInitialLineSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
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
                {serviceCaseLineTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey, { defaultValue: option.value })}
                  </SelectItem>
                ))}
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
                {serviceProcessTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey, { defaultValue: option.value })}
                  </SelectItem>
                ))}
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
                onOpenChange={onInitialLineStockLookupOpenChange}
                title={t('serviceAllocation.stockCode')}
                description={t('serviceAllocation.form.initialLineStockLookupDescription')}
                value={selectedInitialLineStockLabel || field.value}
                placeholder={t('serviceAllocation.form.selectStock')}
                searchPlaceholder={t('common.search')}
                emptyText={t('serviceAllocation.form.noStocks')}
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
  );
}
