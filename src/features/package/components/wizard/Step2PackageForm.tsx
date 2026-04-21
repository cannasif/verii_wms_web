import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePPackagesByHeader } from '../../hooks/usePPackagesByHeader';
import { useCreatePPackage } from '../../hooks/useCreatePPackage';
import { useDeletePPackage } from '../../hooks/useDeletePPackage';
import { pPackageFormSchema, type PPackageFormData, type PPackageDto } from '../../types/package';
import { PageActionBar, PageState } from '@/components/shared';
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

interface Step2PackageFormProps {
  packingHeaderId: number;
  canManagePackages: boolean;
  canDeletePackages: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
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

export function Step2PackageForm({
  packingHeaderId,
  canManagePackages,
  canDeletePackages,
  onPrevious,
  onNext,
  onSaveAndExit,
}: Step2PackageFormProps): ReactElement {
  const { t } = useTranslation();
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
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <PageActionBar
            title={<CardTitle>{t('package.wizard.step2.title')}</CardTitle>}
            description={<CardDescription>{t('package.wizard.step2.description')}</CardDescription>}
            actions={
              <Button onClick={() => handleOpenDialog()} disabled={!canManagePackages}>
                <Plus className="size-4 mr-2" />
                {t('package.wizard.step2.addPackage')}
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {isLoadingPackages ? (
            <PageState tone="loading" title={t('common.loading')} compact />
          ) : packages.length > 0 ? (
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
          ) : (
            <PageState tone="empty" title={t('package.wizard.step2.noPackages')} compact />
          )}
        </CardContent>
      </Card>

      <Dialog open={canManagePackages && packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage
                ? t('package.wizard.step2.editPackage')
                : t('package.wizard.step2.addPackage')}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? t('package.wizard.step2.editPackageDescription')
                : t('package.wizard.step2.addPackageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <fieldset disabled={!canManagePackages} className={!canManagePackages ? 'pointer-events-none opacity-75' : undefined}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="packageNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('package.form.packageNo')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                            form.setValue('barcode', value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.packageType')}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.length')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.width')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.height')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.volume')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="netWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.netWeight')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tareWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.tareWeight')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grossWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.grossWeight')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.status')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Open">{t('package.packageStatus.open')}</SelectItem>
                          <SelectItem value="Closed">{t('package.packageStatus.closed')}</SelectItem>
                          <SelectItem value="Loaded">{t('package.packageStatus.loaded')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <DialogFooter>
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
              </DialogFooter>
              </fieldset>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between gap-2">
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
      </div>
    </div>
  );
}
