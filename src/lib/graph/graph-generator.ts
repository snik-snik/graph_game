import { isConnected } from './bfs';
import { makeEdgeKey } from './path-utils';
import { createSeededRandom, randomFloat, randomInt } from './random';
import type { Edge, Graph, Node, NodeId } from './types';

/** Параметры генерации графа. */
export interface GenerateGraphOptions {
  /** Количество узлов. */
  readonly nodeCount?: number;
  /** Ширина области раскладки (координаты SVG). */
  readonly width?: number;
  /** Высота области раскладки (координаты SVG). */
  readonly height?: number;
  /** Минимальный вес ребра (включительно). */
  readonly minWeight?: number;
  /** Максимальный вес ребра (включительно). */
  readonly maxWeight?: number;
}

/** Количество узлов по умолчанию. */
export const DEFAULT_NODE_COUNT = 12;
/** Ширина области раскладки по умолчанию. */
export const DEFAULT_WIDTH = 640;
/** Высота области раскладки по умолчанию. */
export const DEFAULT_HEIGHT = 420;
/** Минимальный вес ребра по умолчанию. */
export const DEFAULT_MIN_WEIGHT = 1;
/** Максимальный вес ребра по умолчанию. */
export const DEFAULT_MAX_WEIGHT = 9;

/** Доля дополнительных рёбер от количества узлов. */
const EXTRA_EDGE_RATIO = 0.35;

/** Доля ячейки, в пределах которой узел смещается относительно её края. */
const JITTER_RATIO = 0.3;

/** Множитель округления координат до сотых — результат стабилен и читаем. */
const COORDINATE_PRECISION = 100;

/** Параметры генерации со снятыми значениями по умолчанию. */
interface ResolvedOptions {
  readonly nodeCount: number;
  readonly width: number;
  readonly height: number;
  readonly minWeight: number;
  readonly maxWeight: number;
}

/**
 * Генерирует связный взвешенный граф с детерминированной раскладкой.
 *
 * Узлы раскладываются по сетке с детерминированным дрожанием внутри ячеек,
 * затем строится связный каркас (каждый узел цепляется к ближайшему из уже
 * подключённых) и добавляются дополнительные короткие рёбра. Связность
 * результата проверяется через {@link isConnected}.
 *
 * @param seed seed генератора случайных чисел (нужен для воспроизводимости)
 * @param options параметры генерации
 * @returns связный взвешенный граф
 * @throws Если параметры некорректны или результат оказался несвязным.
 *
 * @complexity O(V log V + E) — раскладка по сетке и поиск ближайших узлов
 */
export function generateGraph(seed: number, options: GenerateGraphOptions = {}): Graph {
  const resolved = resolveOptions(options);
  const random = createSeededRandom(seed);
  const nodes = layoutNodes(resolved, random);
  const edges = connectNodes(nodes, resolved, random);
  const graph: Graph = { nodes, edges };

  if (!isConnected(graph)) {
    throw new Error(`generateGraph: generated graph is not connected (seed=${seed})`);
  }

  return graph;
}

/**
 * Подставляет значения по умолчанию и валидирует параметры генерации.
 *
 * @param options пользовательские параметры
 * @returns параметры со снятыми значениями по умолчанию
 * @throws Если параметры выходят за допустимые границы.
 *
 * @complexity O(1)
 */
