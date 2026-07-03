import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Box, Building2, CalendarDays, Calculator, CheckCircle2, CreditCard, FilePlus2, FileText, Folder, Pencil, Plus, Save, Search, Send, Trash2, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  OpsActionButton,
  OpsFormPageShell,
  OpsInput,
  OpsListPageShell,
  OpsTextarea,
  PagedDataGrid,
  PagedLookupDialog,
  type PagedDataGridColumn,
} from '@/components/shared';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { CustomerLookup, StockLookup } from '@/features/shared/api/lookup-types';
import { documentSeriesManagementApi } from '@/features/document-series-management/api/document-series-management.api';
import type { WmsDocumentSeriesDefinitionPagedRowDto } from '@/features/document-series-management/types/document-series-management.types';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { purchaseApi, purchaseApprovalRuleApi, type PurchaseEndpoint } from '../api/purchase.api';
import type { CreatePurchaseApprovalRuleDto, CreatePurchaseDocumentDto, CreatePurchaseLineDto, PurchaseApprovalRuleDto, PurchaseListRowDto } from '../types/purchase.types';

type ColumnKey = 'id' | 'documentNo' | 'status' | 'supplier' | 'currencyCode' | 'grandTotal' | 'sourceDocumentNo' | 'documentDate';
type PurchasePageKind = 'request' | 'rfq' | 'quotation' | 'order';

interface PurchasePageConfig {
  kind: PurchasePageKind;
  endpoint: PurchaseEndpoint;
  listPath: string;
  createPath: string;
  title: string;
  createTitle: string;
  description: string;
  documentNoLabel: string;
  documentNoField: 'requestNo' | 'rfqNo' | 'quotationNo' | 'orderNo';
  documentDateField: 'requestDate' | 'rfqDate' | 'quotationDate' | 'orderDate';
}

