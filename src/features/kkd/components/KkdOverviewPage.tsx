import { type ReactElement, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardList, FileSearch, FolderTree, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';

const quickActions = [
  {
    title: 'KKD Dağıtım',
    description: 'Çalışanı seç, ürün okut, belgeyi tamamla.',
    href: '/kkd/distribution',
    icon: ClipboardList,
  },
  {
    title: 'Hak Sorgulama',
    description: 'Çalışanın hakkı var mı hızlıca kontrol et.',
    href: '/kkd/entitlement-check',
    icon: ShieldCheck,
  },
  {
    title: 'Dağıtım Listesi',
    description: 'Oluşan belgeleri listele ve incele.',
    href: '/kkd/distribution-list',
    icon: FileSearch,
  },
  {
    title: 'Tanımlar',
    description: 'Bölüm, görev ve çalışan kartlarını yönet.',
    href: '/erp/kkd/employees',
    icon: FolderTree,
  },
] as const;

const scenarioSteps = [
  'Bölüm ve görev tanımlanır.',
  'Çalışan kartı açılır.',
  'Görev matrisi tanımlanır.',
  'Gerekirse manuel istisna verilir.',
  'Dağıtım yapılır.',
  'Belge ve kalan hak izlenir.',
] as const;

const governanceCards = [
  {
    title: 'Organizasyon',
    description: 'Bölüm, görev ve çalışan kartları.',
    href: '/erp/kkd/departments',
    icon: Users,
  },
  {
    title: 'Görev Matrisi',
    description: 'Bölüm ve görev için hak kuralları.',
    href: '/erp/kkd/entitlement-matrix',
    icon: ShieldCheck,
  },
  {
    title: 'Manuel İstisnalar',
    description: 'İstisnai çalışan ihtiyaçları için ek hak.',
    href: '/erp/kkd/manual-overrides',
    icon: FileSearch,
  },
] as const;

export function KkdOverviewPage(): ReactElement {
  const { setPageTitle } = useUIStore();

  useEffect(() => {
    setPageTitle('KKD Operasyon Merkezi');
    return () => setPageTitle(null);
  }, [setPageTitle]);

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
    { label: 'Çalışan', value: employeesQuery.data?.totalCount ?? 0 },
    { label: 'Bölüm', value: departmentsQuery.data?.totalCount ?? 0 },
    { label: 'Görev', value: rolesQuery.data?.totalCount ?? 0 },
    { label: 'Görev Matrisi', value: entitlementsQuery.data?.totalCount ?? 0 },
    { label: 'İstisna', value: additionalEntitlementsQuery.data?.totalCount ?? 0 },
    { label: 'Stok Grubu', value: stockGroupsQuery.data?.length ?? 0 },
  ];

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'KKD', isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/80 to-emerald-50/80 p-6 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline">KKD Modulu</Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">KKD Operasyon Merkezi</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">KKD işlemlerini tek yerden yönetin.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/kkd/distribution">Dağıtıma Başla</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/kkd/entitlement-check">Hak Sorgula</Link>
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
            <CardTitle>İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.href}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xs transition hover:border-cyan-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
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
                        Ekranı Aç
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
            <CardTitle>Akış</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scenarioSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
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
          <CardTitle>Tanımlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {governanceCards.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.href}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xs transition hover:border-cyan-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
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
                      Ekranı Aç
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
