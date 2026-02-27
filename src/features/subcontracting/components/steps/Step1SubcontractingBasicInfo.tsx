import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/features/goods-receipt/hooks/useCustomers';
import { useProjects } from '@/features/goods-receipt/hooks/useProjects';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { SearchableMultiSelect } from '@/features/transfer/components/steps/components/SearchableMultiSelect';
import type { Customer, Project, Warehouse } from '@/features/goods-receipt/types/goods-receipt';
import type { UserDto } from '@/features/auth/types/auth';
import type { SubcontractingFormData } from '../../types/subcontracting';

export function Step1SubcontractingBasicInfo(): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext<SubcontractingFormData>();

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: activeUsers, isLoading: isLoadingUsers } = useActiveUsers();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="transferDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subcontracting.step1.transferDate', 'Transfer Tarihi')}</FormLabel>
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
              <FormLabel>{t('subcontracting.step1.documentNo', 'Belge No')}</FormLabel>
              <FormControl>
                <Input placeholder={t('subcontracting.step1.documentNoPlaceholder', 'Belge No giriniz')} {...field} />
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
              <FormLabel>{t('subcontracting.step1.customer', 'Cari')}</FormLabel>
              <FormControl>
                <SearchableSelect<Customer>
                  value={field.value}
                  onValueChange={field.onChange}
                  options={customers || []}
                  getOptionValue={(opt) => opt.cariKod}
                  getOptionLabel={(opt) => `${opt.cariIsim} (${opt.cariKod})`}
                  placeholder={t('subcontracting.step1.selectCustomer', 'Cari seçiniz')}
                  searchPlaceholder={t('common.search', 'Ara...')}
                  emptyText={t('common.notFound', 'Bulunamadı')}
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
              <FormLabel>{t('subcontracting.step1.projectCode', 'Proje Kodu')}</FormLabel>
              <FormControl>
                <SearchableSelect<Project>
                  value={field.value || ''}
                  onValueChange={(value) => {
                    field.onChange(value || '');
                  }}
                  options={projects || []}
                  getOptionValue={(opt) => opt.projeKod}
                  getOptionLabel={(opt) => `${opt.projeAciklama} (${opt.projeKod})`}
                  placeholder={t('subcontracting.step1.selectProjectCode', 'Proje kodu seçiniz')}
                  searchPlaceholder={t('common.search', 'Ara...')}
                  emptyText={t('subcontracting.step1.noProject', 'Proje yok')}
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
              <FormLabel>{t('subcontracting.step1.sourceWarehouse', 'Çıkış Deposu')}</FormLabel>
              <FormControl>
                <SearchableSelect<Warehouse>
                  value={field.value}
                  onValueChange={field.onChange}
                  options={warehouses || []}
                  getOptionValue={(opt) => String(opt.depoKodu)}
                  getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                  placeholder={t('subcontracting.step1.selectSourceWarehouse', 'Çıkış deposu seçiniz')}
                  searchPlaceholder={t('common.search', 'Ara...')}
                  emptyText={t('common.notFound', 'Bulunamadı')}
                  isLoading={isLoadingWarehouses}
                  itemLimit={100}
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
              <FormLabel>{t('subcontracting.step1.targetWarehouse', 'Varış Deposu')}</FormLabel>
              <FormControl>
                <SearchableSelect<Warehouse>
                  value={field.value}
                  onValueChange={field.onChange}
                  options={warehouses || []}
                  getOptionValue={(opt) => String(opt.depoKodu)}
                  getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                  placeholder={t('subcontracting.step1.selectTargetWarehouse', 'Varış deposu seçiniz')}
                  searchPlaceholder={t('common.search', 'Ara...')}
                  emptyText={t('common.notFound', 'Bulunamadı')}
                  isLoading={isLoadingWarehouses}
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
            <FormLabel>{t('subcontracting.step1.operationUsers', 'İşlem Yapacak Kullanıcılar')}</FormLabel>
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
                placeholder={t('subcontracting.step1.selectOperationUsers', 'İşlem yapacak kullanıcıları seçiniz')}
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
            <FormLabel>{t('subcontracting.step1.notes', 'Notlar')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('subcontracting.step1.notesPlaceholder', 'Notlarınızı giriniz')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

