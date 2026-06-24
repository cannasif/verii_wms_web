import type { ReactElement } from 'react';
import { CarFront, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  MasterDataOpsFormField,
  MasterDataOpsGuidance,
  MasterDataOpsSection,
} from '@/features/shared';
import type { CustomerLookup } from '@/features/shared/api/lookup-types';
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
    <div className="space-y-6">
      <MasterDataOpsGuidance
        title={t('vehicleCheckIn.guidance.title')}
        lines={[t('vehicleCheckIn.guidance.sameDayRule'), t('vehicleCheckIn.guidance.nextDayRule')]}
      />

      <MasterDataOpsSection title={t('vehicleCheckIn.title')}>
        <div className="grid gap-5 lg:grid-cols-2">
          <MasterDataOpsFormField label={`${t('vehicleCheckIn.fields.plate')} *`} htmlFor="vehicle-plate">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="min-w-0 flex-1">
                <OpsInput
                  id="vehicle-plate"
                  value={formState.plateNo}
                  onChange={(event) => onFormStateChange((prev) => ({ ...prev, plateNo: event.target.value.toUpperCase() }))}
                  onBlur={onPlateBlur}
                  placeholder={t('vehicleCheckIn.fields.platePh')}
                />
              </div>
              <OpsActionButton type="button" variant="secondary" onClick={onFindToday} disabled={findTodayPending}>
                {findTodayPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {t('vehicleCheckIn.actions.findToday')}
              </OpsActionButton>
            </div>
          </MasterDataOpsFormField>

          <MasterDataOpsFormField label={t('vehicleCheckIn.fields.entryDate')}>
            <OpsInput value={entryDateText} readOnly />
          </MasterDataOpsFormField>

          <MasterDataOpsFormField label={t('vehicleCheckIn.fields.firstName')} htmlFor="vehicle-first-name">
            <OpsInput
              id="vehicle-first-name"
              value={formState.firstName || ''}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder={t('vehicleCheckIn.fields.firstNamePh')}
            />
          </MasterDataOpsFormField>

          <MasterDataOpsFormField label={t('vehicleCheckIn.fields.lastName')} htmlFor="vehicle-last-name">
            <OpsInput
              id="vehicle-last-name"
              value={formState.lastName || ''}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder={t('vehicleCheckIn.fields.lastNamePh')}
            />
          </MasterDataOpsFormField>

          <MasterDataOpsFormField label={t('vehicleCheckIn.fields.customer')} className="lg:col-span-2">
            <PagedLookupDialog<CustomerLookup>
              variant="ops"
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
          </MasterDataOpsFormField>
        </div>

        <div className="wms-ops-actions mt-5 flex flex-wrap gap-3">
          <OpsActionButton type="button" variant="primary" onClick={onSave} disabled={savePending}>
            {savePending ? <Loader2 className="size-4 animate-spin" /> : <CarFront className="size-4" />}
            {t('vehicleCheckIn.actions.save')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="secondary" onClick={onOpenList}>
            {t('vehicleCheckIn.actions.openList')}
          </OpsActionButton>
        </div>
      </MasterDataOpsSection>
    </div>
  );
}
