import type { ReactElement } from 'react';
import { OpsActionButton } from '@/components/shared';
import type { TFunction } from 'i18next';
import { localizeStatus } from '@/lib/localize-status';
import type { KkdOrderHeaderDto } from '../../types/kkd.types';
import type { LocalOrderLine } from './shared';
import {
  KkdFlagChip,
  KkdOpsSection,
  KkdResultPanel,
  kkdOpsStatusBadge,
} from '../kkd-ops-ui';

interface KkdInitialOrderCartSectionProps {
  t: TFunction<'common'>;
  cartLines: LocalOrderLine[];
  onRemoveLine: (clientId: string) => void;
  onSubmit: () => void;
  onClearCart: () => void;
  submitDisabled: boolean;
  clearDisabled: boolean;
  submittedHeader: KkdOrderHeaderDto | null;
}

export function KkdInitialOrderCartSection({
  t,
  cartLines,
  onRemoveLine,
  onSubmit,
  onClearCart,
  submitDisabled,
  clearDisabled,
  submittedHeader,
}: KkdInitialOrderCartSectionProps): ReactElement {
  return (
    <KkdOpsSection title={t('kkd.operational.initialOrder.cardOrder')}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <KkdFlagChip tone="info">
            {t('kkd.operational.initialOrder.lineCount')}: {cartLines.length}
          </KkdFlagChip>
          <KkdFlagChip tone="info">
            {t('kkd.operational.initialOrder.totalQty')}: {cartLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)}
          </KkdFlagChip>
        </div>

        <div className="space-y-3">
          {cartLines.length === 0 ? (
            <KkdResultPanel>
              <p className="text-sm opacity-80">{t('kkd.operational.initialOrder.noLines')}</p>
            </KkdResultPanel>
          ) : cartLines.map((line) => (
            <KkdResultPanel key={line.clientId}>
              <div className="flex flex-wrap gap-2">
                <KkdFlagChip>{line.groupCode}</KkdFlagChip>
                <KkdFlagChip tone="info">{line.stockCode}</KkdFlagChip>
                <KkdFlagChip tone="default">
                  {t('common.quantity')}: {line.quantity}
                </KkdFlagChip>
              </div>
              <p className="mt-2 font-medium">{line.stockName}</p>
              <div className="mt-3 flex justify-end">
                <OpsActionButton type="button" variant="secondary" onClick={() => onRemoveLine(line.clientId)}>
                  {t('kkd.operational.initialOrder.remove')}
                </OpsActionButton>
              </div>
            </KkdResultPanel>
          ))}
        </div>

        <div className="flex gap-3">
          <OpsActionButton type="button" onClick={onSubmit} disabled={submitDisabled}>
            {t('kkd.operational.initialOrder.save')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="secondary" onClick={onClearCart} disabled={clearDisabled}>
            {t('kkd.operational.initialOrder.clearCart')}
          </OpsActionButton>
        </div>

        {submittedHeader ? (
          <KkdResultPanel tone="success">
            <div className="flex flex-wrap gap-2">
              <KkdFlagChip>
                {t('kkd.operational.initialOrder.headerPrefix')} #{submittedHeader.id}
              </KkdFlagChip>
              {kkdOpsStatusBadge(localizeStatus(submittedHeader.status, t), 'done')}
            </div>
            <p className="mt-2 text-sm">
              {t('kkd.operational.initialOrder.documentNo')}: {submittedHeader.documentNo || '-'}
            </p>
            <p className="mt-1 text-sm">
              {t('kkd.operational.initialOrder.lineCountN')}: {submittedHeader.lines.length}
            </p>
          </KkdResultPanel>
        ) : null}
      </div>
    </KkdOpsSection>
  );
}
