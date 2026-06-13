#!/usr/bin/env node
export type AgentTaskCliIo = {
    readStdin(): Promise<string>;
    writeStdout(chunk: string): void;
    writeStderr(chunk: string): void;
    cwd(): string;
};
export declare function runAgentTaskCli(argv?: string[], io?: AgentTaskCliIo): Promise<number>;
//# sourceMappingURL=cli.d.ts.map