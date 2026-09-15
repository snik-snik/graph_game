import { bfs } from '../graph/bfs';
import { generateGraph, type GenerateGraphOptions } from '../graph/graph-generator';
import { createSeededRandom, randomInt } from '../graph/random';
import type { Graph, NodeId } from '../graph/types';
import type { NewGameParams } from './game-state';

/** Концы маршрута партии. */
export interface MatchEndpoints {
  /** Стартовый узел. */
  readonly startId: NodeId;
  /** Целевой узел. */
  readonly targetId: NodeId;
}

/**
 * Создаёт параметры новой партии: генерирует граф и выбирает концы маршрута.
 *
 * Партия полностью воспроизводима по seed: и граф, и концы маршрута зависят
 * только от него.
 *
 * @param seed seed партии
 * @param options параметры генерации графа
 * @returns параметры, пригодные для `NEW_GAME` и `createInitialState`
 * @throws Если параметры генерации некорректны (см. `generateGraph`).
 *
 * @complexity O(V log V + E)
 */
export function createMatchParams(seed: number, options: GenerateGraphOptions = {}): NewGameParams {
  const graph = generateGraph(seed, options);
  const endpoints = pickEndpoints(graph, createSeededRandom(seed));

  return { graph, seed, startId: endpoints.startId, targetId: endpoints.targetId };
}

/**
 * Выбирает стартовый и целевой узлы партии.
 *
 * Стартовый узел берётся случайно, а целевой — самый удалённый от него по числу
 * шагов: в обходе в ширину узлы идут по возрастанию уровня, поэтому последний
 * узел обхода имеет максимальный уровень. Такой маршрут всегда нетривиален.
 *
 * @param graph связный граф партии
 * @param random источник случайности
 * @returns id стартового и целевого узлов
 * @throws Если в графе меньше двух узлов.
 *
 * @complexity O(V + E)
 */
export function pickEndpoints(graph: Graph, random: () => number): MatchEndpoints {
  const firstNode = graph.nodes[0];

  if (firstNode === undefined) {
    throw new Error('pickEndpoints: graph must contain at least two nodes');
  }

  const startNode = graph.nodes[randomInt(random, 0, graph.nodes.length - 1)];

  if (startNode === undefined) {
    throw new Error('pickEndpoints: graph must contain at least two nodes');
  }

  const order = bfs(graph, startNode.id);
  const farthestId = order[order.length - 1];

  if (farthestId !== undefined && farthestId !== startNode.id) {
    return { startId: startNode.id, targetId: farthestId };
  }

  const fallback = graph.nodes.find((node) => node.id !== startNode.id);

  if (fallback === undefined) {
    throw new Error('pickEndpoints: graph must contain at least two nodes');
  }

  return { startId: startNode.id, targetId: fallback.id };
}