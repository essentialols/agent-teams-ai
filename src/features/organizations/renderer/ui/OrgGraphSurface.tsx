import { useEffect, useMemo, useState } from 'react';

import { GraphView } from '@claude-teams/agent-graph';
import { useAppTranslation } from '@features/localization/renderer';
import { Plus } from 'lucide-react';

import {
  buildOrganizationGraphData,
  getOrganizationNodeIdFromGraphRef,
} from '../adapters/organizationGraphData';
import { getOrganizationIdForNodeId } from '../adapters/organizationMapViewModel';

import type { OrganizationPlacementSelection } from '../../contracts';
import type { OrganizationMapViewModel } from '../adapters/organizationMapViewModel';
import type {
  GraphDomainRef,
  GraphEdge,
  GraphEventPort,
  GraphGroupFrameScreenPlacement,
  GraphLayoutMode,
  GraphNode,
} from '@claude-teams/agent-graph';

type OrganizationRelationViewMode = 'structure' | 'relations' | 'explorer';

interface OrgGraphSurfaceProps {
  viewModel: OrganizationMapViewModel;
  isActive: boolean;
  collapsedNodeIds: ReadonlySet<string>;
  layoutMode: GraphLayoutMode;
  selectedNodeId: string | null;
  showSelectedTeamDetails?: boolean;
  onLayoutModeChange: (mode: GraphLayoutMode) => void;
  onSelectNode: (nodeId: string | null) => void;
  onToggleNodeCollapse: (nodeId: string) => void;
  onCreateTeamHere?: (placement: OrganizationPlacementSelection) => void;
}

interface GroupCreateButton {
  frameId: string;
  label: string;
  left: number;
  top: number;
  placement: OrganizationPlacementSelection;
}

interface RelationOverlayLink {
  id: string;
  path: string;
  label: string | null;
  labelWidth: number;
  labelX: number;
  labelY: number;
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
  arrow: boolean;
}

const MIN_CREATE_BUTTON_FRAME_WIDTH = 112;
const MIN_CREATE_BUTTON_FRAME_HEIGHT = 60;
const RELATION_EDGE_TYPES = new Set<GraphEdge['type']>(['blocking', 'related', 'message']);
const ALL_ORGANIZATIONS_ROOT_NODE_ID = 'org:__all-organizations__';
const RELATION_OVERLAY_ENDPOINT_MARGIN = 36;

function isRelationEdge(edge: GraphEdge): boolean {
  return RELATION_EDGE_TYPES.has(edge.type);
}

function getRelationFocusParticleColor(edge: GraphEdge): string {
  if (edge.type === 'blocking') {
    return edge.color ?? '#f59e0b';
  }
  if (edge.type === 'message') {
    return edge.color ?? '#8fd3ff';
  }
  return edge.color ?? '#38bdf8';
}

function getRelationOverlayStroke(edge: GraphEdge): string {
  return edge.color ?? getRelationFocusParticleColor(edge);
}

function getRelationOverlayWidth(edge: GraphEdge): number {
  if (edge.type === 'blocking') return 2.2;
  if (edge.type === 'message') return 1.8;
  return 1.6;
}

function getRelationOverlayLabel(edge: GraphEdge): string | null {
  if (edge.type === 'blocking') return 'depends';
  if (edge.type === 'message') {
    return edge.aggregateCount && edge.aggregateCount > 1 ? `messages ${edge.aggregateCount}` : null;
  }
  return null;
}

function getRelationOverlayLabelWidth(label: string | null): number {
  if (!label) {
    return 0;
  }
  return Math.max(54, Math.min(116, label.length * 7 + 20));
}

function isRelationExplorerAvailable(selectedNodeId: string | null): selectedNodeId is string {
  return selectedNodeId !== null && selectedNodeId !== ALL_ORGANIZATIONS_ROOT_NODE_ID;
}

function isPointNearViewport(
  point: { x: number; y: number },
  viewport: { width: number; height: number }
): boolean {
  return (
    point.x >= -RELATION_OVERLAY_ENDPOINT_MARGIN &&
    point.y >= -RELATION_OVERLAY_ENDPOINT_MARGIN &&
    point.x <= viewport.width + RELATION_OVERLAY_ENDPOINT_MARGIN &&
    point.y <= viewport.height + RELATION_OVERLAY_ENDPOINT_MARGIN
  );
}

