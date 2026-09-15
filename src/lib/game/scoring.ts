import type { DijkstraResult } from '../graph/types';

/** Итог проверки пути игрока. */
export interface ScoreResult {
  /** Победил ли игрок (путь совпал с кратчайшим). */
  readonly isWin: boolean;
  /** Вес пути игрока. */
  readonly playerWeight: number;
  /** Вес кратчайшего пути. */
  readonly bestWeight: number;
  /** Насколько путь игрока тяжелее оптимального. */
  readonly overhead: number;
  /** Итоговый счёт партии. */
  readonly score: number;
}

/** Награда за оптимальный путь. */
export const WIN_BASE_SCORE = 1000;

/** Базовая награда за завершённую, но не оптимальную партию. */
export const LOSS_BASE_SCORE = 200;

/** Штраф за каждую единицу превышения веса пути над оптимумом. */
export const OVERHEAD_PENALTY = 50;

/** Штраф за каждую использованную подсказку. */
export const HINT_PENALTY = 100;

/**
 * Сравнивает путь игрока с кратчайшим путём по весу и вычисляет счёт.
 *
 * Формула счёта: `max(0, база − overhead × OVERHEAD_PENALTY − hintsUsed × HINT_PENALTY)`,
 * где база равна {@link WIN_BASE_SCORE} за оптимальный путь и {@link LOSS_BASE_SCORE}
 * за более тяжёлый. Победой считается совпадение весов: маршрут может быть любым,
 * важно лишь, что он не тяжелее кратчайшего.
 *
 * @param playerResult результат пути, собранного игроком
 * @param bestResult результат алгоритма Дейкстры
 * @param hintsUsed количество использованных подсказок
 * @returns итог проверки пути игрока
 *
 * @complexity O(1)
 */
export function scorePath(
  playerResult: DijkstraResult,
  bestResult: DijkstraResult,
  hintsUsed: number,
): ScoreResult {
  const playerWeight = playerResult.totalWeight;
  const bestWeight = bestResult.totalWeight;
  const isWin = playerWeight === bestWeight;
  const overhead = Math.max(0, playerWeight - bestWeight);
  const baseScore = isWin ? WIN_BASE_SCORE : LOSS_BASE_SCORE;
  const penalty = overhead * OVERHEAD_PENALTY + Math.max(0, hintsUsed) * HINT_PENALTY;

  return {
    isWin,
    playerWeight,
    bestWeight,
    overhead,
    score: Math.max(0, baseScore - penalty),
  };
}