import { dijkstra } from '../graph/dijkstra';
import { pathWeight } from '../graph/path-utils';
import type { NodeId } from '../graph/types';
import { createInitialState, MAX_HINTS, type GameAction, type GameState } from './game-state';
import { scorePath } from './scoring';

/**
 * Чистый редьюсер игровых действий.
 *
 * Обрабатывает все варианты {@link GameAction}:
 * - `SELECT_NODE` — добавляет соседний узел в путь игрока либо откатывает шаг,
 *   если выбран предпоследний узел пути;
 * - `UNDO_STEP` — убирает последний узел пути;
 * - `RESET_PATH` — возвращает путь к стартовому узлу, сохраняя граф;
 * - `REQUEST_HINT` — увеличивает счётчик подсказок (не больше {@link MAX_HINTS});
 * - `SUBMIT` — считает результат через `scorePath` и выставляет статус;
 * - `NEW_GAME` — создаёт состояние через `createInitialState`.
 *
 * Действия, не имеющие смысла (клик по несоседнему узлу, ход после завершения
 * партии), возвращают исходное состояние без изменений.
 *
 * @param state текущее состояние партии
 * @param action действие игрока
 * @returns новое состояние партии
 *
 * @complexity O(1) для отката пути, O(V + E + P) для шага по пути,
 * O(E log V) для `SUBMIT`
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState({
        graph: action.graph,
        seed: action.seed,
        startId: action.startId,
        targetId: action.targetId,
      });

    case 'SELECT_NODE':
      return selectNode(state, action.nodeId);

    case 'UNDO_STEP':
      return state.status === 'playing' && state.playerPath.length > 1
        ? withPlayerPath(state, state.playerPath.slice(0, -1))
        : state;

    case 'RESET_PATH':
      return state.status === 'playing' ? withPlayerPath(state, [state.startId]) : state;

    case 'REQUEST_HINT':
      return state.status === 'playing' && state.hintsUsed < MAX_HINTS
        ? { ...state, hintsUsed: state.hintsUsed + 1 }
        : state;

    case 'SUBMIT':
      return submit(state);

    default:
      return assertNever(action);
  }
}

/**
 * Обрабатывает клик по узлу: продлевает путь, откатывает шаг или игнорирует клик.
 *
 * Путь продлевается только на узел, смежный с последним узлом пути: вес
 * расширенного пути считает {@link pathWeight}, и если путь невалиден — клик
 * игнорируется. Повторный клик по предпоследнему узлу откатывает последний шаг.
 *
 * @param state текущее состояние партии
 * @param nodeId id выбранного узла
 * @returns новое состояние партии
 *
 * @complexity O(V + E + P)
 */
function selectNode(state: GameState, nodeId: NodeId): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const path = state.playerPath;
  const tailIndex = path.length - 1;
  const tail = path[tailIndex];

  if (tail === undefined || nodeId === tail) {
    return state;
  }

  if (nodeId === path[tailIndex - 1]) {
    return withPlayerPath(state, path.slice(0, tailIndex));
  }

  const extendedPath = [...path, nodeId];
  const weight = pathWeight(state.graph, extendedPath);

  if (weight === null) {
    return state;
  }

  return { ...state, playerPath: extendedPath, playerWeight: weight };
}

/**
 * Обновляет путь игрока и его вес, сохраняя остальные поля состояния.
 *
 * @param state текущее состояние партии
 * @param playerPath новый путь игрока
 * @returns новое состояние партии
 *
 * @complexity O(V + E + P)
 */
function withPlayerPath(state: GameState, playerPath: NodeId[]): GameState {
  return { ...state, playerPath, playerWeight: pathWeight(state.graph, playerPath) };
}

/**
 * Подводит итог партии: сравнивает вес пути игрока с кратчайшим путём.
 *
 * @param state текущее состояние партии в статусе `'playing'`
 * @returns состояние с выставленными `status`, `playerWeight`, `bestWeight` и `score`
 *
 * @complexity O(E log V)
 */
function submit(state: GameState): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const best = dijkstra(state.graph, state.startId, state.targetId);
  const playerPath = state.playerPath;
  const playerWeight = pathWeight(state.graph, playerPath);
  const reachedTarget = playerPath[playerPath.length - 1] === state.targetId;

  if (playerWeight === null || !reachedTarget) {
    return {
      ...state,
      status: 'lost',
      playerWeight: playerWeight ?? state.playerWeight,
      bestWeight: best.totalWeight,
      score: 0,
    };
  }

  const result = scorePath({ path: playerPath, totalWeight: playerWeight }, best, state.hintsUsed);

  return {
    ...state,
    status: result.isWin ? 'won' : 'lost',
    playerWeight: result.playerWeight,
    bestWeight: result.bestWeight,
    score: result.score,
  };
}

/**
 * Гарантирует исчерпывающую обработку всех вариантов {@link GameAction}.
 *
 * @param action действие, которое не должно сюда попасть
 * @throws Всегда: сигнализирует о новом варианте действия без обработки.
 *
 * @complexity O(1)
 */
function assertNever(action: never): never {
  throw new Error(`gameReducer: unhandled action ${JSON.stringify(action)}`);
}