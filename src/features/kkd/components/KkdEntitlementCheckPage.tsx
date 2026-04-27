import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getLocaleForFormatting } from '@/lib/i18n';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdEmployeeDto, KkdEntitlementCheckResultDto, KkdStockGroupOption } from '../types/kkd.types';

export function KkdEntitlementCheckPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const dateLocale = getLocaleForFormatting(i18n.language);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<KkdEmployeeDto | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<KkdEntitlementCheckResultDto | null>(null);

  useEffect(() => {
    setPageTitle(t('kkd.operational.entitlementCheck.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'entitlement-check', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const selectedGroup = useMemo(
    () => stockGroupsQuery.data?.find((item) => item.groupCode === groupCode) ?? null,
    [groupCode, stockGroupsQuery.data],
  );

  const checkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error(t('kkd.operational.entitlementCheck.errSelectEmployee'));
      if (!groupCode) throw new Error(t('kkd.operational.entitlementCheck.errSelectGroup'));

      return kkdApi.checkEntitlement({
        employeeId: selectedEmployee.id,
        customerId: selectedEmployee.customerId,
        groupCode,
        quantity: Number(quantity) || 1,
        transactionDate: transactionDate || null,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.allowed ? t('kkd.operational.entitlementCheck.toastOk') : t('kkd.operational.entitlementCheck.toastDone'));
    },
    onError: (error) => {
      setResult(null);
      toast.error(error instanceof Error ? error.message : t('kkd.operational.entitlementCheck.toastFail'));
    },
  });

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.operationsGroup') },
          { label: t('kkd.operational.entitlementCheck.breadcrumb'), isActive: true },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.entitlementCheck.cardInputs')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>{t('kkd.operational.entitlementCheck.employeeLabel')}</Label>
              <PagedLookupDialog<KkdEmployeeDto>
                open={employeeDialogOpen}
                onOpenChange={setEmployeeDialogOpen}
                title={t('kkd.dialogs.selectEmployee')}
                value={selectedEmployee ? `${selectedEmployee.employeeCode} - ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : null}
                placeholder={t('kkd.placeholders.selectEmployee')}
                queryKey={['kkd', 'entitlement-check', 'employees']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
                onSelect={(item) => {
                  setSelectedEmployee(item);
                  setResult(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('kkd.operational.entitlementCheck.groupLabel')}</Label>
              <SearchableSelect<KkdStockGroupOption>
                value={groupCode}
                onValueChange={(value) => {
                  setGroupCode(value);
                  setResult(null);
                }}
                options={stockGroupsQuery.data ?? []}
                getOptionValue={(option) => option.groupCode}
                getOptionLabel={(option) => `${option.groupCode}${option.groupName ? ` - ${option.groupName}` : ''}`}
                placeholder={t('kkd.operational.entitlementCheck.placeholderGroup')}
                searchPlaceholder={t('kkd.operational.entitlementCheck.searchGroup')}
                emptyText={t('kkd.operational.entitlementCheck.groupEmpty')}
                isLoading={stockGroupsQuery.isLoading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kkd-check-qty">{t('common.quantity')}</Label>
                <Input
                  id="kkd-check-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setResult(null);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kkd-check-date">{t('kkd.operational.entitlementCheck.txnDate')}</Label>
                <Input
                  id="kkd-check-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => {
                    setTransactionDate(event.target.value);
                    setResult(null);
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/3 dark:text-slate-300">
              {t('kkd.operational.entitlementCheck.infoBox')}
            </div>

            <Button type="button" onClick={() => checkMutation.mutate()} disabled={!selectedEmployee || !groupCode || checkMutation.isPending}>
              {t('kkd.operational.entitlementCheck.checkButton')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.entitlementCheck.cardResult')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedEmployee ? <Badge>{selectedEmployee.employeeCode}</Badge> : null}
              {selectedEmployee?.customerCode ? <Badge variant="secondary">{selectedEmployee.customerCode}</Badge> : null}
              {selectedGroup?.groupCode ? <Badge variant="outline">{selectedGroup.groupCode}</Badge> : null}
              {selectedGroup?.groupName ? <Badge variant="outline">{selectedGroup.groupName}</Badge> : null}
            </div>

            {result ? (
              <>
                <div className={`rounded-2xl border p-4 ${result.allowed ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/60 dark:border-rose-800/40 dark:bg-rose-950/20'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={result.allowed ? 'default' : 'destructive'}>
                      {result.allowed ? t('kkd.operational.entitlementCheck.resultAllowed') : t('kkd.operational.entitlementCheck.resultBlocked')}
                    </Badge>
                    <Badge variant="outline">
                      {t('kkd.operational.entitlementCheck.mainEntitlement')}: {result.remainingMainQuantity}
                    </Badge>
                    <Badge variant="outline">
                      {t('kkd.operational.entitlementCheck.extraEntitlement')}: {result.remainingAdditionalQuantity}
                    </Badge>
                    <Badge variant="secondary">
                      {t('kkd.operational.entitlementCheck.total')}: {result.totalRemainingQuantity}
                    </Badge>
                  </div>

                  {result.message ? <p className="mt-3 text-sm leading-6">{result.message}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('kkd.operational.entitlementCheck.suggestedSource')}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{result.suggestedEntitlementType || '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('kkd.operational.entitlementCheck.nextDate')}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {result.nextEligibleDate ? new Date(result.nextEligibleDate).toLocaleDateString(dateLocale) : '-'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('kkd.operational.entitlementCheck.emptyState')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
