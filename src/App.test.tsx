import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { createMatchParams } from './lib/game/match';
import { dijkstra } from './lib/graph/dijkstra';

/** Seed партии, используемый в интеграционных тестах. */
const TEST_SEED = 21;

describe('App', () => {
  it('renders the graph, the panels and the controls', () => {
    render(<App initialSeed={TEST_SEED} />);

    expect(screen.getByRole('heading', { name: 'Graph Game' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Граф' })).toBeInTheDocument();
    expect(screen.getByLabelText('Статус партии')).toBeInTheDocument();
    expect(screen.getByLabelText('Счёт')).toBeInTheDocument();
    expect(screen.getByText(`Seed партии: ${TEST_SEED}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Проверить' })).toBeDisabled();
  });

  it('plays the optimal path from the hint and reports a win', () => {
    render(<App initialSeed={TEST_SEED} />);

    fireEvent.click(screen.getByRole('button', { name: 'Подсказка' }));

    const { graph, startId, targetId } = createMatchParams(TEST_SEED);
    const optimal = dijkstra(graph, startId, targetId);

    for (const nodeId of optimal.path.slice(1)) {
      fireEvent.click(screen.getByRole('button', { name: `Узел ${nodeId}` }));
    }

    fireEvent.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(within(screen.getByLabelText('Статус партии')).getByText(/Победа/)).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('starts a new game from the control panel', () => {
    render(<App initialSeed={TEST_SEED} />);

    fireEvent.click(screen.getByRole('button', { name: 'Новая игра' }));

    expect(screen.getByRole('button', { name: 'Проверить' })).toBeDisabled();
    expect(
      within(screen.getByLabelText('Статус партии')).getByText(/Соберите путь/),
    ).toBeInTheDocument();
  });
});