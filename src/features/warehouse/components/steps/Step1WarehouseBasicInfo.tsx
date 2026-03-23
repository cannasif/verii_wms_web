import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/features/goods-receipt/hooks/useCustomers';
import { useProjects } from '@/features/goods-receipt/hooks/useProjects';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { SearchableMultiSelect } from '@/features/transfer/components/steps/components/SearchableMultiSelect';
import type { Customer, Project, Warehouse } from '@/features/goods-receipt/types/goods-receipt';
import type { UserDto } from '@/features/auth/types/auth';
import type { WarehouseFormData } from '../../types/warehouse';
import { warehouseInboundTypeOptions, warehouseOutboundTypeOptions } from '../../types/warehouse';

type WarehouseType = 'inbound' | 'outbound';

interface Step1WarehouseBasicInfoProps {
  type: WarehouseType;
}

export function Step1WarehouseBasicInfo({ type }: Step1WarehouseBasicInfoProps): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext<WarehouseFormData>();

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();

  const typeOptions = type === 'inbound' ? warehouseInboundTypeOptions : warehouseOutboundTypeOptions;

  return (
    <div className="space-y-6 crm-page">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="operationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.step1.operationType')} *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value)}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('warehouse.step1.selectOperationType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === 'inbound' ? (
          <FormField
            control={form.control}
            name="targetWarehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('warehouse.step1.entryWarehouse')} *</FormLabel>
                <FormControl>
                  <SearchableSelect<Warehouse>
                    value={field.value}
                    onValueChange={field.onChange}
                    options={warehouses || []}
                    getOptionValue={(opt) => String(opt.depoKodu)}
                    getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                    placeholder={t('warehouse.step1.selectEntryWarehouse')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    isLoading={isLoadingWarehouses}
                    itemLimit={100}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="sourceWarehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('warehouse.step1.sourceWarehouse')} *</FormLabel>
                <FormControl>
                  <SearchableSelect<Warehouse>
                    value={field.value}
                    onValueChange={field.onChange}
                    options={warehouses || []}
                    getOptionValue={(opt) => String(opt.depoKodu)}
                    getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                    placeholder={t('warehouse.step1.selectSourceWarehouse')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    isLoading={isLoadingWarehouses}
                    itemLimit={100}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="transferDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('warehouse.step1.transferDate')} *</FormLabel>
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
              <FormLabel>{t('warehouse.step1.documentNo')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('warehouse.step1.documentNoPlaceholder')} {...field} />
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
              <FormLabel>{t('warehouse.step1.customer')} *</FormLabel>
              <FormControl>
                <SearchableSelect<Customer>
                  value={field.value}
                  onValueChange={field.onChange}
                  options={customers || []}
                  getOptionValue={(opt) => opt.cariKod}
                  getOptionLabel={(opt) => `${opt.cariIsim} (${opt.cariKod})`}
                  placeholder={t('warehouse.step1.selectCustomer')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.notFound')}
                  isLoading={isLoadingCustomers}
                  itemLimit={100}
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
              <FormLabel>{t('warehouse.step1.projectCode')}</FormLabel>
              <FormControl>
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
            <FormLabel>{t('warehouse.step1.operationUsers')}</FormLabel>
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
                placeholder={t('warehouse.step1.selectOperationUsers')}
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
            <FormLabel>{t('warehouse.step1.notes')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('warehouse.step1.notesPlaceholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
