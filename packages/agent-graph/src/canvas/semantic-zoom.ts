import type { GraphNode } from '../ports/types';

export type GraphSemanticZoomLevel = 'overview' | 'summary' | 'detail';

export const GRAPH_SEMANTIC_ZOOM = {
  summaryMin: 0.24,
  detailMin: 0.62,
} as const;

export function getGraphSemanticZoomLevel(zoom: number): GraphSemanticZoomLevel {
  if (zoom < GRAPH_SEMANTIC_ZOOM.summaryMin) return 'overview';
  if (zoom < GRAPH_SEMANTIC_ZOOM.detailMin) return 'summary';
  return 'detail';
}

export function shouldRenderOverviewHierarchyNode(
  node: GraphNode,
  zoom: number,
  isEmphasized = false
): boolean {
  if (isEmphasized) return true;
  if (node.visualVariant === 'team') return false;

  const depth = Math.max(0, node.hierarchyDepth ?? 0);
  if (zoom < 0.09) return node.visualVariant === 'organization' && depth === 0;
  if (zoom < 0.17) return node.visualVariant === 'organization' && depth <= 1;
  return node.visualVariant === 'organization' || depth <= 2;
}

export function shouldRenderTaskAtZoom(zoom: number, isEmphasized = false): boolean {
  return isEmphasized || getGraphSemanticZoomLevel(zoom) === 'detail';
}
