import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  HeaderQuantityPolicyFields,
  OpsFieldShell,
  OpsFormMessage,
  OpsInput,
  OpsTextarea,
} from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/features/goods-receipt/hooks/useProjects';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { SearchableSelect, SearchableMultiSelect, getOperationUserDisplayName, getOperationUserSubtitle } from '@/features/shared';
import { OperationDocumentSeriesSelector } from '@/features/document-series-management/components/OperationDocumentSeriesSelector';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { Customer, Project, Warehouse } from '@/features/shared';
import type { UserDto } from '@/features/auth/types/auth';
import type { SubcontractingFormData } from '../../types/subcontracting';
import { cn } from '@/lib/utils';

interface Step1SubcontractingBasicInfoProps {
  showOperationUsers?: boolean;
  permissionCode?: string;
  documentSeriesOperationType?: 'SIT' | 'SRT';
  hideDocumentSeries?: boolean;
  variant?: 'default' | 'ops';
}

export function Step1SubcontractingBasicInfo({
  showOperationUsers = true,
  permissionCode = 'wms.subcontracting.receipt.quantity-policy',
  documentSeriesOperationType = 'SRT',
  hideDocumentSeries = false,
  variant = 'default',
}: Step1SubcontractingBasicInfoProps): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const form = useFormContext<SubcontractingFormData>();
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [sourceWarehouseLookupOpen, setSourceWarehouseLookupOpen] = useState(false);
  const [targetWarehouseLookupOpen, setTargetWarehouseLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedSourceWarehouseLabel, setSelectedSourceWarehouseLabel] = useState('');
  const [selectedTargetWarehouseLabel, setSelectedTargetWarehouseLabel] = useState('');

  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();
  const isOps = variant === 'ops';
  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : ' *';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;

  return (
    <div className={cn('space-y-6', isOps && 'wms-ops-form')}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField
          control={form.control}
          name="transferDate"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('subcontracting.step1.transferDate')}{requiredMark}</FormLabel>
              <FormControl>
                {isOps ? <OpsInput type="date" {...field} /> : <Input type="date" {...field} />}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documentNo"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('subcontracting.step1.documentNo')}{requiredMark}</FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsInput placeholder={t('subcontracting.step1.documentNoPlaceholder')} {...field} />
                ) : (
                  <Input placeholder={t('subcontracting.step1.documentNoPlaceholder')} {...field} />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        {!hideDocumentSeries ? (
          <div className={formItemClass}>
            <OperationDocumentSeriesSelector
              operationType={documentSeriesOperationType}
              warehouseId={form.watch('targetWarehouseId')}
              customerId={form.watch('customerRefId')}
              variant={isOps ? 'ops' : 'default'}
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('subcontracting.step1.customer')}
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
                      title={t('subcontracting.step1.selectCustomer')}
                      value={selectedCustomerLabel || field.value}
                      placeholder={t('subcontracting.step1.selectCustomer')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['subcontracting', 'customers']}
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
                    title={t('subcontracting.step1.selectCustomer')}
                    description={t('subcontracting.step1.customer')}
                    value={selectedCustomerLabel || field.value}
                    placeholder={t('subcontracting.step1.selectCustomer')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['subcontracting', 'customers']}
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
          control={form.control}
          name="projectCode"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('subcontracting.step1.projectCode')}</FormLabel>
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
                      placeholder={t('subcontracting.step1.selectProjectCode')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('subcontracting.step1.noProject')}
                      isLoading={isLoadingProjects}
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
                    placeholder={t('subcontracting.step1.selectProjectCode')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('subcontracting.step1.noProject')}
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="sourceWarehouse"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('subcontracting.step1.sourceWarehouse')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell className={sourceWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                    <PagedLookupDialog<Warehouse>
                      variant="ops"
                      open={sourceWarehouseLookupOpen}
                      onOpenChange={setSourceWarehouseLookupOpen}
                      title={t('subcontracting.step1.selectSourceWarehouse')}
                      value={selectedSourceWarehouseLabel || field.value}
                      placeholder={t('subcontracting.step1.selectSourceWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['subcontracting', 'source-warehouses']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                      }
                      getKey={(warehouse) => warehouse.id.toString()}
                      getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                      onSelect={(warehouse) => {
                        field.onChange(String(warehouse.depoKodu));
                        form.setValue('sourceWarehouseId', warehouse.id);
                        form.clearErrors('sourceWarehouse');
                        setSelectedSourceWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                      }}
                    />
                  </OpsFieldShell>
                ) : (
                  <PagedLookupDialog<Warehouse>
                    open={sourceWarehouseLookupOpen}
                    onOpenChange={setSourceWarehouseLookupOpen}
                    title={t('subcontracting.step1.selectSourceWarehouse')}
                    description={t('subcontracting.step1.sourceWarehouse')}
                    value={selectedSourceWarehouseLabel || field.value}
                    placeholder={t('subcontracting.step1.selectSourceWarehouse')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['subcontracting', 'source-warehouses']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(warehouse) => warehouse.id.toString()}
                    getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                    onSelect={(warehouse) => {
                      field.onChange(String(warehouse.depoKodu));
                      form.setValue('sourceWarehouseId', warehouse.id);
                      setSelectedSourceWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                    }}
                  />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetWarehouse"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('subcontracting.step1.targetWarehouse')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell className={targetWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                    <PagedLookupDialog<Warehouse>
                      variant="ops"
                      open={targetWarehouseLookupOpen}
                      onOpenChange={setTargetWarehouseLookupOpen}
                      title={t('subcontracting.step1.selectTargetWarehouse')}
                      value={selectedTargetWarehouseLabel || field.value}
                      placeholder={t('subcontracting.step1.selectTargetWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['subcontracting', 'target-warehouses']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                      }
                      getKey={(warehouse) => warehouse.id.toString()}
                      getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                      onSelect={(warehouse) => {
                        field.onChange(String(warehouse.depoKodu));
                        form.setValue('targetWarehouseId', warehouse.id);
                        form.clearErrors('targetWarehouse');
                        setSelectedTargetWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                      }}
                    />
                  </OpsFieldShell>
                ) : (
                  <PagedLookupDialog<Warehouse>
                    open={targetWarehouseLookupOpen}
                    onOpenChange={setTargetWarehouseLookupOpen}
                    title={t('subcontracting.step1.selectTargetWarehouse')}
                    description={t('subcontracting.step1.targetWarehouse')}
                    value={selectedTargetWarehouseLabel || field.value}
                    placeholder={t('subcontracting.step1.selectTargetWarehouse')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['subcontracting', 'target-warehouses']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(warehouse) => warehouse.id.toString()}
                    getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                    onSelect={(warehouse) => {
                      field.onChange(String(warehouse.depoKodu));
                      form.setValue('targetWarehouseId', warehouse.id);
                      setSelectedTargetWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                    }}
                  />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
      </div>

      {showOperationUsers ? (
        <FormField
          control={form.control}
          name="userIds"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('subcontracting.step1.operationUsers')}</FormLabel>
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
                      placeholder={t('subcontracting.step1.selectOperationUsers')}
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
                    placeholder={t('subcontracting.step1.selectOperationUsers')}
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
        control={form.control}
        name="notes"
        render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('subcontracting.step1.notes')}</FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsTextarea placeholder={t('subcontracting.step1.notesPlaceholder')} {...field} />
                ) : (
                  <Textarea placeholder={t('subcontracting.step1.notesPlaceholder')} {...field} />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
        )}
      />

      <HeaderQuantityPolicyFields permissionCode={permissionCode} variant={isOps ? 'ops' : 'default'} />
    </div>
  );
}
