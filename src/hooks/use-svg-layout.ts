import { useMemo } from 'react';
import type { Graph, NodeId } from '../lib/graph/types';

/** Координаты узла на SVG-полотне. */
export interface SvgPoint {
  readonly x: number;
  readonly y: number;
}

/** Раскладка графа для SVG-рендеринга. */
export interface SvgLayout {
  /** Ширина полотна в пикселях. */
  readonly width: number;
  /** Высота полотна в пикселях. */
  readonly height: number;
  /** Координаты узлов по их id. */
  readonly positions: ReadonlyMap<NodeId, SvgPoint>;
}

/**
 * Считает раскладку узлов графа для SVG-полотна.
 *
 * Координаты нормализуются так, чтобы узел с минимальными координатами оказался
 * на расстоянии `padding` от левого верхнего края, а полотно в точности вмещало
 * всю область графа с отступами по обе стороны.
 *
 * @param graph граф партии
 * @param padding внутренний отступ полотна в пикселях
 * @returns размеры полотна и координаты узлов
 *
 * @complexity O(V)
 */
export function useSvgLayout(graph: Graph, padding = 24): SvgLayout {
  return useMemo(() => createLayout(graph, padding), [graph, padding]);
}

/**
 * Вычисляет раскладку без обращения к React — чистый аналог {@link useSvgLayout}.
 *
 * @param graph граф партии
 * @param padding внутренний отступ полотна в пикселях
 * @returns размеры полотна и координаты узлов
 *
 * @complexity O(V)
 */
function createLayout(graph: Graph, padding: number): SvgLayout {
  const firstNode = graph.nodes[0];

  if (firstNode === undefined) {
    const emptySize = padding * 2;
    return { width: emptySize, height: emptySize, positions: new Map<NodeId, SvgPoint>() };
  }

  let minX = firstNode.x;
  let maxX = firstNode.x;
  let minY = firstNode.y;
  let maxY = firstNode.y;

  for (const node of graph.nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  }

  const positions = new Map<NodeId, SvgPoint>();

  for (const node of graph.nodes) {
    positions.set(node.id, { x: node.x - minX + padding, y: node.y - minY + padding });
  }

  return {
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    positions,
  };
}