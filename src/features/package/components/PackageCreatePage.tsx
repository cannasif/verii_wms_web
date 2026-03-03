import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { useCreatePHeader } from '../hooks/useCreatePHeader';
import { useUpdatePHeader } from '../hooks/useUpdatePHeader';
import { usePHeader } from '../hooks/usePHeader';
import { usePPackagesByHeader } from '../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../hooks/usePLinesByHeader';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { HeaderSummaryCard } from './wizard/HeaderSummaryCard';
import { Step1HeaderForm } from './wizard/Step1HeaderForm';
import { Step2PackageForm } from './wizard/Step2PackageForm';
import { Step3LineForm } from './wizard/Step3LineForm';
import { Step4Summary } from './wizard/Step4Summary';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PHeaderFormData } from '../types/package';

export function PackageCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const params = useParams<{ headerId?: string }>();

  const urlHeaderId = useMemo(() => {
    if (!params.headerId) return undefined;
    const parsed = parseInt(params.headerId, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, [params.headerId]);

  const [currentStep, setCurrentStep] = useState(urlHeaderId ? 2 : 1);
  const [headerId, setHeaderId] = useState<number | undefined>(urlHeaderId);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const createHeaderMutation = useCreatePHeader();
  const updateHeaderMutation = useUpdatePHeader();
  const { data: headerData } = usePHeader(headerId);
  const { data: packagesData } = usePPackagesByHeader(headerId);
  const { data: linesData } = usePLinesByHeader(headerId);

  const packages = packagesData || [];
  const lines = linesData || [];

  useEffect(() => {
    if (urlHeaderId && urlHeaderId !== headerId) {
      setHeaderId(urlHeaderId);
      setCurrentStep(2);
    }
  }, [urlHeaderId, headerId]);

  useEffect(() => {
    setPageTitle(t('package.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const steps = useMemo(
    () => [
      { label: t('package.wizard.step1.title') },
      { label: t('package.wizard.step2.title') },
      { label: t('package.wizard.step3.title') },
      { label: t('package.wizard.step4.title') },
    ],
    [t]
  );

  const handleStep1Submit = async (data: PHeaderFormData): Promise<void> => {
    try {
      const id = await createHeaderMutation.mutateAsync({
        packingNo: data.packingNo,
        packingDate: data.packingDate || undefined,
        warehouseCode: data.warehouseCode || undefined,
        sourceType: data.sourceType,
        sourceHeaderId: data.sourceHeaderId,
        customerCode: data.customerCode || undefined,
        customerAddress: data.customerAddress || undefined,
        status: data.status || 'Draft',
        carrierId: data.carrierId,
        carrierServiceType: data.carrierServiceType || undefined,
        trackingNo: data.trackingNo || undefined,
      });
      
      if (id) {
        setHeaderId(id);
        navigate(`/package/create/${id}`, { replace: true });
        setCurrentStep(2);
        toast.success(t('package.wizard.headerCreated'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.wizard.headerError')
      );
      throw error;
    }
  };

  const handleStep1Cancel = (): void => {
    setCancelDialogOpen(true);
  };

  const handleStep2Next = (): void => {
    setCurrentStep(3);
  };

  const handleStep2Previous = (): void => {
    setCurrentStep(1);
  };

  const handleStep2SaveAndExit = (): void => {
    navigate('/package/list');
    toast.success(t('package.wizard.saved'));
  };

  const handleStep3Next = (): void => {
    setCurrentStep(4);
  };

  const handleStep3Previous = (): void => {
    setCurrentStep(2);
  };

  const handleStep3SaveAndExit = (): void => {
    navigate('/package/list');
    toast.success(t('package.wizard.saved'));
  };

  const handleStep4Previous = (): void => {
    setCurrentStep(3);
  };

  const handleStep4Complete = async (): Promise<void> => {
    if (!headerId) return;

    try {
      const totalQuantity = lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
      const totalNetWeight = packages.reduce((sum, pkg) => sum + (pkg.netWeight || 0), 0);
      const totalGrossWeight = packages.reduce((sum, pkg) => sum + (pkg.grossWeight || 0), 0);
      const totalVolume = packages.reduce((sum, pkg) => sum + (pkg.volume || 0), 0);

      await updateHeaderMutation.mutateAsync({
        id: headerId,
        data: {
          totalPackageCount: packages.length,
          totalQuantity,
          totalNetWeight,
          totalGrossWeight,
          totalVolume,
        },
      });

      toast.success(t('package.wizard.completed'));
      navigate('/package/list');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.wizard.completeError')
      );
    }
  };

  const handleStep4Cancel = (): void => {
    setCancelDialogOpen(true);
  };

  const handleEditHeader = (): void => {
    setCurrentStep(1);
  };

  const handleEditPackages = (): void => {
    setCurrentStep(2);
  };

  const handleEditLines = (): void => {
    setCurrentStep(3);
  };

  const handleConfirmCancel = (): void => {
    if (currentStep === 1) {
      navigate('/package/list');
    } else {
      if (headerId) {
        // TODO: Delete header and all related data
      }
      navigate('/package/list');
    }
    setCancelDialogOpen(false);
  };

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return (
          <Step1HeaderForm
            initialData={headerData}
            onSubmit={handleStep1Submit}
            onCancel={handleStep1Cancel}
            isLoading={createHeaderMutation.isPending}
          />
        );
      case 2:
        if (!headerId) {
          return (
            <Card>
              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  {t('package.wizard.headerRequired')}
                </p>
              </div>
            </Card>
          );
        }
        return (
          <Step2PackageForm
            packingHeaderId={headerId}
            onPrevious={handleStep2Previous}
            onNext={handleStep2Next}
            onSaveAndExit={handleStep2SaveAndExit}
          />
        );
      case 3:
        if (!headerId) {
          return (
            <Card>
              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  {t('package.wizard.headerRequired')}
                </p>
              </div>
            </Card>
          );
        }
        return (
          <Step3LineForm
            packingHeaderId={headerId}
            onPrevious={handleStep3Previous}
            onNext={handleStep3Next}
            onSaveAndExit={handleStep3SaveAndExit}
          />
        );
      case 4:
        if (!headerId || !headerData) {
          return (
            <Card>
              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  {t('package.wizard.headerRequired')}
                </p>
              </div>
            </Card>
          );
        }
        return (
          <Step4Summary
            headerData={headerData}
            onEditHeader={handleEditHeader}
            onEditPackages={handleEditPackages}
            onEditLines={handleEditLines}
            onPrevious={handleStep4Previous}
            onComplete={handleStep4Complete}
            onCancel={handleStep4Cancel}
            isLoading={updateHeaderMutation.isPending}
          />
        );
      default:
        return (
          <Card>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{t('package.wizard.unknownStep')}</p>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <Breadcrumb
        items={steps.map((step, index) => ({
          label: step.label,
          isActive: index + 1 === currentStep,
        }))}
        className="mb-4"
      />

      {headerData && currentStep > 1 && (
        <HeaderSummaryCard
          headerData={headerData}
          currentStep={currentStep}
          totalSteps={steps.length}
          onEdit={handleEditHeader}
        />
      )}

      {renderStepContent()}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('package.wizard.cancelTitle')}</DialogTitle>
            <DialogDescription>
              {currentStep === 1
                ? t('package.wizard.cancelMessage')
                : t(
                    'package.wizard.cancelMessageWithData'
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
