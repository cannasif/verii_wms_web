export const DEFAULT_ACTIONS_COLUMN_WEIGHT = 10;
export const MIN_COLUMN_WEIGHT = 5;

export function normalizeColumnWeights(
  keys: string[],
  weights: Record<string, number>,
  actionsWeight = DEFAULT_ACTIONS_COLUMN_WEIGHT,
  includeActions = false,
): Record<string, number> {
  const resolvedKeys = includeActions ? [...keys, '__actions__'] : keys;
  const normalized: Record<string, number> = {};

  resolvedKeys.forEach((key) => {
    const fallback = key === '__actions__' ? actionsWeight : MIN_COLUMN_WEIGHT;
    normalized[key] = Math.max(weights[key] ?? fallback, MIN_COLUMN_WEIGHT);
  });

  return normalized;
}

export function getColumnWidthPercent(weight: number, totalWeight: number): number {
  if (totalWeight <= 0) return 0;
  return (weight / totalWeight) * 100;
}

export function resizeColumnWeightPair(
  weights: Record<string, number>,
  leftKey: string,
  rightKey: string,
  deltaWeight: number,
  minWeight = MIN_COLUMN_WEIGHT,
): Record<string, number> {
  const left = weights[leftKey] ?? minWeight;
  const right = weights[rightKey] ?? minWeight;
  const clampedDelta = Math.max(-(left - minWeight), Math.min(deltaWeight, right - minWeight));

  if (clampedDelta === 0) return weights;

  return {
    ...weights,
    [leftKey]: left + clampedDelta,
    [rightKey]: right - clampedDelta,
  };
}

export function getTableMinWidthPx(totalWeight: number, floorPx = 1280, pxPerWeight = 32): number {
  if (totalWeight <= 0) return floorPx;
  return Math.max(floorPx, Math.round(totalWeight * pxPerWeight));
}

export function pixelDeltaToWeightDelta(deltaPx: number, tableWidthPx: number, totalWeight: number): number {
  if (tableWidthPx <= 0 || totalWeight <= 0) return 0;
  return (deltaPx / tableWidthPx) * totalWeight;
}
