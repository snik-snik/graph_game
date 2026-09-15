import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH, SMALL_GRAPH_SHORTEST_PATH, SMALL_GRAPH_SHORTEST_WEIGHT } from '../../test/fixtures';
import { dijkstra } from './dijkstra';
import type { Graph } from './types';

describe('dijkstra', () => {
  // Обязательный тест из .clinerules.
  it('returns correct path on known small graph', () => {
    const result = dijkstra(SMALL_GRAPH, 'n0', 'n2');

    expect(result.path).toEqual([...SMALL_GRAPH_SHORTEST_PATH]);
    expect(result.totalWeight).toBe(SMALL_GRAPH_SHORTEST_WEIGHT);
  });

  it('returns a single-node path when from equals to', () => {
    expect(dijkstra(SMALL_GRAPH, 'n1', 'n1')).toEqual({ path: ['n1'], totalWeight: 0 });
  });

  it('prefers the alternative route with the smallest total weight', () => {
    // Напрямую n1 -> n3 весит 2, через n2 — 3.
    const direct = dijkstra(SMALL_GRAPH, 'n1', 'n3');

    expect(direct.path).toEqual(['n1', 'n3']);
    expect(direct.totalWeight).toBe(2);
  });

  it('throws when from or to node is missing in the graph', () => {
    expect(() => dijkstra(SMALL_GRAPH, 'ghost', 'n2')).toThrow(/ghost/);
    expect(() => dijkstra(SMALL_GRAPH, 'n0', 'ghost')).toThrow(/ghost/);
  });

  it('throws when the target node is unreachable', () => {
    const splitGraph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 100, y: 0 },
      ],
      edges: [],
    };

    expect(() => dijkstra(splitGraph, 'a', 'b')).toThrow(/no path/);
  });
});