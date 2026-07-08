/// <reference types="node" />
export type ProjectControllerGuidanceSignal = {
    readonly signal: {
        readonly createdAt: Date;
        readonly createdBy: string;
        readonly priority: string;
        readonly body: string;
    };
};
export declare function projectControllerPendingGuidancePromptContext(input: {
    readonly pendingCount: number;
    readonly deliverableSignals: readonly ProjectControllerGuidanceSignal[];
}): string | undefined;
//# sourceMappingURL=codex-goal-project-controller-guidance.d.ts.map