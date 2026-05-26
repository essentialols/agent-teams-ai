export type DatabaseReadinessStatus = "disabled" | "ready" | "unavailable";

export type DatabaseReadinessReport = Readonly<{
  enabled: boolean;
  status: DatabaseReadinessStatus;
  migrationStatus: "not-checked";
  reasonCode?: string;
}>;

export interface DatabaseReadinessProbe {
  check(input?: { timeoutMs?: number }): Promise<DatabaseReadinessReport>;
}
