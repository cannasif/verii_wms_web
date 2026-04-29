import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import type { TFunction } from 'i18next';
import type { PagedResponse } from '@/types/api';
import type { KkdEmployeeDto, KkdResolvedEmployeeDto } from '../../types/kkd.types';

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
    <Card>
      <CardHeader><CardTitle>{t('kkd.operational.initialOrder.cardEmployee')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <div className="space-y-2">
            <Label htmlFor="kkd-order-qr">{t('kkd.operational.initialOrder.qrLabel')}</Label>
            <Input
              id="kkd-order-qr"
              value={employeeQr}
              onChange={(e) => onEmployeeQrChange(e.target.value)}
              placeholder={t('kkd.operational.initialOrder.qrPlaceholder')}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={onResolveQr} disabled={resolveQrDisabled}>
              {t('kkd.operational.initialOrder.resolveQr')}
            </Button>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={onSelectMe} disabled={!authUserId || currentEmployeeLoading}>
              {t('kkd.operational.initialOrder.selectMe')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('kkd.operational.initialOrder.altEmployee')}</Label>
          <PagedLookupDialog<KkdEmployeeDto>
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
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('kkd.operational.initialOrder.employmentStart')}: {employmentStartDate ? new Date(employmentStartDate).toLocaleDateString(dateLocale) : '-'}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
