import { type ReactElement, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  Route,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/stores/ui-store';

interface ReportCard {
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: typeof BarChart3;
  badgeKey: string;
}

const operationalCards: ReportCard[] = [
  {
    titleKey: 'cards.stockBalance.title',
    descriptionKey: 'cards.stockBalance.description',
    href: '/erp/warehouse-stock-balance',
    icon: Warehouse,
    badgeKey: 'badges.inventory',
  },
  {
    titleKey: 'cards.serialBalance.title',
    descriptionKey: 'cards.serialBalance.description',
    href: '/erp/warehouse-serial-balance',
    icon: Search,
    badgeKey: 'badges.traceability',
  },
  {
    titleKey: 'cards.packageStation.title',
    descriptionKey: 'cards.packageStation.description',
    href: '/package/station',
    icon: PackageCheck,
    badgeKey: 'badges.packaging',
  },
  {
    titleKey: 'cards.packageSettings.title',
    descriptionKey: 'cards.packageSettings.description',
    href: '/package/settings',
    icon: Boxes,
    badgeKey: 'badges.configuration',
  },
  {
    titleKey: 'cards.shipmentApproval.title',
    descriptionKey: 'cards.shipmentApproval.description',
    href: '/shipment/approval',
    icon: Truck,
    badgeKey: 'badges.erpApproval',
  },
  {
    titleKey: 'cards.shipmentLoading.title',
    descriptionKey: 'cards.shipmentLoading.description',
    href: '/shipment/loading',
    icon: Truck,
    badgeKey: 'badges.loading',
  },
  {
    titleKey: 'cards.transferChains.title',
    descriptionKey: 'cards.transferChains.description',
    href: '/transfer/chains',
    icon: Route,
    badgeKey: 'badges.chain',
  },
  {
    titleKey: 'cards.traceExplorer.title',
    descriptionKey: 'cards.traceExplorer.description',
    href: '/trace-explorer',
    icon: Activity,
    badgeKey: 'badges.support',
  },
  {
    titleKey: 'cards.qualityQueue.title',
    descriptionKey: 'cards.qualityQueue.description',
    href: '/quality-control/quarantine',
    icon: AlertTriangle,
    badgeKey: 'badges.quality',
  },
];

const workflowCards: ReportCard[] = [
  {
    titleKey: 'workflows.goodsReceipt.title',
    descriptionKey: 'workflows.goodsReceipt.description',
    href: '/goods-receipt/list',
    icon: ClipboardCheck,
    badgeKey: 'badges.workflow',
  },
  {
    titleKey: 'workflows.transfer.title',
    descriptionKey: 'workflows.transfer.description',
    href: '/transfer/list',
    icon: Route,
    badgeKey: 'badges.workflow',
  },
  {
    titleKey: 'workflows.shipment.title',
    descriptionKey: 'workflows.shipment.description',
    href: '/shipment/list',
    icon: Truck,
    badgeKey: 'badges.workflow',
  },
  {
    titleKey: 'workflows.package.title',
    descriptionKey: 'workflows.package.description',
    href: '/package/list',
    icon: PackageCheck,
    badgeKey: 'badges.workflow',
  },
];

function ReportLinkCard({ card }: { card: ReportCard }): ReactElement {
  const { t } = useTranslation(['report', 'common']);
  const Icon = card.icon;

  return (
    <Link
      to={card.href}
      className="group block rounded-3xl border border-slate-200 bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700 transition-colors group-hover:bg-cyan-100">
              <Icon className="size-6" />
            </div>
            <Badge variant="secondary" className="rounded-full">
              {t(card.badgeKey)}
            </Badge>
          </div>
          <div>
            <CardTitle className="text-base font-black text-slate-950">{t(card.titleKey)}</CardTitle>
            <CardDescription className="mt-2 leading-6 text-slate-500">
              {t(card.descriptionKey)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700">
            {t('open')}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ReportsPage(): ReactElement {
  const { t } = useTranslation(['report', 'common']);
  const { setPageTitle } = useUIStore();

  useEffect(() => {
    setPageTitle(t('hero.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  return (
    <div className="space-y-8 crm-page">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm md:p-8">
        <div className="max-w-3xl">
          <Badge className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-400">
            {t('hero.eyebrow')}
          </Badge>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">{t('hero.title')}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
            {t('hero.description')}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">{t('sections.operationalVisibility')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('sections.operationalVisibilityDescription')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {operationalCards.map((card) => (
            <ReportLinkCard key={card.href} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">{t('sections.workflowAudit')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('sections.workflowAuditDescription')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowCards.map((card) => (
            <ReportLinkCard key={card.href} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
}