const purchasePageConfigs: Record<PurchasePageKind, PurchasePageConfig> = {
  request: {
    kind: 'request',
    endpoint: 'PurchaseRequest',
    listPath: '/purchase/requests',
    createPath: '/purchase/requests/create',
    title: 'Satınalma Talep Listesi',
    createTitle: 'Yeni Satınalma Talebi',
    description: 'Satınalma talepleri WMS içinde satış belgelerinden bağımsız izlenir.',
    documentNoLabel: 'Talep No',
    documentNoField: 'requestNo',
    documentDateField: 'requestDate',
  },
  rfq: {
    kind: 'rfq',
    endpoint: 'PurchaseRfq',
    listPath: '/purchase/rfqs',
    createPath: '/purchase/rfqs/create',
    title: 'Teklif İstekleri (RFQ)',
    createTitle: 'Yeni Teklif İsteği (RFQ)',
    description: 'Bir RFQ birden fazla ERP eşleşmeli tedarikçiye gönderilebilir.',
    documentNoLabel: 'RFQ No',
    documentNoField: 'rfqNo',
    documentDateField: 'rfqDate',
  },
  quotation: {
    kind: 'quotation',
    endpoint: 'SupplierQuotation',
    listPath: '/purchase/supplier-quotations',
    createPath: '/purchase/supplier-quotations/create',
    title: 'Tedarikçi Teklif Listesi',
    createTitle: 'Yeni Tedarikçi Teklifi',
    description: 'Tedarikçi teklifleri RFQ üzerinden veya talepsiz olarak oluşturulabilir.',
    documentNoLabel: 'Teklif No',
    documentNoField: 'quotationNo',
    documentDateField: 'quotationDate',
  },
  order: {
    kind: 'order',
    endpoint: 'PurchaseOrder',
    listPath: '/purchase/orders',
    createPath: '/purchase/orders/create',
    title: 'Satınalma Sipariş Listesi',
    createTitle: 'Yeni Satınalma Siparişi',
    description: 'Satınalma siparişleri WMS satınalma akışının sipariş aşamasıdır.',
    documentNoLabel: 'Sipariş No',
    documentNoField: 'orderNo',
    documentDateField: 'orderDate',
  },
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'documentNo': return 'DocumentNo';
    case 'status': return 'Status';
    case 'supplier': return 'Supplier';
    case 'currencyCode': return 'CurrencyCode';
    case 'grandTotal': return 'GrandTotal';
    case 'sourceDocumentNo': return 'SourceDocumentNo';
    case 'documentDate': return 'DocumentDate';
    default: return 'Id';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function formatMoney(value: number, currencyCode: string): string {
  return `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)} ${currencyCode || 'TL'}`;
}

function createEmptyLine(): CreatePurchaseLineDto {
  return {
    stockId: null,
    productCode: '',
    productName: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    discount1: 0,
    discount2: 0,
    discount3: 0,
    vatRate: 20,
    deliveryDate: null,
    description1: null,
    description2: null,
    description3: null,
    imagePath: null,
    erpProjectCode: null,
    purchaseRequestLineId: null,
    supplierQuotationLineId: null,
  };
}

function buildSupplierLabel(customer: CustomerLookup): string {
  return `${customer.cariKod} - ${customer.cariIsim}`;
}

function buildStockLabel(stock: StockLookup): string {
  return `${stock.stokKodu} - ${stock.stokAdi}`;
}

function buildSeriesPreview(definition: WmsDocumentSeriesDefinitionPagedRowDto): string {
  const now = new Date();
  const yearPart = definition.yearMode === 'YEAR2'
    ? now.getFullYear().toString().slice(-2)
    : definition.yearMode === 'YEAR4'
      ? now.getFullYear().toString()
      : '';

  return `${definition.seriesPrefix}${yearPart}${String(definition.currentNumber).padStart(definition.numberLength, '0')}`;
}

function buildSeriesLabel(definition: WmsDocumentSeriesDefinitionPagedRowDto): string {
  return `${definition.code} - ${definition.name} (${definition.seriesPrefix})`;
}

function getPurchaseSeriesOperationType(kind: PurchasePageKind): string {
  switch (kind) {
    case 'quotation':
      return 'PURCHASE_QUOTATION';
    case 'order':
      return 'PURCHASE_ORDER';
    case 'rfq':
      return 'PURCHASE_RFQ';
    default:
      return 'PURCHASE_REQUEST';
  }
}

function getEffectiveDiscountMultiplier(line: Pick<CreatePurchaseLineDto, 'discount1' | 'discount2' | 'discount3'>): number {
  return (1 - (line.discount1 || 0) / 100) * (1 - (line.discount2 || 0) / 100) * (1 - (line.discount3 || 0) / 100);
}

function calculateLineTotals(line: CreatePurchaseLineDto): { net: number; vat: number; total: number } {
  const net = Math.max(0, (line.quantity || 0) * (line.unitPrice || 0) * getEffectiveDiscountMultiplier(line));
  const vat = net * (line.vatRate || 0) / 100;
  return { net, vat, total: net + vat };
}

function validateDiscounts(line: CreatePurchaseLineDto): boolean {
  return [line.discount1, line.discount2, line.discount3].every((value) => Number.isFinite(value) && value >= 0 && value < 100)
    && getEffectiveDiscountMultiplier(line) > 0;
}

function toNumber(value: string, fallback = 0): number {
  const normalized = value.replace(',', '.');
  const result = Number(normalized);
  return Number.isFinite(result) ? result : fallback;
}

export function PurchaseListPage({ kind }: { kind: PurchasePageKind }): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = purchasePageConfigs[kind];
  const pageKey = `purchase-${kind}-list`;

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    defaultPageSize: 10,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(config.title);
    return () => setPageTitle(null);
  }, [config.title, setPageTitle]);

  const query = useQuery({
    queryKey: ['purchase', config.endpoint, pagedGrid.queryParams],
    queryFn: () => purchaseApi.getPaged(config.endpoint, pagedGrid.queryParams),
  });

  const convertToOrderMutation = useMutation({
    mutationFn: (id: number) => purchaseApi.convertSupplierQuotationToOrder(id),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['purchase'] });
      toast.success('Tedarikçi teklifi satınalma siparişine çevrildi.');
      const orderId = Number(result.id);
      navigate(Number.isFinite(orderId) && orderId > 0 ? `/purchase/orders/${orderId}/edit` : '/purchase/orders');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const approvalMutation = useMutation({
    mutationFn: ({ action, id }: { action: 'submit' | 'approve' | 'reject'; id: number }) => {
      const endpoint = config.endpoint as Extract<PurchaseEndpoint, 'SupplierQuotation' | 'PurchaseOrder'>;
      if (action === 'submit') return purchaseApi.submitApproval(endpoint, id);
      if (action === 'approve') return purchaseApi.approve(endpoint, id);
      return purchaseApi.reject(endpoint, id, 'Liste ekranından reddedildi.');
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['purchase'] });
      const messages = {
        submit: 'Belge onaya gönderildi.',
        approve: 'Belge onaylandı.',
        reject: 'Belge reddedildi.',
      };
      toast.success(messages[variables.action]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'documentNo', label: config.documentNoLabel, sortable: true },
    { key: 'status', label: 'Durum', sortable: true },
    { key: 'supplier', label: 'Tedarikçi', sortable: true },
    { key: 'currencyCode', label: 'Para Birimi', sortable: true },
    { key: 'grandTotal', label: 'Toplam', sortable: true },
    { key: 'sourceDocumentNo', label: 'Bağlı Belge', sortable: true },
    { key: 'documentDate', label: 'Tarih', sortable: true },
  ], [config.documentNoLabel]);

  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total} kayıt`,
  });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null =>
    columnKey === pagedGrid.sortBy
      ? pagedGrid.sortDirection === 'asc'
        ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
        : <ArrowDown className="ml-1 h-3.5 w-3.5" />
      : null;

  return (
    <OpsListPageShell
      eyebrow="WMS / SATINALMA"
      title={config.title}
      description={config.description}
      actions={
        <OpsActionButton type="button" variant="primary" onClick={() => navigate(config.createPath)}>
          <Plus className="size-4" />
          {config.createTitle}
        </OpsActionButton>
      }
    >
      <PagedDataGrid<PurchaseListRowDto, ColumnKey>
        variant="ops"
        pageKey={pageKey}
        columns={columns}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'id': return row.id;
            case 'documentNo': return row.documentNo || '-';
            case 'status': return row.status;
            case 'supplier': return row.supplier || '-';
            case 'currencyCode': return row.currencyCode || 'TL';
            case 'grandTotal': return formatMoney(row.grandTotal, row.currencyCode);
            case 'sourceDocumentNo': return row.sourceDocumentNo || '-';
            case 'documentDate': return formatDate(row.documentDate);
            default: return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={pagedGrid.handleSort}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
        emptyText="Kayıt bulunamadı."
        onRowDoubleClick={(row) => navigate(`${config.listPath}/${row.id}/edit`)}
        showActionsColumn
        actionsHeaderLabel="İşlemler"
        actionsCellClassName="text-right"
        renderActionsCell={(row) => {
          const isApprovalSupported = kind === 'quotation' || kind === 'order';
          const canSubmitApproval = isApprovalSupported && ['Draft', 'Rejected'].includes(row.status);
          const canApproveOrReject = isApprovalSupported && row.status === 'PendingApproval';
          const canConvertToOrder = kind === 'quotation'
            && !['Converted', 'Cancelled', 'Rejected', 'PendingApproval'].includes(row.status);

          return (
            <div className="flex items-center justify-end gap-2">
              {canSubmitApproval ? (
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-700 transition hover:border-blue-500/60 hover:bg-blue-500/15 dark:text-blue-300"
                  onClick={(event) => {
                    event.stopPropagation();
                    approvalMutation.mutate({ action: 'submit', id: row.id });
                  }}
                  disabled={approvalMutation.isPending}
                  aria-label="Onaya gönder"
                  title="Onaya gönder"
                >
                  <Send className="size-4" />
                </button>
              ) : null}
              {canApproveOrReject ? (
                <>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 transition hover:border-emerald-500/60 hover:bg-emerald-500/15 dark:text-emerald-300"
                    onClick={(event) => {
                      event.stopPropagation();
                      approvalMutation.mutate({ action: 'approve', id: row.id });
                    }}
                    disabled={approvalMutation.isPending}
                    aria-label="Onayla"
                    title="Onayla"
                  >
                    <CheckCircle2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 transition hover:border-rose-500/60 hover:bg-rose-500/15 dark:text-rose-300"
                    onClick={(event) => {
                      event.stopPropagation();
                      approvalMutation.mutate({ action: 'reject', id: row.id });
                    }}
                    disabled={approvalMutation.isPending}
                    aria-label="Reddet"
                    title="Reddet"
                  >
                    <XCircle className="size-4" />
                  </button>
                </>
              ) : null}
              {canConvertToOrder ? (
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 transition hover:border-emerald-500/60 hover:bg-emerald-500/15 dark:text-emerald-300"
                  onClick={(event) => {
                    event.stopPropagation();
                    convertToOrderMutation.mutate(row.id);
                  }}
                  disabled={convertToOrderMutation.isPending}
                  aria-label="Siparişe çevir"
                  title="Siparişe çevir"
                >
                  <FilePlus2 className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`${config.listPath}/${row.id}/edit`);
                }}
                aria-label="Düzenle"
                title="Düzenle"
              >
                <Pencil className="size-4" />
              </button>
            </div>
          );
        }}
        pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
        totalPages={Math.max(query.data?.totalPages ?? 1, 1)}
        hasPreviousPage={Boolean(query.data?.hasPreviousPage)}
        hasNextPage={Boolean(query.data?.hasNextPage)}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={paginationInfoText}
        search={{
          value: pagedGrid.searchInput,
          onValueChange: pagedGrid.searchConfig.onValueChange,
          onSearchChange: pagedGrid.searchConfig.onSearchChange,
          placeholder: 'Ara',
        }}
        refresh={{ onRefresh: () => { void query.refetch(); }, isLoading: query.isLoading, label: t('common.refresh') }}
        exportFileName={`purchase-${kind}`}
        exportColumns={columns.map((column) => ({ key: column.key, label: column.label }))}
        exportRows={(query.data?.data ?? []).map((row) => ({
          id: row.id,
          documentNo: row.documentNo,
          status: row.status,
          supplier: row.supplier,
          currencyCode: row.currencyCode,
          grandTotal: row.grandTotal,
          sourceDocumentNo: row.sourceDocumentNo,
          documentDate: row.documentDate,
        }))}
      />
    </OpsListPageShell>
  );
}

type ApprovalRuleColumnKey = 'id' | 'ruleName' | 'documentKind' | 'stepOrder' | 'approverUserId' | 'amountRange' | 'scope' | 'isActive';

const emptyApprovalRuleForm: CreatePurchaseApprovalRuleDto = {
  ruleName: '',
  documentKind: 'PurchaseOrder',
  stepOrder: 1,
  approverUserId: 0,
  department: null,
  projectCode: null,
  currencyCode: null,
  minAmount: null,
  maxAmount: null,
  isActive: true,
  requireAllPreviousSteps: true,
  description: null,
};

function mapApprovalRuleSortBy(value: ApprovalRuleColumnKey): string {
  switch (value) {
    case 'ruleName': return 'RuleName';
    case 'documentKind': return 'DocumentKind';
    case 'stepOrder': return 'StepOrder';
    case 'approverUserId': return 'ApproverUserId';
    case 'isActive': return 'IsActive';
    default: return 'Id';
  }
}

function formatAmountRange(row: PurchaseApprovalRuleDto): string {
  const min = row.minAmount ?? 0;
  const max = row.maxAmount;
  return max == null
    ? `${new Intl.NumberFormat('tr-TR').format(min)}+`
    : `${new Intl.NumberFormat('tr-TR').format(min)} - ${new Intl.NumberFormat('tr-TR').format(max)}`;
}

export function PurchaseApprovalRulesPage(): ReactElement {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePurchaseApprovalRuleDto>(emptyApprovalRuleForm);
  const pageKey = 'purchase-approval-rules';

  const pagedGrid = usePagedDataGrid<ApprovalRuleColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    defaultPageSize: 10,
    pageNumberBase: 1,
    mapSortBy: mapApprovalRuleSortBy,
  });

  useEffect(() => {
    setPageTitle('Satınalma Onay Kuralları');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const query = useQuery({
    queryKey: ['purchase', 'approval-rules', pagedGrid.queryParams],
    queryFn: () => purchaseApprovalRuleApi.getPaged(pagedGrid.queryParams),
  });

  const saveMutation = useMutation({
    mutationFn: (dto: CreatePurchaseApprovalRuleDto) => editingId
      ? purchaseApprovalRuleApi.update(editingId, dto)
      : purchaseApprovalRuleApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['purchase', 'approval-rules'] });
      setEditingId(null);
      setForm(emptyApprovalRuleForm);
      toast.success('Satınalma onay kuralı kaydedildi.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchaseApprovalRuleApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['purchase', 'approval-rules'] });
      toast.success('Satınalma onay kuralı silindi.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const columns = useMemo<PagedDataGridColumn<ApprovalRuleColumnKey>[]>(() => [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'ruleName', label: 'Kural', sortable: true },
    { key: 'documentKind', label: 'Belge Tipi', sortable: true },
    { key: 'stepOrder', label: 'Adım', sortable: true },
    { key: 'approverUserId', label: 'Onaycı', sortable: true },
    { key: 'amountRange', label: 'Tutar Aralığı' },
    { key: 'scope', label: 'Kapsam' },
    { key: 'isActive', label: 'Aktif', sortable: true },
  ], []);

  const range = getPagedRange(query.data, 1);

  function handleEdit(row: PurchaseApprovalRuleDto): void {
    setEditingId(row.id);
    setForm({
      ruleName: row.ruleName,
      documentKind: row.documentKind,
      stepOrder: row.stepOrder,
      approverUserId: row.approverUserId,
      department: row.department ?? null,
      projectCode: row.projectCode ?? null,
      currencyCode: row.currencyCode ?? null,
      minAmount: row.minAmount ?? null,
      maxAmount: row.maxAmount ?? null,
      isActive: row.isActive,
      requireAllPreviousSteps: row.requireAllPreviousSteps,
      description: row.description ?? null,
    });
  }

  function handleSave(): void {
    if (!form.ruleName.trim()) {
      toast.error('Kural adı zorunludur.');
      return;
    }
    if (!form.approverUserId || form.approverUserId <= 0) {
      toast.error('Onaycı kullanıcı ID zorunludur.');
      return;
    }
    if (form.maxAmount != null && form.minAmount != null && form.maxAmount < form.minAmount) {
      toast.error('Maksimum tutar minimum tutardan küçük olamaz.');
      return;
    }

    saveMutation.mutate({
      ...form,
      ruleName: form.ruleName.trim(),
      department: form.department?.trim() || null,
      projectCode: form.projectCode?.trim() || null,
      currencyCode: form.currencyCode?.trim().toUpperCase() || null,
      description: form.description?.trim() || null,
    });
  }

  return (
    <OpsListPageShell
      eyebrow="WMS / SATINALMA"
      title="Satınalma Onay Kuralları"
      description="Tedarikçi teklifleri ve satınalma siparişleri için tutar, kapsam ve adım bazlı onay akışlarını tanımlayın."
    >
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border bg-card/90 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold">{editingId ? 'Kuralı Düzenle' : 'Yeni Onay Kuralı'}</h3>
            <p className="text-sm text-muted-foreground">Belge tipi ve tutar aralığına göre sıralı onay adımları oluşturulur.</p>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-semibold">
              Kural Adı *
              <OpsInput value={form.ruleName} onChange={(event) => setForm((prev) => ({ ...prev, ruleName: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Belge Tipi *
              <select
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                value={form.documentKind}
                onChange={(event) => setForm((prev) => ({ ...prev, documentKind: event.target.value }))}
              >
                <option value="SupplierQuotation">Tedarikçi Teklifi</option>
                <option value="PurchaseOrder">Satınalma Siparişi</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Adım *
                <OpsInput type="number" min={1} value={form.stepOrder} onChange={(event) => setForm((prev) => ({ ...prev, stepOrder: toNumber(event.target.value, 1) }))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Onaycı User ID *
                <OpsInput type="number" min={1} value={form.approverUserId || ''} onChange={(event) => setForm((prev) => ({ ...prev, approverUserId: toNumber(event.target.value) }))} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Min Tutar
                <OpsInput type="number" value={form.minAmount ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, minAmount: event.target.value ? toNumber(event.target.value) : null }))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Max Tutar
                <OpsInput type="number" value={form.maxAmount ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, maxAmount: event.target.value ? toNumber(event.target.value) : null }))} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Departman
                <OpsInput value={form.department ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Proje
                <OpsInput value={form.projectCode ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, projectCode: event.target.value }))} />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-semibold">
              Para Birimi
              <OpsInput value={form.currencyCode ?? ''} placeholder="Boş ise tüm para birimleri" onChange={(event) => setForm((prev) => ({ ...prev, currencyCode: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Açıklama
              <OpsTextarea value={form.description ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              Aktif
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="size-4" />
                Kaydet
              </OpsActionButton>
              <OpsActionButton type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyApprovalRuleForm); }}>
                Temizle
              </OpsActionButton>
            </div>
          </div>
        </section>

        <PagedDataGrid<PurchaseApprovalRuleDto, ApprovalRuleColumnKey>
          variant="ops"
          pageKey={pageKey}
          columns={columns}
          rows={query.data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => {
            switch (columnKey) {
              case 'id': return row.id;
              case 'ruleName': return row.ruleName;
              case 'documentKind': return row.documentKind === 'SupplierQuotation' ? 'Tedarikçi Teklifi' : 'Satınalma Siparişi';
              case 'stepOrder': return row.stepOrder;
              case 'approverUserId': return `#${row.approverUserId}`;
              case 'amountRange': return `${formatAmountRange(row)} ${row.currencyCode || ''}`.trim();
              case 'scope': return [row.department, row.projectCode].filter(Boolean).join(' / ') || 'Genel';
              case 'isActive': return row.isActive ? 'Aktif' : 'Pasif';
              default: return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={pagedGrid.handleSort}
          isLoading={query.isLoading}
          isError={Boolean(query.error)}
          errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
          emptyText="Onay kuralı bulunamadı."
          showActionsColumn
          actionsHeaderLabel="İşlemler"
          renderActionsCell={(row) => (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                onClick={() => handleEdit(row)}
                aria-label="Düzenle"
                title="Düzenle"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 transition hover:border-rose-500/60 hover:bg-rose-500/15 dark:text-rose-300"
                onClick={() => deleteMutation.mutate(row.id)}
                disabled={deleteMutation.isPending}
                aria-label="Sil"
                title="Sil"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
          pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
          totalPages={Math.max(query.data?.totalPages ?? 1, 1)}
          hasPreviousPage={Boolean(query.data?.hasPreviousPage)}
          hasNextPage={Boolean(query.data?.hasNextPage)}
          onPreviousPage={pagedGrid.goToPreviousPage}
          onNextPage={pagedGrid.goToNextPage}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          paginationInfoText={`${range.from}-${range.to} / ${range.total} kayıt`}
          search={{
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: 'Kural, belge tipi, departman ara',
          }}
          refresh={{ onRefresh: () => { void query.refetch(); }, isLoading: query.isLoading, label: t('common.refresh') }}
          exportFileName="purchase-approval-rules"
          exportColumns={columns.map((column) => ({ key: column.key, label: column.label }))}
          exportRows={(query.data?.data ?? []).map((row) => ({
            id: row.id,
            ruleName: row.ruleName,
            documentKind: row.documentKind,
            stepOrder: row.stepOrder,
            approverUserId: row.approverUserId,
            amountRange: formatAmountRange(row),
            scope: [row.department, row.projectCode].filter(Boolean).join(' / ') || 'Genel',
            isActive: row.isActive ? 'Aktif' : 'Pasif',
          }))}
        />
      </div>
    </OpsListPageShell>
  );
}

