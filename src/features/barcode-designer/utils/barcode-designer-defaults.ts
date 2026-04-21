const STORAGE_KEY = 'barcode_designer_recommendation_defaults_v1';

export interface BarcodeDesignerSavedDefaults {
  branchCode: string;
  customerType: string;
  processType: string;
  preferredPresetId?: string;
}

export function loadBarcodeDesignerDefaults(): BarcodeDesignerSavedDefaults | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as BarcodeDesignerSavedDefaults;
  } catch {
    return null;
  }
}

export function saveBarcodeDesignerDefaults(defaults: BarcodeDesignerSavedDefaults): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}
