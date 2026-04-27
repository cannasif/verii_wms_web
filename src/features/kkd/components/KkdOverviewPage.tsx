import { type ReactElement, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardList, FileSearch, FolderTree, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';

export function KkdOverviewPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();

  useEffect(() => {
    setPageTitle(t('kkd.operational.overview.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const employeesQuery = useQuery({
    queryKey: ['kkd', 'overview', 'employees'],
    queryFn: () => kkdApi.getEmployees({ pageNumber: 0, pageSize: 1 }),
    retry: false,
  });

  const departmentsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'departments'],
    queryFn: () => kkdApi.getDepartments({ pageNumber: 0, pageSize: 1 }),
    retry: false,
  });

  const rolesQuery = useQuery({
    queryKey: ['kkd', 'overview', 'roles'],
    queryFn: () => kkdApi.getRoles({ pageNumber: 0, pageSize: 1 }),
    retry: false,
  });

  const entitlementsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'entitlements'],
    queryFn: () => kkdApi.getEntitlementMatrixRows({ pageNumber: 0, pageSize: 1 }),
    retry: false,
  });

  const additionalEntitlementsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'additional-entitlements'],
    queryFn: () => kkdApi.getEntitlementOverrides({ pageNumber: 0, pageSize: 1 }),
    retry: false,
  });

  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const summaryCards = [
    { label: t('kkd.operational.overview.summaryEmployee'), value: employeesQuery.data?.totalCount ?? 0 },
    { label: t('kkd.operational.overview.summaryDepartment'), value: departmentsQuery.data?.totalCount ?? 0 },
    { label: t('kkd.operational.overview.summaryRole'), value: rolesQuery.data?.totalCount ?? 0 },
    { label: t('kkd.operational.overview.summaryMatrix'), value: entitlementsQuery.data?.totalCount ?? 0 },
    { label: t('kkd.operational.overview.summaryOverride'), value: additionalEntitlementsQuery.data?.totalCount ?? 0 },
    { label: t('kkd.operational.overview.summaryStockGroup'), value: stockGroupsQuery.data?.length ?? 0 },
  ];

  const quickActions = [
    {
      title: t('kkd.operational.overview.quickDistributionTitle'),
      description: t('kkd.operational.overview.quickDistributionDesc'),
      href: '/kkd/distribution',
      icon: ClipboardList,
    },
    {
      title: t('kkd.operational.overview.quickCheckTitle'),
      description: t('kkd.operational.overview.quickCheckDesc'),
      href: '/kkd/entitlement-check',
      icon: ShieldCheck,
    },
    {
      title: t('kkd.operational.overview.quickListTitle'),
      description: t('kkd.operational.overview.quickListDesc'),
      href: '/kkd/distribution-list',
      icon: FileSearch,
    },
    {
      title: t('kkd.operational.overview.quickDefinitionsTitle'),
      description: t('kkd.operational.overview.quickDefinitionsDesc'),
      href: '/erp/kkd/employees',
      icon: FolderTree,
    },
  ] as const;

  const scenarioSteps = [
    t('kkd.operational.overview.step1'),
    t('kkd.operational.overview.step2'),
    t('kkd.operational.overview.step3'),
    t('kkd.operational.overview.step4'),
    t('kkd.operational.overview.step5'),
    t('kkd.operational.overview.step6'),
  ] as const;

  const governanceCards = [
    {
      title: t('kkd.operational.overview.govOrganizationTitle'),
      description: t('kkd.operational.overview.govOrganizationDesc'),
      href: '/erp/kkd/departments',
      icon: Users,
    },
    {
      title: t('kkd.operational.overview.govMatrixTitle'),
      description: t('kkd.operational.overview.govMatrixDesc'),
      href: '/erp/kkd/entitlement-matrix',
      icon: ShieldCheck,
    },
    {
      title: t('kkd.operational.overview.govOverrideTitle'),
      description: t('kkd.operational.overview.govOverrideDesc'),
      href: '/erp/kkd/manual-overrides',
      icon: FileSearch,
    },
  ] as const;

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.kkdOperationsGroup') }, { label: t('sidebar.kkdOverview'), isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/80 to-emerald-50/80 p-6 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline">{t('kkd.operational.overview.moduleBadge')}</Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{t('kkd.operational.overview.pageTitle')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t('kkd.operational.overview.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/kkd/distribution">{t('kkd.operational.overview.startDistribution')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/kkd/entitlement-check">{t('kkd.operational.overview.checkEntitlement')}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-300">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.overview.actionsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.href}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xs transition hover:border-cyan-300 hover:shadow-sm dark:border-white/10 dark:bg-white/3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-950 dark:text-white">{action.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link to={action.href}>
                        {t('kkd.operational.overview.openScreen')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.overview.flowTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scenarioSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('kkd.operational.overview.definitionsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {governanceCards.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.href}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xs transition hover:border-cyan-300 hover:shadow-sm dark:border-white/10 dark:bg-white/3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950 dark:text-white">{action.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to={action.href}>
                      {t('kkd.operational.overview.openScreen')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
