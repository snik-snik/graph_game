import { buildAdjacencyList } from './adjacency';
import type { Graph, NodeId } from './types';

/**
 * Обход графа в ширину от указанного узла.
 *
 * Порядок обхода — по «уровням» удалённости от стартового узла: чем позже
 * узел попал в результат, тем больше его уровень. Очередь реализована
 * индексом-указателем, поэтому извлечение из неё не сдвигает массив.
 *
 * @param graph взвешенный граф
 * @param startId id узла, с которого начинается обход
 * @returns id посещённых узлов в порядке обхода, без дублей
 * @throws Если узла `startId` нет в графе.
 *
 * @complexity O(V + E)
 */
export function bfs(graph: Graph, startId: NodeId): NodeId[] {
  const adjacency = buildAdjacencyList(graph);

  if (!adjacency.has(startId)) {
    throw new Error(`bfs: start node "${startId}" is not in the graph`);
  }

  const visited = new Set<NodeId>([startId]);
  const queue: NodeId[] = [startId];
  const order: NodeId[] = [];

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];

    if (current === undefined) {
      break;
    }

    order.push(current);

    for (const neighbour of adjacency.get(current) ?? []) {
      if (visited.has(neighbour.to)) {
        continue;
      }

      visited.add(neighbour.to);
      queue.push(neighbour.to);
    }
  }

  return order;
}

/**
 * Проверяет связность графа: из любого узла достижимы все остальные.
 *
 * Реализация переиспользует {@link bfs}, чтобы обход графа существовал
 * в проекте в единственном экземпляре. Пустой граф считается несвязным.
 *
 * @param graph проверяемый граф
 * @returns `true`, если граф связный
 *
 * @complexity O(V + E)
 */
export function isConnected(graph: Graph): boolean {
  const firstNode = graph.nodes[0];

  if (firstNode === undefined) {
    return false;
  }

  return bfs(graph, firstNode.id).length === graph.nodes.length;
}