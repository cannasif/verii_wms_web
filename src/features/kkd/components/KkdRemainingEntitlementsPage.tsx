import { type ReactElement, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsServiceEyebrow } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { useTranslation } from 'react-i18next';
import { getLocaleForFormatting } from '@/lib/i18n';
import { useUIStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import { kkdApi } from '../api/kkd.api';
import type { KkdEmployeeDto, KkdRemainingEntitlementDto, KkdResolvedEmployeeDto } from '../types/kkd.types';
import {
  KkdFlagChip,
  KkdOpsFormField,
  KkdOpsSection,
  KkdResultPanel,
  kkdOpsStatusBadge,
} from './kkd-ops-ui';

export function KkdRemainingEntitlementsPage(): ReactElement {
  const { t, i18n } = useTranslation(['kkd', 'common']);
  const dateLocale = getLocaleForFormatting(i18n.language);
  const { setPageTitle } = useUIStore();
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<KkdEmployeeDto | null>(null);
  const [resolvedEmployee, setResolvedEmployee] = useState<KkdResolvedEmployeeDto | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<KkdRemainingEntitlementDto[]>([]);

  useEffect(() => {
    setPageTitle(t('kkd.operational.remaining.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const resolveQrMutation = useMutation({
    mutationFn: kkdApi.resolveEmployeeQr,
    onSuccess: (data) => {
      setResolvedEmployee(data);
      setSelectedEmployee(null);
      setItems([]);
      toast.success(t('kkd.operational.remaining.toastFound'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('kkd.operational.remaining.errQr')),
  });

  const remainingMutation = useMutation({
    mutationFn: async () => {
      const employeeId = resolvedEmployee?.employeeId ?? selectedEmployee?.id;
      if (!employeeId) throw new Error(t('kkd.operational.remaining.errNeedEmployee'));
      return kkdApi.getRemainingEntitlements(employeeId, transactionDate || null);
    },
    onSuccess: (data) => {
      setItems(data);
      toast.success(t('kkd.operational.remaining.toastList'));
    },
    onError: (error) => {
      setItems([]);
      toast.error(error instanceof Error ? error.message : t('kkd.operational.remaining.errList'));
    },
  });

  const currentEmployeeLabel = resolvedEmployee
    ? `${resolvedEmployee.employeeCode} - ${resolvedEmployee.fullName}`
    : selectedEmployee
      ? `${selectedEmployee.employeeCode} - ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
      : null;

  return (
    <OpsFormPageShell
      className="wms-ops-kkd-page"
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.remaining.pageTitle')}
      description={t('kkd.operational.remaining.breadcrumb')}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <KkdOpsSection title={t('kkd.operational.remaining.cardInput')}>
          <div className="space-y-5">
            <KkdOpsFormField label={t('kkd.operational.remaining.qrLabel')} htmlFor="kkd-remaining-qr">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="min-w-0 flex-1">
                  <OpsInput
                    id="kkd-remaining-qr"
                    value={qrCode}
                    onChange={(event) => setQrCode(event.target.value)}
                    placeholder={t('kkd.operational.remaining.qrPlaceholder')}
                  />
                </div>
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => resolveQrMutation.mutate({ qrCode })}
                  disabled={!qrCode.trim() || resolveQrMutation.isPending}
                >
                  {resolveQrMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t('kkd.operational.remaining.resolve')}
                </OpsActionButton>
              </div>
            </KkdOpsFormField>

            <KkdOpsFormField label={t('kkd.operational.remaining.altEmployee')}>
              <PagedLookupDialog<KkdEmployeeDto>
                variant="ops"
                open={employeeDialogOpen}
                onOpenChange={setEmployeeDialogOpen}
                title={t('kkd.dialogs.selectEmployee')}
                value={currentEmployeeLabel}
                placeholder={t('kkd.operational.remaining.empPlaceholder')}
                queryKey={['kkd', 'remaining-entitlements', 'employees']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
                onSelect={(item) => {
                  setSelectedEmployee(item);
                  setResolvedEmployee(null);
                  setQrCode(item.qrCode);
                  setItems([]);
                }}
              />
            </KkdOpsFormField>

            <KkdOpsFormField label={t('kkd.operational.remaining.dateLabel')} htmlFor="kkd-remaining-date">
              <OpsInput
                id="kkd-remaining-date"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
              />
            </KkdOpsFormField>

            <OpsActionButton
              type="button"
              variant="primary"
              onClick={() => remainingMutation.mutate()}
              disabled={!(resolvedEmployee || selectedEmployee) || remainingMutation.isPending}
            >
              {remainingMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('kkd.operational.remaining.fetch')}
            </OpsActionButton>
          </div>
        </KkdOpsSection>

        <KkdOpsSection title={t('kkd.operational.remaining.listTitle')}>
          <div className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <KkdResultPanel key={item.groupCode}>
                  <div className="flex flex-wrap gap-2">
                    <KkdFlagChip tone="info">{item.groupCode}</KkdFlagChip>
                    {item.groupName ? <KkdFlagChip>{item.groupName}</KkdFlagChip> : null}
                    {item.periodType ? kkdOpsStatusBadge(item.periodType, 'pending') : null}
                    <KkdFlagChip>
                      {t('kkd.operational.remaining.mainShort')}: {item.remainingMainQuantity}
                    </KkdFlagChip>
                    <KkdFlagChip>
                      {t('kkd.operational.remaining.addShort')}: {item.remainingAdditionalQuantity}
                    </KkdFlagChip>
                    <KkdFlagChip tone="success">
                      {t('kkd.operational.remaining.totalShort')}: {item.totalRemainingQuantity}
                    </KkdFlagChip>
                  </div>
                  <p className="mt-3 text-sm">
                    {t('kkd.operational.remaining.lastUse')}:{' '}
                    {item.lastUsageDate ? new Date(item.lastUsageDate).toLocaleString(dateLocale) : '-'} | {t('kkd.operational.remaining.nextOk')}:{' '}
                    {item.nextEligibleDate ? new Date(item.nextEligibleDate).toLocaleDateString(dateLocale) : '-'}
                  </p>
                  {item.message ? <p className="mt-2 text-sm opacity-80">{item.message}</p> : null}
                </KkdResultPanel>
              ))
            ) : (
              <KkdResultPanel>
                <p className="text-center text-sm">{t('kkd.operational.remaining.listEmpty')}</p>
              </KkdResultPanel>
            )}
          </div>
        </KkdOpsSection>
      </div>
    </OpsFormPageShell>
  );
}
