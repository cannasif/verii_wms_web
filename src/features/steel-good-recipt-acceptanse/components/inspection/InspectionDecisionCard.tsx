import { type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput } from '@/components/shared';
import { SelectItem } from '@/components/ui/select';
import {
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
  MasterDataOpsSelect,
} from '@/features/shared';
import { localizeStatus } from '@/lib/localize-status';
import type { InspectionFormState } from './shared';

interface InspectionDecisionCardProps {
  detail: {
    id: number;
    dCode: string;
    stockCode: string;
    serialNo: string;
    expectedQuantity: number;
    status: string;
  };
  form: InspectionFormState;
  expectedQuantity: number;
  remainingGap: number;
  onQuickDecision: (type: 'approved' | 'missing' | 'rejected') => void;
  onUpdateForm: <K extends keyof InspectionFormState>(key: K, value: InspectionFormState[K]) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function InspectionDecisionCard({
  detail,
  form,
  expectedQuantity,
  remainingGap,
  onQuickDecision,
  onUpdateForm,
  onSave,
  isSaving,
}: InspectionDecisionCardProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.inspection.formTitle')}>
      <div className="grid gap-4 md:grid-cols-2">
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.dcode')}>
          <OpsInput value={detail.dCode} readOnly />
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.stock')}>
          <OpsInput value={detail.stockCode} readOnly />
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.plate')}>
          <OpsInput value={detail.serialNo} readOnly />
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.expQty')}>
          <OpsInput value={String(expectedQuantity)} readOnly />
        </MasterDataOpsFormField>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <OpsActionButton type="button" variant="secondary" onClick={() => onQuickDecision('approved')}>
          {t('steelGoodReceiptAcceptance.inspection.quickApprove')}
        </OpsActionButton>
        <OpsActionButton type="button" variant="secondary" onClick={() => onQuickDecision('missing')}>
          {t('steelGoodReceiptAcceptance.inspection.quickMissing')}
        </OpsActionButton>
        <OpsActionButton type="button" variant="secondary" onClick={() => onQuickDecision('rejected')}>
          {t('steelGoodReceiptAcceptance.inspection.quickReject')}
        </OpsActionButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.arrQ')}>
          <MasterDataOpsSelect value={form.isArrived ? 'yes' : 'no'} onValueChange={(value) => onUpdateForm('isArrived', value === 'yes')}>
            <SelectItem value="yes">{t('steelGoodReceiptAcceptance.inspection.y')}</SelectItem>
            <SelectItem value="no">{t('steelGoodReceiptAcceptance.inspection.n')}</SelectItem>
          </MasterDataOpsSelect>
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.apprQ')}>
          <MasterDataOpsSelect value={form.isApproved ? 'yes' : 'no'} onValueChange={(value) => onUpdateForm('isApproved', value === 'yes')}>
            <SelectItem value="yes">{t('steelGoodReceiptAcceptance.inspection.yAp')}</SelectItem>
            <SelectItem value="no">{t('steelGoodReceiptAcceptance.inspection.nAp')}</SelectItem>
          </MasterDataOpsSelect>
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.arrivedQty')}>
          <OpsInput type="number" value={String(form.arrivedQuantity)} onChange={(event) => onUpdateForm('arrivedQuantity', Number(event.target.value) || 0)} />
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.approvedQty')}>
          <OpsInput type="number" value={String(form.approvedQuantity)} onChange={(event) => onUpdateForm('approvedQuantity', Number(event.target.value) || 0)} />
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.rejectedQty')}>
          <OpsInput type="number" value={String(form.rejectedQuantity)} onChange={(event) => onUpdateForm('rejectedQuantity', Number(event.target.value) || 0)} />
        </MasterDataOpsFormField>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.statusNote')}>
          <OpsInput value={form.note ?? ''} onChange={(event) => onUpdateForm('note', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.inspection.statusNotePh')} />
        </MasterDataOpsFormField>
      </div>

      <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.rejectReasonLabel')} className="mt-4">
        <OpsInput value={form.rejectReason ?? ''} onChange={(event) => onUpdateForm('rejectReason', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.inspection.rejectPh')} />
      </MasterDataOpsFormField>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <MasterDataOpsFlagChip>{t('steelGoodReceiptAcceptance.inspection.expQty')}: {expectedQuantity}</MasterDataOpsFlagChip>
        <MasterDataOpsFlagChip tone="warn">{t('steelGoodReceiptAcceptance.inspection.openGap')}: {remainingGap}</MasterDataOpsFlagChip>
        <MasterDataOpsFlagChip tone="info">{t('steelGoodReceiptAcceptance.inspection.status')}: {localizeStatus(detail.status, t)}</MasterDataOpsFlagChip>
      </div>

      <div className="wms-ops-actions mt-5 flex justify-end">
        <OpsActionButton type="button" variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSaving ? t('steelGoodReceiptAcceptance.inspection.saveP') : t('steelGoodReceiptAcceptance.inspection.save')}
        </OpsActionButton>
      </div>
    </MasterDataOpsSection>
  );
}
