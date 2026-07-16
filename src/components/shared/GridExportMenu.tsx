import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { OpsActionButton } from './OpsActionButton';
import type { DataTableVariant } from './DataTableActionBar';
import { exportGridToExcel, exportGridToPdf, type GridExportColumn } from '@/lib/grid-export';
import { cn } from '@/lib/utils';

interface GridExportMenuProps {
  fileName: string;
  columns: GridExportColumn[];
  rows: Record<string, unknown>[];
  getExportData?: () => Promise<{ columns: GridExportColumn[]; rows: Record<string, unknown>[] }>;
  variant?: DataTableVariant;
}

export function GridExportMenu({ fileName, columns, rows, getExportData, variant = 'default' }: GridExportMenuProps): ReactElement {
  const { t } = useTranslation('common');
  const [isExporting, setIsExporting] = useState(false);

  const resolveExportPayload = async (): Promise<{ columns: GridExportColumn[]; rows: Record<string, unknown>[] }> => {
    if (getExportData) {
      return getExportData();
    }

    return { columns, rows };
  };

  const handleExcelExport = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const payload = await resolveExportPayload();
      await exportGridToExcel({ fileName, columns: payload.columns, rows: payload.rows });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const payload = await resolveExportPayload();
      await exportGridToPdf({ fileName, columns: payload.columns, rows: payload.rows });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {variant === 'ops' ? (
          <OpsActionButton type="button" variant="secondary" className="wms-ops-list-toolbar-btn">
            <Download className="size-3.5" aria-hidden />
            {t('export')}
          </OpsActionButton>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-dashed border-slate-300 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('export')}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(variant === 'ops' ? 'wms-ops-list-dropdown w-52 min-w-[11rem]' : 'w-44')}
      >
        <DropdownMenuItem
          onClick={handleExcelExport}
          disabled={isExporting || (!getExportData && rows.length === 0)}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t('exportExcel')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handlePdfExport}
          disabled={isExporting || (!getExportData && rows.length === 0)}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('exportPdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
