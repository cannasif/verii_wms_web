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
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useProjects } from '@/features/goods-receipt/hooks/useProjects';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { SearchableSelect } from '@/features/shared';
import { OperationDocumentSeriesSelector } from '@/features/document-series-management/components/OperationDocumentSeriesSelector';
import { SearchableMultiSelect, getOperationUserDisplayName, getOperationUserSubtitle } from '@/features/shared';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { Customer, Project, Warehouse } from '@/features/shared';
import type { UserDto } from '@/features/auth/types/auth';
import type { WarehouseFormData } from '../../types/warehouse';
import { warehouseInboundTypeOptions, warehouseOutboundTypeOptions } from '../../types/warehouse';

type WarehouseType = 'inbound' | 'outbound';

interface Step1WarehouseBasicInfoProps {
  type: WarehouseType;
  showOperationUsers?: boolean;
  hideDocumentSeries?: boolean;
  variant?: 'default' | 'ops';
}

export function Step1WarehouseBasicInfo({
  type,
  showOperationUsers = true,
  hideDocumentSeries = false,
  variant = 'default',
}: Step1WarehouseBasicInfoProps): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
  const form = useFormContext<WarehouseFormData>();
  const { control, watch } = form;
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState('');
  const isOps = variant === 'ops';

  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();

  const typeOptions = type === 'inbound' ? warehouseInboundTypeOptions : warehouseOutboundTypeOptions;

  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : ' *';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;
  const selectedCustomerText = selectedCustomerLabel || watch('customerId') || '';
  const selectedWarehouseText = selectedWarehouseLabel || (type === 'inbound' ? watch('targetWarehouse') : watch('sourceWarehouse')) || '';

  return (
    <div className={cn('space-y-6', !isOps && 'crm-page')}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="operationType"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('warehouse.step1.operationType')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value || undefined}
                    >
                      <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                        <SelectValue placeholder={t('warehouse.step1.selectOperationType')} />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </OpsFieldShell>
                ) : (
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value || undefined}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('warehouse.step1.selectOperationType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        {type === 'inbound' ? (
          <FormField
            control={control}
            name="targetWarehouse"
            render={({ field }) => (
              <FormItem className={formItemClass}>
                <FormLabel>
                  {t('warehouse.step1.entryWarehouse')}
                  {requiredMark}
                </FormLabel>
                <FormControl>
                  {isOps ? (
                    <OpsFieldShell className={warehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                      <PagedLookupDialog<Warehouse>
                        variant="ops"
                        open={warehouseLookupOpen}
                        onOpenChange={setWarehouseLookupOpen}
                        title={t('warehouse.step1.selectEntryWarehouse')}
                        value={selectedWarehouseText}
                        placeholder={t('warehouse.step1.selectEntryWarehouse')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.notFound')}
                        triggerClassName={OPS_FIELD_CLASS}
                        queryKey={['warehouse', type, 'target-warehouse']}
                        fetchPage={({ pageNumber, pageSize, search, signal }) =>
                          lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                        }
                        getKey={(warehouse) => warehouse.id.toString()}
                        getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                        onSelect={(warehouse) => {
                          field.onChange(String(warehouse.depoKodu));
                          form.setValue('targetWarehouseId', warehouse.id);
                          form.clearErrors('targetWarehouse');
                          setSelectedWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                        }}
                      />
                    </OpsFieldShell>
                  ) : (
                    <PagedLookupDialog<Warehouse>
                      open={warehouseLookupOpen}
                      onOpenChange={setWarehouseLookupOpen}
                      title={t('warehouse.step1.selectEntryWarehouse')}
                      description={t('warehouse.step1.entryWarehouse')}
                      value={selectedWarehouseText}
                      placeholder={t('warehouse.step1.selectEntryWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      queryKey={['warehouse', type, 'target-warehouse']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                      }
                      getKey={(warehouse) => warehouse.id.toString()}
                      getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                      onSelect={(warehouse) => {
                        field.onChange(String(warehouse.depoKodu));
                        form.setValue('targetWarehouseId', warehouse.id);
                        setSelectedWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                      }}
                    />
                  )}
                </FormControl>
                {fieldMessage}
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={control}
            name="sourceWarehouse"
            render={({ field }) => (
              <FormItem className={formItemClass}>
                <FormLabel>
                  {t('warehouse.step1.sourceWarehouse')}
                  {requiredMark}
                </FormLabel>
                <FormControl>
                  {isOps ? (
                    <OpsFieldShell className={warehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                      <PagedLookupDialog<Warehouse>
                        variant="ops"
                        open={warehouseLookupOpen}
                        onOpenChange={setWarehouseLookupOpen}
                        title={t('warehouse.step1.selectSourceWarehouse')}
                        value={selectedWarehouseText}
                        placeholder={t('warehouse.step1.selectSourceWarehouse')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.notFound')}
                        triggerClassName={OPS_FIELD_CLASS}
                        queryKey={['warehouse', type, 'source-warehouse']}
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
                      title={t('warehouse.step1.selectSourceWarehouse')}
                      description={t('warehouse.step1.sourceWarehouse')}
                      value={selectedWarehouseText}
                      placeholder={t('warehouse.step1.selectSourceWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      queryKey={['warehouse', type, 'source-warehouse']}
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
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField
          control={control}
          name="transferDate"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('warehouse.step1.transferDate')}
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
                {t('warehouse.step1.documentNo')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsInput placeholder={t('warehouse.step1.documentNoPlaceholder')} {...field} />
                ) : (
                  <Input placeholder={t('warehouse.step1.documentNoPlaceholder')} {...field} />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        {!hideDocumentSeries ? (
          <div className={formItemClass}>
            <OperationDocumentSeriesSelector
              operationType={type === 'inbound' ? 'WI' : 'WO'}
              warehouseId={type === 'inbound' ? watch('targetWarehouseId') : watch('sourceWarehouseId')}
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
                {t('warehouse.step1.customer')}
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
                      title={t('warehouse.step1.selectCustomer')}
                      value={selectedCustomerText}
                      placeholder={t('warehouse.step1.selectCustomer')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['warehouse', type, 'customers']}
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
                    title={t('warehouse.step1.selectCustomer')}
                    description={t('warehouse.step1.customer')}
                    value={selectedCustomerText}
                    placeholder={t('warehouse.step1.selectCustomer')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['warehouse', type, 'customers']}
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
              <FormLabel>{t('warehouse.step1.projectCode')}</FormLabel>
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
                      placeholder={t('warehouse.step1.selectProjectCode')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('warehouse.step1.noProject')}
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
                    placeholder={t('warehouse.step1.selectProjectCode')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('warehouse.step1.noProject')}
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

      {showOperationUsers && (
        <FormField
          control={control}
          name="userIds"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>{t('warehouse.step1.operationUsers')}</FormLabel>
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
                      placeholder={t('warehouse.step1.selectOperationUsers')}
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
                    placeholder={t('warehouse.step1.selectOperationUsers')}
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
      )}

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem className={formItemClass}>
            <FormLabel className={isOps ? 'wms-ops-notes-label' : undefined}>
              {t('warehouse.step1.notes')}
            </FormLabel>
            <FormControl>
              {isOps ? (
                <OpsTextarea placeholder={t('warehouse.step1.notesPlaceholder')} {...field} />
              ) : (
                <Textarea placeholder={t('warehouse.step1.notesPlaceholder')} {...field} />
              )}
            </FormControl>
            {fieldMessage}
          </FormItem>
        )}
      />

      <HeaderQuantityPolicyFields
        permissionCode={`wms.warehouse.${type}.quantity-policy`}
        variant={isOps ? 'ops' : 'default'}
      />
    </div>
  );
}
