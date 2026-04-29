import type {
  CreateKkdOrderSubmissionLineDto,
  KkdEmployeeDto,
  KkdResolvedEmployeeDto,
} from '../../types/kkd.types';

export type LocalOrderLine = CreateKkdOrderSubmissionLineDto & { clientId: string };

export function mapEmployee(item: KkdEmployeeDto): KkdResolvedEmployeeDto {
  return {
    employeeId: item.id,
    employeeCode: item.employeeCode,
    fullName: `${item.firstName} ${item.lastName}`.trim(),
    customerId: item.customerId,
    customerCode: item.customerCode,
    departmentCode: item.departmentCode ?? null,
    departmentName: item.departmentName ?? null,
    roleCode: item.roleCode ?? null,
    roleName: item.roleName ?? null,
    isActive: item.isActive,
  };
}
