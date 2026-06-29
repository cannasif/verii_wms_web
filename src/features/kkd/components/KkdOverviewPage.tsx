import { type ReactElement, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  ClipboardList,
  FileSearch,
  FolderTree,
  Grid3x3,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import {
  KkdFlagChip,
  KkdMetricGrid,
  KkdOpsSection,
  KkdQuickLinkCard,
  KkdStepItem,
  KkdSummaryMetric,
} from './kkd-ops-ui';

export function KkdOverviewPage(): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();

  useEffect(() => {
    setPageTitle(t('kkd.operational.overview.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const employeesQuery = useQuery({
    queryKey: ['kkd', 'overview', 'employees'],
    queryFn: () => kkdApi.getEmployees({ pageNumber: 1, pageSize: 1 }),
    retry: false,
  });

  const departmentsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'departments'],
    queryFn: () => kkdApi.getDepartments({ pageNumber: 1, pageSize: 1 }),
    retry: false,
  });

  const rolesQuery = useQuery({
    queryKey: ['kkd', 'overview', 'roles'],
    queryFn: () => kkdApi.getRoles({ pageNumber: 1, pageSize: 1 }),
    retry: false,
  });

  const entitlementsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'entitlements'],
    queryFn: () => kkdApi.getEntitlementMatrixRows({ pageNumber: 1, pageSize: 1 }),
    retry: false,
  });

  const additionalEntitlementsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'additional-entitlements'],
    queryFn: () => kkdApi.getEntitlementOverrides({ pageNumber: 1, pageSize: 1 }),
    retry: false,
  });

  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'overview', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const summaryCards = [
    { label: t('kkd.operational.overview.summaryEmployee'), value: employeesQuery.data?.totalCount ?? 0, icon: <Users className="size-4" /> },
    { label: t('kkd.operational.overview.summaryDepartment'), value: departmentsQuery.data?.totalCount ?? 0, icon: <Users className="size-4" /> },
    { label: t('kkd.operational.overview.summaryRole'), value: rolesQuery.data?.totalCount ?? 0, icon: <UserCog className="size-4" /> },
    { label: t('kkd.operational.overview.summaryMatrix'), value: entitlementsQuery.data?.totalCount ?? 0, icon: <Grid3x3 className="size-4" /> },
    { label: t('kkd.operational.overview.summaryOverride'), value: additionalEntitlementsQuery.data?.totalCount ?? 0, icon: <FileSearch className="size-4" /> },
    { label: t('kkd.operational.overview.summaryStockGroup'), value: stockGroupsQuery.data?.length ?? 0, icon: <Boxes className="size-4" /> },
  ];

  const quickActions = [
    {
      title: t('kkd.operational.overview.quickDistributionTitle'),
      description: t('kkd.operational.overview.quickDistributionDesc'),
      href: '/kkd/distribution',
      icon: <ClipboardList className="size-4" />,
    },
    {
      title: t('kkd.operational.overview.quickCheckTitle'),
      description: t('kkd.operational.overview.quickCheckDesc'),
      href: '/kkd/entitlement-check',
      icon: <ShieldCheck className="size-4" />,
    },
    {
      title: t('kkd.operational.overview.quickListTitle'),
      description: t('kkd.operational.overview.quickListDesc'),
      href: '/kkd/distribution-list',
      icon: <FileSearch className="size-4" />,
    },
    {
      title: t('kkd.operational.overview.quickDefinitionsTitle'),
      description: t('kkd.operational.overview.quickDefinitionsDesc'),
      href: '/erp/kkd/employees',
      icon: <FolderTree className="size-4" />,
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
      icon: <Users className="size-4" />,
    },
    {
      title: t('kkd.operational.overview.govMatrixTitle'),
      description: t('kkd.operational.overview.govMatrixDesc'),
      href: '/erp/kkd/entitlement-matrix',
      icon: <ShieldCheck className="size-4" />,
    },
    {
      title: t('kkd.operational.overview.govOverrideTitle'),
      description: t('kkd.operational.overview.govOverrideDesc'),
      href: '/erp/kkd/manual-overrides',
      icon: <FileSearch className="size-4" />,
    },
  ] as const;

  return (
    <OpsListPageShell
      className="wms-ops-kkd-page"
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.overview.pageTitle')}
      description={t('kkd.operational.overview.subtitle')}
      actions={
        <div className="flex flex-wrap gap-2">
          <OpsActionButton asChild variant="primary">
            <Link to="/kkd/distribution">{t('kkd.operational.overview.startDistribution')}</Link>
          </OpsActionButton>
          <OpsActionButton asChild variant="secondary">
            <Link to="/kkd/entitlement-check">{t('kkd.operational.overview.checkEntitlement')}</Link>
          </OpsActionButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="wms-ops-panel overflow-hidden rounded-2xl border p-6">
          <KkdFlagChip tone="info">{t('kkd.operational.overview.moduleBadge')}</KkdFlagChip>
        </div>

        <KkdMetricGrid>
          {summaryCards.map((card) => (
            <KkdSummaryMetric key={card.label} icon={card.icon} label={card.label} value={card.value} />
          ))}
        </KkdMetricGrid>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <KkdOpsSection title={t('kkd.operational.overview.actionsTitle')}>
            <div className="wms-ops-kkd-overview-grid wms-ops-kkd-overview-grid--links">
              {quickActions.map((action) => (
                <KkdQuickLinkCard
                  key={action.href}
                  title={action.title}
                  description={action.description}
                  href={action.href}
                  icon={action.icon}
                  linkLabel={t('kkd.operational.overview.openScreen')}
                />
              ))}
            </div>
          </KkdOpsSection>

          <KkdOpsSection title={t('kkd.operational.overview.flowTitle')}>
            <div className="space-y-3">
              {scenarioSteps.map((step, index) => (
                <KkdStepItem key={step} index={index}>
                  {step}
                </KkdStepItem>
              ))}
            </div>
          </KkdOpsSection>
        </div>

        <KkdOpsSection title={t('kkd.operational.overview.definitionsTitle')}>
          <div className="wms-ops-kkd-overview-grid wms-ops-kkd-overview-grid--links">
            {governanceCards.map((action) => (
              <KkdQuickLinkCard
                key={action.href}
                title={action.title}
                description={action.description}
                href={action.href}
                icon={action.icon}
                linkLabel={t('kkd.operational.overview.openScreen')}
              />
            ))}
          </div>
        </KkdOpsSection>
      </div>
    </OpsListPageShell>
  );
}
