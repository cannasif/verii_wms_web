import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { purchaseApi, type PurchaseEndpoint } from '../api/purchase.api';
import type { CreatePurchaseDocumentDto, CreatePurchaseLineDto, PurchaseListRowDto } from '../types/purchase.types';

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
        renderActionsCell={(row) => (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`${config.listPath}/${row.id}/edit`);
            }}
            aria-label="Düzenle"
          >
            <Pencil className="size-4" />
          </button>
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

  function handleAddLine(): void {
    if (!lineDraft.productName.trim()) {
      toast.error('Satır için stok veya ürün adı seçilmelidir.');
      return;
    }

    if (!lineDraft.quantity || lineDraft.quantity <= 0) {
      toast.error('Miktar sıfırdan büyük olmalıdır.');
      return;
    }

    if (!validateDiscounts(lineDraft)) {
      toast.error('Satır iskontoları 100 veya üzeri olamaz.');
      return;
    }

    setLines((prev) => [...prev, {
      ...lineDraft,
      productCode: lineDraft.productCode?.trim() || null,
      productName: lineDraft.productName.trim(),
      unit: lineDraft.unit?.trim() || null,
      description1: lineDraft.description1?.trim() || null,
      description2: lineDraft.description2?.trim() || null,
      description3: lineDraft.description3?.trim() || null,
      erpProjectCode: lineDraft.erpProjectCode?.trim() || null,
    }]);
    setLineDraft(createEmptyLine());
    setStockLabel('');
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
        <section className="grid gap-4 rounded-xl border bg-card/90 p-5 xl:grid-cols-4">
          {isCommercial ? (
            <div className="grid gap-2 text-sm font-semibold xl:col-span-2">
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
              <span className="text-xs font-medium text-muted-foreground">
                WMS belge seri tanımı seçilirse satınalma teklif/sipariş numarası bu seriye göre izlenir.
              </span>
            </div>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            {config.documentNoLabel}
            <OpsInput value={formState.documentNo} onChange={(event) => setFormState((prev) => ({ ...prev, documentNo: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Belge Tarihi
            <OpsInput type="date" value={formState.documentDate} onChange={(event) => setFormState((prev) => ({ ...prev, documentDate: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
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
          <label className="grid gap-2 text-sm font-semibold">
            Para Birimi / Kur
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <OpsInput value={formState.currencyCode} onChange={(event) => setFormState((prev) => ({ ...prev, currencyCode: event.target.value }))} />
              <OpsInput type="number" step="0.0001" value={formState.exchangeRate} onChange={(event) => setFormState((prev) => ({ ...prev, exchangeRate: event.target.value }))} />
            </div>
          </label>

          {isCommercial ? (
            <div className="grid gap-2 text-sm font-semibold xl:col-span-2">
              ERP Eşleşmeli Tedarikçi
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
            <div className="grid gap-2 text-sm font-semibold xl:col-span-2">
              RFQ Gönderilecek Tedarikçiler
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

          <label className="grid gap-2 text-sm font-semibold xl:col-span-2">
            Konu
            <OpsInput value={formState.subject} onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Departman
            <OpsInput value={formState.department} onChange={(event) => setFormState((prev) => ({ ...prev, department: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Proje Kodu
            <OpsInput value={formState.projectCode} onChange={(event) => setFormState((prev) => ({ ...prev, projectCode: event.target.value }))} />
          </label>
          {isCommercial ? (
            <>
              <label className="grid gap-2 text-sm font-semibold">
                Satınalma Tipi
                <OpsInput value={formState.purchaseType} onChange={(event) => setFormState((prev) => ({ ...prev, purchaseType: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Ödeme Tipi
                <OpsInput value={formState.paymentTypeCode} onChange={(event) => setFormState((prev) => ({ ...prev, paymentTypeCode: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Özel Kod 1
                <OpsInput value={formState.ozelKod1} onChange={(event) => setFormState((prev) => ({ ...prev, ozelKod1: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Özel Kod 2
                <OpsInput value={formState.ozelKod2} onChange={(event) => setFormState((prev) => ({ ...prev, ozelKod2: event.target.value }))} />
              </label>
            </>
          ) : null}
        </section>

        <section className="grid gap-4 rounded-xl border bg-card/90 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_120px_140px_100px]">
              <div className="grid gap-2 text-sm font-semibold">
                Stok / Kalem
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
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Miktar
                <OpsInput type="number" step="0.0001" value={lineDraft.quantity} onChange={(event) => setLineDraft((prev) => ({ ...prev, quantity: toNumber(event.target.value, 1) }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Birim Fiyat
                <OpsInput type="number" step="0.0001" value={lineDraft.unitPrice} onChange={(event) => setLineDraft((prev) => ({ ...prev, unitPrice: toNumber(event.target.value) }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                KDV %
                <OpsInput type="number" step="0.01" value={lineDraft.vatRate} onChange={(event) => setLineDraft((prev) => ({ ...prev, vatRate: toNumber(event.target.value) }))} />
              </label>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {[1, 2, 3].map((discountIndex) => {
                const key = `discount${discountIndex}` as 'discount1' | 'discount2' | 'discount3';
                return (
                  <label key={key} className="grid gap-2 text-sm font-semibold">
                    İskonto {discountIndex} %
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

            <div className="grid gap-3 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                Açıklama 1
                <OpsInput value={lineDraft.description1 ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, description1: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Açıklama 2
                <OpsInput value={lineDraft.description2 ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, description2: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Açıklama 3
                <OpsInput value={lineDraft.description3 ?? ''} onChange={(event) => setLineDraft((prev) => ({ ...prev, description3: event.target.value }))} />
              </label>
            </div>

            <OpsActionButton type="button" variant="secondary" onClick={handleAddLine}>
              <Plus className="size-4" />
              Satır Ekle
            </OpsActionButton>

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Stok</th>
                    <th className="px-3 py-2 text-right">Miktar</th>
                    <th className="px-3 py-2 text-right">Birim Fiyat</th>
                    <th className="px-3 py-2 text-right">İsk.</th>
                    <th className="px-3 py-2 text-right">Toplam</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Henüz satır eklenmedi.</td>
                    </tr>
                  ) : lines.map((line, index) => {
                    const calculated = calculateLineTotals(line);
                    return (
                      <tr key={`${line.productCode || line.productName}-${index}`} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-semibold">{line.productName}</div>
                          <div className="text-xs text-muted-foreground">{line.productCode || '-'}</div>
                        </td>
                        <td className="px-3 py-2 text-right">{line.quantity} {line.unit}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(line.unitPrice, formState.currencyCode)}</td>
                        <td className="px-3 py-2 text-right">{line.discount1}/{line.discount2}/{line.discount3}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatMoney(calculated.total, formState.currencyCode)}</td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" className="rounded-lg p-2 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveLine(index)} aria-label="Satırı sil">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4 rounded-xl border bg-muted/30 p-4">
            <h3 className="font-semibold">Belge Özeti</h3>
            {isCommercial ? (
              <div className="grid gap-3">
                <label className="grid gap-2 text-sm font-semibold">
                  Genel İskonto %
                  <OpsInput type="number" min={0} max={99.9999} step="0.01" value={formState.generalDiscountRate} onChange={(event) => setFormState((prev) => ({ ...prev, generalDiscountRate: event.target.value }))} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Genel İskonto Tutarı
                  <OpsInput type="number" min={0} step="0.01" value={formState.generalDiscountAmount} onChange={(event) => setFormState((prev) => ({ ...prev, generalDiscountAmount: event.target.value }))} />
                </label>
              </div>
            ) : null}
            <div className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Ara Toplam</span><strong>{formatMoney(totals.subTotal, formState.currencyCode)}</strong></div>
              <div className="flex justify-between"><span>KDV</span><strong>{formatMoney(totals.vatTotal, formState.currencyCode)}</strong></div>
              <div className="flex justify-between text-base"><span>Genel Toplam</span><strong>{formatMoney(totals.grandTotal, formState.currencyCode)}</strong></div>
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
      </div>
    </OpsFormPageShell>
  );
}
