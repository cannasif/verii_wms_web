export interface ShipmentLoadingSession {
  id: number;
  branchCode: string;
  shipmentHeaderId: number;
  shipmentDocumentNo?: string | null;
  vehicleCheckInHeaderId?: number | null;
  status: string;
  plateNo?: string | null;
  driverName?: string | null;
  dockCode?: string | null;
  sealNo?: string | null;
  note?: string | null;
  loadingStartedDate?: string | null;
  closedDate?: string | null;
  stagedPackageCount: number;
  loadedPackageCount: number;
  unloadedPackageCount: number;
}

export interface ShipmentLoadingPackage {
  id: number;
  sessionId: number;
  packageId: number;
  packageNo: string;
  packageBarcode?: string | null;
  status: string;
  stagedDate?: string | null;
  loadedDate?: string | null;
  unloadedDate?: string | null;
  note?: string | null;
}

export interface ShipmentLoadingDetail {
  session: ShipmentLoadingSession;
  packages: ShipmentLoadingPackage[];
}

export interface CreateOrUpdateShipmentLoadingSessionRequest {
  shipmentHeaderId: number;
  vehicleCheckInHeaderId?: number | null;
  plateNo?: string | null;
  driverName?: string | null;
  dockCode?: string | null;
  sealNo?: string | null;
  note?: string | null;
}
