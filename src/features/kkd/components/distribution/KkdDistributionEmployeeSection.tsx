import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput, PagedLookupDialog } from '@/components/shared';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
import { kkdApi } from '../../api/kkd.api';
import type { KkdDistributionHeaderDto, KkdEmployeeDto, KkdResolvedEmployeeDto } from '../../types/kkd.types';
import {
  KkdEmployeeSummaryPanel,
  KkdFlagChip,
  KkdOpsFormField,
  KkdOpsSection,
  KkdResultPanel,
  kkdOpsStatusBadge,
} from '../kkd-ops-ui';

interface KkdDistributionEmployeeSectionProps {
  employeeQr: string;
  onEmployeeQrChange: (value: string) => void;
  onResolveQr: () => void;
  isResolvingQr: boolean;
  selectedWarehouse: WarehouseLookup | null;
  warehouseDialogOpen: boolean;
  onWarehouseDialogOpenChange: (open: boolean) => void;
  onWarehouseSelect: (warehouse: WarehouseLookup) => void;
  employeeDialogOpen: boolean;
  onEmployeeDialogOpenChange: (open: boolean) => void;
  onEmployeeSelect: (employee: KkdEmployeeDto) => void;
  resolvedEmployee: KkdResolvedEmployeeDto | null;
  submittedHeader: KkdDistributionHeaderDto | null;
  localizeStatusLabel: (status: string | undefined | null) => string;
}

const dist = 'kkd.operational.dist' as const;

export function KkdDistributionEmployeeSection({
  employeeQr,
  onEmployeeQrChange,
  onResolveQr,
  isResolvingQr,
  selectedWarehouse,
  warehouseDialogOpen,
  onWarehouseDialogOpenChange,
  onWarehouseSelect,
  employeeDialogOpen,
  onEmployeeDialogOpenChange,
  onEmployeeSelect,
  resolvedEmployee,
  submittedHeader,
  localizeStatusLabel,
}: KkdDistributionEmployeeSectionProps): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);

  return (
    <KkdOpsSection title={t(`${dist}.titleEmployeeWarehouse`)}>
      <div className="grid gap-4 md:grid-cols-2">
        <KkdOpsFormField label={t(`${dist}.qrLabel`)} htmlFor="kkd-qr">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="min-w-0 flex-1">
              <OpsInput
                id="kkd-qr"
                value={employeeQr}
                onChange={(e) => onEmployeeQrChange(e.target.value)}
                placeholder={t(`${dist}.qrPh`)}
              />
            </div>
            <OpsActionButton type="button" variant="primary" onClick={onResolveQr} disabled={!employeeQr.trim() || isResolvingQr}>
              {t(`${dist}.resolveQr`)}
            </OpsActionButton>
          </div>
        </KkdOpsFormField>

        <KkdOpsFormField label={t(`${dist}.warehouse`)}>
          <PagedLookupDialog<WarehouseLookup>
            variant="ops"
            open={warehouseDialogOpen}
            onOpenChange={onWarehouseDialogOpenChange}
            title={t(`${dist}.whDialogTitle`)}
            value={selectedWarehouse ? `${selectedWarehouse.depoKodu} - ${selectedWarehouse.depoIsmi}` : null}
            placeholder={t(`${dist}.whPh`)}
            queryKey={['kkd', 'warehouses']}
            fetchPage={({ pageNumber, pageSize, search, signal }) =>
              lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
            getKey={(item) => String(item.id)}
            getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
            onSelect={onWarehouseSelect}
          />
        </KkdOpsFormField>
      </div>

      <KkdOpsFormField label={t(`${dist}.altEmployee`)} className="mt-4">
        <PagedLookupDialog<KkdEmployeeDto>
          variant="ops"
          open={employeeDialogOpen}
          onOpenChange={onEmployeeDialogOpenChange}
          title={t(`${dist}.empDialogTitle`)}
          value={resolvedEmployee ? `${resolvedEmployee.employeeCode} - ${resolvedEmployee.fullName}` : null}
          placeholder={t(`${dist}.empPh`)}
          queryKey={['kkd', 'distribution', 'employees']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
          onSelect={onEmployeeSelect}
        />
      </KkdOpsFormField>

      {resolvedEmployee ? (
        <KkdEmployeeSummaryPanel>
          <div className="flex flex-wrap items-center gap-2">
            <KkdFlagChip>{resolvedEmployee.employeeCode}</KkdFlagChip>
            <KkdFlagChip tone="info">{resolvedEmployee.customerCode}</KkdFlagChip>
            {resolvedEmployee.departmentName ? <KkdFlagChip>{resolvedEmployee.departmentName}</KkdFlagChip> : null}
            {resolvedEmployee.roleName ? <KkdFlagChip>{resolvedEmployee.roleName}</KkdFlagChip> : null}
          </div>
          <p className="mt-3 text-lg font-semibold">{resolvedEmployee.fullName}</p>
        </KkdEmployeeSummaryPanel>
      ) : null}

      {submittedHeader ? (
        <KkdResultPanel tone="success">
          <div className="flex flex-wrap items-center gap-3">
            <KkdFlagChip>{t(`${dist}.headerIdBadge`, { id: submittedHeader.id })}</KkdFlagChip>
            {kkdOpsStatusBadge(localizeStatusLabel(submittedHeader.status), 'done')}
            <KkdFlagChip tone="info">{t(`${dist}.warehouseIdBadge`, { id: submittedHeader.warehouseId })}</KkdFlagChip>
          </div>
          <p className="mt-2 text-sm opacity-80">
            {t(`${dist}.docNo`)}: {submittedHeader.documentNo || '-'}
          </p>
        </KkdResultPanel>
      ) : null}
    </KkdOpsSection>
  );
}
