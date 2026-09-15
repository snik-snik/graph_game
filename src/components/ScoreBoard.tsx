import type { ReactElement } from 'react';

/** Пропсы таблицы счёта. */
export interface ScoreBoardProps {
  /** Счёт текущей партии. */
  readonly score: number;
  /** Количество побед. */
  readonly wins: number;
  /** Количество сыгранных партий. */
  readonly games: number;
}

/**
 * Таблица счёта: результат текущей партии и общая статистика.
 *
 * Пока партия не завершена, счёт равен `0` — проверка ещё не выполнялась.
 */
export function ScoreBoard({ score, wins, games }: ScoreBoardProps): ReactElement {
  return (
    <section className="score-board" aria-label="Счёт">
      <h2 className="score-board__title">Счёт</h2>
      <p className="score-board__row">
        <span className="score-board__label">Текущая партия</span>
        <strong className="score-board__value">{score}</strong>
      </p>
      <p className="score-board__row">
        <span className="score-board__label">Побед</span>
        <strong className="score-board__value">
          {wins} / {games}
        </strong>
      </p>
    </section>
  );
}