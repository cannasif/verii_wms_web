import type { BarcodeSymbology } from '../types/barcode-designer-editor.types';

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededBit(seed: number, x: number, y: number): boolean {
  const mixed = Math.imul(seed ^ (x * 374761393) ^ (y * 668265263), 1274126177);
  return ((mixed >>> 0) & 1) === 1;
}

function drawQrFinder(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number): void {
  ctx.fillRect(x, y, cell * 7, cell * 7);
  ctx.clearRect(x + cell, y + cell, cell * 5, cell * 5);
  ctx.fillRect(x + (cell * 2), y + (cell * 2), cell * 3, cell * 3);
}

function renderMatrixPreview(type: Extract<BarcodeSymbology, 'qrcode' | 'datamatrix'>, value: string, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  const canvasWidth = Math.max(96, Math.round(width));
  const canvasHeight = Math.max(96, Math.round(height));
  const gridSize = type === 'qrcode' ? 21 : 24;
  const paddingCells = type === 'qrcode' ? 4 : 2;
  const totalCells = gridSize + (paddingCells * 2);
  const cell = Math.max(2, Math.floor(Math.min(canvasWidth, canvasHeight) / totalCells));
  const drawWidth = cell * totalCells;
  const drawHeight = cell * totalCells;
  const offsetX = Math.floor((canvasWidth - drawWidth) / 2);
  const offsetY = Math.floor((canvasHeight - drawHeight) / 2);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#111827';

  const seed = hashString(`${type}:${value}`);

  if (type === 'qrcode') {
    drawQrFinder(ctx, offsetX + (paddingCells * cell), offsetY + (paddingCells * cell), cell);
    drawQrFinder(ctx, offsetX + ((paddingCells + gridSize - 7) * cell), offsetY + (paddingCells * cell), cell);
    drawQrFinder(ctx, offsetX + (paddingCells * cell), offsetY + ((paddingCells + gridSize - 7) * cell), cell);
  } else {
    for (let index = 0; index < gridSize; index += 1) {
      ctx.fillRect(offsetX + (paddingCells * cell), offsetY + ((paddingCells + index) * cell), cell, cell);
      ctx.fillRect(offsetX + ((paddingCells + index) * cell), offsetY + ((paddingCells + gridSize - 1) * cell), cell, cell);
      if (index % 2 === 0) {
        ctx.fillRect(offsetX + ((paddingCells + gridSize - 1) * cell), offsetY + ((paddingCells + index) * cell), cell, cell);
        ctx.fillRect(offsetX + ((paddingCells + index) * cell), offsetY + (paddingCells * cell), cell, cell);
      }
    }
  }

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const moduleX = offsetX + ((x + paddingCells) * cell);
      const moduleY = offsetY + ((y + paddingCells) * cell);

      if (type === 'qrcode') {
        const inTopLeft = x < 7 && y < 7;
        const inTopRight = x >= gridSize - 7 && y < 7;
        const inBottomLeft = x < 7 && y >= gridSize - 7;
        if (inTopLeft || inTopRight || inBottomLeft) {
          continue;
        }
      } else if ((x === 0) || (y === gridSize - 1) || ((x === gridSize - 1 || y === 0) && ((x + y) % 2 === 0))) {
        continue;
      }

      if (seededBit(seed, x, y)) {
        ctx.fillRect(moduleX, moduleY, cell, cell);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

export function createBarcodePreviewDataUrl(type: BarcodeSymbology, value: string, width: number, height: number): string | null {
  if (!value.trim()) {
    return null;
  }

  if (type === 'code128') {
    return null;
  }

  return renderMatrixPreview(type, value, width, height);
}
