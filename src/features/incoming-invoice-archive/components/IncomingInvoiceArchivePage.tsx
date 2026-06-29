import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Building2, Download, FileText, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpsActionButton, OpsListPageShell, OpsTextarea } from '@/components/shared';
import { MasterDataOpsGuidance, MasterDataOpsSection, MasterDataOpsStatGrid } from '@/features/shared';
import { useUIStore } from '@/stores/ui-store';
import { incomingInvoiceArchiveApi } from '../api/incoming-invoice-archive.api';
import type { IncomingInvoiceKind, ELogoPostboxCompany } from '../types/incoming-invoice-archive.types';

const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

function extractUuid(value: string): string {
  return value.match(UUID_REGEX)?.[0]?.toUpperCase() ?? '';
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    downloadBlob(blob, 'incoming-invoice.pdf');
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function IncomingInvoiceArchivePage(): ReactElement {
  const { t } = useTranslation(['incoming-invoice-archive', 'common']);
  const { setPageTitle } = useUIStore();
  const [companyKey, setCompanyKey] = useState('');
  const [invoiceKind, setInvoiceKind] = useState<IncomingInvoiceKind>('Automatic');
  const [uuidInput, setUuidInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastResult, setLastResult] = useState<{ uuid: string; company?: ELogoPostboxCompany; fileName: string } | null>(null);

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
      openPdf(result.blob);
      downloadBlob(result.blob, fileName);
      setLastResult({ uuid: resolvedUuid, company: selectedCompany, fileName });
      toast.success(t('messages.downloaded'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.downloadFailed'));
    } finally {
      setIsDownloading(false);
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
        <OpsActionButton
          type="button"
          onClick={() => void handleDownload()}
          disabled={isDownloading || companiesQuery.isLoading || !resolvedUuid || !companyKey}
        >
          {isDownloading ? t('actions.downloading') : t('actions.download')}
        </OpsActionButton>
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[0.58fr_0.42fr]">
        <MasterDataOpsSection
          title={t('form.title')}
          subtitle={t('form.description')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="wms-ops-form-label">{t('form.company')}</span>
              <Select value={companyKey} onValueChange={setCompanyKey} disabled={companiesQuery.isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('form.companyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.key} value={company.key}>
                      <span className="flex items-center gap-2">
                        <span>{company.displayName}</span>
                        {!company.isConfigured ? <Badge variant="outline">{t('status.notConfigured')}</Badge> : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-2">
              <span className="wms-ops-form-label">{t('form.invoiceKind')}</span>
              <Select value={invoiceKind} onValueChange={(value) => setInvoiceKind(value as IncomingInvoiceKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">{t('invoiceKind.automatic')}</SelectItem>
                  <SelectItem value="EInvoice">{t('invoiceKind.eInvoice')}</SelectItem>
                  <SelectItem value="EArchive">{t('invoiceKind.eArchive')}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="wms-ops-form-label">{t('form.uuidOrXml')}</span>
            <OpsTextarea
              rows={7}
              value={uuidInput}
              onChange={(event) => setUuidInput(event.target.value)}
              placeholder={t('form.uuidPlaceholder')}
            />
          </label>

          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">{t('form.resolvedUuid')}</div>
              <div className="mt-1 break-all font-mono text-sm font-semibold">{resolvedUuid || '-'}</div>
            </div>
            <OpsActionButton type="button" onClick={() => void handleDownload()} disabled={isDownloading || !resolvedUuid || !companyKey}>
              <Search className="size-4" />
              {isDownloading ? t('actions.downloading') : t('actions.run')}
            </OpsActionButton>
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
                <div key={company.key} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
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
    </OpsListPageShell>
  );
}
