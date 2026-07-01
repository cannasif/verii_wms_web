import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  Route,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import { OpsListPageShell } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import {
  ReportsOpsModuleCard,
  ReportsOpsSection,
  ReportsOpsStatusBar,
} from './report-ops-ui';

interface ReportCard {
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: typeof BarChart3;
  badgeKey: string;
  moduleCode: string;
}

const operationalCards: ReportCard[] = [
  {
    titleKey: 'cards.stockBalance.title',
    descriptionKey: 'cards.stockBalance.description',
    href: '/erp/warehouse-stock-balance',
    icon: Warehouse,
    badgeKey: 'badges.inventory',
    moduleCode: 'INV-STK-BAL',
  },
  {
    titleKey: 'cards.serialBalance.title',
    descriptionKey: 'cards.serialBalance.description',
    href: '/erp/warehouse-serial-balance',
    icon: Search,
    badgeKey: 'badges.traceability',
    moduleCode: 'INV-SRL-BAL',
  },
  {
    titleKey: 'cards.packageStation.title',
    descriptionKey: 'cards.packageStation.description',
    href: '/package/station',
    icon: PackageCheck,
    badgeKey: 'badges.packaging',
    moduleCode: 'PKG-STATION',
  },
  {
    titleKey: 'cards.packageSettings.title',
    descriptionKey: 'cards.packageSettings.description',
    href: '/package/settings',
    icon: Boxes,
    badgeKey: 'badges.configuration',
    moduleCode: 'PKG-CFG',
  },
  {
    titleKey: 'cards.shipmentApproval.title',
    descriptionKey: 'cards.shipmentApproval.description',
    href: '/shipment/approval',
    icon: Truck,
    badgeKey: 'badges.erpApproval',
    moduleCode: 'SHP-ERP-APR',
  },
  {
    titleKey: 'cards.shipmentLoading.title',
    descriptionKey: 'cards.shipmentLoading.description',
    href: '/shipment/loading',
    icon: Truck,
    badgeKey: 'badges.loading',
    moduleCode: 'SHP-LOAD',
  },
  {
    titleKey: 'cards.transferChains.title',
    descriptionKey: 'cards.transferChains.description',
    href: '/transfer/chains',
    icon: Route,
    badgeKey: 'badges.chain',
    moduleCode: 'TRF-CHAIN',
  },
  {
    titleKey: 'cards.traceExplorer.title',
    descriptionKey: 'cards.traceExplorer.description',
    href: '/trace-explorer',
    icon: Activity,
    badgeKey: 'badges.support',
    moduleCode: 'SUP-TRACE',
  },
  {
    titleKey: 'cards.qualityQueue.title',
    descriptionKey: 'cards.qualityQueue.description',
    href: '/quality-control/quarantine',
    icon: AlertTriangle,
    badgeKey: 'badges.quality',
    moduleCode: 'QC-QUAR',
  },
];

const workflowCards: ReportCard[] = [
  {
    titleKey: 'workflows.goodsReceipt.title',
    descriptionKey: 'workflows.goodsReceipt.description',
    href: '/goods-receipt/list',
    icon: ClipboardCheck,
    badgeKey: 'badges.workflow',
    moduleCode: 'WF-GR-LIST',
  },
  {
    titleKey: 'workflows.transfer.title',
    descriptionKey: 'workflows.transfer.description',
    href: '/transfer/list',
    icon: Route,
    badgeKey: 'badges.workflow',
    moduleCode: 'WF-TR-LIST',
  },
  {
    titleKey: 'workflows.shipment.title',
    descriptionKey: 'workflows.shipment.description',
    href: '/shipment/list',
    icon: Truck,
    badgeKey: 'badges.workflow',
    moduleCode: 'WF-SH-LIST',
  },
  {
    titleKey: 'workflows.package.title',
    descriptionKey: 'workflows.package.description',
    href: '/package/list',
    icon: PackageCheck,
    badgeKey: 'badges.workflow',
    moduleCode: 'WF-PK-LIST',
  },
];

export function ReportsPage(): ReactElement {
  const { t } = useTranslation(['report', 'common']);
  const { setPageTitle } = useUIStore();
  const allCards = [...operationalCards, ...workflowCards];

  useEffect(() => {
    setPageTitle(t('hero.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  return (
    <OpsListPageShell
      className="wms-ops-erp-skin wms-ops-reports-page"
      eyebrow={t('hero.eyebrow')}
      title={t('hero.title')}
      description={t('hero.description')}
    >
      <div className="wms-ops-reports-terminal">
        <div className="wms-ops-reports-terminal__scanlines" aria-hidden />

        <ReportsOpsStatusBar
          moduleCount={allCards.length}
          modulesLabel={t('terminal.modules')}
          statusLabel={t('terminal.statusReady')}
          hint={t('terminal.selectHint')}
        />

        <ReportsOpsSection
          title={t('sections.operationalVisibility')}
          description={t('sections.operationalVisibilityDescription')}
          sectionCode="SEC-OPS"
        >
          {operationalCards.map((card, index) => (
            <ReportsOpsModuleCard
              key={card.href}
              index={index + 1}
              moduleCode={card.moduleCode}
              title={t(card.titleKey)}
              description={t(card.descriptionKey)}
              badge={t(card.badgeKey)}
              href={card.href}
              icon={card.icon}
              openLabel={t('open')}
              routePrefix={t('terminal.routePrefix')}
            />
          ))}
        </ReportsOpsSection>

        <ReportsOpsSection
          title={t('sections.workflowAudit')}
          description={t('sections.workflowAuditDescription')}
          sectionCode="SEC-WF"
        >
          {workflowCards.map((card, index) => (
            <ReportsOpsModuleCard
              key={card.href}
              index={operationalCards.length + index + 1}
              moduleCode={card.moduleCode}
              title={t(card.titleKey)}
              description={t(card.descriptionKey)}
              badge={t(card.badgeKey)}
              href={card.href}
              icon={card.icon}
              openLabel={t('open')}
              routePrefix={t('terminal.routePrefix')}
            />
          ))}
        </ReportsOpsSection>
      </div>
    </OpsListPageShell>
  );
}
