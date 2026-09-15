import { useCallback, type ReactElement } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { ScoreBoard } from './components/ScoreBoard';
import { StatusPanel } from './components/StatusPanel';
import { useGraphGame } from './hooks/use-graph-game';
import { MAX_HINTS } from './lib/game/game-state';

/** Пропсы корневого компонента. */
export interface AppProps {
  /** Seed первой партии; по умолчанию выбирается случайно. */
  readonly initialSeed?: number;
}

/**
 * Корневой компонент приложения: собирает игровой экран из панелей и полотна.
 *
 * Всё состояние живёт в хуке `useGraphGame`, компоненты остаются презентационными
 * и получают готовые данные и обработчики.
 */
export function App({ initialSeed }: AppProps = {}): ReactElement {
  const {
    state,
    stats,
    optimalPath,
    startNewGame,
    selectNode,
    undoStep,
    resetPath,
    requestHint,
    submit,
  } = useGraphGame(initialSeed === undefined ? {} : { initialSeed });

  const handleNewGame = useCallback((): void => {
    startNewGame();
  }, [startNewGame]);

  const isPlaying = state.status === 'playing';
  const tailId = state.playerPath[state.playerPath.length - 1];
  const hasMoves = state.playerPath.length > 1;

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Graph Game</h1>
        <p className="app__hint">
          Соберите путь от зелёного узла к красному и нажмите «Проверить»: победа — если вес вашего
          пути не больше веса кратчайшего.
        </p>
        <p className="app__seed">Seed партии: {state.seed}</p>
      </header>
      <div className="app__board">
        <GraphCanvas
          graph={state.graph}
          startId={state.startId}
          targetId={state.targetId}
          playerPath={state.playerPath}
          hintPath={optimalPath}
          onNodeSelect={selectNode}
        />
        <aside className="app__sidebar">
          <StatusPanel
            status={state.status}
            playerPath={state.playerPath}
            playerWeight={state.playerWeight}
            bestWeight={state.bestWeight}
            optimalPath={optimalPath}
          />
          <ScoreBoard score={state.score ?? 0} wins={stats.wins} games={stats.games} />
          <ControlPanel
            onNewGame={handleNewGame}
            onUndoStep={undoStep}
            onResetPath={resetPath}
            onRequestHint={requestHint}
            onSubmit={submit}
            canUndo={isPlaying && hasMoves}
            canReset={isPlaying && hasMoves}
            canRequestHint={isPlaying && state.hintsUsed < MAX_HINTS}
            canSubmit={isPlaying && hasMoves && tailId === state.targetId}
          />
        </aside>
      </div>
    </main>
  );
}