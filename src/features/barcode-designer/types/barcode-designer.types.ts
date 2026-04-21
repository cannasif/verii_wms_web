export interface BarcodeDesignerStackOption {
  name: string;
  role: string;
  verdict: 'primary' | 'supporting';
  reason: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface BarcodeDesignerPhase {
  title: string;
  items: string[];
}

export interface BarcodeDesignerCapabilityGroup {
  title: string;
  description: string;
  items: string[];
}
