import { LocalFileRunEventProjectionStateStore, LocalFileRunEventStore, } from "@vioxen/subscription-runtime/store-local-file";
import { watchClaudeRuns, } from "@vioxen/subscription-runtime/worker-local";
import { RunEventProviderKind, RunObservationService, projectRunObservationEvents, projectRunReadModelsFromEvents, runEventProviderKindFromString, } from "@vioxen/subscription-runtime/worker-core";
import { CodexRunObservationAdapter } from "./codex-run-observation.js";
import { failedRunObservationSnapshot, observeOrphanCodexRun, summarizeRunObservationSnapshots, } from "./codex-goal-mcp-observation-projection.js";
import { booleanValue, numberValue, requiredRawString, stringValue, } from "./codex-goal-mcp-values.js";
import { jobIdsFromValue } from "./application/codex-goal-worker-control-view.js";
import { optionalRunEventProviderKind, registryRootFromArgs, runEventRetentionPolicyFromArgs, runEventRootFromArgs, runEventTypeFilter, } from "./codex-goal-mcp-inputs.js";
export async function watchAgentRuns(args) {
    const providerKindInput = stringValue(args.providerKind) ?? RunEventProviderKind.Codex;
    const providerKind = runEventProviderKindFromString(providerKindInput);
    if (providerKind === RunEventProviderKind.Claude) {
        const jobId = stringValue(args.jobId);
        const staleAfterMs = numberValue(args.staleAfterMs);
        const tailLines = numberValue(args.tailLines);
        const limit = numberValue(args.limit);
        return watchClaudeRuns({
            includeChangedFiles: booleanValue(args.includeChangedFiles) === true,
            includeLogTail: booleanValue(args.includeLogTail) === true,
            ...(args.stateRootDir === undefined ? {} : { stateRootDir: args.stateRootDir }),
            ...(args.runArtifactsRootDir === undefined
                ? {}
                : { runArtifactsRootDir: args.runArtifactsRootDir }),
            ...(jobId === undefined ? {} : { jobId }),
            ...(args.jobIds === undefined ? {} : { jobIds: args.jobIds }),
            ...(staleAfterMs === undefined ? {} : { staleAfterMs }),
            ...(tailLines === undefined ? {} : { tailLines }),
            ...(limit === undefined ? {} : { limit }),
        });
    }
    if (providerKind !== RunEventProviderKind.Codex) {
        return {
            ok: false,
            mode: "read_only",
            sideEffects: [],
            providerKind,
            supportedProviderKinds: [RunEventProviderKind.Codex, RunEventProviderKind.Claude],
            reason: "provider_observation_not_implemented",
            safeMessage: `Run observation for provider '${providerKindInput}' is not implemented yet. Watch did not start, stop, continue, recover or deliver work.`,
        };
    }
    const registryRootDir = registryRootFromArgs(args);
    const staleAfterMs = numberValue(args.staleAfterMs);
    const tailLines = numberValue(args.tailLines);
    const adapter = new CodexRunObservationAdapter({
        registryRootDir,
        ...(args.cwd ? { cwd: args.cwd } : {}),
        ...(staleAfterMs === undefined ? {} : { staleAfterMs }),
        ...(tailLines === undefined ? {} : { tailLines }),
    });
    const service = new RunObservationService(adapter);
    const explicitJobIds = [
        ...(stringValue(args.jobId) ? [stringValue(args.jobId)] : []),
        ...jobIdsFromValue(args.jobIds),
    ];
    const limit = numberValue(args.limit);
    const listedRunIds = explicitJobIds.length
        ? explicitJobIds
        : await service.listRunIds();
    const runIds = limit === undefined
        ? listedRunIds
        : listedRunIds.slice(0, limit);
    const snapshots = await Promise.all(runIds.map(async (runId) => {
        try {
            return await service.observeRun({
                runId,
                ...(tailLines === undefined ? {} : { tailLines }),
                includeChangedFiles: booleanValue(args.includeChangedFiles) === true,
                includeLogTail: booleanValue(args.includeLogTail) === true,
            });
        }
        catch (error) {
            const orphan = await observeOrphanCodexRun({
                runId,
                error,
                args,
                providerKind,
                staleAfterMs: staleAfterMs ?? 10 * 60_000,
                tailLines: tailLines ?? 20,
            });
            if (orphan)
                return orphan;
            return failedRunObservationSnapshot({
                runId,
                providerKind,
                error,
            });
        }
    }));
    const observationFailures = snapshots
        .filter((snapshot) => snapshot.warnings.some((warning) => warning.code === "run_observation_failed"))
        .map((snapshot) => ({
        runId: snapshot.runId,
        warnings: snapshot.warnings.filter((warning) => warning.code === "run_observation_failed"),
    }));
    return {
        ok: observationFailures.length === 0,
        mode: "read_only",
        sideEffects: [],
        providerKind: "codex",
        registryRootDir,
        totalRuns: listedRunIds.length,
        returnedRuns: snapshots.length,
        truncated: limit === undefined ? false : listedRunIds.length > runIds.length,
        summary: summarizeRunObservationSnapshots(snapshots),
        ...(observationFailures.length ? { observationFailures } : {}),
        snapshots,
    };
}
export async function readAgentRunEvents(args) {
    const registryRootDir = registryRootFromArgs(args);
    const eventRootDir = runEventRootFromArgs(args, registryRootDir);
    const providerKind = optionalRunEventProviderKind(args.providerKind);
    const eventStore = new LocalFileRunEventStore({ rootDir: eventRootDir });
    const result = await eventStore.read({
        ...(stringValue(args.cursor) === undefined
            ? {}
            : { cursor: { value: stringValue(args.cursor) } }),
        ...(stringValue(args.jobId) === undefined
            ? {}
            : { runId: stringValue(args.jobId) }),
        ...(numberValue(args.limit) === undefined
            ? {}
            : { limit: numberValue(args.limit) }),
        ...(providerKind === undefined ? {} : { sourceProviderKind: providerKind }),
        ...runEventTypeFilter(args),
    });
    return {
        ok: result.warnings.length === 0,
        mode: "read_only",
        sideEffects: [],
        providerKind: providerKind ?? "all",
        registryRootDir,
        eventRootDir,
        returnedEvents: result.events.length,
        nextCursor: result.nextCursor?.value,
        warnings: result.warnings,
        events: result.events,
    };
}
export async function readAgentRunState(args) {
    const registryRootDir = registryRootFromArgs(args);
    const eventRootDir = runEventRootFromArgs(args, registryRootDir);
    const providerKind = optionalRunEventProviderKind(args.providerKind);
    const runId = requiredRawString(args.jobId, "jobId");
    const stateStore = new LocalFileRunEventProjectionStateStore({
        rootDir: eventRootDir,
    });
    const state = await stateStore.readProjectionState(runId);
    if (state === null) {
        const eventStore = new LocalFileRunEventStore({ rootDir: eventRootDir });
        const read = await eventStore.read({ runId });
        const replayed = projectRunReadModelsFromEvents(read.events);
        if (replayed !== null &&
            (providerKind === undefined || replayed.providerKind === providerKind)) {
            return {
                ok: read.warnings.length === 0,
                mode: "read_only_state",
                sideEffects: [],
                providerKind: replayed.providerKind,
                registryRootDir,
                eventRootDir,
                runId,
                observedAt: replayed.observedAt,
                replayOnly: true,
                warnings: read.warnings,
                readModels: replayed,
            };
        }
        return {
            ok: false,
            mode: "read_only_state",
            sideEffects: [],
            providerKind: providerKind ?? "all",
            registryRootDir,
            eventRootDir,
            runId,
            reason: "projection_state_not_found",
            safeMessage: "No projected run state exists yet and no replayable run events were found. Run agent_run_project_events first to observe and project this run.",
        };
    }
    if (providerKind !== undefined && state.providerKind !== providerKind) {
        return {
            ok: false,
            mode: "read_only_state",
            sideEffects: [],
            providerKind,
            registryRootDir,
            eventRootDir,
            runId,
            reason: "projection_state_provider_mismatch",
            safeMessage: "Projected run state exists for a different provider. No worker action was taken.",
        };
    }
    return {
        ok: true,
        mode: "read_only_state",
        sideEffects: [],
        providerKind: state.providerKind,
        registryRootDir,
        eventRootDir,
        runId,
        observedAt: state.observedAt,
        status: state.status,
        liveness: state.liveness,
        readModels: state.readModels,
        state,
    };
}
export async function planAgentRunEventCompaction(args) {
    const registryRootDir = registryRootFromArgs(args);
    const eventRootDir = runEventRootFromArgs(args, registryRootDir);
    const eventStore = new LocalFileRunEventStore({ rootDir: eventRootDir });
    const policy = runEventRetentionPolicyFromArgs(args);
    const plan = await eventStore.planCompaction(policy);
    return {
        ok: plan.warnings.length === 0,
        mode: "compaction_plan",
        sideEffects: [],
        registryRootDir,
        eventRootDir,
        policy,
        plan,
    };
}
export async function compactAgentRunEvents(args) {
    const registryRootDir = registryRootFromArgs(args);
    const eventRootDir = runEventRootFromArgs(args, registryRootDir);
    const policy = runEventRetentionPolicyFromArgs(args);
    if (booleanValue(args.confirmCompact) !== true) {
        const eventStore = new LocalFileRunEventStore({ rootDir: eventRootDir });
        const plan = await eventStore.planCompaction(policy);
        return {
            ok: false,
            mode: "compact_events",
            sideEffects: [],
            registryRootDir,
            eventRootDir,
            policy,
            reason: "confirm_compact_required",
            safeMessage: "Compaction rewrites the local event log. Re-run with confirmCompact=true after reviewing the plan.",
            plan,
        };
    }
    const eventStore = new LocalFileRunEventStore({ rootDir: eventRootDir });
    const result = await eventStore.compact(policy);
    return {
        ok: result.warnings.length === 0 &&
            result.cursorRewrites.every((rewrite) => !rewrite.invalidatedUnreadEvents),
        mode: "compact_events",
        sideEffects: ["rewrite_run_event_log", "rewrite_delivery_cursors"],
        registryRootDir,
        eventRootDir,
        policy,
        result,
    };
}
export async function projectAgentRunEvents(args) {
    const providerKind = optionalRunEventProviderKind(args.providerKind) ??
        RunEventProviderKind.Codex;
    if (providerKind !== RunEventProviderKind.Codex &&
        providerKind !== RunEventProviderKind.Claude) {
        return {
            ok: false,
            mode: "project_events",
            sideEffects: [],
            providerKind,
            supportedProviderKinds: [RunEventProviderKind.Codex, RunEventProviderKind.Claude],
            reason: "provider_event_projection_not_implemented",
            safeMessage: `Run event projection for provider '${providerKind}' is not implemented yet. Projection did not start, stop, continue, recover or deliver work.`,
        };
    }
    const registryRootDir = registryRootFromArgs(args);
    const eventRootDir = runEventRootFromArgs(args, registryRootDir);
    const watch = await watchAgentRuns({
        ...args,
        providerKind,
        includeChangedFiles: booleanValue(args.includeChangedFiles) === true,
        includeLogTail: false,
    });
    const snapshots = Array.isArray(watch.snapshots)
        ? watch.snapshots
        : [];
    const eventStore = new LocalFileRunEventStore({ rootDir: eventRootDir });
    const stateStore = new LocalFileRunEventProjectionStateStore({
        rootDir: eventRootDir,
    });
    const projectedRuns = [];
    let appendedCount = 0;
    let skippedDuplicateCount = 0;
    for (const snapshot of snapshots) {
        const previousState = await stateStore.readProjectionState(snapshot.runId);
        const projection = projectRunObservationEvents({
            snapshot,
            previousState,
            ...(stringValue(args.hostId) === undefined
                ? {}
                : { hostId: stringValue(args.hostId) }),
            registryRootDir,
        });
        const appendResult = await eventStore.append(projection.events);
        await stateStore.writeProjectionState(projection.nextState);
        appendedCount += appendResult.appendedCount;
        skippedDuplicateCount += appendResult.skippedDuplicateCount;
        projectedRuns.push({
            runId: snapshot.runId,
            projectedEvents: projection.events.length,
            appendedEvents: appendResult.appendedCount,
            skippedDuplicateEvents: appendResult.skippedDuplicateCount,
            eventTypes: projection.events.map((event) => event.type),
            decision: snapshot.readOnlyDecision.kind,
            status: snapshot.status,
            readModels: projection.nextState.readModels,
        });
    }
    const projectedRunIds = snapshots.map((snapshot) => snapshot.runId);
    const readBack = await eventStore.read({
        runIds: projectedRunIds,
        sourceProviderKind: providerKind,
        sourceRegistryRootDir: registryRootDir,
        ...(numberValue(args.limit) === undefined
            ? {}
            : { limit: numberValue(args.limit) }),
        ...runEventTypeFilter(args),
    });
    return {
        ok: watch.ok === true && readBack.warnings.length === 0,
        mode: "project_events",
        sideEffects: ["append_run_events", "write_projection_state"],
        providerKind,
        registryRootDir,
        eventRootDir,
        totalRuns: watch.totalRuns,
        returnedRuns: snapshots.length,
        appendedCount,
        skippedDuplicateCount,
        warnings: readBack.warnings,
        projectedRuns,
        nextCursor: readBack.nextCursor?.value,
        events: readBack.events,
    };
}
//# sourceMappingURL=codex-goal-mcp-run-events.js.map