function areRelationOverlayLinksEqual(
  leftLinks: readonly RelationOverlayLink[],
  rightLinks: readonly RelationOverlayLink[]
): boolean {
  if (leftLinks.length !== rightLinks.length) {
    return false;
  }

  return leftLinks.every((left, index) => {
    const right = rightLinks[index];
    return (
      right !== undefined &&
      left.id === right.id &&
      left.path === right.path &&
      left.label === right.label &&
      left.labelWidth === right.labelWidth &&
      left.labelX === right.labelX &&
      left.labelY === right.labelY &&
      left.stroke === right.stroke &&
      left.strokeWidth === right.strokeWidth &&
      left.dashArray === right.dashArray &&
      left.arrow === right.arrow
    );
  });
}

function collectDescendantTeamNodeIds(
  viewModel: OrganizationMapViewModel,
  nodeId: string,
  seen = new Set<string>()
): string[] {
  if (seen.has(nodeId)) {
    return [];
  }
  seen.add(nodeId);

  const node = viewModel.nodeById.get(nodeId);
  if (node?.kind === 'team') {
    return [node.id];
  }

  return (viewModel.childNodeIdsByParentId.get(nodeId) ?? []).flatMap((childNodeId) =>
    collectDescendantTeamNodeIds(viewModel, childNodeId, seen)
  );
}

function buildRelationsFocus(
  mode: OrganizationRelationViewMode,
  graphData: ReturnType<typeof buildOrganizationGraphData>,
  viewModel: OrganizationMapViewModel,
  selectedNodeId: string | null
): { focusNodeIds: ReadonlySet<string> | null; focusEdgeIds: ReadonlySet<string> | null } {
  if (mode === 'structure') {
    return { focusNodeIds: null, focusEdgeIds: null };
  }

  const relationEdges = graphData.edges.filter(isRelationEdge);
  if (relationEdges.length === 0) {
    return { focusNodeIds: null, focusEdgeIds: null };
  }

  if (mode === 'relations') {
    return {
      focusNodeIds: new Set(relationEdges.flatMap((edge) => [edge.source, edge.target])),
      focusEdgeIds: new Set(relationEdges.map((edge) => edge.id)),
    };
  }

  if (!isRelationExplorerAvailable(selectedNodeId)) {
    return {
      focusNodeIds: new Set(),
      focusEdgeIds: new Set(),
    };
  }

  const selectedTeamNodeIds = new Set(collectDescendantTeamNodeIds(viewModel, selectedNodeId));
  const focusedEdges = relationEdges.filter(
    (edge) => selectedTeamNodeIds.has(edge.source) || selectedTeamNodeIds.has(edge.target)
  );
  if (focusedEdges.length === 0) {
    return {
      focusNodeIds: new Set([selectedNodeId, ...selectedTeamNodeIds]),
      focusEdgeIds: new Set(),
    };
  }

  return {
    focusNodeIds: new Set([
      selectedNodeId,
      ...selectedTeamNodeIds,
      ...focusedEdges.flatMap((edge) => [edge.source, edge.target]),
    ]),
    focusEdgeIds: new Set(focusedEdges.map((edge) => edge.id)),
  };
}

