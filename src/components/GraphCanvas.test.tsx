import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SMALL_GRAPH, requireDefined } from '../test/fixtures';
import { GraphCanvas, type GraphCanvasProps } from './GraphCanvas';

/**
 * Рендерит полотно с пропсами эталонного графа и возможностью их переопределить.
 *
 * @param overrides переопределяемые пропсы
 * @returns результат рендера вместе с контейнером
 */
function renderCanvas(overrides: Partial<GraphCanvasProps> = {}): ReturnType<typeof render> {
  const props: GraphCanvasProps = {
    graph: SMALL_GRAPH,
    startId: 'n0',
    targetId: 'n2',
    playerPath: ['n0'],
    onNodeSelect: vi.fn(),
    ...overrides,
  };

  return render(<GraphCanvas {...props} />);
}

describe('GraphCanvas', () => {
  it('renders one node element per graph node', () => {
    const { container } = renderCanvas();

    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(SMALL_GRAPH.nodes.length);
    expect(screen.getAllByRole('button')).toHaveLength(SMALL_GRAPH.nodes.length);
  });

  it('renders the weight label for every edge', () => {
    const { container } = renderCanvas();

    expect(container.querySelectorAll('.graph-edge__weight')).toHaveLength(SMALL_GRAPH.edges.length);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onNodeSelect with the node id when a node is clicked', () => {
    const onNodeSelect = vi.fn();
    renderCanvas({ onNodeSelect });
    const node = screen.getByRole('button', { name: 'Узел n1' });

    fireEvent.click(node);

    expect(onNodeSelect).toHaveBeenCalledTimes(1);
    expect(onNodeSelect).toHaveBeenCalledWith('n1');
  });

  it('supports keyboard selection of a node', () => {
    const onNodeSelect = vi.fn();
    renderCanvas({ onNodeSelect });

    fireEvent.keyDown(screen.getByRole('button', { name: 'Узел n3' }), { key: 'Enter' });

    expect(onNodeSelect).toHaveBeenCalledWith('n3');
  });

  it('highlights the nodes that belong to the player path', () => {
    const { container } = renderCanvas({ playerPath: ['n0', 'n1', 'n2'] });
    const middleNode = requireDefined(
      container.querySelector('[data-node-id="n1"]'),
      'узел n1 на полотне',
    );

    expect(middleNode).toHaveAttribute('data-visual-state', 'selected');
    expect(container.querySelectorAll('.graph-edge--selected')).toHaveLength(2);
  });

  it('marks the start and the target nodes', () => {
    const { container } = renderCanvas();

    expect(requireDefined(container.querySelector('[data-node-id="n0"]'), 'узел n0')).toHaveAttribute(
      'data-visual-state',
      'start',
    );
    expect(requireDefined(container.querySelector('[data-node-id="n2"]'), 'узел n2')).toHaveAttribute(
      'data-visual-state',
      'target',
    );
  });

  it('highlights the hint path edges when the hint is revealed', () => {
    const { container } = renderCanvas({ hintPath: ['n0', 'n2'] });

    expect(container.querySelectorAll('.graph-edge--hint')).toHaveLength(1);
    expect(requireDefined(container.querySelector('[data-node-id="n1"]'), 'узел n1')).toHaveAttribute(
      'data-visual-state',
      'default',
    );
  });
});