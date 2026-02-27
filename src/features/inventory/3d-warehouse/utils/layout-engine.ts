import type { WarehouseShelvesWithStockInformationDto, WarehouseSlot, LayoutConfig, ParsedLocation } from '../types/warehouse-3d';
import { parseLocation } from './location-parser';

export const LAYOUT_CONSTANTS = {
  AISLE_SPACING:4.0,
  BAY_SPACING: 2.3,
  LEVEL_HEIGHT: 0.8,
  AISLE_WIDTH: 1.5,
  SHELF_WIDTH: 1.2,
  SHELF_DEPTH: 0.6,
};

const defaultConfig: LayoutConfig = {
  aisleSpacing: LAYOUT_CONSTANTS.AISLE_SPACING,
  baySpacing: LAYOUT_CONSTANTS.BAY_SPACING,
  levelHeight: LAYOUT_CONSTANTS.LEVEL_HEIGHT,
  origin: { x: 0, z: 0 },
};

const getRowIndex = (row: string): number => {
  return row.charCodeAt(0) - 'A'.charCodeAt(0);
};

const calculatePosition = (
  parsed: ParsedLocation,
  config: LayoutConfig
): { x: number; y: number; z: number } => {
  const rowIndex = getRowIndex(parsed.row);
  
  const x = config.origin.x + parsed.column * config.baySpacing;
  const y = parsed.level * config.levelHeight;
  const z = config.origin.z + rowIndex * config.aisleSpacing;

  return { x, y, z };
};

const generateHucreKodu = (row: string, column: number, level: number): string => {
  const columnStr = column.toString().padStart(2, '0');
  return `${row}${columnStr}${level}`;
};

export const buildWarehouseModel = (
  data: WarehouseShelvesWithStockInformationDto[],
  config: LayoutConfig = defaultConfig
): WarehouseSlot[] => {
  const slotMap = new Map<string, WarehouseSlot>();
  const rowColumnLevelMap = new Map<string, Set<number>>();
  const rowColumnMap = new Map<string, { min: number; max: number }>();

  for (const item of data) {
    const parsed = parseLocation(item.hucreKodu);
    if (!parsed) {
      continue;
    }

    const rowColumnKey = `${parsed.row}-${parsed.column}`;
    
    if (!rowColumnLevelMap.has(rowColumnKey)) {
      rowColumnLevelMap.set(rowColumnKey, new Set());
    }
    rowColumnLevelMap.get(rowColumnKey)!.add(parsed.level);
    
    if (!rowColumnMap.has(parsed.row)) {
      rowColumnMap.set(parsed.row, { min: parsed.column, max: parsed.column });
    } else {
      const current = rowColumnMap.get(parsed.row)!;
      rowColumnMap.set(parsed.row, {
        min: Math.min(current.min, parsed.column),
        max: Math.max(current.max, parsed.column),
      });
    }

    const existingSlot = slotMap.get(item.hucreKodu);
    if (existingSlot) {
      existingSlot.stocks.push({
        stokKodu: item.stokKodu,
        stokAdi: item.stokAdi,
        bakiye: item.bakiye,
      });
      existingSlot.totalBakiye += item.bakiye;
    } else {
      const position = calculatePosition(parsed, config);
      slotMap.set(item.hucreKodu, {
        hucreKodu: item.hucreKodu,
        position,
        stocks: [
          {
            stokKodu: item.stokKodu,
            stokAdi: item.stokAdi,
            bakiye: item.bakiye,
          },
        ],
        totalBakiye: item.bakiye,
      });
    }
  }

  const allRows = Array.from(new Set(Array.from(rowColumnMap.keys())));
  
  for (const row of allRows) {
    const columnRange = rowColumnMap.get(row);
    if (!columnRange) continue;
    
    for (let column = columnRange.min; column <= columnRange.max; column++) {
      const rowColumnKey = `${row}-${column}`;
      const levels = rowColumnLevelMap.get(rowColumnKey);
      const maxLevel = levels && levels.size > 0 ? Math.max(...Array.from(levels)) : 0;
      
      for (let level = 0; level <= maxLevel; level++) {
        const hucreKodu = generateHucreKodu(row, column, level);
        
        if (!slotMap.has(hucreKodu)) {
          const parsed: ParsedLocation = { row, column, level };
          const position = calculatePosition(parsed, config);
          
          slotMap.set(hucreKodu, {
            hucreKodu,
            position,
            stocks: [],
            totalBakiye: 0,
          });
        }
      }
    }
  }

  return Array.from(slotMap.values());
};

export const calculateCenter = (slots: WarehouseSlot[]): { x: number; y: number; z: number } => {
  if (slots.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const slot of slots) {
    minX = Math.min(minX, slot.position.x);
    maxX = Math.max(maxX, slot.position.x);
    minY = Math.min(minY, slot.position.y);
    maxY = Math.max(maxY, slot.position.y);
    minZ = Math.min(minZ, slot.position.z);
    maxZ = Math.max(maxZ, slot.position.z);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2,
  };
};
