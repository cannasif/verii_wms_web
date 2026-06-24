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
import { SearchableSelect, SearchableMultiSelect, getOperationUserDisplayName, getOperationUserSubtitle } from '@/features/shared';
import { OperationDocumentSeriesSelector } from '@/features/document-series-management/components/OperationDocumentSeriesSelector';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { Customer, Project, Warehouse } from '@/features/shared';
import type { UserDto } from '@/features/auth/types/auth';
import type { TransferFormData } from '../../types/transfer';

interface Step1TransferBasicInfoProps {
  isFreeTransfer?: boolean;
  hideDocumentSeries?: boolean;
  variant?: 'default' | 'ops';
}

export function Step1TransferBasicInfo({
  isFreeTransfer = false,
  hideDocumentSeries = false,
  variant = 'default',
}: Step1TransferBasicInfoProps): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const form = useFormContext<TransferFormData>();
  const { control, watch } = form;
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [sourceWarehouseLookupOpen, setSourceWarehouseLookupOpen] = useState(false);
  const [targetWarehouseLookupOpen, setTargetWarehouseLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedSourceWarehouseLabel, setSelectedSourceWarehouseLabel] = useState('');
  const [selectedTargetWarehouseLabel, setSelectedTargetWarehouseLabel] = useState('');

  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();
  const isOps = variant === 'ops';

  const selectedCustomerId = watch('customerId');
  const selectedSourceWarehouse = watch('sourceWarehouse');
  const selectedTargetWarehouse = watch('targetWarehouse');
  const selectedCustomerText = selectedCustomerLabel || selectedCustomerId || '';
  const selectedSourceWarehouseText = selectedSourceWarehouseLabel || selectedSourceWarehouse || '';
  const selectedTargetWarehouseText = selectedTargetWarehouseLabel || selectedTargetWarehouse || '';

  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : ' *';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField
          control={control}
          name="transferDate"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('transfer.step1.transferDate')}
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
                {t('transfer.step1.documentNo')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsInput placeholder={t('transfer.step1.documentNoPlaceholder')} {...field} />
                ) : (
                  <Input placeholder={t('transfer.step1.documentNoPlaceholder')} {...field} />
                )}
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />

        {!hideDocumentSeries ? (
          <div className={formItemClass}>
            <OperationDocumentSeriesSelector
              operationType="WT"
              warehouseId={watch('targetWarehouseId')}
              customerId={watch('customerRefId')}
              variant={variant}
            />
          </div>
        ) : null}
      </div>

      {!isFreeTransfer && (
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('transfer.step1.customer')}
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
                      title={t('transfer.step1.selectCustomer')}
                      value={selectedCustomerText}
                      placeholder={t('transfer.step1.selectCustomer')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['transfer', 'customers']}
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
                    title={t('transfer.step1.selectCustomer')}
                    description={t('transfer.step1.customer')}
                    value={selectedCustomerText}
                    placeholder={t('transfer.step1.selectCustomer')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['transfer', 'customers']}
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
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isFreeTransfer && (
          <FormField
            control={control}
            name="sourceWarehouse"
            render={({ field }) => (
              <FormItem className={formItemClass}>
                <FormLabel>
                  {t('transfer.step1.sourceWarehouse')}
                  {requiredMark}
                </FormLabel>
                <FormControl>
                  {isOps ? (
                    <OpsFieldShell className={sourceWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                      <PagedLookupDialog<Warehouse>
                        variant="ops"
                        open={sourceWarehouseLookupOpen}
                        onOpenChange={setSourceWarehouseLookupOpen}
                        title={t('transfer.step1.selectSourceWarehouse')}
                        value={selectedSourceWarehouseText}
                        placeholder={t('transfer.step1.selectSourceWarehouse')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.notFound')}
                        triggerClassName={OPS_FIELD_CLASS}
                        queryKey={['transfer', 'source-warehouse']}
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
                      title={t('transfer.step1.selectSourceWarehouse')}
                      description={t('transfer.step1.sourceWarehouse')}
                      value={selectedSourceWarehouseText}
                      placeholder={t('transfer.step1.selectSourceWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      queryKey={['transfer', 'source-warehouse']}
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
        )}

        <FormField
          control={control}
          name="targetWarehouse"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('transfer.step1.targetWarehouse')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                {isOps ? (
                  <OpsFieldShell className={targetWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                    <PagedLookupDialog<Warehouse>
                      variant="ops"
                      open={targetWarehouseLookupOpen}
                      onOpenChange={setTargetWarehouseLookupOpen}
                      title={t('transfer.step1.selectTargetWarehouse')}
                      value={selectedTargetWarehouseText}
                      placeholder={t('transfer.step1.selectTargetWarehouse')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('common.notFound')}
                      triggerClassName={OPS_FIELD_CLASS}
                      queryKey={['transfer', 'target-warehouse']}
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
                    title={t('transfer.step1.selectTargetWarehouse')}
                    description={t('transfer.step1.targetWarehouse')}
                    value={selectedTargetWarehouseText}
                    placeholder={t('transfer.step1.selectTargetWarehouse')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['transfer', 'target-warehouse']}
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

        {!isFreeTransfer && (
          <FormField
            control={control}
            name="projectCode"
            render={({ field }) => (
              <FormItem className={formItemClass}>
                <FormLabel>{t('transfer.step1.projectCode')}</FormLabel>
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
                        placeholder={t('transfer.step1.selectProjectCode')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('transfer.step1.noProject')}
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
                      placeholder={t('transfer.step1.selectProjectCode')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('transfer.step1.noProject')}
                      isLoading={isLoadingProjects}
                      itemLimit={100}
                    />
                  )}
                </FormControl>
                {fieldMessage}
              </FormItem>
            )}
          />
        )}
      </div>

      {isFreeTransfer && (
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={control}
            name="projectCode"
            render={({ field }) => (
              <FormItem className={formItemClass}>
                <FormLabel>{t('transfer.step1.projectCode')}</FormLabel>
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
                        placeholder={t('transfer.step1.selectProjectCode')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('transfer.step1.noProject')}
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
                      placeholder={t('transfer.step1.selectProjectCode')}
                      searchPlaceholder={t('common.search')}
                      emptyText={t('transfer.step1.noProject')}
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
      )}

      {!isFreeTransfer && selectedCustomerId ? (
        isOps ? (
          <OpsSelectedEntityCard
            label={t('transfer.step1.selectedCustomer')}
            eyebrow={t('transfer.step1.selectedCustomerEyebrow')}
            status={t('transfer.step1.selectedCustomerStatus')}
            value={selectedCustomerText}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('transfer.step1.selectedCustomer')}</CardTitle>
              <CardDescription>{selectedCustomerText}</CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      {isFreeTransfer && selectedSourceWarehouse ? (
        isOps ? (
          <OpsSelectedEntityCard
            label={t('transfer.step1.selectedSourceWarehouse')}
            eyebrow={t('transfer.step1.selectedSourceWarehouseEyebrow')}
            status={t('transfer.step1.selectedSourceWarehouseStatus')}
            value={selectedSourceWarehouseText}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('transfer.step1.selectedSourceWarehouse')}</CardTitle>
              <CardDescription>{selectedSourceWarehouseText}</CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      {selectedTargetWarehouse ? (
        isOps ? (
          <OpsSelectedEntityCard
            label={t('transfer.step1.selectedTargetWarehouse')}
            eyebrow={t('transfer.step1.selectedTargetWarehouseEyebrow')}
            status={t('transfer.step1.selectedTargetWarehouseStatus')}
            value={selectedTargetWarehouseText}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('transfer.step1.selectedTargetWarehouse')}</CardTitle>
              <CardDescription>{selectedTargetWarehouseText}</CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      <FormField
        control={control}
        name="userIds"
        render={({ field }) => (
          <FormItem className={formItemClass}>
            <FormLabel>{t('transfer.step1.operationUsers')}</FormLabel>
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
                    placeholder={t('transfer.step1.selectOperationUsers')}
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
                  placeholder={t('transfer.step1.selectOperationUsers')}
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

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem className={cn(formItemClass, 'md:col-span-2')}>
            <FormLabel className={isOps ? 'wms-ops-notes-label' : undefined}>
              {t('transfer.step1.notes')}
            </FormLabel>
            {isOps ? (
              <p className="wms-ops-notes-hint text-sm text-muted-foreground">
                {t('transfer.step1.notesDescription')}
              </p>
            ) : null}
            <FormControl>
              {isOps ? (
                <OpsTextarea
                  rows={3}
                  placeholder={t('transfer.step1.notesPlaceholder')}
                  {...field}
                />
              ) : (
                <Textarea placeholder={t('transfer.step1.notesPlaceholder')} {...field} />
              )}
            </FormControl>
            {fieldMessage}
          </FormItem>
        )}
      />

      <HeaderQuantityPolicyFields
        permissionCode="wms.transfer.quantity-policy"
        variant={isOps ? 'ops' : 'default'}
      />
    </div>
  );
}
