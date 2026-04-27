export interface CreateOrUpdateVehicleCheckInDto {
  branchCode?: string;
  plateNo: string;
  firstName?: string | null;
  lastName?: string | null;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
}

export interface VehicleCheckInImageDto {
  id: number;
  headerId: number;
  fileName?: string | null;
  fileUrl: string;
  contentType?: string | null;
  fileSize?: number | null;
  sortOrder: number;
  createdDate?: string | null;
}

export interface VehicleCheckInHeaderDto {
  id: number;
  branchCode?: string | null;
  plateNo: string;
  plateNoNormalized: string;
  entryDate: string;
  entryDay: string;
  firstName?: string | null;
  lastName?: string | null;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  images: VehicleCheckInImageDto[];
}

export interface VehicleCheckInPagedRowDto {
  id: number;
  branchCode?: string | null;
  plateNo: string;
  entryDate: string;
  entryDay: string;
  firstName?: string | null;
  lastName?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  imageCount: number;
}
