import type { ReactElement } from 'react';
import type { GameStatus } from '../lib/game/game-state';
import type { NodeId } from '../lib/graph/types';

/** Пропсы панели статуса партии. */
export interface StatusPanelProps {
  /** Статус партии. */
  readonly status: GameStatus;
  /** Текущий путь игрока. */
  readonly playerPath: readonly NodeId[];
  /** Вес текущего пути игрока; `null`, если путь невалиден. */
  readonly playerWeight: number | null;
  /** Вес кратчайшего пути; известен после проверки. */
  readonly bestWeight: number | null;
  /** Эталонный путь для показа; `null`, пока он скрыт. */
  readonly optimalPath: readonly NodeId[] | null;
}

/** Модификатор класса панели по статусу партии. */
const STATUS_MODIFIERS: Readonly<Record<GameStatus, string>> = {
  playing: 'status-panel--playing',
  won: 'status-panel--won',
  lost: 'status-panel--lost',
};

/**
 * Панель статуса: текущий путь, его вес и результат партии.
 *
 * Эталонный путь показывается только тогда, когда он передан: после подсказки
 * или после завершения партии.
 */
export function StatusPanel({
  status,
  playerPath,
  playerWeight,
  bestWeight,
  optimalPath,
}: StatusPanelProps): ReactElement {
  return (
    <section
      className={`status-panel ${STATUS_MODIFIERS[status]}`}
      aria-live="polite"
      aria-label="Статус партии"
    >
      <h2 className="status-panel__title">Партия</h2>
      <p className="status-panel__path">Путь: {playerPath.join(' → ')}</p>
      <p className="status-panel__weight">
        Вес пути: {playerWeight === null ? '—' : playerWeight}
        {bestWeight === null ? null : ` (оптимум: ${bestWeight})`}
      </p>
      <p className="status-panel__message">{describeStatus(status)}</p>
      {optimalPath === null ? null : (
        <p className="status-panel__hint">Эталонный путь: {optimalPath.join(' → ')}</p>
      )}
    </section>
  );
}

/**
 * Формирует сообщение о ходе партии по её статусу.
 *
 * @param status статус партии
 * @returns текст сообщения
 *
 * @complexity O(1)
 */
function describeStatus(status: GameStatus): string {
  switch (status) {
    case 'won':
      return 'Победа! Ваш путь не тяжелее кратчайшего.';
    case 'lost':
      return 'Не оптимально. Сравните свой путь с эталонным и попробуйте снова.';
    default:
      return 'Соберите путь от зелёного узла к красному и нажмите «Проверить».';
  }
}