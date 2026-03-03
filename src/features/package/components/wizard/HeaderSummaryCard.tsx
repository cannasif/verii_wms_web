import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import type { PHeaderDto } from '../../types/package';

interface HeaderSummaryCardProps {
  headerData?: PHeaderDto;
  currentStep: number;
  totalSteps: number;
  onEdit: () => void;
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
}: HeaderSummaryCardProps): ReactElement {
  const { t } = useTranslation();

  if (!headerData) {
    return <></>;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold">{headerData.packingNo}</h3>
              <Badge className={getStatusBadgeColor(headerData.status)}>
                {t(`package.status.${headerData.status.toLowerCase()}`, headerData.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t('package.wizard.stepProgress', {
                  current: currentStep,
                  total: totalSteps,
                })}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                📅 {t('package.form.packingDate')}: {formatDate(headerData.packingDate)}
              </span>
              {headerData.warehouseCode && (
                <span>
                  🏢 {t('package.form.warehouseCode')}: {headerData.warehouseCode}
                </span>
              )}
              {headerData.customerCode && (
                <span>
                  👤 {t('package.form.customerCode')}: {headerData.customerCode}
                  {headerData.customerName && ` - ${headerData.customerName}`}
                </span>
              )}
              {headerData.trackingNo && (
                <span>
                  📦 {t('package.form.trackingNo')}: {headerData.trackingNo}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="size-4 mr-2" />
            {t('package.wizard.editHeader')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

