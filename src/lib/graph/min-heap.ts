/**
 * Минимальная двоичная куча — структура данных для алгоритма Дейкстры.
 *
 * Это чистый модуль слоя `lib` (не React-компонент), поэтому здесь допустим
 * класс: он инкапсулирует изменяемый массив и не участвует в рендеринге.
 */

/** Элемент кучи: `key` — приоритет (меньше — раньше), `value` — полезная нагрузка. */
export interface HeapItem<T> {
  /** Приоритет элемента; извлекается элемент с минимальным ключом. */
  readonly key: number;
  /** Полезная нагрузка элемента. */
  readonly value: T;
}

/** Минимальная двоичная куча (binary min-heap). */
export class MinHeap<T> {
  private readonly items: HeapItem<T>[] = [];

  /**
   * Количество элементов в куче.
   *
   * @complexity O(1)
   */
  get size(): number {
    return this.items.length;
  }

  /**
   * Добавляет элемент в кучу.
   *
   * @param key приоритет элемента
   * @param value полезная нагрузка
   *
   * @complexity O(log n)
   */
  push(key: number, value: T): void {
    this.items.push({ key, value });
    this.siftUp(this.items.length - 1);
  }

  /**
   * Возвращает минимальный элемент, не удаляя его.
   *
   * @returns элемент с минимальным ключом либо `undefined` для пустой кучи
   *
   * @complexity O(1)
   */
  peek(): HeapItem<T> | undefined {
    return this.items[0];
  }

  /**
   * Извлекает элемент с минимальным ключом.
   *
   * @returns извлечённый элемент либо `undefined` для пустой кучи
   *
   * @complexity O(log n)
   */
  pop(): HeapItem<T> | undefined {
    const smallest = this.items[0];
    const last = this.items.pop();

    if (last === undefined || this.items.length === 0) {
      return smallest;
    }

    this.items[0] = last;
    this.siftDown(0);
    return smallest;
  }

  /**
   * Поднимает элемент к корню, пока он меньше родителя.
   *
   * @param index индекс элемента
   *
   * @complexity O(log n)
   */
  private siftUp(index: number): void {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (!this.isLighter(current, parent)) {
        return;
      }

      this.swap(current, parent);
      current = parent;
    }
  }

  /**
   * Опускает элемент вниз, пока он тяжелее любого из детей.
   *
   * @param index индекс элемента
   *
   * @complexity O(log n)
   */
  private siftDown(index: number): void {
    let current = index;

    for (;;) {
      const left = current * 2 + 1;
      const right = left + 1;
      let smallest = current;

      if (this.isLighter(left, smallest)) {
        smallest = left;
      }

      if (this.isLighter(right, smallest)) {
        smallest = right;
      }

      if (smallest === current) {
        return;
      }

      this.swap(current, smallest);
      current = smallest;
    }
  }

  /**
   * Сравнивает два элемента по ключу, безопасно обрабатывая выход за границы.
   *
   * @param left индекс первого элемента
   * @param right индекс второго элемента
   * @returns `true`, если элемент `left` существует и его ключ меньше
   *
   * @complexity O(1)
   */
  private isLighter(left: number, right: number): boolean {
    const leftItem = this.items[left];
    const rightItem = this.items[right];

    if (leftItem === undefined || rightItem === undefined) {
      return false;
    }

    return leftItem.key < rightItem.key;
  }

  /**
   * Меняет два элемента местами.
   *
   * @param left индекс первого элемента
   * @param right индекс второго элемента
   *
   * @complexity O(1)
   */
  private swap(left: number, right: number): void {
    const leftItem = this.items[left];
    const rightItem = this.items[right];

    if (leftItem === undefined || rightItem === undefined) {
      return;
    }

    this.items[left] = rightItem;
    this.items[right] = leftItem;
  }
}