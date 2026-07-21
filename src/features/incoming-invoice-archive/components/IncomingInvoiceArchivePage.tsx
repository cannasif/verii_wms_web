import { type ChangeEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Download, FileSearch, FileText, FileUp, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { SelectItem } from '@/components/ui/select';
import { OpsActionButton, OpsListPageShell, OpsSelect, OpsTextarea } from '@/components/shared';
import { MasterDataOpsFormField, MasterDataOpsGuidance, MasterDataOpsSection, MasterDataOpsStatGrid } from '@/features/shared';
import { useUIStore } from '@/stores/ui-store';
import { incomingInvoiceArchiveApi } from '../api/incoming-invoice-archive.api';
import type { IncomingInvoiceDetail, IncomingInvoiceKind, ELogoPostboxCompany } from '../types/incoming-invoice-archive.types';

const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

function extractUuid(value: string): string {
  return value.match(UUID_REGEX)?.[0]?.toUpperCase() ?? '';
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Safari can cancel the download if the object URL is revoked immediately
  // after a programmatic click. Keep it alive briefly and clean it up later.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function ensurePdfBlob(blob: Blob): Promise<void> {
  const contentType = blob.type.toLowerCase();
  if (contentType.includes('application/pdf')) {
    return;
  }

  const signature = await blob.slice(0, 5).text();
  if (signature === '%PDF-') {
    return;
  }

  const text = await blob.text();
  try {
    const parsed = JSON.parse(text) as { message?: string; exceptionMessage?: string };
    throw new Error(parsed.message || parsed.exceptionMessage || text);
  } catch (error) {
    if (error instanceof Error && !(error instanceof SyntaxError)) {
      throw error;
    }
    throw new Error(text || 'PDF indirilemedi.');
  }
}

function openPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    downloadBlob(blob, fileName);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatAmount(value?: number | null, currency?: string): string {
  if (value == null) {
    return '-';
  }

  return `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency ?? ''}`.trim();
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR');
}

export function IncomingInvoiceArchivePage(): ReactElement {
  const { t } = useTranslation(['incoming-invoice-archive', 'common']);
  const { setPageTitle } = useUIStore();
  const [companyKey, setCompanyKey] = useState('');
  const [invoiceKind, setInvoiceKind] = useState<IncomingInvoiceKind>('Automatic');
  const [uuidInput, setUuidInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [lastResult, setLastResult] = useState<{ uuid: string; company?: ELogoPostboxCompany; fileName: string } | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<IncomingInvoiceDetail | null>(null);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageTitle(t('title'));
  }, [setPageTitle, t]);

  const companiesQuery = useQuery({
    queryKey: ['incoming-invoice-archive', 'companies'],
    queryFn: incomingInvoiceArchiveApi.getCompanies,
  });

  const companies = companiesQuery.data ?? [];
  const selectedCompany = companies.find((company) => company.key === companyKey);
  const configuredCount = companies.filter((company) => company.isConfigured).length;
  const resolvedUuid = useMemo(() => extractUuid(uuidInput), [uuidInput]);

  useEffect(() => {
    if (!companyKey && companies.length > 0) {
      setCompanyKey(companies.find((company) => company.isConfigured)?.key ?? companies[0].key);
    }
  }, [companies, companyKey]);

  const handleDownload = async (): Promise<void> => {
    if (!companyKey) {
      toast.error(t('messages.companyRequired'));
      return;
    }
    if (!resolvedUuid) {
      toast.error(t('messages.uuidRequired'));
      return;
    }

    setIsDownloading(true);
    try {
      const result = await incomingInvoiceArchiveApi.downloadInvoicePdf({
        companyKey,
        uuid: resolvedUuid,
        invoiceKind,
      });
      const fileName = result.fileName || `${resolvedUuid}.pdf`;
      await ensurePdfBlob(result.blob);
      openPdf(result.blob, fileName);
      downloadBlob(result.blob, fileName);
      setLastResult({ uuid: resolvedUuid, company: selectedCompany, fileName });
      toast.success(t('messages.downloaded'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadXml = async (): Promise<void> => {
    if (!companyKey) {
      toast.error(t('messages.companyRequired'));
      return;
    }
    if (!resolvedUuid) {
      toast.error(t('messages.uuidRequired'));
      return;
    }

    setIsDownloadingXml(true);
    try {
      const result = await incomingInvoiceArchiveApi.downloadInvoiceXml({
        companyKey,
        uuid: resolvedUuid,
        invoiceKind,
      });
      downloadBlob(result.blob, result.fileName || `${resolvedUuid}.xml`);
      toast.success(t('messages.xmlDownloaded'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.xmlDownloadFailed'));
    } finally {
      setIsDownloadingXml(false);
    }
  };

  const handleDetailLookup = async (): Promise<void> => {
    if (!companyKey) {
      toast.error(t('messages.companyRequired'));
      return;
    }
    if (!resolvedUuid) {
      toast.error(t('messages.uuidRequired'));
      return;
    }

    setIsLoadingDetail(true);
    try {
      const detail = await incomingInvoiceArchiveApi.getInvoiceDetail({
        companyKey,
        uuid: resolvedUuid,
        invoiceKind,
      });
      setInvoiceDetail(detail);
      toast.success(t('messages.detailLoaded'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.detailFailed'));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleXmlFileSelected = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const uuid = extractUuid(content);

      if (!uuid) {
        toast.error(t('messages.xmlFileNoUuid'));
        return;
      }

      setUuidInput(uuid);
      setInvoiceDetail(null);
      setLastResult(null);
      toast.success(t('messages.xmlFileLoaded', { uuid }));
    } catch {
      toast.error(t('messages.xmlFileReadFailed'));
    }
  };

  return (
    <OpsListPageShell
      className="wms-ops-erp-skin"
      eyebrow={(
        <>
          <span>{t('common:sidebar.operationsGroup')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('common:sidebar.inboundOperationsGroup')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('title')}</span>
        </>
      )}
      title={t('title')}
      description={t('description')}
      actions={(
        <div className="flex flex-wrap gap-2">
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => void handleDetailLookup()}
            disabled={isLoadingDetail || companiesQuery.isLoading || !resolvedUuid || !companyKey}
          >
            <FileSearch className="size-4" />
            {isLoadingDetail ? t('actions.loadingDetail') : t('actions.detail')}
          </OpsActionButton>
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => void handleDownloadXml()}
            disabled={isDownloadingXml || companiesQuery.isLoading || !resolvedUuid || !companyKey}
          >
            <FileText className="size-4" />
            {isDownloadingXml ? t('actions.downloadingXml') : t('actions.downloadXml')}
          </OpsActionButton>
          <OpsActionButton
            type="button"
            onClick={() => void handleDownload()}
            disabled={isDownloading || companiesQuery.isLoading || !resolvedUuid || !companyKey}
          >
            {isDownloading ? t('actions.downloading') : t('actions.download')}
          </OpsActionButton>
        </div>
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[0.58fr_0.42fr]">
        <MasterDataOpsSection
          title={t('form.title')}
          subtitle={t('form.description')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <MasterDataOpsFormField label={t('form.company')}>
              <OpsSelect
                value={companyKey}
                onValueChange={setCompanyKey}
                disabled={companiesQuery.isLoading}
                placeholder={t('form.companyPlaceholder')}
              >
                {companies.map((company) => (
                  <SelectItem key={company.key} value={company.key}>
                    <span className="flex items-center gap-2">
                      <span>{company.displayName}</span>
                      {!company.isConfigured ? <Badge variant="outline">{t('status.notConfigured')}</Badge> : null}
                    </span>
                  </SelectItem>
                ))}
              </OpsSelect>
            </MasterDataOpsFormField>

            <MasterDataOpsFormField label={t('form.invoiceKind')}>
              <OpsSelect value={invoiceKind} onValueChange={(value) => setInvoiceKind(value as IncomingInvoiceKind)}>
                <SelectItem value="Automatic">{t('invoiceKind.automatic')}</SelectItem>
                <SelectItem value="EInvoice">{t('invoiceKind.eInvoice')}</SelectItem>
                <SelectItem value="EArchive">{t('invoiceKind.eArchive')}</SelectItem>
              </OpsSelect>
            </MasterDataOpsFormField>
          </div>

          <MasterDataOpsFormField label={t('form.uuidOrXml')} className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{t('form.uuidFileHint')}</p>
              <input
                ref={xmlFileInputRef}
                type="file"
                accept=".xml,.ubl,.txt,application/xml,text/xml,text/plain"
                className="hidden"
                onChange={(event) => void handleXmlFileSelected(event)}
              />
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => xmlFileInputRef.current?.click()}
              >
                <FileUp className="size-4" />
                {t('actions.readXmlFile')}
              </OpsActionButton>
            </div>
            <OpsTextarea
              rows={7}
              value={uuidInput}
              onChange={(event) => setUuidInput(event.target.value)}
              placeholder={t('form.uuidPlaceholder')}
            />
          </MasterDataOpsFormField>

          <div className="mt-4 grid gap-3 border border-dashed p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="wms-ops-prelabel-form-label">{t('form.resolvedUuid')}</div>
              <div className="mt-1 break-all font-mono text-sm font-semibold">{resolvedUuid || '-'}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <OpsActionButton type="button" variant="secondary" onClick={() => void handleDetailLookup()} disabled={isLoadingDetail || !resolvedUuid || !companyKey}>
                <Search className="size-4" />
                {isLoadingDetail ? t('actions.loadingDetail') : t('actions.detail')}
              </OpsActionButton>
              <OpsActionButton type="button" variant="secondary" onClick={() => void handleDownloadXml()} disabled={isDownloadingXml || !resolvedUuid || !companyKey}>
                <FileText className="size-4" />
                {isDownloadingXml ? t('actions.downloadingXml') : t('actions.downloadXml')}
              </OpsActionButton>
              <OpsActionButton type="button" onClick={() => void handleDownload()} disabled={isDownloading || !resolvedUuid || !companyKey}>
                <Download className="size-4" />
                {isDownloading ? t('actions.downloading') : t('actions.run')}
              </OpsActionButton>
            </div>
          </div>
        </MasterDataOpsSection>

        <div className="space-y-5">
          <MasterDataOpsSection
            title={t('companies.title')}
            subtitle={t('companies.description')}
          >
            <MasterDataOpsStatGrid
              items={[
                { label: t('companies.total'), value: companies.length },
                { label: t('companies.configured'), value: configuredCount },
              ]}
            />

            <div className="mt-4 space-y-2">
              {companies.map((company) => (
                <div key={company.key} className="flex items-center justify-between border px-3 py-2 text-sm">
                  <div>
                    <div className="font-semibold">{company.displayName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{company.vkn} · {company.source}</div>
                  </div>
                  <Badge variant={company.isConfigured ? 'default' : 'outline'}>
                    {company.isConfigured ? t('status.ready') : t('status.notConfigured')}
                  </Badge>
                </div>
              ))}
            </div>
          </MasterDataOpsSection>

          <MasterDataOpsGuidance
            title={t('guidance.title')}
            lines={[
              t('guidance.description'),
              t('guidance.secretNote'),
            ]}
          />

          {lastResult ? (
            <MasterDataOpsSection
              title={t('result.title')}
              subtitle={t('result.description')}
            >
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  <span>{t('result.company')}: {lastResult.company?.displayName ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 break-all">
                  <FileText className="size-4" />
                  <span>{t('result.uuid')}: {lastResult.uuid}</span>
                </div>
                <div className="flex items-center gap-2 break-all">
                  <Download className="size-4" />
                  <span>{t('result.file')}: {lastResult.fileName}</span>
                </div>
              </div>
            </MasterDataOpsSection>
          ) : null}
        </div>
      </div>

      {invoiceDetail ? (
        <div className="mt-5 space-y-5">
          <MasterDataOpsSection
            title={t('detail.title')}
            subtitle={t('detail.description', { method: invoiceDetail.sourceMethod })}
          >
            <MasterDataOpsStatGrid
              className="md:grid-cols-4"
              items={[
                { label: t('detail.invoiceNo'), value: invoiceDetail.header.invoiceNumber || '-' },
                { label: t('detail.issueDate'), value: formatDate(invoiceDetail.header.issueDate) },
                { label: t('detail.lineCount'), value: invoiceDetail.lines.length },
                { label: t('detail.payableAmount'), value: formatAmount(invoiceDetail.header.payableAmount, invoiceDetail.header.currencyCode) },
              ]}
            />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="wms-ops-surface-card p-4">
                <div className="wms-ops-surface-label text-muted-foreground">{t('detail.supplier')}</div>
                <div className="mt-2 text-base font-semibold">{invoiceDetail.supplier.name || '-'}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{invoiceDetail.supplier.vknOrTckn || '-'}</div>
                <div className="mt-2 text-sm text-muted-foreground">{invoiceDetail.supplier.addressLine || '-'}</div>
              </div>
              <div className="wms-ops-surface-card p-4">
                <div className="wms-ops-surface-label text-muted-foreground">{t('detail.customer')}</div>
                <div className="mt-2 text-base font-semibold">{invoiceDetail.customer.name || '-'}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{invoiceDetail.customer.vknOrTckn || '-'}</div>
                <div className="mt-2 text-sm text-muted-foreground">{invoiceDetail.customer.addressLine || '-'}</div>
              </div>
            </div>
          </MasterDataOpsSection>

          <MasterDataOpsSection
            title={t('lines.title')}
            subtitle={t('lines.description')}
          >
            <div className="wms-ops-surface-table-wrap overflow-x-auto">
              <table className="min-w-full divide-y divide-[color-mix(in_oklab,var(--wms-ops-accent)_18%,transparent)] text-sm">
                <thead className="wms-ops-surface-table-head bg-[var(--wms-ops-card-bg)] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left">{t('lines.stock')}</th>
                    <th className="px-3 py-3 text-left">{t('lines.descriptionColumn')}</th>
                    <th className="px-3 py-3 text-right">{t('lines.quantity')}</th>
                    <th className="px-3 py-3 text-right">{t('lines.unitPrice')}</th>
                    <th className="px-3 py-3 text-right">{t('lines.tax')}</th>
                    <th className="px-3 py-3 text-right">{t('lines.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color-mix(in_oklab,var(--wms-ops-accent)_18%,transparent)]">
                  {invoiceDetail.lines.map((line, index) => (
                    <tr key={`${line.lineId}-${index}`}>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs font-semibold">{line.stockCode || '-'}</div>
                        <div className="text-muted-foreground">{line.stockName || '-'}</div>
                      </td>
                      <td className="max-w-[320px] px-3 py-3 text-muted-foreground">{line.description || '-'}</td>
                      <td className="px-3 py-3 text-right font-mono">{line.quantity ?? '-'} {line.unitCode}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatAmount(line.unitPrice, invoiceDetail.header.currencyCode)}</td>
                      <td className="px-3 py-3 text-right font-mono">%{line.taxRate ?? '-'} / {formatAmount(line.taxAmount, invoiceDetail.header.currencyCode)}</td>
                      <td className="px-3 py-3 text-right font-mono font-semibold">{formatAmount(line.lineExtensionAmount, invoiceDetail.header.currencyCode)}</td>
                    </tr>
                  ))}
                  {invoiceDetail.lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">{t('lines.empty')}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </MasterDataOpsSection>

          <MasterDataOpsSection
            title={t('taxes.title')}
            subtitle={t('taxes.description')}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {invoiceDetail.taxes.map((tax, index) => (
                <div key={`${tax.taxName}-${index}`} className="wms-ops-surface-card p-4">
                  <div className="wms-ops-surface-label">{tax.taxName || t('taxes.tax')}</div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    {t('taxes.rate')}: %{tax.percent ?? '-'}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {t('taxes.base')}: {formatAmount(tax.taxableAmount, invoiceDetail.header.currencyCode)}
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold">
                    {t('taxes.amount')}: {formatAmount(tax.taxAmount, invoiceDetail.header.currencyCode)}
                  </div>
                </div>
              ))}
              {invoiceDetail.taxes.length === 0 ? (
                <div className="wms-ops-surface-card p-4 text-sm text-muted-foreground">
                  {t('taxes.empty')}
                </div>
              ) : null}
            </div>
          </MasterDataOpsSection>
        </div>
      ) : null}
    </OpsListPageShell>
  );
}
