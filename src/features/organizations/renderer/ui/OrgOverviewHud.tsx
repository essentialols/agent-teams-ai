import { useEffect, useMemo, useState } from 'react';

import { ChevronRight, Users } from 'lucide-react';

import type { OrganizationMapViewModel } from '../adapters/organizationMapViewModel';
import type { GraphGroupFrameScreenPlacement } from '@claude-teams/agent-graph';

interface OverviewCardPlacement {
  rootNodeId: string;
  left: number;
  top: number;
}

interface OrgOverviewHudProps {
  viewModel: OrganizationMapViewModel;
  getCameraZoom: () => number;
  getGroupFrameScreenPlacements: () => GraphGroupFrameScreenPlacement[];
  getViewportSize: () => { width: number; height: number };
  onSelectNode: (nodeId: string, reveal?: boolean) => void;
}

const OVERVIEW_MAX_ZOOM = 0.16;
const CARD_WIDTH = 238;
const CARD_HEIGHT = 154;

export function OrgOverviewHud({
  viewModel,
  getCameraZoom,
  getGroupFrameScreenPlacements,
  getViewportSize,
  onSelectNode,
}: Readonly<OrgOverviewHudProps>): React.JSX.Element | null {
  const [placements, setPlacements] = useState<OverviewCardPlacement[]>([]);
  const [hoveredRootNodeId, setHoveredRootNodeId] = useState<string | null>(null);
  const summariesByRootId = useMemo(
    () => new Map(viewModel.organizationOverviews.map((summary) => [summary.rootNodeId, summary])),
    [viewModel.organizationOverviews]
  );

  useEffect(() => {
    let animationFrame = 0;
    const update = (): void => {
      if (getCameraZoom() > OVERVIEW_MAX_ZOOM) {
        setPlacements((current) => (current.length === 0 ? current : []));
      } else {
        const viewport = getViewportSize();
        const frameOrder = getGroupFrameScreenPlacements()
          .filter(({ frame }) => frame.priority === 'primary' && summariesByRootId.has(frame.id))
          .sort(
            (left, right) =>
              left.bounds.top - right.bounds.top || left.bounds.left - right.bounds.left
          )
          .map(({ frame }) => frame.id);
        const remainingRootIds = [...summariesByRootId.keys()].filter(
          (rootNodeId) => !frameOrder.includes(rootNodeId)
        );
        const orderedRootIds = [...frameOrder, ...remainingRootIds];
        const columnCount = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(orderedRootIds.length))));
        const rowCount = Math.ceil(orderedRootIds.length / columnCount);
        const columnGap = 18;
        const rowGap = 18;
        const gridWidth = columnCount * CARD_WIDTH + (columnCount - 1) * columnGap;
        const gridHeight = rowCount * CARD_HEIGHT + (rowCount - 1) * rowGap;
        const startLeft = Math.max(16, (viewport.width - gridWidth) / 2);
        const startTop = Math.max(62, (viewport.height - gridHeight) / 2);
        const next = orderedRootIds.map((rootNodeId, index) => ({
          rootNodeId,
          left: Math.round(
            startLeft + (index % columnCount) * (CARD_WIDTH + columnGap) + CARD_WIDTH / 2
          ),
          top: Math.round(
            startTop + Math.floor(index / columnCount) * (CARD_HEIGHT + rowGap) + CARD_HEIGHT / 2
          ),
        }));
        setPlacements((current) =>
          JSON.stringify(current) === JSON.stringify(next) ? current : next
        );
      }
      animationFrame = window.requestAnimationFrame(update);
    };
    update();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [getCameraZoom, getGroupFrameScreenPlacements, getViewportSize, summariesByRootId]);

  if (placements.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {placements.map((placement) => {
        const summary = summariesByRootId.get(placement.rootNodeId);
        if (!summary) return null;
        const isDimmed = hoveredRootNodeId !== null && hoveredRootNodeId !== summary.rootNodeId;
        return (
          <article
            key={summary.organizationId}
            data-organization-overview-card={summary.organizationId}
            className={`pointer-events-auto absolute w-[238px] -translate-x-1/2 -translate-y-1/2 cursor-pointer overflow-hidden rounded-xl border bg-[rgba(7,14,29,0.97)] shadow-2xl shadow-black/35 backdrop-blur-xl transition-[opacity,transform,filter] duration-200 ${
              isDimmed ? 'opacity-60 saturate-50' : 'opacity-100 hover:scale-[1.015]'
            }`}
            style={{
              left: placement.left,
              top: placement.top,
              borderColor: `${summary.color}66`,
              boxShadow: `0 18px 50px rgba(0,0,0,.34), inset 3px 0 0 ${summary.color}`,
            }}
            onMouseEnter={() => setHoveredRootNodeId(summary.rootNodeId)}
            onMouseLeave={() => setHoveredRootNodeId(null)}
            onClick={() => onSelectNode(summary.rootNodeId, true)}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 pb-2.5 pt-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-50" title={summary.name}>
                  {summary.name}
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {summary.groupCount} групп · {summary.teamCount} команд · {summary.agentCount}{' '}
                  агентов
                </p>
              </div>
              <ChevronRight size={15} className="mt-0.5 shrink-0 text-sky-200/70" />
            </header>
            <div className="px-4 py-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-emerald-300">
                  {summary.activeTaskCount} активных задач
                </span>
                <span className={summary.attentionCount > 0 ? 'text-amber-300' : 'text-slate-400'}>
                  {summary.attentionCount} требуют внимания
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${summary.healthPercent}%`, backgroundColor: summary.color }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                <span>
                  {summary.onlineTeamCount}/{summary.teamCount} команд онлайн
                </span>
                <span>{summary.healthPercent}%</span>
              </div>
              <div className="mt-2 flex min-h-5 flex-wrap gap-1">
                {summary.largestGroups.map((group) => (
                  <button
                    key={group.nodeId}
                    type="button"
                    className="inline-flex max-w-[98px] items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.035] px-1.5 py-0.5 text-[9px] text-slate-300 transition-colors hover:border-sky-300/30 hover:bg-sky-400/10"
                    title={group.label}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectNode(group.nodeId, true);
                    }}
                  >
                    <Users size={9} className="shrink-0 text-sky-300/70" />
                    <span className="truncate">{group.label}</span>
                    <span className="text-slate-500">{group.teamCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
