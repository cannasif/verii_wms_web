import { type DragEvent as ReactDragEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { BarcodeDesignerBarcodeElement, BarcodeDesignerImageElement, BarcodeDesignerTemplateDocument } from '../types/barcode-designer-editor.types';
import { getGridSizePx, mmToPx, resolveBindingValue, resolveTemplateText, snapToGridPx } from '../utils/barcode-designer-document';
import { useBarcodeImage } from '../hooks/useBarcodeImage';

function resolveAdditiveSelection(nativeEvent?: MouseEvent | TouchEvent): boolean {
  if (!nativeEvent || !('ctrlKey' in nativeEvent)) {
    return false;
  }

  return Boolean(nativeEvent.ctrlKey || nativeEvent.metaKey || nativeEvent.shiftKey);
}

interface BarcodeDesignerCanvasProps {
  document: BarcodeDesignerTemplateDocument;
  selectedElementId: string | null;
  selectedElementIds: string[];
  onSelectElement: (id: string, options?: { additive?: boolean }) => void;
  onClearSelection?: () => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onDropBindingField?: (payload: { key: string; label: string; path: string; sampleValue: string; targetType: 'text' | 'barcode' | 'image' }, x: number, y: number) => void;
  arrangementGuides?: { x: number[]; y: number[] };
  stageRef: React.RefObject<KonvaStage | null>;
}

export function BarcodeDesignerCanvas({
  document,
  selectedElementId,
  selectedElementIds,
  onSelectElement,
  onClearSelection,
  onMoveElement,
  onDropBindingField,
  arrangementGuides,
  stageRef,
}: BarcodeDesignerCanvasProps): ReactElement {
  const width = mmToPx(document.canvas.width);
  const height = mmToPx(document.canvas.height);
  const gridSize = getGridSizePx();
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const [snapGuide, setSnapGuide] = useState<null | { x?: number; y?: number }>(null);
  const [spacingGuide, setSpacingGuide] = useState<null | {
    orientation: 'horizontal' | 'vertical';
    start: number;
    end: number;
    cross: number;
  }>(null);
  const [dropPreview, setDropPreview] = useState<null | {
    x: number;
    y: number;
    targetType: 'text' | 'barcode' | 'image';
    key: string;
    label: string;
  }>(null);

  const previewBox = useMemo(() => {
    if (!dropPreview) {
      return null;
    }

    if (dropPreview.targetType === 'barcode') {
      return { width: 240, height: 72, label: 'Barcode alani' };
    }

    if (dropPreview.targetType === 'image') {
      return { width: 120, height: 80, label: 'Image alani' };
    }

    return { width: 180, height: 24, label: 'Text alani' };
  }, [dropPreview]);

  const getElementBox = (element: BarcodeDesignerTemplateDocument['elements'][number]) => {
    if ('width' in element && 'height' in element) {
      return { x: element.x, y: element.y, width: element.width, height: element.height };
    }

    if (element.type === 'line') {
      const xPoints = element.points.filter((_value, index) => index % 2 === 0);
      const yPoints = element.points.filter((_value, index) => index % 2 === 1);
      return {
        x: element.x,
        y: element.y,
        width: Math.max(...xPoints, 0),
        height: Math.max(...yPoints, 0),
      };
    }

    return { x: 0, y: 0, width: 120, height: 48 };
  };

  const getSnappedPosition = (
    elementId: string,
    x: number,
    y: number,
  ): { x: number; y: number; guideX?: number; guideY?: number; spacingGuide?: { orientation: 'horizontal' | 'vertical'; start: number; end: number; cross: number } } => {
    const movingElement = document.elements.find((item) => item.id === elementId);
    if (!movingElement) {
      return { x: snapToGridPx(x), y: snapToGridPx(y) };
    }

    const box = getElementBox(movingElement);
    const targetBox = { ...box, x, y };
    const threshold = 8;
    let snappedX = x;
    let snappedY = y;
    let guideX: number | undefined;
    let guideY: number | undefined;
    let spacingGuide: { orientation: 'horizontal' | 'vertical'; start: number; end: number; cross: number } | undefined;

    const movingVerticals = [
      { pos: targetBox.x, offset: 0 },
      { pos: targetBox.x + (targetBox.width / 2), offset: targetBox.width / 2 },
      { pos: targetBox.x + targetBox.width, offset: targetBox.width },
    ];
    const movingHorizontals = [
      { pos: targetBox.y, offset: 0 },
      { pos: targetBox.y + (targetBox.height / 2), offset: targetBox.height / 2 },
      { pos: targetBox.y + targetBox.height, offset: targetBox.height },
    ];

    for (const element of document.elements) {
      if (element.id === elementId) {
        continue;
      }

      const other = getElementBox(element);
      const otherVerticals = [other.x, other.x + (other.width / 2), other.x + other.width];
      const otherHorizontals = [other.y, other.y + (other.height / 2), other.y + other.height];

      for (const moving of movingVerticals) {
        for (const candidate of otherVerticals) {
          if (Math.abs(moving.pos - candidate) <= threshold) {
            snappedX = candidate - moving.offset;
            guideX = candidate;
          }
        }
      }

      for (const moving of movingHorizontals) {
        for (const candidate of otherHorizontals) {
          if (Math.abs(moving.pos - candidate) <= threshold) {
            snappedY = candidate - moving.offset;
            guideY = candidate;
          }
        }
      }
    }

    const otherBoxes = document.elements
      .filter((item) => item.id !== elementId)
      .map(getElementBox);

    const horizontalCandidates = [...otherBoxes].sort((left, right) => left.x - right.x);
    for (let index = 0; index < horizontalCandidates.length - 1; index += 1) {
      const left = horizontalCandidates[index];
      const right = horizontalCandidates[index + 1];
      const availableGap = right.x - (left.x + left.width);
      if (availableGap <= 0) {
        continue;
      }

      const centeredGap = left.x + left.width + ((availableGap - targetBox.width) / 2);
      if (Math.abs(targetBox.x - centeredGap) <= threshold) {
        snappedX = centeredGap;
        spacingGuide = {
          orientation: 'horizontal',
          start: left.x + left.width,
          end: right.x,
          cross: targetBox.y + (targetBox.height / 2),
        };
      }
    }

    const verticalCandidates = [...otherBoxes].sort((top, bottom) => top.y - bottom.y);
    for (let index = 0; index < verticalCandidates.length - 1; index += 1) {
      const top = verticalCandidates[index];
      const bottom = verticalCandidates[index + 1];
      const availableGap = bottom.y - (top.y + top.height);
      if (availableGap <= 0) {
        continue;
      }

      const centeredGap = top.y + top.height + ((availableGap - targetBox.height) / 2);
      if (Math.abs(targetBox.y - centeredGap) <= threshold) {
        snappedY = centeredGap;
        spacingGuide = {
          orientation: 'vertical',
          start: top.y + top.height,
          end: bottom.y,
          cross: targetBox.x + (targetBox.width / 2),
        };
      }
    }

    return {
      x: snapToGridPx(snappedX),
      y: snapToGridPx(snappedY),
      guideX,
      guideY,
      spacingGuide,
    };
  };

  const handleElementDragMove = (elementId: string, x: number, y: number): void => {
    const snapped = getSnappedPosition(elementId, x, y);
    setSnapGuide({
      x: snapped.guideX,
      y: snapped.guideY,
    });
    setSpacingGuide(snapped.spacingGuide ?? null);
  };

  const handleElementDragEnd = (elementId: string, x: number, y: number): void => {
    const snapped = getSnappedPosition(elementId, x, y);
    setSnapGuide(null);
    setSpacingGuide(null);
    onMoveElement(elementId, snapped.x, snapped.y);
  };

  const updateDropPreview = (event: ReactDragEvent<HTMLDivElement>): void => {
    if (!dropZoneRef.current) {
      return;
    }

    const raw = event.dataTransfer.getData('application/vnd.v3rii.binding-field');
    if (!raw) {
      setDropPreview(null);
      return;
    }

    try {
      const payload = JSON.parse(raw) as { key: string; label: string; path: string; sampleValue: string; targetType: 'text' | 'barcode' | 'image' };
      const rect = dropZoneRef.current.getBoundingClientRect();
      const x = snapToGridPx(Math.max(0, Math.min(event.clientX - rect.left, width)));
      const y = snapToGridPx(Math.max(0, Math.min(event.clientY - rect.top, height)));
      setDropPreview({ x, y, targetType: payload.targetType, key: payload.key, label: payload.label });
    } catch {
      setDropPreview(null);
    }
  };

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (!onDropBindingField || !dropZoneRef.current) {
      return;
    }

    const raw = event.dataTransfer.getData('application/vnd.v3rii.binding-field');
    if (!raw) {
      return;
    }

    try {
      const payload = JSON.parse(raw) as { key: string; label: string; path: string; sampleValue: string; targetType: 'text' | 'barcode' | 'image' };
      const rect = dropZoneRef.current.getBoundingClientRect();
      const x = snapToGridPx(Math.max(0, Math.min(event.clientX - rect.left, width)));
      const y = snapToGridPx(Math.max(0, Math.min(event.clientY - rect.top, height)));
      onDropBindingField(payload, x, y);
      setDropPreview(null);
    } catch {
      // no-op: invalid external drag payload should not break the designer
      setDropPreview(null);
    }
  };

  const handleSelect = (elementId: string, options?: { additive?: boolean }): void => {
    onSelectElement(elementId, options);
  };

  return (
    <div className="overflow-auto rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(241,245,249,0.95))] p-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.82),_rgba(2,6,23,0.92))]">
      <div
        ref={dropZoneRef}
        className="relative inline-block rounded-2xl"
        style={{ width, height }}
        onDragOver={(event) => {
          event.preventDefault();
          updateDropPreview(event);
        }}
        onDragEnter={updateDropPreview}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDropPreview(null);
          }
        }}
        onDrop={handleDrop}
      >
        <Stage
          width={width}
          height={height}
          ref={stageRef}
          className="rounded-2xl bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]"
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) {
              onClearSelection?.();
            }
          }}
        >
          <Layer>
            {Array.from({ length: Math.floor(width / gridSize) + 1 }).map((_, index) => {
              const x = index * gridSize;
              return (
                <Line
                  key={`grid-v-${index}`}
                  points={[x, 0, x, height]}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth={1}
                />
              );
            })}
            {Array.from({ length: Math.floor(height / gridSize) + 1 }).map((_, index) => {
              const y = index * gridSize;
              return (
                <Line
                  key={`grid-h-${index}`}
                  points={[0, y, width, y]}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth={1}
                />
              );
            })}
            {document.elements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id) || selectedElementId === element.id;

              if (element.type === 'text') {
                return (
                  <Text
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    text={resolveTemplateText(element.text, document.bindings)}
                    fontSize={element.fontSize}
                    width={element.width}
                  draggable
                  fill={isSelected ? '#0369a1' : '#0f172a'}
                  onClick={(event) => handleSelect(element.id, { additive: resolveAdditiveSelection(event.evt) })}
                  onTap={(event) => handleSelect(element.id, { additive: resolveAdditiveSelection(event.evt) })}
                  onDragMove={(event) => handleElementDragMove(element.id, event.target.x(), event.target.y())}
                  onDragEnd={(event) => handleElementDragEnd(element.id, event.target.x(), event.target.y())}
                />
              );
              }

              if (element.type === 'barcode') {
                return (
                  <BarcodeElementNode
                    key={element.id}
                  element={element}
                  value={resolveBindingValue(element.binding, document.bindings)}
                  isSelected={isSelected}
                  onSelectElement={handleSelect}
                  onDragMoveElement={handleElementDragMove}
                  onMoveElement={handleElementDragEnd}
                />
                );
              }

              if (element.type === 'rect') {
                return (
                  <Rect
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    stroke={isSelected ? '#f97316' : '#94a3b8'}
                    strokeWidth={isSelected ? 2 : 1}
                  dash={[8, 4]}
                  draggable
                  onClick={(event) => handleSelect(element.id, { additive: resolveAdditiveSelection(event.evt) })}
                  onTap={(event) => handleSelect(element.id, { additive: resolveAdditiveSelection(event.evt) })}
                  onDragMove={(event) => handleElementDragMove(element.id, event.target.x(), event.target.y())}
                  onDragEnd={(event) => handleElementDragEnd(element.id, event.target.x(), event.target.y())}
                />
              );
              }

              if (element.type === 'image') {
                return (
                  <ImageElementNode
                    key={element.id}
                    element={element}
                    isSelected={isSelected}
                    bindings={document.bindings}
                    onSelectElement={handleSelect}
                    onDragMoveElement={handleElementDragMove}
                    onMoveElement={handleElementDragEnd}
                  />
                );
              }

              return (
                <Line
                  key={element.id}
                  x={element.x}
                  y={element.y}
                  points={element.points}
                  stroke={isSelected ? '#16a34a' : '#334155'}
                  strokeWidth={2}
                  draggable
                  onClick={(event) => handleSelect(element.id, { additive: resolveAdditiveSelection(event.evt) })}
                  onTap={(event) => handleSelect(element.id, { additive: resolveAdditiveSelection(event.evt) })}
                  onDragMove={(event) => handleElementDragMove(element.id, event.target.x(), event.target.y())}
                  onDragEnd={(event) => handleElementDragEnd(element.id, event.target.x(), event.target.y())}
                />
              );
            })}
            {snapGuide?.x != null ? (
              <Line
                points={[snapGuide.x, 0, snapGuide.x, height]}
                stroke="rgba(14,165,233,0.88)"
                strokeWidth={1.5}
                dash={[6, 4]}
              />
            ) : null}
            {snapGuide?.y != null ? (
              <Line
                points={[0, snapGuide.y, width, snapGuide.y]}
                stroke="rgba(14,165,233,0.88)"
                strokeWidth={1.5}
                dash={[6, 4]}
              />
            ) : null}
            {spacingGuide?.orientation === 'horizontal' ? (
              <Line
                points={[spacingGuide.start, spacingGuide.cross, spacingGuide.end, spacingGuide.cross]}
                stroke="rgba(16,185,129,0.92)"
                strokeWidth={2}
                dash={[10, 6]}
              />
            ) : null}
            {spacingGuide?.orientation === 'vertical' ? (
              <Line
                points={[spacingGuide.cross, spacingGuide.start, spacingGuide.cross, spacingGuide.end]}
                stroke="rgba(16,185,129,0.92)"
                strokeWidth={2}
                dash={[10, 6]}
              />
            ) : null}
            {(arrangementGuides?.x ?? []).map((guide, index) => (
              <Line
                key={`arrangement-x-${index}`}
                points={[guide, 0, guide, height]}
                stroke="rgba(249,115,22,0.82)"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
            ))}
            {(arrangementGuides?.y ?? []).map((guide, index) => (
              <Line
                key={`arrangement-y-${index}`}
                points={[0, guide, width, guide]}
                stroke="rgba(249,115,22,0.82)"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
            ))}
          </Layer>
        </Stage>
        {dropPreview && previewBox ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute rounded-xl border-2 border-dashed border-sky-400 bg-sky-400/10"
              style={{
                left: Math.max(0, Math.min(dropPreview.x, width - previewBox.width)),
                top: Math.max(0, Math.min(dropPreview.y, height - previewBox.height)),
                width: previewBox.width,
                height: previewBox.height,
              }}
            />
            <div
              className="absolute border-t border-dashed border-sky-300/80"
              style={{ left: 0, top: dropPreview.y, width }}
            />
            <div
              className="absolute border-l border-dashed border-sky-300/80"
              style={{ left: dropPreview.x, top: 0, height }}
            />
            <div
              className="absolute rounded-lg bg-slate-950/82 px-2 py-1 text-[11px] font-medium text-white"
              style={{
                left: Math.max(0, Math.min(dropPreview.x, width - 180)),
                top: Math.max(0, dropPreview.y - 28),
              }}
            >
              {previewBox.label} · {dropPreview.label}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface BarcodeElementNodeProps {
  element: BarcodeDesignerBarcodeElement;
  value: string;
  isSelected: boolean;
  onSelectElement: (id: string, options?: { additive?: boolean }) => void;
  onDragMoveElement: (id: string, x: number, y: number) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
}

function BarcodeElementNode({
  element,
  value,
  isSelected,
  onSelectElement,
  onDragMoveElement,
  onMoveElement,
}: BarcodeElementNodeProps): ReactElement {
  const barcodeImage = useBarcodeImage(element.barcodeType, value, element.width, element.height);

  return (
    <>
      <Rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        cornerRadius={8}
        stroke={isSelected ? '#0284c7' : '#cbd5e1'}
        strokeWidth={isSelected ? 2 : 1}
        fill="#ffffff"
        draggable
        onClick={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
        onTap={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
        onDragMove={(event) => onDragMoveElement(element.id, event.target.x(), event.target.y())}
        onDragEnd={(event) => onMoveElement(element.id, event.target.x(), event.target.y())}
      />
      {barcodeImage ? (
        <KonvaImage
          image={barcodeImage}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          onClick={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
          onTap={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
        />
      ) : null}
    </>
  );
}

interface ImageElementNodeProps {
  element: BarcodeDesignerImageElement;
  isSelected: boolean;
  bindings: Record<string, string>;
  onSelectElement: (id: string, options?: { additive?: boolean }) => void;
  onDragMoveElement: (id: string, x: number, y: number) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
}

function ImageElementNode({
  element,
  isSelected,
  bindings,
  onSelectElement,
  onDragMoveElement,
  onMoveElement,
}: ImageElementNodeProps): ReactElement {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const resolvedSrc = resolveTemplateText(element.src, bindings);

    if (!resolvedSrc.trim()) {
      setImage(null);
      return;
    }

    const nextImage = new window.Image();
    nextImage.crossOrigin = 'anonymous';
    nextImage.onload = () => setImage(nextImage);
    nextImage.onerror = () => setImage(null);
    nextImage.src = resolvedSrc;
  }, [bindings, element.src]);

  return (
    <>
      <Rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        cornerRadius={8}
        stroke={isSelected ? '#7c3aed' : '#cbd5e1'}
        strokeWidth={isSelected ? 2 : 1}
        fill="#ffffff"
        draggable
        onClick={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
        onTap={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
        onDragMove={(event) => onDragMoveElement(element.id, event.target.x(), event.target.y())}
        onDragEnd={(event) => onMoveElement(element.id, event.target.x(), event.target.y())}
      />
      {image ? (
        <KonvaImage
          image={image}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          onClick={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
          onTap={(event) => onSelectElement(element.id, { additive: resolveAdditiveSelection(event.evt) })}
        />
      ) : null}
    </>
  );
}
