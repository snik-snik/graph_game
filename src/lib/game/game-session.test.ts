import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH } from '../../test/fixtures';
import type { GameAction } from './game-state';
import { createSession, EMPTY_STATS, sessionReducer, type GameSession } from './game-session';

/** Сессия на эталонном графе: старт `n0`, цель `n2`. */
function createTestSession(): GameSession {
  return createSession({ graph: SMALL_GRAPH, seed: 1, startId: 'n0', targetId: 'n2' });
}

/**
 * Прогоняет последовательность действий через редьюсер сессии.
 *
 * @param session начальная сессия
 * @param actions действия по порядку
 * @returns сессия после всех действий
 */
function reduce(session: GameSession, ...actions: GameAction[]): GameSession {
  return actions.reduce((current, action) => sessionReducer(current, action), session);
}

describe('createSession', () => {
  it('starts with a fresh game and zero stats', () => {
    const session = createTestSession();

    expect(session.stats).toEqual(EMPTY_STATS);
    expect(session.game.status).toBe('playing');
  });
});

describe('sessionReducer', () => {
  it('counts a played game and a win on a winning submit', () => {
    const session = reduce(
      createTestSession(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );

    expect(session.game.status).toBe('won');
    expect(session.stats).toEqual({ games: 1, wins: 1 });
  });

  it('counts a played game without a win on a losing submit', () => {
    const session = reduce(
      createTestSession(),
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );

    expect(session.game.status).toBe('lost');
    expect(session.stats).toEqual({ games: 1, wins: 0 });
  });

  it('keeps stats unchanged while the path is edited', () => {
    const session = reduce(
      createTestSession(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'REQUEST_HINT' },
      { type: 'UNDO_STEP' },
    );

    expect(session.game.playerPath).toEqual(['n0']);
    expect(session.stats).toEqual(EMPTY_STATS);
  });

  it('returns the same session object when the action changes nothing', () => {
    const session = createTestSession();

    expect(sessionReducer(session, { type: 'UNDO_STEP' })).toBe(session);
  });

  it('keeps the accumulated stats when a new game starts', () => {
    const finished = reduce(
      createTestSession(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );
    const restarted = sessionReducer(finished, {
      type: 'NEW_GAME',
      graph: SMALL_GRAPH,
      seed: 2,
      startId: 'n3',
      targetId: 'n1',
    });

    expect(restarted.game.seed).toBe(2);
    expect(restarted.game.status).toBe('playing');
    expect(restarted.stats).toEqual({ games: 1, wins: 1 });
  });
});