function resolveOptions(options: GenerateGraphOptions): ResolvedOptions {
  const resolved: ResolvedOptions = {
    nodeCount: options.nodeCount ?? DEFAULT_NODE_COUNT,
    width: options.width ?? DEFAULT_WIDTH,
    height: options.height ?? DEFAULT_HEIGHT,
    minWeight: options.minWeight ?? DEFAULT_MIN_WEIGHT,
    maxWeight: options.maxWeight ?? DEFAULT_MAX_WEIGHT,
  };

  if (!Number.isInteger(resolved.nodeCount) || resolved.nodeCount < 2) {
    throw new Error(
      `generateGraph: nodeCount must be an integer greater than or equal to 2, got ${resolved.nodeCount}`,
    );
  }

  if (!Number.isFinite(resolved.width) || resolved.width <= 0) {
    throw new Error(`generateGraph: width must be a positive number, got ${resolved.width}`);
  }

  if (!Number.isFinite(resolved.height) || resolved.height <= 0) {
    throw new Error(`generateGraph: height must be a positive number, got ${resolved.height}`);
  }

  if (!Number.isInteger(resolved.minWeight) || resolved.minWeight < 1) {
    throw new Error(
      `generateGraph: minWeight must be an integer greater than or equal to 1, got ${resolved.minWeight}`,
    );
  }

  if (!Number.isInteger(resolved.maxWeight) || resolved.maxWeight < resolved.minWeight) {
    throw new Error(
      `generateGraph: maxWeight must be an integer greater than or equal to minWeight, got ${resolved.maxWeight}`,
    );
  }

  return resolved;
}

/**
 * Раскладывает узлы по сетке, добавляя детерминированное дрожание внутри ячеек.
 *
 * Сетка гарантирует, что все узлы остаются внутри запрошенной области и не
 * слипаются в одну точку.
 *
 * @param options параметры генерации со снятыми значениями по умолчанию
 * @param random источник случайности
 * @returns узлы с id вида `n0`, `n1`, ...
 *
 * @complexity O(V)
 */
function layoutNodes(options: ResolvedOptions, random: () => number): Node[] {
  const columns = Math.ceil(Math.sqrt(options.nodeCount));
  const rows = Math.ceil(options.nodeCount / columns);
  const cellWidth = options.width / columns;
  const cellHeight = options.height / rows;
  const nodes: Node[] = [];

  for (let index = 0; index < options.nodeCount; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const jitterX = randomFloat(random, JITTER_RATIO, 1 - JITTER_RATIO) * cellWidth;
    const jitterY = randomFloat(random, JITTER_RATIO, 1 - JITTER_RATIO) * cellHeight;

    nodes.push({
      id: `n${index}`,
      x: roundCoordinate(column * cellWidth + jitterX),
      y: roundCoordinate(row * cellHeight + jitterY),
    });
  }

  return nodes;
}

/**
 * Строит рёбра графа: связный каркас плюс дополнительные короткие рёбра.
 *
 * @param nodes узлы графа
 * @param options параметры генерации со снятыми значениями по умолчанию
 * @param random источник случайности
 * @returns рёбра без дубликатов; граф гарантированно связный
 *
 * @complexity O(V log V + E)
 */
function connectNodes(
  nodes: readonly Node[],
  options: ResolvedOptions,
  random: () => number,
): Edge[] {
  const positions = new Map<NodeId, Node>(nodes.map((node) => [node.id, node]));
  const usedKeys = new Set<string>();
  const edges: Edge[] = [];

  const addEdge = (from: NodeId, to: NodeId): void => {
    const key = makeEdgeKey(from, to);

    if (usedKeys.has(key)) {
      return;
    }

    usedKeys.add(key);
    edges.push({ from, to, weight: randomInt(random, options.minWeight, options.maxWeight) });
  };

  const order = shuffleIds(
    nodes.map((node) => node.id),
    random,
  );
  const firstId = order[0];

  if (firstId === undefined) {
    return edges;
  }

  const connectedIds: NodeId[] = [firstId];

  for (let index = 1; index < order.length; index += 1) {
    const nodeId = order[index];

    if (nodeId === undefined) {
      continue;
    }

    const neighbourId = findNearestConnectedId(nodeId, connectedIds, positions);

    if (neighbourId !== undefined) {
      addEdge(neighbourId, nodeId);
    }

    connectedIds.push(nodeId);
  }

  const extraEdgeCount = Math.round(nodes.length * EXTRA_EDGE_RATIO);

  for (let index = 0; index < extraEdgeCount; index += 1) {
    const nodeId = pickRandomId(nodes, random);
    const neighbourId = findNearestFreeId(nodeId, nodes, usedKeys);

    if (neighbourId === undefined) {
      break;
    }

    addEdge(nodeId, neighbourId);
  }

  return edges;
}

