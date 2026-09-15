import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH } from '../../test/fixtures';
import { bfs, isConnected } from './bfs';
import type { Graph } from './types';

describe('bfs', () => {
  it('visits every node of a connected graph', () => {
    const order = bfs(SMALL_GRAPH, 'n0');

    expect([...order].sort()).toEqual(['n0', 'n1', 'n2', 'n3']);
  });

  it('returns nodes in level order starting from the given node', () => {
    const order = bfs(SMALL_GRAPH, 'n0');

    // n0 — уровень 0, n1 и n2 — уровень 1, n3 — уровень 2.
    expect(order[0]).toBe('n0');
    expect([...order.slice(1, 3)].sort()).toEqual(['n1', 'n2']);
    expect(order[3]).toBe('n3');
  });

  it('visits each node exactly once', () => {
    const order = bfs(SMALL_GRAPH, 'n0');

    expect(new Set(order).size).toBe(order.length);
  });

  it('throws when the start node is missing in the graph', () => {
    expect(() => bfs(SMALL_GRAPH, 'n42')).toThrow(/n42/);
  });
});

describe('isConnected', () => {
  it('returns true for a connected graph', () => {
    expect(isConnected(SMALL_GRAPH)).toBe(true);
  });

  it('returns false when the graph splits into components', () => {
    const splitGraph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 100, y: 0 },
        { id: 'c', x: 200, y: 0 },
      ],
      edges: [{ from: 'a', to: 'b', weight: 1 }],
    };

    expect(isConnected(splitGraph)).toBe(false);
  });

  it('returns true for a graph with a single node', () => {
    const singleNodeGraph: Graph = { nodes: [{ id: 'only', x: 0, y: 0 }], edges: [] };

    expect(isConnected(singleNodeGraph)).toBe(true);
  });

  it('returns false for an empty graph', () => {
    expect(isConnected({ nodes: [], edges: [] })).toBe(false);
  });
});