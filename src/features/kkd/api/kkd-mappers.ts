import type { PagedResponse } from '@/types/api';
import type {
  KkdEmployeeDepartmentDto,
  KkdEmployeeDto,
  KkdEmployeeRoleDto,
} from '../types/kkd.types';

type ApiRecord = Record<string, unknown>;

function pickNumber(record: ApiRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function pickString(record: ApiRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
    if (value != null && (typeof value === 'number' || typeof value === 'boolean')) {
      return String(value);
    }
  }
  return undefined;
}

function pickNullableString(record: ApiRecord, ...keys: string[]): string | null | undefined {
  for (const key of keys) {
    if (!(key in record)) {
      continue;
    }
    const value = record[key];
    if (value == null) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  }
  return undefined;
}

function pickBoolean(record: ApiRecord, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}

function pickPagedRows(raw: ApiRecord): ApiRecord[] {
  const nested = raw.data ?? raw.Data ?? raw.items ?? raw.Items;
  return Array.isArray(nested) ? (nested as ApiRecord[]) : [];
}

export function normalizePagedResponse<T>(
  raw: PagedResponse<ApiRecord> | ApiRecord,
  mapRow: (row: ApiRecord) => T,
): PagedResponse<T> {
  const source = raw as ApiRecord;
  const rows = pickPagedRows(source);

  return {
    data: rows.map(mapRow),
    totalCount: pickNumber(source, 'totalCount', 'TotalCount') ?? rows.length,
    pageNumber: pickNumber(source, 'pageNumber', 'PageNumber') ?? 0,
    pageSize: pickNumber(source, 'pageSize', 'PageSize') ?? rows.length,
    totalPages: pickNumber(source, 'totalPages', 'TotalPages') ?? 1,
    hasPreviousPage: pickBoolean(source, 'hasPreviousPage', 'HasPreviousPage'),
    hasNextPage: pickBoolean(source, 'hasNextPage', 'HasNextPage'),
  };
}

export function normalizeKkdEmployeeDepartment(row: ApiRecord): KkdEmployeeDepartmentDto {
  return {
    id: pickNumber(row, 'id', 'Id') ?? 0,
    branchCode: pickString(row, 'branchCode', 'BranchCode'),
    createdDate: pickNullableString(row, 'createdDate', 'CreatedDate') ?? null,
    updatedDate: pickNullableString(row, 'updatedDate', 'UpdatedDate') ?? null,
    departmentCode: pickString(row, 'departmentCode', 'DepartmentCode') ?? '',
    departmentName: pickString(row, 'departmentName', 'DepartmentName') ?? '',
    isActive: pickBoolean(row, 'isActive', 'IsActive'),
  };
}

export function normalizeKkdEmployeeRole(row: ApiRecord): KkdEmployeeRoleDto {
  return {
    id: pickNumber(row, 'id', 'Id') ?? 0,
    branchCode: pickString(row, 'branchCode', 'BranchCode'),
    createdDate: pickNullableString(row, 'createdDate', 'CreatedDate') ?? null,
    updatedDate: pickNullableString(row, 'updatedDate', 'UpdatedDate') ?? null,
    departmentId: pickNumber(row, 'departmentId', 'DepartmentId') ?? null,
    departmentCode: pickNullableString(row, 'departmentCode', 'DepartmentCode') ?? null,
    departmentName: pickNullableString(row, 'departmentName', 'DepartmentName') ?? null,
    roleCode: pickString(row, 'roleCode', 'RoleCode') ?? '',
    roleName: pickString(row, 'roleName', 'RoleName') ?? '',
    isActive: pickBoolean(row, 'isActive', 'IsActive'),
  };
}

export function normalizeKkdEmployee(row: ApiRecord): KkdEmployeeDto {
  return {
    id: pickNumber(row, 'id', 'Id') ?? 0,
    branchCode: pickString(row, 'branchCode', 'BranchCode'),
    createdDate: pickNullableString(row, 'createdDate', 'CreatedDate') ?? null,
    updatedDate: pickNullableString(row, 'updatedDate', 'UpdatedDate') ?? null,
    userId: pickNumber(row, 'userId', 'UserId') ?? null,
    customerId: pickNumber(row, 'customerId', 'CustomerId') ?? 0,
    customerCode: pickString(row, 'customerCode', 'CustomerCode') ?? '',
    customerName: pickNullableString(row, 'customerName', 'CustomerName') ?? null,
    employeeCode: pickString(row, 'employeeCode', 'EmployeeCode') ?? '',
    firstName: pickString(row, 'firstName', 'FirstName') ?? '',
    lastName: pickString(row, 'lastName', 'LastName') ?? '',
    departmentId: pickNumber(row, 'departmentId', 'DepartmentId') ?? null,
    departmentCode: pickNullableString(row, 'departmentCode', 'DepartmentCode') ?? null,
    departmentName: pickNullableString(row, 'departmentName', 'DepartmentName') ?? null,
    roleId: pickNumber(row, 'roleId', 'RoleId') ?? null,
    roleCode: pickNullableString(row, 'roleCode', 'RoleCode') ?? null,
    roleName: pickNullableString(row, 'roleName', 'RoleName') ?? null,
    employmentStartDate: pickString(row, 'employmentStartDate', 'EmploymentStartDate') ?? '',
    qrCode: pickString(row, 'qrCode', 'QrCode') ?? '',
    isActive: pickBoolean(row, 'isActive', 'IsActive'),
    lastSyncDate: pickNullableString(row, 'lastSyncDate', 'LastSyncDate') ?? null,
  };
}
