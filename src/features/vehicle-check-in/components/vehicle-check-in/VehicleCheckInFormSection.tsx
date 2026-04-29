import type { ReactElement } from 'react';
import { CarFront, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomerLookup } from '@/services/lookup-types';
import type { CreateOrUpdateVehicleCheckInDto } from '../../types/vehicle-check-in.types';
import { buildCustomerLabel } from './shared';

interface VehicleCheckInFormSectionProps {
  entryDateText: string;
  formState: CreateOrUpdateVehicleCheckInDto;
  onFormStateChange: (updater: (prev: CreateOrUpdateVehicleCheckInDto) => CreateOrUpdateVehicleCheckInDto) => void;
  customerDialogOpen: boolean;
  onCustomerDialogOpenChange: (open: boolean) => void;
  onFindToday: () => void;
  findTodayPending: boolean;
  onPlateBlur: () => void;
  onSave: () => void;
  savePending: boolean;
  onOpenList: () => void;
  fetchCustomers: (args: { pageNumber: number; pageSize: number; search: string; signal?: AbortSignal }) => Promise<import('@/types/api').PagedResponse<CustomerLookup>>;
}

export function VehicleCheckInFormSection({
  entryDateText,
  formState,
  onFormStateChange,
  customerDialogOpen,
  onCustomerDialogOpenChange,
  onFindToday,
  findTodayPending,
  onPlateBlur,
  onSave,
  savePending,
  onOpenList,
  fetchCustomers,
}: VehicleCheckInFormSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <FormPageShell title={t('vehicleCheckIn.title')} description={t('vehicleCheckIn.description')}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 p-4 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
          <div className="font-semibold">{t('vehicleCheckIn.guidance.title')}</div>
          <div className="mt-1">{t('vehicleCheckIn.guidance.sameDayRule')}</div>
          <div>{t('vehicleCheckIn.guidance.nextDayRule')}</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vehicle-plate">{t('vehicleCheckIn.fields.plate')} *</Label>
            <div className="flex gap-2">
              <Input
                id="vehicle-plate"
                value={formState.plateNo}
                onChange={(event) => onFormStateChange((prev) => ({ ...prev, plateNo: event.target.value.toUpperCase() }))}
                onBlur={onPlateBlur}
                placeholder={t('vehicleCheckIn.fields.platePh')}
              />
              <Button type="button" variant="outline" onClick={onFindToday} disabled={findTodayPending}>
                {findTodayPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
                {t('vehicleCheckIn.actions.findToday')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('vehicleCheckIn.fields.entryDate')}</Label>
            <Input value={entryDateText} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-first-name">{t('vehicleCheckIn.fields.firstName')}</Label>
            <Input
              id="vehicle-first-name"
              value={formState.firstName || ''}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder={t('vehicleCheckIn.fields.firstNamePh')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-last-name">{t('vehicleCheckIn.fields.lastName')}</Label>
            <Input
              id="vehicle-last-name"
              value={formState.lastName || ''}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder={t('vehicleCheckIn.fields.lastNamePh')}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>{t('vehicleCheckIn.fields.customer')}</Label>
            <PagedLookupDialog<CustomerLookup>
              open={customerDialogOpen}
              onOpenChange={onCustomerDialogOpenChange}
              title={t('vehicleCheckIn.customerLookup.title')}
              description={t('vehicleCheckIn.customerLookup.description')}
              value={buildCustomerLabel(formState)}
              placeholder={t('vehicleCheckIn.fields.customerPh')}
              queryKey={['vehicle-check-in', 'customers']}
              fetchPage={fetchCustomers}
              getKey={(item) => String(item.id)}
              getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
              onSelect={(item) => onFormStateChange((prev) => ({
                ...prev,
                customerId: item.id,
                customerCode: item.cariKod,
                customerName: item.cariIsim,
              }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onSave} disabled={savePending}>
            {savePending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CarFront className="mr-2 size-4" />}
            {t('vehicleCheckIn.actions.save')}
          </Button>
          <Button type="button" variant="ghost" onClick={onOpenList}>
            {t('vehicleCheckIn.actions.openList')}
          </Button>
        </div>
      </div>
    </FormPageShell>
  );
}
