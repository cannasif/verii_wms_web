import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PHeaderDto } from '../../types/package';

interface HeaderSummaryCardProps {
  headerData?: PHeaderDto;
  currentStep: number;
  totalSteps: number;
  onEdit: () => void;
  variant?: 'default' | 'ops';
}

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800';
    case 'Packing':
      return 'bg-blue-100 text-blue-800';
    case 'Packed':
      return 'bg-green-100 text-green-800';
    case 'Shipped':
      return 'bg-purple-100 text-purple-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getOpsStatusClass = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'wms-ops-flag-badge--off';
    case 'Packing':
    case 'Open':
      return 'wms-ops-flag-badge--warn';
    case 'Packed':
    case 'Completed':
      return 'wms-ops-flag-badge--on';
    case 'Cancelled':
      return 'wms-ops-flag-badge--danger';
    default:
      return 'wms-ops-flag-badge--off';
  }
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export function HeaderSummaryCard({
  headerData,
  currentStep,
  totalSteps,
  onEdit,
  variant = 'default',
}: HeaderSummaryCardProps): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const isOps = variant === 'ops';

  if (!headerData) {
    return <></>;
  }

  const metaItems = [
    {
      label: t('package.form.packingDate'),
      value: formatDate(headerData.packingDate),
    },
    headerData.warehouseCode
      ? {
          label: t('package.form.warehouseCode'),
          value: headerData.warehouseCode,
        }
      : null,
    headerData.customerCode
      ? {
          label: t('package.form.customerCode'),
          value: headerData.customerName
            ? `${headerData.customerName} (${headerData.customerCode})`
            : headerData.customerCode,
        }
      : null,
    headerData.trackingNo
      ? {
          label: t('package.form.trackingNo'),
          value: headerData.trackingNo,
        }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <Card className={cn('mb-6', isOps ? 'wms-ops-order-step wms-ops-wizard-summary border-0' : 'border-primary/20 bg-primary/5')}>
      <CardContent className={cn(isOps ? 'px-5 py-4' : 'pt-4')}>
        <div className={cn('flex flex-col gap-4', isOps ? 'md:flex-row md:items-start md:justify-between' : 'crm-toolbar md:flex-row md:items-center md:justify-between')}>
          <div className="flex-1 space-y-3">
            <div className={cn('flex flex-wrap items-center gap-3', isOps && 'wms-ops-wizard-summary__headline')}>
              <h3 className={cn(isOps ? 'wms-ops-detail-dialog__title text-lg' : 'text-xl font-bold')}>
                {isOps ? (
                  <>
                    <span className="wms-ops-detail-dialog__id">{headerData.packingNo}</span>
                  </>
                ) : (
                  headerData.packingNo
                )}
              </h3>
              {isOps ? (
                <span className={cn('wms-ops-flag-badge', getOpsStatusClass(headerData.status))}>
                  {t(`package.status.${headerData.status.toLowerCase()}`, headerData.status)}
                </span>
              ) : (
                <Badge className={getStatusBadgeColor(headerData.status)}>
                  {t(`package.status.${headerData.status.toLowerCase()}`, headerData.status)}
                </Badge>
              )}
              <span className={cn('text-sm', isOps ? 'wms-ops-wizard-summary__step' : 'text-muted-foreground')}>
                {t('package.wizard.stepProgress', {
                  current: currentStep,
                  total: totalSteps,
                })}
              </span>
            </div>
            {metaItems.length > 0 && (
              <div className={cn(isOps ? 'wms-ops-wizard-summary__meta' : 'flex flex-wrap gap-4 text-sm text-muted-foreground')}>
                {metaItems.map((item) => (
                  <div key={item.label} className={isOps ? 'wms-ops-wizard-summary__meta-item' : undefined}>
                    {isOps ? (
                      <>
                        <span className="wms-ops-wizard-summary__meta-label">{item.label}</span>
                        <span className="wms-ops-wizard-summary__meta-value">{item.value}</span>
                      </>
                    ) : (
                      <span>
                        {item.label}: {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {isOps ? (
            <OpsActionButton type="button" variant="secondary" className="h-9 shrink-0 px-3 text-xs" onClick={onEdit}>
              <Edit className="size-4 mr-2" />
              {t('package.wizard.editHeader')}
            </OpsActionButton>
          ) : (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="size-4 mr-2" />
              {t('package.wizard.editHeader')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
