import { describe, expect, it } from 'vitest';
import { SMALL_GRAPH } from '../../test/fixtures';
import { isSamePath, isValidPath, makeEdgeKey, pathEdgeKeys, pathWeight } from './path-utils';

describe('pathWeight', () => {
  it('sums the weights of the path edges', () => {
    expect(pathWeight(SMALL_GRAPH, ['n0', 'n1', 'n2'])).toBe(2);
    expect(pathWeight(SMALL_GRAPH, ['n0', 'n2'])).toBe(5);
  });

  it('returns zero for a single-node path', () => {
    expect(pathWeight(SMALL_GRAPH, ['n3'])).toBe(0);
  });

  it('returns null when an edge of the path is missing', () => {
    expect(pathWeight(SMALL_GRAPH, ['n0', 'n3'])).toBeNull();
    expect(pathWeight(SMALL_GRAPH, ['n0', 'ghost'])).toBeNull();
  });

  it('returns null for an empty path', () => {
    expect(pathWeight(SMALL_GRAPH, [])).toBeNull();
  });
});

describe('isValidPath', () => {
  it('returns true for a path of existing edges', () => {
    expect(isValidPath(SMALL_GRAPH, ['n0', 'n1', 'n3'])).toBe(true);
  });

  it('returns false for a broken path', () => {
    expect(isValidPath(SMALL_GRAPH, ['n3', 'n0'])).toBe(false);
  });
});

describe('isSamePath', () => {
  it('ignores the direction of the route', () => {
    expect(isSamePath(['n0', 'n1', 'n2'], ['n2', 'n1', 'n0'])).toBe(true);
  });

  it('returns false for different routes', () => {
    expect(isSamePath(['n0', 'n1', 'n2'], ['n0', 'n2', 'n1'])).toBe(false);
    expect(isSamePath(['n0', 'n1'], ['n0', 'n1', 'n2'])).toBe(false);
  });
});

describe('makeEdgeKey', () => {
  it('produces the same key regardless of the node order', () => {
    expect(makeEdgeKey('n0', 'n1')).toBe(makeEdgeKey('n1', 'n0'));
    expect(makeEdgeKey('n0', 'n1')).not.toBe(makeEdgeKey('n0', 'n2'));
  });
});

describe('pathEdgeKeys', () => {
  it('collects the keys of all path edges', () => {
    const keys = pathEdgeKeys(['n0', 'n1', 'n2']);

    expect(keys.size).toBe(2);
    expect(keys.has(makeEdgeKey('n0', 'n1'))).toBe(true);
    expect(keys.has(makeEdgeKey('n1', 'n2'))).toBe(true);
  });

  it('returns an empty set for a single-node path', () => {
    expect(pathEdgeKeys(['n0']).size).toBe(0);
  });
});