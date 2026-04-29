import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { kkdApi } from '../../api/kkd.api';
import { lookupApi } from '@/services/lookup-api';
import type { WarehouseLookup } from '@/services/lookup-types';
import type { KkdDistributionHeaderDto, KkdEmployeeDto, KkdResolvedEmployeeDto } from '../../types/kkd.types';

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
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${dist}.titleEmployeeWarehouse`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kkd-qr">{t(`${dist}.qrLabel`)}</Label>
            <div className="flex gap-2">
              <Input id="kkd-qr" value={employeeQr} onChange={(e) => onEmployeeQrChange(e.target.value)} placeholder={t(`${dist}.qrPh`)} />
              <Button type="button" onClick={onResolveQr} disabled={!employeeQr.trim() || isResolvingQr}>
                {t(`${dist}.resolveQr`)}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t(`${dist}.warehouse`)}</Label>
            <PagedLookupDialog<WarehouseLookup>
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
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t(`${dist}.altEmployee`)}</Label>
          <PagedLookupDialog<KkdEmployeeDto>
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
        </div>

        {resolvedEmployee ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{resolvedEmployee.employeeCode}</Badge>
              <Badge variant="secondary">{resolvedEmployee.customerCode}</Badge>
              {resolvedEmployee.departmentName ? <Badge variant="outline">{resolvedEmployee.departmentName}</Badge> : null}
              {resolvedEmployee.roleName ? <Badge variant="outline">{resolvedEmployee.roleName}</Badge> : null}
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{resolvedEmployee.fullName}</p>
          </div>
        ) : null}

        {submittedHeader ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{t(`${dist}.headerIdBadge`, { id: submittedHeader.id })}</Badge>
              <Badge>{localizeStatusLabel(submittedHeader.status)}</Badge>
              <Badge variant="secondary">{t(`${dist}.warehouseIdBadge`, { id: submittedHeader.warehouseId })}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t(`${dist}.docNo`)}: {submittedHeader.documentNo || '-'}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
