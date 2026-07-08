export function codexGoalStatusInputFromLaunch(launch) {
    return {
        jobRootDir: launch.config.jobRootDir,
        taskId: launch.config.taskId,
        ...(launch.config.outputPath ? { resultPath: launch.config.outputPath } : {}),
        workspacePath: launch.config.workspacePath,
        ...(launch.tmuxSession ? { tmuxSession: launch.tmuxSession } : {}),
        logPath: launch.logPath,
        ...(launch.config.progressPath ? { progressPath: launch.config.progressPath } : {}),
        ...(launch.config.accessBoundary === undefined
            ? {}
            : { accessBoundary: launch.config.accessBoundary }),
    };
}
//# sourceMappingURL=codex-goal-status-input.js.map