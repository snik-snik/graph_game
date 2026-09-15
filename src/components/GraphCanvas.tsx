import { useMemo, type ReactElement } from 'react';
import { useSvgLayout } from '../hooks/use-svg-layout';
import { makeEdgeKey, pathEdgeKeys } from '../lib/graph/path-utils';
import type { Graph, Node, NodeId } from '../lib/graph/types';
import { GraphEdge } from './GraphEdge';
import { GraphNode, type NodeVisualState } from './GraphNode';

/** Пропсы SVG-полотна графа. */
export interface GraphCanvasProps {
  /** Граф текущей партии. */
  readonly graph: Graph;
  /** Стартовый узел партии. */
  readonly startId: NodeId;
  /** Целевой узел партии. */
  readonly targetId: NodeId;
  /** Узлы, выбранные игроком, в порядке выбора (для подсветки). */
  readonly playerPath: readonly NodeId[];
  /** Эталонный путь для подсветки; `null`, пока он скрыт. */
  readonly hintPath?: readonly NodeId[] | null;
  /** Клик по узлу графа. */
  readonly onNodeSelect: (nodeId: NodeId) => void;
}

/** Пустое множество ключей рёбер — разделяемая константа для случая без подсказки. */
const NO_KEYS: ReadonlySet<string> = new Set<string>();

/** Пустой список узлов — разделяемая константа для случая без подсказки. */
const NO_NODES: readonly NodeId[] = [];

/**
 * SVG-полотно графа: рёбра с весами и узлы.
 *
 * Раскладка считается хуком `useSvgLayout` и мемоизируется; множества ключей
 * рёбер позволяют за O(1) понять, подсвечивать ли конкретное ребро, поэтому
 * рендер стоит O(V + E).
 */
export function GraphCanvas({
  graph,
  startId,
  targetId,
  playerPath,
  hintPath = null,
  onNodeSelect,
}: GraphCanvasProps): ReactElement {
  const layout = useSvgLayout(graph);
  const selectedEdgeKeys = useMemo(() => pathEdgeKeys(playerPath), [playerPath]);
  const hintEdgeKeys = useMemo(
    () => (hintPath === null ? NO_KEYS : pathEdgeKeys(hintPath)),
    [hintPath],
  );
  const pathNodeIds = useMemo(() => new Set(playerPath), [playerPath]);
  const hintNodeIds = useMemo(() => new Set(hintPath ?? NO_NODES), [hintPath]);

  const positionedNodes = useMemo(() => {
    const result: Node[] = [];

    for (const node of graph.nodes) {
      const position = layout.positions.get(node.id);

      if (position !== undefined) {
        result.push({ id: node.id, x: position.x, y: position.y });
      }
    }

    return result;
  }, [graph.nodes, layout.positions]);

  return (
    <svg
      className="graph-canvas"
      role="group"
      aria-label="Граф"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
    >
      <g className="graph-canvas__edges">
        {graph.edges.map((edge, index) => {
          const from = layout.positions.get(edge.from);
          const to = layout.positions.get(edge.to);

          if (from === undefined || to === undefined) {
            return null;
          }

          const edgeKey = makeEdgeKey(edge.from, edge.to);

          return (
            <GraphEdge
              key={`${edgeKey}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              weight={edge.weight}
              isSelected={selectedEdgeKeys.has(edgeKey)}
              isHint={hintEdgeKeys.has(edgeKey)}
            />
          );
        })}
      </g>
      <g className="graph-canvas__nodes">
        {positionedNodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            visualState={resolveVisualState(node.id, startId, targetId, pathNodeIds, hintNodeIds)}
            onSelect={onNodeSelect}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Определяет вариант подсветки узла по приоритету: старт, цель, путь игрока,
 * эталонный путь, обычный узел.
 *
 * @param nodeId id узла
 * @param startId стартовый узел партии
 * @param targetId целевой узел партии
 * @param pathNodeIds узлы пути игрока
 * @param hintNodeIds узлы эталонного пути
 * @returns вариант подсветки узла
 *
 * @complexity O(1)
 */
function resolveVisualState(
  nodeId: NodeId,
  startId: NodeId,
  targetId: NodeId,
  pathNodeIds: ReadonlySet<NodeId>,
  hintNodeIds: ReadonlySet<NodeId>,
): NodeVisualState {
  if (nodeId === startId) {
    return 'start';
  }

  if (nodeId === targetId) {
    return 'target';
  }

  if (pathNodeIds.has(nodeId)) {
    return 'selected';
  }

  if (hintNodeIds.has(nodeId)) {
    return 'hint';
  }

  return 'default';
}