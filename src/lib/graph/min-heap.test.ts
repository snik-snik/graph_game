import { describe, expect, it } from 'vitest';
import { MinHeap } from './min-heap';
import { createSeededRandom, randomInt } from './random';

describe('MinHeap', () => {
  it('is empty right after creation', () => {
    const heap = new MinHeap<string>();

    expect(heap.size).toBe(0);
    expect(heap.peek()).toBeUndefined();
    expect(heap.pop()).toBeUndefined();
  });

  it('pops items in ascending priority order', () => {
    const heap = new MinHeap<string>();
    heap.push(5, 'five');
    heap.push(1, 'one');
    heap.push(3, 'three');

    expect(heap.peek()?.value).toBe('one');
    expect(heap.pop()?.value).toBe('one');
    expect(heap.pop()?.value).toBe('three');
    expect(heap.pop()?.value).toBe('five');
    expect(heap.size).toBe(0);
  });

  it('keeps the smallest key on top for many random pushes', () => {
    const heap = new MinHeap<number>();
    const random = createSeededRandom(2024);
    const sourceKeys = Array.from({ length: 200 }, () => randomInt(random, 0, 1000));

    for (const key of sourceKeys) {
      heap.push(key, key);
    }

    const poppedKeys: number[] = [];

    while (heap.size > 0) {
      const item = heap.pop();

      if (item !== undefined) {
        poppedKeys.push(item.key);
      }
    }

    expect(poppedKeys).toEqual([...sourceKeys].sort((left, right) => left - right));
  });

  it('keeps duplicate keys', () => {
    const heap = new MinHeap<string>();
    heap.push(2, 'first');
    heap.push(2, 'second');

    expect(heap.pop()?.key).toBe(2);
    expect(heap.pop()?.key).toBe(2);
    expect(heap.size).toBe(0);
  });
});