import { type ReactElement, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, PauseCircle, Plus, Printer, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { barcodeDesignerApi } from '../api/barcode-designer.api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function BarcodeDesignerListPage(): ReactElement {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.print-management');

  const templatesQuery = useQuery({
    queryKey: ['barcode-designer-templates'],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplates({ signal }),
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpBarcodeDesigner', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const templates = templatesQuery.data?.data ?? [];

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
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.erp', { defaultValue: 'Missing translation' }) }, { label: t('sidebar.erpBarcodeDesigner', { defaultValue: 'Missing translation' }), isActive: true }]} />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('sidebar.erp', { defaultValue: 'Missing translation' })}</Badge>
              <Badge variant="secondary">{t('barcodeDesigner.list.badge')}</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{t('sidebar.erpBarcodeDesigner', { defaultValue: 'Missing translation' })}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t('barcodeDesigner.list.description')}
              </p>
            </div>
          </div>
          {permission.canCreate ? (
          <Button onClick={() => navigate('/erp/barcode-designer/new')}>
            <Plus className="mr-2 size-4" />
            {t('barcodeDesigner.list.create')}
          </Button>
          ) : null}
        </div>
      </section>

      <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
        <CardHeader>
          <CardTitle>{t('barcodeDesigner.list.tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('barcodeDesigner.list.code')}</TableHead>
                <TableHead>{t('barcodeDesigner.list.name')}</TableHead>
                <TableHead>{t('barcodeDesigner.list.type')}</TableHead>
                <TableHead>{t('barcodeDesigner.list.size')}</TableHead>
                <TableHead>DPI</TableHead>
                <TableHead>{t('barcodeDesigner.list.draft')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id ?? template.templateCode}>
                  <TableCell className="font-medium">{template.templateCode}</TableCell>
                  <TableCell>{template.displayName}</TableCell>
                  <TableCell>{template.labelType}</TableCell>
                  <TableCell>{template.width} x {template.height} mm</TableCell>
                  <TableCell>{template.dpi}</TableCell>
                  <TableCell>{template.draftVersionId ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? t('common.active') : t('common.passive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {permission.canUpdate ? (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/erp/barcode-designer/${template.id}/edit`)}>
                          <Edit3 className="mr-2 size-4" />
                          {t('common.edit')}
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/erp/barcode-designer/${template.id}/print`)}>
                        <Printer className="mr-2 size-4" />
                        {t('sidebar.erpBarcodePrint')}
                      </Button>
                      {permission.canUpdate ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ id: Number(template.id), isActive: !template.isActive })}
                        >
                          <PauseCircle className="mr-2 size-4" />
                          {template.isActive ? t('common.deactivate') : t('common.activate')}
                        </Button>
                      ) : null}
                      {permission.canDelete ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(Number(template.id))}
                        >
                          <Trash2 className="mr-2 size-4" />
                          {t('common.delete')}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-slate-500">
                    {t('barcodeDesigner.list.empty')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
