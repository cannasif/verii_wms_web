import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <Card className="shrink-0 border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{t('steelGoodReceiptAcceptance.inspection.formTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.dcode')}</Label><Input value={detail.dCode} readOnly /></div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.stock')}</Label><Input value={detail.stockCode} readOnly /></div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.plate')}</Label><Input value={detail.serialNo} readOnly /></div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.expQty')}</Label><Input value={String(expectedQuantity)} readOnly /></div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Button type="button" variant="outline" onClick={() => onQuickDecision('approved')}>
            {t('steelGoodReceiptAcceptance.inspection.quickApprove')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onQuickDecision('missing')}>
            {t('steelGoodReceiptAcceptance.inspection.quickMissing')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onQuickDecision('rejected')}>
            {t('steelGoodReceiptAcceptance.inspection.quickReject')}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('steelGoodReceiptAcceptance.inspection.arrQ')}</Label>
            <Select value={form.isArrived ? 'yes' : 'no'} onValueChange={(value) => onUpdateForm('isArrived', value === 'yes')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t('steelGoodReceiptAcceptance.inspection.y')}</SelectItem>
                <SelectItem value="no">{t('steelGoodReceiptAcceptance.inspection.n')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('steelGoodReceiptAcceptance.inspection.apprQ')}</Label>
            <Select value={form.isApproved ? 'yes' : 'no'} onValueChange={(value) => onUpdateForm('isApproved', value === 'yes')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t('steelGoodReceiptAcceptance.inspection.yAp')}</SelectItem>
                <SelectItem value="no">{t('steelGoodReceiptAcceptance.inspection.nAp')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.arrivedQty')}</Label><Input type="number" value={String(form.arrivedQuantity)} onChange={(event) => onUpdateForm('arrivedQuantity', Number(event.target.value) || 0)} /></div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.approvedQty')}</Label><Input type="number" value={String(form.approvedQuantity)} onChange={(event) => onUpdateForm('approvedQuantity', Number(event.target.value) || 0)} /></div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.rejectedQty')}</Label><Input type="number" value={String(form.rejectedQuantity)} onChange={(event) => onUpdateForm('rejectedQuantity', Number(event.target.value) || 0)} /></div>
          <div><Label>{t('steelGoodReceiptAcceptance.inspection.statusNote')}</Label><Input value={form.note ?? ''} onChange={(event) => onUpdateForm('note', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.inspection.statusNotePh')} /></div>
        </div>

        <div><Label>{t('steelGoodReceiptAcceptance.inspection.rejectReasonLabel')}</Label><Input value={form.rejectReason ?? ''} onChange={(event) => onUpdateForm('rejectReason', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.inspection.rejectPh')} /></div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.expQty')}: {expectedQuantity}</Badge>
          <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.openGap')}: {remainingGap}</Badge>
          <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.status')}: {localizeStatus(detail.status, t)}</Badge>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? t('steelGoodReceiptAcceptance.inspection.saveP') : t('steelGoodReceiptAcceptance.inspection.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
