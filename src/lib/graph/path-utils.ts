import { buildAdjacencyList } from './adjacency';
import type { Graph, NodeId } from './types';

/** Разделитель частей ключа ребра (не встречается в id узлов формата `nN`). */
const EDGE_KEY_SEPARATOR = '|';

/**
 * Строит неориентированный ключ ребра: `a|b` и `b|a` дают один и тот же ключ.
 *
 * @param from первый узел ребра
 * @param to второй узел ребра
 * @returns ключ ребра, не зависящий от порядка узлов
 *
 * @complexity O(1)
 */
export function makeEdgeKey(from: NodeId, to: NodeId): string {
  const first = from <= to ? from : to;
  const second = from <= to ? to : from;
  return `${first}${EDGE_KEY_SEPARATOR}${second}`;
}

/**
 * Собирает ключи рёбер пути — например, для подсветки рёбер на SVG-полотне.
 *
 * @param path последовательность id узлов
 * @returns множество ключей рёбер пути (дубликаты схлопываются)
 *
 * @complexity O(P)
 */
export function pathEdgeKeys(path: readonly NodeId[]): ReadonlySet<string> {
  const keys = new Set<string>();

  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];

    if (from === undefined || to === undefined) {
      continue;
    }

    keys.add(makeEdgeKey(from, to));
  }

  return keys;
}

/**
 * Считает суммарный вес пути по последовательности id узлов.
 *
 * Путь валиден, если каждый его узел есть в графе и каждое соседнее ребро
 * пути существует. Пустой путь валидным не считается.
 *
 * @param graph взвешенный неориентированный граф
 * @param path последовательность id узлов
 * @returns суммарный вес пути либо `null`, если путь невалиден
 *
 * @complexity O(V + E + P) — список смежности строится внутри функции
 */
export function pathWeight(graph: Graph, path: readonly NodeId[]): number | null {
  const firstNode = path[0];

  if (firstNode === undefined) {
    return null;
  }

  const adjacency = buildAdjacencyList(graph);

  if (!adjacency.has(firstNode)) {
    return null;
  }

  let total = 0;
  let previous = firstNode;

  for (let index = 1; index < path.length; index += 1) {
    const current = path[index];

    if (current === undefined) {
      return null;
    }

    const step = (adjacency.get(previous) ?? []).find((neighbour) => neighbour.to === current);

    if (step === undefined) {
      return null;
    }

    total += step.weight;
    previous = current;
  }

  return total;
}

/**
 * Проверяет, что путь существует в графе как последовательность рёбер.
 *
 * Тонкая обёртка над {@link pathWeight}, чтобы обход пути существовал
 * в проекте в единственном экземпляре.
 *
 * @param graph взвешенный неориентированный граф
 * @param path последовательность id узлов
 * @returns `true`, если каждое соседнее ребро пути есть в графе
 *
 * @complexity O(V + E + P)
 */
export function isValidPath(graph: Graph, path: readonly NodeId[]): boolean {
  return pathWeight(graph, path) !== null;
}

/**
 * Сравнивает два пути. Маршрут считается одним и тем же независимо от
 * направления обхода.
 *
 * @param a первый путь
 * @param b второй путь
 * @returns `true`, если пути описывают один и тот же маршрут
 *
 * @complexity O(P)
 */
export function isSamePath(a: readonly NodeId[], b: readonly NodeId[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  if (isSameSequence(a, b)) {
    return true;
  }

  return isSameSequence(a, [...b].reverse());
}

/**
 * Сравнивает последовательности id поэлементно.
 *
 * @param a первая последовательность
 * @param b вторая последовательность (той же длины)
 * @returns `true`, если все элементы совпали
 *
 * @complexity O(P)
 */
function isSameSequence(a: readonly NodeId[], b: readonly NodeId[]): boolean {
  return a.every((nodeId, index) => nodeId === b[index]);
}