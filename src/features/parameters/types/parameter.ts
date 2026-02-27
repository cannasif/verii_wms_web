import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type { TFunction } from 'i18next';

export const parameterFormSchema = (t: TFunction) => {
  void t;
  return z.object({
    allowLessQuantityBasedOnOrder: z.boolean(),
    allowMoreQuantityBasedOnOrder: z.boolean(),
    requireApprovalBeforeErp: z.boolean(),
    requireAllOrderItemsCollected: z.boolean(),
  });
};

export type ParameterFormData = z.infer<ReturnType<typeof parameterFormSchema>>;

export interface Parameter {
  id: number;
  allowLessQuantityBasedOnOrder: boolean;
  allowMoreQuantityBasedOnOrder: boolean;
  requireApprovalBeforeErp: boolean;
  requireAllOrderItemsCollected: boolean;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
}

export type ParameterResponse = ApiResponse<Parameter>;
export type ParametersResponse = ApiResponse<Parameter[]>;

export interface CreateParameterRequest {
  allowLessQuantityBasedOnOrder: boolean;
  allowMoreQuantityBasedOnOrder: boolean;
  requireApprovalBeforeErp: boolean;
  requireAllOrderItemsCollected: boolean;
}

export interface UpdateParameterRequest {
  allowLessQuantityBasedOnOrder: boolean;
  allowMoreQuantityBasedOnOrder: boolean;
  requireApprovalBeforeErp: boolean;
  requireAllOrderItemsCollected: boolean;
}

export type ParameterType =
  | 'gr'
  | 'wt'
  | 'wo'
  | 'wi'
  | 'sh'
  | 'srt'
  | 'sit'
  | 'pt'
  | 'pr'
  | 'ic'
  | 'p';

export const PARAMETER_TYPES: Record<ParameterType, { endpoint: string; name: string }> = {
  gr: { endpoint: 'GrParameter', name: 'Mal Kabul Parametreleri' },
  wt: { endpoint: 'WtParameter', name: 'Depo Transfer Parametreleri' },
  wo: { endpoint: 'WoParameter', name: 'Depo Çıkış Parametreleri' },
  wi: { endpoint: 'WiParameter', name: 'Depo Giriş Parametreleri' },
  sh: { endpoint: 'ShParameter', name: 'Sevkiyat Parametreleri' },
  srt: { endpoint: 'SrtParameter', name: 'Taşeron Alış Transfer Parametreleri' },
  sit: { endpoint: 'SitParameter', name: 'Taşeron Çıkış Transfer Parametreleri' },
  pt: { endpoint: 'PtParameter', name: 'Üretim Transfer Parametreleri' },
  pr: { endpoint: 'PrParameter', name: 'Üretim Parametreleri' },
  ic: { endpoint: 'IcParameter', name: 'Sayım Parametreleri' },
  p: { endpoint: 'PParameter', name: 'Paket Parametreleri' },
};

