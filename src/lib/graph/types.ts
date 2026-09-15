/**
 * Базовые доменные типы графа.
 * Единственный источник правды для формы данных графа во всём приложении.
 */

/** Идентификатор узла графа (например, `"n0"`). */
export type NodeId = string;

/** Узел графа с координатами в системе координат SVG-полотна. */
export interface Node {
  id: NodeId;
  x: number;
  y: number;
}

/** Ребро взвешенного неориентированного графа. */
export interface Edge {
  from: NodeId;
  to: NodeId;
  weight: number;
}

/** Взвешенный неориентированный граф. По правилам проекта всегда связный. */
export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

/** Результат поиска кратчайшего пути. */
export interface DijkstraResult {
  path: NodeId[];
  totalWeight: number;
}

/** Один элемент списка смежности. */
export interface AdjacentNode {
  to: NodeId;
  weight: number;
}

/** Список смежности: `id` узла -> его соседи с весами рёбер. */
export type AdjacencyList = Map<NodeId, AdjacentNode[]>;
