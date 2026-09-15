import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH } from '../../test/fixtures';
import { bfs, isConnected } from '../graph/bfs';
import { dijkstra } from '../graph/dijkstra';
import { createSeededRandom } from '../graph/random';
import { createMatchParams, pickEndpoints } from './match';

describe('createMatchParams', () => {
  it('creates a connected graph with two different endpoints for many seeds', () => {
    const brokenSeeds: number[] = [];

    for (let seed = 1; seed <= 50; seed += 1) {
      const params = createMatchParams(seed);
      const best = dijkstra(params.graph, params.startId, params.targetId);

      if (
        !isConnected(params.graph) ||
        params.startId === params.targetId ||
        best.totalWeight <= 0 ||
        params.seed !== seed
      ) {
        brokenSeeds.push(seed);
      }
    }

    expect(brokenSeeds).toEqual([]);
  });

  it('is deterministic for the same seed', () => {
    expect(createMatchParams(5)).toEqual(createMatchParams(5));
  });

  it('passes the generation options through', () => {
    const params = createMatchParams(9, { nodeCount: 5 });

    expect(params.graph.nodes).toHaveLength(5);
  });
});

describe('pickEndpoints', () => {
  it('picks the most distant node as the target', () => {
    const endpoints = pickEndpoints(SMALL_GRAPH, createSeededRandom(3));
    const order = bfs(SMALL_GRAPH, endpoints.startId);

    expect(endpoints.targetId).toBe(order[order.length - 1]);
    expect(endpoints.targetId).not.toBe(endpoints.startId);
  });

  it('throws when the graph has fewer than two nodes', () => {
    const singleNodeGraph = { nodes: [{ id: 'only', x: 0, y: 0 }], edges: [] };

    expect(() => pickEndpoints(singleNodeGraph, createSeededRandom(1))).toThrow(/at least two nodes/);
  });
});