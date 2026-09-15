import { describe, expect, it } from 'vitest';
import type { DijkstraResult } from '../graph/types';
import {
  HINT_PENALTY,
  LOSS_BASE_SCORE,
  OVERHEAD_PENALTY,
  WIN_BASE_SCORE,
  scorePath,
} from './scoring';

/** Кратчайший путь `n0 -> n2` в {@link SMALL_GRAPH}. */
const BEST_RESULT: DijkstraResult = { path: ['n0', 'n1', 'n2'], totalWeight: 2 };

/** Путь игрока, совпавший с оптимальным по весу. */
const OPTIMAL_PLAYER_RESULT: DijkstraResult = { path: ['n0', 'n1', 'n2'], totalWeight: 2 };

/** Путь игрока через прямое, но более тяжёлое ребро. */
const SUBOPTIMAL_PLAYER_RESULT: DijkstraResult = { path: ['n0', 'n2'], totalWeight: 5 };

describe('scorePath', () => {
  it('reports a win when the player weight equals the shortest path weight', () => {
    const result = scorePath(OPTIMAL_PLAYER_RESULT, BEST_RESULT, 0);

    expect(result.isWin).toBe(true);
    expect(result.overhead).toBe(0);
    expect(result.score).toBe(WIN_BASE_SCORE);
  });

  it('reports a loss when the player weight is heavier than the shortest path', () => {
    const result = scorePath(SUBOPTIMAL_PLAYER_RESULT, BEST_RESULT, 0);

    expect(result.isWin).toBe(false);
    expect(result.playerWeight).toBe(5);
    expect(result.bestWeight).toBe(2);
    expect(result.score).toBe(LOSS_BASE_SCORE - 3 * OVERHEAD_PENALTY);
  });

  it('computes a positive overhead for a suboptimal path', () => {
    const result = scorePath(SUBOPTIMAL_PLAYER_RESULT, BEST_RESULT, 0);

    expect(result.overhead).toBe(3);
    expect(result.overhead).toBeGreaterThan(0);
  });

  it('reduces the score for every used hint', () => {
    const withoutHints = scorePath(OPTIMAL_PLAYER_RESULT, BEST_RESULT, 0).score;
    const withOneHint = scorePath(OPTIMAL_PLAYER_RESULT, BEST_RESULT, 1).score;
    const withTwoHints = scorePath(OPTIMAL_PLAYER_RESULT, BEST_RESULT, 2).score;

    expect(withoutHints - withOneHint).toBe(HINT_PENALTY);
    expect(withOneHint - withTwoHints).toBe(HINT_PENALTY);
  });

  it('never returns a negative score', () => {
    expect(scorePath(SUBOPTIMAL_PLAYER_RESULT, BEST_RESULT, 50).score).toBe(0);
  });
});