import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup, StockLookup, WarehouseLookup } from '@/services/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type {
  CreateInventoryQualityInspectionDto,
  CreateInventoryQualityInspectionLineDto,
  InventoryQualityInspectionDto,
} from '../types/quality-control.types';
import { buildCustomerLabel, buildStockLabel, buildWarehouseLabel, createEmptyInspectionLine, createEmptyQualityInspection } from './quality-control/shared';

interface LookupPageArgs {
  pageNumber: number;
  pageSize: number;
  search: string;
  signal?: AbortSignal;
}

export function QualityControlInspectionPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  const [formState, setFormState] = useState<CreateInventoryQualityInspectionDto>(createEmptyQualityInspection);
  const [currentRecord, setCurrentRecord] = useState<InventoryQualityInspectionDto | null>(null);
  const [lineDraft, setLineDraft] = useState<CreateInventoryQualityInspectionLineDto>(createEmptyInspectionLine);
  const [warehouseLabel, setWarehouseLabel] = useState('');
  const [supplierLabel, setSupplierLabel] = useState('');
  const [lineStockLabel, setLineStockLabel] = useState('');

  const isEdit = Boolean(currentRecord?.id);

  useEffect(() => {
    setPageTitle(t('qualityControl.inspections.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getByIdMutation = useMutation({
    mutationFn: (id: number) => qualityControlApi.getInspectionById(id),
    onSuccess: (data) => {
      setCurrentRecord(data);
      setFormState({
        branchCode: data.branchCode || '0',
        documentType: data.documentType,
        documentNumber: data.documentNumber || '',
        documentId: data.documentId ?? null,
        warehouseId: data.warehouseId,
        supplierId: data.supplierId ?? null,
        inspectionDate: data.inspectionDate ? data.inspectionDate.slice(0, 16) : '',
        status: data.status,
        note: data.note || '',
        lines: data.lines.map((line) => ({
          stockId: line.stockId,
          lotNo: line.lotNo || '',
          serialNo: line.serialNo || '',
          expiryDate: line.expiryDate ? line.expiryDate.slice(0, 10) : null,
          quantity: line.quantity,
          decision: line.decision,
          reasonCode: line.reasonCode || '',
          reasonNote: line.reasonNote || '',
        })),
      });
      setWarehouseLabel(buildWarehouseLabel(data.warehouseCode, data.warehouseName));
      setSupplierLabel(buildCustomerLabel(data.supplierCode, data.supplierName));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) return;
    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) return;
    if (currentRecord?.id === id || getByIdMutation.isPending) return;
    getByIdMutation.mutate(id);
  }, [currentRecord?.id, getByIdMutation, searchParams]);

  const saveMutation = useMutation({
    mutationFn: async (dto: CreateInventoryQualityInspectionDto) => (
      currentRecord?.id
        ? qualityControlApi.updateInspection(currentRecord.id, dto)
        : qualityControlApi.createInspection(dto)
    ),
    onSuccess: (data) => {
      setCurrentRecord(data);
      setSearchParams({ id: String(data.id) }, { replace: true });
      toast.success(isEdit ? t('qualityControl.messages.inspectionUpdated') : t('qualityControl.messages.inspectionCreated'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  function handleReset(): void {
    setCurrentRecord(null);
    setSearchParams({}, { replace: true });
    setFormState(createEmptyQualityInspection());
    setLineDraft(createEmptyInspectionLine());
    setWarehouseLabel('');
    setSupplierLabel('');
    setLineStockLabel('');
  }

  function handleAddLine(): void {
    if (!lineDraft.stockId) {
      toast.error(t('qualityControl.messages.inspectionLineStockRequired'));
      return;
    }
    if (!lineDraft.quantity || lineDraft.quantity <= 0) {
      toast.error(t('qualityControl.messages.inspectionLineQuantityRequired'));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      lines: [...prev.lines, {
        ...lineDraft,
        lotNo: lineDraft.lotNo?.trim() || null,
        serialNo: lineDraft.serialNo?.trim() || null,
        reasonCode: lineDraft.reasonCode?.trim() || null,
        reasonNote: lineDraft.reasonNote?.trim() || null,
      }],
    }));
    setLineDraft(createEmptyInspectionLine());
    setLineStockLabel('');
  }

  function handleRemoveLine(index: number): void {
    setFormState((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function handleSave(): void {
    if (!formState.documentType.trim()) {
      toast.error(t('qualityControl.messages.inspectionDocumentTypeRequired'));
      return;
    }
    if (!formState.warehouseId) {
      toast.error(t('qualityControl.messages.inspectionWarehouseRequired'));
      return;
    }
    if (formState.lines.length === 0) {
      toast.error(t('qualityControl.messages.inspectionLinesRequired'));
      return;
    }

    saveMutation.mutate({
      ...formState,
      documentType: formState.documentType.trim(),
      documentNumber: formState.documentNumber?.trim() || null,
      note: formState.note?.trim() || null,
      inspectionDate: formState.inspectionDate ? new Date(formState.inspectionDate).toISOString() : null,
      lines: formState.lines.map((line) => ({
        ...line,
        expiryDate: line.expiryDate ? new Date(line.expiryDate).toISOString() : null,
      })),
    });
  }

  const currentWarehouseLabel = useMemo(
    () => buildWarehouseLabel(currentRecord?.warehouseCode, currentRecord?.warehouseName) || warehouseLabel,
    [currentRecord?.warehouseCode, currentRecord?.warehouseName, warehouseLabel],
  );

  const currentSupplierLabel = useMemo(
    () => buildCustomerLabel(currentRecord?.supplierCode, currentRecord?.supplierName) || supplierLabel,
    [currentRecord?.supplierCode, currentRecord?.supplierName, supplierLabel],
  );

  return (
    <div className="crm-page space-y-6">
      <Badge variant="secondary">{t('qualityControl.badge')}</Badge>

      <FormPageShell title={t('qualityControl.inspections.title')} description={t('qualityControl.inspections.description')}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('qualityControl.inspections.guidanceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t('qualityControl.inspections.guidance1')}</p>
              <p>{t('qualityControl.inspections.guidance2')}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="documentType">{t('qualityControl.inspections.fields.documentType')} *</Label>
              <Input
                id="documentType"
                value={formState.documentType}
                onChange={(event) => setFormState((prev) => ({ ...prev, documentType: event.target.value }))}
                placeholder={t('qualityControl.inspections.fields.documentTypePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">{t('qualityControl.inspections.fields.documentNumber')}</Label>
              <Input
                id="documentNumber"
                value={formState.documentNumber || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, documentNumber: event.target.value }))}
                placeholder={t('qualityControl.inspections.fields.documentNumberPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentId">{t('qualityControl.inspections.fields.documentId')}</Label>
              <Input
                id="documentId"
                type="number"
                min={0}
                value={formState.documentId ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, documentId: event.target.value ? Number(event.target.value) : null }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspectionDate">{t('qualityControl.inspections.fields.inspectionDate')}</Label>
              <Input
                id="inspectionDate"
                type="datetime-local"
                value={formState.inspectionDate || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, inspectionDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.inspections.fields.warehouse')} *</Label>
              <PagedLookupDialog<WarehouseLookup>
                open={warehouseDialogOpen}
                onOpenChange={setWarehouseDialogOpen}
                title={t('qualityControl.inspections.warehouseLookup.title')}
                description={t('qualityControl.inspections.warehouseLookup.description')}
                value={currentWarehouseLabel}
                placeholder={t('qualityControl.inspections.fields.warehousePlaceholder')}
                searchPlaceholder={t('qualityControl.inspections.warehouseLookup.searchPlaceholder')}
                queryKey={['quality-control', 'inspection-warehouses']}
                fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                onSelect={(item) => {
                  setFormState((prev) => ({ ...prev, warehouseId: item.id }));
                  setWarehouseLabel(`${item.depoKodu} - ${item.depoIsmi}`);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.inspections.fields.supplier')}</Label>
              <PagedLookupDialog<CustomerLookup>
                open={supplierDialogOpen}
                onOpenChange={setSupplierDialogOpen}
                title={t('qualityControl.inspections.supplierLookup.title')}
                description={t('qualityControl.inspections.supplierLookup.description')}
                value={currentSupplierLabel}
                placeholder={t('qualityControl.inspections.fields.supplierPlaceholder')}
                searchPlaceholder={t('qualityControl.inspections.supplierLookup.searchPlaceholder')}
                queryKey={['quality-control', 'inspection-suppliers']}
                fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                  lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
                onSelect={(item) => {
                  setFormState((prev) => ({ ...prev, supplierId: item.id }));
                  setSupplierLabel(`${item.cariKod} - ${item.cariIsim}`);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.inspections.fields.status')}</Label>
              <Select value={formState.status} onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">{t('qualityControl.inspections.statuses.pending')}</SelectItem>
                  <SelectItem value="Approved">{t('qualityControl.inspections.statuses.approved')}</SelectItem>
                  <SelectItem value="Rejected">{t('qualityControl.inspections.statuses.rejected')}</SelectItem>
                  <SelectItem value="Quarantined">{t('qualityControl.inspections.statuses.quarantined')}</SelectItem>
                  <SelectItem value="Released">{t('qualityControl.inspections.statuses.released')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspectionNote">{t('qualityControl.inspections.fields.note')}</Label>
            <Textarea
              id="inspectionNote"
              rows={4}
              value={formState.note || ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
              placeholder={t('qualityControl.inspections.fields.notePlaceholder')}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('qualityControl.inspections.lines.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label>{t('qualityControl.inspections.lines.stock')} *</Label>
                  <PagedLookupDialog<StockLookup>
                    open={stockDialogOpen}
                    onOpenChange={setStockDialogOpen}
                    title={t('qualityControl.inspections.stockLookup.title')}
                    description={t('qualityControl.inspections.stockLookup.description')}
                    value={lineStockLabel}
                    placeholder={t('qualityControl.inspections.lines.stockPlaceholder')}
                    searchPlaceholder={t('qualityControl.inspections.stockLookup.searchPlaceholder')}
                    queryKey={['quality-control', 'inspection-stocks']}
                    fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                      lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                    getKey={(item) => String(item.id)}
                    getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                    onSelect={(item) => {
                      setLineDraft((prev) => ({ ...prev, stockId: item.id }));
                      setLineStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineLot">{t('qualityControl.inspections.lines.lotNo')}</Label>
                  <Input id="lineLot" value={lineDraft.lotNo || ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, lotNo: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineSerial">{t('qualityControl.inspections.lines.serialNo')}</Label>
                  <Input id="lineSerial" value={lineDraft.serialNo || ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, serialNo: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineExpiry">{t('qualityControl.inspections.lines.expiryDate')}</Label>
                  <Input id="lineExpiry" type="date" value={lineDraft.expiryDate || ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, expiryDate: event.target.value || null }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineQuantity">{t('qualityControl.inspections.lines.quantity')}</Label>
                  <Input id="lineQuantity" type="number" min={0.0001} step="0.0001" value={lineDraft.quantity} onChange={(event) => setLineDraft((prev) => ({ ...prev, quantity: Number(event.target.value || 0) }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('qualityControl.inspections.lines.decision')}</Label>
                  <Select value={lineDraft.decision} onValueChange={(value) => setLineDraft((prev) => ({ ...prev, decision: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accept">{t('qualityControl.inspections.decisions.accept')}</SelectItem>
                      <SelectItem value="Quarantine">{t('qualityControl.inspections.decisions.quarantine')}</SelectItem>
                      <SelectItem value="Reject">{t('qualityControl.inspections.decisions.reject')}</SelectItem>
                      <SelectItem value="Return">{t('qualityControl.inspections.decisions.return')}</SelectItem>
                      <SelectItem value="Hold">{t('qualityControl.inspections.decisions.hold')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineReasonCode">{t('qualityControl.inspections.lines.reasonCode')}</Label>
                  <Input id="lineReasonCode" value={lineDraft.reasonCode || ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, reasonCode: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineReasonNote">{t('qualityControl.inspections.lines.reasonNote')}</Label>
                <Textarea id="lineReasonNote" rows={3} value={lineDraft.reasonNote || ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, reasonNote: event.target.value }))} />
              </div>
              <Button type="button" variant="outline" onClick={handleAddLine}>
                {t('qualityControl.inspections.lines.add')}
              </Button>

              <div className="space-y-3">
                {formState.lines.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    {t('qualityControl.inspections.lines.empty')}
                  </div>
                ) : (
                  formState.lines.map((line, index) => (
                    <div key={`${line.stockId}-${index}`} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          {currentRecord?.lines[index]
                            ? buildStockLabel(currentRecord.lines[index]?.stockCode, currentRecord.lines[index]?.stockName)
                            : t('qualityControl.inspections.lines.lineSummary', { stockId: line.stockId, quantity: line.quantity, decision: line.decision })}
                        </div>
                        <div className="text-muted-foreground">
                          {t('qualityControl.inspections.lines.lineMeta', {
                            lot: line.lotNo || '-',
                            serial: line.serialNo || '-',
                            expiry: line.expiryDate || '-',
                          })}
                        </div>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveLine(index)}>
                        {t('common.delete')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || getByIdMutation.isPending}>
              {isEdit ? t('common.update') : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              {t('common.clear')}
            </Button>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
