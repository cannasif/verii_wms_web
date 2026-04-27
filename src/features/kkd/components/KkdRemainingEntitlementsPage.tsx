import { type ReactElement, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { useTranslation } from 'react-i18next';
import { getLocaleForFormatting } from '@/lib/i18n';
import { useUIStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import { kkdApi } from '../api/kkd.api';
import type { KkdEmployeeDto, KkdRemainingEntitlementDto, KkdResolvedEmployeeDto } from '../types/kkd.types';

export function KkdRemainingEntitlementsPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
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
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.operationsGroup') },
          { label: t('kkd.operational.remaining.breadcrumb'), isActive: true },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.remaining.cardInput')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="kkd-remaining-qr">{t('kkd.operational.remaining.qrLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="kkd-remaining-qr"
                  value={qrCode}
                  onChange={(event) => setQrCode(event.target.value)}
                  placeholder={t('kkd.operational.remaining.qrPlaceholder')}
                />
                <Button type="button" onClick={() => resolveQrMutation.mutate({ qrCode })} disabled={!qrCode.trim() || resolveQrMutation.isPending}>
                  {t('kkd.operational.remaining.resolve')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('kkd.operational.remaining.altEmployee')}</Label>
              <PagedLookupDialog<KkdEmployeeDto>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="kkd-remaining-date">{t('kkd.operational.remaining.dateLabel')}</Label>
              <Input id="kkd-remaining-date" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
            </div>

            <Button type="button" onClick={() => remainingMutation.mutate()} disabled={!(resolvedEmployee || selectedEmployee) || remainingMutation.isPending}>
              {t('kkd.operational.remaining.fetch')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.remaining.listTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <div key={item.groupCode} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.groupCode}</Badge>
                    {item.groupName ? <Badge variant="secondary">{item.groupName}</Badge> : null}
                    {item.periodType ? <Badge variant="outline">{item.periodType}</Badge> : null}
                    <Badge variant="outline">
                      {t('kkd.operational.remaining.mainShort')}: {item.remainingMainQuantity}
                    </Badge>
                    <Badge variant="outline">
                      {t('kkd.operational.remaining.addShort')}: {item.remainingAdditionalQuantity}
                    </Badge>
                    <Badge variant="secondary">
                      {t('kkd.operational.remaining.totalShort')}: {item.totalRemainingQuantity}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {t('kkd.operational.remaining.lastUse')}:{' '}
                    {item.lastUsageDate ? new Date(item.lastUsageDate).toLocaleString(dateLocale) : '-'} | {t('kkd.operational.remaining.nextOk')}:{' '}
                    {item.nextEligibleDate ? new Date(item.nextEligibleDate).toLocaleDateString(dateLocale) : '-'}
                  </p>
                  {item.message ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.message}</p> : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('kkd.operational.remaining.listEmpty')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
