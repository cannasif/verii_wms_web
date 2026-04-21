import type { ReactElement } from 'react';
import type { BarcodeDesignerTemplateDocument } from '../types/barcode-designer-editor.types';

interface BarcodeTemplatePresetThumbnailProps {
  document: BarcodeDesignerTemplateDocument;
}

export function BarcodeTemplatePresetThumbnail({ document }: BarcodeTemplatePresetThumbnailProps): ReactElement {
  const width = document.canvas.width;
  const height = document.canvas.height;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-inner dark:border-white/10 dark:bg-slate-950">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full bg-[linear-gradient(135deg,#ffffff,#f8fafc)] dark:bg-[linear-gradient(135deg,#0f172a,#111827)]" preserveAspectRatio="xMidYMid meet">
        {document.elements.map((element) => {
          if (element.type === 'rect') {
            return <rect key={element.id} x={element.x / 3.78} y={element.y / 3.78} width={element.width / 3.78} height={element.height / 3.78} fill="none" stroke="#334155" strokeWidth="0.8" />;
          }

          if (element.type === 'line') {
            const [x1, y1, x2, y2] = element.points;
            return (
              <line
                key={element.id}
                x1={(element.x + x1) / 3.78}
                y1={(element.y + y1) / 3.78}
                x2={(element.x + x2) / 3.78}
                y2={(element.y + y2) / 3.78}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            );
          }

          if (element.type === 'image') {
            return (
              <rect
                key={element.id}
                x={element.x / 3.78}
                y={element.y / 3.78}
                width={element.width / 3.78}
                height={element.height / 3.78}
                rx="2"
                fill="#e2e8f0"
                stroke="#94a3b8"
                strokeDasharray="2 1"
              />
            );
          }

          if (element.type === 'barcode') {
            return (
              <g key={element.id}>
                <rect x={element.x / 3.78} y={element.y / 3.78} width={element.width / 3.78} height={element.height / 3.78} fill="#f8fafc" stroke="#0f172a" strokeWidth="0.4" />
                {element.barcodeType === 'code128' ? (
                  Array.from({ length: 14 }).map((_, index) => (
                    <rect
                      key={`${element.id}-${index}`}
                      x={element.x / 3.78 + 1 + index * ((element.width / 3.78 - 4) / 14)}
                      y={element.y / 3.78 + 1}
                      width={index % 2 === 0 ? 1.1 : 0.5}
                      height={Math.max(2, element.height / 3.78 - 2)}
                      fill="#111827"
                    />
                  ))
                ) : (
                  Array.from({ length: 6 }).map((_, row) =>
                    Array.from({ length: 6 }).map((__, col) => (
                      <rect
                        key={`${element.id}-${row}-${col}`}
                        x={element.x / 3.78 + 1 + col * 2}
                        y={element.y / 3.78 + 1 + row * 2}
                        width="1.4"
                        height="1.4"
                        fill={(row + col) % 2 === 0 ? '#111827' : '#e2e8f0'}
                      />
                    )),
                  )
                )}
              </g>
            );
          }

          return (
            <rect
              key={element.id}
              x={element.x / 3.78}
              y={element.y / 3.78}
              width={Math.max(8, element.width / 3.78)}
              height={Math.max(2, element.height / 3.78)}
              rx="1.5"
              fill="#cbd5e1"
            />
          );
        })}
      </svg>
    </div>
  );
}
