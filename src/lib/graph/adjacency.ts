import type { AdjacencyList, AdjacentNode, Graph, NodeId } from './types';

/**
 * Строит список смежности для взвешенного неориентированного графа.
 *
 * Для каждого ребра добавляются две записи (`from -> to` и `to -> from`),
 * поэтому список подходит и для обходов, и для проверки смежности.
 * Узлы без рёбер получают пустой список: это важно для обходов и для
 * проверки связности.
 *
 * @param graph взвешенный неориентированный граф
 * @returns список смежности, где ключ — id узла
 * @throws Если ребро ссылается на узел, которого нет в графе.
 *
 * @complexity O(V + E)
 */
export function buildAdjacencyList(graph: Graph): AdjacencyList {
  const adjacency: AdjacencyList = new Map<NodeId, AdjacentNode[]>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    const fromNeighbours = adjacency.get(edge.from);
    const toNeighbours = adjacency.get(edge.to);

    if (fromNeighbours === undefined || toNeighbours === undefined) {
      throw new Error(
        `buildAdjacencyList: edge "${edge.from} -> ${edge.to}" references a node that is missing in the graph`,
      );
    }

    fromNeighbours.push({ to: edge.to, weight: edge.weight });
    toNeighbours.push({ to: edge.from, weight: edge.weight });
  }

  return adjacency;
}