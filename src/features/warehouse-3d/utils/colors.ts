export const statusColors: Record<string, string> = {
  AVAILABLE: '#3c9dff',
  RESERVED: '#f7ba3e',
  QUALITY: '#b37feb',
  BLOCKED: '#ff5c7a',
  EMPTY: '#49546d',
};

export const getBinColor = (totalBakiye: number): string => {
  if (totalBakiye === 0) {
    return statusColors.EMPTY;
  }
  if (totalBakiye < 10) {
    return statusColors.RESERVED;
  }
  return statusColors.AVAILABLE;
};
