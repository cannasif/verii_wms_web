import { type ReactElement, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  ClipboardCheck,
  PackageSearch,
  Truck,
  UserCheck,
  Warehouse,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import {
  DashboardOpsActivityFeed,
  DashboardOpsHero,
  DashboardOpsMetricTile,
  DashboardOpsPanel,
  DashboardOpsQuickLink,
  DashboardOpsSection,
  DashboardOpsStatusBar,
} from './dashboard-ops-ui';

interface QuickLinkConfig {
  permission: string;
  moduleCode: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: typeof ClipboardCheck;
}

const QUICK_LINKS: QuickLinkConfig[] = [
  {
    permission: 'wms.goods-receipt.create',
    moduleCode: 'CMD-GR-NEW',
    titleKey: 'dashboard.newGoodsReceipt',
    descriptionKey: 'dashboard.terminal.quickGrDescription',
    href: '/goods-receipt/create',
    icon: ClipboardCheck,
  },
  {
    permission: 'wms.goods-receipt.view',
    moduleCode: 'CMD-GR-ASN',
    titleKey: 'dashboard.terminal.assignedGoodsReceipt',
    descriptionKey: 'dashboard.terminal.quickAssignedDescription',
    href: '/goods-receipt/assigned',
    icon: UserCheck,
  },
  {
    permission: 'wms.shipment.create',
    moduleCode: 'CMD-SH-NEW',
    titleKey: 'dashboard.newShipment',
    descriptionKey: 'dashboard.terminal.quickShipmentDescription',
    href: '/shipment/create',
    icon: Truck,
  },
  {
    permission: 'wms.transfer.view',
    moduleCode: 'CMD-TR-LST',
    titleKey: 'dashboard.terminal.transferList',
    descriptionKey: 'dashboard.terminal.quickTransferDescription',
    href: '/transfer/list',
    icon: ArrowLeftRight,
  },
  {
    permission: 'wms.warehouse-balance.view',
    moduleCode: 'CMD-STK-QRY',
    titleKey: 'dashboard.stockQuery',
    descriptionKey: 'dashboard.terminal.quickStockDescription',
    href: '/erp/warehouse-stock-balance',
    icon: Warehouse,
  },
  {
    permission: 'wms.reports.view',
    moduleCode: 'CMD-RPT-HUB',
    titleKey: 'dashboard.terminal.reportsHub',
    descriptionKey: 'dashboard.terminal.quickReportsDescription',
    href: '/reports',
    icon: PackageSearch,
  },
];

function formatRelativeTimestamp(value: string, language: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (diffMinutes < 60) {
    return t('dashboard.terminal.minutesAgo', { defaultValue: '{{minutes}} dk önce', minutes: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 48) {
    return t('dashboard.hoursAgo', { hours: diffHours });
  }

  return date.toLocaleString(language);
}

export function DashboardPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const { user, branch, metrics, isLoading } = useDashboardMetrics();

  useEffect(() => {
    setPageTitle(t('dashboard.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const displayName = user?.name || user?.email || t('dashboard.user');
  const branchLabel = branch?.name || branch?.code || t('dashboard.terminal.branchFallback');

  const visibleQuickLinks = useMemo(
    () => QUICK_LINKS.filter((link) => permissionAccess.can(link.permission)),
    [permissionAccess],
  );

  return (
    <div className="wms-ops-dashboard-page wms-ops-erp-skin">
      <div className="wms-ops-dashboard-terminal">
        <div className="wms-ops-dashboard-terminal__scanlines" aria-hidden />

        <DashboardOpsHero
          eyebrow={t('dashboard.terminal.eyebrow', { defaultValue: 'WMS / KOMUT MERKEZİ' })}
          title={t('dashboard.terminal.welcome', { defaultValue: 'Hoş geldin, {{name}}', name: displayName })}
          subtitle={t('dashboard.subtitle')}
          operatorLabel={t('dashboard.terminal.operator', { defaultValue: 'OPERATÖR' })}
          operatorValue={displayName}
          branchLabel={t('dashboard.terminal.branch', { defaultValue: 'ŞUBE' })}
          branchValue={branchLabel}
        />

        <DashboardOpsPanel>
          <DashboardOpsStatusBar
            pulseLabel={t('dashboard.terminal.systemPulse', { defaultValue: 'SİSTEM DURUMU' })}
            pulseValue={isLoading ? t('dashboard.terminal.syncing', { defaultValue: 'SENKRONİZE' }) : t('dashboard.terminal.online', { defaultValue: 'ÇEVRİMİÇİ' })}
            tasksLabel={t('dashboard.terminal.myTasks', { defaultValue: 'GÖREVLERİM' })}
            tasksValue={String(metrics.myTasksCount).padStart(2, '0')}
            hint={t('dashboard.terminal.statusHint', { defaultValue: 'Canlı operasyon metrikleri ve son hareketler aşağıda.' })}
          />
        </DashboardOpsPanel>

        <DashboardOpsPanel className="wms-ops-dashboard-panel--metrics">
          <div className="wms-ops-dashboard-panel__heading">
            <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
            <span>{t('dashboard.terminal.metricsPanel', { defaultValue: 'OPERASYON METRİKLERİ' })}</span>
          </div>
          <div className="wms-ops-dashboard-metrics">
          <DashboardOpsMetricTile
            label={t('dashboard.terminal.stockSkuCount', { defaultValue: 'Stok Kalemi' })}
            value={metrics.stockSkuCount.toLocaleString(i18n.language)}
            hint={t('dashboard.terminal.stockSkuHint', { defaultValue: 'Depo bakiye kayıtları' })}
            tone="accent"
            isLoading={isLoading}
          />
          <DashboardOpsMetricTile
            label={t('dashboard.goodsReceipt')}
            value={metrics.goodsReceiptCount.toLocaleString(i18n.language)}
            hint={t('dashboard.terminal.openGoodsReceiptHint', { defaultValue: 'Toplam mal kabul emri' })}
            isLoading={isLoading}
          />
          <DashboardOpsMetricTile
            label={t('dashboard.shipment')}
            value={metrics.shipmentCount.toLocaleString(i18n.language)}
            hint={t('dashboard.terminal.openShipmentHint', { defaultValue: 'Toplam sevkiyat emri' })}
            isLoading={isLoading}
          />
          <DashboardOpsMetricTile
            label={t('dashboard.terminal.pendingApproval', { defaultValue: 'Onay Bekleyen' })}
            value={metrics.pendingApprovalCount.toLocaleString(i18n.language)}
            hint={t('dashboard.terminal.pendingApprovalHint', { defaultValue: 'Mal kabul onay kuyruğu' })}
            tone="warn"
            isLoading={isLoading}
          />
          <DashboardOpsMetricTile
            label={t('dashboard.terminal.myAssignments', { defaultValue: 'Bana Atanan' })}
            value={metrics.myTasksCount.toLocaleString(i18n.language)}
            hint={t('dashboard.terminal.myAssignmentsHint', { defaultValue: 'Mal kabul + sevkiyat görevleri' })}
            tone="success"
            isLoading={isLoading}
          />
          <DashboardOpsMetricTile
            label={t('dashboard.terminal.transferCount', { defaultValue: 'Transfer' })}
            value={metrics.transferCount.toLocaleString(i18n.language)}
            hint={t('dashboard.terminal.transferHint', { defaultValue: 'Aktif transfer emirleri' })}
            isLoading={isLoading}
          />
          </div>
        </DashboardOpsPanel>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
          <DashboardOpsSection
            title={t('dashboard.recentTransactions')}
            description={t('dashboard.recentTransactionsSubtitle')}
            sectionCode="FEED-OPS"
          >
            <DashboardOpsActivityFeed
              items={metrics.activityItems}
              emptyText={t('dashboard.terminal.activityEmpty', { defaultValue: 'Henüz görüntülenecek hareket yok.' })}
              kindLabels={{
                'goods-receipt': t('dashboard.goodsReceipt'),
                shipment: t('dashboard.shipment'),
              }}
              statusLabels={{
                completed: t('dashboard.completed'),
                preparing: t('dashboard.preparing'),
                pending: t('dashboard.terminal.pending', { defaultValue: 'Bekliyor' }),
              }}
              formatTimestamp={(value) => formatRelativeTimestamp(value, i18n.language, t)}
            />
          </DashboardOpsSection>

          <DashboardOpsSection
            title={t('dashboard.quickAccess')}
            description={t('dashboard.quickAccessSubtitle')}
            sectionCode="CMD-QUICK"
          >
            <div className="wms-ops-dashboard-quick-grid">
              {visibleQuickLinks.length === 0 ? (
                <p className="wms-ops-dashboard-activity__empty">
                  {t('dashboard.terminal.quickLinksEmpty', { defaultValue: 'Bu kullanıcı için hızlı komut bulunamadı.' })}
                </p>
              ) : visibleQuickLinks.map((link, index) => (
                <DashboardOpsQuickLink
                  key={link.href}
                  index={index + 1}
                  moduleCode={link.moduleCode}
                  title={t(link.titleKey)}
                  description={t(link.descriptionKey, { defaultValue: link.titleKey })}
                  href={link.href}
                  icon={link.icon}
                  openLabel={t('dashboard.terminal.launch', { defaultValue: 'Başlat' })}
                />
              ))}
            </div>
          </DashboardOpsSection>
        </div>
      </div>
    </div>
  );
}
