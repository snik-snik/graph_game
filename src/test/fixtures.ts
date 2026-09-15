import type { Graph, NodeId } from '../lib/graph/types';

/**
 * Маленький эталонный граф для тестов.
 *
 * Раскладка (все рёбра неориентированные):
 *
 * ```
 * n0 ---1--- n1 ---1--- n2
 *  \          |         /
 *   5         2        2
 *    \        |       /
 *     \----- n3 -----/
 * ```
 *
 * Кратчайший путь `n0 -> n2` весит 2 (через `n1`), прямой путь весит 5.
 */
export const SMALL_GRAPH: Graph = {
  nodes: [
    { id: 'n0', x: 0, y: 0 },
    { id: 'n1', x: 100, y: 0 },
    { id: 'n2', x: 200, y: 0 },
    { id: 'n3', x: 100, y: 120 },
  ],
  edges: [
    { from: 'n0', to: 'n1', weight: 1 },
    { from: 'n1', to: 'n2', weight: 1 },
    { from: 'n0', to: 'n2', weight: 5 },
    { from: 'n1', to: 'n3', weight: 2 },
    { from: 'n2', to: 'n3', weight: 2 },
  ],
};

/** Ожидаемый кратчайший путь в {@link SMALL_GRAPH} от `n0` к `n2`. */
export const SMALL_GRAPH_SHORTEST_PATH: readonly NodeId[] = ['n0', 'n1', 'n2'];

/** Ожидаемый вес кратчайшего пути в {@link SMALL_GRAPH} от `n0` к `n2`. */
export const SMALL_GRAPH_SHORTEST_WEIGHT = 2;

/**
 * Возвращает значение, гарантированно не `undefined`.
 *
 * Нужен в тестах, где `noUncheckedIndexedAccess` делает обращение по индексу
 * потенциально `undefined`: так тест падает с понятным сообщением вместо
 * невнятной ошибки типов.
 *
 * @param value проверяемое значение
 * @param description описание значения для сообщения об ошибке
 * @returns то же значение, но без `undefined` в типе
 * @throws Если значение равно `undefined`.
 *
 * @complexity O(1)
 */
export function requireDefined<T>(value: T | undefined, description: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${description} to be defined`);
  }

  return value;
}