/**
 * Ищет ближайший узел среди уже подключённых к каркасу.
 *
 * @param nodeId узел, который нужно подключить
 * @param connectedIds id уже подключённых узлов
 * @param positions координаты узлов по id
 * @returns id ближайшего подключённого узла либо `undefined`
 *
 * @complexity O(C), где C — количество подключённых узлов
 */
function findNearestConnectedId(
  nodeId: NodeId,
  connectedIds: readonly NodeId[],
  positions: ReadonlyMap<NodeId, Node>,
): NodeId | undefined {
  const node = positions.get(nodeId);

  if (node === undefined) {
    return undefined;
  }

  let nearestId: NodeId | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidateId of connectedIds) {
    const candidate = positions.get(candidateId);

    if (candidate === undefined) {
      continue;
    }

    const candidateDistance = distance(node, candidate);

    if (candidateDistance < nearestDistance) {
      nearestDistance = candidateDistance;
      nearestId = candidateId;
    }
  }

  return nearestId;
}

/**
 * Ищет ближайший узел, ребро к которому ещё не добавлено в граф.
 *
 * @param nodeId исходный узел
 * @param nodes все узлы графа
 * @param usedKeys ключи уже добавленных рёбер
 * @returns id ближайшего свободного узла либо `undefined`, если такого нет
 *
 * @complexity O(V)
 */
function findNearestFreeId(
  nodeId: NodeId,
  nodes: readonly Node[],
  usedKeys: ReadonlySet<string>,
): NodeId | undefined {
  const node = nodes.find((candidate) => candidate.id === nodeId);

  if (node === undefined) {
    return undefined;
  }

  let nearestId: NodeId | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of nodes) {
    if (candidate.id === nodeId || usedKeys.has(makeEdgeKey(nodeId, candidate.id))) {
      continue;
    }

    const candidateDistance = distance(node, candidate);

    if (candidateDistance < nearestDistance) {
      nearestDistance = candidateDistance;
      nearestId = candidate.id;
    }
  }

  return nearestId;
}

/**
 * Возвращает id случайного узла.
 *
 * @param nodes узлы графа (непустой массив)
 * @param random источник случайности
 * @returns id случайного узла
 * @throws Если список узлов пуст.
 *
 * @complexity O(1)
 */
function pickRandomId(nodes: readonly Node[], random: () => number): NodeId {
  const node = nodes[randomInt(random, 0, nodes.length - 1)];

  if (node === undefined) {
    throw new Error('generateGraph: cannot pick a node from an empty list');
  }

  return node.id;
}

/**
 * Перемешивает копию массива id (алгоритм Фишера — Йетса).
 *
 * @param ids исходные id
 * @param random источник случайности
 * @returns новый массив со случайным порядком элементов
 *
 * @complexity O(V)
 */
function shuffleIds(ids: readonly NodeId[], random: () => number): NodeId[] {
  const result = [...ids];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(random, 0, index);
    const current = result[index];
    const swapped = result[swapIndex];

    if (current === undefined || swapped === undefined) {
      continue;
    }

    result[index] = swapped;
    result[swapIndex] = current;
  }

  return result;
}

/**
 * Считает евклидово расстояние между двумя узлами.
 *
 * @param a первый узел
 * @param b второй узел
 * @returns расстояние между узлами
 *
 * @complexity O(1)
 */
function distance(a: Node, b: Node): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Округляет координату до сотых.
 *
 * @param value координата
 * @returns округлённая координата
 *
 * @complexity O(1)
 */
function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}
