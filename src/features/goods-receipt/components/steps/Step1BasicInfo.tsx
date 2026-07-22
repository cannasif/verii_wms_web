import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { OpsFieldShell, OpsFormMessage, OpsInput, OpsSelectedEntityCard, OpsTextarea } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { GoodsReceiptFormData, Customer, Project } from '../../types/goods-receipt';
import { useProjects } from '../../hooks/useProjects';
import { SearchableSelect } from './components/SearchableSelect';

interface Step1BasicInfoProps {
  variant?: 'default' | 'ops';
  hideDocumentFields?: boolean;
}

export function Step1BasicInfo({
  variant = 'default',
  hideDocumentFields = false,
}: Step1BasicInfoProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const form = useFormContext<GoodsReceiptFormData>();
  const { control, watch } = form;
  const { data: projects, isLoading: projectsLoading, isError: projectsError } = useProjects();
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const isOps = variant === 'ops';

  const selectedCustomerId = watch('customerId');
  const selectedCustomerText = selectedCustomerLabel || selectedCustomerId || '';

  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : ' *';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;

  return (
    <div className="space-y-6">
      {hideDocumentFields ? null : (
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="receiptDate"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('goodsReceipt.step1.receiptDate')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsInput type="date" {...field} />
                ) : (
                  <Input type="date" {...field} />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="documentNo"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('goodsReceipt.step1.documentNo')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsInput
                    title={t('goodsReceipt.step1.documentNoHint')}
                    placeholder={t('goodsReceipt.step1.documentNoPlaceholder')}
                    inputMode="numeric"
                    maxLength={16}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '');
                      field.onChange(value);
                      if (value) {
                        form.clearErrors('documentNo');
                      }
                    }}
                  />
                ) : (
                  <Input
                    title={t('goodsReceipt.step1.documentNoHint')}
                    placeholder={t('goodsReceipt.step1.documentNoPlaceholder')}
                    inputMode="numeric"
                    maxLength={16}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '');
                      field.onChange(value);
                      if (value) {
                        form.clearErrors('documentNo');
                      }
                    }}
                  />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
      </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="customerId"
          render={({ field, fieldState }) => (
            <FormItem className={formItemClass}>
              <FormLabel title={t('goodsReceipt.step1.clickToSelectCustomer')}>
                {t('goodsReceipt.step1.customer')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <TooltipProvider delayDuration={250}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* Tooltip sarmalayıcı FormControl'ün aria-invalid aktarımını kırdığı için hata durumu elle bağlanıyor */}
                        <OpsFieldShell
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            'cursor-pointer',
                            customerLookupOpen && 'wms-ops-field-shell--active',
                          )}
                        >
                          <PagedLookupDialog<Customer>
                            variant="ops"
                            autoSearchMinLength={3}
                            open={customerLookupOpen}
                            onOpenChange={setCustomerLookupOpen}
                            title={t('goodsReceipt.step1.selectCustomer')}
                            value={selectedCustomerText}
                            placeholder={t('goodsReceipt.step1.selectCustomer')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('common.notFound')}
                            triggerClassName={OPS_FIELD_CLASS}
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
                              form.clearErrors('customerId');
                              setSelectedCustomerLabel(`${customer.cariIsim} (${customer.cariKod})`);
                            }}
                          />
                        </OpsFieldShell>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('goodsReceipt.step1.clickToSelectCustomer')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
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
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="projectCode"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('goodsReceipt.step1.projectCode')}</FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell>
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
                      className={OPS_FIELD_CLASS}
                      popoverClassName="wms-ops-lookup-popover"
                    />
                  </OpsFieldShell>
                ) : (
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
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
      </div>

      {selectedCustomerId ? (
        isOps ? (
          <OpsSelectedEntityCard
            label={t('goodsReceipt.step1.selectedCustomer')}
            eyebrow={t('goodsReceipt.step1.selectedCustomerEyebrow')}
            status={t('goodsReceipt.step1.selectedCustomerStatus')}
            value={selectedCustomerText}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('goodsReceipt.step1.selectedCustomer')}</CardTitle>
              <CardDescription>{selectedCustomerText}</CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem className={cn(formItemClass, 'md:col-span-2')}>
            <FormLabel className={isOps ? 'wms-ops-notes-label' : undefined}>
              {t('goodsReceipt.step1.notes')}
            </FormLabel>
            {isOps ? (
              <p className="wms-ops-notes-hint text-sm text-muted-foreground">
                {t('goodsReceipt.step1.notesDescription')}
              </p>
            ) : null}
            <FormControl>
              {isOps ? (
                <OpsTextarea
                  rows={3}
                  placeholder={t('goodsReceipt.step1.notesPlaceholder')}
                  {...field}
                />
              ) : (
                <Input placeholder={t('goodsReceipt.step1.notesPlaceholder')} {...field} />
              )}
            </FormControl>
            {fieldMessage}
          </FormItem>
        )}
      />
    </div>
  );
}
