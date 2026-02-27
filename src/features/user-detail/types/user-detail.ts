import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type { TFunction } from 'i18next';

export const Gender = {
  NotSpecified: 0,
  Male: 1,
  Female: 2,
  Other: 3,
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

export interface UserDetailDto {
  id: number;
  userId: number;
  profilePictureUrl?: string | null;
  height?: number | null;
  weight?: number | null;
  description?: string | null;
  gender?: Gender | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface CreateUserDetailDto {
  userId: number;
  profilePictureUrl?: string;
  height?: number;
  weight?: number;
  description?: string;
  gender?: Gender;
}

export interface UpdateUserDetailDto {
  profilePictureUrl?: string;
  height?: number;
  weight?: number;
  description?: string;
  gender?: Gender;
}

export type UserDetailResponse = ApiResponse<UserDetailDto>;
export type CreateUserDetailResponse = ApiResponse<UserDetailDto>;
export type UpdateUserDetailResponse = ApiResponse<UserDetailDto>;

export const createUserDetailFormSchema = (t: TFunction) => z.object({
  profilePictureUrl: z
    .string()
    .max(500)
    .refine((val) => {
      if (val === '') return true;
      if (val.startsWith('http://') || val.startsWith('https://')) {
        return z.string().url().safeParse(val).success;
      }
      if (val.startsWith('/')) {
        return true;
      }
      return false;
    }, {
      message: t('userDetail.invalidUrl', 'Geçersiz URL formatı'),
    })
    .optional()
    .or(z.literal('')),
  height: z
    .number()
    .min(0, t('userDetail.heightMin', 'Boy 0\'dan küçük olamaz'))
    .max(300, t('userDetail.heightMax', 'Boy 300\'den büyük olamaz'))
    .nullable()
    .optional(),
  weight: z
    .number()
    .min(0, t('userDetail.weightMin', 'Kilo 0\'dan küçük olamaz'))
    .max(500, t('userDetail.weightMax', 'Kilo 500\'den büyük olamaz'))
    .nullable()
    .optional(),
  description: z.string().max(2000, t('userDetail.descriptionMax', 'Açıklama en fazla 2000 karakter olabilir')).optional().or(z.literal('')),
  gender: z
    .number()
    .refine((val) => Object.values(Gender).includes(val as Gender), {
      message: t('userDetail.invalidGender', 'Geçersiz cinsiyet değeri'),
    })
    .nullable()
    .optional(),
});

export type UserDetailFormData = z.infer<ReturnType<typeof createUserDetailFormSchema>>;
