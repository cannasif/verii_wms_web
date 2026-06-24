import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePPackagesByHeader } from '../../hooks/usePPackagesByHeader';
import { useCreatePPackage } from '../../hooks/useCreatePPackage';
import { useDeletePPackage } from '../../hooks/useDeletePPackage';
import { pPackageFormSchema, type PPackageFormData, type PPackageDto } from '../../types/package';
import {
  OPS_FIELD_CLASS,
  OPS_SELECT_CONTENT_CLASS,
  OpsActionButton,
  OpsFieldShell,
  OpsFormMessage,
  OpsInput,
  PageActionBar,
  PageState,
} from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Step2PackageFormProps {
  packingHeaderId: number;
  canManagePackages: boolean;
  canDeletePackages: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
  variant?: 'default' | 'ops';
}

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Open':
      return 'bg-yellow-100 text-yellow-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'Loaded':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getOpsPackageStatusClass = (status: string): string => {
  switch (status) {
    case 'Open':
    case 'Packing':
      return 'wms-ops-flag-badge--warn';
    case 'Packed':
    case 'Closed':
    case 'Sealed':
      return 'wms-ops-flag-badge--on';
    case 'Cancelled':
      return 'wms-ops-flag-badge--danger';
    default:
      return 'wms-ops-flag-badge--off';
  }
};

const preventNumberInputWheel = (event: React.WheelEvent<HTMLInputElement>): void => {
  event.currentTarget.blur();
};

