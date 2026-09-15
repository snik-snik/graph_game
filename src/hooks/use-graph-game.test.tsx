import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { requireDefined } from '../test/fixtures';
import { buildAdjacencyList } from '../lib/graph/adjacency';
import { isConnected } from '../lib/graph/bfs';
import { dijkstra } from '../lib/graph/dijkstra';
import { useGraphGame } from './use-graph-game';

describe('useGraphGame', () => {
  it('starts a new game with a connected graph', () => {
    const { result } = renderHook(() => useGraphGame({ initialSeed: 5 }));

    expect(isConnected(result.current.state.graph)).toBe(true);
    expect(result.current.state.status).toBe('playing');
    expect(result.current.state.playerPath).toEqual([result.current.state.startId]);

    act(() => {
      result.current.startNewGame(11);
    });

    expect(result.current.state.seed).toBe(11);
    expect(isConnected(result.current.state.graph)).toBe(true);
  });

  it('appends a clicked adjacent node to the player path', () => {
    const { result } = renderHook(() => useGraphGame({ initialSeed: 5 }));
    const { graph, startId } = result.current.state;
    const neighbour = requireDefined(
      (buildAdjacencyList(graph).get(startId) ?? [])[0],
      'первый сосед стартового узла',
    );

    act(() => {
      result.current.selectNode(neighbour.to);
    });

    expect(result.current.state.playerPath).toEqual([startId, neighbour.to]);
    expect(result.current.state.playerWeight).toBe(neighbour.weight);
  });

  it('ignores clicks on nodes that are not adjacent to the path tail', () => {
    const { result } = renderHook(() => useGraphGame({ initialSeed: 5 }));
    const { graph, startId } = result.current.state;
    const adjacentIds = new Set(
      (buildAdjacencyList(graph).get(startId) ?? []).map((entry) => entry.to),
    );
    const distantNode = requireDefined(
      graph.nodes.find((node) => node.id !== startId && !adjacentIds.has(node.id)),
      'узел, не смежный со стартовым',
    );

    act(() => {
      result.current.selectNode(distantNode.id);
    });

    expect(result.current.state.playerPath).toEqual([startId]);
  });

  it('submits the path and exposes the game result', () => {
    const { result } = renderHook(() => useGraphGame({ initialSeed: 5 }));
    const { graph, startId, targetId } = result.current.state;
    const best = dijkstra(graph, startId, targetId);

    for (const nodeId of best.path.slice(1)) {
      act(() => {
        result.current.selectNode(nodeId);
      });
    }

    expect(result.current.state.playerPath).toEqual(best.path);

    act(() => {
      result.current.submit();
    });

    expect(result.current.state.status).toBe('won');
    expect(result.current.state.bestWeight).toBe(best.totalWeight);
    expect(result.current.state.score).toBeGreaterThan(0);
    expect(result.current.stats).toEqual({ games: 1, wins: 1 });
  });

  it('reveals the optimal path only after a hint', () => {
    const { result } = renderHook(() => useGraphGame({ initialSeed: 5 }));
    const { graph, startId, targetId } = result.current.state;

    expect(result.current.optimalPath).toBeNull();

    act(() => {
      result.current.requestHint();
    });

    expect(result.current.state.hintsUsed).toBe(1);
    expect(result.current.optimalPath).toEqual(dijkstra(graph, startId, targetId).path);
  });

  it('undoes and resets the path through the hook API', () => {
    const { result } = renderHook(() => useGraphGame({ initialSeed: 5 }));
    const { graph, startId } = result.current.state;
    const neighbour = requireDefined(
      (buildAdjacencyList(graph).get(startId) ?? [])[0],
      'первый сосед стартового узла',
    );

    act(() => {
      result.current.selectNode(neighbour.to);
    });
    act(() => {
      result.current.undoStep();
    });

    expect(result.current.state.playerPath).toEqual([startId]);

    act(() => {
      result.current.selectNode(neighbour.to);
    });
    act(() => {
      result.current.resetPath();
    });

    expect(result.current.state.playerPath).toEqual([startId]);
    expect(result.current.state.playerWeight).toBe(0);
  });
});