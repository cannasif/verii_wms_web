import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, CheckCircle2, ListChecks, PackageMinus } from 'lucide-react';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import {
  GOODS_RECEIPT_CONTINUE_SEED_STATE_KEY,
  type GoodsReceiptContinueSeed,
} from '@/features/shared';
import { cn } from '@/lib/utils';

interface GoodsReceiptContinuePanelProps {
  seed: GoodsReceiptContinueSeed;
  variant?: 'default' | 'ops';
}

export function GoodsReceiptContinuePanel({
  seed,
  variant = 'ops',
}: GoodsReceiptContinuePanelProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const transferPermission = useCrudPermission('wms.transfer');
  const outboundPermission = useCrudPermission('wms.warehouse.outbound');
  const isOps = variant === 'ops';

  const lineCount = seed.lines.length;
  const totalQty = seed.lines.reduce((sum, line) => sum + (line.quantity || 0), 0);

  const goTransfer = (): void => {
    navigate('/transfer/create', {
      state: { [GOODS_RECEIPT_CONTINUE_SEED_STATE_KEY]: seed },
    });
  };

  const goOutbound = (): void => {
    navigate('/warehouse/outbound/create', {
      state: { [GOODS_RECEIPT_CONTINUE_SEED_STATE_KEY]: seed },
    });
  };

  const finish = (): void => {
    navigate('/goods-receipt/list');
  };

  return (
    <div className={cn('space-y-5', isOps && 'wms-ops-gr-continue')}>
      <div className="wms-ops-gr-continue__hero">
        <span className="wms-ops-gr-continue__hero-icon" aria-hidden>
          <CheckCircle2 className="size-6" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="wms-ops-gr-continue__hero-title">{t('goodsReceipt.continue.title')}</h2>
          <p className="wms-ops-gr-continue__hero-subtitle">{t('goodsReceipt.continue.subtitle')}</p>
        </div>
      </div>

      <div className="wms-ops-gr-continue__summary">
        <div className="wms-ops-gr-continue__stat">
          <span className="wms-ops-gr-continue__label">{t('goodsReceipt.continue.documentNo')}</span>
          <p className="wms-ops-gr-continue__stat-value wms-ops-gr-continue__stat-value--mono">{seed.documentNo}</p>
        </div>
        <div className="wms-ops-gr-continue__stat">
          <span className="wms-ops-gr-continue__label">{t('goodsReceipt.continue.lines')}</span>
          <p className="wms-ops-gr-continue__stat-value">{lineCount}</p>
        </div>
        <div className="wms-ops-gr-continue__stat">
          <span className="wms-ops-gr-continue__label">{t('goodsReceipt.continue.totalQty')}</span>
          <p className="wms-ops-gr-continue__stat-value">{totalQty.toFixed(2)}</p>
        </div>
      </div>

      <p className="wms-ops-gr-continue__hint">{t('goodsReceipt.continue.softLinkHint')}</p>

      <div className="wms-ops-gr-continue__actions">
        <button
          type="button"
          className="wms-ops-gr-continue__action wms-ops-gr-continue__action--finish"
          onClick={finish}
        >
          <span className="wms-ops-gr-continue__action-icon" aria-hidden>
            <ListChecks className="size-4" />
          </span>
          <span className="wms-ops-gr-continue__action-copy">
            <span className="wms-ops-gr-continue__action-title">{t('goodsReceipt.continue.finish')}</span>
            <span className="wms-ops-gr-continue__action-desc">{t('goodsReceipt.continue.finishHint')}</span>
          </span>
        </button>

        <button
          type="button"
          className="wms-ops-gr-continue__action wms-ops-gr-continue__action--transfer"
          onClick={goTransfer}
          disabled={!transferPermission.canCreate}
        >
          <span className="wms-ops-gr-continue__action-icon" aria-hidden>
            <ArrowRightLeft className="size-4" />
          </span>
          <span className="wms-ops-gr-continue__action-copy">
            <span className="wms-ops-gr-continue__action-title">{t('goodsReceipt.continue.transfer')}</span>
            <span className="wms-ops-gr-continue__action-desc">
              {transferPermission.canCreate
                ? t('goodsReceipt.continue.transferHint')
                : t('goodsReceipt.continue.noPermission')}
            </span>
          </span>
        </button>

        <button
          type="button"
          className="wms-ops-gr-continue__action wms-ops-gr-continue__action--outbound"
          onClick={goOutbound}
          disabled={!outboundPermission.canCreate}
        >
          <span className="wms-ops-gr-continue__action-icon" aria-hidden>
            <PackageMinus className="size-4" />
          </span>
          <span className="wms-ops-gr-continue__action-copy">
            <span className="wms-ops-gr-continue__action-title">{t('goodsReceipt.continue.outbound')}</span>
            <span className="wms-ops-gr-continue__action-desc">
              {outboundPermission.canCreate
                ? t('goodsReceipt.continue.outboundHint')
                : t('goodsReceipt.continue.noPermission')}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
