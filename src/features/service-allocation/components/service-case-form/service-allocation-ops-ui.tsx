import { type ReactElement, type ReactNode } from 'react';

export const SERVICE_CASE_FORM_ITEM_CLASS = 'wms-ops-form-item';

export function translateServiceOptionLabel(
  translate: (key: string) => string,
  labelKey: string,
  fallback: string,
): string {
  const translated = translate(labelKey);
  return translated === labelKey ? fallback : translated;
}

interface ServiceCaseFormPanelProps {
  title: string;
  children: ReactNode;
}

export function ServiceCaseFormPanel({ title, children }: ServiceCaseFormPanelProps): ReactElement {
  return (
    <section className="wms-ops-order-step overflow-hidden">
      <div className="border-b px-4 py-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wide">{title}</h3>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

interface ServiceCaseOpsTableColumn {
  key: string;
  label: string;
  className?: string;
}

interface ServiceCaseOpsDataTableProps {
  title?: string;
  columns: ServiceCaseOpsTableColumn[];
  children: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}

export function ServiceCaseOpsDataTable({
  title,
  columns,
  children,
  emptyText,
  isEmpty = false,
}: ServiceCaseOpsDataTableProps): ReactElement {
  return (
    <section className="wms-ops-detail-panel wms-ops-detail-lines-panel flex min-h-0 flex-col overflow-hidden">
      {title ? <h3 className="wms-ops-detail-section-title">{title}</h3> : null}
      <div className="wms-ops-transfer-detail__table-wrap flex-1 rounded-none border-0">
        <table className="wms-ops-transfer-detail__table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="wms-ops-wizard-empty text-center">
                  {emptyText}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface ServiceCaseDetailRowProps {
  label: string;
  children: ReactNode;
}

export function ServiceCaseDetailRow({ label, children }: ServiceCaseDetailRowProps): ReactElement {
  return (
    <div className="wms-ops-detail-row">
      <span className="wms-ops-detail-row__label">{label}</span>
      <span className="wms-ops-detail-row__value">{children}</span>
    </div>
  );
}
