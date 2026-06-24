import type { ReactElement } from 'react';
import { OpsActionButton, OpsInput, PagedLookupDialog } from '@/components/shared';
import type { TFunction } from 'i18next';
import type { PagedResponse } from '@/types/api';
import type { KkdEmployeeDto, KkdResolvedEmployeeDto } from '../../types/kkd.types';
import {
  KkdEmployeeSummaryPanel,
  KkdFlagChip,
  KkdOpsFormField,
  KkdOpsSection,
} from '../kkd-ops-ui';

interface KkdInitialOrderEmployeeSectionProps {
  t: TFunction<'common'>;
  dateLocale: string;
  employeeQr: string;
  onEmployeeQrChange: (value: string) => void;
  employeeDialogOpen: boolean;
  onEmployeeDialogOpenChange: (open: boolean) => void;
  resolvedEmployee: KkdResolvedEmployeeDto | null;
  employmentStartDate?: string | null;
  authUserId: number | null;
  currentEmployeeLoading: boolean;
  onResolveQr: () => void;
  resolveQrDisabled: boolean;
  onSelectMe: () => void;
  fetchEmployees: (args: {
    pageNumber: number;
    pageSize: number;
    search: string;
    signal?: AbortSignal;
  }) => Promise<PagedResponse<KkdEmployeeDto>>;
  onSelectEmployee: (item: KkdEmployeeDto) => void;
}

export function KkdInitialOrderEmployeeSection({
  t,
  dateLocale,
  employeeQr,
  onEmployeeQrChange,
  employeeDialogOpen,
  onEmployeeDialogOpenChange,
  resolvedEmployee,
  employmentStartDate,
  authUserId,
  currentEmployeeLoading,
  onResolveQr,
  resolveQrDisabled,
  onSelectMe,
  fetchEmployees,
  onSelectEmployee,
}: KkdInitialOrderEmployeeSectionProps): ReactElement {
  return (
    <KkdOpsSection title={t('kkd.operational.initialOrder.cardEmployee')}>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:gap-5">
          <KkdOpsFormField label={t('kkd.operational.initialOrder.qrLabel')} htmlFor="kkd-order-qr">
            <OpsInput
              id="kkd-order-qr"
              value={employeeQr}
              onChange={(e) => onEmployeeQrChange(e.target.value)}
              placeholder={t('kkd.operational.initialOrder.qrPlaceholder')}
            />
          </KkdOpsFormField>
          <div className="flex items-end pb-0.5">
            <OpsActionButton type="button" onClick={onResolveQr} disabled={resolveQrDisabled}>
              {t('kkd.operational.initialOrder.resolveQr')}
            </OpsActionButton>
          </div>
          <div className="flex items-end pb-0.5">
            <OpsActionButton
              type="button"
              variant="secondary"
              onClick={onSelectMe}
              disabled={!authUserId || currentEmployeeLoading}
            >
              {t('kkd.operational.initialOrder.selectMe')}
            </OpsActionButton>
          </div>
        </div>

        <KkdOpsFormField label={t('kkd.operational.initialOrder.altEmployee')}>
          <PagedLookupDialog<KkdEmployeeDto>
            variant="ops"
            open={employeeDialogOpen}
            onOpenChange={onEmployeeDialogOpenChange}
            title={t('kkd.operational.initialOrder.selectEmployeeDialog')}
            value={resolvedEmployee ? `${resolvedEmployee.employeeCode} - ${resolvedEmployee.fullName}` : null}
            placeholder={t('kkd.operational.initialOrder.selectEmployeePlaceholder')}
            queryKey={['kkd', 'order', 'employees']}
            fetchPage={fetchEmployees}
            getKey={(item) => String(item.id)}
            getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
            onSelect={onSelectEmployee}
          />
        </KkdOpsFormField>

        {resolvedEmployee ? (
          <KkdEmployeeSummaryPanel>
            <div className="flex flex-wrap items-center gap-2">
              <KkdFlagChip>{resolvedEmployee.employeeCode}</KkdFlagChip>
              <KkdFlagChip tone="info">{resolvedEmployee.customerCode}</KkdFlagChip>
              {resolvedEmployee.departmentName ? <KkdFlagChip tone="default">{resolvedEmployee.departmentName}</KkdFlagChip> : null}
              {resolvedEmployee.roleName ? <KkdFlagChip tone="default">{resolvedEmployee.roleName}</KkdFlagChip> : null}
            </div>
            <p className="mt-3 text-lg font-semibold">{resolvedEmployee.fullName}</p>
            <p className="mt-1 text-sm opacity-80">
              {t('kkd.operational.initialOrder.employmentStart')}: {employmentStartDate ? new Date(employmentStartDate).toLocaleDateString(dateLocale) : '-'}
            </p>
          </KkdEmployeeSummaryPanel>
        ) : null}
      </div>
    </KkdOpsSection>
  );
}
