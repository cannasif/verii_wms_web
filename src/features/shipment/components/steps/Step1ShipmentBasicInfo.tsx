import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  HeaderQuantityPolicyFields,
  OpsFieldShell,
  OpsFormMessage,
  OpsInput,
  OpsSelectedEntityCard,
  OpsTextarea,
} from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/features/goods-receipt/hooks/useProjects';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { SearchableSelect } from '@/features/shared';
import { OperationDocumentSeriesSelector } from '@/features/document-series-management/components/OperationDocumentSeriesSelector';
import { SearchableMultiSelect, getOperationUserDisplayName, getOperationUserSubtitle } from '@/features/shared';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { Customer, Project, Warehouse } from '@/features/shared';
import type { UserDto } from '@/features/auth/types/auth';
import type { ShipmentFormData } from '../../types/shipment';

interface Step1ShipmentBasicInfoProps {
  hideDocumentSeries?: boolean;
  showOperationUsers?: boolean;
  variant?: 'default' | 'ops';
}

export function Step1ShipmentBasicInfo({
  hideDocumentSeries = false,
  showOperationUsers = true,
  variant = 'default',
}: Step1ShipmentBasicInfoProps): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const form = useFormContext<ShipmentFormData>();
  const { control, watch } = form;
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState('');

  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();
  const isOps = variant === 'ops';

  const selectedCustomerId = watch('customerId');
  const selectedSourceWarehouse = watch('sourceWarehouse');
  const selectedCustomerText = selectedCustomerLabel || selectedCustomerId || '';
  const selectedSourceWarehouseText = selectedWarehouseLabel || selectedSourceWarehouse || '';

  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : ' *';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;

  return (
    <div className={cn('space-y-6', isOps && 'wms-ops-form')}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField
          control={control}
          name="transferDate"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('shipment.step1.transferDate')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? <OpsInput type="date" {...field} /> : <Input type="date" {...field} />}
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
                {t('shipment.step1.documentNo')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsInput placeholder={t('shipment.step1.documentNoPlaceholder')} {...field} />
                ) : (
                  <Input placeholder={t('shipment.step1.documentNoPlaceholder')} {...field} />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        {!hideDocumentSeries ? (
          <div className={formItemClass}>
            <OperationDocumentSeriesSelector
              operationType="SH"
              warehouseId={watch('sourceWarehouseId')}
              customerId={watch('customerRefId')}
              variant={isOps ? 'ops' : 'default'}
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('shipment.step1.customer')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell className={customerLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                    <PagedLookupDialog<Customer>
                      variant="ops"
                      autoSearchMinLength={3}
                      open={customerLookupOpen}
                      onOpenChange={setCustomerLookupOpen}
                      title={t('shipment.step1.selectCustomer')}
                      value={selectedCustomerText}
                      placeholder={t('shipment.step1.selectCustomer')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['shipment', 'customers']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
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
                ) : (
                  <PagedLookupDialog<Customer>
                    open={customerLookupOpen}
                    onOpenChange={setCustomerLookupOpen}
                    title={t('shipment.step1.selectCustomer')}
                    description={t('shipment.step1.customer')}
                    value={selectedCustomerText}
                    placeholder={t('shipment.step1.selectCustomer')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['shipment', 'customers']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
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
              <FormLabel>{t('shipment.step1.projectCode')}</FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell>
                    <SearchableSelect<Project>
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value || '')}
                      options={projects || []}
                      getOptionValue={(opt) => opt.projeKod}
                      getOptionLabel={(opt) => `${opt.projeAciklama} (${opt.projeKod})`}
                      placeholder={t('shipment.step1.selectProjectCode')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('shipment.step1.noProject')}
                      isLoading={isLoadingProjects}
                      itemLimit={100}
                      className={OPS_FIELD_CLASS}
                      popoverClassName="wms-ops-lookup-popover"
                    />
                  </OpsFieldShell>
                ) : (
                  <SearchableSelect<Project>
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || '')}
                    options={projects || []}
                    getOptionValue={(opt) => opt.projeKod}
                    getOptionLabel={(opt) => `${opt.projeAciklama} (${opt.projeKod})`}
                    placeholder={t('shipment.step1.selectProjectCode')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('shipment.step1.noProject')}
                    isLoading={isLoadingProjects}
                    itemLimit={100}
                  />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="sourceWarehouse"
        render={({ field }) => (
          <FormItem className={formItemClass}>
            <FormLabel>
              {t('shipment.step1.sourceWarehouse')}
              {requiredMark}
            </FormLabel>
            <FormControl>
              {isOps ? (
                <OpsFieldShell className={warehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                  <PagedLookupDialog<Warehouse>
                    variant="ops"
                    open={warehouseLookupOpen}
                    onOpenChange={setWarehouseLookupOpen}
                    title={t('shipment.step1.selectSourceWarehouse')}
                    value={selectedSourceWarehouseText}
                    placeholder={t('shipment.step1.selectSourceWarehouse')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    triggerClassName={OPS_FIELD_CLASS}
                    queryKey={['shipment', 'source-warehouse']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(warehouse) => warehouse.id.toString()}
                    getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                    onSelect={(warehouse) => {
                      field.onChange(String(warehouse.depoKodu));
                      form.setValue('sourceWarehouseId', warehouse.id);
                      form.clearErrors('sourceWarehouse');
                      setSelectedWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                    }}
                  />
                </OpsFieldShell>
              ) : (
                <PagedLookupDialog<Warehouse>
                  open={warehouseLookupOpen}
                  onOpenChange={setWarehouseLookupOpen}
                  title={t('shipment.step1.selectSourceWarehouse')}
                  description={t('shipment.step1.sourceWarehouse')}
                  value={selectedSourceWarehouseText}
                  placeholder={t('shipment.step1.selectSourceWarehouse')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.notFound')}
                  queryKey={['shipment', 'source-warehouse']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                  }
                  getKey={(warehouse) => warehouse.id.toString()}
                  getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                  onSelect={(warehouse) => {
                    field.onChange(String(warehouse.depoKodu));
                    form.setValue('sourceWarehouseId', warehouse.id);
                    setSelectedWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                  }}
                />
              )}
            </FormControl>
            {fieldMessage}
          </FormItem>
        )}
      />

      {selectedCustomerId ? (
        isOps ? (
          <OpsSelectedEntityCard
            label={t('shipment.step1.customer')}
            eyebrow={t('shipment.step1.customer')}
            status={t('shipment.step1.selectCustomer')}
            value={selectedCustomerText}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('shipment.step1.customer')}</CardTitle>
              <CardDescription>{selectedCustomerText}</CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      {selectedSourceWarehouse ? (
        isOps ? (
          <OpsSelectedEntityCard
            label={t('shipment.step1.sourceWarehouse')}
            eyebrow={t('shipment.step1.sourceWarehouse')}
            status={t('shipment.step1.selectSourceWarehouse')}
            value={selectedSourceWarehouseText}
          />
        ) : null
      ) : null}

      {showOperationUsers ? (
        <FormField
          control={control}
          name="userIds"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('shipment.step1.operationUsers')}</FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell>
                    <SearchableMultiSelect<UserDto>
                      value={field.value || []}
                      onValueChange={(values) => field.onChange(values)}
                      options={activeUsers || []}
                      getOptionValue={(opt) => String(opt.id)}
                      getOptionLabel={getOperationUserDisplayName}
                      getOptionSubtitle={getOperationUserSubtitle}
                      variant="ops"
                      optionLayout="user"
                      placeholder={t('shipment.step1.selectOperationUsers')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      isLoading={isLoadingUsers}
                      itemLimit={100}
                      className={OPS_FIELD_CLASS}
                      popoverClassName="wms-ops-lookup-popover"
                    />
                  </OpsFieldShell>
                ) : (
                  <SearchableMultiSelect<UserDto>
                    value={field.value || []}
                    onValueChange={(values) => field.onChange(values)}
                    options={activeUsers || []}
                    getOptionValue={(opt) => String(opt.id)}
                    getOptionLabel={getOperationUserDisplayName}
                    getOptionSubtitle={getOperationUserSubtitle}
                    optionLayout="user"
                    placeholder={t('shipment.step1.selectOperationUsers')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    isLoading={isLoadingUsers}
                    itemLimit={100}
                  />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
      ) : null}

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem className={cn(formItemClass, 'md:col-span-2')}>
            <FormLabel className={isOps ? 'wms-ops-notes-label' : undefined}>
              {t('shipment.step1.notes')}
            </FormLabel>
            <FormControl>
              {isOps ? (
                <OpsTextarea rows={3} placeholder={t('shipment.step1.notesPlaceholder')} {...field} />
              ) : (
                <Textarea placeholder={t('shipment.step1.notesPlaceholder')} {...field} />
              )}
            </FormControl>
            {fieldMessage}
          </FormItem>
        )}
      />

      <HeaderQuantityPolicyFields
        permissionCode="wms.shipment.quantity-policy"
        variant={isOps ? 'ops' : 'default'}
      />
    </div>
  );
}
