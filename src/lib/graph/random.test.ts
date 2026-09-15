import { describe, expect, it } from 'vitest';
import { createRandomSeed, createSeededRandom, randomFloat, randomInt } from './random';

describe('createSeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const first = createSeededRandom(1234);
    const second = createSeededRandom(1234);
    const firstSequence = [first(), first(), first(), first()];
    const secondSequence = [second(), second(), second(), second()];

    expect(firstSequence).toEqual(secondSequence);
  });

  it('produces different sequences for different seeds', () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  it('keeps every value inside [0, 1)', () => {
    const random = createSeededRandom(7);

    for (let index = 0; index < 500; index += 1) {
      const value = random();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('randomInt', () => {
  it('generates integers inside the inclusive range', () => {
    const random = createSeededRandom(99);

    for (let index = 0; index < 500; index += 1) {
      const value = randomInt(random, 3, 5);

      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it('returns the only possible value for a single-point range', () => {
    expect(randomInt(createSeededRandom(1), 4, 4)).toBe(4);
  });

  it('throws when the range is inverted', () => {
    expect(() => randomInt(createSeededRandom(1), 5, 1)).toThrow(/max/);
  });
});

describe('randomFloat', () => {
  it('generates values inside the requested range', () => {
    const random = createSeededRandom(5);

    for (let index = 0; index < 200; index += 1) {
      const value = randomFloat(random, -2, 2);

      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThan(2);
    }
  });
});

describe('createRandomSeed', () => {
  it('returns an integer seed that can drive the generator', () => {
    const seed = createRandomSeed();
    const random = createSeededRandom(seed);

    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(random()).toBeGreaterThanOrEqual(0);
  });
});