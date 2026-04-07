import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { getBarcodeCandidateLabel } from './barcode-feedback';

interface BarcodeCandidatePickerProps {
  candidates: BarcodeMatchCandidate[];
  message: string;
  onSelect: (candidate: BarcodeMatchCandidate) => void;
}

export function BarcodeCandidatePicker({ candidates, message, onSelect }: BarcodeCandidatePickerProps): ReactElement | null {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <div className="flex flex-col gap-2">
        {candidates.map((candidate, index) => (
          <Button
            key={`${candidate.stockCode ?? 'candidate'}-${candidate.yapKod ?? 'none'}-${index}`}
            type="button"
            variant="outline"
            className="justify-start whitespace-normal text-left"
            onClick={() => onSelect(candidate)}
          >
            {getBarcodeCandidateLabel(candidate)}
          </Button>
        ))}
      </div>
    </div>
  );
}
