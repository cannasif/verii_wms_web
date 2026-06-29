import { type ReactElement, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, PauseCircle, Plus, Printer, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { MasterDataOpsErpEyebrow, masterDataOpsGridColumn } from '@/features/shared';
import { useUIStore } from '@/stores/ui-store';
import { barcodeDesignerApi } from '../api/barcode-designer.api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { getPagedRange } from '@/lib/paged';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import type { BarcodeTemplate } from '../types/barcode-designer-editor.types';

type TemplateColumnKey = 'code' | 'name' | 'type' | 'size' | 'dpi' | 'draft' | 'status' | 'actions';

function mapTemplateSortBy(value: TemplateColumnKey): string {
  switch (value) {
    case 'code':
      return 'TemplateCode';
    case 'type':
      return 'LabelType';
    case 'size':
      return 'Width';
    case 'dpi':
      return 'Dpi';
    case 'status':
      return 'IsActive';
    case 'name':
    default:
      return 'DisplayName';
  }
}

export function BarcodeDesignerListPage(): ReactElement {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.print-management');
  const pagedGrid = usePagedDataGrid<TemplateColumnKey>({
    pageKey: 'barcode-designer-templates',
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy: mapTemplateSortBy,
  });

  const templatesQuery = useQuery({
    queryKey: ['barcode-designer-templates', 'paged', pagedGrid.queryParams],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplatesPaged(pagedGrid.queryParams, { signal }),
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpBarcodeDesigner', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const templatesPage = templatesQuery.data?.data;
  const pagedRows = templatesPage?.data ?? [];
  const range = getPagedRange(templatesPage);

  const columns = useMemo<PagedDataGridColumn<TemplateColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('code', t('barcodeDesigner.list.code')),
      masterDataOpsGridColumn('name', t('barcodeDesigner.list.name')),
      masterDataOpsGridColumn('type', t('barcodeDesigner.list.type')),
      masterDataOpsGridColumn('size', t('barcodeDesigner.list.size')),
      masterDataOpsGridColumn('dpi', 'DPI'),
      masterDataOpsGridColumn('draft', t('barcodeDesigner.list.draft')),
      masterDataOpsGridColumn('status', t('common.status')),
      masterDataOpsGridColumn('actions', t('common.actions'), false),
    ],
    [t],
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await barcodeDesignerApi.deleteTemplate(id),
    onSuccess: (response) => {
      toast.success(response.message || t('barcodeDesigner.list.deleteSuccess'));
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-templates'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('barcodeDesigner.list.deleteError'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (params: { id: number; isActive: boolean }) => await barcodeDesignerApi.setTemplateActive(params.id, params.isActive),
    onSuccess: (response) => {
      toast.success(response.message || t('barcodeDesigner.list.statusUpdateSuccess'));
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-templates'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('barcodeDesigner.list.statusUpdateError'));
    },
  });

  return (
    <OpsListPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.erpBarcodeDesignerList')} />}
      title={t('sidebar.erpBarcodeDesigner', { defaultValue: 'Missing translation' })}
      description={t('barcodeDesigner.list.description')}
      actions={
        permission.canCreate ? (
          <OpsActionButton type="button" variant="primary" onClick={() => navigate('/erp/barcode-designer/new')}>
            <Plus className="size-3.5" aria-hidden />
            {t('barcodeDesigner.list.create')}
          </OpsActionButton>
        ) : null
      }
    >
      <PagedDataGrid<BarcodeTemplate, TemplateColumnKey>
        variant="ops"
        pageKey="barcode-designer-templates"
        columns={columns}
        rows={pagedRows}
        rowKey={(row) => row.id ?? row.templateCode}
        renderCell={(template, columnKey) => {
          switch (columnKey) {
            case 'code':
              return <span className="wms-ops-table-id-value font-mono text-xs">{template.templateCode}</span>;
            case 'name':
              return <span className="font-medium uppercase tracking-wide">{template.displayName}</span>;
            case 'type':
              return template.labelType;
            case 'size':
              return `${template.width} x ${template.height} mm`;
            case 'dpi':
              return template.dpi;
            case 'draft':
              return template.draftVersionId ?? '-';
            case 'status':
              return (
                <Badge variant="outline" className="wms-ops-code-badge rounded-none text-[0.625rem]">
                  {template.isActive ? t('common.active') : t('common.passive')}
                </Badge>
              );
            default:
              return null;
          }
        }}
        showActionsColumn
        actionsHeaderLabel={t('common.actions')}
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(template) => (
          <div className="wms-ops-row-actions flex flex-wrap justify-end gap-1">
            {permission.canUpdate ? (
              <Button variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => navigate(`/erp/barcode-designer/${template.id}/edit`)}>
                <Edit3 className="size-3" aria-hidden />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => navigate(`/erp/barcode-designer/${template.id}/print`)}>
              <Printer className="size-3" aria-hidden />
            </Button>
            {permission.canUpdate ? (
              <Button
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                onClick={() => toggleActiveMutation.mutate({ id: Number(template.id), isActive: !template.isActive })}
              >
                <PauseCircle className="size-3" aria-hidden />
              </Button>
            ) : null}
            {permission.canDelete ? (
              <Button variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => deleteMutation.mutate(Number(template.id))}>
                <Trash2 className="size-3" aria-hidden />
              </Button>
            ) : null}
          </div>
        )}
        isLoading={templatesQuery.isLoading}
        isError={Boolean(templatesQuery.error)}
        errorText={templatesQuery.error instanceof Error ? templatesQuery.error.message : t('common.error')}
        emptyText={t('common.noData')}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={pagedGrid.handleSort}
        pageSize={pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={templatesPage?.pageNumber ?? pagedGrid.pageNumber}
        totalPages={templatesPage?.totalPages ?? 1}
        hasPreviousPage={templatesPage?.hasPreviousPage ?? false}
        hasNextPage={templatesPage?.hasNextPage ?? false}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={t('common.paginationInfo', {
          current: range.from,
          total: range.to,
          totalCount: range.total,
          defaultValue: `${range.total}`,
        })}
        search={{
          ...pagedGrid.searchConfig,
          placeholder: t('common.search'),
        }}
        refresh={{
          onRefresh: () => void templatesQuery.refetch(),
          isLoading: templatesQuery.isLoading,
          label: t('common.refresh'),
        }}
      />
    </OpsListPageShell>
  );
}
