import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { lookupApi } from '@/services/lookup-api';
import type { GoodsReceiptFormData, Customer, Project } from '../../types/goods-receipt';
import { useProjects } from '../../hooks/useProjects';
import { SearchableSelect } from './components/SearchableSelect';

export function Step1BasicInfo(): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext<GoodsReceiptFormData>();
  const { control, watch } = form;
  const { data: projects, isLoading: projectsLoading, isError: projectsError } = useProjects();
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');

  const selectedCustomerId = watch('customerId');
  const selectedCustomerText = selectedCustomerLabel || selectedCustomerId || '';

  return (
    <div className="space-y-6 crm-page">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="receiptDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goodsReceipt.step1.receiptDate')} *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="documentNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goodsReceipt.step1.documentNo')} *</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('goodsReceipt.step1.documentNoPlaceholder')}
                  inputMode="numeric"
                  maxLength={watch('isInvoice') ? 16 : 15}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goodsReceipt.step1.customer')} *</FormLabel>
              <FormControl>
                <PagedLookupDialog<Customer>
                  open={customerLookupOpen}
                  onOpenChange={setCustomerLookupOpen}
                  title={t('goodsReceipt.step1.selectCustomer')}
                  description={t('goodsReceipt.step1.customer')}
                  value={selectedCustomerText}
                  placeholder={t('goodsReceipt.step1.selectCustomer')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.notFound')}
                  queryKey={['goods-receipt', 'customers']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    lookupApi.getCustomersPaged(
                      { pageNumber, pageSize, search },
                      { signal },
                    )
                  }
                  getKey={(customer) => customer.id.toString()}
                  getLabel={(customer) => `${customer.cariIsim} (${customer.cariKod})`}
                  onSelect={(customer) => {
                    field.onChange(customer.cariKod);
                    form.setValue('customerRefId', customer.id);
                    setSelectedCustomerLabel(`${customer.cariIsim} (${customer.cariKod})`);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="projectCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goodsReceipt.step1.projectCode')}</FormLabel>
              <FormControl>
                <SearchableSelect<Project>
                  value={field.value || ''}
                  onValueChange={(value) => {
                    field.onChange(value || '');
                  }}
                  options={projects || []}
                  getOptionValue={(opt) => opt.projeKod}
                  getOptionLabel={(opt) => `${opt.projeAciklama} (${opt.projeKod})`}
                  placeholder={t('goodsReceipt.step1.selectProjectCode')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.notFound')}
                  isLoading={projectsLoading}
                  disabled={projectsError}
                  itemLimit={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="isInvoice"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{t('goodsReceipt.step1.isInvoice')}</FormLabel>
              <p className="text-sm text-muted-foreground">
                {t('goodsReceipt.step1.isInvoiceDescription')}
              </p>
            </div>
          </FormItem>
        )}
      />

      {selectedCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('goodsReceipt.step1.selectedCustomer')}</CardTitle>
            <CardDescription>
              {selectedCustomerText}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t('goodsReceipt.step1.notes')}</FormLabel>
            <FormControl>
              <Input placeholder={t('goodsReceipt.step1.notesPlaceholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
