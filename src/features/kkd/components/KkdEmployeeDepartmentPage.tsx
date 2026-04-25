import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import type { CreateKkdEmployeeDepartmentDto, KkdEmployeeDepartmentDto, UpdateKkdEmployeeDepartmentDto } from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'departmentCode' | 'departmentName' | 'isActive';

export function KkdEmployeeDepartmentPage(): ReactElement {
  const { t } = useTranslation('common');
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentCode', label: t('kkd.columns.departmentCode') },
    { key: 'departmentName', label: t('kkd.columns.departmentName') },
    { key: 'isActive', label: t('common.active') },
  ], [t]);

  const fields: readonly KkdCrudField<CreateKkdEmployeeDepartmentDto>[] = [
    { key: 'departmentCode', label: t('kkd.columns.departmentCode'), type: 'text', required: true },
    { key: 'departmentName', label: t('kkd.columns.departmentName'), type: 'text', required: true },
    { key: 'isActive', label: t('common.active'), type: 'boolean' },
  ];

  return (
    <KkdCrudPage<KkdEmployeeDepartmentDto, CreateKkdEmployeeDepartmentDto, ColumnKey>
      pageKey="kkd-departments"
      title={t('kkd.pages.departmentDefinitionsTitle')}
      description={t('kkd.pages.departmentDefinitionsDescription')}
      breadcrumbGroup={t('sidebar.kkd')}
      breadcrumbCurrent={t('kkd.pages.departmentDefinitionsBreadcrumb')}
      columns={columns}
      fields={fields}
      initialForm={{ departmentCode: '', departmentName: '', isActive: true }}
      getList={kkdApi.getDepartments}
      createItem={kkdApi.createDepartment}
      updateItem={(id, dto) => kkdApi.updateDepartment(id, dto as UpdateKkdEmployeeDepartmentDto)}
      deleteItem={kkdApi.deleteDepartment}
      queryKey={['kkd', 'departments']}
      mapSortBy={(value) => value === 'departmentName' ? 'DepartmentName' : value === 'isActive' ? 'IsActive' : 'DepartmentCode'}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
    />
  );
}
