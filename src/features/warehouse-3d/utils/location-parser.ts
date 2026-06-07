import type { ParsedLocation } from '../types/warehouse-3d';

export const parseLocation = (hucreKodu: string): ParsedLocation | null => {
  if (!hucreKodu || hucreKodu.length < 2) {
    return null;
  }

  const match = hucreKodu.match(/^([A-Z])(\d+)$/);
  if (!match) {
    return null;
  }

  const [, row, numbers] = match;
  const numStr = numbers;

  if (numStr.length < 2) {
    return null;
  }

  const column = parseInt(numStr.slice(0, -1), 10);
  const level = parseInt(numStr.slice(-1), 10);

  if (isNaN(column) || isNaN(level)) {
    return null;
  }

  return {
    row,
    column,
    level,
  };
};
