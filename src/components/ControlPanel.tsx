import type { ReactElement } from 'react';

/** Пропсы панели управления. */
export interface ControlPanelProps {
  /** Начать новую партию. */
  readonly onNewGame: () => void;
  /** Сбросить путь к стартовому узлу. */
  readonly onResetPath: () => void;
  /** Откатить последний шаг. */
  readonly onUndoStep: () => void;
  /** Запросить подсказку. */
  readonly onRequestHint: () => void;
  /** Проверить собранный путь. */
  readonly onSubmit: () => void;
  /** Доступен ли откат шага (в пути больше одного узла и партия идёт). */
  readonly canUndo: boolean;
  /** Доступен ли сброс пути (нужно что-то сбрасывать). */
  readonly canReset: boolean;
  /** Доступна ли подсказка (лимит не исчерпан и партия идёт). */
  readonly canRequestHint: boolean;
  /** Доступна ли проверка пути (путь дошёл до целевого узла). */
  readonly canSubmit: boolean;
}

/**
 * Панель управления партией.
 *
 * «Новая игра» доступна всегда — в том числе после завершения партии, — а
 * остальные действия включаются только тогда, когда имеют смысл.
 */
export function ControlPanel({
  onNewGame,
  onResetPath,
  onUndoStep,
  onRequestHint,
  onSubmit,
  canUndo,
  canReset,
  canRequestHint,
  canSubmit,
}: ControlPanelProps): ReactElement {
  return (
    <div className="control-panel">
      <button type="button" className="control-panel__button" onClick={onNewGame}>
        Новая игра
      </button>
      <button
        type="button"
        className="control-panel__button"
        onClick={onUndoStep}
        disabled={!canUndo}
      >
        Отменить шаг
      </button>
      <button
        type="button"
        className="control-panel__button"
        onClick={onResetPath}
        disabled={!canReset}
      >
        Сбросить
      </button>
      <button
        type="button"
        className="control-panel__button"
        onClick={onRequestHint}
        disabled={!canRequestHint}
      >
        Подсказка
      </button>
      <button
        type="button"
        className="control-panel__button"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        Проверить
      </button>
    </div>
  );
}