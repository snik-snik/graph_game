import type { Graph, NodeId } from '../graph/types';

/** Статус партии. */
export type GameStatus = 'playing' | 'won' | 'lost';

/** Состояние игровой партии. */
export interface GameState {
  /** Граф текущей партии. */
  readonly graph: Graph;
  /** Seed, по которому сгенерирован граф. */
  readonly seed: number;
  /** Стартовый узел. */
  readonly startId: NodeId;
  /** Целевой узел. */
  readonly targetId: NodeId;
  /** Узлы, выбранные игроком, в порядке выбора. */
  readonly playerPath: NodeId[];
  /** Статус партии. */
  readonly status: GameStatus;
  /** Вес текущего пути игрока; `null`, если путь невалиден. */
  readonly playerWeight: number | null;
  /** Вес кратчайшего пути; известен после проверки (`SUBMIT`). */
  readonly bestWeight: number | null;
  /** Итоговый счёт партии; `null`, пока партия не завершена. */
  readonly score: number | null;
  /** Количество использованных подсказок. */
  readonly hintsUsed: number;
}

/** Максимальное количество подсказок за партию. */
export const MAX_HINTS = 3;

/** Параметры новой партии: переиспользуются при старте игры и в действии `NEW_GAME`. */
export interface NewGameParams {
  /** Граф партии. */
  readonly graph: Graph;
  /** Seed, по которому сгенерирован граф. */
  readonly seed: number;
  /** Стартовый узел. */
  readonly startId: NodeId;
  /** Целевой узел. */
  readonly targetId: NodeId;
}

/** Действия, которые может выполнить игрок. */
export type GameAction =
  | ({ readonly type: 'NEW_GAME' } & NewGameParams)
  | { readonly type: 'SELECT_NODE'; readonly nodeId: NodeId }
  | { readonly type: 'UNDO_STEP' }
  | { readonly type: 'RESET_PATH' }
  | { readonly type: 'REQUEST_HINT' }
  | { readonly type: 'SUBMIT' };

/**
 * Создаёт начальное состояние новой партии.
 *
 * Путь начинается со стартового узла, поэтому его вес равен `0`; статус —
 * `'playing'`, счёт и подсказки обнулены.
 *
 * @param params параметры новой партии (граф, seed, стартовый и целевой узлы)
 * @returns начальное состояние партии
 * @throws Если стартового или целевого узла нет в графе либо они совпадают.
 *
 * @complexity O(V)
 */
export function createInitialState(params: NewGameParams): GameState {
  const hasNode = (nodeId: NodeId): boolean =>
    params.graph.nodes.some((node) => node.id === nodeId);

  if (!hasNode(params.startId)) {
    throw new Error(`createInitialState: start node "${params.startId}" is not in the graph`);
  }

  if (!hasNode(params.targetId)) {
    throw new Error(`createInitialState: target node "${params.targetId}" is not in the graph`);
  }

  if (params.startId === params.targetId) {
    throw new Error('createInitialState: start node and target node must be different');
  }

  return {
    graph: params.graph,
    seed: params.seed,
    startId: params.startId,
    targetId: params.targetId,
    playerPath: [params.startId],
    status: 'playing',
    playerWeight: 0,
    bestWeight: null,
    score: null,
    hintsUsed: 0,
  };
}