function buildRelationModeGraphData(
  mode: OrganizationRelationViewMode,
  graphData: ReturnType<typeof buildOrganizationGraphData>,
  focusNodeIds: ReadonlySet<string> | null,
  focusEdgeIds: ReadonlySet<string> | null
): ReturnType<typeof buildOrganizationGraphData> {
  if (mode === 'structure') {
    return graphData;
  }

  const relationEdgeIds = new Set(graphData.edges.filter(isRelationEdge).map((edge) => edge.id));
  const visibleRelationEdgeIds =
    mode === 'explorer' ? (focusEdgeIds ?? new Set<string>()) : relationEdgeIds;
  const relationNodeIds = new Set(
    graphData.edges
      .filter((edge) => visibleRelationEdgeIds.has(edge.id))
      .flatMap((edge) => [edge.source, edge.target])
  );
  const visibleNodeIds = new Set<string>([
    ...relationNodeIds,
    ...(mode === 'explorer' ? (focusNodeIds ?? []) : []),
  ]);
  const visibleGraphNodes = graphData.nodes.filter(
    (node) => node.layoutOnly || (node.kind === 'member' && visibleNodeIds.has(node.id))
  );
  const visibleGraphNodeIds = new Set(visibleGraphNodes.map((node) => node.id));
  const groupFrames = (graphData.groupFrames ?? [])
    .map((frame) => ({
      ...frame,
      nodeIds: frame.nodeIds.filter((nodeId) => visibleGraphNodeIds.has(nodeId)),
    }))
    .filter((frame) => frame.nodeIds.length > 0);
  const layout = graphData.layout
    ? {
        ...graphData.layout,
        showTasks: false,
        ownerOrder: graphData.layout.ownerOrder.filter((nodeId) => visibleGraphNodeIds.has(nodeId)),
        slotAssignments: Object.fromEntries(
          Object.entries(graphData.layout.slotAssignments).filter(([nodeId]) =>
            visibleGraphNodeIds.has(nodeId)
          )
        ),
      }
    : undefined;

  return {
    ...graphData,
    groupFrames,
    nodes: visibleGraphNodes,
    edges: graphData.edges.filter((edge) => visibleRelationEdgeIds.has(edge.id)),
    particles: graphData.particles.filter((particle) => visibleRelationEdgeIds.has(particle.edgeId)),
    layout,
  };
}

function getCreateTeamFrameId(
  viewModel: OrganizationMapViewModel,
  selectedNodeId: string | null
): string | null {
  if (!selectedNodeId) {
    return null;
  }

  let candidateId: string | undefined = selectedNodeId;
  const selectedNode = viewModel.nodeById.get(selectedNodeId);
  if (selectedNode?.kind === 'team') {
    candidateId = viewModel.parentNodeIdByChildId.get(selectedNodeId);
  }

  while (candidateId) {
    if (resolveCreateTeamPlacement(viewModel, candidateId)) {
      return candidateId;
    }
    candidateId = viewModel.parentNodeIdByChildId.get(candidateId);
  }

  return null;
}

function resolveCreateTeamPlacement(
  viewModel: OrganizationMapViewModel,
  frameId: string
): OrganizationPlacementSelection | null {
  const node = viewModel.nodeById.get(frameId);
  if (!node || node.kind === 'team' || !node.structureUnitId) {
    return null;
  }

  const organizationId = getOrganizationIdForNodeId(viewModel, frameId);
  if (!organizationId) {
    return null;
  }

  return {
    organizationId,
    parentUnitId: node.structureUnitId,
  };
}

function areCreateButtonsEqual(
  leftButtons: readonly GroupCreateButton[],
  rightButtons: readonly GroupCreateButton[]
): boolean {
  if (leftButtons.length !== rightButtons.length) {
    return false;
  }

  return leftButtons.every((left, index) => {
    const right = rightButtons[index];
    return (
      right !== undefined &&
      left.frameId === right.frameId &&
      left.left === right.left &&
      left.top === right.top &&
      left.label === right.label &&
      left.placement.organizationId === right.placement.organizationId &&
      left.placement.parentUnitId === right.placement.parentUnitId
    );
  });
}

