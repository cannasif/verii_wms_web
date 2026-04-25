import { type ReactElement, useMemo } from 'react';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import type { CreateKkdEmployeeDepartmentDto, KkdEmployeeDepartmentDto, UpdateKkdEmployeeDepartmentDto } from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'departmentCode' | 'departmentName' | 'isActive';

export function KkdEmployeeDepartmentPage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentCode', label: 'Bölüm Kodu' },
    { key: 'departmentName', label: 'Bölüm Adı' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEmployeeDepartmentDto>[] = [
    { key: 'departmentCode', label: 'Bölüm Kodu', type: 'text', required: true },
    { key: 'departmentName', label: 'Bölüm Adı', type: 'text', required: true },
    { key: 'isActive', label: 'Aktif', type: 'boolean' },
  ];

  return (
    <KkdCrudPage<KkdEmployeeDepartmentDto, CreateKkdEmployeeDepartmentDto, ColumnKey>
      pageKey="kkd-departments"
      title="KKD Bölüm Tanımları"
      description="Bölüm kayıtlarını yönetin."
      breadcrumbGroup="KKD"
      breadcrumbCurrent="Bölüm Tanımları"
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
