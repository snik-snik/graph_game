import { describe, expect, it } from 'vitest';
import { isConnected } from './bfs';
import { generateGraph } from './graph-generator';
import { makeEdgeKey } from './path-utils';

describe('graph-generator', () => {
  // Обязательный тест из .clinerules.
  it('always produces connected graph for 100 random seeds', () => {
    const disconnectedSeeds: number[] = [];

    for (let seed = 1; seed <= 100; seed += 1) {
      if (!isConnected(generateGraph(seed))) {
        disconnectedSeeds.push(seed);
      }
    }

    expect(disconnectedSeeds).toEqual([]);
  });

  it('is deterministic for the same seed', () => {
    const first = generateGraph(42);
    const second = generateGraph(42);

    expect(first).toEqual(second);
    expect(first.edges.length).toBeGreaterThanOrEqual(first.nodes.length - 1);
    expect(generateGraph(43).nodes).not.toEqual(first.nodes);
  });

  it('produces nodeCount nodes inside the requested layout box', () => {
    const width = 300;
    const height = 200;
    const graph = generateGraph(7, { nodeCount: 6, width, height });

    expect(graph.nodes).toHaveLength(6);

    for (const node of graph.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(height);
    }
  });

  it('produces only positive edge weights within the requested range', () => {
    const graph = generateGraph(3, { nodeCount: 10, minWeight: 2, maxWeight: 4 });

    expect(graph.edges.length).toBeGreaterThanOrEqual(graph.nodes.length - 1);

    for (const edge of graph.edges) {
      expect(edge.weight).toBeGreaterThanOrEqual(2);
      expect(edge.weight).toBeLessThanOrEqual(4);
    }
  });

  it('produces every edge at most once', () => {
    const graph = generateGraph(11, { nodeCount: 14 });
    const keys = graph.edges.map((edge) => makeEdgeKey(edge.from, edge.to));

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('rejects invalid options (nodeCount less than 2)', () => {
    expect(() => generateGraph(1, { nodeCount: 1 })).toThrow(/nodeCount/);
    expect(() => generateGraph(1, { nodeCount: 2, width: 0 })).toThrow(/width/);
    expect(() => generateGraph(1, { nodeCount: 2, height: -10 })).toThrow(/height/);
    expect(() => generateGraph(1, { nodeCount: 2, minWeight: 0 })).toThrow(/minWeight/);
    expect(() => generateGraph(1, { nodeCount: 2, minWeight: 5, maxWeight: 4 })).toThrow(/maxWeight/);
  });
});
