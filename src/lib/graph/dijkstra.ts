import { buildAdjacencyList } from './adjacency';
import { MinHeap } from './min-heap';
import type { DijkstraResult, Graph, NodeId } from './types';

/**
 * Находит кратчайший путь между двумя узлами взвешенного графа.
 *
 * Алгоритм Дейкстры с ленивым удалением из кучи: в кучу может попасть
 * несколько записей для одного узла, устаревшие отбрасываются по `visited`.
 * Рёбра с отрицательным весом не поддерживаются (см. precondition ниже).
 *
 * @param graph взвешенный граф без рёбер с отрицательным весом
 * @param from id стартового узла
 * @param to id целевого узла
 * @returns кратчайший путь и его суммарный вес
 * @throws Если узла `from`/`to` нет в графе или путь между ними не существует.
 *
 * @complexity O(E log V) с бинарной кучей
 */
export function dijkstra(graph: Graph, from: NodeId, to: NodeId): DijkstraResult {
  const adjacency = buildAdjacencyList(graph);

  if (!adjacency.has(from)) {
    throw new Error(`dijkstra: start node "${from}" is not in the graph`);
  }

  if (!adjacency.has(to)) {
    throw new Error(`dijkstra: target node "${to}" is not in the graph`);
  }

  const distances = new Map<NodeId, number>([[from, 0]]);
  const previous = new Map<NodeId, NodeId>();
  const visited = new Set<NodeId>();
  const queue = new MinHeap<NodeId>();
  queue.push(0, from);

  while (queue.size > 0) {
    const next = queue.pop();

    if (next === undefined) {
      break;
    }

    if (visited.has(next.value)) {
      continue;
    }

    visited.add(next.value);

    if (next.value === to) {
      break;
    }

    for (const neighbour of adjacency.get(next.value) ?? []) {
      if (visited.has(neighbour.to)) {
        continue;
      }

      const candidate = next.key + neighbour.weight;
      const known = distances.get(neighbour.to);

      if (known === undefined || candidate < known) {
        distances.set(neighbour.to, candidate);
        previous.set(neighbour.to, next.value);
        queue.push(candidate, neighbour.to);
      }
    }
  }

  const totalWeight = distances.get(to);

  if (totalWeight === undefined) {
    throw new Error(`dijkstra: no path from "${from}" to "${to}"`);
  }

  return { path: reconstructPath(previous, from, to, graph.nodes.length), totalWeight };
}

/**
 * Восстанавливает путь от `from` до `to` по карте предшественников.
 *
 * @param previous карта «узел -> предыдущий узел на кратчайшем пути»
 * @param from id стартового узла
 * @param to id целевого узла
 * @param nodeCount количество узлов графа (защита от зацикливания)
 * @returns последовательность id от `from` до `to`
 * @throws Если цепочка предшественников оборвалась или зациклилась.
 *
 * @complexity O(V)
 */
function reconstructPath(
  previous: ReadonlyMap<NodeId, NodeId>,
  from: NodeId,
  to: NodeId,
  nodeCount: number,
): NodeId[] {
  const path: NodeId[] = [to];
  let current = to;

  while (current !== from) {
    const parent = previous.get(current);

    if (parent === undefined || path.length > nodeCount) {
      throw new Error(`dijkstra: failed to reconstruct path from "${from}" to "${to}"`);
    }

    path.push(parent);
    current = parent;
  }

  return path.reverse();
}
