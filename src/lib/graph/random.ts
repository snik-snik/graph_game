/**
 * Детерминированный генератор псевдослучайных чисел.
 *
 * Модуль нужен, чтобы генерация графа была воспроизводимой: один и тот же seed
 * всегда даёт одну и ту же последовательность, а значит и один и тот же граф.
 */

/** Размер диапазона 32-битного беззнакового целого (2^32). */
const UINT32_RANGE = 4294967296;

/**
 * Создаёт детерминированный генератор псевдослучайных чисел (mulberry32).
 *
 * Алгоритм mulberry32 — быстрый 32-битный PRNG, состояние которого умещается
 * в одно число, что позволяет полностью воспроизводить последовательность.
 *
 * @param seed seed генератора; приводится к 32-битному беззнаковому числу
 * @returns функция без аргументов, возвращающая псевдослучайное число в `[0, 1)`
 *
 * @complexity O(1) на один вызов возвращённой функции
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/**
 * Возвращает случайное целое число в диапазоне `[min, max]` включительно.
 *
 * @param random источник случайности (обычно {@link createSeededRandom})
 * @param min нижняя граница диапазона (включительно)
 * @param max верхняя граница диапазона (включительно)
 * @returns целое число из диапазона
 * @throws Если `max < min`.
 *
 * @complexity O(1)
 */
export function randomInt(random: () => number, min: number, max: number): number {
  if (max < min) {
    throw new Error(`randomInt: max (${max}) must be greater than or equal to min (${min})`);
  }

  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Возвращает случайное дробное число в диапазоне `[min, max)`.
 *
 * @param random источник случайности
 * @param min нижняя граница диапазона (включительно)
 * @param max верхняя граница диапазона (не включается)
 * @returns дробное число из диапазона
 * @throws Если `max < min`.
 *
 * @complexity O(1)
 */
export function randomFloat(random: () => number, min: number, max: number): number {
  if (max < min) {
    throw new Error(`randomFloat: max (${max}) must be greater than or equal to min (${min})`);
  }

  return min + random() * (max - min);
}

/**
 * Возвращает seed для новой партии на основе `Math.random()`.
 *
 * Единственная функция модуля, результат которой не воспроизводим: она нужна
 * только для старта произвольной партии, а весь дальнейший расчёт идёт по seed.
 *
 * @returns целое неотрицательное число, пригодное как seed
 *
 * @complexity O(1)
 */
export function createRandomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}