export function PurchaseCreatePage({ kind }: { kind: PurchasePageKind }): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const params = useParams();
  const config = purchasePageConfigs[kind];
  const editingId = params.id && Number.isFinite(Number(params.id)) ? Number(params.id) : null;
  const isCommercial = kind === 'quotation' || kind === 'order';
  const isRfq = kind === 'rfq';
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [rfqSupplierLookupOpen, setRfqSupplierLookupOpen] = useState(false);
  const [stockLookupOpen, setStockLookupOpen] = useState(false);
  const [seriesLookupOpen, setSeriesLookupOpen] = useState(false);
  const [supplierLabel, setSupplierLabel] = useState('');
  const [rfqSupplierLabel, setRfqSupplierLabel] = useState('');
  const [stockLabel, setStockLabel] = useState('');
  const [seriesLabel, setSeriesLabel] = useState('');
  const [formState, setFormState] = useState({
    documentNo: '',
    documentSeriesDefinitionId: '',
    documentDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    deliveryDate: '',
    validUntil: '',
    currencyCode: 'TL',
    exchangeRate: '1',
    subject: '',
    supplierId: '',
    purchaseType: 'Yurtiçi',
    paymentTypeCode: '',
    department: '',
    projectCode: '',
    erpProjectCode: '',
    ozelKod1: '',
    ozelKod2: '',
    deliveryTerms: '',
    paymentTerms: '',
    generalDiscountRate: '0',
    generalDiscountAmount: '0',
    note1: '',
    note2: '',
    note3: '',
    message: '',
    description: '',
  });
  const [rfqSuppliers, setRfqSuppliers] = useState<Array<{ supplierId: number; label: string; email?: string | null }>>([]);
  const [lineDraft, setLineDraft] = useState<CreatePurchaseLineDto>(createEmptyLine);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [lines, setLines] = useState<CreatePurchaseLineDto[]>([]);

  useEffect(() => {
    setPageTitle(editingId ? `${config.createTitle} Düzenle` : config.createTitle);
    return () => setPageTitle(null);
  }, [config.createTitle, editingId, setPageTitle]);

  const detailQuery = useQuery({
    queryKey: ['purchase', config.endpoint, 'detail', editingId],
    queryFn: () => purchaseApi.getById(config.endpoint, editingId ?? 0),
    enabled: Boolean(editingId),
  });

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) return;

    const detailLines = Array.isArray(detail.lines) ? detail.lines as CreatePurchaseLineDto[] : [];
    const detailSuppliers = Array.isArray(detail.suppliers)
      ? detail.suppliers as Array<{ supplierId: number; supplierErpCode?: string | null; supplierNameSnapshot?: string | null; email?: string | null }>
      : [];
    const supplierErpCode = typeof detail.supplierErpCode === 'string' ? detail.supplierErpCode : '';
    const supplierName = typeof detail.supplierNameSnapshot === 'string' ? detail.supplierNameSnapshot : '';

    setFormState((prev) => ({
      ...prev,
      documentNo: String(detail[config.documentNoField] ?? ''),
      documentSeriesDefinitionId: detail.documentSeriesDefinitionId ? String(detail.documentSeriesDefinitionId) : '',
      documentDate: detail[config.documentDateField] ? new Date(String(detail[config.documentDateField])).toISOString().slice(0, 10) : prev.documentDate,
      dueDate: detail.dueDate || detail.neededDate ? new Date(String(detail.dueDate ?? detail.neededDate)).toISOString().slice(0, 10) : '',
      deliveryDate: detail.deliveryDate ? new Date(String(detail.deliveryDate)).toISOString().slice(0, 10) : '',
      validUntil: detail.validUntil ? new Date(String(detail.validUntil)).toISOString().slice(0, 10) : '',
      currencyCode: String(detail.currencyCode ?? 'TL'),
      exchangeRate: String(detail.exchangeRate ?? '1'),
      subject: String(detail.subject ?? ''),
      supplierId: detail.supplierId ? String(detail.supplierId) : '',
      purchaseType: String(detail.purchaseType ?? prev.purchaseType),
      paymentTypeCode: String(detail.paymentTypeCode ?? ''),
      department: String(detail.department ?? ''),
      projectCode: String(detail.projectCode ?? ''),
      erpProjectCode: String(detail.erpProjectCode ?? ''),
      ozelKod1: String(detail.ozelKod1 ?? ''),
      ozelKod2: String(detail.ozelKod2 ?? ''),
      deliveryTerms: String(detail.deliveryTerms ?? ''),
      paymentTerms: String(detail.paymentTerms ?? ''),
      generalDiscountRate: String(detail.generalDiscountRate ?? '0'),
      generalDiscountAmount: String(detail.generalDiscountAmount ?? '0'),
      note1: typeof detail.notes === 'object' && detail.notes ? String((detail.notes as Record<string, unknown>).note1 ?? '') : '',
      note2: typeof detail.notes === 'object' && detail.notes ? String((detail.notes as Record<string, unknown>).note2 ?? '') : '',
      note3: typeof detail.notes === 'object' && detail.notes ? String((detail.notes as Record<string, unknown>).note3 ?? '') : '',
      message: String(detail.message ?? ''),
      description: String(detail.description ?? ''),
    }));

    setLines(detailLines.map((line) => ({
      ...createEmptyLine(),
      ...line,
      stockId: line.stockId ?? null,
      productCode: line.productCode ?? '',
      productName: line.productName ?? '',
      unit: line.unit ?? '',
      description1: line.description1 ?? null,
      description2: line.description2 ?? null,
      description3: line.description3 ?? null,
    })));
    setSupplierLabel(supplierErpCode || supplierName ? `${supplierErpCode} - ${supplierName}` : '');
    setRfqSuppliers(detailSuppliers.map((supplier) => ({
      supplierId: supplier.supplierId,
      label: `${supplier.supplierErpCode || ''} - ${supplier.supplierNameSnapshot || ''}`.trim(),
      email: supplier.email ?? null,
    })));
    setSeriesLabel('');
  }, [config.documentDateField, config.documentNoField, detailQuery.data]);

  const mutation = useMutation({
    mutationFn: (dto: CreatePurchaseDocumentDto) => editingId
      ? purchaseApi.update(config.endpoint, editingId, dto)
      : purchaseApi.create(config.endpoint, dto),
    onSuccess: () => {
      toast.success(editingId ? 'Satınalma belgesi güncellendi.' : 'Satınalma belgesi kaydedildi.');
      navigate(config.listPath);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const totals = useMemo(() => {
    const lineTotals = lines.reduce((acc, line) => {
      const calculated = calculateLineTotals(line);
      return {
        net: acc.net + calculated.net,
        vat: acc.vat + calculated.vat,
        total: acc.total + calculated.total,
      };
    }, { net: 0, vat: 0, total: 0 });

    const generalDiscountAmount = Math.max(0, toNumber(formState.generalDiscountAmount));
    const generalDiscountRate = Math.max(0, toNumber(formState.generalDiscountRate));
    const headerDiscount = isCommercial
      ? Math.min(lineTotals.net, generalDiscountAmount + (lineTotals.net * generalDiscountRate / 100))
      : 0;
    const net = Math.max(0, lineTotals.net - headerDiscount);

    return {
      subTotal: net,
      vatTotal: lineTotals.vat,
      grandTotal: net + lineTotals.vat,
    };
  }, [formState.generalDiscountAmount, formState.generalDiscountRate, isCommercial, lines]);

  function openNewLineDialog(): void {
    setEditingLineIndex(null);
    setLineDraft(createEmptyLine());
    setStockLabel('');
    setLineDialogOpen(true);
  }

  function openEditLineDialog(index: number): void {
    const line = lines[index];
    if (!line) return;
    setEditingLineIndex(index);
    setLineDraft({
      ...createEmptyLine(),
      ...line,
      stockId: line.stockId ?? null,
      productCode: line.productCode ?? '',
      productName: line.productName ?? '',
      unit: line.unit ?? '',
    });
    setStockLabel(line.productCode || line.productName ? `${line.productCode || '-'} - ${line.productName}` : '');
    setLineDialogOpen(true);
  }

  function resetLineDialog(): void {
    setLineDialogOpen(false);
    setEditingLineIndex(null);
    setLineDraft(createEmptyLine());
    setStockLabel('');
  }

  function normalizeLineDraft(): CreatePurchaseLineDto | null {
    if (!lineDraft.productName.trim()) {
      toast.error('Satır için stok veya ürün adı seçilmelidir.');
      return null;
    }

    if (!lineDraft.quantity || lineDraft.quantity <= 0) {
      toast.error('Miktar sıfırdan büyük olmalıdır.');
      return null;
    }

    if (!validateDiscounts(lineDraft)) {
      toast.error('Satır iskontoları 100 veya üzeri olamaz.');
      return null;
    }

    return {
      ...lineDraft,
      productCode: lineDraft.productCode?.trim() || null,
      productName: lineDraft.productName.trim(),
      unit: lineDraft.unit?.trim() || null,
      description1: lineDraft.description1?.trim() || null,
      description2: lineDraft.description2?.trim() || null,
      description3: lineDraft.description3?.trim() || null,
      erpProjectCode: lineDraft.erpProjectCode?.trim() || null,
    };
  }

  function handleSaveLine(options: { keepOpen?: boolean } = {}): void {
    const normalizedLine = normalizeLineDraft();
    if (!normalizedLine) return;

    setLines((prev) => {
      if (editingLineIndex != null) {
        return prev.map((line, index) => index === editingLineIndex ? normalizedLine : line);
      }
      return [...prev, normalizedLine];
    });

    if (options.keepOpen) {
      setEditingLineIndex(null);
      setLineDraft(createEmptyLine());
      setStockLabel('');
      return;
    }

    resetLineDialog();
  }

  function handleCloneLine(index: number): void {
    const line = lines[index];
    if (!line) return;
    setLines((prev) => [...prev, { ...line }]);
  }

  function handleRemoveLine(index: number): void {
    setLines((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleAddRfqSupplier(customer: CustomerLookup): void {
    setRfqSuppliers((prev) => {
      if (prev.some((item) => item.supplierId === customer.id)) {
        return prev;
      }
      return [...prev, { supplierId: customer.id, label: buildSupplierLabel(customer), email: customer.acik1 || null }];
    });
    setRfqSupplierLabel('');
  }

  function handleSubmit(): void {
    const currencyCode = formState.currencyCode.trim().toUpperCase() || 'TL';
    const exchangeRate = Number(formState.exchangeRate || '0');
    if (currencyCode !== 'TL' && exchangeRate <= 0) {
      toast.error('Dövizli belgelerde kur değeri sıfırdan büyük olmalıdır.');
      return;
    }

    if (isCommercial && !formState.supplierId) {
      toast.error('Satınalma teklif/sipariş için ERP eşleşmeli tedarikçi seçilmelidir.');
      return;
    }

    if (isRfq && rfqSuppliers.length === 0) {
      toast.error('RFQ göndermek için en az bir ERP eşleşmeli tedarikçi seçilmelidir.');
      return;
    }

    if (lines.length === 0) {
      toast.error('Belgeye en az bir stok/kalem satırı eklenmelidir.');
      return;
    }

    if (isCommercial && (toNumber(formState.generalDiscountRate) < 0 || toNumber(formState.generalDiscountRate) >= 100)) {
      toast.error('Genel iskonto oranı 100 veya üzeri olamaz.');
      return;
    }

    mutation.mutate({
      [config.documentNoField]: formState.documentNo.trim() || null,
      [config.documentDateField]: formState.documentDate ? new Date(formState.documentDate).toISOString() : null,
      neededDate: kind === 'request' && formState.dueDate ? new Date(formState.dueDate).toISOString() : null,
      dueDate: kind === 'rfq' && formState.dueDate ? new Date(formState.dueDate).toISOString() : null,
      validUntil: kind === 'quotation' && formState.validUntil ? new Date(formState.validUntil).toISOString() : null,
      deliveryDate: kind === 'order' && formState.deliveryDate ? new Date(formState.deliveryDate).toISOString() : null,
      currencyCode,
      exchangeRate,
      subject: formState.subject.trim() || null,
      supplierId: formState.supplierId ? Number(formState.supplierId) : null,
      purchaseType: isCommercial ? formState.purchaseType.trim() || null : null,
      paymentTypeCode: isCommercial ? formState.paymentTypeCode.trim() || null : null,
      documentSeriesDefinitionId: formState.documentSeriesDefinitionId ? Number(formState.documentSeriesDefinitionId) : null,
      department: formState.department.trim() || null,
      projectCode: formState.projectCode.trim() || null,
      erpProjectCode: formState.erpProjectCode.trim() || null,
      ozelKod1: isCommercial ? formState.ozelKod1.trim() || null : null,
      ozelKod2: isCommercial ? formState.ozelKod2.trim() || null : null,
      deliveryTerms: isCommercial ? formState.deliveryTerms.trim() || null : null,
      paymentTerms: isCommercial ? formState.paymentTerms.trim() || null : null,
      generalDiscountRate: isCommercial ? toNumber(formState.generalDiscountRate) : null,
      generalDiscountAmount: isCommercial ? toNumber(formState.generalDiscountAmount) : null,
      message: isRfq ? formState.message.trim() || null : null,
      description: formState.description.trim() || null,
      lines,
      suppliers: isRfq ? rfqSuppliers.map((supplier) => ({ supplierId: supplier.supplierId, email: supplier.email ?? null })) : [],
      exchangeRates: [{ currency: currencyCode, exchangeRate, exchangeRateDate: new Date().toISOString(), isOfficial: true }],
      notes: isCommercial ? { note1: formState.note1 || null, note2: formState.note2 || null, note3: formState.note3 || null } : undefined,
    } as CreatePurchaseDocumentDto);
  }

  return (
    <OpsFormPageShell
      eyebrow="WMS / SATINALMA"
      title={config.createTitle}
      description={config.description}
      actions={
        <OpsActionButton type="button" variant="primary" onClick={handleSubmit} disabled={mutation.isPending}>
          <Save className="size-4" />
          {t('common.save')}
        </OpsActionButton>
      }
    >
      <div className="wms-ops-form space-y-5">
        <section className="rounded-2xl border border-slate-300/80 bg-white/95 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            {isCommercial ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  <Building2 className="size-4 text-cyan-600" />
                  Tedarikçi
                </div>
                <PagedLookupDialog<CustomerLookup>
                  variant="ops"
                  open={supplierLookupOpen}
                  onOpenChange={setSupplierLookupOpen}
                  title="ERP eşleşmeli tedarikçi seç"
                  value={supplierLabel}
                  placeholder="Tedarikçi cari seç"
                  searchPlaceholder="Cari kodu veya unvan ara"
                  emptyText="ERP eşleşmeli tedarikçi bulunamadı."
                  queryKey={['purchase', 'supplier-lookup']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    lookupApi.getCustomersPaged({
                      pageNumber,
                      pageSize,
                      search,
                      filters: [{ column: 'IsErpIntegrated', operator: 'Equals', value: 'true' }],
                    }, { signal })
                  }
                  getKey={(customer) => customer.id.toString()}
                  getLabel={buildSupplierLabel}
                  onSelect={(customer) => {
                    setSupplierLabel(buildSupplierLabel(customer));
                    setFormState((prev) => ({ ...prev, supplierId: String(customer.id) }));
                  }}
                />
              </div>
            ) : null}

            {isRfq ? (
              <div className="space-y-2 lg:col-span-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  <Building2 className="size-4 text-cyan-600" />
                  RFQ Gönderilecek Tedarikçiler
                </div>
                <PagedLookupDialog<CustomerLookup>
                  variant="ops"
                  open={rfqSupplierLookupOpen}
                  onOpenChange={setRfqSupplierLookupOpen}
                  title="RFQ tedarikçisi seç"
                  value={rfqSupplierLabel}
                  placeholder="ERP eşleşmeli cari ekle"
                  searchPlaceholder="Cari kodu veya unvan ara"
                  emptyText="ERP eşleşmeli tedarikçi bulunamadı."
                  queryKey={['purchase', 'rfq-supplier-lookup']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    lookupApi.getCustomersPaged({
                      pageNumber,
                      pageSize,
                      search,
                      filters: [{ column: 'IsErpIntegrated', operator: 'Equals', value: 'true' }],
                    }, { signal })
                  }
                  getKey={(customer) => customer.id.toString()}
                  getLabel={buildSupplierLabel}
                  onSelect={handleAddRfqSupplier}
                />
                {rfqSuppliers.length ? (
                  <div className="flex flex-wrap gap-2">
                    {rfqSuppliers.map((supplier) => (
                      <button
                        key={supplier.supplierId}
                        type="button"
                        className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        onClick={() => setRfqSuppliers((prev) => prev.filter((item) => item.supplierId !== supplier.supplierId))}
                      >
                        {supplier.label} x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <label className={`grid gap-2 text-sm font-bold ${isCommercial ? '' : 'lg:col-span-2'}`}>
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                <FileText className="size-4 text-blue-600" />
                Konu
              </span>
              <OpsInput value={formState.subject} placeholder="Belgenin konusu veya kısa açıklaması" onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))} />
            </label>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,0.88fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-300/80 bg-white/95 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CreditCard className="size-5" />
              </span>
              <div>
                <h3 className="font-black">Finansal</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Para birimi ve ödeme</p>
              </div>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                Para Birimi *
                <OpsInput value={formState.currencyCode} onChange={(event) => setFormState((prev) => ({ ...prev, currencyCode: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Kur *
                <OpsInput type="number" step="0.0001" value={formState.exchangeRate} onChange={(event) => setFormState((prev) => ({ ...prev, exchangeRate: event.target.value }))} />
              </label>
              {isCommercial ? (
                <label className="grid gap-2 text-sm font-bold">
                  Ödeme Tipi
                  <OpsInput value={formState.paymentTypeCode} onChange={(event) => setFormState((prev) => ({ ...prev, paymentTypeCode: event.target.value }))} />
                </label>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300/80 bg-white/95 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <CalendarDays className="size-5" />
              </span>
              <div>
                <h3 className="font-black">Tip & Tarihler</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Belge tarihi ve süreç tarihi</p>
              </div>
            </div>
            <div className="grid gap-4">
              {isCommercial ? (
                <label className="grid gap-2 text-sm font-bold">
                  Satınalma Tipi
                  <OpsInput value={formState.purchaseType} onChange={(event) => setFormState((prev) => ({ ...prev, purchaseType: event.target.value }))} />
                </label>
              ) : null}
              <label className="grid gap-2 text-sm font-bold">
                Belge Tarihi
                <OpsInput type="date" value={formState.documentDate} onChange={(event) => setFormState((prev) => ({ ...prev, documentDate: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                {kind === 'request' ? 'İhtiyaç Tarihi' : kind === 'rfq' ? 'Son Teklif Tarihi' : kind === 'quotation' ? 'Geçerlilik Tarihi' : 'Teslim Tarihi'}
                <OpsInput
                  type="date"
                  value={kind === 'quotation' ? formState.validUntil : kind === 'order' ? formState.deliveryDate : formState.dueDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormState((prev) => kind === 'quotation'
                      ? { ...prev, validUntil: value }
                      : kind === 'order'
                        ? { ...prev, deliveryDate: value }
                        : { ...prev, dueDate: value });
                  }}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300/80 bg-white/95 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                <FileText className="size-5" />
              </span>
              <div>
                <h3 className="font-black">Belge Açıklaması</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Seri, proje ve özel kodlar</p>
              </div>
            </div>
            <div className="grid gap-4">
              {isCommercial ? (
                <label className="grid gap-2 text-sm font-bold">
                  Belge Seri Tanımı
                  <PagedLookupDialog<WmsDocumentSeriesDefinitionPagedRowDto>
                    variant="ops"
                    open={seriesLookupOpen}
                    onOpenChange={setSeriesLookupOpen}
                    title="Satınalma belge serisi seç"
                    value={seriesLabel}
                    placeholder="Seri seçildiğinde belge no önerilir"
                    searchPlaceholder="Seri kodu veya adı ara"
                    emptyText="Satınalma için aktif belge serisi bulunamadı."
                    queryKey={['purchase', 'document-series', kind]}
                    fetchPage={({ pageNumber, pageSize, search }) => {
                      const operationType = getPurchaseSeriesOperationType(kind);
                      return documentSeriesManagementApi.getDefinitionsPaged({
                        pageNumber,
                        pageSize,
                        search,
                        filters: [
                          { column: 'OperationType', operator: 'Equals', value: operationType },
                          { column: 'IsActive', operator: 'Equals', value: 'true' },
                        ],
                        filterLogic: 'and',
                      });
                    }}
                    getKey={(definition) => definition.id.toString()}
                    getLabel={buildSeriesLabel}
                    onSelect={(definition) => {
                      const preview = buildSeriesPreview(definition);
                      setSeriesLabel(buildSeriesLabel(definition));
                      setFormState((prev) => ({
                        ...prev,
                        documentSeriesDefinitionId: String(definition.id),
                        documentNo: prev.documentNo || preview,
                      }));
                    }}
                  />
                </label>
              ) : null}
              <label className="grid gap-2 text-sm font-bold">
                {config.documentNoLabel}
                <OpsInput value={formState.documentNo} onChange={(event) => setFormState((prev) => ({ ...prev, documentNo: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                <span className="inline-flex items-center gap-2">
                  <Folder className="size-4 text-sky-600" />
                  Proje Kodu
                </span>
                <OpsInput value={formState.projectCode} onChange={(event) => setFormState((prev) => ({ ...prev, projectCode: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Departman
                <OpsInput value={formState.department} onChange={(event) => setFormState((prev) => ({ ...prev, department: event.target.value }))} />
              </label>
              {isCommercial ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">
                    Özel Kod 1
                    <OpsInput value={formState.ozelKod1} onChange={(event) => setFormState((prev) => ({ ...prev, ozelKod1: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Özel Kod 2
                    <OpsInput value={formState.ozelKod2} onChange={(event) => setFormState((prev) => ({ ...prev, ozelKod2: event.target.value }))} />
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white/95 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/90 px-5 py-4 dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
                  <Box className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-black tracking-tight">Satınalma Satırları</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {lines.length > 0 ? `${lines.length} kalem eklendi` : 'Henüz stok/kalem satırı eklenmedi'}
                  </p>
                </div>
              </div>
              <OpsActionButton type="button" variant="primary" onClick={openNewLineDialog}>
                <Plus className="size-4" />
                Satır Ekle
              </OpsActionButton>
            </div>

            {lines.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <span className="inline-flex size-20 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/[0.04]">
                  <Box className="size-9" />
                </span>
                <div>
                  <h4 className="text-xl font-black">Henüz satır eklenmedi</h4>
                  <p className="mt-2 max-w-md text-sm font-medium text-muted-foreground">
                    Teklif veya siparişe birden fazla stok eklemek için Satır Ekle butonunu kullanın. Her kalem miktar, fiyat, iskonto, KDV ve açıklamalarıyla ayrı izlenir.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-slate-100/90 text-xs uppercase tracking-wide text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Stok / Kalem</th>
                      <th className="px-4 py-3 text-right">Miktar</th>
                      <th className="px-4 py-3 text-right">Birim Fiyat</th>
                      <th className="px-4 py-3 text-right">İskonto</th>
                      <th className="px-4 py-3 text-right">KDV</th>
                      <th className="px-4 py-3 text-right">Satır Toplamı</th>
                      <th className="px-4 py-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => {
                      const calculated = calculateLineTotals(line);
                      return (
                        <tr key={`${line.productCode || line.productName}-${index}`} className="border-t border-slate-200/80 transition hover:bg-sky-50/50 dark:border-white/10 dark:hover:bg-white/[0.04]">
                          <td className="px-4 py-3">
                            <div className="font-black text-slate-900 dark:text-white">{line.productName}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                              <span>{line.productCode || 'Kod yok'}</span>
                              <span>•</span>
                              <span>{line.unit || 'Birim yok'}</span>
                              {line.description1 ? <span>• {line.description1}</span> : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">{line.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">{formatMoney(line.unitPrice, formState.currencyCode)}</td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-muted-foreground">{line.discount1}/{line.discount2}/{line.discount3}</td>
                          <td className="px-4 py-3 text-right font-bold">%{line.vatRate}</td>
                          <td className="px-4 py-3 text-right font-black text-cyan-700 dark:text-cyan-300">{formatMoney(calculated.total, formState.currencyCode)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-400 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
                                onClick={() => openEditLineDialog(index)}
                                aria-label="Satırı düzenle"
                                title="Satırı düzenle"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
                                onClick={() => handleCloneLine(index)}
                                aria-label="Satırı kopyala"
                                title="Satırı kopyala"
                              >
                                <Plus className="size-4" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:border-rose-400 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300"
                                onClick={() => handleRemoveLine(index)}
                                aria-label="Satırı sil"
                                title="Satırı sil"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white/95 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
              <div className="flex items-center gap-3 border-b border-slate-200/80 bg-slate-50/90 px-5 py-4 dark:border-white/10 dark:bg-white/[0.05]">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Calculator className="size-5" />
                </span>
                <div>
                  <h3 className="font-black">Özet</h3>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Genel toplam analizi</p>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {isCommercial ? (
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <label className="grid gap-2 text-sm font-semibold">
                        Genel İskonto %
                        <OpsInput type="number" min={0} max={99.9999} step="0.01" value={formState.generalDiscountRate} onChange={(event) => setFormState((prev) => ({ ...prev, generalDiscountRate: event.target.value }))} />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Genel İskonto Tutarı
                        <OpsInput type="number" min={0} step="0.01" value={formState.generalDiscountAmount} onChange={(event) => setFormState((prev) => ({ ...prev, generalDiscountAmount: event.target.value }))} />
                      </label>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
                      Genel iskonto satırlar toplamına uygulanır; satır iskontoları ayrıca korunur.
                    </div>
                  </div>
                ) : null}

                <dl className="space-y-3 border-t pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-muted-foreground">Kalem Sayısı</dt>
                    <dd className="font-black">{lines.length}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-muted-foreground">Ara Toplam</dt>
                    <dd className="font-mono font-black tabular-nums">{formatMoney(totals.subTotal, formState.currencyCode)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-muted-foreground">Toplam KDV</dt>
                    <dd className="font-mono font-black tabular-nums">{formatMoney(totals.vatTotal, formState.currencyCode)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-4 text-base">
                    <dt className="font-black">Genel Toplam</dt>
                    <dd className="font-mono text-xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">
                      {formatMoney(totals.grandTotal, formState.currencyCode)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 rounded-xl border bg-card/90 p-5 lg:grid-cols-2">
          {isRfq ? (
            <label className="grid gap-2 text-sm font-semibold lg:col-span-2">
              Tedarikçilere Gönderilecek Mesaj
              <OpsTextarea rows={4} value={formState.message} onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))} />
            </label>
          ) : null}
          {isCommercial ? (
            <>
              <label className="grid gap-2 text-sm font-semibold">
                Teslimat Şartları
                <OpsInput value={formState.deliveryTerms} onChange={(event) => setFormState((prev) => ({ ...prev, deliveryTerms: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Ödeme Şartları
                <OpsInput value={formState.paymentTerms} onChange={(event) => setFormState((prev) => ({ ...prev, paymentTerms: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Belge Notu 1
                <OpsInput value={formState.note1} onChange={(event) => setFormState((prev) => ({ ...prev, note1: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Belge Notu 2
                <OpsInput value={formState.note2} onChange={(event) => setFormState((prev) => ({ ...prev, note2: event.target.value }))} />
              </label>
            </>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold lg:col-span-2">
            Açıklama
            <OpsTextarea rows={5} value={formState.description} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} />
          </label>
        </section>

        <Dialog open={lineDialogOpen} onOpenChange={(open) => { if (!open) resetLineDialog(); else setLineDialogOpen(true); }}>
          <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
            <DialogHeader className="border-b bg-slate-50/90 px-6 py-5 dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
                    {editingLineIndex == null ? <Plus className="size-5" /> : <Pencil className="size-5" />}
                  </span>
                  <div>
                    <DialogTitle className="text-xl font-black">
                      {editingLineIndex == null ? 'Satır Ekle' : 'Satırı Düzenle'}
                    </DialogTitle>
                    <p className="text-sm font-medium text-muted-foreground">
                      Stok, miktar, fiyat, iskonto, KDV ve açıklama bilgilerini tek kalem için girin.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm transition hover:text-foreground"
                  onClick={resetLineDialog}
                  aria-label="Kapat"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-6 py-5">
              <div className="grid gap-5">
                <div className="rounded-2xl border bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <label className="grid gap-2 text-sm font-bold">
                    Stok *
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                      <PagedLookupDialog<StockLookup>
                        variant="ops"
                        open={stockLookupOpen}
                        onOpenChange={setStockLookupOpen}
                        title="Stok seç"
                        value={stockLabel}
                        placeholder="RII_STOK içinden stok seç"
                        searchPlaceholder="Stok kodu veya adı ara"
                        emptyText="Stok bulunamadı."
                        queryKey={['purchase', 'stock-lookup']}
                        fetchPage={({ pageNumber, pageSize, search, signal }) =>
                          lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                        }
                        getKey={(stock) => stock.id.toString()}
                        getLabel={buildStockLabel}
                        onSelect={(stock) => {
                          setStockLabel(buildStockLabel(stock));
                          setLineDraft((prev) => ({
                            ...prev,
                            stockId: stock.id,
                            productCode: stock.stokKodu,
                            productName: stock.stokAdi,
                            unit: stock.olcuBr1,
                          }));
                        }}
                      />
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-black text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200"
                        onClick={() => setStockLookupOpen(true)}
                      >
                        <Search className="size-4" />
                        Stok Ara
                      </button>
                    </div>
                  </label>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold">
                      Stok Kodu
                      <OpsInput value={lineDraft.productCode ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, productCode: event.target.value }))} />
                    </label>
                    <label className="grid gap-2 text-sm font-bold">
                      Stok Adı / Kalem Adı *
                      <OpsInput value={lineDraft.productName} onChange={(event) => setLineDraft((prev) => ({ ...prev, productName: event.target.value }))} />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <label className="grid gap-2 text-sm font-bold">
                    Miktar *
                    <OpsInput type="number" step="0.0001" value={lineDraft.quantity} onChange={(event) => setLineDraft((prev) => ({ ...prev, quantity: toNumber(event.target.value, 1) }))} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Birim
                    <OpsInput value={lineDraft.unit ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, unit: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Birim Fiyat
                    <OpsInput type="number" step="0.0001" value={lineDraft.unitPrice} onChange={(event) => setLineDraft((prev) => ({ ...prev, unitPrice: toNumber(event.target.value) }))} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    KDV %
                    <OpsInput type="number" step="0.01" value={lineDraft.vatRate} onChange={(event) => setLineDraft((prev) => ({ ...prev, vatRate: toNumber(event.target.value) }))} />
                  </label>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {[1, 2, 3].map((discountIndex) => {
                    const key = `discount${discountIndex}` as 'discount1' | 'discount2' | 'discount3';
                    return (
                      <label key={key} className="grid gap-2 text-sm font-bold">
                        {discountIndex}. İskonto %
                        <OpsInput
                          type="number"
                          min={0}
                          max={99.9999}
                          step="0.01"
                          value={lineDraft[key]}
                          onChange={(event) => setLineDraft((prev) => ({ ...prev, [key]: toNumber(event.target.value) }))}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <label className="grid gap-2 text-sm font-bold">
                    Açıklama 1
                    <OpsInput value={lineDraft.description1 ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, description1: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Açıklama 2
                    <OpsInput value={lineDraft.description2 ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, description2: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Açıklama 3
                    <OpsInput value={lineDraft.description3 ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, description3: event.target.value }))} />
                  </label>
                </div>

                <div className="rounded-2xl border bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-muted-foreground">Satır Önizleme</span>
                    <strong className="font-mono text-lg text-cyan-700 dark:text-cyan-300">
                      {formatMoney(calculateLineTotals(lineDraft).total, formState.currencyCode)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/90 px-6 py-4 dark:border-white/10 dark:bg-white/[0.05]">
              <OpsActionButton type="button" variant="secondary" onClick={resetLineDialog}>
                İptal
              </OpsActionButton>
              <div className="flex flex-wrap gap-2">
                {editingLineIndex == null ? (
                  <OpsActionButton type="button" variant="secondary" onClick={() => handleSaveLine({ keepOpen: true })}>
                    <Plus className="size-4" />
                    Kaydet ve Yeni Satır
                  </OpsActionButton>
                ) : null}
                <OpsActionButton type="button" variant="primary" onClick={() => handleSaveLine()}>
                  <Save className="size-4" />
                  {editingLineIndex == null ? 'Satırı Ekle' : 'Satırı Güncelle'}
                </OpsActionButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OpsFormPageShell>
  );
}
