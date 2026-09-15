import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH } from '../../test/fixtures';
import { buildAdjacencyList } from './adjacency';
import type { Graph } from './types';

describe('buildAdjacencyList', () => {
  it('creates an empty list for isolated nodes', () => {
    const graph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 100, y: 0 },
      ],
      edges: [],
    };

    const adjacency = buildAdjacencyList(graph);

    expect(adjacency.size).toBe(2);
    expect(adjacency.get('a')).toEqual([]);
    expect(adjacency.get('b')).toEqual([]);
  });

  it('adds both directions for every edge', () => {
    const adjacency = buildAdjacencyList(SMALL_GRAPH);

    expect(adjacency.get('n0')).toEqual([
      { to: 'n1', weight: 1 },
      { to: 'n2', weight: 5 },
    ]);
    expect(adjacency.get('n3')).toEqual([
      { to: 'n1', weight: 2 },
      { to: 'n2', weight: 2 },
    ]);
  });

  it('keeps edge weights on both directions', () => {
    const adjacency = buildAdjacencyList(SMALL_GRAPH);

    for (const edge of SMALL_GRAPH.edges) {
      const forward = (adjacency.get(edge.from) ?? []).find((entry) => entry.to === edge.to);
      const backward = (adjacency.get(edge.to) ?? []).find((entry) => entry.to === edge.from);

      expect(forward?.weight).toBe(edge.weight);
      expect(backward?.weight).toBe(edge.weight);
    }
  });

  it('throws when an edge references a node that is missing in the graph', () => {
    const brokenGraph: Graph = {
      nodes: [{ id: 'a', x: 0, y: 0 }],
      edges: [{ from: 'a', to: 'ghost', weight: 1 }],
    };

    expect(() => buildAdjacencyList(brokenGraph)).toThrow(/ghost/);
  });
});