import type { ReactElement } from 'react';

/** Пропсы ребра графа. */
export interface GraphEdgeProps {
  /** Координата начала ребра по X. */
  readonly x1: number;
  /** Координата начала ребра по Y. */
  readonly y1: number;
  /** Координата конца ребра по X. */
  readonly x2: number;
  /** Координата конца ребра по Y. */
  readonly y2: number;
  /** Вес ребра. */
  readonly weight: number;
  /** Входит ли ребро в путь игрока (для подсветки). */
  readonly isSelected: boolean;
  /** Входит ли ребро в эталонный путь (подсказка/итог партии). */
  readonly isHint: boolean;
}

/**
 * Ребро графа в SVG: линия и подпись веса.
 *
 * Подсветка пути игрока важнее подсветки эталонного пути, поэтому модификатор
 * класса выбирается по приоритету «выбранное ребро → подсказка → обычное».
 */
export function GraphEdge({
  x1,
  y1,
  x2,
  y2,
  weight,
  isSelected,
  isHint,
}: GraphEdgeProps): ReactElement {
  const className = isSelected
    ? 'graph-edge graph-edge--selected'
    : isHint
      ? 'graph-edge graph-edge--hint'
      : 'graph-edge';

  return (
    <g className="graph-edge-group">
      <line className={className} x1={x1} y1={y1} x2={x2} y2={y2} />
      <text
        className="graph-edge__weight"
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {weight}
      </text>
    </g>
  );
}