import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsServiceEyebrow } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/shared';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getLocaleForFormatting } from '@/lib/i18n';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdEmployeeDto, KkdEntitlementCheckResultDto, KkdStockGroupOption } from '../types/kkd.types';
import {
  KkdFlagChip,
  KkdOpsFormField,
  KkdOpsSection,
  KkdResultPanel,
  KkdSummaryMetric,
  kkdOpsStatusBadge,
} from './kkd-ops-ui';

export function KkdEntitlementCheckPage(): ReactElement {
  const { t, i18n } = useTranslation(['kkd', 'common']);
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
    <OpsFormPageShell
      className="wms-ops-kkd-page"
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.entitlementCheck.pageTitle')}
      description={t('kkd.operational.entitlementCheck.breadcrumb')}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <KkdOpsSection title={t('kkd.operational.entitlementCheck.cardInputs')}>
          <div className="space-y-5">
            <KkdOpsFormField label={t('kkd.operational.entitlementCheck.employeeLabel')}>
              <PagedLookupDialog<KkdEmployeeDto>
                variant="ops"
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
            </KkdOpsFormField>

            <KkdOpsFormField label={t('kkd.operational.entitlementCheck.groupLabel')}>
              <SearchableSelect<KkdStockGroupOption>
                variant="ops"
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
            </KkdOpsFormField>

            <div className="grid gap-4 md:grid-cols-2">
              <KkdOpsFormField label={t('common.quantity')} htmlFor="kkd-check-qty">
                <OpsInput
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
              </KkdOpsFormField>

              <KkdOpsFormField label={t('kkd.operational.entitlementCheck.txnDate')} htmlFor="kkd-check-date">
                <OpsInput
                  id="kkd-check-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => {
                    setTransactionDate(event.target.value);
                    setResult(null);
                  }}
                />
              </KkdOpsFormField>
            </div>

            <KkdResultPanel tone="warn">
              <p className="text-sm leading-6">{t('kkd.operational.entitlementCheck.infoBox')}</p>
            </KkdResultPanel>

            <OpsActionButton
              type="button"
              variant="primary"
              onClick={() => checkMutation.mutate()}
              disabled={!selectedEmployee || !groupCode || checkMutation.isPending}
            >
              {checkMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('kkd.operational.entitlementCheck.checkButton')}
            </OpsActionButton>
          </div>
        </KkdOpsSection>

        <KkdOpsSection title={t('kkd.operational.entitlementCheck.cardResult')}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedEmployee ? <KkdFlagChip tone="info">{selectedEmployee.employeeCode}</KkdFlagChip> : null}
              {selectedEmployee?.customerCode ? <KkdFlagChip>{selectedEmployee.customerCode}</KkdFlagChip> : null}
              {selectedGroup?.groupCode ? <KkdFlagChip tone="info">{selectedGroup.groupCode}</KkdFlagChip> : null}
              {selectedGroup?.groupName ? <KkdFlagChip>{selectedGroup.groupName}</KkdFlagChip> : null}
            </div>

            {result ? (
              <>
                <KkdResultPanel tone={result.allowed ? 'success' : 'danger'}>
                  <div className="flex flex-wrap items-center gap-2">
                    {kkdOpsStatusBadge(
                      result.allowed ? t('kkd.operational.entitlementCheck.resultAllowed') : t('kkd.operational.entitlementCheck.resultBlocked'),
                      result.allowed ? 'active' : 'danger',
                    )}
                    <KkdFlagChip>
                      {t('kkd.operational.entitlementCheck.mainEntitlement')}: {result.remainingMainQuantity}
                    </KkdFlagChip>
                    <KkdFlagChip>
                      {t('kkd.operational.entitlementCheck.extraEntitlement')}: {result.remainingAdditionalQuantity}
                    </KkdFlagChip>
                    <KkdFlagChip tone="info">
                      {t('kkd.operational.entitlementCheck.total')}: {result.totalRemainingQuantity}
                    </KkdFlagChip>
                  </div>

                  {result.message ? <p className="mt-3 text-sm leading-6">{result.message}</p> : null}
                </KkdResultPanel>

                <div className="grid gap-4 md:grid-cols-2">
                  <KkdSummaryMetric
                    icon={<span className="text-xs font-bold">SRC</span>}
                    label={t('kkd.operational.entitlementCheck.suggestedSource')}
                    value={result.suggestedEntitlementType || '-'}
                  />
                  <KkdSummaryMetric
                    icon={<span className="text-xs font-bold">DT</span>}
                    label={t('kkd.operational.entitlementCheck.nextDate')}
                    value={result.nextEligibleDate ? new Date(result.nextEligibleDate).toLocaleDateString(dateLocale) : '-'}
                  />
                </div>
              </>
            ) : (
              <KkdResultPanel>
                <p className="text-center text-sm">{t('kkd.operational.entitlementCheck.emptyState')}</p>
              </KkdResultPanel>
            )}
          </div>
        </KkdOpsSection>
      </div>
    </OpsFormPageShell>
  );
}
