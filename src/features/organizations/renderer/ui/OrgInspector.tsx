import { useAppTranslation } from '@features/localization/renderer';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Activity, ChevronDown, ChevronRight, ExternalLink, Network, Users, X } from 'lucide-react';

import { getNodeDisplayLabel } from '../adapters/organizationMapViewModel';

import type { OrganizationNodeDto } from '../../contracts';

interface OrgInspectorProps {
  node: OrganizationNodeDto | null;
  childCount: number;
  canToggleCollapse: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenTeam: (node: OrganizationNodeDto) => void;
  onOpenGraph: (node: OrganizationNodeDto) => void;
  onClose: () => void;
}

const INSPECTOR_PANEL_CLASS =
  'absolute bottom-0 right-0 top-0 z-30 w-80 max-w-[calc(100%-24px)] overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl';
const ALL_ORGANIZATIONS_ROOT_NODE_ID = 'org:__all-organizations__';

function renderStatusBadge(isOnline: boolean, label: string): React.JSX.Element {
  return (
    <Badge
      variant="outline"
      className={
        isOnline
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          : 'border-slate-500/40 bg-slate-500/10 text-slate-300'
      }
    >
      {label}
    </Badge>
  );
}

export const OrgInspector = ({
  node,
  childCount,
  canToggleCollapse,
  isCollapsed,
  onToggleCollapse,
  onOpenTeam,
  onOpenGraph,
  onClose,
}: OrgInspectorProps): React.JSX.Element | null => {
  const { t } = useAppTranslation('team');

  if (!node) {
    return null;
  }

  const nodeLabel =
    node.id === ALL_ORGANIZATIONS_ROOT_NODE_ID
      ? t('organizations.graph.canvas.allOrganizations')
      : node.tags?.includes('unassigned')
        ? t('organizations.graph.canvas.unassignedTeams')
        : getNodeDisplayLabel(node);
  const translatedTags =
    node.tags?.map((tag) => {
      if (tag === 'system') return t('organizations.inspector.tags.system');
      if (tag === 'unassigned') return t('organizations.inspector.tags.unassigned');
      return tag;
    }) ?? [];
  const nodeDescription =
    node.id === ALL_ORGANIZATIONS_ROOT_NODE_ID
      ? t('organizations.inspector.descriptions.allOrganizations')
      : node.tags?.includes('unassigned')
        ? t('organizations.inspector.descriptions.unassignedTeams')
        : node.description;

  if (!node.team) {
    const kindLabel =
      node.kind === 'container'
        ? t('organizations.inspector.kind.group')
        : t('organizations.inspector.kind.organization');
    const childCountLabel = t('organizations.inspector.childNodes', { count: childCount });
    return (
      <aside className={INSPECTOR_PANEL_CLASS}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Network size={15} className="shrink-0" />
            <span className="truncate">{nodeLabel}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="size-7 shrink-0 p-0"
            aria-label={t('organizations.inspector.closeSelection')}
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {kindLabel}
          </Badge>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {childCountLabel}
          </Badge>
        </div>
        {node.title ? (
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">{node.title}</div>
        ) : null}
        {translatedTags.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {translatedTags.map((tag) => (
              <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {nodeDescription ? (
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{nodeDescription}</p>
        ) : null}
        {canToggleCollapse ? (
          <Button size="sm" variant="outline" className="mt-4 h-8" onClick={onToggleCollapse}>
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            {isCollapsed
              ? t('organizations.inspector.actions.expand')
              : t('organizations.inspector.actions.collapse')}
          </Button>
        ) : null}
      </aside>
    );
  }

  const team = node.team;
  const activeAgents = team.agents.filter((agent) => agent.status === 'active');

  return (
    <aside className={INSPECTOR_PANEL_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--color-text)]">
            {getNodeDisplayLabel(node)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Users size={13} />
            <span>{t('organizations.inspector.agents', { count: team.memberCount })}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {renderStatusBadge(
            team.isOnline,
            team.isOnline
              ? t('organizations.inspector.status.online')
              : t('organizations.inspector.status.offline')
          )}
          <Button
            size="sm"
            variant="ghost"
            className="size-7 p-0"
            aria-label={t('organizations.inspector.closeSelection')}
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-2">
          <div className="font-semibold text-[var(--color-text)]">{team.taskCounts.inProgress}</div>
          <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
            {t('organizations.inspector.taskCounts.active')}
          </div>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-2">
          <div className="font-semibold text-[var(--color-text)]">{team.taskCounts.pending}</div>
          <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
            {t('organizations.inspector.taskCounts.pending')}
          </div>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-2">
          <div className="font-semibold text-[var(--color-text)]">{team.taskCounts.completed}</div>
          <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
            {t('organizations.inspector.taskCounts.done')}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" className="h-8 flex-1" onClick={() => onOpenTeam(node)}>
          <ExternalLink size={13} />
          {t('organizations.inspector.actions.open')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1"
          onClick={() => onOpenGraph(node)}
        >
          <Network size={13} />
          {t('organizations.inspector.actions.graph')}
        </Button>
      </div>

      {canToggleCollapse ? (
        <Button size="sm" variant="outline" className="mt-2 h-8 w-full" onClick={onToggleCollapse}>
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          {isCollapsed
            ? t('organizations.inspector.actions.expandSubtree')
            : t('organizations.inspector.actions.collapseSubtree')}
        </Button>
      ) : null}

      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]">
          <Activity size={13} />
          {t('organizations.inspector.inProgress')}
        </div>
        <div className="mt-2 space-y-2">
          {activeAgents.length === 0 ? (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
              {t('organizations.inspector.noActiveAgentTasks')}
            </div>
          ) : (
            activeAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-xs font-semibold text-[var(--color-text)]">
                    {agent.name}
                  </div>
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {agent.activeTaskCount}
                  </Badge>
                </div>
                <div className="mt-1 space-y-1">
                  {agent.currentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="line-clamp-2 text-[11px] leading-4 text-[var(--color-text-muted)]"
                      title={task.subject}
                    >
                      {task.subject}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
