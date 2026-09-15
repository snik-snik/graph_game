import type { KeyboardEvent, ReactElement } from 'react';
import type { Node, NodeId } from '../lib/graph/types';

/** Вариант подсветки узла. */
export type NodeVisualState = 'default' | 'start' | 'target' | 'selected' | 'hint';

/** Пропсы узла графа. */
export interface GraphNodeProps {
  /** Данные узла (координаты в системе координат SVG). */
  readonly node: Node;
  /** Вариант подсветки узла. */
  readonly visualState: NodeVisualState;
  /** Радиус круга в пикселях. */
  readonly radius?: number;
  /** Клик по узлу. */
  readonly onSelect: (nodeId: NodeId) => void;
}

/**
 * Узел графа в SVG: круг и подпись id.
 *
 * Клик доступен и с клавиатуры: узел фокусируется (`tabIndex`) и реагирует на
 * `Enter`/`Space`, потому что роль `button` должна вести себя как кнопка.
 */
export function GraphNode({
  node,
  visualState,
  radius = 18,
  onSelect,
}: GraphNodeProps): ReactElement {
  const handleClick = (): void => {
    onSelect(node.id);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(node.id);
    }
  };

  return (
    <g
      className={`graph-node graph-node--${visualState}`}
      data-node-id={node.id}
      data-visual-state={visualState}
      role="button"
      tabIndex={0}
      aria-label={`Узел ${node.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <circle cx={node.x} cy={node.y} r={radius} />
      <text
        className="graph-node__label"
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {node.id}
      </text>
    </g>
  );
}