const OrgRelationLinksHud = ({
  isActive,
  mode,
  edges,
  getNodeWorldPosition,
  worldToScreen,
  getViewportSize,
}: {
  isActive: boolean;
  mode: OrganizationRelationViewMode;
  edges: readonly GraphEdge[];
  getNodeWorldPosition: (nodeId: string) => { x: number; y: number } | null;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  getViewportSize: () => { width: number; height: number };
}): React.JSX.Element | null => {
  const [links, setLinks] = useState<RelationOverlayLink[]>([]);

  useEffect(() => {
    if (!isActive || mode === 'structure' || edges.length === 0) {
      setLinks([]);
      return undefined;
    }

    let frameId = 0;
    const update = (): void => {
      const viewport = getViewportSize();
      const nextLinks = edges.flatMap((edge): RelationOverlayLink[] => {
        const source = getNodeWorldPosition(edge.source);
        const target = getNodeWorldPosition(edge.target);
        if (!source || !target) {
          return [];
        }

        const start = worldToScreen(source.x, source.y);
        const end = worldToScreen(target.x, target.y);
        if (!isPointNearViewport(start, viewport) || !isPointNearViewport(end, viewport)) {
          return [];
        }

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const curve = Math.min(Math.max(distance * 0.08, 16), 54);
        const normalX = -dy / distance;
        const normalY = dx / distance;
        const cp1 = {
          x: start.x + dx * 0.34 + normalX * curve,
          y: start.y + dy * 0.34 + normalY * curve,
        };
        const cp2 = {
          x: start.x + dx * 0.66 + normalX * curve,
          y: start.y + dy * 0.66 + normalY * curve,
        };
        const label = getRelationOverlayLabel(edge);
        const labelX = Math.round((start.x + 3 * cp1.x + 3 * cp2.x + end.x) / 8);
        const labelY = Math.round((start.y + 3 * cp1.y + 3 * cp2.y + end.y) / 8);

        return [
          {
            id: edge.id,
            path: [
              `M ${Math.round(start.x)} ${Math.round(start.y)}`,
              `C ${Math.round(cp1.x)} ${Math.round(cp1.y)}`,
              `${Math.round(cp2.x)} ${Math.round(cp2.y)}`,
              `${Math.round(end.x)} ${Math.round(end.y)}`,
            ].join(' '),
            label,
            labelWidth: getRelationOverlayLabelWidth(label),
            labelX,
            labelY,
            stroke: getRelationOverlayStroke(edge),
            strokeWidth: getRelationOverlayWidth(edge),
            dashArray: edge.type === 'related' ? '7 6' : undefined,
            arrow: edge.type === 'blocking',
          },
        ];
      });

      setLinks((current) =>
        areRelationOverlayLinksEqual(current, nextLinks) ? current : nextLinks
      );
      frameId = window.requestAnimationFrame(update);
    };

    update();
    return () => window.cancelAnimationFrame(frameId);
  }, [edges, getNodeWorldPosition, getViewportSize, isActive, mode, worldToScreen]);

  if (mode === 'structure' || links.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 size-full"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <defs>
        <marker
          id="org-relation-dependency-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="5.8"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#f59e0b" fillOpacity="0.88" />
        </marker>
      </defs>
      {links.map((link) => (
        <g key={link.id}>
          <path
            d={link.path}
            fill="none"
            stroke={link.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.18"
            strokeWidth={link.strokeWidth + 3}
          />
          <path
            d={link.path}
            fill="none"
            stroke={link.stroke}
            strokeDasharray={link.dashArray}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.74"
            strokeWidth={link.strokeWidth}
            markerEnd={link.arrow ? 'url(#org-relation-dependency-arrow)' : undefined}
          />
          {link.label ? (
            <g transform={`translate(${link.labelX} ${link.labelY})`}>
              <rect
                x={-link.labelWidth / 2}
                y="-11"
                width={link.labelWidth}
                height="22"
                rx="5"
                fill="rgba(7, 11, 22, 0.84)"
                stroke={link.stroke}
                strokeOpacity="0.5"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#e5f6ff"
                fontFamily="monospace"
                fontSize="10"
                fontWeight="700"
              >
                {link.label}
              </text>
            </g>
          ) : null}
        </g>
      ))}
    </svg>
  );
};

const OrgRelationLegendHud = ({
  mode,
}: {
  mode: OrganizationRelationViewMode;
}): React.JSX.Element | null => {
  if (mode === 'structure') {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[var(--color-text-muted)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
      {[
        ['#f59e0b', 'depends'],
        ['#22c55e', 'delegates'],
        ['#38bdf8', 'observes'],
        ['#94a3b8', 'communicates'],
        ['#8b9cff', 'messages'],
      ].map(([color, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="h-px w-5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
};

const OrgGroupFrameCreateHud = ({
  viewModel,
  isActive,
  targetFrameId,
  getGroupFrameScreenPlacements,
  getViewportSize,
  onCreateTeamHere,
  getCreateTeamLabel,
}: {
  viewModel: OrganizationMapViewModel;
  isActive: boolean;
  targetFrameId: string | null;
  getGroupFrameScreenPlacements: () => GraphGroupFrameScreenPlacement[];
  getViewportSize: () => { width: number; height: number };
  onCreateTeamHere: (placement: OrganizationPlacementSelection) => void;
  getCreateTeamLabel: (label: string) => string;
}): React.JSX.Element => {
  const [buttons, setButtons] = useState<GroupCreateButton[]>([]);

  useEffect(() => {
    if (!isActive || !targetFrameId) {
      setButtons([]);
      return undefined;
    }

    let frameId = 0;
    const update = (): void => {
      const viewport = getViewportSize();
      const nextButtons = getGroupFrameScreenPlacements().flatMap((placement) => {
        const { bounds, frame } = placement;
        if (frame.id !== targetFrameId) {
          return [];
        }
        if (
          bounds.width < MIN_CREATE_BUTTON_FRAME_WIDTH ||
          bounds.height < MIN_CREATE_BUTTON_FRAME_HEIGHT ||
          bounds.right < 0 ||
          bounds.bottom < 0 ||
          bounds.left > viewport.width ||
          bounds.top > viewport.height
        ) {
          return [];
        }

        const createPlacement = resolveCreateTeamPlacement(viewModel, frame.id);
        if (!createPlacement) {
          return [];
        }

        return [
          {
            frameId: frame.id,
            label: frame.label,
            left: Math.round(
              Math.min(Math.max(bounds.left + 12, bounds.right - 40), viewport.width - 40)
            ),
            top: Math.round(Math.max(bounds.top + 12, 8)),
            placement: createPlacement,
          },
        ];
      });

      setButtons((current) =>
        areCreateButtonsEqual(current, nextButtons) ? current : nextButtons
      );
      frameId = window.requestAnimationFrame(update);
    };

    update();
    return () => window.cancelAnimationFrame(frameId);
  }, [getGroupFrameScreenPlacements, getViewportSize, isActive, targetFrameId, viewModel]);

  return (
    <>
      {buttons.map((button) => (
        <button
          key={button.frameId}
          type="button"
          aria-label={getCreateTeamLabel(button.label)}
          title={getCreateTeamLabel(button.label)}
          data-organization-map-create-team-frame-id={button.frameId}
          className="pointer-events-auto absolute flex size-7 items-center justify-center rounded-md border border-sky-300/45 bg-[var(--color-surface-overlay)] text-sky-100 shadow-lg shadow-black/30 backdrop-blur-sm transition-colors hover:border-sky-200 hover:bg-sky-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          style={{ left: button.left, top: button.top }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCreateTeamHere(button.placement);
          }}
        >
          <Plus size={15} />
        </button>
      ))}
    </>
  );
};

function renderNodeOverlay({ node }: { node: GraphNode }): React.JSX.Element | null {
  if (node.kind === 'lead' || node.kind === 'member') {
    return null;
  }

  return (
    <div className="w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-3 text-xs shadow-xl">
      <div className="font-semibold text-[var(--color-text)]">{node.label}</div>
      {node.sublabel ? (
        <div className="mt-1 line-clamp-3 text-[var(--color-text-muted)]">{node.sublabel}</div>
      ) : null}
    </div>
  );
}

function renderEdgeOverlay(
  {
    edge,
    sourceNode,
    targetNode,
    onClose,
  }: {
    edge: GraphEdge;
    sourceNode: GraphNode | undefined;
    targetNode: GraphNode | undefined;
    onClose: () => void;
  },
  text: {
    runtimeMessages: string;
    manualRelation: string;
    close: string;
    messages: (count: number) => string;
    weight: (count: number) => string;
  }
): React.JSX.Element {
  const isMessageEdge = edge.type === 'message';
  return (
    <div className="w-72 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-3 text-xs shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-[var(--color-text)]">
            {isMessageEdge ? text.runtimeMessages : text.manualRelation}
          </div>
          <div className="mt-1 truncate text-[var(--color-text-muted)]">
            {sourceNode?.label ?? edge.source}
            {' -> '}
            {targetNode?.label ?? edge.target}
          </div>
        </div>
        <button
          type="button"
          aria-label={text.close}
          className="rounded-sm px-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
          onClick={onClose}
        >
          x
        </button>
      </div>
      {edge.label ? (
        <div className="mt-2 line-clamp-4 text-[var(--color-text-muted)]">{edge.label}</div>
      ) : null}
      {edge.aggregateCount ? (
        <div className="mt-2 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          {isMessageEdge ? text.messages(edge.aggregateCount) : text.weight(edge.aggregateCount)}
        </div>
      ) : null}
    </div>
  );
}

export const OrgGraphSurface = ({
  viewModel,
  isActive,
  collapsedNodeIds,
  layoutMode,
  selectedNodeId,
  showSelectedTeamDetails = true,
  onLayoutModeChange,
  onSelectNode,
  onToggleNodeCollapse,
  onCreateTeamHere,
}: OrgGraphSurfaceProps): React.JSX.Element => {
  const { t } = useAppTranslation('team');
  const [relationViewMode, setRelationViewMode] =
    useState<OrganizationRelationViewMode>('structure');
  const canExploreRelations = isRelationExplorerAvailable(selectedNodeId);
  useEffect(() => {
    if (relationViewMode === 'explorer' && !canExploreRelations) {
      setRelationViewMode('relations');
    }
  }, [canExploreRelations, relationViewMode]);
  const edgeOverlayText = useMemo(
    () => ({
      runtimeMessages: t('organizations.graph.edgeOverlay.runtimeMessages'),
      manualRelation: t('organizations.graph.edgeOverlay.manualRelation'),
      close: t('organizations.graph.edgeOverlay.close'),
      messages: (count: number) => t('organizations.graph.edgeOverlay.messages', { count }),
      weight: (count: number) => t('organizations.graph.edgeOverlay.weight', { count }),
    }),
    [t]
  );
  const graphText = useMemo(
    () => ({
      organizationMap: t('organizations.graph.canvas.organizationMap'),
      allOrganizations: t('organizations.graph.canvas.allOrganizations'),
      unassignedTeams: t('organizations.graph.canvas.unassignedTeams'),
      agents: (count: number) => t('organizations.graph.canvas.agents', { count }),
      activeAgents: (count: number) => t('organizations.graph.canvas.activeAgents', { count }),
      teams: (count: number) => t('organizations.graph.canvas.teams', { count }),
      orgsAndTeams: (orgCount: number, teamCount: number) =>
        t('organizations.graph.canvas.orgsAndTeams', { orgCount, teamCount }),
      teamRole: (memberCount: number, activeCount: number) =>
        t('organizations.graph.canvas.teamRole', { memberCount, activeCount }),
      teamReference: t('organizations.graph.canvas.teamReference'),
      notFound: t('organizations.graph.canvas.notFound'),
      online: t('organizations.graph.canvas.online'),
      offline: t('organizations.graph.canvas.offline'),
      agentStatus: (status: 'active' | 'idle' | 'offline' | 'unknown') => {
        if (status === 'active') {
          return t('organizations.graph.canvas.agentStatus.active');
        }
        if (status === 'offline') {
          return t('organizations.graph.canvas.agentStatus.offline');
        }
        if (status === 'unknown') {
          return t('organizations.graph.canvas.agentStatus.unknown');
        }
        return t('organizations.graph.canvas.agentStatus.idle');
      },
    }),
    [t]
  );
  const graphData = useMemo(
    () =>
      buildOrganizationGraphData(viewModel, {
        collapsedNodeIds,
        layoutMode,
        selectedNodeId,
        showSelectedTeamDetails,
        text: graphText,
      }),
    [collapsedNodeIds, graphText, layoutMode, selectedNodeId, showSelectedTeamDetails, viewModel]
  );
  const relationFocus = useMemo(
    () => buildRelationsFocus(relationViewMode, graphData, viewModel, selectedNodeId),
    [graphData, relationViewMode, selectedNodeId, viewModel]
  );
  const displayedGraphData = useMemo(
    () =>
      buildRelationModeGraphData(
        relationViewMode,
        graphData,
        relationFocus.focusNodeIds,
        relationFocus.focusEdgeIds
      ),
    [graphData, relationFocus.focusEdgeIds, relationFocus.focusNodeIds, relationViewMode]
  );
  const relationToolbar = useMemo(
    () => (
      <div className="mx-auto flex max-w-full flex-col items-center gap-1">
        <div className="inline-flex max-w-full items-center rounded-lg border border-sky-300/15 bg-[var(--color-surface-overlay)] p-0.5 text-[11px] font-medium shadow-lg shadow-black/20 backdrop-blur-md">
          {(
            [
              ['structure', 'Structure'],
              ['relations', 'Relations'],
              ['explorer', 'Explorer'],
            ] as const
          ).map(([mode, label]) => {
            const active = relationViewMode === mode;
            const disabled = mode === 'explorer' && !canExploreRelations;
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                className={`h-6 rounded-md px-2.5 transition-colors ${
                  active
                    ? 'bg-sky-400/18 text-sky-100 shadow-sm shadow-sky-500/10'
                    : disabled
                      ? 'cursor-not-allowed text-[var(--color-text-muted)] opacity-40'
                      : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                }`}
                onClick={() => {
                  if (!disabled) {
                    setRelationViewMode(mode);
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    ),
    [canExploreRelations, relationViewMode]
  );
  const createTeamFrameId = useMemo(
    () => getCreateTeamFrameId(viewModel, selectedNodeId),
    [selectedNodeId, viewModel]
  );
  const events = useMemo<GraphEventPort>(
    () => ({
      onNodeClick: (ref: GraphDomainRef) => {
        onSelectNode(getOrganizationNodeIdFromGraphRef(viewModel, ref));
      },
      onNodeDoubleClick: (ref: GraphDomainRef) => {
        onSelectNode(getOrganizationNodeIdFromGraphRef(viewModel, ref));
      },
      onGroupFrameClick: (frame) => {
        onSelectNode(frame.id);
      },
      onGroupFrameDoubleClick: (frame) => {
        onToggleNodeCollapse(frame.id);
      },
      onEdgeClick: () => {
        onSelectNode(null);
      },
      onBackgroundClick: () => onSelectNode(null),
    }),
    [onSelectNode, onToggleNodeCollapse, viewModel]
  );

  return (
    <GraphView
      data={displayedGraphData}
      events={events}
      className="size-full"
      suspendAnimation={!isActive}
      isSurfaceActive={isActive}
      config={{
        animationEnabled: true,
        showActivity: false,
        showLogs: false,
        showProcesses: false,
        showTasks: relationViewMode === 'structure',
        showEdges: true,
        showEdgeLabels: false,
        showHexGrid: false,
        showStarField: false,
        showSpaceEffects: false,
        bloomIntensity: 0.25,
      }}
      onLayoutModeChange={onLayoutModeChange}
      focusNodeIds={relationFocus.focusNodeIds}
      focusEdgeIds={relationFocus.focusEdgeIds}
      renderTopToolbarContent={() => relationToolbar}
      renderOverlay={renderNodeOverlay}
      renderEdgeOverlay={(overlayProps) => renderEdgeOverlay(overlayProps, edgeOverlayText)}
      renderHud={({
        getGroupFrameScreenPlacements,
        getNodeWorldPosition,
        getViewportSize,
        worldToScreen,
      }) => (
        <>
          <OrgRelationLinksHud
            isActive={isActive}
            mode={relationViewMode}
            edges={displayedGraphData.edges}
            getNodeWorldPosition={getNodeWorldPosition}
            worldToScreen={worldToScreen}
            getViewportSize={getViewportSize}
          />
          <OrgRelationLegendHud mode={relationViewMode} />
          {onCreateTeamHere ? (
            <OrgGroupFrameCreateHud
              viewModel={viewModel}
              isActive={isActive}
              targetFrameId={createTeamFrameId}
              getGroupFrameScreenPlacements={getGroupFrameScreenPlacements}
              getViewportSize={getViewportSize}
              onCreateTeamHere={onCreateTeamHere}
              getCreateTeamLabel={(label) =>
                t('organizations.graph.actions.createTeamIn', { label })
              }
            />
          ) : null}
        </>
      )}
    />
  );
};
