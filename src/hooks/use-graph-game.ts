import { useCallback, useMemo, useReducer } from 'react';
import { createMatchParams } from '../lib/game/match';
import {
  createSession,
  sessionReducer,
  type GameSession,
  type MatchStats,
} from '../lib/game/game-session';
import type { GameState } from '../lib/game/game-state';
import { dijkstra } from '../lib/graph/dijkstra';
import { createRandomSeed } from '../lib/graph/random';
import type { Graph, NodeId } from '../lib/graph/types';

/** Параметры запуска хука. */
export interface UseGraphGameOptions {
  /** Seed первой партии; по умолчанию выбирается случайно. */
  readonly initialSeed?: number;
}

/** Публичный API хука игры. */
export interface UseGraphGameResult {
  /** Текущее состояние партии. */
  readonly state: GameState;
  /** Статистика по всем партиям сессии. */
  readonly stats: MatchStats;
  /** Эталонный путь: известен после подсказки или после завершения партии. */
  readonly optimalPath: readonly NodeId[] | null;
  /** Начать новую партию (без аргумента — со случайным seed). */
  readonly startNewGame: (seed?: number) => void;
  /** Выбрать узел графа. */
  readonly selectNode: (nodeId: NodeId) => void;
  /** Откатить последний шаг пути. */
  readonly undoStep: () => void;
  /** Сбросить путь к стартовому узлу. */
  readonly resetPath: () => void;
  /** Запросить подсказку. */
  readonly requestHint: () => void;
  /** Проверить собранный путь. */
  readonly submit: () => void;
}

/**
 * Связывает чистую игровую логику из `src/lib` с состоянием React.
 *
 * Всё состояние (партия + статистика сессии) живёт в одном `useReducer` поверх
 * `sessionReducer`, который делегирует переходы в чистый `gameReducer`.
 * Обработчики стабильны (`useCallback`), а эталонный путь мемоизирован, чтобы
 * не запускать алгоритм Дейкстры на каждой перерисовке.
 *
 * @param options параметры запуска (например, фиксированный seed для тестов)
 * @returns состояние партии, статистика и обработчики действий игрока
 *
 * @complexity O(E log V) при старте партии, подсказке и проверке пути
 */
export function useGraphGame(options: UseGraphGameOptions = {}): UseGraphGameResult {
  const [session, dispatch] = useReducer(sessionReducer, options.initialSeed, createSessionFromSeed);
  const { game, stats } = session;

  const startNewGame = useCallback((seed?: number) => {
    dispatch({ type: 'NEW_GAME', ...createMatchParams(seed ?? createRandomSeed()) });
  }, []);

  const selectNode = useCallback((nodeId: NodeId) => {
    dispatch({ type: 'SELECT_NODE', nodeId });
  }, []);

  const undoStep = useCallback(() => {
    dispatch({ type: 'UNDO_STEP' });
  }, []);

  const resetPath = useCallback(() => {
    dispatch({ type: 'RESET_PATH' });
  }, []);

  const requestHint = useCallback(() => {
    dispatch({ type: 'REQUEST_HINT' });
  }, []);

  const submit = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
  }, []);

  const isOptimalPathRevealed = game.hintsUsed > 0 || game.status !== 'playing';
  const optimalPath = useMemo(
    () =>
      isOptimalPathRevealed
        ? findOptimalPath(game.graph, game.startId, game.targetId)
        : null,
    [isOptimalPathRevealed, game.graph, game.startId, game.targetId],
  );

  return {
    state: game,
    stats,
    optimalPath,
    startNewGame,
    selectNode,
    undoStep,
    resetPath,
    requestHint,
    submit,
  };
}

/**
 * Создаёт сессию для стартового состояния `useReducer`.
 *
 * @param seed seed первой партии либо `undefined` для случайного seed
 * @returns состояние сессии с новой партией
 *
 * @complexity O(V log V + E)
 */
function createSessionFromSeed(seed: number | undefined): GameSession {
  return createSession(createMatchParams(seed ?? createRandomSeed()));
}

/**
 * Ищет эталонный путь и не падает, если граф вдруг окажется несвязным.
 *
 * @param graph граф партии
 * @param startId стартовый узел
 * @param targetId целевой узел
 * @returns кратчайший путь либо `null`, если его нельзя построить
 *
 * @complexity O(E log V)
 */
function findOptimalPath(graph: Graph, startId: NodeId, targetId: NodeId): readonly NodeId[] | null {
  try {
    return dijkstra(graph, startId, targetId).path;
  } catch {
    return null;
  }
}