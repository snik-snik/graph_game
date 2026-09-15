import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH, SMALL_GRAPH_SHORTEST_WEIGHT } from '../../test/fixtures';
import { gameReducer } from './game-reducer';
import { createInitialState, MAX_HINTS, type GameAction, type GameState } from './game-state';
import { WIN_BASE_SCORE } from './scoring';

/** Состояние партии на эталонном графе: старт `n0`, цель `n2`, оптимум равен 2. */
function createTestState(): GameState {
  return createInitialState({ graph: SMALL_GRAPH, seed: 1, startId: 'n0', targetId: 'n2' });
}

/**
 * Прогоняет последовательность действий через редьюсер.
 *
 * @param state начальное состояние
 * @param actions действия по порядку
 * @returns состояние после всех действий
 */
function reduce(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce((current, action) => gameReducer(current, action), state);
}

describe('gameReducer', () => {
  it('starts the player path from the start node', () => {
    const state = createTestState();

    expect(state.playerPath).toEqual(['n0']);
    expect(state.playerWeight).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.hintsUsed).toBe(0);
    expect(state.score).toBeNull();
    expect(state.bestWeight).toBeNull();
  });

  it('appends an adjacent node on SELECT_NODE', () => {
    const state = reduce(createTestState(), { type: 'SELECT_NODE', nodeId: 'n1' });

    expect(state.playerPath).toEqual(['n0', 'n1']);
    expect(state.playerWeight).toBe(1);
  });

  it('ignores SELECT_NODE for a node that is not adjacent to the path tail', () => {
    const initial = createTestState();
    const state = gameReducer(initial, { type: 'SELECT_NODE', nodeId: 'n3' });

    expect(state).toBe(initial);
    expect(state.playerPath).toEqual(['n0']);
  });

  it('rolls back the path when the previous node is selected again', () => {
    const state = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SELECT_NODE', nodeId: 'n1' },
    );

    expect(state.playerPath).toEqual(['n0', 'n1']);
    expect(state.playerWeight).toBe(1);
  });

  it('removes the last step on UNDO_STEP', () => {
    const withTwoSteps = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n3' },
    );
    const afterUndo = gameReducer(withTwoSteps, { type: 'UNDO_STEP' });

    expect(afterUndo.playerPath).toEqual(['n0', 'n1']);
    expect(afterUndo.playerWeight).toBe(1);
    expect(gameReducer(createTestState(), { type: 'UNDO_STEP' }).playerPath).toEqual(['n0']);
  });

  it('resets the path to the start node on RESET_PATH but keeps the graph', () => {
    const state = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n3' },
      { type: 'RESET_PATH' },
    );

    expect(state.playerPath).toEqual(['n0']);
    expect(state.playerWeight).toBe(0);
    expect(state.graph).toBe(SMALL_GRAPH);
  });

  it('increments hintsUsed on REQUEST_HINT', () => {
    const once = gameReducer(createTestState(), { type: 'REQUEST_HINT' });
    const twice = gameReducer(once, { type: 'REQUEST_HINT' });
    const limited = reduce(createTestState(), ...Array.from({ length: MAX_HINTS + 2 }, () => ({
      type: 'REQUEST_HINT' as const,
    })));

    expect(once.hintsUsed).toBe(1);
    expect(twice.hintsUsed).toBe(2);
    expect(limited.hintsUsed).toBe(MAX_HINTS);
  });

  it('marks the game as won on SUBMIT with the optimal path', () => {
    const state = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );

    expect(state.status).toBe('won');
    expect(state.playerWeight).toBe(SMALL_GRAPH_SHORTEST_WEIGHT);
    expect(state.bestWeight).toBe(SMALL_GRAPH_SHORTEST_WEIGHT);
    expect(state.score).toBe(WIN_BASE_SCORE);
  });

  it('marks the game as lost on SUBMIT with a suboptimal path', () => {
    const state = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );

    expect(state.status).toBe('lost');
    expect(state.playerWeight).toBe(5);
    expect(state.bestWeight).toBe(SMALL_GRAPH_SHORTEST_WEIGHT);
    expect(state.score).toBeLessThan(WIN_BASE_SCORE);
  });

  it('builds a brand new state on NEW_GAME', () => {
    const finished = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );
    const newGraph = { nodes: SMALL_GRAPH.nodes, edges: SMALL_GRAPH.edges };
    const state = gameReducer(finished, {
      type: 'NEW_GAME',
      graph: newGraph,
      seed: 777,
      startId: 'n3',
      targetId: 'n1',
    });

    expect(state.seed).toBe(777);
    expect(state.graph).toBe(newGraph);
    expect(state.playerPath).toEqual(['n3']);
    expect(state.status).toBe('playing');
    expect(state.score).toBeNull();
    expect(state.hintsUsed).toBe(0);
  });

  it('ignores the player moves after the game is over', () => {
    const finished = reduce(
      createTestState(),
      { type: 'SELECT_NODE', nodeId: 'n1' },
      { type: 'SELECT_NODE', nodeId: 'n2' },
      { type: 'SUBMIT' },
    );

    expect(gameReducer(finished, { type: 'SELECT_NODE', nodeId: 'n1' })).toBe(finished);
    expect(gameReducer(finished, { type: 'UNDO_STEP' })).toBe(finished);
    expect(gameReducer(finished, { type: 'RESET_PATH' })).toBe(finished);
    expect(gameReducer(finished, { type: 'REQUEST_HINT' })).toBe(finished);
  });

  it('marks the game as lost when SUBMIT happens with an incomplete path', () => {
    const state = reduce(createTestState(), { type: 'SELECT_NODE', nodeId: 'n1' }, { type: 'SUBMIT' });

    expect(state.status).toBe('lost');
    expect(state.bestWeight).toBe(SMALL_GRAPH_SHORTEST_WEIGHT);
    expect(state.score).toBe(0);
    expect(state.playerPath).toEqual(['n0', 'n1']);
  });
});