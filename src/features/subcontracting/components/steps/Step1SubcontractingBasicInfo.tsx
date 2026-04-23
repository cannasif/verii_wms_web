import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/features/goods-receipt/hooks/useProjects';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { SearchableMultiSelect } from '@/features/transfer/components/steps/components/SearchableMultiSelect';
import { lookupApi } from '@/services/lookup-api';
import type { Customer, Project, Warehouse } from '@/features/goods-receipt/types/goods-receipt';
import type { UserDto } from '@/features/auth/types/auth';
import type { SubcontractingFormData } from '../../types/subcontracting';

export function Step1SubcontractingBasicInfo(): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext<SubcontractingFormData>();
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [sourceWarehouseLookupOpen, setSourceWarehouseLookupOpen] = useState(false);
  const [targetWarehouseLookupOpen, setTargetWarehouseLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedSourceWarehouseLabel, setSelectedSourceWarehouseLabel] = useState('');
  const [selectedTargetWarehouseLabel, setSelectedTargetWarehouseLabel] = useState('');

  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="transferDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.transferDate')} *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documentNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.documentNo')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('subcontracting.step1.documentNoPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.customer')} *</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.projectCode')}</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="sourceWarehouse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.sourceWarehouse')} *</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetWarehouse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.targetWarehouse')} *</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="userIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('subcontracting.step1.operationUsers')}</FormLabel>
            <FormControl>
              <SearchableMultiSelect<UserDto>
                value={field.value || []}
                onValueChange={(values) => field.onChange(values)}
                options={activeUsers || []}
                getOptionValue={(opt) => String(opt.id)}
                getOptionLabel={(opt) => {
                  const name = opt.fullName || `${opt.firstName || ''} ${opt.lastName || ''}`.trim() || opt.username;
                  return opt.email ? `${name} (${opt.email})` : name;
                }}
                placeholder={t('subcontracting.step1.selectOperationUsers')}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.notFound')}
                isLoading={isLoadingUsers}
                itemLimit={100}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('subcontracting.step1.notes')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('subcontracting.step1.notesPlaceholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