export function Step2PackageForm({
  packingHeaderId,
  canManagePackages,
  canDeletePackages,
  onPrevious,
  onNext,
  onSaveAndExit,
  variant = 'default',
}: Step2PackageFormProps): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const isOps = variant === 'ops';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PPackageDto | null>(null);

  const { data: packagesData, isLoading: isLoadingPackages } = usePPackagesByHeader(packingHeaderId);
  const createMutation = useCreatePPackage();
  const deleteMutation = useDeletePPackage();

  const packages = packagesData || [];

  const schema = useMemo(() => pPackageFormSchema(t), [t]);

  const form = useForm<PPackageFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      packingHeaderId,
      packageNo: '',
      packageType: 'Box',
      barcode: '',
      length: undefined,
      width: undefined,
      height: undefined,
      volume: undefined,
      netWeight: undefined,
      tareWeight: undefined,
      grossWeight: undefined,
      isMixed: false,
      status: 'Open',
    },
  });

  useEffect(() => {
    if (packingHeaderId && packingHeaderId > 0) {
      form.setValue('packingHeaderId', packingHeaderId);
    }
  }, [form, packingHeaderId]);

  const handleOpenDialog = (pkg?: PPackageDto): void => {
    if (!canManagePackages) return;
    if (pkg) {
      setEditingPackage(pkg);
      const packageNoValue = pkg.packageNo || pkg.barcode || '';
      form.reset({
        packingHeaderId: packingHeaderId || pkg.packingHeaderId,
        packageNo: packageNoValue,
        packageType: pkg.packageType,
        barcode: packageNoValue,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        volume: pkg.volume,
        netWeight: pkg.netWeight,
        tareWeight: pkg.tareWeight,
        grossWeight: pkg.grossWeight,
        isMixed: pkg.isMixed,
        status: pkg.status,
      });
    } else {
      setEditingPackage(null);
      if (!packingHeaderId || packingHeaderId <= 0) {
        toast.error(t('package.form.packingHeaderIdRequired'));
        return;
      }
      form.reset({
        packingHeaderId,
        packageNo: '',
        packageType: 'Box',
        barcode: '',
        length: undefined,
        width: undefined,
        height: undefined,
        volume: undefined,
        netWeight: undefined,
        tareWeight: undefined,
        grossWeight: undefined,
        isMixed: false,
        status: 'Open',
      });
    }
    setPackageDialogOpen(true);
  };

  const handleSubmit = async (data: PPackageFormData): Promise<void> => {
    try {
      if (editingPackage) {
        toast.success(t('package.wizard.packageUpdated'));
        setPackageDialogOpen(false);
        form.reset();
      } else {
        const packageNoValue = (data.packageNo || '').trim();
        
        if (!packageNoValue) {
          toast.error(t('package.form.packageNoRequired'));
          form.setFocus('packageNo');
          return;
        }

        const headerIdToUse = data.packingHeaderId || packingHeaderId;
        
        if (!headerIdToUse || headerIdToUse <= 0) {
          toast.error(t('package.form.packingHeaderIdRequired'));
          return;
        }
        
        await createMutation.mutateAsync({
          packingHeaderId: headerIdToUse,
          packageNo: packageNoValue,
          packageType: data.packageType || 'Box',
          barcode: packageNoValue,
          length: data.length,
          width: data.width,
          height: data.height,
          volume: data.volume,
          netWeight: data.netWeight,
          tareWeight: data.tareWeight,
          grossWeight: data.grossWeight,
          isMixed: data.isMixed ?? false,
          status: data.status || 'Open',
        });
        
        toast.success(t('package.wizard.packageAdded'));
        setPackageDialogOpen(false);
        setEditingPackage(null);
        form.reset({
          packingHeaderId: headerIdToUse,
          packageNo: '',
          packageType: 'Box',
          barcode: '',
          length: undefined,
          width: undefined,
          height: undefined,
          volume: undefined,
          netWeight: undefined,
          tareWeight: undefined,
          grossWeight: undefined,
          isMixed: false,
          status: 'Open',
        });
      }
    } catch (error) {
      console.error('Package create error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : t('package.wizard.packageError');
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (packageId: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(packageId);
      toast.success(t('package.wizard.packageDeleted'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.wizard.packageDeleteError')
      );
    }
  };

  const handleNextStep = (): void => {
    if (packages.length === 0) {
      toast.error(t('package.wizard.atLeastOnePackage'));
      return;
    }
    onNext();
  };

  return (
    <div className={cn('space-y-6', isOps && 'wms-ops-form wms-ops-list')}>
      <Card className={cn(isOps && 'wms-ops-order-step')}>
        <CardHeader>
          <PageActionBar
            title={<CardTitle>{t('package.wizard.step2.title')}</CardTitle>}
            description={<CardDescription>{t('package.wizard.step2.description')}</CardDescription>}
            actions={
              isOps ? (
                <OpsActionButton type="button" variant="primary" onClick={() => handleOpenDialog()} disabled={!canManagePackages}>
                  <Plus className="size-4 mr-2" />
                  {t('package.wizard.step2.addPackage')}
                </OpsActionButton>
              ) : (
                <Button onClick={() => handleOpenDialog()} disabled={!canManagePackages}>
                  <Plus className="size-4 mr-2" />
                  {t('package.wizard.step2.addPackage')}
                </Button>
              )
            }
          />
        </CardHeader>
        <CardContent>
          {isLoadingPackages ? (
            <PageState tone="loading" title={t('common.loading')} compact />
          ) : packages.length > 0 ? (
            isOps ? (
              <div className="wms-ops-transfer-detail__table-wrap rounded-none border-0">
                <table className="wms-ops-transfer-detail__table">
                  <thead>
                    <tr>
                      <th>{t('package.detail.packageNo')}</th>
                      <th>{t('package.detail.packageType')}</th>
                      <th>{t('package.detail.barcode')}</th>
                      <th>{t('package.detail.status')}</th>
                      <th>{t('package.detail.netWeight')}</th>
                      <th>{t('package.detail.grossWeight')}</th>
                      <th>{t('package.detail.volume')}</th>
                      <th>{t('package.detail.isMixed')}</th>
                      <th>{t('package.detail.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td className="font-medium">{pkg.packageNo}</td>
                        <td>
                          <Badge variant="outline">{pkg.packageType}</Badge>
                        </td>
                        <td>{pkg.barcode || '-'}</td>
                        <td>
                          {isOps ? (
                            <span className={cn('wms-ops-flag-badge', getOpsPackageStatusClass(pkg.status))}>
                              {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                            </span>
                          ) : (
                            <Badge className={getStatusBadgeColor(pkg.status)}>
                              {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                            </Badge>
                          )}
                        </td>
                        <td>{pkg.netWeight || '-'}</td>
                        <td>{pkg.grossWeight || '-'}</td>
                        <td>{pkg.volume || '-'}</td>
                        <td>{pkg.isMixed ? t('common.yes') : t('common.no')}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="h-8 px-2"
                              onClick={() => handleOpenDialog(pkg)}
                              disabled={!canManagePackages}
                            >
                              <Edit className="size-4" />
                            </OpsActionButton>
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="h-8 px-2"
                              onClick={() => handleDelete(pkg.id)}
                              disabled={!canDeletePackages || deleteMutation.isPending}
                            >
                              <Trash2 className="size-4" />
                            </OpsActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('package.detail.packageNo')}</TableHead>
                    <TableHead>{t('package.detail.packageType')}</TableHead>
                    <TableHead>{t('package.detail.barcode')}</TableHead>
                    <TableHead>{t('package.detail.status')}</TableHead>
                    <TableHead>{t('package.detail.netWeight')}</TableHead>
                    <TableHead>{t('package.detail.grossWeight')}</TableHead>
                    <TableHead>{t('package.detail.volume')}</TableHead>
                    <TableHead>{t('package.detail.isMixed')}</TableHead>
                    <TableHead>{t('package.detail.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.packageNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pkg.packageType}</Badge>
                      </TableCell>
                      <TableCell>{pkg.barcode || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(pkg.status)}>
                          {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{pkg.netWeight || '-'}</TableCell>
                      <TableCell>{pkg.grossWeight || '-'}</TableCell>
                      <TableCell>{pkg.volume || '-'}</TableCell>
                      <TableCell>{pkg.isMixed ? t('common.yes') : t('common.no')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(pkg)}
                            disabled={!canManagePackages}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pkg.id)}
                            disabled={!canDeletePackages || deleteMutation.isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <PageState
              tone="empty"
              title={t('package.wizard.step2.noPackages')}
              description={t('package.wizard.step2.description')}
              compact
              className={isOps ? 'wms-ops-wizard-empty' : undefined}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={canManagePackages && packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent
          className={cn(
            'max-w-2xl max-h-[90vh] overflow-y-auto',
            isOps &&
              'wms-ops-form wms-ops-detail-dialog gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-2xl'
          )}
        >
          <DialogHeader className={cn(isOps && 'wms-ops-detail-dialog__header border-b px-6 py-4')}>
            <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : undefined}>
              {editingPackage
                ? t('package.wizard.step2.editPackage')
                : t('package.wizard.step2.addPackage')}
            </DialogTitle>
            <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
              {editingPackage
                ? t('package.wizard.step2.editPackageDescription')
                : t('package.wizard.step2.addPackageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className={cn('space-y-4', isOps && 'px-6 py-5')}
            >
              <fieldset disabled={!canManagePackages} className={!canManagePackages ? 'pointer-events-none opacity-75' : undefined}>
              <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', isOps && 'wms-ops-form')}>
                <FormField
                  control={form.control}
                  name="packageNo"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>
                        {t('package.form.packageNo')} {isOps ? <span className="wms-ops-required">*</span> : <span className="text-destructive">*</span>}
                      </FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                              form.setValue('barcode', value);
                            }}
                          />
                        ) : (
                          <Input
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                              form.setValue('barcode', value);
                            }}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.packageType')}</FormLabel>
                      {isOps ? (
                        <OpsFieldShell>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                              <SelectItem value="Box">{t('package.packageType.box')}</SelectItem>
                              <SelectItem value="Pallet">{t('package.packageType.pallet')}</SelectItem>
                              <SelectItem value="Bag">{t('package.packageType.bag')}</SelectItem>
                              <SelectItem value="Custom">{t('package.packageType.custom')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </OpsFieldShell>
                      ) : (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Box">{t('package.packageType.box')}</SelectItem>
                            <SelectItem value="Pallet">{t('package.packageType.pallet')}</SelectItem>
                            <SelectItem value="Bag">{t('package.packageType.bag')}</SelectItem>
                            <SelectItem value="Custom">{t('package.packageType.custom')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.length')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.width')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.height')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.volume')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="netWeight"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.netWeight')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tareWeight"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.tareWeight')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grossWeight"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.grossWeight')}</FormLabel>
                      <FormControl>
                        {isOps ? (
                          <OpsInput
                            type="number"
                            step="0.01"
                            min={0}
                            onWheel={preventNumberInputWheel}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        )}
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.status')}</FormLabel>
                      {isOps ? (
                        <OpsFieldShell>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                              <SelectItem value="Draft">{t('package.packageStatus.draft')}</SelectItem>
                              <SelectItem value="Open">{t('package.packageStatus.open')}</SelectItem>
                              <SelectItem value="Packing">{t('package.packageStatus.packing')}</SelectItem>
                              <SelectItem value="Packed">{t('package.packageStatus.packed')}</SelectItem>
                              <SelectItem value="Closed">{t('package.packageStatus.closed')}</SelectItem>
                              <SelectItem value="Released">{t('package.packageStatus.released')}</SelectItem>
                              <SelectItem value="Staged">{t('package.packageStatus.staged')}</SelectItem>
                              <SelectItem value="Transferred">{t('package.packageStatus.transferred')}</SelectItem>
                              <SelectItem value="Shipped">{t('package.packageStatus.shipped')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </OpsFieldShell>
                      ) : (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Draft">{t('package.packageStatus.draft')}</SelectItem>
                            <SelectItem value="Open">{t('package.packageStatus.open')}</SelectItem>
                            <SelectItem value="Packing">{t('package.packageStatus.packing')}</SelectItem>
                            <SelectItem value="Packed">{t('package.packageStatus.packed')}</SelectItem>
                            <SelectItem value="Closed">{t('package.packageStatus.closed')}</SelectItem>
                            <SelectItem value="Released">{t('package.packageStatus.released')}</SelectItem>
                            <SelectItem value="Staged">{t('package.packageStatus.staged')}</SelectItem>
                            <SelectItem value="Transferred">{t('package.packageStatus.transferred')}</SelectItem>
                            <SelectItem value="Shipped">{t('package.packageStatus.shipped')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {fieldMessage}
                    </FormItem>
                  )}
                />

              </div>

              <DialogFooter className={cn(isOps && 'wms-ops-actions border-t px-6 py-4')}>
                {isOps ? (
                  <>
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setPackageDialogOpen(false);
                        form.reset();
                      }}
                    >
                      {t('common.cancel')}
                    </OpsActionButton>
                    <OpsActionButton
                      type="submit"
                      variant="primary"
                      disabled={!canManagePackages || createMutation.isPending}
                    >
                      {createMutation.isPending ? t('common.saving') : t('common.save')}
                    </OpsActionButton>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPackageDialogOpen(false);
                        form.reset();
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={!canManagePackages || createMutation.isPending}>
                      {createMutation.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  </>
                )}
              </DialogFooter>
              </fieldset>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className={cn('flex justify-between gap-2', isOps && 'wms-ops-actions border-t pt-6')}>
        {isOps ? (
          <>
            <OpsActionButton type="button" variant="secondary" onClick={onPrevious}>
              {t('package.wizard.previousStep')}
            </OpsActionButton>
            <div className="flex gap-3">
              <OpsActionButton type="button" variant="secondary" onClick={onSaveAndExit}>
                {t('package.wizard.saveAndExit')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="primary"
                onClick={handleNextStep}
                disabled={packages.length === 0 || !canManagePackages}
              >
                {t('package.wizard.saveAndContinue')}
              </OpsActionButton>
            </div>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onPrevious}>
              {t('package.wizard.previousStep')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onSaveAndExit}>
                {t('package.wizard.saveAndExit')}
              </Button>
              <Button onClick={handleNextStep} disabled={packages.length === 0 || !canManagePackages}>
                {t('package.wizard.saveAndContinue')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
