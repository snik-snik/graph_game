import { gameReducer } from './game-reducer';
import { createInitialState, type GameAction, type GameState, type NewGameParams } from './game-state';

/** Статистика по всем партиям сессии. */
export interface MatchStats {
  /** Количество завершённых (проверенных) партий. */
  readonly games: number;
  /** Количество побед. */
  readonly wins: number;
}

/** Состояние текущей партии вместе со статистикой сессии. */
export interface GameSession {
  /** Текущая партия. */
  readonly game: GameState;
  /** Статистика по всем партиям сессии. */
  readonly stats: MatchStats;
}

/** Нулевая статистика сессии. */
export const EMPTY_STATS: MatchStats = { games: 0, wins: 0 };

/**
 * Создаёт сессию с новой партией и нулевой статистикой.
 *
 * @param params параметры новой партии
 * @returns состояние сессии
 *
 * @complexity O(V)
 */
export function createSession(params: NewGameParams): GameSession {
  return { game: createInitialState(params), stats: EMPTY_STATS };
}

/**
 * Редьюсер сессии: делегирует переходы партии в {@link gameReducer} и обновляет
 * статистику в момент завершения партии.
 *
 * Если состояние партии не изменилось, возвращается тот же объект сессии —
 * это позволяет React пропускать лишние перерисовки. Статистика растёт один
 * раз на партию: в момент перехода из `'playing'` в `'won'`/`'lost'`.
 *
 * @param session текущее состояние сессии
 * @param action действие игрока
 * @returns новое состояние сессии
 *
 * @complexity O(E log V) в худшем случае (на действии `SUBMIT`)
 */
export function sessionReducer(session: GameSession, action: GameAction): GameSession {
  const game = gameReducer(session.game, action);

  if (game === session.game) {
    return session;
  }

  const wasPlaying = session.game.status === 'playing';
  const isFinished = game.status !== 'playing';

  if (!wasPlaying || !isFinished) {
    return { game, stats: session.stats };
  }

  return {
    game,
    stats: {
      games: session.stats.games + 1,
      wins: session.stats.wins + (game.status === 'won' ? 1 : 0),
    },
  };
}