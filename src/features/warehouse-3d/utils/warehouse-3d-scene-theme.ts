export type Warehouse3dSceneAppearance = 'light' | 'dark';

export interface Warehouse3dSceneTheme {
  clearColor: string;
  gridCell: string;
  gridSection: string;
  floorPlane: string;
  frameLine: string;
  ambient: { intensity: number; color: string };
  directionalMain: { intensity: number; color: string };
  directionalFill: { intensity: number; color: string };
  point: { intensity: number; color: string };
  hemisphere: { intensity: number; sky: string; ground: string };
  aisle: {
    default: string;
    hover: string;
    selected: string;
    line: string;
    lineSelected: string;
    label: string;
    labelOutline: string;
  };
  shelf: {
    base: string;
    post: string;
    panel: string;
    level: string;
    selectGlow: string;
  };
  label: {
    bg: string;
    bgSelected: string;
    text: string;
    border: string;
    borderSelected: string;
  };
  binEmissive: { filled: number; empty: number };
}

export const WAREHOUSE_3D_SCENE_THEMES: Record<Warehouse3dSceneAppearance, Warehouse3dSceneTheme> = {
  dark: {
    clearColor: '#020408',
    gridCell: '#134e5e',
    gridSection: '#22d3ee',
    floorPlane: '#061018',
    frameLine: '#22d3ee',
    ambient: { intensity: 0.62, color: '#e8f7ff' },
    directionalMain: { intensity: 1.15, color: '#ffffff' },
    directionalFill: { intensity: 0.45, color: '#67e8f9' },
    point: { intensity: 0.35, color: '#22d3ee' },
    hemisphere: { intensity: 0.38, sky: '#d9f7ff', ground: '#101820' },
    aisle: {
      default: '#1a2636',
      hover: '#15304d',
      selected: '#1a3a6e',
      line: '#3d5a80',
      lineSelected: '#22d3ee',
      label: '#ffffff',
      labelOutline: '#22d3ee',
    },
    shelf: {
      base: '#243044',
      post: '#3a4d62',
      panel: '#4a5d72',
      level: '#52637a',
      selectGlow: '#3c9dff',
    },
    label: {
      bg: 'rgba(13, 22, 40, 0.88)',
      bgSelected: 'rgba(60, 157, 255, 0.92)',
      text: '#ffffff',
      border: 'rgba(255, 255, 255, 0.15)',
      borderSelected: 'rgba(60, 157, 255, 1)',
    },
    binEmissive: { filled: 0.28, empty: 0.14 },
  },
  light: {
    clearColor: '#e6eef8',
    gridCell: '#b8ccd8',
    gridSection: '#ea580c',
    floorPlane: '#dce8f4',
    frameLine: '#ea580c',
    ambient: { intensity: 0.92, color: '#ffffff' },
    directionalMain: { intensity: 1.25, color: '#fffaf5' },
    directionalFill: { intensity: 0.55, color: '#fdba74' },
    point: { intensity: 0.22, color: '#fb923c' },
    hemisphere: { intensity: 0.55, sky: '#f8fafc', ground: '#cbd5e1' },
    aisle: {
      default: '#c5d9eb',
      hover: '#b3cce3',
      selected: '#f59e0b',
      line: '#94a3b8',
      lineSelected: '#ea580c',
      label: '#0f172a',
      labelOutline: '#ea580c',
    },
    shelf: {
      base: '#8fa4b8',
      post: '#6b8298',
      panel: '#7d93a8',
      level: '#9aafc0',
      selectGlow: '#ea580c',
    },
    label: {
      bg: 'rgba(255, 255, 255, 0.94)',
      bgSelected: 'rgba(234, 88, 12, 0.92)',
      text: '#0f172a',
      border: 'rgba(15, 23, 42, 0.12)',
      borderSelected: 'rgba(234, 88, 12, 1)',
    },
    binEmissive: { filled: 0.18, empty: 0.08 },
  },
};

export function getWarehouse3dSceneTheme(appearance: Warehouse3dSceneAppearance): Warehouse3dSceneTheme {
  return WAREHOUSE_3D_SCENE_THEMES[appearance];
}
