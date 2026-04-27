import { type ReactElement, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormPageShell } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { vehicleCheckInApi } from '../api/vehicle-check-in.api';

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('tr-TR');
}

export function VehicleCheckInListPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPageTitle(t('vehicleCheckIn.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['vehicle-check-in', 'list', search],
    queryFn: () => vehicleCheckInApi.getPaged({ pageNumber: 1, pageSize: 50, search }),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('vehicleCheckIn.badge')}</Badge>

      <FormPageShell title={t('vehicleCheckIn.list.title')} description={t('vehicleCheckIn.list.description')}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('vehicleCheckIn.list.searchPh')}
              className="min-w-[260px] flex-1"
            />
            <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>
              {t('common.search')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void query.refetch()}>
              {t('common.refresh')}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[980px] text-sm">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.plate')}</th>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.entryDate')}</th>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.firstName')}</th>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.lastName')}</th>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.customer')}</th>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.images')}</th>
                  <th className="px-3 py-2">{t('vehicleCheckIn.list.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="px-3 py-2 font-medium">{row.plateNo}</td>
                    <td className="px-3 py-2">{formatDateTime(row.entryDate)}</td>
                    <td className="px-3 py-2">{row.firstName || '-'}</td>
                    <td className="px-3 py-2">{row.lastName || '-'}</td>
                    <td className="px-3 py-2">{[row.customerCode, row.customerName].filter(Boolean).join(' - ') || '-'}</td>
                    <td className="px-3 py-2">{row.imageCount}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/vehicle-check-in?id=${row.id}`)}>
                        {t('vehicleCheckIn.list.actions.open')}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!query.isLoading && rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-400" colSpan={7}>
                      {t('vehicleCheckIn.list.empty')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
